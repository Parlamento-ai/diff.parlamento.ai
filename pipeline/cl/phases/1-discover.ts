/**
 * Phase 1: DISCOVER — Fetch Senate APIs to gather boletín metadata
 * 100% automated, no user input needed
 */
import { writeFileSync } from 'fs';
import { join } from 'path';
import { fetchTramitacion, fetchVotaciones } from '../lib/senado-api.js';
import type { Discovery } from '../types.js';

export async function discover(boletin: string, outDir: string): Promise<Discovery> {
	console.log('\n=== Phase 1: DISCOVER ===\n');

	// Fetch tramitación (metadata + documents)
	const tram = await fetchTramitacion(boletin);
	console.log(`  Boletín: ${tram.boletin}`);
	console.log(`  Título: ${tram.titulo}`);
	console.log(`  Estado: ${tram.estado}`);
	console.log(`  Iniciativa: ${tram.iniciativa}`);
	console.log(`  Cámara origen: ${tram.camaraOrigen}`);
	console.log(`  Trámites: ${tram.tramites.length}`);

	// Fetch votaciones
	const votaciones = await fetchVotaciones(boletin);
	console.log(`  Votaciones: ${votaciones.length}`);
	for (const v of votaciones) {
		console.log(`    ${v.fecha}: ${v.si}-${v.no}-${v.abstencion} (${v.resultado})`);
	}

	const discovery: Discovery = {
		boletin: tram.boletin,
		titulo: tram.titulo,
		estado: tram.estado,
		iniciativa: tram.iniciativa,
		camaraOrigen: tram.camaraOrigen,
		mocion: tram.mocion,
		tramites: tram.tramites,
		votaciones
	};

	// Save discovery.json
	const outPath = join(outDir, 'discovery.json');
	writeFileSync(outPath, JSON.stringify(discovery, null, 2), 'utf-8');
	console.log(`\n  -> Saved ${outPath}`);

	return discovery;
}
