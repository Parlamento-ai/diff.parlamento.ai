/**
 * Phase 4: CONVERT — Parse BOE XML into version snapshots
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseTextoToSnapshots } from '../lib/boe-parser.js';
import type { PipelineConfig, VersionSnapshot } from '../types.js';

export function convert(config: PipelineConfig, outDir: string): VersionSnapshot[] {
	console.log('\n=== Phase 4: CONVERT ===\n');

	const textoPath = join(outDir, 'sources', `boe-${config.boeId}-texto.xml`);
	console.log(`  Reading ${textoPath}...`);
	const xml = readFileSync(textoPath, 'utf-8');

	console.log(`  Parsing texto into version snapshots...`);
	const snapshots = parseTextoToSnapshots(xml);

	console.log(`  Found ${snapshots.length} version snapshots:`);
	for (const snap of snapshots) {
		console.log(`    ${snap.boeId}: ${snap.fecha} — ${snap.articles.length} articles`);
	}

	// Save snapshots
	const snapshotsPath = join(outDir, 'sources', 'snapshots.json');
	writeFileSync(snapshotsPath, JSON.stringify(snapshots, null, 2), 'utf-8');
	console.log(`\n  Saved snapshots.json`);

	return snapshots;
}
