/**
 * BOCG Text Parser — converts extracted BOCG PDF text into ParsedArticle[]
 *
 * Handles three main document types:
 *   Phase 1: Original bill text — articles parsed directly
 *   Phase 4: Informe de Ponencia — look for ANEXO, then parse modified text
 *   Phase 5: Dictamen de Comisión — similar to original with possible modifications
 *
 * Real BOCG format (verified with 121/000036):
 *   "Artículo primero.  Modificación de la Ley 27/1999..."    (heading + title on same line)
 *   "Artículo cuarto (nuevo). Modificación de..."             (ponencia may add "(nuevo)")
 *   "Disposición transitoria primera.  Depósito provisional..."
 *   "Disposición final primera.  Modificación del texto..."
 *   Lines may end with "cve: BOCG-15-A-36-1" artifacts
 */
import type { ParsedArticle } from '../types.js';
import type { DownloadedBocg } from './bocg-downloader.js';

/** Version snapshot — all articles at one point in the legislative process */
export interface TramitacionSnapshot {
	phase: number;
	label: string;
	date: string;
	articles: ParsedArticle[];
	sourceUrl: string;
}

// ── Header/Footer stripping ──────────────────────────────────────────────

const HEADER_PATTERNS = [
	/^BOLETÍN OFICIAL\s*$/gim,
	/^DE LAS CORTES GENERALES\s*$/gim,
	/^CONGRESO DE LOS DIPUTADOS\s*$/gim,
	/^SENADO\s*$/gim,
	/^\s*XV?\s+LEGISLATURA\s*$/gim,
	/^Serie [A-Z]:?\s+.*Núm\.\s*\d+.*$/gim,
	/^PROYECTOS DE LEY\s*$/gim,
	/cve:\s*BOCG-[^\n]*/gim, // cve artifacts (can be mid-line or end-of-line)
	/^\s*Pág\.\s*\d+\s*$/gim,
	// Date lines: "18 de octubre de 2024"
	/^\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+\d{4}\s*$/gim
];

/**
 * Strip BOCG headers, footers, cve artifacts, and page markers.
 */
export function stripHeaders(text: string): string {
	let cleaned = text;
	for (const pattern of HEADER_PATTERNS) {
		cleaned = cleaned.replace(pattern, '');
	}
	// Collapse multiple blank lines
	cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n');
	return cleaned.trim();
}

// ── Ordinal mapping ─────────────────────────────────────────────────────

const ORDINALS: Record<string, number> = {
	primero: 1, primera: 1,
	segundo: 2, segunda: 2,
	tercero: 3, tercera: 3,
	cuarto: 4, cuarta: 4,
	quinto: 5, quinta: 5,
	sexto: 6, sexta: 6,
	septimo: 7, septima: 7, 'séptimo': 7, 'séptima': 7,
	octavo: 8, octava: 8,
	noveno: 9, novena: 9,
	decimo: 10, decima: 10, 'décimo': 10, 'décima': 10,
	undecimo: 11, undecima: 11, 'undécimo': 11, 'undécima': 11,
	duodecimo: 12, duodecima: 12, 'duodécimo': 12, 'duodécima': 12,
	decimotercero: 13, decimotercera: 13,
	decimocuarto: 14, decimocuarta: 14,
	decimoquinto: 15, decimoquinta: 15,
	decimosexto: 16, decimosexta: 16,
	unico: 0, unica: 0, 'único': 0, 'única': 0
};

const COMPOUND_ORDINALS: Record<string, number> = {
	vigesimo: 20, vigesima: 20, 'vigésimo': 20, 'vigésima': 20,
	trigesimo: 30, trigesima: 30, 'trigésimo': 30, 'trigésima': 30,
	cuadragesimo: 40, cuadragesima: 40, 'cuadragésimo': 40, 'cuadragésima': 40
};

function ordinalToNumber(text: string): number {
	const lower = text.toLowerCase().trim();

	if (ORDINALS[lower] !== undefined) return ORDINALS[lower];

	const num = parseInt(lower, 10);
	if (!isNaN(num)) return num;

	// Compound: "vigésimo primero" → 21
	const parts = lower.split(/\s+/);
	if (parts.length === 2) {
		const tens = COMPOUND_ORDINALS[parts[0]];
		const units = ORDINALS[parts[1]];
		if (tens !== undefined && units !== undefined) return tens + units;
	}

	// Joined compound: "vigesimoprimera" → 21
	for (const [prefix, tens] of Object.entries(COMPOUND_ORDINALS)) {
		if (lower.startsWith(prefix)) {
			const rest = lower.slice(prefix.length);
			const units = ORDINALS[rest];
			if (units !== undefined) return tens + units;
		}
	}

	return -1;
}

