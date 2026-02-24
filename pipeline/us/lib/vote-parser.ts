/**
 * Vote XML parser — parses Senate and House roll call vote XMLs
 * Converted from research/2026-02-23/us/generate-akn.mjs
 * Generalized: extracts dates from XML instead of hardcoding
 */
import { XMLParser } from 'fast-xml-parser';
import type { ParsedVote, ParsedVoter } from '../types.js';

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '@_',
	textNodeName: '#text',
	trimValues: true,
	preserveOrder: false
});

/** Parse a US Senate roll call vote XML */
export function parseSenateVote(xmlContent: string, congress: number, session: number, rollNumber: number): ParsedVote {
	const xml = parser.parse(xmlContent);
	const vote = xml['roll_call_vote'];
	const members = vote.members.member;
	const membersList = Array.isArray(members) ? members : [members];

	const forVoters: ParsedVoter[] = [];
	const againstVoters: ParsedVoter[] = [];

	for (const m of membersList) {
		const lastName = m.last_name || '';
		const firstName = m.first_name || '';
		const party = m.party || '';
		const state = m.state || '';
		const voter: ParsedVoter = {
			href: `/us/senator/${lastName.toLowerCase().replace(/\s+/g, '-')}`,
			showAs: `${firstName} ${lastName} (${party}-${state})`
		};
		if (m.vote_cast === 'Yea') forVoters.push(voter);
		else if (m.vote_cast === 'Nay') againstVoters.push(voter);
	}

	// Extract date from XML
	const voteDate = vote.vote_date || '';
	const dateMatch = voteDate.match(/(\w+)\s+(\d+),\s+(\d{4})/);
	let date = '';
	if (dateMatch) {
		const months: Record<string, string> = {
			January: '01', February: '02', March: '03', April: '04',
			May: '05', June: '06', July: '07', August: '08',
			September: '09', October: '10', November: '11', December: '12'
		};
		date = `${dateMatch[3]}-${months[dateMatch[1]] || '01'}-${dateMatch[2].padStart(2, '0')}`;
	}

	const pad = String(rollNumber).padStart(5, '0');

	return {
		chamber: 'Senate',
		date,
		result: 'approved',
		source: `/us/senate/${congress}/${session}/vote/${rollNumber}`,
		forVoters,
		againstVoters,
		forCount: Number(vote.count?.yeas || forVoters.length),
		againstCount: Number(vote.count?.nays || againstVoters.length)
	};
}

/** Parse a US House roll call vote XML */
export function parseHouseVote(xmlContent: string, congress: number, session: number, rollNumber: number): ParsedVote {
	const xml = parser.parse(xmlContent);
	const vote = xml['rollcall-vote'];
	const meta = vote['vote-metadata'];
	const data = vote['vote-data'];
	const records = data['recorded-vote'];
	const recordsList = Array.isArray(records) ? records : [records];

	const forVoters: ParsedVoter[] = [];
	const againstVoters: ParsedVoter[] = [];

	for (const r of recordsList) {
		const leg = r.legislator;
		const name = typeof leg === 'object' ? leg['#text'] || '' : String(leg || '');
		const party = typeof leg === 'object' ? leg['@_party'] || '' : '';
		const state = typeof leg === 'object' ? leg['@_state'] || '' : '';
		const voteVal = r.vote;

		const normalizedName = name
			.toLowerCase()
			.replace(/[^a-z\s-]/g, '')
			.replace(/\s+/g, '-');
		const voter: ParsedVoter = {
			href: `/us/representative/${normalizedName}`,
			showAs: `${name} (${party}-${state})`
		};

		if (voteVal === 'Yea') forVoters.push(voter);
		else if (voteVal === 'Nay') againstVoters.push(voter);
	}

	// Extract date from XML metadata
	const actionDate = meta['action-date'] || '';
	const dateMatch = actionDate.match(/(\d{1,2})-(\w+)-(\d{4})/);
	let date = '';
	if (dateMatch) {
		const months: Record<string, string> = {
			Jan: '01', Feb: '02', Mar: '03', Apr: '04',
			May: '05', Jun: '06', Jul: '07', Aug: '08',
			Sep: '09', Oct: '10', Nov: '11', Dec: '12'
		};
		date = `${dateMatch[3]}-${months[dateMatch[2]] || '01'}-${dateMatch[1].padStart(2, '0')}`;
	}

	const totals = meta['vote-totals']?.['totals-by-vote'];

	return {
		chamber: 'House',
		date,
		result: 'approved',
		source: `/us/house/${congress}/${session}/roll/${rollNumber}`,
		forVoters,
		againstVoters,
		forCount: totals ? Number(totals['yea-total']) : forVoters.length,
		againstCount: totals ? Number(totals['nay-total']) : againstVoters.length
	};
}
