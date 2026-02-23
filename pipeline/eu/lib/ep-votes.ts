/**
 * EP Open Data → Akoma Ntoso (votes)
 *
 * Downloads roll-call voting data from the European Parliament Open Data API
 * and converts it to a valid AKN 3.0 XML document with <doc name="votes"> structure.
 *
 * Resolves MEP IDs to full names via the MEP list endpoint.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fetchJson, EP_API } from './http.js';
import { XmlBuilder, esc } from './xml-builder.js';

// ─── MEP Name Resolution ────────────────────────────────────────────────────

async function fetchMepNames(term: number): Promise<Map<string, string>> {
	const nameMap = new Map<string, string>();
	let offset = 0;
	const limit = 800;

	while (true) {
		const url = `${EP_API}/api/v2/meps?format=application%2Fld%2Bjson&parliamentary-term=${term}&offset=${offset}&limit=${limit}`;
		console.log(`  Fetching MEPs term ${term} (offset ${offset})...`);
		const json = await fetchJson(url);
		const meps: any[] = json.data ?? [];
		if (meps.length === 0) break;

		for (const mep of meps) {
			const id = String(mep.identifier || '');
			const label = mep.label || '';
			if (id && label) nameMap.set(id, label);
		}

		console.log(`    Got ${meps.length} MEPs (total so far: ${nameMap.size})`);
		if (meps.length < limit) break;
		offset += limit;
	}

	return nameMap;
}

/** Detect parliamentary term from meeting date */
function detectTerm(date: string): number {
	// ISO date strings compare correctly: "2024-03-13" < "2024-07-16"
	if (date >= '2024-07-16') return 10;
	if (date >= '2019-07-02') return 9;
	return 8;
}

// ─── Extract ID from URI ─────────────────────────────────────────────────────

function idFromUri(uri: string): string {
	const parts = uri.split('/');
	return parts[parts.length - 1];
}

function personIdFromRef(ref: string): string {
	return ref.replace('person/', '');
}

// ─── Format voter list as "Surname, Name" ────────────────────────────────────

