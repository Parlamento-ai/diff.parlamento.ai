/**
 * Phase 3: DOWNLOAD — Fetch full consolidated text from BOE
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fetchTexto } from '../lib/boe-api.js';
import type { PipelineConfig } from '../types.js';

export async function download(config: PipelineConfig, outDir: string): Promise<string[]> {
	console.log('\n=== Phase 3: DOWNLOAD ===\n');

	const sourcesDir = join(outDir, 'sources');
	if (!existsSync(sourcesDir)) mkdirSync(sourcesDir, { recursive: true });

	const files: string[] = [];

	// Download full consolidated text
	const textoPath = join(sourcesDir, `boe-${config.boeId}-texto.xml`);
	if (existsSync(textoPath)) {
		console.log(`  texto.xml already cached`);
	} else {
		console.log(`  Fetching texto for ${config.boeId}...`);
		const textoXml = await fetchTexto(config.boeId);
		writeFileSync(textoPath, textoXml, 'utf-8');
		console.log(`  Saved boe-${config.boeId}-texto.xml (${textoXml.length} chars)`);
	}
	files.push(textoPath);

	// Metadata was already downloaded in phase 1
	const metadataPath = join(sourcesDir, `boe-${config.boeId}-metadata.xml`);
	if (existsSync(metadataPath)) {
		files.push(metadataPath);
		console.log(`  metadata.xml already cached`);
	}

	console.log(`\n  ${files.length} source files ready`);
	return files;
}
