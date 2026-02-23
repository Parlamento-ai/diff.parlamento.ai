/**
 * Phase 1: Discover procedure data from EP Open Data + CELLAR SPARQL
 *
 * Takes a procedure code (e.g., "2020/0374(COD)") and auto-discovers
 * all CELEX numbers, vote data, dates, and generates a DiscoveredConfig.
 */
import type { DiscoveredConfig } from '../types.js';
import { fetchJson, sparqlQuery, EP_API } from '../lib/http.js';
import { parseProcedure, slugify } from '../lib/helpers.js';

/**
 * Discover all CELEX numbers via CELLAR SPARQL.
 * Uses owl:sameAs + UNION paths to find: proposals, final acts,
 * EP positions and consolidated versions.
 */
async function discoverCelexFromSparql(
	year: string,
	num: string
): Promise<{
	billCelex: string | null;
	finalCelex: string | null;
	epPositionCelex: string | null;
	allCelex: { celex: string; source: string; date: string | null; title: string | null }[];
}> {
	const numStripped = num.replace(/^0+/, '');
	const procUri = `http://publications.europa.eu/resource/procedure/${year}_${numStripped}`;

	const query = `
PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>

SELECT DISTINCT ?celex ?title ?date ?source WHERE {
  ?dossier owl:sameAs <${procUri}> .

  {
    ?work cdm:work_part_of_dossier ?dossier .
    BIND("dossier" AS ?source)
  } UNION {
    ?proposal cdm:work_part_of_dossier ?dossier .
    ?work cdm:resource_legal_adopts_resource_legal ?proposal .
    BIND("adopts" AS ?source)
  } UNION {
    ?proposal cdm:work_part_of_dossier ?dossier .
    ?adopting cdm:resource_legal_adopts_resource_legal ?proposal .
    ?work cdm:work_is_another_publication_of_work ?adopting .
    BIND("consolidated" AS ?source)
  } UNION {
    ?proposal cdm:work_part_of_dossier ?dossier .
    ?work cdm:resource_legal_contains_ep_opinion_on_resource_legal ?proposal .
    BIND("ep_opinion" AS ?source)
  }

  ?work cdm:resource_legal_id_celex ?celex .
  OPTIONAL { ?work cdm:work_date_document ?date }
  OPTIONAL {
    ?exp cdm:expression_belongs_to_work ?work .
    ?exp cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/ENG> .
    ?exp cdm:expression_title ?title .
  }
} ORDER BY ?date LIMIT 100`;

	try {
		const result = await sparqlQuery(query);
		const bindings: any[] = result?.results?.bindings ?? [];

		const allCelex = bindings
			.map((b: any) => ({
				celex: b.celex?.value ?? '',
				source: b.source?.value ?? '',
				date: b.date?.value ?? null,
				title: b.title?.value ?? null
			}))
			.filter((r) => r.celex);

		const bills = allCelex.filter((r) => /^5\d{4}PC\d/.test(r.celex));
		const finals = allCelex.filter(
			(r) => r.source === 'adopts' && /^3\d{4}[RLD]\d/.test(r.celex)
		);
		const epPositions = allCelex.filter((r) => /^5\d{4}AP\d/.test(r.celex));
		return {
			billCelex: bills[0]?.celex ?? null,
			finalCelex: finals[0]?.celex ?? null,
			epPositionCelex: epPositions[0]?.celex ?? null,
			allCelex
		};
	} catch (e: any) {
		console.log(`        SPARQL query failed: ${e.message}`);
		return { billCelex: null, finalCelex: null, epPositionCelex: null, allCelex: [] };
	}
}

/**
 * Extract TA reference (e.g., "TA-9-2023-0266") from EP Open Data procedure events.
 */
function extractTaReference(events: any[]): string | null {
	const eventsStr = JSON.stringify(events);
	const taMatch = eventsStr.match(/TA-\d+-\d{4}-\d{4}/);
	return taMatch ? taMatch[0] : null;
}

/**
 * Extract committee report reference (e.g., "A-9-2023-0188") from EP procedure events.
 */
function extractReportReference(events: any[], voteDate: string | null): string | null {
	if (!voteDate) return null;
	for (const ev of events) {
		const type = ev.had_activity_type ?? '';
		const date = ev.activity_date ?? '';
		if (date === voteDate && type.includes('PLENARY_VOTE_RESULTS')) {
			const evStr = JSON.stringify(ev);
			const match = evStr.match(/A-9-(\d{4})-(\d{4})/);
			if (match) return match[0];
		}
	}
	for (const ev of events) {
		const date = ev.activity_date ?? '';
		const type = ev.had_activity_type ?? '';
		if (date === voteDate && type.includes('PLENARY')) {
			const evStr = JSON.stringify(ev);
			const match = evStr.match(/A-9-(\d{4})-(\d{4})/);
			if (match) return match[0];
		}
	}
	return null;
}

