/**
 * Parse BOE XML responses into internal structures.
 *
 * Uses regex/string parsing (consistent with CL pipeline approach).
 * BOE XML is well-structured enough that a DOM parser isn't necessary.
 */
import type { BoeMetadata, LeyModificadora, ParsedArticle, VersionSnapshot } from '../types.js';

// ── Helpers ──────────────────────────────────────────────────────────────

function tag(xml: string, name: string): string {
	const re = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`);
	const m = xml.match(re);
	return m ? m[1].trim() : '';
}

function tagAttr(xml: string, name: string, attr: string): string {
	const re = new RegExp(`<${name}[^>]*\\s${attr}="([^"]*)"`, 'i');
	const m = xml.match(re);
	return m ? m[1] : '';
}

function allTags(xml: string, name: string): string[] {
	const re = new RegExp(`<${name}[^>]*>[\\s\\S]*?</${name}>`, 'g');
	return xml.match(re) || [];
}

function stripTags(html: string): string {
	return html.replace(/<[^>]+>/g, '').trim();
}

/** Convert BOE date (YYYYMMDD or YYYY-MM-DD) to YYYY-MM-DD */
function normalizeDate(d: string): string {
	const clean = d.replace(/-/g, '');
	if (clean.length === 8) {
		return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
	}
	return d;
}

// ── Metadata ─────────────────────────────────────────────────────────────

/** Parse <metadatos> from /id/{id} response */
export function parseMetadata(xml: string): BoeMetadata {
	const meta = tag(xml, 'metadatos') || xml;
	return {
		identificador: tag(meta, 'identificador'),
		rango: tag(meta, 'rango'),
		titulo: tag(meta, 'titulo'),
		numeroOficial: tag(meta, 'numero_oficial'),
		fechaDisposicion: normalizeDate(tag(meta, 'fecha_disposicion')),
		fechaPublicacion: normalizeDate(tag(meta, 'fecha_publicacion')),
		fechaVigencia: normalizeDate(tag(meta, 'fecha_vigencia')),
		estatusDerogacion: tag(meta, 'estatus_derogacion'),
		estadoConsolidacion: tag(meta, 'estado_consolidacion'),
		urlEli: tag(meta, 'url_eli'),
		departamento: tag(meta, 'departamento')
	};
}

// ── Análisis ─────────────────────────────────────────────────────────────

/** Parse <posteriores>/<anteriores> from /analisis response */
export function parseAnalisis(xml: string): {
	modificadaPor: LeyModificadora[];
	modifica: LeyModificadora[];
} {
	const posteriores = tag(xml, 'posteriores');
	const anteriores = tag(xml, 'anteriores');

	return {
		modificadaPor: parseRelaciones(posteriores, 'posterior'),
		modifica: parseRelaciones(anteriores, 'anterior')
	};
}

function parseRelaciones(block: string, tagName: 'anterior' | 'posterior'): LeyModificadora[] {
	const items = allTags(block, tagName);
	return items.map((item) => {
		const boeId = tag(item, 'id_norma');
		const relacion = stripTags(tag(item, 'relacion')) || extractRelacion(tag(item, 'texto'));
		const texto = tag(item, 'texto');
		return {
			boeId,
			relacion,
			texto
		};
	});
}

function extractRelacion(texto: string): string {
	const upper = texto.toUpperCase();
	if (upper.includes('MODIFICA')) return 'MODIFICA';
	if (upper.includes('DEROGA')) return 'DEROGA';
	if (upper.includes('AÑADE') || upper.includes('ANADE')) return 'ANADE';
	return 'MODIFICA';
}

// ── Texto completo → VersionSnapshots ────────────────────────────────────

/**
 * Parse full <texto> response into version snapshots.
 *
 * BOE delivers all historical versions of each article as <version> siblings
 * inside each <bloque>. We group by id_norma to create one snapshot per
 * modifying law.
 *
 * - First snapshot = all first <version> elements = original published law
 * - Subsequent snapshots = cumulative state after each modifying law
 */
