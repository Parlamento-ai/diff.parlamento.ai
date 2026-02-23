#!/usr/bin/env tsx
/**
 * Pipeline CLI — Generate AKN Diff XMLs from a Chilean boletín number
 *
 * Usage:
 *   npx tsx pipeline/cl/process.ts <número-boletín> [--phase=N] [--out=DIR]
 *
 * Examples:
 *   npx tsx pipeline/cl/process.ts 17370
 *   npx tsx pipeline/cl/process.ts 15480 --phase=6
 *   npx tsx pipeline/cl/process.ts 17370 --out=output/ley-17370
 */
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { join, resolve, relative } from 'path';
import { discover } from './phases/1-discover.js';
import { configure } from './phases/2-configure.js';
import { download } from './phases/3-download.js';
import { extract } from './phases/4-extract.js';
import { parse } from './phases/5-parse.js';
import { generate } from './phases/6-generate.js';
import type { Discovery, PipelineConfig } from './types.js';
import type { ParsedDocuments } from './phases/5-parse.js';

// --- CLI argument parsing ---

function parseArgs(): { boletin: string; startPhase: number; outDir: string } {
	const args = process.argv.slice(2);

	if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
		console.log(`
Pipeline Chile — AKN Diff Generator

Usage:
  npx tsx pipeline/cl/process.ts <número-boletín> [options]

Options:
  --phase=N    Start from phase N (1-6, default: 1)
  --out=DIR    Output directory (default: output/<boletín>)
  -h, --help   Show this help

Examples:
  npx tsx pipeline/cl/process.ts 17370
  npx tsx pipeline/cl/process.ts 15480 --phase=6
`);
		process.exit(0);
	}

	const boletin = args[0].replace(/[^\d]/g, ''); // strip non-digits
	if (!boletin) {
		console.error('Error: provide a boletín number (e.g., 17370)');
		process.exit(1);
	}

	let startPhase = 1;
	let outDir = '';

	for (const arg of args.slice(1)) {
		if (arg.startsWith('--phase=')) {
			startPhase = parseInt(arg.split('=')[1], 10);
			if (isNaN(startPhase) || startPhase < 1 || startPhase > 6) {
				console.error('Error: --phase must be 1-6');
				process.exit(1);
			}
		} else if (arg.startsWith('--out=')) {
			outDir = arg.split('=')[1];
		}
	}

	if (!outDir) {
		outDir = join('output', boletin);
	}

	return { boletin, startPhase, outDir: resolve(outDir) };
}

function loadJson<T>(path: string, label: string): T {
	if (!existsSync(path)) {
		throw new Error(`${label} not found at ${path} — run earlier phases first`);
	}
	return JSON.parse(readFileSync(path, 'utf-8'));
}

// --- Main ---

async function main(): Promise<void> {
	const { boletin, startPhase, outDir } = parseArgs();

	console.log(`\n╔══════════════════════════════════════╗`);
	console.log(`║  Pipeline Chile — Boletín ${boletin.padEnd(10)}║`);
	console.log(`╚══════════════════════════════════════╝`);
	console.log(`  Output: ${outDir}`);
	console.log(`  Starting from phase: ${startPhase}`);

	if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

	const startTime = Date.now();

	// Phase 1: DISCOVER
	let discovery: Discovery;
	if (startPhase <= 1) {
		discovery = await discover(boletin, outDir);
	} else {
		console.log('\n=== Phase 1: DISCOVER (loading cached) ===');
		discovery = loadJson(join(outDir, 'discovery.json'), 'discovery.json');
	}

	// Phase 2: CONFIGURE
	let config: PipelineConfig;
	if (startPhase <= 2) {
		config = await configure(discovery, outDir);
	} else {
		console.log('\n=== Phase 2: CONFIGURE (loading cached) ===');
		config = loadJson(join(outDir, 'config.json'), 'config.json');
	}

	// Phase 3: DOWNLOAD
	if (startPhase <= 3) {
		await download(config, outDir);
	} else {
		console.log('\n=== Phase 3: DOWNLOAD (skipped) ===');
	}

	// Phase 4: EXTRACT
	if (startPhase <= 4) {
		await extract(outDir);
	} else {
		console.log('\n=== Phase 4: EXTRACT (skipped) ===');
	}

	// Phase 5: PARSE
	let parsed: ParsedDocuments;
	if (startPhase <= 5) {
		parsed = await parse(config, outDir);
	} else {
		console.log('\n=== Phase 5: PARSE (loading cached) ===');
		parsed = loadJson(join(outDir, 'articles.json'), 'articles.json');
	}

	// Phase 6: GENERATE
	const generated = await generate(config, discovery, parsed, outDir);

	const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
	const aknDir = join(outDir, 'akn');
	const relAknDir = relative(resolve('.'), aknDir);

	console.log(`\n╔══════════════════════════════════════╗`);
	console.log(`║  Pipeline complete (${elapsed}s)`.padEnd(39) + `║`);
	console.log(`╚══════════════════════════════════════╝`);
	console.log(`\n  Generated ${generated.length} AKN files in ${relAknDir}/`);
	console.log(`\n  To register in the viewer, add to src/lib/server/boletin-loader.ts:`);
	console.log(`    '${config.slug}': '${relAknDir}'`);
}

main().catch((err) => {
	console.error('\nPipeline failed:', err.message || err);
	process.exit(1);
});
