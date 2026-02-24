/**
 * Phase 2: CONFIGURE — Build timeline from discovery data
 *
 * No interactive input needed (unlike CL). The BOE provides everything.
 * Uses snapshots (from Phase 4) to get accurate dates when análisis lacks them.
 * If snapshots aren't available yet, builds timeline from análisis alone.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Discovery, PipelineConfig, TimelineEntry, VersionSnapshot } from '../types.js';

export function configure(
	discovery: Discovery,
	outDir: string,
	snapshots?: VersionSnapshot[]
): PipelineConfig {
	console.log('\n=== Phase 2: CONFIGURE ===\n');

	const { metadata, modificadaPor } = discovery;

	// Extract ELI path from full URL: https://www.boe.es/eli/es/lo/2018/12/05/3 → /es/lo/2018/12/05/3
	const eli =
		metadata.urlEli.replace(/^https?:\/\/www\.boe\.es\/eli/, '') ||
		`/es/${metadata.rango.toLowerCase().replace(/\s+/g, '')}`;

	const slug = generateSlug(metadata.rango, metadata.numeroOficial, metadata.titulo);

	// Build timeline
	const timeline: TimelineEntry[] = [];

	if (snapshots && snapshots.length > 1) {
		// Mejor fuente: construir desde snapshots reales (tienen fechas exactas)
		buildTimelineFromSnapshots(timeline, snapshots, metadata, modificadaPor);
	} else {
		// Fallback: desde análisis
		buildTimelineFromAnalisis(timeline, metadata, modificadaPor);
	}

	console.log(`  Slug: ${slug}`);
	console.log(`  ELI: ${eli}`);
	console.log(`  Timeline: ${timeline.length} entries`);
	for (const t of timeline) {
		console.log(`    ${t.slug}: ${t.type} — ${t.date} — ${t.label.slice(0, 60)}`);
	}

	const config: PipelineConfig = {
		boeId: discovery.boeId,
		slug,
		titulo: metadata.titulo,
		rango: metadata.rango,
		eli,
		timeline
	};

	writeFileSync(join(outDir, 'config.json'), JSON.stringify(config, null, 2), 'utf-8');
	console.log(`\n  Saved config.json`);

	return config;
}

function buildTimelineFromSnapshots(
	timeline: TimelineEntry[],
	snapshots: VersionSnapshot[],
	metadata: Discovery['metadata'],
	modificadaPor: Discovery['modificadaPor']
): void {
	// Primer snapshot = ley original
	timeline.push({
		slug: 'act-original',
		label: `${metadata.rango} ${metadata.numeroOficial} (original)`,
		date: snapshots[0].fecha || metadata.fechaVigencia,
		type: 'act-original'
	});

	// Snapshots intermedios = amendments
	for (let i = 1; i < snapshots.length; i++) {
		const snap = snapshots[i];
		// Buscar label en análisis
		const ley = modificadaPor.find((l) => l.boeId === snap.boeId);
		const label = ley
			? `Modificada por ${ley.texto.slice(0, 80)}`
			: `Modificacion ${snap.boeId}`;

		timeline.push({
			slug: `amendment-${i}`,
			label,
			date: snap.fecha,
			type: 'amendment',
			modifyingLaw: snap.boeId
		});
	}

	// Ultimo snapshot = version vigente
	timeline.push({
		slug: 'act-final',
		label: `${metadata.rango} ${metadata.numeroOficial} (vigente)`,
		date: snapshots[snapshots.length - 1].fecha,
		type: 'act-final'
	});
}

function buildTimelineFromAnalisis(
	timeline: TimelineEntry[],
	metadata: Discovery['metadata'],
	modificadaPor: Discovery['modificadaPor']
): void {
	// Filtrar solo MODIFICA/AÑADE
	const sorted = [...modificadaPor]
		.filter((l) => {
			const r = l.relacion.toUpperCase();
			return r.includes('MODIFICA') || r.includes('ANADE') || r.includes('AÑADE');
		})
		.sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));

	if (sorted.length === 0) {
		timeline.push({
			slug: 'act-original',
			label: `${metadata.rango} ${metadata.numeroOficial} (original)`,
			date: metadata.fechaVigencia,
			type: 'act-original'
		});
	} else {
		timeline.push({
			slug: 'act-original',
			label: `${metadata.rango} ${metadata.numeroOficial} (original)`,
			date: metadata.fechaVigencia,
			type: 'act-original'
		});

		for (let i = 0; i < sorted.length; i++) {
			const ley = sorted[i];
			timeline.push({
				slug: `amendment-${i + 1}`,
				label: `Modificada por ${ley.texto.slice(0, 80)}`,
				date: ley.fecha || metadata.fechaVigencia,
				type: 'amendment',
				modifyingLaw: ley.boeId
			});
		}

		timeline.push({
			slug: 'act-final',
			label: `${metadata.rango} ${metadata.numeroOficial} (vigente)`,
			date: new Date().toISOString().slice(0, 10),
			type: 'act-final'
		});
	}
}

function generateSlug(rango: string, numero: string, titulo: string): string {
	const rangoMap: Record<string, string> = {
		'ley organica': 'lo',
		'ley orgánica': 'lo',
		ley: 'ley',
		'real decreto': 'rd',
		'real decreto legislativo': 'rdl',
		'real decreto-ley': 'rdley'
	};
	const rangoSlug = rangoMap[rango.toLowerCase()] || rango.toLowerCase().replace(/\s+/g, '-');

	const numSlug = numero.replace(/\//g, '-');

	// Extraer palabras significativas después del "de <fecha>, de "
	// "Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos..." → "proteccion-datos"
	const STOP_WORDS = new Set([
		'del', 'los', 'las', 'por', 'que', 'para', 'con', 'una', 'ley', 'real',
		'decreto', 'organica', 'sobre', 'enero', 'febrero', 'marzo',
		'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre',
		'noviembre', 'diciembre', 'garantia', 'derechos', 'disposicion'
	]);
	const afterDateMatch = titulo.match(/,\s*de\s+\d+\s+de\s+\w+,\s*de\s+(.*)/i);
	const titlePart = afterDateMatch ? afterDateMatch[1] : titulo;
	const titleSlug = titlePart
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z\s]/g, '')
		.split(/\s+/)
		.filter((w) => w.length > 2 && !STOP_WORDS.has(w))
		.slice(0, 3)
		.join('-');

	return `${rangoSlug}-${numSlug}${titleSlug ? '-' + titleSlug : ''}`;
}
