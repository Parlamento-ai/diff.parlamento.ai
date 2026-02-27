/**
 * Vote matcher — finds Congreso vote data for a BOE modifying law.
 *
 * Given a BOE ID and a date hint (from the pipeline timeline), searches
 * Congreso Open Data for the corresponding plenary vote.
 *
 * Matching strategy (in order):
 *   1. Parse initiative groups from the HTML (expediente-based, most accurate)
 *   2. Match keywords against group TITLES (not individual vote texts)
 *   3. Select vote type based on rango (orgánica → conjunto, ordinaria → dictamen)
 *   4. Validate rango consistency (prevents cross-contamination)
 *   5. Fallback: keyword matching on all JSONs + rango validation (for old HTML)
 */
import { fetchMetadata } from './boe-api.js';
import { parseMetadata } from './boe-parser.js';
import {
	getLegislatura,
	fetchVotePage,
	findFinalVoteFromUrls,
	findVoteInGroup,
	htmlContainsKeywords,
	extractKeywords,
	getVoteTypeLabel
} from './congreso-api.js';
import type { CongresoVote, InitiativeGroup } from './congreso-api.js';

export interface VoteMatch {
	date: string; // YYYY-MM-DD
	result: 'approved' | 'rejected';
	source: string; // URL congreso
	expediente: string; // e.g. "121/000007" — traceability
	voteType: string; // "Votación de conjunto" / "Dictamen" / etc.
	for: Array<{ name: string; group: string }>;
	against: Array<{ name: string; group: string }>;
	abstain: Array<{ name: string; group: string }>;
}

/** Normalize text for comparison (lowercase, strip accents) */
function normalize(s: string): string {
	return s
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');
}

/** Skip BOE IDs that don't go through Congress vote */
function shouldSkip(titulo: string, rango: string): boolean {
	const t = normalize(titulo);
	const r = normalize(rango);
	if (t.includes('sentencia') || t.includes('stc')) return true;
	if (r.includes('real decreto') && !r.includes('legislativo') && !r.includes('ley')) return true;
	if (t.includes('correccion de error') || t.includes('correcion de error')) return true;
	if (r.includes('circular')) return true;
	return false;
}

/**
 * Validate that the vote type is consistent with the law's rango.
 * Prevents false positives like matching a "votación de conjunto" (orgánica only)
 * to an ordinary law.
 */
function isRangoConsistent(vote: CongresoVote, rango: string): boolean {
	const sub = normalize(vote.tituloSubGrupo);
	// Check both tituloSubGrupo and textoExpediente for "conjunto" (some votes have it only in textoExpediente)
	const isConjunto = sub.includes('conjunto') ||
		(!vote.tituloSubGrupo.trim() && normalize(vote.textoExpediente).includes('votacion de conjunto'));
	const isOrganica = normalize(rango).includes('organica');

	// Orgánica must have "votación de conjunto"
	if (isOrganica && !isConjunto) return false;
	// Ordinary law must NOT have "votación de conjunto" (that's for orgánicas)
	if (!isOrganica && isConjunto) return false;

	return true;
}

/**
 * Busca el voto de aprobacion para una ley modificadora.
 *
 * @param boeId - BOE ID of the modifying law (e.g. "BOE-A-2020-17264")
 * @param dateHint - Timeline date (fechaVigencia) to start searching backwards from
 */