// ── Article heading detection ────────────────────────────────────────────

/**
 * Regex that matches article headings at the START of a line.
 * The heading continues to the end of the line (title on same line).
 *
 * Captures:
 *   Group 1: ordinal/number (e.g. "primero", "cuarto (nuevo)", "23 bis")
 *   The rest of the line is the article title/description.
 *
 * Real examples:
 *   "Artículo primero.  Modificación de la Ley 27/1999..."
 *   "Artículo cuarto (nuevo). Modificación de..."
 *   "Artículo 23 bis. Régimen de..."
 */
const ARTICLE_HEADING_RE =
	/^Art[ií]culo\s+([\w\sáéíóúüñ()]+?)\.\s+(.*)$/gm;

/**
 * Regex for disposición headings. Case-sensitive: "Disposición" (capital D).
 *
 * Must handle:
 *   "Disposición final primera. Título..."
 *   "Disposición final primera pre (nueva). Título..."     (suffixed ordinal)
 *   "Disposición final segunda bis (nueva). Título..."     (bis suffix)
 *   "Disposición final primera. (suprimida)"               (suppressed, no title)
 */
const DISPOSICION_HEADING_RE =
	/^Disposici[oó]n\s+(adicional|transitoria|derogatoria|final)\s+([\w\sáéíóúüñ]+?)(?:\s*\((?:nuev[oa]|suprimid[oa])\))?\.\s*(.*)$/gm;

interface HeadingMatch {
	index: number;
	fullMatch: string;
	eId: string;
	num: string;
	heading: string; // The title part after the period
	isNew: boolean;
	isSuppressed: boolean;
}

/**
 * Find all article and disposición headings in text.
 */
function findHeadings(text: string): HeadingMatch[] {
	const results: HeadingMatch[] = [];

	// Articles
	const artRe = new RegExp(ARTICLE_HEADING_RE.source, ARTICLE_HEADING_RE.flags);
	let m: RegExpExecArray | null;
	while ((m = artRe.exec(text)) !== null) {
		const rawOrdinal = m[1].trim();
		const titlePart = m[2].trim();

		// Check for (nuevo) / (suprimido) markers
		const isNew = /\(nuevo\)/i.test(rawOrdinal);
		const isSuppressed = /\(suprimido\)/i.test(rawOrdinal);
		const cleanOrdinal = rawOrdinal.replace(/\s*\(nuevo\)\s*/i, '').replace(/\s*\(suprimido\)\s*/i, '').trim();

		const parts = cleanOrdinal.split(/\s+/);
		const mainPart = parts[0];
		const suffix = parts.slice(1).join('_').toLowerCase() || '';

		let num: number;
		const parsed = parseInt(mainPart, 10);
		if (!isNaN(parsed)) {
			num = parsed;
		} else {
			num = ordinalToNumber(mainPart);
			if (num < 0) continue;
		}

		const eId = num === 0 ? 'art_unico' : `art_${num}${suffix ? '_' + suffix : ''}`;
		const displayNum = num === 0 ? 'Único' : String(num) + (suffix ? ` ${suffix}` : '');

		results.push({
			index: m.index,
			fullMatch: m[0],
			eId,
			num: displayNum,
			heading: titlePart,
			isNew,
			isSuppressed
		});
	}

	// Disposiciones
	const dispRe = new RegExp(DISPOSICION_HEADING_RE.source, DISPOSICION_HEADING_RE.flags);
	while ((m = dispRe.exec(text)) !== null) {
		const type = m[1].toLowerCase();
		const rawOrdinal = m[2].trim();
		const titlePart = (m[3] || '').trim();

		// Check flags from the full match (they may be in the regex non-capturing group)
		const isNew = /\(nuev[oa]\)/i.test(m[0]);
		const isSuppressed = /\(suprimid[oa]\)/i.test(m[0]);

		// Parse ordinal — may have suffixes like "bis", "ter", "pre"
		// "primera pre" → ordinal="primera", suffix="pre"
		// "segunda bis" → ordinal="segunda", suffix="bis"
		const SUFFIXES = ['bis', 'ter', 'quater', 'quinquies', 'sexies', 'pre'];
		const ordinalParts = rawOrdinal.split(/\s+/);
		let suffix = '';
		let ordinalText = rawOrdinal;

		// Check if last word is a known suffix
		if (ordinalParts.length > 1) {
			const lastWord = ordinalParts[ordinalParts.length - 1].toLowerCase();
			if (SUFFIXES.includes(lastWord)) {
				suffix = lastWord;
				ordinalText = ordinalParts.slice(0, -1).join(' ');
			}
		}

		const num = ordinalToNumber(ordinalText);
		if (num < 0) continue;

		const prefixMap: Record<string, string> = {
			adicional: 'da', transitoria: 'dt', derogatoria: 'dd', final: 'df'
		};
		const prefix = prefixMap[type] || type.slice(0, 2);
		const eId = num === 0
			? `${prefix}_unica${suffix ? '_' + suffix : ''}`
			: `${prefix}_${num}${suffix ? '_' + suffix : ''}`;
		const displayNum = num === 0 ? 'Única' : String(num);
		const displaySuffix = suffix ? ` ${suffix}` : '';
		const displayType = type.charAt(0).toUpperCase() + type.slice(1);

		results.push({
			index: m.index,
			fullMatch: m[0],
			eId,
			num: `${displayType} ${displayNum}${displaySuffix}`,
			heading: titlePart,
			isNew,
			isSuppressed
		});
	}

	// Sort by position in text
	results.sort((a, b) => a.index - b.index);
	return results;
}

