/**
 * Vote matcher — finds Congreso vote data for a BOE modifying law.
 *
 * Given a BOE ID and a date hint (from the pipeline timeline), searches
 * Congreso Open Data for the corresponding plenary vote.
 *
 * Optimized:
 *  - Uses timeline date as starting point (no redundant BOE fetch for date)
 *  - Fetches HTML pages for multiple dates in parallel
 *  - Pre-filters by checking HTML text for keywords BEFORE downloading JSONs
 *  - Only downloads JSONs for the date that actually contains the law
 */
import { fetchMetadata } from './boe-api.js';
import { parseMetadata } from './boe-parser.js';
import {
	getLegislatura,
	fetchVotePage,
	findFinalVoteFromUrls,
	htmlContainsKeywords,
	extractKeywords
} from './congreso-api.js';
import type { CongresoVote } from './congreso-api.js';

export interface VoteMatch {
	date: string; // YYYY-MM-DD
	result: 'approved' | 'rejected';
	source: string; // URL congreso
	for: Array<{ name: string; group: string }>;
	against: Array<{ name: string; group: string }>;
	abstain: Array<{ name: string; group: string }>;
}

/** Skip BOE IDs that don't go through Congress vote */
function shouldSkip(titulo: string, rango: string): boolean {
	const t = titulo.toLowerCase();
	const r = rango.toLowerCase();
	if (t.includes('sentencia') || t.includes('stc')) return true;
	if (r.includes('real decreto') && !r.includes('legislativo') && !r.includes('ley')) return true;
	if (t.includes('corrección de error')) return true;
	return false;
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

	// 3. Search for plenary vote — fast parallel approach
	const vote = await searchForVote(legislatura, startDate, keywords);
	if (!vote) return null;

	// 4. Convert to VoteMatch
	const result: 'approved' | 'rejected' =
		vote.totales.afavor > vote.totales.enContra ? 'approved' : 'rejected';

	const dateParts = vote.date.split('/');
	const voteDate =
		dateParts.length === 3
			? `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`
			: startDate;

	return {
		date: voteDate,
		result,
		source: `https://www.congreso.es/es/opendata/votaciones`,
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
 * Search backwards from startDate to find the plenary date.
 *
 * Strategy:
 *   1. Generate candidate dates (Tue/Thu only, up to 90 days back)
 *   2. Fetch HTML pages in parallel batches of 5
 *   3. Check HTML text for keywords — skip dates where the law isn't mentioned
 *   4. Only download JSONs for matching dates (typically just 1 date)
 */
async function searchForVote(
	legislatura: string,
	startDate: string,
	keywords: string[]
): Promise<CongresoVote | null> {
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

			// This date mentions our law — download JSONs and find the exact vote
			console.log(`      Fecha del pleno: ${date} (${page.urls.length} votaciones)`);
			const vote = await findFinalVoteFromUrls(page.urls, keywords);
			if (vote) return vote;
		}
	}

	return null;
}
