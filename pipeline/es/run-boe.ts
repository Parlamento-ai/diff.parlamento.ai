/**
 * Pipeline ES BOE — Generate AKN Diff XMLs from a Spanish BOE ID
 *
 * Exported as a function for the unified dispatcher (process.ts).
 *
 * Phases:
 *   1. Discover   — metadata + analisis from BOE API
 *   2. Download   — full consolidated text
 *   3. Convert    — BOE XML → version snapshots
 *   4. Configure  — build timeline from snapshots + analisis
 *   5. Generate   — AKN XML files
 *   6. Enrich     — Congreso vote data
 */
import { existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { discover } from './phases/1-discover.js';
import { configure } from './phases/2-configure.js';
import { download } from './phases/3-download.js';
import { convert } from './phases/4-convert.js';
import { generate } from './phases/5-generate.js';
import { enrich } from './phases/6-enrich.js';
import type { Discovery, PipelineConfig, VersionSnapshot } from './types.js';
import type { StepResult, PipelineManifest } from '../shared/types.js';
import { loadJson, formatReport } from '../shared/report.js';
import { validateSnapshots } from './lib/boe-parser.js';

export async function runBOE(boeId: string, startPhase: number): Promise<void> {
	// Directorio temporal con boeId; se renombra al slug en fase 4
	let outDir = resolve('pipeline', 'data', 'es', boeId);

	console.log(`\n╔══════════════════════════════════════╗`);
	console.log(`║  Pipeline BOE — ${boeId.padEnd(20)}║`);
	console.log(`╚══════════════════════════════════════╝`);
	console.log(`  Starting from phase: ${startPhase}`);

	if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

	const startTime = Date.now();
	const allResults: StepResult[] = [];

	// Phase 1: DISCOVER — metadata + analisis
	let discovery: Discovery;
	if (startPhase <= 1) {
		const t0 = Date.now();
		discovery = await discover(boeId, outDir);
		allResults.push({ step: 1, id: 'discover', name: 'Discover', status: 'PASS', detail: boeId, elapsed: Date.now() - t0 });
	} else {
		console.log('\n=== Phase 1: DISCOVER (loading cached) ===');
		discovery = loadJson(join(outDir, 'discovery.json'), 'discovery.json');
	}

	// Phase 2: DOWNLOAD — texto completo
	if (startPhase <= 2) {
		const t0 = Date.now();
		await downloadTexto(boeId, outDir);
		allResults.push({ step: 2, id: 'download', name: 'Download', status: 'PASS', detail: 'texto + metadata', elapsed: Date.now() - t0 });
	} else {
		console.log('\n=== Phase 2: DOWNLOAD (skipped) ===');
	}

	// Phase 3: CONVERT — BOE XML → snapshots
	let snapshots: VersionSnapshot[];
	if (startPhase <= 3) {
		const t0 = Date.now();
		snapshots = convertTexto(boeId, outDir);
		allResults.push({ step: 3, id: 'convert', name: 'Convert', status: 'PASS', detail: `${snapshots.length} snapshots`, elapsed: Date.now() - t0 });
	} else {
		console.log('\n=== Phase 3: CONVERT (loading cached) ===');
		snapshots = loadJson(join(outDir, 'sources', 'snapshots.json'), 'snapshots.json');
	}

	// Phase 4: CONFIGURE — timeline desde snapshots + analisis
	let config: PipelineConfig;
	if (startPhase <= 4) {
		const t0 = Date.now();
		config = configure(discovery, outDir, snapshots);

		// Intentar renombrar directorio al slug (puede fallar en OneDrive/Windows)
		const slugDir = resolve('pipeline', 'data', 'es', config.slug);
		if (slugDir !== outDir) {
			try {
				if (!existsSync(slugDir)) {
					renameSync(outDir, slugDir);
					outDir = slugDir;
					console.log(`  Renamed output dir to ${config.slug}`);
				} else {
					outDir = slugDir;
				}
			} catch {
				console.log(`  Using dir name: ${boeId} (rename skipped)`);
			}
		}

		allResults.push({ step: 4, id: 'configure', name: 'Configure', status: 'PASS', detail: config.slug, elapsed: Date.now() - t0 });
	} else {
		console.log('\n=== Phase 4: CONFIGURE (loading cached) ===');
		config = loadJson(join(outDir, 'config.json'), 'config.json');
	}

	console.log(`  Output: ${outDir}`);

	// VALIDACION OBLIGATORIA — si falla, no se generan AKN
	const t0Val = Date.now();
	const validationErrors = validateSnapshots(snapshots);
	if (validationErrors.length > 0) {
		console.log('\n=== VALIDACION DE INTEGRIDAD ===\n');
		for (const err of validationErrors) {
			console.error(`  [ERROR] ${err.detail}`);
		}
		console.error(`\n  ${validationErrors.length} errores de integridad encontrados.`);
		console.error('  Pipeline ABORTADA — los datos no son confiables para esta ley.');
		console.error('  Los AKN NO fueron generados.\n');
		allResults.push({ step: 0, id: 'validate', name: 'Validate', status: 'FAIL', detail: `${validationErrors.length} errores`, elapsed: Date.now() - t0Val });

		const totalElapsed = Date.now() - startTime;
		const manifest: PipelineManifest = {
			country: 'es',
			slug: config.slug,
			title: config.titulo,
			aknFiles: [],
			elapsed: totalElapsed,
			results: allResults
		};
		const report = formatReport(manifest);
		console.log(report);
		const reportPath = join(outDir, 'pipeline-report.txt');
		writeFileSync(reportPath, report, 'utf-8');
		process.exit(1);
	}
	allResults.push({ step: 0, id: 'validate', name: 'Validate', status: 'PASS', detail: `${snapshots.length} snapshots OK`, elapsed: Date.now() - t0Val });
	console.log(`\n  Validacion: ${snapshots.length} snapshots, 0 errores de integridad`);

	// Phase 5: GENERATE — AKN XMLs
	const t0Gen = Date.now();
	const generated = generate(config, snapshots, outDir);
	allResults.push({ step: 5, id: 'generate', name: 'Generate', status: 'PASS', detail: `${generated.length} AKN files`, elapsed: Date.now() - t0Gen });

	// Phase 6: ENRICH — Congreso vote data
	const t0Enrich = Date.now();
	await enrich(config, outDir);
	allResults.push({ step: 6, id: 'enrich', name: 'Enrich', status: 'PASS', detail: 'vote enrichment', elapsed: Date.now() - t0Enrich });

	const totalElapsed = Date.now() - startTime;
	const aknDir = join(outDir, 'akn');
	const relAknDir = relative(resolve('.'), aknDir);

	const manifest: PipelineManifest = {
		country: 'es',
		slug: config.slug,
		title: config.titulo,
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

	const fail = allResults.filter((r) => r.status === 'FAIL').length;
	if (fail > 0) process.exit(1);
}

// ── Wrappers que no dependen de PipelineConfig ──────────────────────────

async function downloadTexto(boeId: string, outDir: string): Promise<void> {
	const minConfig = { boeId } as PipelineConfig;
	await download(minConfig, outDir);
}

function convertTexto(boeId: string, outDir: string): VersionSnapshot[] {
	const minConfig = { boeId } as PipelineConfig;
	return convert(minConfig, outDir);
}
