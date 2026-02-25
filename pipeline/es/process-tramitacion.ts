#!/usr/bin/env tsx
/**
 * Pipeline ES Tramitación — Generate AKN Diff XMLs from a Congreso expediente
 *
 * Unlike the BOE pipeline (published laws), this handles bills still
 * in parliamentary process, sourcing text from BOCG PDFs.
 *
 * Usage:
 *   npx tsx pipeline/es/process-tramitacion.ts <expediente> [--phase=N]
 *
 * Examples:
 *   npx tsx pipeline/es/process-tramitacion.ts 121/000036
 *   npx tsx pipeline/es/process-tramitacion.ts 121/000036 --phase=3
 *
 * Phases:
 *   1. Discover   — Congreso JSON: metadata + BOCG URLs
 *   2. Download   — BOCG PDFs + pdftotext
 *   3. Convert    — Parse text → version snapshots
 *   4. Generate   — AKN XML files
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { discoverProyecto } from './lib/congreso-opendata.js';
import { downloadBocgs, type DownloadedBocg } from './lib/bocg-downloader.js';
import { buildSnapshots, type TramitacionSnapshot } from './lib/bocg-parser.js';
import { buildActXml, buildAmendmentXml } from './lib/akn-builder.js';
import type { ESFRBRMeta } from './lib/akn-builder.js';
import { computeChangeSet } from '../shared/changeset.js';
import type { StepResult, PipelineManifest } from '../shared/types.js';
import { loadJson, formatReport } from '../shared/report.js';
import type { TramitacionDiscovery, TramitacionConfig, TramitacionTimelineEntry } from './types-tramitacion.js';

function parseArgs(): { expediente: string; startPhase: number } {
	const args = process.argv.slice(2);

	if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
		console.log(`
Pipeline Espana Tramitación — AKN Diff Generator for bills in progress

Usage:
  npx tsx pipeline/es/process-tramitacion.ts <expediente> [options]

Expediente format: 121/NNNNNN
  121/000036   Proyecto de Ley de Economía Social

Options:
  --phase=N    Start from phase N (1-4, default: 1)
  -h, --help   Show this help
`);
		process.exit(0);
	}

	const expediente = args[0];
	let startPhase = 1;

	for (const arg of args.slice(1)) {
		if (arg.startsWith('--phase=')) {
			startPhase = parseInt(arg.split('=')[1], 10);
			if (isNaN(startPhase) || startPhase < 1 || startPhase > 4) {
				console.error('Error: --phase must be 1-4');
				process.exit(1);
			}
		}
	}

	return { expediente, startPhase };
}

/**
 * Generate a filesystem-safe slug from the expediente and title.
 * "121/000036" + "Proyecto de Ley de Economía Social..." → "121-000036-economia-social"
 */
function generateSlug(expediente: string, titulo: string): string {
	// Strip /0000 suffix from expediente: "121/000036/0000" → "121/000036"
	const cleanExp = expediente.replace(/\/0000$/, '');
	const expSlug = cleanExp.replace(/\//g, '-');

	const STOP_WORDS = new Set([
		'de', 'del', 'la', 'el', 'los', 'las', 'por', 'que', 'para', 'con',
		'una', 'ley', 'proyecto', 'sobre', 'general', 'orgánica', 'organica'
	]);

	const titleSlug = titulo
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z\s]/g, '')
		.split(/\s+/)
		.filter((w) => w.length > 2 && !STOP_WORDS.has(w))
		.slice(0, 3)
		.join('-');

	return `${expSlug}${titleSlug ? '-' + titleSlug : ''}`;
}

/**
 * Build timeline and config from discovery + snapshots.
 */