export async function findVoteForLaw(boeId: string, dateHint?: string): Promise<VoteMatch | null> {
	// 1. Fetch BOE metadata (needed for title to match against Congreso)
	const metaXml = await fetchMetadata(boeId);
	const meta = parseMetadata(metaXml);

	if (shouldSkip(meta.titulo, meta.rango)) return null;

	// 2. Determine legislatura and search start date
	const startDate = dateHint || meta.fechaDisposicion;
	const legislatura = getLegislatura(meta.fechaDisposicion);
	if (!legislatura) return null;

	const keywords = extractKeywords(meta.titulo);
	if (keywords.length === 0) return null;

	// 3. Search for plenary vote — structured approach with fallback
	const result = await searchForVoteStructured(legislatura, startDate, keywords, meta.rango);
	if (!result) return null;

	// 4. Convert to VoteMatch
	const { vote, expediente } = result;
	const voteResult: 'approved' | 'rejected' =
		vote.totales.afavor > vote.totales.enContra ? 'approved' : 'rejected';

	const dateParts = vote.date.split('/');
	const voteDate =
		dateParts.length === 3
			? `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`
			: startDate;

	return {
		date: voteDate,
		result: voteResult,
		source: `https://www.congreso.es/es/opendata/votaciones`,
		expediente,
		voteType: getVoteTypeLabel(vote),
		for: vote.votaciones
			.filter((v) => v.voto === 'Sí')
			.map((v) => ({ name: v.diputado, group: v.grupo })),
		against: vote.votaciones
			.filter((v) => v.voto === 'No')
			.map((v) => ({ name: v.diputado, group: v.grupo })),
		abstain: vote.votaciones
			.filter((v) => v.voto === 'Abstención')
			.map((v) => ({ name: v.diputado, group: v.grupo }))
	};
}

/**
 * Find Congreso vote data by expediente (direct match, no keywords).
 *
 * Used by the tramitación pipeline where we already know the expediente.
 * Searches Tue/Thu plenary dates backwards from dateHint.
 *
 * @param expediente - e.g. "121/000036"
 * @param dateHint - YYYY-MM-DD date to start searching backwards from
 * @param titulo - optional law title, used to detect "Orgánica" for rango
 */
export async function findVoteByExpediente(
	expediente: string,
	dateHint: string,
	titulo?: string
): Promise<VoteMatch | null> {
	const legislatura = getLegislatura(dateHint);
	if (!legislatura) return null;

	// Strip /0000 suffix — Congreso Open Data uses "121/000004/0000" but vote pages use "121/000004"
	const cleanExp = expediente.replace(/\/0000$/, '');

	// Determine rango from title (default: ordinaria)
	const rango = titulo && normalize(titulo).includes('organica') ? 'orgánica' : 'ordinaria';

	const start = new Date(dateHint);
	const MAX_DAYS = 90;

	// Generate candidate plenary dates (Tue/Thu)
	const candidates: string[] = [];
	for (let dayOffset = 0; dayOffset <= MAX_DAYS; dayOffset++) {
		const d = new Date(start);
		d.setDate(d.getDate() - dayOffset);
		const dayOfWeek = d.getUTCDay();
		if (dayOffset === 0 || dayOfWeek === 2 || dayOfWeek === 4) {
			candidates.push(d.toISOString().slice(0, 10));
		}
	}

	// Fetch HTML pages in parallel batches of 5
	const BATCH = 5;
	for (let i = 0; i < candidates.length; i += BATCH) {
		const batch = candidates.slice(i, i + BATCH);
		const pages = await Promise.all(
			batch.map((date) => fetchVotePage(legislatura, date).then((p) => ({ date, page: p })))
		);

		for (const { date, page } of pages) {
			if (!page) continue;
			if (page.groups.length === 0) continue;

			// Direct expediente match — much more reliable than keywords
			const group = page.groups.find((g) => g.expediente === cleanExp);
			if (!group) continue;

			console.log(`      Fecha del pleno: ${date} — expediente ${group.expediente} (${group.jsonUrls.length} votos)`);

			const vote = await findVoteInGroup(group.jsonUrls, rango);
			if (!vote) continue;

			// Convert Congreso date format DD/MM/YYYY → YYYY-MM-DD
			const dateParts = vote.date.split('/');
			const voteDate =
				dateParts.length === 3
					? `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`
					: date;

			const voteResult: 'approved' | 'rejected' =
				vote.totales.afavor > vote.totales.enContra ? 'approved' : 'rejected';

			return {
				date: voteDate,
				result: voteResult,
				source: `https://www.congreso.es/es/opendata/votaciones`,
				expediente: group.expediente,
				voteType: getVoteTypeLabel(vote),
				for: vote.votaciones
					.filter((v) => v.voto === 'Sí')
					.map((v) => ({ name: v.diputado, group: v.grupo })),
				against: vote.votaciones
					.filter((v) => v.voto === 'No')
					.map((v) => ({ name: v.diputado, group: v.grupo })),
				abstain: vote.votaciones
					.filter((v) => v.voto === 'Abstención')
					.map((v) => ({ name: v.diputado, group: v.grupo }))
			};
		}
	}

	return null;
}

