import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseAknDocument } from './xml-parser';
import type { AknDocument, Boletin, TimelineEntry } from '$lib/types';

const POC_DIR = 'research/2026-01-31/aknpp-poc';

const BOLETIN_DIRS: Record<string, string> = {
	'empanadas-de-pino': 'receta-empanadas',
	'pan-de-campo': 'receta-pan'
};

const SLUG_MAP: Record<string, string> = {
	'01-act-original.xml': 'original',
	'02-bill.xml': 'bill',
	'03-amendment-1.xml': 'amendment-1',
	'04-amendment-2.xml': 'amendment-2',
	'05-act-final.xml': 'final',
	'04-act-final.xml': 'final'
};

function fileToSlug(fileName: string): string {
	return SLUG_MAP[fileName] || fileName.replace('.xml', '');
}

function slugToLabel(slug: string): string {
	const labels: Record<string, string> = {
		original: 'Ley Original',
		bill: 'Proyecto de Ley',
		'amendment-1': 'Indicación 1',
		'amendment-2': 'Indicación 2',
		final: 'Ley Promulgada'
	};
	return labels[slug] || slug;
}

function buildTimeline(documents: AknDocument[]): TimelineEntry[] {
	return documents.map((doc) => {
		const slug = fileToSlug(doc.fileName);
		return {
			slug,
			label: slugToLabel(slug),
			date: doc.frbr.date,
			type: doc.type,
			author: doc.frbr.authorLabel,
			fileName: doc.fileName
		};
	});
}

export async function loadBoletin(slug: string): Promise<Boletin> {
	const dirName = BOLETIN_DIRS[slug];
	if (!dirName) {
		throw new Error(`Unknown boletin: ${slug}`);
	}

	const dirPath = join(process.cwd(), POC_DIR, dirName);
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
		timeline: buildTimeline(documents)
	};
}

export async function listBoletines(): Promise<{ slug: string; title: string; documentCount: number }[]> {
	const result: { slug: string; title: string; documentCount: number }[] = [];

	for (const [slug, dirName] of Object.entries(BOLETIN_DIRS)) {
		const dirPath = join(process.cwd(), POC_DIR, dirName);
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
