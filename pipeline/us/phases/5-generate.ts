/**
 * Phase 5: GENERATE — Produce AKN Diff XMLs
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Config, Discovery, ParsedData, ParsedVote, ParsedSection } from '../types.js';
import { computeChangeSet } from '../../cl/lib/changeset-computer.js';
import { buildBillXml, buildAmendmentXml, buildActXml } from '../lib/akn-builder.js';

export async function generate(
	config: Config,
	discovery: Discovery,
	parsed: ParsedData,
	outDir: string
): Promise<string[]> {
	console.log('\n=== Phase 5: GENERATE ===\n');

	const aknDir = join(outDir, 'akn');
	if (!existsSync(aknDir)) mkdirSync(aknDir, { recursive: true });

	const { billId, publicLaw } = config;
	const billUri = `/us/bill/${billId.congress}/${billId.type}/${billId.number}`;
	const generated: string[] = [];

	let previousSections: ParsedSection[] | undefined;
	let previousDate: string | undefined;

	for (const entry of config.timeline) {
		const num = String(entry.index + 1).padStart(2, '0');
		const code = entry.versionCode.toUpperCase();
		const sections = parsed.versions[code];

		if (entry.type === 'bill') {
			if (!sections || sections.length === 0) {
				console.warn(`  WARNING: No sections found for ${code}, skipping bill`);
				continue;
			}

			const filename = `${num}-bill.xml`;

			// Build sponsor info from discovery
			const sponsor = discovery.sponsor;
			let sponsorRef: { eId: string; href: string; showAs: string } | undefined;
			if (sponsor) {
				// Parse "Sen. Britt, Katie Boyd [R-AL]" → lastName="Britt", firstName="Katie Boyd"
				const cleanName = sponsor.name.replace(/^(Sen\.|Rep\.)\s*/, '').replace(/\s*\[.*?\]/, '').trim();
				const [lastName, firstName] = cleanName.includes(',')
					? cleanName.split(',').map((s) => s.trim())
					: [cleanName, ''];
				const slug = `${firstName}-${lastName}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z-]/g, '');
				const eId = lastName.toLowerCase().replace(/\s+/g, '-');
				const chamber = sponsor.name.startsWith('Rep.') ? 'representative' : 'senator';
				sponsorRef = {
					eId,
					href: `/us/${chamber}/${slug}`,
					showAs: `${sponsor.name.startsWith('Rep.') ? 'Rep.' : 'Sen.'} ${firstName} ${lastName} (${sponsor.party}-${sponsor.state})`
				};
			}

			const xml = buildBillXml(
				sections,
				{
					thisValue: `${billUri}/${entry.versionCode.toLowerCase()}`,
					uri: billUri,
					date: entry.date,
					dateName: 'introduced',
					authorHref: sponsorRef?.href || `/us/congress`
				},
				`${billId.type}${billId.number}-${billId.congress}-${entry.versionCode.toLowerCase()}`,
				`${billId.type.toUpperCase()}.${billId.number} \u2014 ${config.title}`,
				config.title,
				sponsorRef
			);

			writeFileSync(join(aknDir, filename), xml, 'utf-8');
			generated.push(filename);
			console.log(`  ${filename} (${sections.length} sections)`);

			previousSections = sections;
			previousDate = entry.date;
		} else if (entry.type === 'amendment') {
			const filename = `${num}-amendment-${entry.index}.xml`;

			// Compute changeset
			let changesXml: ReturnType<typeof computeChangeSet> | undefined;
			if (previousSections && sections) {
				const oldArticles = previousSections.map((s) => ({
					eId: s.eId,
					num: '',
					heading: s.heading,
					content: s.content
				}));
				const newArticles = sections.map((s) => ({
					eId: s.eId,
					num: '',
					heading: s.heading,
					content: s.content
				}));
				changesXml = computeChangeSet(oldArticles, newArticles);
				if (changesXml.changes.length > 0) {
					console.log(
						`  Changes: ${changesXml.stats.substituted} sub, ${changesXml.stats.inserted} ins, ${changesXml.stats.repealed} rep`
					);
				}
			}

			// Find matching vote
			let vote: ParsedVote | undefined;
			if (entry.voteRef) {
				const key =
					entry.voteRef.chamber === 'Senate'
						? `senate-${entry.voteRef.rollNumber}`
						: `house-${entry.voteRef.rollNumber}`;
				vote = parsed.votes[key];
			}

			const baseUri = `${billUri}/eng@${previousDate || entry.date}`;
			const resultUri = `${billUri}/eng@${entry.date}`;

			const chamberRef = entry.chamber === 'Senate'
				? { eId: 'senate', href: '/us/senate', showAs: 'United States Senate' }
				: { eId: 'house', href: '/us/house', showAs: 'United States House of Representatives' };

			const voteInfo = vote ? `${vote.forCount}-${vote.againstCount}` : 'voice vote';
			const label = `${entry.chamber} Passage \u2014 ${billId.type.toUpperCase()}.${billId.number}`;

			const xml = buildAmendmentXml(
				changesXml?.changes || [],
				{
					thisValue: `${billUri}/${entry.versionCode.toLowerCase()}`,
					uri: billUri,
					date: entry.date,
					dateName: 'passage',
					authorHref: `/${entry.chamber === 'Senate' ? 'us/senate' : 'us/house'}`
				},
				`${billId.type}${billId.number}-${billId.congress}-${entry.chamber?.toLowerCase()}-passage`,
				label,
				`Passed ${entry.chamber} by ${vote ? 'roll call vote' : 'voice vote'} ${voteInfo} on ${entry.date}.`,
				baseUri,
				resultUri,
				vote,
				chamberRef
			);

			writeFileSync(join(aknDir, filename), xml, 'utf-8');
			generated.push(filename);
			const changeCount = changesXml?.changes.length || 0;
			console.log(
				`  ${filename} (${entry.chamber}, ${voteInfo}, ${changeCount} changes)`
			);

			if (sections) {
				previousSections = sections;
				previousDate = entry.date;
			}
		} else if (entry.type === 'act') {
			// For act, use ENR sections or fall back to last known sections
			const actSections = sections || previousSections;
			if (!actSections || actSections.length === 0) {
				console.warn(`  WARNING: No sections for act, skipping`);
				continue;
			}

			const filename = `${num}-act-final.xml`;
			const plName = publicLaw
				? `public-law-${publicLaw.congress}-${publicLaw.number}`
				: `${billId.type}${billId.number}-${billId.congress}-enacted`;
			const plTitle = publicLaw
				? `Public Law ${publicLaw.congress}-${publicLaw.number} \u2014 ${config.title}`
				: config.title;
			const plUri = publicLaw
				? `/us/pl/${publicLaw.congress}/${publicLaw.number}`
				: `${billUri}/enacted`;

			const xml = buildActXml(
				actSections,
				{
					thisValue: plUri,
					uri: plUri,
					date: entry.date,
					dateName: 'enacted',
					authorHref: '/us/congress'
				},
				plName,
				plTitle,
				config.title
			);

			writeFileSync(join(aknDir, filename), xml, 'utf-8');
			generated.push(filename);
			console.log(`  ${filename} (${actSections.length} sections)`);
		}
	}

	console.log(`\n  Generated ${generated.length} AKN files in akn/`);
	return generated;
}

