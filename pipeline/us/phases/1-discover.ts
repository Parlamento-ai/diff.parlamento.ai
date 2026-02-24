/**
 * Phase 1: DISCOVER — Fetch bill metadata from Congress.gov API
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { BillId, Discovery, BillTextVersion, RecordedVoteRef, PassageAction } from '../types.js';
import {
	fetchBill,
	fetchActions,
	fetchTextVersions,
	extractVoteRefs,
	extractPassageActions,
	extractTextVersionInfo
} from '../lib/congress-api.js';

/** Parse a bill ID string like "s5-119" into components */
export function parseBillId(input: string): BillId {
	const match = input.match(/^([a-z]+)(\d+)-(\d+)$/i);
	if (!match) throw new Error(`Invalid bill ID format: "${input}". Expected: s5-119, hr1-119, etc.`);
	return {
		type: match[1].toLowerCase(),
		number: parseInt(match[2]),
		congress: parseInt(match[3])
	};
}

export async function discover(billId: string, outDir: string): Promise<Discovery> {
	console.log('\n=== Phase 1: DISCOVER ===\n');

	const id = parseBillId(billId);
	console.log(`  Bill: ${id.type.toUpperCase()}.${id.number} (${id.congress}th Congress)`);

	// Fetch from Congress.gov API
	console.log('  Fetching bill metadata...');
	const bill = await fetchBill(id);
	console.log(`  Title: ${bill.title}`);

	console.log('  Fetching actions...');
	const actions = await fetchActions(id);
	console.log(`  Actions: ${actions.length}`);

	console.log('  Fetching text versions...');
	const rawVersions = await fetchTextVersions(id);
	console.log(`  Text versions: ${rawVersions.length}`);

	// Extract structured data
	const textVersions = extractTextVersionInfo(rawVersions);
	const recordedVotes = extractVoteRefs(actions);
	const passageActions = extractPassageActions(actions, recordedVotes);

	// Determine status
	let status: Discovery['status'] = 'introduced';
	const hasLaw = bill.laws && bill.laws.length > 0;
	if (hasLaw) {
		status = 'enacted';
	} else if (passageActions.length >= 2) {
		status = 'passed-both';
	} else if (passageActions.length === 1) {
		status = 'passed-one';
	}

	// Extract public law info
	let publicLaw: Discovery['publicLaw'];
	if (hasLaw) {
		const lawNum = bill.laws[0].number;
		const lawMatch = String(lawNum).match(/(\d+)-(\d+)/);
		if (lawMatch) {
			publicLaw = { congress: parseInt(lawMatch[1]), number: parseInt(lawMatch[2]) };
		}
	}

	// Extract sponsor
	let sponsor: Discovery['sponsor'];
	if (bill.sponsors && bill.sponsors.length > 0) {
		const s = bill.sponsors[0];
		sponsor = {
			name: s.fullName || `${s.firstName} ${s.lastName}`,
			party: s.party || '',
			state: s.state || ''
		};
	}

	const discovery: Discovery = {
		billId: id,
		title: bill.title || '',
		shortTitle: bill.shortTitle || undefined,
		sponsor,
		status,
		publicLaw,
		textVersions,
		recordedVotes,
		passageActions
	};

	console.log(`  Status: ${status}`);
	console.log(`  Recorded votes: ${recordedVotes.length}`);
	console.log(`  Passage actions: ${passageActions.length}`);
	if (publicLaw) console.log(`  Public Law: ${publicLaw.congress}-${publicLaw.number}`);

	const outPath = join(outDir, 'discovery.json');
	writeFileSync(outPath, JSON.stringify(discovery, null, 2), 'utf-8');
	console.log(`  Saved: discovery.json`);

	return discovery;
}
