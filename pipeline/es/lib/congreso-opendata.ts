/**
 * Congreso de los Diputados — Open Data iniciativas client
 *
 * Fetches the Congreso Open Data page for "iniciativas", scrapes
 * the JSON URL for Proyectos de Ley, and parses it to find a
 * specific project by expediente number.
 *
 * Data source: https://www.congreso.es/es/opendata/iniciativas
 *
 * JSON field names (verified 2026-02-25):
 *   NUMEXPEDIENTE:      "121/000036/0000"  (always has /0000 suffix)
 *   OBJETO:             Title of the bill
 *   SITUACIONACTUAL:    "Senado" or "Comisión de X\nEnmiendas"
 *   COMISIONCOMPETENTE: Committee name
 *   FECHAPRESENTACION:  "DD/MM/YYYY"
 *   ENLACESBOCG:        URLs separated by " \n "
 *   TRAMITACIONSEGUIDA: Raw tramitación text
 *
 * BOCG URL patterns:
 *   Congreso: BOCG-15-A-{num}-{phase}.PDF#page=1  (phase 1-8 extractable)
 *   Senado:   BOCG_D_15_{num}_{id}.PDF             (no phase in URL)
 */
import type { TramitacionDiscovery, BocgUrl } from '../types-tramitacion.js';

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; parlamento-ai/1.0)' };
const OPENDATA_URL = 'https://www.congreso.es/es/opendata/iniciativas';

/** Raw record from the Congreso JSON array — uses actual field names */
interface CongresoIniciativa {
	NUMEXPEDIENTE: string; // "121/000036/0000"
	OBJETO: string; // Bill title
	SITUACIONACTUAL: string; // Current status
	COMISIONCOMPETENTE: string; // Committee
	FECHAPRESENTACION: string; // DD/MM/YYYY
	ENLACESBOCG: string; // URLs separated by " \n "
	TRAMITACIONSEGUIDA: string; // Tramitación steps
	[key: string]: unknown;
}

/**
 * Scrape the Congreso opendata/iniciativas HTML page to find JSON URLs.
 * Returns a map of dataset name → URL.
 */
async function findOpendataJsonUrls(): Promise<Record<string, string>> {
	const res = await fetch(OPENDATA_URL, { headers: HEADERS });
	if (!res.ok) throw new Error(`Congreso opendata page returned ${res.status}`);
	const html = await res.text();

	const jsonRe = /href="((?:https?:\/\/www\.congreso\.es)?\/webpublica\/opendata\/iniciativas\/[^"]*\.json)"/gi;
	const urls: Record<string, string> = {};
	let m: RegExpExecArray | null;
	while ((m = jsonRe.exec(html)) !== null) {
		const url = m[1].startsWith('http') ? m[1] : `https://www.congreso.es${m[1]}`;
		if (/proyectos/i.test(url)) urls.proyectos = url;
		else if (/proposiciones/i.test(url)) urls.proposiciones = url;
	}
	return urls;
}

/**
 * Fetch and parse a Congreso Open Data JSON file.
 */
async function fetchCongresoJson(jsonUrl: string): Promise<CongresoIniciativa[]> {
	console.log(`  JSON URL: ${jsonUrl}`);
	const res = await fetch(jsonUrl, { headers: HEADERS });
	if (!res.ok) throw new Error(`Congreso JSON returned ${res.status}: ${jsonUrl}`);
	const data = await res.json();

	if (Array.isArray(data)) return data as CongresoIniciativa[];
	if (data && typeof data === 'object') {
		const values = Object.values(data);
		const arr = values.find((v) => Array.isArray(v));
		if (arr) return arr as CongresoIniciativa[];
	}
	throw new Error('Unexpected JSON structure from Congreso');
}

/**
 * Download and parse the full Proyectos de Ley JSON from Congreso Open Data.
 */
export async function fetchProyectosDeLey(): Promise<CongresoIniciativa[]> {
	const urls = await findOpendataJsonUrls();
	if (!urls.proyectos) throw new Error('Could not find Proyectos de Ley JSON URL on Congreso opendata page');
	return fetchCongresoJson(urls.proyectos);
}

/**
 * Download and parse the full Proposiciones de Ley JSON from Congreso Open Data.
 */
export async function fetchProposicionesDeLey(): Promise<CongresoIniciativa[]> {
	const urls = await findOpendataJsonUrls();
	if (!urls.proposiciones) throw new Error('Could not find Proposiciones de Ley JSON URL on Congreso opendata page');
	return fetchCongresoJson(urls.proposiciones);
}

/**
 * Extract all BOCG URLs from the ENLACESBOCG field using regex.
 *
 * The field uses " \n " as separator, and URLs come in two patterns:
 *   Congreso: BOCG-15-A-{num}-{phase}.PDF#page=1  → phase extractable
 *   Senado:   BOCG_D_15_{num}_{id}.PDF             → no phase, tagged as 100+order
 *
 * We strip #page=N fragments from URLs.
 */