/**
 * Fetch procedure details from EP Open Data API.
 */
async function discoverFromEpOpenData(apiProcId: string): Promise<{
	title: string;
	events: any[];
	voteDate: string | null;
	comDate: string | null;
	pubDate: string | null;
}> {
	const url = `${EP_API}/api/v2/procedures/${apiProcId}?format=application%2Fld%2Bjson`;
	const data = await fetchJson(url);
	const proc = data?.data?.[0];
	if (!proc) throw new Error(`Procedure ${apiProcId} not found in EP Open Data`);

	const title: string = proc.process_title?.en ?? proc.label ?? `Procedure ${apiProcId}`;
	const events: any[] = proc.consists_of ?? [];

	events.sort((a: any, b: any) => (a.activity_date ?? '').localeCompare(b.activity_date ?? ''));

	let voteDate: string | null = null;
	let comDate: string | null = null;
	let pubDate: string | null = null;

	for (const ev of events) {
		const type = ev.had_activity_type ?? '';
		const date = ev.activity_date ?? '';
		if (type.includes('PLENARY_AMEND_PROPOSAL') && !voteDate) voteDate = date;
		if (type.includes('COMMISSION_PROPOSAL') || type.includes('ANPRO'))
			comDate = comDate ?? date;
		if (type.includes('PUBLICATION_OFFICIAL_JOURNAL')) pubDate = date;
	}

	if (!voteDate) {
		const voteEvents = events.filter((e: any) =>
			(e.had_activity_type ?? '').includes('PLENARY_VOTE')
		);
		if (voteEvents.length > 0) {
			voteDate = voteEvents[voteEvents.length - 1].activity_date;
		}
	}

	return { title, events, voteDate, comDate, pubDate };
}

/**
 * Fetch vote counts from EP Open Data meetings API.
 */
async function discoverVoteCounts(
	voteDate: string,
	titleKeywords?: string,
	reportRef?: string | null
): Promise<{
	voteFor: number;
	voteAgainst: number;
	voteAbstain: number;
	totalDecisions: number;
}> {
	const meetingId = `MTG-PL-${voteDate}`;
	const url = `${EP_API}/api/v2/meetings/${meetingId}/decisions?format=application%2Fld%2Bjson&offset=0&limit=500`;

	try {
		const data = await fetchJson(url);
		const decisions: any[] = data?.data ?? [];

		let voteFor = 0,
			voteAgainst = 0,
			voteAbstain = 0;

		// Strategy 1: Match by report reference
		if (reportRef) {
			const m = reportRef.match(/A-9-(\d{4})-(\d{4})/);
			if (m) {
				const labelPattern = `a9-${m[2]}/${m[1]}`;
				const refPattern = reportRef.toLowerCase();

				let bestFavor = 0;
				for (const d of decisions) {
					const favor = d.number_of_votes_favor ?? 0;
					const against = d.number_of_votes_against ?? 0;
					if (favor <= against) continue;

					const label = (d.activity_label?.en ?? '').toLowerCase();
					const realizationOf = JSON.stringify(
						d.decided_on_a_realization_of ?? ''
					).toLowerCase();

					if (label.includes(labelPattern) || realizationOf.includes(refPattern)) {
						if (favor > bestFavor) {
							bestFavor = favor;
							voteFor = favor;
							voteAgainst = against;
							voteAbstain = d.number_of_votes_abstention ?? 0;
						}
					}
				}
				if (bestFavor > 0) {
					return { voteFor, voteAgainst, voteAbstain, totalDecisions: decisions.length };
				}
			}
		}

		// Strategy 2: Match by title keywords
		const keywords = titleKeywords
			? titleKeywords
					.toLowerCase()
					.replace(/[^a-z0-9\s]/g, '')
					.split(/\s+/)
					.filter((w) => w.length > 3)
			: [];

		if (keywords.length > 0) {
			type Candidate = { favor: number; against: number; abstain: number; score: number };
			const candidates: Candidate[] = [];

			for (const d of decisions) {
				const favor = d.number_of_votes_favor ?? 0;
				const against = d.number_of_votes_against ?? 0;
				const abstain = d.number_of_votes_abstention ?? 0;
				if (favor + against + abstain === 0) continue;

				const label = (
					(d.activity_label?.en ?? '') +
					' ' +
					(d.reference ?? '')
				).toLowerCase();
				const score = keywords.filter((kw) => label.includes(kw)).length;
				if (score > 0) {
					candidates.push({ favor, against, abstain, score });
				}
			}

			candidates.sort((a, b) => {
				const aAdopted = a.favor > a.against ? 1 : 0;
				const bAdopted = b.favor > b.against ? 1 : 0;
				if (bAdopted !== aAdopted) return bAdopted - aAdopted;
				if (b.score !== a.score) return b.score - a.score;
				return b.favor - a.favor;
			});

			if (candidates.length > 0 && candidates[0].favor > candidates[0].against) {
				voteFor = candidates[0].favor;
				voteAgainst = candidates[0].against;
				voteAbstain = candidates[0].abstain;
				return { voteFor, voteAgainst, voteAbstain, totalDecisions: decisions.length };
			}
		}

		// Strategy 3: Fallback — adopted decision with highest favor
		for (const d of decisions) {
			const favor = d.number_of_votes_favor ?? 0;
			const against = d.number_of_votes_against ?? 0;
			const abstain = d.number_of_votes_abstention ?? 0;
			if (favor > against && favor > voteFor) {
				voteFor = favor;
				voteAgainst = against;
				voteAbstain = abstain;
			}
		}

		return { voteFor, voteAgainst, voteAbstain, totalDecisions: decisions.length };
	} catch {
		return { voteFor: 0, voteAgainst: 0, voteAbstain: 0, totalDecisions: 0 };
	}
}

