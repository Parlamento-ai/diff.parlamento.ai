import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseAknDocument } from './xml-parser';
import type { AknDocument, Boletin, TimelineEntry } from '$lib/types';

const RECETAS_DIR = 'research/2026-02-01/akndiff-poc';
const LEY_21735_DIR = 'research/2026-02-18/ley-21735/akn';
const LEY_18045_DIR = 'research/2026-02-18/ley-18045/akn';
const LEY_21670_DIR = 'research/2026-02-19/ley-21670/akn';

const BOLETIN_DIRS: Record<string, string> = {
	// Ejemplos ficticios (recetas)
	'empanadas-de-pino': `${RECETAS_DIR}/receta-empanadas`,
	'feijoada-carioca': `${RECETAS_DIR}/receta-feijoada`,
	'milanesa-argentina': `${RECETAS_DIR}/receta-milanesa`,
	'pan-de-campo': `${RECETAS_DIR}/receta-pan`,
	'paella-valenciana': `${RECETAS_DIR}/receta-paella`,
	'ratatouille-nicoise': `${RECETAS_DIR}/receta-ratatouille`,
	// Ley 21.735 - Reforma de Pensiones (legislación real chilena)
	'ley-21735-boletin': `${LEY_21735_DIR}/boletin`,
	'ley-21735-dl-3500': `${LEY_21735_DIR}/dl-3500`,
	'ley-21735-dfl-5-2003': `${LEY_21735_DIR}/dfl-5-2003`,
	'ley-21735-ley-18045': `${LEY_21735_DIR}/ley-18045`,
	'ley-21735-dfl-28': `${LEY_21735_DIR}/dfl-28`,
	'ley-21735-ley-20880': `${LEY_21735_DIR}/ley-20880`,
	// Ley 18.045 — Historia de versiones (1981-2025)
	'ley-18045-historia': LEY_18045_DIR,
	// Ley 21.670 — Porte de armas aspirantes policiales (Boletín 15.995-02)
	'ley-21670-boletin': LEY_21670_DIR
};

const SLUG_MAP: Record<string, string> = {
	'01-act-original.xml': 'original',
	'02-bill.xml': 'bill',
	'03-amendment-1.xml': 'amendment-1',
	'04-amendment-2.xml': 'amendment-2',
	'05-amendment-3.xml': 'amendment-3',
	'06-amendment-4.xml': 'amendment-4',
	'07-amendment-5.xml': 'amendment-5',
	'03-act-final.xml': 'final',
	'04-act-final.xml': 'final',
	'05-act-final.xml': 'final',
	'06-act-final.xml': 'final',
	'07-act-final.xml': 'final',
	'08-act-final.xml': 'final'
};

function fileToSlug(fileName: string): string {
	return SLUG_MAP[fileName] || fileName.replace('.xml', '').replace(/^\d+-/, '');
}

function slugToLabel(slug: string, boletinSlug?: string): string {
	// Boletín 15.480-13: bill-level timeline (original = Mensaje)
	if (boletinSlug === 'ley-21735-boletin') {
		const boletinLabels: Record<string, string> = {
			original: 'Mensaje Presidencial',
			bill: '1er Trámite: C. Diputados',
			'amendment-1': '2do Trámite: Senado',
			'amendment-2': '3er Trámite: C. Diputados',
			'amendment-3': 'Tribunal Constitucional',
			final: 'Ley Promulgada'
		};
		return boletinLabels[slug] || slug;
	}
	// Boletín 15.995-02 (Ley 21.670): complete legislative process
	if (boletinSlug === 'ley-21670-boletin') {
		const ley21670Labels: Record<string, string> = {
			original: 'Ley 17.798 (pre-reforma)',
			bill: 'Moción Original',
			'amendment-1': '1er Trámite: C. Diputados',
			'amendment-2': '2do Trámite: Senado',
			final: 'Ley 21.670 Publicada'
		};
		return ley21670Labels[slug] || slug;
	}
	// Ley 21.735 per-norm timelines (original = pre-reform law)
	if (boletinSlug?.startsWith('ley-21735-')) {
		const leyLabels: Record<string, string> = {
			original: 'Ley Original',
			bill: 'Mensaje Presidencial',
			'amendment-1': '1er Trámite: C. Diputados',
			'amendment-2': '2do Trámite: Senado',
			'amendment-3': '3er Trámite: C. Diputados',
			'amendment-4': 'Tribunal Constitucional',
			final: 'Ley Promulgada'
		};
		return leyLabels[slug] || slug;
	}
	const labels: Record<string, string> = {
		original: 'Ley Original',
		bill: 'Proyecto de Ley',
		'amendment-1': 'Indicación 1',
		'amendment-2': 'Indicación 2',
		'amendment-3': 'Indicación 3',
		'amendment-4': 'Indicación 4',
		'amendment-5': 'Indicación 5',
		final: 'Ley Promulgada'
	};
	return labels[slug] || slug;
}

function buildTimeline(documents: AknDocument[], boletinSlug?: string): TimelineEntry[] {
	return documents.map((doc) => {
		const slug = fileToSlug(doc.fileName);
		const mappedLabel = slugToLabel(slug, boletinSlug);
		// If slugToLabel returned the raw slug (no mapping), use docTitle from XML
		const label = mappedLabel === slug ? (doc.prefaceTitle || slug) : mappedLabel;
		const entry: TimelineEntry = {
			slug,
			label,
			date: doc.frbr.date,
			type: doc.type,
			author: doc.frbr.authorLabel,
			fileName: doc.fileName
		};
		if (doc.changeSet?.vote) {
			entry.voteResult = doc.changeSet.vote.result;
		}
		return entry;
	});
}

export async function loadBoletin(slug: string): Promise<Boletin> {
	const dirName = BOLETIN_DIRS[slug];
	if (!dirName) {
		throw new Error(`Unknown boletin: ${slug}`);
	}

	const dirPath = join(process.cwd(), dirName);
	const files = await readdir(dirPath);
	const xmlFiles = files.filter((f) => f.endsWith('.xml')).sort();

	const documents: AknDocument[] = [];
	for (const file of xmlFiles) {
		const xml = await readFile(join(dirPath, file), 'utf-8');
		documents.push(parseAknDocument(xml, file));
	}

	// Get title from original act
	const original = documents.find((d) => d.type === 'act' && fileToSlug(d.fileName) === 'original');
	const title = original?.prefaceTitle || slug;

	return {
		slug,
		title,
		documents,
		timeline: buildTimeline(documents, slug)
	};
}

export async function listBoletines(): Promise<{ slug: string; title: string; documentCount: number }[]> {
	const result: { slug: string; title: string; documentCount: number }[] = [];

	for (const [slug, dirName] of Object.entries(BOLETIN_DIRS)) {
		const dirPath = join(process.cwd(), dirName);
		const files = await readdir(dirPath);
		const xmlFiles = files.filter((f) => f.endsWith('.xml'));

		// Read original to get title
		const originalFile = xmlFiles.find((f) => f.startsWith('01-'));
		let title = slug;
		if (originalFile) {
			const xml = await readFile(join(dirPath, originalFile), 'utf-8');
			const doc = parseAknDocument(xml, originalFile);
			title = doc.prefaceTitle || slug;
		}

		result.push({ slug, title, documentCount: xmlFiles.length });
	}

	return result;
}

export function getVersionIndex(boletin: Boletin, versionSlug: string): number {
	const idx = boletin.timeline.findIndex((t) => t.slug === versionSlug);
	if (idx === -1) throw new Error(`Unknown version: ${versionSlug}`);
	return idx;
}