export function parseTextoToSnapshots(xml: string): VersionSnapshot[] {
	const bloques = allTags(xml, 'bloque');
	if (bloques.length === 0) return [];

	// Collect all versions across all bloques
	interface RawVersion {
		bloqueId: string;
		titulo: string;
		idNorma: string;
		fechaVigencia: string;
		content: string;
		derogado: boolean;
	}

	const allVersions: RawVersion[] = [];

	for (const bloque of bloques) {
		const tipo = tagAttr(bloque, 'bloque', 'tipo');
		// Solo preceptos (artículos, disposiciones). Saltar preámbulo, encabezados, etc.
		if (tipo !== 'precepto') continue;

		const bloqueId = tagAttr(bloque, 'bloque', 'id');
		const titulo = tagAttr(bloque, 'bloque', 'titulo') || '';

		// Saltar encabezados estructurales que BOE marca como precepto
		if (/^(Secci[oó]n|Cap[ií]tulo|T[ií]tulo|LIBRO|PARTE)\b/i.test(titulo)) continue;

		// Saltar bloques agrupados ("Arts 301 a 324") — son contenedores sin contenido propio,
		// los articulos individuales ya existen como bloques separados
		if (isGroupedBlock(titulo)) continue;

		const versions = allTags(bloque, 'version');

		for (const ver of versions) {
			const idNorma = tagAttr(ver, 'version', 'id_norma') || tag(ver, 'id_norma');
			const fecha = tagAttr(ver, 'version', 'fecha_vigencia') || tag(ver, 'fecha_vigencia');
			const content = extractVersionContent(ver);
			const derogado = ver.includes('(Derogado)') || ver.includes('(derogado)');

			allVersions.push({
				bloqueId,
				titulo,
				idNorma: idNorma || 'original',
				fechaVigencia: fecha ? normalizeDate(fecha) : '',
				content,
				derogado
			});
		}
	}

	if (allVersions.length === 0) return [];

	// Obtener normas unicas con su fecha mas temprana, ordenadas cronologicamente
	const normaFechas = new Map<string, string>();
	for (const v of allVersions) {
		const existing = normaFechas.get(v.idNorma);
		if (!existing || v.fechaVigencia < existing) {
			normaFechas.set(v.idNorma, v.fechaVigencia);
		}
	}
	const normaOrder = [...normaFechas.entries()]
		.sort((a, b) => a[1].localeCompare(b[1]))
		.map(([norma]) => norma);

	// Group versions by bloqueId, then by idNorma
	const byBloque = new Map<string, Map<string, RawVersion>>();
	for (const v of allVersions) {
		if (!byBloque.has(v.bloqueId)) byBloque.set(v.bloqueId, new Map());
		// Later entries for the same norma overwrite (take most recent)
		byBloque.get(v.bloqueId)!.set(v.idNorma, v);
	}

	// Build cumulative snapshots
	const snapshots: VersionSnapshot[] = [];
	const currentState = new Map<string, RawVersion>(); // bloqueId → current version

	// Get all unique bloqueIds preserving order
	const bloqueIds: string[] = [];
	const bloqueIdSet = new Set<string>();
	for (const v of allVersions) {
		if (!bloqueIdSet.has(v.bloqueId)) {
			bloqueIdSet.add(v.bloqueId);
			bloqueIds.push(v.bloqueId);
		}
	}

	// Para cada bloque, determinar cual es la primera norma que lo introduce
	const bloqueFirstNorma = new Map<string, string>();
	for (const bloqueId of bloqueIds) {
		const normaVersions = byBloque.get(bloqueId);
		if (!normaVersions) continue;
		// La primera norma en normaOrder que tiene version para este bloque
		for (const norma of normaOrder) {
			if (normaVersions.has(norma)) {
				bloqueFirstNorma.set(bloqueId, norma);
				break;
			}
		}
	}

	for (const norma of normaOrder) {
		// Update currentState with any articles modified by this norma
		for (const bloqueId of bloqueIds) {
			const normaVersions = byBloque.get(bloqueId);
			if (normaVersions?.has(norma)) {
				currentState.set(bloqueId, normaVersions.get(norma)!);
			} else if (!currentState.has(bloqueId) && bloqueFirstNorma.get(bloqueId) === norma) {
				// Solo inicializar un bloque cuando estamos en la norma que lo introdujo
				const first = normaVersions?.values().next().value;
				if (first) currentState.set(bloqueId, first);
			}
		}

		// Build snapshot from current cumulative state
		const articles: ParsedArticle[] = [];
		for (const bloqueId of bloqueIds) {
			const v = currentState.get(bloqueId);
			if (!v || v.derogado) continue;
			articles.push({
				eId: bloqueIdToEId(bloqueId, v.titulo),
				num: extractNum(bloqueId, v.titulo),
				heading: extractHeading(v.titulo),
				content: v.content
			});
		}

		// Determine date: use the fecha_vigencia from a version with this norma
		const normaVersion = allVersions.find((v) => v.idNorma === norma);
		const fecha = normaVersion?.fechaVigencia || '';

		snapshots.push({
			boeId: norma,
			fecha,
			articles
		});
	}

	// Ya estan en orden cronologico porque normaOrder esta ordenado por fecha
	return snapshots;
}