/**
 * Full auto-discovery: procedure ID → all config data.
 */
export async function discover(procedureCode: string): Promise<DiscoveredConfig> {
	const proc = parseProcedure(procedureCode);
	if (!proc)
		throw new Error(`Invalid procedure format: ${procedureCode}. Expected: YYYY/NNNN(COD)`);

	console.log(`\n  Discovering: ${procedureCode}`);
	console.log(`  ─────────────────────────────────────`);

	// Step 1: EP Open Data
	console.log(`  [1/4] EP Open Data procedure...`);
	const epData = await discoverFromEpOpenData(proc.apiId);
	const taReference = extractTaReference(epData.events);
	const reportRef = extractReportReference(epData.events, epData.voteDate);
	console.log(`        Title: ${epData.title}`);
	console.log(`        Events: ${epData.events.length}`);
	console.log(`        Vote date: ${epData.voteDate ?? 'NOT FOUND'}`);
	console.log(`        COM date: ${epData.comDate ?? 'NOT FOUND'}`);
	console.log(`        OJ pub date: ${epData.pubDate ?? 'NOT FOUND'}`);
	console.log(`        TA reference: ${taReference ?? 'NOT FOUND'}`);
	console.log(`        Report ref: ${reportRef ?? 'NOT FOUND'}`);

	// Step 2: CELLAR SPARQL → CELEX numbers
	console.log(`  [2/4] CELLAR SPARQL → CELEX...`);
	const sparql = await discoverCelexFromSparql(proc.year, proc.num);
	console.log(`        Bill CELEX: ${sparql.billCelex ?? 'NOT FOUND'}`);
	console.log(`        Final CELEX: ${sparql.finalCelex ?? 'NOT FOUND'}`);
	console.log(`        EP position: ${sparql.epPositionCelex ?? 'NOT FOUND'}`);
	if (sparql.allCelex.length > 0) {
		console.log(`        All (${sparql.allCelex.length}):`);
		for (const r of sparql.allCelex) {
			console.log(`          ${r.celex} [${r.source}]${r.date ? ` ${r.date}` : ''}`);
		}
	}

	const billCelex = sparql.billCelex;
	const finalCelex = sparql.finalCelex;
	const epPositionCelex = sparql.epPositionCelex;

	// Step 3: Vote counts
	let voteFor = 0,
		voteAgainst = 0,
		voteAbstain = 0;
	if (epData.voteDate) {
		console.log(`  [3/4] EP Open Data votes...`);
		const votes = await discoverVoteCounts(epData.voteDate, epData.title, reportRef);
		voteFor = votes.voteFor;
		voteAgainst = votes.voteAgainst;
		voteAbstain = votes.voteAbstain;
		console.log(`        Decisions: ${votes.totalDecisions}`);
		console.log(`        Main vote: ${voteFor}/${voteAgainst}/${voteAbstain}`);
	} else {
		console.log(`  [3/4] Votes: SKIPPED (no vote date)`);
	}

	// Step 4: Derive slug
	const slug = slugify(epData.title);
	console.log(`  [4/4] Slug: ${slug}`);

	// Validate minimum requirements
	if (!billCelex) throw new Error('Could not discover bill CELEX from SPARQL.');
	if (!finalCelex)
		throw new Error('Could not discover final regulation CELEX from SPARQL.');
	if (!epData.voteDate)
		throw new Error('Could not discover EP vote date from EP Open Data.');

	console.log(`  ─────────────────────────────────────`);
	console.log(`  Discovery complete.\n`);

	return {
		slug,
		title: epData.title,
		billCelex,
		finalCelex,
		epPositionCelex,
		taReference,
		lang: 'en',
		procedure: procedureCode,
		voteDate: epData.voteDate,
		voteFor,
		voteAgainst,
		voteAbstain,
		pubDate: epData.pubDate,
		comDate:
			epData.comDate ?? sparql.allCelex.find((r) => r.celex === billCelex)?.date ?? null
	};
}
