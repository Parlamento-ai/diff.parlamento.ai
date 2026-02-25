/**
 * Phase 6: ENRICH — Add Congreso vote data to amendment XMLs
 *
 * For each amendment in the timeline with a modifyingLaw:
 *   1. Look up cached vote or fetch from Congreso Open Data
 *   2. Build AKN vote XML with individual voter names
 *   3. Inject <akndiff:vote> into the existing amendment XML
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { escapeXml } from '../../shared/xml.js';
import { findVoteForLaw } from '../lib/vote-matcher.js';
import type { VoteMatch } from '../lib/vote-matcher.js';
import type { PipelineConfig } from '../types.js';

export async function enrich(config: PipelineConfig, outDir: string): Promise<void> {
	console.log('\n=== Phase 6: ENRICH ===\n');

	const aknDir = join(outDir, 'akn');
	const cacheDir = join(outDir, 'sources');
	const cachePath = join(cacheDir, 'votes.json');

	// Load cached votes
	let cache: Record<string, VoteMatch | null> = {};
	if (existsSync(cachePath)) {
		cache = JSON.parse(readFileSync(cachePath, 'utf-8'));
	}

	let enriched = 0;
	let fileIndex = 1;

	for (const entry of config.timeline) {
		const num = String(fileIndex).padStart(2, '0');
		const fileName = `${num}-${entry.slug}.xml`;
		fileIndex++;

		if (entry.type !== 'amendment' || !entry.modifyingLaw) continue;

		const xmlPath = join(aknDir, fileName);
		if (!existsSync(xmlPath)) continue;

		// Check cache first
		let vote: VoteMatch | null;
		if (entry.modifyingLaw in cache) {
			vote = cache[entry.modifyingLaw];
			if (vote) {
				console.log(`  [cached] ${entry.modifyingLaw} — ${vote.for.length} Sí, ${vote.against.length} No, ${vote.abstain.length} Abs`);
			} else {
				console.log(`  [cached] ${entry.modifyingLaw} — no vote`);
			}
		} else {
			console.log(`  Buscando voto para ${entry.modifyingLaw}...`);
			try {
				vote = await findVoteForLaw(entry.modifyingLaw, entry.date);
			} catch (err) {
				console.log(`    Error: ${(err as Error).message}`);
				vote = null;
			}
			cache[entry.modifyingLaw] = vote;

			if (vote) {
				console.log(`    Found: ${vote.date} — ${vote.for.length} Sí, ${vote.against.length} No, ${vote.abstain.length} Abs`);
			} else {
				console.log(`    No vote found (TC sentence, RD, or ley ordinaria sin votación de conjunto)`);
			}
		}

		if (!vote) continue;

		// Inject vote into existing XML
		const xml = readFileSync(xmlPath, 'utf-8');
		const enrichedXml = injectVoteIntoXml(xml, vote);
		writeFileSync(xmlPath, enrichedXml, 'utf-8');
		enriched++;
	}

	// Save cache
	if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });
	writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf-8');

	console.log(`\n  Enriched ${enriched} amendments with vote data`);
}

/** Inject <akndiff:vote> as first child of <akndiff:changeSet>, replacing any existing vote */
function injectVoteIntoXml(xml: string, vote: VoteMatch): string {
	const voteXml = buildVoteXml(vote);

	// Remove existing vote if present (for re-runs)
	let cleaned = xml.replace(/<akndiff:vote[\s\S]*?<\/akndiff:vote>\s*/g, '');

	// Insert after <akndiff:changeSet ...>
	cleaned = cleaned.replace(
		/(<akndiff:changeSet[^>]*>)\s*/,
		`$1\n${voteXml}\n`
	);

	return cleaned;
}

/** Build AKN vote XML with individual voter elements */
function buildVoteXml(vote: VoteMatch): string {
	const forXml = buildVoterGroupXml(vote.for, 'for');
	const againstXml = buildVoterGroupXml(vote.against, 'against');
	const abstainXml = buildVoterGroupXml(vote.abstain, 'abstain');

	return `      <akndiff:vote date="${vote.date}" result="${vote.result}" source="${escapeXml(vote.source)}">
${forXml}
${againstXml}
${abstainXml}
      </akndiff:vote>`;
}

function buildVoterGroupXml(
	voters: Array<{ name: string; group: string }>,
	type: 'for' | 'against' | 'abstain'
): string {
	if (voters.length === 0) return `        <akndiff:${type}/>`;
	const inner = voters
		.map((v) => {
			const slug = nameToSlug(v.name);
			return `          <akndiff:voter href="/es/diputado/${slug}" showAs="${escapeXml(v.name)}"/>`;
		})
		.join('\n');
	return `        <akndiff:${type} count="${voters.length}">\n${inner}\n        </akndiff:${type}>`;
}

/** Convert "González López, María del Carmen" → "gonzalez-lopez" */
function nameToSlug(name: string): string {
	return name
		.split(',')[0]
		.trim()
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/ /g, '-');
}
