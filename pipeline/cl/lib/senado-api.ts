/**
 * Senate API client — tramitación + votaciones
 * Sources:
 *   - tramitacion.senado.cl/wspublico/tramitacion.php?boletin=XXXXX
 *   - tramitacion.senado.cl/wspublico/votaciones.php?boletin=XXXXX
 */
import { XMLParser } from 'fast-xml-parser';
import type { TramitacionData, Tramite, VotacionData } from '../types.js';

const SENADO_BASE = 'https://tramitacion.senado.cl/wspublico';

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '@_'
});

/** Fetch and parse tramitación XML */
export async function fetchTramitacion(boletin: string): Promise<TramitacionData> {
	const url = `${SENADO_BASE}/tramitacion.php?boletin=${boletin}`;
	console.log(`  Fetching tramitación: ${url}`);

	const resp = await fetch(url);
	if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching tramitación`);

	const xml = await resp.text();
	const parsed = parser.parse(xml);

	const proy = parsed?.proyectos?.proyecto;
	if (!proy) throw new Error(`No proyecto found for boletín ${boletin}`);

	// Metadata is nested under <descripcion>
	const desc = proy.descripcion || {};

	const data: TramitacionData = {
		boletin: desc.boletin || boletin,
		titulo: desc.titulo || '',
		estado: (desc.estado || '').trim(),
		iniciativa: desc.iniciativa || '',
		camaraOrigen: desc.camara_origen || '',
		tramites: [],
		urgencias: []
	};

	// Extract moción link → iddocto + tipodoc
	const link = desc.link_mensaje_mocion || '';
	const iddoctoMatch = link.match(/iddocto=(\d+)/);
	const tipodocMatch = link.match(/tipodoc=(\w+)/);
	if (iddoctoMatch) {
		data.mocion = {
			iddocto: iddoctoMatch[1],
			tipodoc: tipodocMatch?.[1] || 'mensaje_mocion'
		};
	}

	// Trámites: <tramitacion><tramite> with UPPERCASE fields
	const tramites = ensureArray(proy.tramitacion?.tramite);
	for (const t of tramites) {
		const tramite: Tramite = {
			fecha: parseFecha(t.FECHA || ''),
			descripcion: (t.DESCRIPCIONTRAMITE || '').trim(),
			etapa: t.ETAPDESCRIPCION || '',
			camara: t.CAMARATRAMITE || ''
		};
		data.tramites.push(tramite);
	}

	// Informes: <informes><informe> with LINK_INFORME containing iddocto
	const informes = ensureArray(proy.informes?.informe);
	for (const inf of informes) {
		const infLink = inf.LINK_INFORME || '';
		const infIddocto = infLink.match(/iddocto=(\d+)/)?.[1];
		const infTipodoc = infLink.match(/tipodoc=(\w+)/)?.[1];
		if (infIddocto) {
			// Attach as document to matching tramite, or to the first one
			const matchTramite = data.tramites.find(
				(tr) => tr.descripcion.includes('informe') || tr.fecha === parseFecha(inf.FECHAINFORME || '')
			);
			const target = matchTramite || data.tramites[0];
			if (target) {
				if (!target.documentos) target.documentos = [];
				target.documentos.push({
					iddocto: infIddocto,
					tipodoc: infTipodoc || 'info',
					descripcion: inf.TRAMITE || 'Informe de comisión'
				});
			}
		}
	}

	// Oficios: <oficios><oficio> with LINK_OFICIO containing iddocto
	const oficios = ensureArray(proy.oficios?.oficio);
	for (const ofi of oficios) {
		const ofiLink = ofi.LINK_OFICIO || '';
		const ofiIddocto = ofiLink.match(/iddocto=(\d+)/)?.[1];
		const ofiTipodoc = ofiLink.match(/tipodoc=(\w+)/)?.[1];
		if (ofiIddocto) {
			const matchTramite = data.tramites.find(
				(tr) => tr.fecha === parseFecha(ofi.FECHA || '')
			);
			const target = matchTramite || data.tramites[0];
			if (target) {
				if (!target.documentos) target.documentos = [];
				target.documentos.push({
					iddocto: ofiIddocto,
					tipodoc: ofiTipodoc || 'ofic',
					descripcion: `${ofi.TIPO || 'Oficio'}${ofi.NUMERO ? ` N° ${ofi.NUMERO}` : ''}`
				});
			}
		}
	}

	// Comparados: <comparados><comparado> with LINK_COMPARADO
	const comparados = ensureArray(proy.comparados?.comparado);
	for (const comp of comparados) {
		const compLink = comp.LINK_COMPARADO || '';
		const compIddocto = compLink.match(/iddocto=(\d+)/)?.[1];
		const compTipodoc = compLink.match(/tipodoc=(\w+)/)?.[1];
		if (compIddocto) {
			const target = data.tramites[data.tramites.length - 1] || data.tramites[0];
			if (target) {
				if (!target.documentos) target.documentos = [];
				target.documentos.push({
					iddocto: compIddocto,
					tipodoc: compTipodoc || 'compa',
					descripcion: comp.TRAMITE || 'Texto comparado'
				});
			}
		}
	}

	return data;
}

/** Fetch and parse votaciones XML */
export async function fetchVotaciones(boletin: string): Promise<VotacionData[]> {
	const url = `${SENADO_BASE}/votaciones.php?boletin=${boletin}`;
	console.log(`  Fetching votaciones: ${url}`);

	const resp = await fetch(url);
	if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching votaciones`);

	const xml = await resp.text();
	const parsed = parser.parse(xml);

	const votaciones = ensureArray(parsed?.votaciones?.votacion);
	const results: VotacionData[] = [];

	for (const v of votaciones) {
		// UPPERCASE field names
		const votos = ensureArray(v.DETALLE_VOTACION?.VOTO);
		const forVoters: string[] = [];
		const againstVoters: string[] = [];
		const abstainVoters: string[] = [];

		for (const voto of votos) {
			const nombre = (voto.PARLAMENTARIO || '').trim();
			const seleccion = (voto.SELECCION || '').toLowerCase();
			if (seleccion === 'si' || seleccion === 'sí') forVoters.push(nombre);
			else if (seleccion === 'no') againstVoters.push(nombre);
			else if (seleccion.includes('absten')) abstainVoters.push(nombre);
			else if (seleccion === 'pareo') { /* skip pareos */ }
		}

		const si = Number(v.SI) || forVoters.length;
		const no = Number(v.NO) || againstVoters.length;
		const abstencion = Number(v.ABSTENCION) || abstainVoters.length;

		results.push({
			fecha: parseFecha(v.FECHA || ''),
			sesion: v.SESION || '',
			si,
			no,
			abstencion,
			resultado: si > no ? 'approved' : 'rejected',
			votantes: {
				for: forVoters,
				against: againstVoters,
				abstain: abstainVoters
			}
		});
	}

	return results;
}

/** Convert DD/MM/YYYY to YYYY-MM-DD */
function parseFecha(fecha: string): string {
	const parts = fecha.split('/');
	if (parts.length === 3) {
		return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
	}
	return fecha;
}

function ensureArray<T>(val: T | T[] | undefined): T[] {
	if (!val) return [];
	return Array.isArray(val) ? val : [val];
}
