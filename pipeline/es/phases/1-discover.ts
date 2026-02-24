/**
 * Phase 1: DISCOVER — Fetch metadata + análisis from BOE
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fetchMetadata, fetchAnalisis } from '../lib/boe-api.js';
import { parseMetadata, parseAnalisis } from '../lib/boe-parser.js';
import type { Discovery } from '../types.js';

export async function discover(boeId: string, outDir: string): Promise<Discovery> {
	console.log('\n=== Phase 1: DISCOVER ===\n');

	if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
	const sourcesDir = join(outDir, 'sources');
	if (!existsSync(sourcesDir)) mkdirSync(sourcesDir, { recursive: true });

	// Fetch & parse metadata
	console.log(`  Fetching metadata for ${boeId}...`);
	const metadataXml = await fetchMetadata(boeId);
	writeFileSync(join(sourcesDir, `boe-${boeId}-metadata.xml`), metadataXml, 'utf-8');

	const metadata = parseMetadata(metadataXml);
	console.log(`  Title: ${metadata.titulo}`);
	console.log(`  Rango: ${metadata.rango}`);
	console.log(`  Numero: ${metadata.numeroOficial}`);
	console.log(`  Fecha disposicion: ${metadata.fechaDisposicion}`);
	console.log(`  Fecha vigencia:    ${metadata.fechaVigencia}`);
	console.log(`  ELI: ${metadata.urlEli}`);

	// Fetch & parse análisis
	console.log(`\n  Fetching analisis...`);
	const analisisXml = await fetchAnalisis(boeId);
	writeFileSync(join(sourcesDir, `boe-${boeId}-analisis.xml`), analisisXml, 'utf-8');

	const { modificadaPor, modifica } = parseAnalisis(analisisXml);
	console.log(`  Modificada por: ${modificadaPor.length} leyes`);
	console.log(`  Modifica: ${modifica.length} leyes`);

	for (const ley of modificadaPor) {
		console.log(`    - ${ley.boeId}: ${ley.relacion} — ${ley.texto.slice(0, 80)}`);
	}

	// Extract materias from metadata
	const materiasMatch = metadataXml.match(/<materia>([^<]+)<\/materia>/g) || [];
	const materias = materiasMatch.map((m) => m.replace(/<\/?materia>/g, '').trim());

	const discovery: Discovery = {
		boeId,
		metadata,
		modificadaPor,
		modifica,
		materias
	};

	writeFileSync(join(outDir, 'discovery.json'), JSON.stringify(discovery, null, 2), 'utf-8');
	console.log(`\n  Saved discovery.json`);

	return discovery;
}