// ── Version content extraction ──────────────────────────────────────────

function extractVersionContent(versionXml: string): string {
	// Get all <p> tags, skip blockquotes (editorial notes)
	const withoutBlockquotes = versionXml.replace(/<blockquote[\s\S]*?<\/blockquote>/gi, '');
	const paragraphs = allTags(withoutBlockquotes, 'p');
	const lines: string[] = [];

	for (const p of paragraphs) {
		const cls = tagAttr(p, 'p', 'class');
		// Skip article heading paragraphs (they go in heading field)
		if (cls === 'articulo') continue;
		const text = stripTags(p);
		if (text) lines.push(text);
	}

	return lines.join('\n');
}

// ── eId mapping ─────────────────────────────────────────────────────────

/** Detectar si un titulo es un bloque agrupado ("Arts 301 a 324") */
function isGroupedBlock(titulo: string): boolean {
	return /Arts?\s+\d+\s+(a|al)\s+\d+/i.test(titulo);
}

/**
 * Derivar eId SOLO desde el titulo — nunca desde bloqueId.
 * Los bloqueIds del BOE son arbitrarios e inconsistentes (ej: "a3" para "Arts 301 a 324",
 * "da-2" para "Disposicion adicional septima"). El titulo es la unica fuente confiable.
 */
function bloqueIdToEId(bloqueId: string, titulo: string): string {
	const tituloLower = titulo.toLowerCase();

	// Disposiciones: extraer ordinal del titulo
	if (tituloLower.includes('adicional')) {
		return `da_${extractOrdinalNum(titulo)}`;
	}
	if (tituloLower.includes('transitoria')) {
		return `dt_${extractOrdinalNum(titulo)}`;
	}
	if (tituloLower.includes('final')) {
		return `df_${extractOrdinalNum(titulo)}`;
	}
	if (tituloLower.includes('derogatoria')) {
		return `dd_${extractOrdinalNum(titulo)}`;
	}

	// Bloques agrupados: "Arts 301 a 324" → art_301_324
	const rangeMatch = titulo.match(/Arts?\s+(\d+)\s+(?:a|al)\s+(\d+)/i);
	if (rangeMatch) {
		return `art_${rangeMatch[1]}_${rangeMatch[2]}`;
	}

	// Articulo individual: extraer numero + sufijo (bis, ter, etc.) del titulo
	const artMatch = titulo.match(/(\d+)\s*(bis|ter|quater|quinquies|sexies|septies|octies|novies|decies)?/i);
	if (artMatch) {
		const suffix = artMatch[2] ? `_${artMatch[2].toLowerCase()}` : '';
		return `art_${artMatch[1]}${suffix}`;
	}

	// Last resort: sanitizar bloqueId
	return bloqueId.replace(/[^a-zA-Z0-9_]/g, '_');
}

const ORDINALS: Record<string, string> = {
	primera: '1', primero: '1',
	segunda: '2', segundo: '2',
	tercera: '3', tercero: '3',
	cuarta: '4', cuarto: '4',
	quinta: '5', quinto: '5',
	sexta: '6', sexto: '6',
	septima: '7', septimo: '7',
	octava: '8', octavo: '8',
	novena: '9', noveno: '9',
	decima: '10', decimo: '10',
	undecima: '11', undecimo: '11',
	duodecima: '12', duodecimo: '12',
	decimotercera: '13', decimotercero: '13',
	decimocuarta: '14', decimocuarto: '14',
	decimoquinta: '15', decimoquinto: '15',
	decimosexta: '16', decimosexto: '16',
	decimoseptima: '17', decimoseptimo: '17',
	decimoctava: '18', decimoctavo: '18',
	decimonovena: '19', decimonoveno: '19',
	vigesima: '20', vigesimo: '20',
	unica: '1', unico: '1'
};