/**
 * Parse bill text into ParsedArticle[].
 */
export function parseArticles(text: string): ParsedArticle[] {
	const cleaned = stripHeaders(text);
	const headings = findHeadings(cleaned);
	const articles: ParsedArticle[] = [];

	if (headings.length === 0) return articles;

	for (let i = 0; i < headings.length; i++) {
		const h = headings[i];

		if (h.isSuppressed) continue;

		// Content: from end of this heading line to start of next heading
		const contentStart = h.index + h.fullMatch.length;
		const contentEnd = i + 1 < headings.length ? headings[i + 1].index : cleaned.length;
		const rawContent = cleaned.slice(contentStart, contentEnd).trim();

		// Clean content: collapse whitespace, remove newline artifacts
		const content = rawContent
			.replace(/\s+/g, ' ')
			.trim();

		articles.push({
			eId: h.eId,
			num: h.num,
			heading: h.heading,
			content
		});
	}

	return articles;
}

// ── Ponencia parsing (Phase 4) ──────────────────────────────────────────

/**
 * Parse Informe de Ponencia (Phase 4).
 * Looks for the ANEXO section which contains the modified bill text.
 */
export function parsePonencia(text: string): ParsedArticle[] {
	const anexoMatch = text.match(/\bANEXO\b/i);
	if (anexoMatch && anexoMatch.index !== undefined) {
		const anexoText = text.slice(anexoMatch.index + anexoMatch[0].length);
		console.log(`    Found ANEXO at position ${anexoMatch.index}, parsing ${anexoText.length} chars`);
		return parseArticles(anexoText);
	}

	console.log(`    No ANEXO found, parsing full ponencia text`);
	return parseArticles(text);
}

// ── Date extraction ─────────────────────────────────────────────────────

const MONTH_MAP: Record<string, string> = {
	enero: '01', febrero: '02', marzo: '03', abril: '04',
	mayo: '05', junio: '06', julio: '07', agosto: '08',
	septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12'
};

/**
 * Extract publication date from BOCG header text.
 */
export function extractDate(text: string): string | null {
	const header = text.slice(0, 2000);
	const dateMatch = header.match(
		/(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+(\d{4})/i
	);
	if (dateMatch) {
		const day = dateMatch[1].padStart(2, '0');
		const month = MONTH_MAP[dateMatch[2].toLowerCase()];
		const year = dateMatch[3];
		return `${year}-${month}-${day}`;
	}
	return null;
}

// ── Snapshot building ────────────────────────────────────────────────────

/**
 * Build version snapshots from downloaded BOCGs.
 */
export function buildSnapshots(bocgs: DownloadedBocg[]): TramitacionSnapshot[] {
	console.log('\n=== Phase 3: CONVERT ===\n');

	const snapshots: TramitacionSnapshot[] = [];

	for (const bocg of bocgs) {
		console.log(`  Parsing phase ${bocg.phase}: ${bocg.label}...`);

		let articles: ParsedArticle[];
		if (bocg.phase === 4) {
			articles = parsePonencia(bocg.text);
		} else {
			articles = parseArticles(bocg.text);
		}

		const date = extractDate(bocg.text) || '';
		console.log(`    Date: ${date || '(not found)'}`);
		console.log(`    Articles: ${articles.length}`);

		if (articles.length === 0) {
			console.warn(`    WARNING: No articles parsed from phase ${bocg.phase}, skipping`);
			continue;
		}

		const preview = articles.slice(0, 5).map((a) => a.eId).join(', ');
		console.log(`    Preview: ${preview}${articles.length > 5 ? '...' : ''}`);

		snapshots.push({
			phase: bocg.phase,
			label: bocg.label,
			date,
			articles,
			sourceUrl: bocg.sourceUrl
		});
	}

	console.log(`\n  Built ${snapshots.length} version snapshots`);
	return snapshots;
}