interface StructuredResult {
	vote: CongresoVote;
	expediente: string;
}

/**
 * Search backwards from startDate using structured group matching.
 *
 * Strategy:
 *   1. Generate candidate dates (Tue/Thu only, up to 90 days back)
 *   2. Fetch HTML pages in parallel batches of 5
 *   3. Check HTML text for keywords — skip dates where the law isn't mentioned
 *   4. Parse initiative groups from the HTML
 *   5. Match keywords against group TITLES (not individual vote JSONs)
 *   6. Download only the JSONs from the matched group
 *   7. Select vote type based on rango (orgánica vs ordinaria)
 *   8. Validate rango consistency
 *   9. Fallback: keyword matching on all JSONs if no groups found
 */
async function searchForVoteStructured(
	legislatura: string,
	startDate: string,
	keywords: string[],
	rango: string
): Promise<StructuredResult | null> {
	const start = new Date(startDate);
	const MAX_DAYS = 90;

	// Generate candidate dates: the start date + all Tue/Thu going back
	const candidates: string[] = [];
	for (let dayOffset = 0; dayOffset <= MAX_DAYS; dayOffset++) {
		const d = new Date(start);
		d.setDate(d.getDate() - dayOffset);
		const dayOfWeek = d.getUTCDay();
		if (dayOffset === 0 || dayOfWeek === 2 || dayOfWeek === 4) {
			candidates.push(d.toISOString().slice(0, 10));
		}
	}

	// Fetch HTML pages in parallel batches of 5, check for keywords
	const BATCH = 5;
	for (let i = 0; i < candidates.length; i += BATCH) {
		const batch = candidates.slice(i, i + BATCH);
		const pages = await Promise.all(
			batch.map((date) => fetchVotePage(legislatura, date).then((p) => ({ date, page: p })))
		);

		for (const { date, page } of pages) {
			if (!page) continue;

			// Fast pre-filter: check if HTML mentions our law
			if (!htmlContainsKeywords(page.html, keywords)) continue;

			console.log(`      Fecha del pleno: ${date} (${page.urls.length} votaciones, ${page.groups.length} grupos)`);

			// Try structured matching via initiative groups first
			if (page.groups.length > 0) {
				const groupResult = await matchViaGroups(page.groups, keywords, rango);
				if (groupResult) return groupResult;
			}

			// Fallback: old-style keyword matching on all JSONs + rango validation
			const vote = await findFinalVoteFromUrls(page.urls, keywords);
			if (vote && isRangoConsistent(vote, rango)) {
				return { vote, expediente: '' };
			}
		}
	}

	return null;
}

/**
 * Try to match the law against parsed initiative groups.
 * Returns the first group whose title matches our keywords + rango validation passes.
 */
async function matchViaGroups(
	groups: InitiativeGroup[],
	keywords: string[],
	rango: string
): Promise<StructuredResult | null> {
	for (const group of groups) {
		const normalizedTitle = normalize(group.title);

		// Check if this group's title matches our law keywords
		if (!keywords.every((kw) => normalizedTitle.includes(kw))) continue;

		console.log(`        Grupo: ${group.expediente} — "${group.title.slice(0, 80)}..." (${group.jsonUrls.length} votos)`);

		// Download only this group's JSONs and find the right vote type
		const vote = await findVoteInGroup(group.jsonUrls, rango);
		if (!vote) continue;

		// Validate rango consistency
		if (!isRangoConsistent(vote, rango)) {
			console.log(`        Descartado: rango inconsistente (${vote.tituloSubGrupo} vs ${rango})`);
			continue;
		}

		return { vote, expediente: group.expediente };
	}

	return null;
}
