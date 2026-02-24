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
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { discover } from './phases/1-discover.js';
import { configure } from './phases/2-configure.js';
import { download } from './phases/3-download.js';
import { parse } from './phases/4-parse.js';
import { generate } from './phases/5-generate.js';
import type { Discovery, Config, ParsedData } from './types.js';
import type { StepResult, PipelineManifest } from '../shared/types.js';
import { loadJson, formatReport } from '../shared/report.js';

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
	const allResults: StepResult[] = [];

	// Phase 1: DISCOVER
	let discovery: Discovery;
	if (startPhase <= 1) {
		const t0 = Date.now();
		discovery = await discover(billId, outDir);
		allResults.push({ step: 1, id: 'discover', name: 'Discover', status: 'PASS', detail: billId, elapsed: Date.now() - t0 });
	} else {
		console.log('\n=== Phase 1: DISCOVER (loading cached) ===');
		discovery = loadJson(join(outDir, 'discovery.json'), 'discovery.json');
	}

	// Phase 2: CONFIGURE
	let config: Config;
	if (startPhase <= 2) {
		const t0 = Date.now();
		config = await configure(discovery, outDir);
		allResults.push({ step: 2, id: 'configure', name: 'Configure', status: 'PASS', detail: config.slug, elapsed: Date.now() - t0 });
	} else {
		console.log('\n=== Phase 2: CONFIGURE (loading cached) ===');
		config = loadJson(join(outDir, 'config.json'), 'config.json');
	}

	// Phase 3: DOWNLOAD
	if (startPhase <= 3) {
		const t0 = Date.now();
		await download(config, outDir);
		allResults.push({ step: 3, id: 'download', name: 'Download', status: 'PASS', detail: '', elapsed: Date.now() - t0 });
	} else {
		console.log('\n=== Phase 3: DOWNLOAD (skipped) ===');
	}

	// Phase 4: PARSE
	let parsed: ParsedData;
	if (startPhase <= 4) {
		const t0 = Date.now();
		parsed = await parse(config, outDir, discovery);
		allResults.push({ step: 4, id: 'parse', name: 'Parse', status: 'PASS', detail: '', elapsed: Date.now() - t0 });
	} else {
		console.log('\n=== Phase 4: PARSE (loading cached) ===');
		parsed = loadJson(join(outDir, 'parsed.json'), 'parsed.json');
	}

	// Phase 5: GENERATE
	const t0Gen = Date.now();
	const generated = await generate(config, discovery, parsed, outDir);
	allResults.push({ step: 5, id: 'generate', name: 'Generate', status: 'PASS', detail: `${generated.length} AKN files`, elapsed: Date.now() - t0Gen });

	const totalElapsed = Date.now() - startTime;
	const aknDir = join(outDir, 'akn');
	const relAknDir = relative(resolve('.'), aknDir);

	const manifest: PipelineManifest = {
		country: 'us',
		slug: config.slug,
		title: config.title,
		aknFiles: generated,
		elapsed: totalElapsed,
		results: allResults
	};

	const report = formatReport(manifest);
	console.log(report);

	const reportPath = join(outDir, 'pipeline-report.txt');
	writeFileSync(reportPath, report, 'utf-8');
	console.log(`\nReport saved: ${reportPath}`);
	console.log(`\n  Generated ${generated.length} AKN files in ${relAknDir}/`);
	console.log(`\n  To register in the viewer, add to src/lib/server/boletin-loader.ts:`);
	console.log(`    BOLETIN_DIRS['us-${config.slug}'] = '${relAknDir}'`);

	const fail = allResults.filter((r) => r.status === 'FAIL').length;
	if (fail > 0) process.exit(1);
}

main().catch((err) => {
	console.error('\nPipeline failed:', err.message || err);
	process.exit(1);
});