function parseBocgUrls(enlacesBocg: string): BocgUrl[] {
	if (!enlacesBocg) return [];

	// Extract all URLs from the full string (handles any separator format)
	const urlRe = /https?:\/\/[^\s]+\.PDF(?:#page=\d+)?/gi;
	const results: BocgUrl[] = [];
	let m: RegExpExecArray | null;
	let senadoOrder = 0;

	while ((m = urlRe.exec(enlacesBocg)) !== null) {
		// Strip #page=N fragment — not needed for download
		const url = m[0].replace(/#page=\d+$/, '');

		// Detect pattern and extract phase
		const congresoMatch = url.match(/BOCG-\d+-[A-Z]-\d+-(\d+)\.PDF$/i);
		if (congresoMatch) {
			const phase = parseInt(congresoMatch[1], 10);
			results.push({ url, phase, label: CONGRESO_PHASE_LABELS[phase] || `Fase ${phase}` });
			continue;
		}

		// Senado BOCGs don't have phase numbers — tag them sequentially starting at 100
		const senadoMatch = url.match(/BOCG_D_\d+_\d+_\d+\.PDF$/i);
		if (senadoMatch) {
			senadoOrder++;
			results.push({ url, phase: 100 + senadoOrder, label: `Senado BOCG ${senadoOrder}` });
			continue;
		}

		// Unknown pattern — include with phase 0
		results.push({ url, phase: 0, label: 'BOCG (desconocido)' });
	}

	return results.sort((a, b) => a.phase - b.phase);
}

const CONGRESO_PHASE_LABELS: Record<number, string> = {
	1: 'Texto Original',
	2: 'Enmiendas',
	3: 'Índice de Enmiendas',
	4: 'Informe de Ponencia',
	5: 'Dictamen de Comisión',
	6: 'Aprobación por el Pleno',
	7: 'Enmiendas del Senado',
	8: 'Texto aprobado por el Senado',
	9: 'Aprobación Definitiva'
};

/**
 * Convert Congreso date DD/MM/YYYY to ISO YYYY-MM-DD.
 */
function toIsoDate(congresoDate: string): string {
	const parts = congresoDate.split('/');
	if (parts.length === 3) {
		return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
	}
	return congresoDate;
}

/**
 * Find a proyecto de ley by expediente number.
 *
 * The JSON has NUMEXPEDIENTE = "121/000036/0000" but users pass "121/000036".
 * We match by prefix: "121/000036" matches "121/000036/0000".
 */
export function findProyecto(
	proyectos: CongresoIniciativa[],
	expediente: string
): TramitacionDiscovery | null {
	// Try exact match first, then prefix match
	const proyecto = proyectos.find((p) => p.NUMEXPEDIENTE === expediente)
		|| proyectos.find((p) => p.NUMEXPEDIENTE.startsWith(expediente + '/'));
	if (!proyecto) return null;

	return {
		expediente: proyecto.NUMEXPEDIENTE,
		titulo: proyecto.OBJETO || '',
		situacion: (proyecto.SITUACIONACTUAL || '').replace(/\n/g, ' — '),
		comision: proyecto.COMISIONCOMPETENTE || '',
		fechaPresentacion: toIsoDate(proyecto.FECHAPRESENTACION || ''),
		bocgUrls: parseBocgUrls(proyecto.ENLACESBOCG || ''),
		tramitacion: proyecto.TRAMITACIONSEGUIDA || ''
	};
}

/**
 * Full discovery: fetch JSON, find proyecto/proposición, return discovery data.
 * Searches Proyectos de Ley first, then Proposiciones de Ley.
 */
export async function discoverProyecto(expediente: string): Promise<{
	discovery: TramitacionDiscovery;
	rawJson: CongresoIniciativa[];
}> {
	console.log('\n=== Phase 1: DISCOVER ===\n');

	const urls = await findOpendataJsonUrls();

	// Try Proyectos de Ley first
	if (urls.proyectos) {
		console.log(`  Fetching Congreso Open Data for Proyectos de Ley...`);
		const proyectos = await fetchCongresoJson(urls.proyectos);
		console.log(`  Found ${proyectos.length} proyectos de ley`);
		const discovery = findProyecto(proyectos, expediente);
		if (discovery) {
			printDiscovery(discovery);
			return { discovery, rawJson: proyectos };
		}
	}

	// Try Proposiciones de Ley
	if (urls.proposiciones) {
		console.log(`  Not found in Proyectos — trying Proposiciones de Ley...`);
		const proposiciones = await fetchCongresoJson(urls.proposiciones);
		console.log(`  Found ${proposiciones.length} proposiciones de ley`);
		const discovery = findProyecto(proposiciones, expediente);
		if (discovery) {
			printDiscovery(discovery);
			return { discovery, rawJson: proposiciones };
		}
	}

	throw new Error(
		`Expediente ${expediente} not found in Proyectos nor Proposiciones de Ley.`
	);
}

function printDiscovery(discovery: TramitacionDiscovery): void {
	console.log(`  Title: ${discovery.titulo.slice(0, 80)}`);
	console.log(`  Situación: ${discovery.situacion}`);
	console.log(`  Comisión: ${discovery.comision}`);
	console.log(`  Fecha presentación: ${discovery.fechaPresentacion}`);
	console.log(`  BOCGs: ${discovery.bocgUrls.length} URLs`);
	for (const bocg of discovery.bocgUrls) {
		console.log(`    Phase ${bocg.phase}: ${bocg.label} — ${bocg.url.split('/').pop()}`);
	}
}
