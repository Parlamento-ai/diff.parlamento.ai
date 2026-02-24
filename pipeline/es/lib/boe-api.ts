/**
 * BOE Open Data REST client
 * API docs: https://www.boe.es/datosabiertos/
 *
 * All endpoints return XML. Header Accept: application/xml is required.
 */

const BASE = 'https://www.boe.es/datosabiertos/api/legislacion-consolidada';

async function fetchXml(url: string): Promise<string> {
	const res = await fetch(url, {
		headers: { Accept: 'application/xml' }
	});
	if (!res.ok) {
		throw new Error(`BOE API ${res.status}: ${url}`);
	}
	return res.text();
}

/** Fetch metadata for a consolidated law: title, dates, ELI, etc. */
export async function fetchMetadata(boeId: string): Promise<string> {
	return fetchXml(`${BASE}/id/${boeId}`);
}

/** Fetch análisis (anteriores/posteriores) — modifying/modified laws */
export async function fetchAnalisis(boeId: string): Promise<string> {
	return fetchXml(`${BASE}/id/${boeId}/analisis`);
}

/** Fetch full consolidated text with all version blocks */
export async function fetchTexto(boeId: string): Promise<string> {
	return fetchXml(`${BASE}/id/${boeId}/texto`);
}

/** Fetch index/table of contents */
export async function fetchIndice(boeId: string): Promise<string> {
	return fetchXml(`${BASE}/id/${boeId}/indice`);
}

/** Fetch a single block by its ID */
export async function fetchBloque(boeId: string, bloqueId: string): Promise<string> {
	return fetchXml(`${BASE}/id/${boeId}/bloque/${bloqueId}`);
}
