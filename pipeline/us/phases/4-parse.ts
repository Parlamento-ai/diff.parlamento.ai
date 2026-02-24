/**
 * Phase 4: PARSE — Extract sections and votes from downloaded XMLs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Config, ParsedData, ParsedSection, ParsedVote } from '../types.js';
import { parseBillXml, extractSections } from '../lib/bill-dtd-parser.js';
import { parseSenateVote, parseHouseVote } from '../lib/vote-parser.js';

export async function parse(config: Config, outDir: string): Promise<ParsedData> {
	console.log('\n=== Phase 4: PARSE ===\n');

	const srcDir = join(outDir, 'sources');
	const versions: Record<string, ParsedSection[]> = {};
	const votes: Record<string, ParsedVote> = {};

	// Parse bill XMLs
	for (const item of config.downloads) {
		if (item.type !== 'bill-xml') continue;

		const filePath = join(srcDir, item.filename);
		console.log(`  Parsing ${item.filename}...`);

		try {
			const xmlContent = readFileSync(filePath, 'utf-8');
			const { parsed, raw } = parseBillXml(xmlContent);
			const sections = extractSections(parsed, raw);

			// Extract version code from filename (e.g., "01-pcs.xml" → "pcs")
			const codeMatch = item.filename.match(/\d+-(\w+)\.xml$/);
			const code = codeMatch ? codeMatch[1].toUpperCase() : item.filename;

			versions[code] = sections;
			console.log(`    ${code}: ${sections.length} sections`);
		} catch (err: any) {
			console.error(`    FAILED: ${err.message}`);
		}
	}

	// Parse vote XMLs
	for (const item of config.downloads) {
		if (item.type !== 'vote-xml') continue;

		const filePath = join(srcDir, item.filename);
		console.log(`  Parsing ${item.filename}...`);

		try {
			const xmlContent = readFileSync(filePath, 'utf-8');

			// Determine Senate vs House from filename
			const isSenate = item.filename.includes('senate');
			const rollMatch = item.filename.match(/(\d+)\.xml$/);
			const rollNumber = rollMatch ? parseInt(rollMatch[1]) : 0;

			let vote: ParsedVote;
			if (isSenate) {
				vote = parseSenateVote(
					xmlContent,
					config.billId.congress,
					1, // session — TODO: extract from discovery
					rollNumber
				);
			} else {
				vote = parseHouseVote(
					xmlContent,
					config.billId.congress,
					1,
					rollNumber
				);
			}

			const key = isSenate ? `senate-${rollNumber}` : `house-${rollNumber}`;
			votes[key] = vote;
			console.log(`    ${vote.chamber}: ${vote.forCount}-${vote.againstCount} (${vote.date})`);
		} catch (err: any) {
			console.error(`    FAILED: ${err.message}`);
		}
	}

	const parsed: ParsedData = { versions, votes };

	const outPath = join(outDir, 'parsed.json');
	writeFileSync(outPath, JSON.stringify(parsed, null, 2), 'utf-8');
	console.log(`\n  Saved: parsed.json`);

	return parsed;
}