function formatVoterList(voterRefs: string[], mepNames: Map<string, string>): string {
	const names: string[] = [];
	for (const ref of voterRefs) {
		const pid = personIdFromRef(ref);
		const name = mepNames.get(pid);
		if (name) {
			// EP API returns "FirstName LASTNAME" — convert to "LASTNAME, FirstName"
			const parts = name.split(' ');
			const upperParts = parts.filter((p) => p === p.toUpperCase() && p.length > 1);
			const lowerParts = parts.filter((p) => p !== p.toUpperCase() || p.length <= 1);
			if (upperParts.length > 0 && lowerParts.length > 0) {
				names.push(`${upperParts.join(' ')}, ${lowerParts.join(' ')}`);
			} else {
				names.push(name);
			}
		} else {
			names.push(`MEP ${pid}`);
		}
	}
	return names.sort((a, b) => a.localeCompare(b, 'en')).join(', ');
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function buildVotes(
	meetingId: string,
	term: number,
	outputPath: string
): Promise<void> {
	const meetingDate = meetingId.replace('MTG-PL-', '');
	const meetingLabel = `Plenary Session ${meetingDate}`;

	console.log(`  Meeting: ${meetingLabel} (${meetingId})`);
	console.log(`  Date: ${meetingDate}`);

	// Detect or use provided parliamentary term
	const resolvedTerm = term > 0 ? term : detectTerm(meetingDate);
	console.log(`  Parliamentary term: ${resolvedTerm}`);

	// Fetch MEP names for name resolution
	console.log('\nFetching MEP names...');
	const mepNames = await fetchMepNames(resolvedTerm);
	console.log(`  Loaded ${mepNames.size} MEP names`);

	// Fetch decisions (votes)
	const decisionsUrl = `${EP_API}/api/v2/meetings/${meetingId}/decisions?format=application%2Fld%2Bjson`;
	console.log(`\nFetching decisions for ${meetingId}...`);
	const decisionsJson = await fetchJson(decisionsUrl);
	const decisions: any[] = decisionsJson.data ?? [];

	console.log(`  Decisions/votes: ${decisions.length}`);

	// Build AKN
	const AKN_NS = 'http://docs.oasis-open.org/legaldocml/ns/akn/3.0';
	const eli = `https://data.europarl.europa.eu/eli/dl/event/${meetingId}`;
	const x = new XmlBuilder();

	x.emit(`<?xml version="1.0" encoding="UTF-8"?>`);
	x.open('akomaNtoso', { xmlns: AKN_NS });
	x.open('doc', { name: 'votes' });

	// ── meta
	x.open('meta');
	x.open('identification', { source: '#ep-opendata' });

	x.open('FRBRWork');
	x.selfClose('FRBRthis', { value: `${eli}/votes` });
	x.selfClose('FRBRuri', { value: `${eli}/votes` });
	x.selfClose('FRBRdate', { date: meetingDate, name: 'meeting' });
	x.selfClose('FRBRauthor', { href: '#ep' });
	x.selfClose('FRBRcountry', { value: 'eu' });
	x.close('FRBRWork');

	x.open('FRBRExpression');
	x.selfClose('FRBRthis', { value: `${eli}/votes/mul` });
	x.selfClose('FRBRuri', { value: `${eli}/votes/mul` });
	x.selfClose('FRBRdate', { date: meetingDate, name: 'meeting' });
	x.selfClose('FRBRauthor', { href: '#ep' });
	x.selfClose('FRBRlanguage', { language: 'mul' });
	x.close('FRBRExpression');

	x.open('FRBRManifestation');
	x.selfClose('FRBRthis', { value: `${eli}/votes/mul/xml` });
	x.selfClose('FRBRuri', { value: `${eli}/votes/mul/xml` });
	x.selfClose('FRBRdate', {
		date: new Date().toISOString().slice(0, 10),
		name: 'transformation',
	});
	x.selfClose('FRBRauthor', { href: '#poc-epdata-to-vote' });
	x.close('FRBRManifestation');

	x.close('identification');

	// references — all unique person refs with full names
	const allPersonRefs = new Set<string>();
	for (const dec of decisions) {
		for (const ref of dec.had_voter_favor ?? []) allPersonRefs.add(ref);
		for (const ref of dec.had_voter_against ?? []) allPersonRefs.add(ref);
		for (const ref of dec.had_voter_abstention ?? []) allPersonRefs.add(ref);
	}

	x.open('references', { source: '#ep-opendata' });
	x.selfClose('TLCOrganization', {
		eId: 'ep-opendata',
		href: 'https://data.europarl.europa.eu',
		showAs: 'European Parliament Open Data Portal',
	});
	x.selfClose('TLCOrganization', {
		eId: 'ep',
		href: 'https://data.europarl.europa.eu/org/EU_PARLIAMENT',
		showAs: 'European Parliament',
	});

	// All MEPs with full names
	for (const ref of allPersonRefs) {
		const pid = personIdFromRef(ref);
		const name = mepNames.get(pid) ?? `MEP ${pid}`;
		x.selfClose('TLCPerson', {
			eId: `mep-${pid}`,
			href: `https://data.europarl.europa.eu/${ref}`,
			showAs: name,
		});
	}
	x.close('references');

	x.close('meta');

	// ── preface
	x.open('preface', { eId: 'preface' });
	x.open('longTitle', { eId: 'longTitle' });
	x.inline('p', {}, `<docType>Roll-Call Votes</docType>`);
	x.inline('p', {}, `<docTitle>Plenary Votes - ${esc(meetingLabel)}</docTitle>`);
	x.inline('p', {}, `<date date="${esc(meetingDate)}">${esc(meetingDate)}</date>`);
	x.inline(
		'p',
		{},
		`Total decisions: ${decisions.length} | Total unique voters: ${allPersonRefs.size}`
	);
	x.close('longTitle');
	x.close('preface');

	// ── mainBody: each decision as a section
	x.open('mainBody');

	let resolvedCount = 0;
	let unresolvedCount = 0;

	for (let i = 0; i < decisions.length; i++) {
		const dec = decisions[i];
		const sectionEId = `sec_vote_${i + 1}`;
		const voteLabel: string =
			dec.referenceText?.en ??
			dec.activity_label?.en ??
			dec.activity_label?.mul ??
			dec.activity_label?.fr ??
			idFromUri(dec.id);
		const outcome: string = dec.decision_outcome?.split('/').pop() ?? 'unknown';
		const method: string = dec.decision_method?.split('/').pop() ?? 'unknown';
		const votesFor: number =
			dec.number_of_votes_favor ?? (dec.had_voter_favor?.length ?? 0);
		const votesAgainst: number =
			dec.number_of_votes_against ?? (dec.had_voter_against?.length ?? 0);
		const votesAbstention: number =
			dec.number_of_votes_abstention ?? (dec.had_voter_abstention?.length ?? 0);
		const numAttendees: number = dec.number_of_attendees ?? 0;
		const startTime: string = dec.activity_start_date ?? '';
		const votingId: string = dec.notation_votingId ?? '';

		console.log(
			`  Vote ${i + 1}: ${voteLabel} => ${outcome} (${votesFor}/${votesAgainst}/${votesAbstention})`
		);

		x.open('section', { eId: sectionEId });
		x.inline('num', {}, `Vote ${i + 1}`);
		x.inline('heading', {}, esc(voteLabel));

		// Vote summary block
		x.open('content', { eId: `${sectionEId}__content` });
		x.inline('p', { class: 'outcome' }, `Outcome: <b>${esc(outcome)}</b>`);
		x.inline('p', { class: 'method' }, `Method: ${esc(method)}`);

		if (startTime) {
			const timeStr = startTime.includes('T') ? startTime.split('T')[1].slice(0, 8) : startTime;
			x.inline(
				'p',
				{ class: 'time' },
				`Time: <time datetime="${esc(startTime)}">${esc(timeStr)}</time>`
			);
		}

		if (votingId) {
			x.inline('p', { class: 'votingId' }, `Voting ID: ${esc(votingId)}`);
		}

		x.inline(
			'p',
			{ class: 'tally' },
			`For: ${votesFor} | Against: ${votesAgainst} | Abstention: ${votesAbstention}` +
				(numAttendees > 0 ? ` | Attendees: ${numAttendees}` : '')
		);

		x.close('content');

		// Individual voter lists with full names
		const voterCategories = [
			{ key: 'had_voter_favor', label: 'A favor', eIdSuffix: 'favor' },
			{ key: 'had_voter_against', label: 'En contra', eIdSuffix: 'against' },
			{ key: 'had_voter_abstention', label: 'Abstenciones', eIdSuffix: 'abstention' },
		] as const;

		for (const cat of voterCategories) {
			const voters: string[] = dec[cat.key] ?? [];
			if (voters.length === 0) continue;

			x.open('section', { eId: `${sectionEId}__${cat.eIdSuffix}` });
			x.inline('heading', {}, `${cat.label} (${voters.length})`);
			x.open('content', { eId: `${sectionEId}__${cat.eIdSuffix}__content` });

			// Full name list, sorted alphabetically
			const nameList = formatVoterList(voters, mepNames);
			x.inline('p', {}, esc(nameList));

			// Track resolution stats
			for (const ref of voters) {
				if (mepNames.has(personIdFromRef(ref))) resolvedCount++;
				else unresolvedCount++;
			}

			x.close('content');
			x.close('section');
		}

		x.close('section');
	}

	x.close('mainBody');

	x.close('doc');
	x.close('akomaNtoso');

	// Write output
	const outputDir = dirname(outputPath);
	mkdirSync(outputDir, { recursive: true });
	const xml = x.toString();
	writeFileSync(outputPath, xml, 'utf-8');

	console.log(`\nWritten: ${outputPath} (${(xml.length / 1024).toFixed(0)} KB)`);
	console.log(`MEP names resolved: ${resolvedCount} | Unresolved: ${unresolvedCount}`);

	// Write structured JSON index alongside the XML
	const jsonIndex = decisions.map((dec: any, i: number) => {
		const voteLabel: string =
			dec.referenceText?.en ??
			dec.activity_label?.en ??
			dec.activity_label?.mul ??
			dec.activity_label?.fr ??
			idFromUri(dec.id);
		const outcome: string = dec.decision_outcome?.split('/').pop() ?? 'unknown';
		const votesFor: number =
			dec.number_of_votes_favor ?? (dec.had_voter_favor?.length ?? 0);
		const votesAgainst: number =
			dec.number_of_votes_against ?? (dec.had_voter_against?.length ?? 0);
		const votesAbstention: number =
			dec.number_of_votes_abstention ?? (dec.had_voter_abstention?.length ?? 0);

		function buildVoters(refs: string[]): { href: string; showAs: string }[] {
			return refs
				.map((ref) => {
					const pid = personIdFromRef(ref);
					const name = mepNames.get(pid) ?? `MEP ${pid}`;
					return { href: `https://data.europarl.europa.eu/${ref}`, showAs: name };
				})
				.sort((a, b) => a.showAs.localeCompare(b.showAs, 'en'));
		}

		return {
			index: i + 1,
			label: voteLabel,
			outcome,
			forCount: votesFor,
			againstCount: votesAgainst,
			abstainCount: votesAbstention,
			voters: {
				for: buildVoters(dec.had_voter_favor ?? []),
				against: buildVoters(dec.had_voter_against ?? []),
				abstain: buildVoters(dec.had_voter_abstention ?? []),
			},
		};
	});

	const jsonPath = outputPath.replace(/\.xml$/, '-index.json');
	writeFileSync(jsonPath, JSON.stringify(jsonIndex, null, 2), 'utf-8');
	console.log(`Written: ${jsonPath} (${(JSON.stringify(jsonIndex).length / 1024).toFixed(0)} KB)`);
}
