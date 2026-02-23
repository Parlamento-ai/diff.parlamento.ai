/**
 * Cámara de Diputados votes API client
 * Source: opendata.camara.cl/wscamaradiputados.asmx/getVotacion_Detalle?prmVotacionID=XXXXX
 */
import { XMLParser } from 'fast-xml-parser';
import type { VotacionData } from '../types.js';

const CAMARA_BASE = 'https://opendata.camara.cl/wscamaradiputados.asmx';

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '@_'
});

/** Fetch a single vote detail from the Cámara */
export async function fetchVotacionCamara(votacionId: string): Promise<VotacionData> {
	const url = `${CAMARA_BASE}/getVotacion_Detalle?prmVotacionID=${votacionId}`;
	console.log(`  Fetching Cámara vote: ${url}`);

	const resp = await fetch(url);
	if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching Cámara vote`);

	const xml = await resp.text();
	const parsed = parser.parse(xml);

	const votos = ensureArray(
		parsed?.Votacion_Detalle?.Votacion?.Votos?.VotacionDetalle ||
			parsed?.VotacionDetalle?.Votos?.Voto
	);

	const forVoters: string[] = [];
	const againstVoters: string[] = [];
	const abstainVoters: string[] = [];

	for (const v of votos) {
		const nombre = v.Diputado || v.Nombre || '';
		const opcion = (v.OpcionVoto || v.Voto || '').toLowerCase();
		if (opcion.includes('favor') || opcion === 'si' || opcion === 'sí')
			forVoters.push(nombre);
		else if (opcion.includes('contra') || opcion === 'no') againstVoters.push(nombre);
		else if (opcion.includes('absten')) abstainVoters.push(nombre);
	}

	const header = parsed?.Votacion_Detalle?.Votacion || parsed?.VotacionDetalle || {};

	return {
		fecha: header.Fecha || '',
		sesion: header.Sesion || '',
		si: forVoters.length,
		no: againstVoters.length,
		abstencion: abstainVoters.length,
		resultado: forVoters.length > againstVoters.length ? 'approved' : 'rejected',
		votantes: {
			for: forVoters,
			against: againstVoters,
			abstain: abstainVoters
		}
	};
}

function ensureArray<T>(val: T | T[] | undefined): T[] {
	if (!val) return [];
	return Array.isArray(val) ? val : [val];
}
