/**
 * Congress.gov API client
 * https://api.congress.gov/v3/
 */
import type { BillId, BillTextVersion, RecordedVoteRef, PassageAction } from '../types.js';

const BASE = 'https://api.congress.gov/v3';

function apiKey(): string {
	return process.env.CONGRESS_API_KEY || 'DEMO_KEY';
}

async function fetchJson(url: string, retries = 3): Promise<any> {
	const sep = url.includes('?') ? '&' : '?';
	const fullUrl = `${url}${sep}api_key=${apiKey()}&format=json`;
	for (let attempt = 0; attempt <= retries; attempt++) {
		const res = await fetch(fullUrl);
		if (res.status === 429) {
			const wait = (attempt + 1) * 5000;
			console.log(`    Rate limited, waiting ${wait / 1000}s...`);
			await new Promise((r) => setTimeout(r, wait));
			continue;
		}
		if (!res.ok) throw new Error(`Congress API ${res.status}: ${url}`);
		return res.json();
	}
	throw new Error(`Congress API rate limited after ${retries} retries: ${url}`);
}

/** Fetch bill metadata */
export async function fetchBill(id: BillId) {
	const data = await fetchJson(`${BASE}/bill/${id.congress}/${id.type}/${id.number}`);
	return data.bill;
}

/** Fetch bill actions (paginated — fetches all) */
export async function fetchActions(id: BillId): Promise<any[]> {
	const actions: any[] = [];
	let offset = 0;
	const limit = 250;
	while (true) {
		const data = await fetchJson(
			`${BASE}/bill/${id.congress}/${id.type}/${id.number}/actions?offset=${offset}&limit=${limit}`
		);
		const batch = data.actions || [];
		actions.push(...batch);
		if (batch.length < limit) break;
		offset += limit;
	}
	return actions;
}

/** Fetch text versions */
export async function fetchTextVersions(id: BillId): Promise<any[]> {
	const data = await fetchJson(
		`${BASE}/bill/${id.congress}/${id.type}/${id.number}/text?limit=250`
	);
	return data.textVersions || [];
}

/** Extract recorded vote references from actions (deduplicated by URL) */
export function extractVoteRefs(actions: any[]): RecordedVoteRef[] {
	const refs: RecordedVoteRef[] = [];
	const seen = new Set<string>();
	for (const action of actions) {
		if (!action.recordedVotes) continue;
		for (const rv of action.recordedVotes) {
			const url: string = rv.url || '';
			if (seen.has(url)) continue;
			seen.add(url);
			const ref = parseVoteUrl(url, action.actionDate);
			if (ref) refs.push(ref);
		}
	}
	return refs;
}

/** Parse a Senate or House vote URL into a RecordedVoteRef */
function parseVoteUrl(url: string, fallbackDate: string): RecordedVoteRef | null {
	// Senate: https://www.senate.gov/legislative/LIS/roll_call_votes/vote1191/vote_119_1_00007.xml
	const senateMatch = url.match(/vote(\d{3})(\d)\/vote_\d+_\d+_(\d+)\.xml/);
	if (senateMatch) {
		return {
			chamber: 'Senate',
			congress: parseInt(senateMatch[1]),
			session: parseInt(senateMatch[2]),
			rollNumber: parseInt(senateMatch[3]),
			date: fallbackDate,
			url
		};
	}
	// House: https://clerk.house.gov/evs/2025/roll023.xml
	const houseMatch = url.match(/evs\/(\d{4})\/roll(\d+)\.xml/);
	if (houseMatch) {
		return {
			chamber: 'House',
			congress: 0, // will be filled from context
			session: 0,
			rollNumber: parseInt(houseMatch[2]),
			date: fallbackDate,
			url
		};
	}
	return null;
}

/** Extract passage actions from Congress.gov actions list (deduplicated by chamber) */
export function extractPassageActions(
	actions: any[],
	voteRefs: RecordedVoteRef[]
): PassageAction[] {
	const passages: PassageAction[] = [];
	const seenChambers = new Set<string>();

	for (const action of actions) {
		const text: string = action.text || '';
		const type: string = action.type || '';

		// Detect passage actions — look for definitive "Passed/agreed to" actions
		const isSenatePassage = /Passed\/agreed to in Senate/i.test(text) ||
			(/Passed Senate/i.test(text) && type === 'Floor');
		const isHousePassage = /Passed\/agreed to in House/i.test(text) ||
			(/On passage Passed/i.test(text) && type === 'Floor');

		if (!isSenatePassage && !isHousePassage) continue;

		const passageChamber = isSenatePassage ? 'Senate' : 'House';

		// Deduplicate: only keep first passage per chamber
		if (seenChambers.has(passageChamber)) continue;
		seenChambers.add(passageChamber);

		// Find matching vote ref (same date + chamber)
		const voteRef = voteRefs.find(
			(v) => v.chamber === passageChamber && v.date === action.actionDate
		);

		passages.push({
			date: action.actionDate,
			chamber: passageChamber as 'Senate' | 'House',
			description: text,
			voteRef,
			resultingVersionCode: undefined
		});
	}

	// Sort: Senate before House (typically Senate acts first for Senate bills)
	passages.sort((a, b) => a.date.localeCompare(b.date));

	return passages;
}

/** Map Congress.gov full version names to GovInfo short codes */
const VERSION_NAME_TO_CODE: Record<string, string> = {
	'Introduced in House': 'IH',
	'Introduced in Senate': 'IS',
	'Placed on Calendar Senate': 'PCS',
	'Placed on Calendar House': 'PCH',
	'Referred in Senate': 'RFS',
	'Referred in House': 'RFH',
	'Received in Senate': 'RDS',
	'Received in House': 'RDH',
	'Reported in Senate': 'RS',
	'Reported in House': 'RH',
	'Engrossed in Senate': 'ES',
	'Engrossed in House': 'EH',
	'Engrossed Amendment Senate': 'EAS',
	'Engrossed Amendment House': 'EAH',
	'Enrolled Bill': 'ENR',
	'Public Law': 'PLAW',
	'Public Print': 'PP',
	'Committee Discharged Senate': 'CDS',
	'Committee Discharged House': 'CDH'
};

/** Extract text version info with dates and XML URLs */
export function extractTextVersionInfo(rawVersions: any[]): BillTextVersion[] {
	return rawVersions.map((v) => {
		const fullName: string = v.type || '';
		const code = VERSION_NAME_TO_CODE[fullName] || fullName.toUpperCase();

		// Find the XML format URL from the formats array
		let xmlUrl: string | undefined;
		if (v.formats) {
			const xmlFormat = v.formats.find(
				(f: any) => f.type === 'Formatted XML' || f.type === 'United States Legislative Markup'
			);
			if (xmlFormat) xmlUrl = xmlFormat.url;
		}

		return {
			code,
			date: v.date ? v.date.slice(0, 10) : '',
			url: v.url || undefined,
			govInfoUrl: xmlUrl
		};
	});
}