function buildConfig(
	discovery: TramitacionDiscovery,
	snapshots: TramitacionSnapshot[]
): TramitacionConfig {
	const slug = generateSlug(discovery.expediente, discovery.titulo);
	const timeline: TramitacionTimelineEntry[] = [];

	for (let i = 0; i < snapshots.length; i++) {
		const snap = snapshots[i];
		const isFirst = i === 0;

		timeline.push({
			slug: isFirst ? 'bill-original' : `amendment-${snap.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
			label: snap.label,
			date: snap.date || discovery.fechaPresentacion,
			type: isFirst ? 'bill' : 'amendment',
			bocgPhase: snap.phase,
			sourceUrl: snap.sourceUrl
		});
	}

	return {
		expediente: discovery.expediente,
		slug,
		titulo: discovery.titulo,
		timeline
	};
}

/**
 * Phase 4: GENERATE — produce AKN XML files from snapshots.
 */
function generate(
	config: TramitacionConfig,
	snapshots: TramitacionSnapshot[],
	outDir: string
): string[] {
	console.log('\n=== Phase 4: GENERATE ===\n');

	const aknDir = join(outDir, 'akn');
	if (!existsSync(aknDir)) mkdirSync(aknDir, { recursive: true });

	const generated: string[] = [];
	const frbrBase = `/es/congreso/proyecto/${config.slug}`;

	for (let i = 0; i < config.timeline.length; i++) {
		const entry = config.timeline[i];
		const num = String(i + 1).padStart(2, '0');
		const fileName = `${num}-${entry.slug}.xml`;

		console.log(`  Generating ${fileName} (${entry.label})...`);

		const meta: ESFRBRMeta = {
			eli: frbrBase,
			date: entry.date || new Date().toISOString().slice(0, 10),
			dateName: entry.type === 'bill' ? 'presentacion' : 'modificacion',
			authorHref: '/es/congreso'
		};

		let xml: string;

		if (entry.type === 'bill') {
			// First snapshot → build act XML (the original bill)
			const snap = snapshots[0];
			if (!snap) {
				console.warn(`    WARNING: No snapshot for bill, skipping`);
				continue;
			}
			xml = buildActXml(
				snap.articles,
				meta,
				`${config.slug}-original`,
				config.titulo
			);
			console.log(`    ${snap.articles.length} articles`);
		} else {
			// Amendment — compute changeset between previous and current
			const snapIdx = config.timeline.slice(0, i + 1).filter((e) => e.type === 'amendment').length;
			const prevSnap = snapshots[snapIdx - 1];
			const currSnap = snapshots[snapIdx];

			if (!prevSnap || !currSnap) {
				console.warn(`    WARNING: Missing snapshots for amendment, skipping`);
				continue;
			}

			const oldArticles = prevSnap.articles.map((a) => ({
				eId: a.eId, num: a.num, heading: a.heading, content: a.content
			}));
			const newArticles = currSnap.articles.map((a) => ({
				eId: a.eId, num: a.num, heading: a.heading, content: a.content
			}));

			const changeResult = computeChangeSet(oldArticles, newArticles);
			console.log(
				`    Changes: ${changeResult.stats.substituted} sub, ${changeResult.stats.inserted} ins, ${changeResult.stats.repealed} rep`
			);

			if (changeResult.changes.length === 0) {
				console.log(`    No changes detected, skipping`);
				continue;
			}

			const prevDate = prevSnap.date || entry.date;
			const baseUri = `${frbrBase}/spa@${prevDate}`;
			const resultUri = `${frbrBase}/spa@${entry.date}`;

			xml = buildAmendmentXml(
				changeResult.changes,
				meta,
				`${config.slug}-${entry.slug}`,
				entry.label,
				`Modificación de ${config.titulo}`,
				baseUri,
				resultUri
			);
		}

		const outPath = join(aknDir, fileName);
		writeFileSync(outPath, xml, 'utf-8');
		console.log(`    -> ${fileName} (${xml.length} chars)`);
		generated.push(fileName);
	}

	console.log(`\n  Generated ${generated.length} AKN files in ${aknDir}`);
	return generated;
}

async function main(): Promise<void> {
	const { expediente, startPhase } = parseArgs();

	const slug = expediente.replace(/\//g, '-');
	const outDir = resolve('pipeline', 'data', 'es', slug);

	console.log(`\n╔══════════════════════════════════════════════╗`);
	console.log(`║  Pipeline Tramitación — ${expediente.padEnd(20)}║`);
	console.log(`╚══════════════════════════════════════════════╝`);
	console.log(`  Starting from phase: ${startPhase}`);

	if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

	const startTime = Date.now();
	const allResults: StepResult[] = [];

	// Phase 1: DISCOVER — Congreso JSON metadata + BOCG URLs
	let discovery: TramitacionDiscovery;
	if (startPhase <= 1) {
		const t0 = Date.now();
		const result = await discoverProyecto(expediente);
		discovery = result.discovery;

		// Save artifacts
		const sourcesDir = join(outDir, 'sources');
		if (!existsSync(sourcesDir)) mkdirSync(sourcesDir, { recursive: true });
		writeFileSync(
			join(sourcesDir, 'congreso-proyectos.json'),
			JSON.stringify(result.rawJson, null, 2),
			'utf-8'
		);
		writeFileSync(
			join(outDir, 'discovery.json'),
			JSON.stringify(discovery, null, 2),
			'utf-8'
		);
		console.log(`\n  Saved discovery.json`);

		allResults.push({
			step: 1, id: 'discover', name: 'Discover', status: 'PASS',
			detail: `${discovery.bocgUrls.length} BOCGs`, elapsed: Date.now() - t0
		});
	} else {
		console.log('\n=== Phase 1: DISCOVER (loading cached) ===');
		discovery = loadJson(join(outDir, 'discovery.json'), 'discovery.json');
	}

	// Phase 2: DOWNLOAD — BOCG PDFs + pdftotext
	let downloaded: DownloadedBocg[];
	if (startPhase <= 2) {
		const t0 = Date.now();
		downloaded = await downloadBocgs(discovery.bocgUrls, outDir);
		allResults.push({
			step: 2, id: 'download', name: 'Download', status: 'PASS',
			detail: `${downloaded.length} PDFs`, elapsed: Date.now() - t0
		});
	} else {
		console.log('\n=== Phase 2: DOWNLOAD (skipped — reusing cached text) ===');
		// Reconstruct from cached text files
		downloaded = [];
		for (const bocg of discovery.bocgUrls) {
			const fileName = bocg.url.split('/').pop() || '';
			const baseName = fileName.replace(/\.PDF$/i, '').toLowerCase();
			const txtPath = join(outDir, 'sources', `${baseName}.txt`);
			if (existsSync(txtPath)) {
				const { readFileSync } = await import('node:fs');
				downloaded.push({
					phase: bocg.phase,
					label: bocg.label,
					pdfPath: join(outDir, 'sources', `${baseName}.pdf`),
					txtPath,
					text: readFileSync(txtPath, 'utf-8'),
					sourceUrl: bocg.url
				});
			}
		}
	}

	// Phase 3: CONVERT — Parse text → version snapshots
	let snapshots: TramitacionSnapshot[];
	if (startPhase <= 3) {
		const t0 = Date.now();
		snapshots = buildSnapshots(downloaded);

		if (snapshots.length === 0) {
			console.error('\n  ERROR: No valid snapshots could be built from BOCG text.');
			console.error('  Check the PDF text files in sources/ for parsing issues.');
			allResults.push({
				step: 3, id: 'convert', name: 'Convert', status: 'FAIL',
				detail: '0 snapshots', elapsed: Date.now() - t0
			});

			writeReport(outDir, expediente, discovery.titulo, allResults, startTime, []);
			process.exit(1);
		}

		// Save snapshots
		writeFileSync(
			join(outDir, 'sources', 'snapshots.json'),
			JSON.stringify(snapshots, null, 2),
			'utf-8'
		);
		console.log(`  Saved snapshots.json`);

		allResults.push({
			step: 3, id: 'convert', name: 'Convert', status: 'PASS',
			detail: `${snapshots.length} snapshots`, elapsed: Date.now() - t0
		});
	} else {
		console.log('\n=== Phase 3: CONVERT (loading cached) ===');
		snapshots = loadJson(join(outDir, 'sources', 'snapshots.json'), 'snapshots.json');
	}

	// Build config from discovery + snapshots
	const config = buildConfig(discovery, snapshots);
	writeFileSync(join(outDir, 'config.json'), JSON.stringify(config, null, 2), 'utf-8');

	// Rename directory to slug if different
	const slugDir = resolve('pipeline', 'data', 'es', config.slug);
	if (slugDir !== outDir && !existsSync(slugDir)) {
		try {
			const { renameSync } = await import('node:fs');
			renameSync(outDir, slugDir);
			console.log(`  Renamed output dir to ${config.slug}`);
		} catch {
			console.log(`  Using dir name: ${slug} (rename skipped)`);
		}
	}
	const finalOutDir = existsSync(slugDir) ? slugDir : outDir;

	console.log(`  Output: ${finalOutDir}`);

	// Phase 4: GENERATE — AKN XML files
	const t0Gen = Date.now();
	const generated = generate(config, snapshots, finalOutDir);
	allResults.push({
		step: 4, id: 'generate', name: 'Generate', status: 'PASS',
		detail: `${generated.length} AKN files`, elapsed: Date.now() - t0Gen
	});

	writeReport(finalOutDir, config.slug, config.titulo, allResults, startTime, generated);
}

function writeReport(
	outDir: string,
	slug: string,
	titulo: string,
	results: StepResult[],
	startTime: number,
	aknFiles: string[]
): void {
	const totalElapsed = Date.now() - startTime;
	const manifest: PipelineManifest = {
		country: 'es-tramitacion',
		slug,
		title: titulo,
		aknFiles,
		elapsed: totalElapsed,
		results
	};

	const report = formatReport(manifest);
	console.log(report);

	const reportPath = join(outDir, 'pipeline-report.txt');
	writeFileSync(reportPath, report, 'utf-8');
	console.log(`\nReport saved: ${reportPath}`);

	const relAknDir = relative(resolve('.'), join(outDir, 'akn'));
	console.log(`\n  Generated ${aknFiles.length} AKN files in ${relAknDir}/`);

	const fail = results.filter((r) => r.status === 'FAIL').length;
	if (fail > 0) process.exit(1);
}

main().catch((err) => {
	console.error('\nPipeline failed:', err.message || err);
	process.exit(1);
});
