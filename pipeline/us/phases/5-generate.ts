/**
 * Phase 5: GENERATE — Produce AKN Diff XMLs
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Config, Discovery, ParsedData, ParsedVote, ParsedSection } from '../types.js';
import { computeChangeSet } from '../../shared/changeset.js';
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
	let previousCode: string | undefined;

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
				// Parse "Sen. Britt, Katie Boyd [R-AL]" \u2192 lastName="Britt", firstName="Katie Boyd"
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
			previousCode = code;
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
						`  Changes (${previousCode} \u2192 ${code}): ${changesXml.stats.substituted} sub, ${changesXml.stats.inserted} ins, ${changesXml.stats.repealed} rep`
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

			const isPassage = entry.label.toLowerCase().includes('passage');

			const chamberRef = entry.chamber === 'Senate'
				? { eId: 'senate', href: '/us/senate', showAs: 'United States Senate' }
				: entry.chamber === 'House'
					? { eId: 'house', href: '/us/house', showAs: 'United States House of Representatives' }
					: { eId: 'congress', href: '/us/congress', showAs: 'United States Congress' };

			const authorHref = entry.chamber
				? `/${entry.chamber === 'Senate' ? 'us/senate' : 'us/house'}`
				: '/us/congress';

			const voteInfo = vote ? `${vote.forCount}-${vote.againstCount}` : isPassage ? 'voice vote' : 'no vote';
			const label = `${entry.label} \u2014 ${billId.type.toUpperCase()}.${billId.number}`;

			let description: string;
			if (isPassage) {
				description = vote
					? `Passed ${entry.chamber} by roll call vote ${vote.forCount}-${vote.againstCount} on ${entry.date}.`
					: `Passed ${entry.chamber} by voice vote on ${entry.date}.`;
			} else {
				description = `${entry.label} on ${entry.date}.`;
			}

			const name = isPassage
				? `${billId.type}${billId.number}-${billId.congress}-${entry.chamber?.toLowerCase()}-passage`
				: `${billId.type}${billId.number}-${billId.congress}-${entry.versionCode.toLowerCase()}`;

			const xml = buildAmendmentXml(
				changesXml?.changes || [],
				{
					thisValue: `${billUri}/${entry.versionCode.toLowerCase()}`,
					uri: billUri,
					date: entry.date,
					dateName: isPassage ? 'passage' : 'version',
					authorHref
				},
				name,
				label,
				description,
				baseUri,
				resultUri,
				vote,
				chamberRef
			);

			writeFileSync(join(aknDir, filename), xml, 'utf-8');
			generated.push(filename);
			const changeCount = changesXml?.changes.length || 0;
			console.log(
				`  ${filename} (${entry.chamber || 'Congress'}, ${voteInfo}, ${changeCount} changes)`
			);

			if (sections) {
				previousSections = sections;
				previousDate = entry.date;
				previousCode = code;
			}
		} else if (entry.type === 'act') {
			if (!sections || sections.length === 0) {
				if (previousSections) {
					console.warn(`  WARNING: No sections for ${code} \u2014 using fallback from previous version (${previousCode})`);
				} else {
					console.warn(`  WARNING: No sections for act, skipping`);
					continue;
				}
			}
			const actSections = sections || previousSections!;

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