function extractOrdinalNum(titulo: string): string {
	// Try numeric first
	const m = titulo.match(/\d+/);
	if (m) return m[0];

	const lower = titulo
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');

	// Compound ordinals: "vigesima primera" = 21, "vigesima segunda" = 22, etc.
	const compoundMatch = lower.match(/vigesim[ao]\s+(primer[ao]|segund[ao]|tercer[ao]|cuart[ao]|quint[ao]|sext[ao]|septim[ao]|octav[ao]|noven[ao])/);
	if (compoundMatch) {
		const units: Record<string, number> = {
			primer: 1, primera: 1, primero: 1,
			segund: 2, segunda: 2, segundo: 2,
			tercer: 3, tercera: 3, tercero: 3,
			cuart: 4, cuarta: 4, cuarto: 4,
			quint: 5, quinta: 5, quinto: 5,
			sext: 6, sexta: 6, sexto: 6,
			septim: 7, septima: 7, septimo: 7,
			octav: 8, octava: 8, octavo: 8,
			noven: 9, novena: 9, noveno: 9
		};
		for (const [k, v] of Object.entries(units)) {
			if (compoundMatch[1].startsWith(k)) return String(20 + v);
		}
	}

	// Simple ordinals — matchear el mas largo primero para evitar
	// que "decima" matchee dentro de "decimoctava"
	const sortedOrdinals = Object.entries(ORDINALS).sort((a, b) => b[0].length - a[0].length);
	for (const [word, num] of sortedOrdinals) {
		if (lower.includes(word)) return num;
	}

	return '1';
}

function extractNum(bloqueId: string, titulo: string): string {
	const tituloLower = titulo.toLowerCase();
	if (tituloLower.includes('adicional')) return `DA ${extractOrdinalNum(titulo)}`;
	if (tituloLower.includes('transitoria')) return `DT ${extractOrdinalNum(titulo)}`;
	if (tituloLower.includes('final')) return `DF ${extractOrdinalNum(titulo)}`;
	if (tituloLower.includes('derogatoria')) return `DD ${extractOrdinalNum(titulo)}`;
	const m = titulo.match(/\d+/);
	return m ? m[0] : bloqueId;
}

function extractHeading(titulo: string): string {
	// Remove "Artículo N." prefix
	return titulo.replace(/^Art[ií]culo\s+\d+\.\s*/i, '').trim() || titulo;
}

// ── Validacion de integridad ────────────────────────────────────────────

export interface ValidationError {
	type: 'duplicate_eid' | 'empty_snapshot' | 'date_order' | 'empty_content';
	snapshot: number;
	detail: string;
}

/**
 * Validar integridad de snapshots. Retorna lista de errores.
 * Si la lista esta vacia, los datos son confiables.
 */
export function validateSnapshots(snapshots: VersionSnapshot[]): ValidationError[] {
	const errors: ValidationError[] = [];

	for (let i = 0; i < snapshots.length; i++) {
		const snap = snapshots[i];

		// eIds duplicados — error critico, causa problemas en la UI
		const eIds = snap.articles.map((a) => a.eId);
		const seen = new Set<string>();
		for (const eId of eIds) {
			if (seen.has(eId)) {
				errors.push({
					type: 'duplicate_eid',
					snapshot: i,
					detail: `eId "${eId}" duplicado en snapshot ${i} (${snap.boeId})`
				});
			}
			seen.add(eId);
		}

		// Snapshot vacio
		if (snap.articles.length === 0) {
			errors.push({
				type: 'empty_snapshot',
				snapshot: i,
				detail: `Snapshot ${i} (${snap.boeId}) tiene 0 articulos`
			});
		}

		// Orden cronologico
		if (i > 0 && snap.fecha && snapshots[i - 1].fecha && snap.fecha < snapshots[i - 1].fecha) {
			errors.push({
				type: 'date_order',
				snapshot: i,
				detail: `Snapshot ${i} (${snap.fecha}) es anterior a snapshot ${i - 1} (${snapshots[i - 1].fecha})`
			});
		}
	}

	return errors;
}
