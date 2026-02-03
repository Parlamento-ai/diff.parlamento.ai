import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseGenericAkn } from './akn-parser';
import type { ExplorerManifest, GenericAknDocument } from '$lib/types/explorer';

const DATA_DIR = join(process.cwd(), 'research/2026-02-03/akn-explorer');
const MANIFEST_PATH = join(DATA_DIR, '_index.json');

let manifestCache: ExplorerManifest | null = null;

export async function loadManifest(): Promise<ExplorerManifest> {
	if (manifestCache) return manifestCache;
	const raw = await readFile(MANIFEST_PATH, 'utf-8');
	manifestCache = JSON.parse(raw) as ExplorerManifest;
	return manifestCache;
}

export async function loadDocument(uri: string): Promise<GenericAknDocument> {
	const manifest = await loadManifest();
	const entry = manifest.documents.find((d) => d.uri === uri);
	if (!entry) {
		throw new Error(`Document not found: ${uri}`);
	}
	const filePath = join(DATA_DIR, entry.filePath);
	const xml = await readFile(filePath, 'utf-8');
	return parseGenericAkn(xml);
}
