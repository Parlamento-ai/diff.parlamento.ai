#!/usr/bin/env tsx
/**
 * Pipeline US — Generate AKN Diff XMLs from a US Congress bill
 *
 * Usage:
 *   npx tsx pipeline/us/process.ts <bill-id> [--phase=N] [--api-key=KEY]
 *
 * Examples:
 *   npx tsx pipeline/us/process.ts s5-119
 *   npx tsx pipeline/us/process.ts s269-119 --phase=5
 *   npx tsx pipeline/us/process.ts hr1-119 --api-key=abc123
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { discover } from './phases/1-discover.js';
import { configure } from './phases/2-configure.js';
import { download } from './phases/3-download.js';
import { parse } from './phases/4-parse.js';
import { generate } from './phases/5-generate.js';
import type { Discovery, Config, ParsedData } from './types.js';

function parseArgs(): { billId: string; startPhase: number; apiKey?: string } {
	const args = process.argv.slice(2);

	if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
		console.log(`
Pipeline US — AKN Diff Generator

Usage:
  npx tsx pipeline/us/process.ts <bill-id> [options]

Bill ID format: <type><number>-<congress>
  s5-119        Senate Bill 5, 119th Congress
  hr1-119       House Resolution 1, 119th Congress
  s269-119      Senate Bill 269, 119th Congress

Options:
  --phase=N      Start from phase N (1-5, default: 1)
  --api-key=KEY  Congress.gov API key (default: DEMO_KEY)
  -h, --help     Show this help
`);
		process.exit(0);
	}

	const billId = args[0];
	let startPhase = 1;
	let apiKey: string | undefined;

	for (const arg of args.slice(1)) {
		if (arg.startsWith('--phase=')) {
			startPhase = parseInt(arg.split('=')[1], 10);
			if (isNaN(startPhase) || startPhase < 1 || startPhase > 5) {
				console.error('Error: --phase must be 1-5');
				process.exit(1);
			}
		} else if (arg.startsWith('--api-key=')) {
			apiKey = arg.split('=')[1];
		}
	}

	return { billId, startPhase, apiKey };
}

function loadJson<T>(path: string, label: string): T {
	if (!existsSync(path)) {
		throw new Error(`${label} not found at ${path} — run earlier phases first`);
	}
	return JSON.parse(readFileSync(path, 'utf-8'));
}

async function main(): Promise<void> {
	const { billId, startPhase, apiKey } = parseArgs();

	if (apiKey) {
		process.env.CONGRESS_API_KEY = apiKey;
	}

	// Output directory: pipeline/data/us/<bill-id>/
	const outDir = resolve('pipeline', 'data', 'us', billId);

	console.log(`\n╔══════════════════════════════════════╗`);
	console.log(`║  Pipeline US — ${billId.toUpperCase().padEnd(20)}║`);
	console.log(`╚══════════════════════════════════════╝`);
	console.log(`  Output: ${outDir}`);
	console.log(`  Starting from phase: ${startPhase}`);

	if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

	const startTime = Date.now();

	// Phase 1: DISCOVER
	let discovery: Discovery;
	if (startPhase <= 1) {
		discovery = await discover(billId, outDir);
	} else {
		console.log('\n=== Phase 1: DISCOVER (loading cached) ===');
		discovery = loadJson(join(outDir, 'discovery.json'), 'discovery.json');
	}

	// Phase 2: CONFIGURE
	let config: Config;
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

	// Phase 4: PARSE
	let parsed: ParsedData;
	if (startPhase <= 4) {
		parsed = await parse(config, outDir);
	} else {
		console.log('\n=== Phase 4: PARSE (loading cached) ===');
		parsed = loadJson(join(outDir, 'parsed.json'), 'parsed.json');
	}

	// Phase 5: GENERATE
	const generated = await generate(config, discovery, parsed, outDir);

	const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
	const aknDir = join(outDir, 'akn');
	const relAknDir = relative(resolve('.'), aknDir);

	console.log(`\n╔══════════════════════════════════════╗`);
	console.log(`║  Pipeline complete (${elapsed}s)`.padEnd(39) + `║`);
	console.log(`╚══════════════════════════════════════╝`);
	console.log(`\n  Generated ${generated.length} AKN files in ${relAknDir}/`);
	console.log(`\n  To register in the viewer, add to src/lib/server/boletin-loader.ts:`);
	console.log(`    BOLETIN_DIRS['us-${config.slug}'] = '${relAknDir}'`);
}

main().catch((err) => {
	console.error('\nPipeline failed:', err.message || err);
	process.exit(1);
});
