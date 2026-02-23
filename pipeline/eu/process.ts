/**
 * EU AKN Pipeline — Entry Point
 *
 * Usage:
 *   node --experimental-strip-types process.ts "2020/0374(COD)"
 *   node --experimental-strip-types process.ts "2020/0374(COD)" --phase=3
 *   node --experimental-strip-types process.ts "2020/0374(COD)" --phase=5
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import type { DiscoveredConfig, StepResult, CrossCheck } from './types.js';
import { parseProcedure, countTag, extractFRBRuri, celexMatchesUri, pad, fmtTime } from './lib/helpers.js';
import { discover } from './phases/1-discover.js';
import { configure } from './phases/2-configure.js';
import { download } from './phases/3-download.js';
import { convert } from './phases/4-convert.js';
import { generate } from './phases/5-generate.js';
import { enrich } from './phases/6-enrich.js';
import { generateViewerXmls } from './lib/viewer-generator.js';

const BASE_DIR = resolve(import.meta.dirname || '.', '..', 'data', 'eu');

function parseArgs() {
	const args = process.argv.slice(2);
	let procedureCode = '';
	let startPhase = 1;

	for (const arg of args) {
		if (arg.startsWith('--phase=')) {
			startPhase = parseInt(arg.split('=')[1], 10);
			if (isNaN(startPhase) || startPhase < 1 || startPhase > 6) {
				console.error('--phase must be 1-6');
				process.exit(1);
			}
		} else if (!arg.startsWith('--')) {
			procedureCode = arg;
		}
	}

	if (!procedureCode) {
		console.error(
			'Usage: node --experimental-strip-types process.ts "YYYY/NNNN(COD)" [--phase=N]'
		);
		process.exit(1);
	}

	if (!/^\d{4}\/\d+\(\w+\)$/.test(procedureCode)) {
		console.error(`Invalid procedure format: ${procedureCode}. Expected: YYYY/NNNN(COD)`);
		process.exit(1);
	}

	return { procedureCode, startPhase };
}

function loadJson<T>(path: string, label: string): T {
	if (!existsSync(path)) {
		throw new Error(`${label} not found at ${path} — run earlier phases first`);
	}
	return JSON.parse(readFileSync(path, 'utf-8'));
}

async function main() {
	const { procedureCode, startPhase } = parseArgs();
	const proc = parseProcedure(procedureCode);
	if (!proc) {
		console.error(`Invalid procedure: ${procedureCode}`);
		process.exit(1);
	}

	const t0Global = Date.now();
	const allResults: StepResult[] = [];

	console.log(`\n═══════════════════════════════════════════════════`);
	console.log(`  EU AKN Pipeline`);
	console.log(`  Procedure: ${procedureCode}`);
	console.log(`  Starting from phase: ${startPhase}`);
	console.log(`═══════════════════════════════════════════════════\n`);

	// --- Phase 1: Discover ---
	let config: DiscoveredConfig;
	if (startPhase <= 1) {
		console.log('=== Phase 1: DISCOVER ===\n');
		config = await discover(procedureCode);

		// Save discovered config
		const regDir = resolve(BASE_DIR, config.slug);
		const configPath = join(regDir, 'discovered-config.json');
		const { mkdirSync } = await import('node:fs');
		mkdirSync(regDir, { recursive: true });
		writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
		console.log(`  Saved: ${configPath}`);
	} else {
		// Find the regulation directory by looking for discovered-config.json
		// We need to scan BASE_DIR for a matching procedure
		const { readdirSync } = await import('node:fs');
		let found = false;
		if (existsSync(BASE_DIR)) {
			for (const dir of readdirSync(BASE_DIR)) {
				const cfgPath = join(BASE_DIR, dir, 'discovered-config.json');
				if (existsSync(cfgPath)) {
					const cfg = JSON.parse(readFileSync(cfgPath, 'utf-8'));
					if (cfg.procedure === procedureCode) {
						config = cfg;
						found = true;
						console.log(`=== Phase 1: DISCOVER (loading cached) ===`);
						console.log(`  Loaded: ${cfgPath}\n`);
						break;
					}
				}
			}
		}
		if (!found!) {
			console.error(
				`No discovered-config.json found for ${procedureCode}. Run without --phase first.`
			);
			process.exit(1);
		}
	}

	const outDir = BASE_DIR;

	// --- Phase 2: Configure ---
	if (startPhase <= 2) {
		console.log('=== Phase 2: CONFIGURE ===\n');
		configure(config!, outDir);
	} else {
		console.log('=== Phase 2: CONFIGURE (skipped) ===\n');
	}

	// --- Phase 3: Download ---
	if (startPhase <= 3) {
		console.log('=== Phase 3: DOWNLOAD ===\n');
		const results = await download(config!, outDir);
		allResults.push(...results);
	} else {
		console.log('=== Phase 3: DOWNLOAD (skipped) ===\n');
	}

	// --- Phase 4: Convert ---
	if (startPhase <= 4) {
		console.log('=== Phase 4: CONVERT ===\n');
		const results = await convert(config!, outDir);
		allResults.push(...results);
	} else {
		console.log('=== Phase 4: CONVERT (skipped) ===\n');
	}

	// --- Phase 5: Generate ---
	if (startPhase <= 5) {
		console.log('=== Phase 5: GENERATE ===\n');
		const results = generate(config!, outDir);
		allResults.push(...results);
	} else {
		console.log('=== Phase 5: GENERATE (skipped) ===\n');
	}

	// --- Phase 6: Enrich ---
	if (startPhase <= 6) {
		console.log('=== Phase 6: ENRICH ===\n');
		const results = await enrich(config!, outDir);
		allResults.push(...results);
	}

	// --- Regenerate metadata (needs communication + citation from phase 6) ---
	if (startPhase <= 6) {
		const viewerConfigPath = join(resolve(outDir, config!.slug), 'viewer-config.json');
		if (existsSync(viewerConfigPath)) {
			console.log('=== Regenerating metadata ===\n');
			generateViewerXmls(viewerConfigPath);
		}
	}

	// --- Cross-checks ---
	const checks: CrossCheck[] = [];
	const regDir = resolve(outDir, config!.slug);
	const srcDir = join(regDir, 'sources');
	const billPath = join(srcDir, `${config!.billCelex}-bill-akn.xml`);
	const finalAknPath = join(srcDir, `${config!.finalCelex}-akn.xml`);

	if (existsSync(billPath)) {
		const uri = extractFRBRuri(readFileSync(billPath, 'utf-8')) || '';
		const match = celexMatchesUri(config!.billCelex, uri);
		checks.push({
			name: 'Bill CELEX match',
			status: match ? 'PASS' : 'WARN',
			detail: match ? '' : `FRBRuri: ${uri}`
		});
	}

	if (existsSync(finalAknPath)) {
		const uri = extractFRBRuri(readFileSync(finalAknPath, 'utf-8')) || '';
		const match = celexMatchesUri(config!.finalCelex, uri);
		checks.push({
			name: 'Final CELEX match',
			status: match ? 'PASS' : 'WARN',
			detail: match ? '' : `FRBRuri: ${uri}`
		});
	}

	let billArticles = 0,
		finalArticles = 0;
	if (existsSync(billPath)) billArticles = countTag(readFileSync(billPath, 'utf-8'), 'article');
	if (existsSync(finalAknPath))
		finalArticles = countTag(readFileSync(finalAknPath, 'utf-8'), 'article');

	if (billArticles > 0 && finalArticles > 0) {
		checks.push({
			name: `Articles ${billArticles}\u2192${finalArticles}`,
			status: finalArticles >= billArticles ? 'PASS' : 'WARN',
			detail: finalArticles >= billArticles ? '(growth OK)' : 'final < bill'
		});
	}

	const meetingId = `MTG-PL-${config!.voteDate}`;
	checks.push({
		name: 'Vote date',
		status: 'PASS',
		detail: `${meetingId} (auto-discovered)`
	});

	// --- Report ---
	const totalElapsed = Date.now() - t0Global;
	const BAR = '\u2550'.repeat(55);
	const lines: string[] = [];

	lines.push(BAR);
	lines.push(`  EU AKN Pipeline: ${config!.slug}`);
	lines.push(`  Procedure: ${config!.procedure}`);
	lines.push(`  Title: ${config!.title}`);
	lines.push(BAR);

	for (const r of allResults) {
		const status = `[${r.status}]`;
		const stepLabel = `${r.step}. ${r.name}`;
		lines.push(
			`  ${pad(status, 6)}  ${pad(stepLabel, 22)} ${pad(r.detail, 35)} ${fmtTime(r.elapsed)}`
		);
	}

	if (checks.length > 0) {
		lines.push('');
		lines.push('  Cross-checks:');
		for (const c of checks) {
			const detail = c.detail ? ` ${c.detail}` : '';
			lines.push(`  [${c.status}]  ${c.name}${detail}`);
		}
	}

	const pass = allResults.filter((r) => r.status === 'PASS').length;
	const fail = allResults.filter((r) => r.status === 'FAIL').length;
	const warn = allResults.filter((r) => r.status === 'WARN').length;

	lines.push('');
	lines.push(`  RESULT: ${pass} pass, ${fail} fail, ${warn} warn (${fmtTime(totalElapsed)})`);
	lines.push(BAR);

	const report = lines.join('\n');
	console.log(report);

	const reportPath = join(regDir, 'pipeline-report.txt');
	writeFileSync(reportPath, report, 'utf-8');
	console.log(`\nReport saved: ${reportPath}`);

	if (fail > 0) process.exit(1);
}

main();
