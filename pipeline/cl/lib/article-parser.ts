/**
 * Article parser — regex-based extraction from legislative text
 * Extracts articles from Chilean legislative documents (mensajes, mociones, oficios)
 */
import type { ParseResult, ParsedArticle } from '../types.js';

const ORDINAL_MAP: Record<string, number> = {
	único: 1,
	unico: 1,
	primero: 1,
	segundo: 2,
	tercero: 3,
	cuarto: 4,
	quinto: 5,
	sexto: 6,
	séptimo: 7,
	septimo: 7,
	octavo: 8,
	noveno: 9,
	décimo: 10,
	decimo: 10,
	undécimo: 11,
	duodécimo: 12,
	decimotercero: 13,
	decimocuarto: 14,
	decimoquinto: 15,
	decimosexto: 16,
	decimoséptimo: 17,
	decimoctavo: 18,
	decimonoveno: 19,
	vigésimo: 20
};

/** Combined regex that finds any article heading */
const ARTICLE_REGEX =
	/^(?:ARTÍCULO|Artículo|artículo|Art\.)\s+(\d+[°º]?(?:\s+bis)?|[a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*(?:\s+transitorio)?)\s*[\.\-:]/gim;

/** Clean PDF extraction artifacts from text */
function cleanPdfArtifacts(text: string): string {
	return text
		// Page-break markers: "-- 186 of 193 --"
		.replace(/^--\s*\d+\s+of\s+\d+\s*--\s*$/gm, '')
		// Standalone page numbers on their own line
		.replace(/^\d{1,4}\s*$/gm, '');
}

/** Parse articles from raw text */
export function parseArticles(text: string, options?: { prefix?: string }): ParseResult {
	const prefix = options?.prefix || 'art';
	const matches: Array<{ index: number; num: string; raw: string }> = [];
	const warnings: string[] = [];

	// Clean PDF page-break artifacts
	text = cleanPdfArtifacts(text);

	// Detect "DISPOSICIONES TRANSITORIAS" section boundary
	const transitoryMatch = /^DISPOSICIONES?\s+TRANSITORIAS?\.?\s*$/im.exec(text);
	const transitoryStart = transitoryMatch ? transitoryMatch.index : Infinity;

	// Find all article headings
	const regex = new RegExp(ARTICLE_REGEX.source, 'gim');
	let match;
	while ((match = regex.exec(text)) !== null) {
		matches.push({
			index: match.index,
			num: match[1].trim(),
			raw: match[0]
		});
	}

	if (matches.length === 0) {
		return {
			articles: [],
			confidence: 0,
			warnings: ['No article headings found'],
			needsReview: true
		};
	}

	// Extract text between consecutive article headings
	const articles: ParsedArticle[] = [];
	for (let i = 0; i < matches.length; i++) {
		const start = matches[i].index + matches[i].raw.length;
		const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
		const content = text.slice(start, end).trim();
		const numStr = matches[i].num;

		// Determine if this is a transitory article:
		// 1) Appears after "DISPOSICIONES TRANSITORIAS" heading, or
		// 2) Heading explicitly contains "transitorio"
		const isTransitory =
			matches[i].index > transitoryStart || /transitorio/i.test(numStr);

		// Strip "transitorio" suffix before ordinal lookup
		const cleanNum = numStr.toLowerCase().replace(/[°º]/g, '').replace(/\s+transitorio$/i, '').trim();
		const numValue = ORDINAL_MAP[cleanNum] || parseInt(cleanNum) || i + 1;

		const artPrefix = isTransitory ? 'trans' : prefix;

		articles.push({
			eId: `${artPrefix}_${numValue}`,
			num: numStr,
			heading: isTransitory
				? `Artículo ${numStr} transitorio`
				: `Artículo ${numStr}`,
			content
		});
	}

	// Compute confidence — only on permanent articles (transitory restart numbering)
	let confidence = 0;
	const permanentArts = articles.filter((a) => a.eId.startsWith(`${prefix}_`));
	const nums = permanentArts.map((a) => {
		const n = parseInt(a.eId.split('_')[1]);
		return isNaN(n) ? 0 : n;
	});

	if (nums.length > 0) {
		const isConsecutive = nums.every((n, i) => i === 0 || n === nums[i - 1] + 1);
		if (isConsecutive) confidence += 0.3;
		else warnings.push(`Non-consecutive article numbers: ${nums.join(', ')}`);
	} else {
		confidence += 0.3;
	}

	// Check consistent pattern
	const patterns = matches.map((m) => m.raw.split(/\s+/)[0]);
	const uniquePatterns = new Set(patterns);
	if (uniquePatterns.size <= 2) confidence += 0.2;

	// Check content looks legal
	const avgLength = articles.reduce((sum, a) => sum + a.content.length, 0) / articles.length;
	if (avgLength > 50) confidence += 0.2;

	// Check no large gaps (permanent articles only)
	if (nums.length > 1) {
		const maxGap = nums.reduce(
			(max, n, i) => (i === 0 ? max : Math.max(max, n - nums[i - 1])),
			0
		);
		if (maxGap <= 3) confidence += 0.3;
		else warnings.push(`Large gap in numbering (max gap: ${maxGap})`);
	} else {
		confidence += 0.3;
	}

	const transCount = articles.length - permanentArts.length;
	if (transCount > 0) {
		warnings.push(`${transCount} transitory article(s) detected`);
	}

	return {
		articles,
		confidence,
		warnings,
		needsReview: confidence < 0.7
	};
}

/**
 * Extract the bill text section from a legislative document.
 *
 * Informes de comisión and comisión mixta documents contain thousands of lines
 * of debate before the actual bill text, which is marked by a standalone
 * "PROYECTO DE LEY:" header. This function extracts only the bill text section
 * so the article parser doesn't pick up spurious article references from the
 * debate discussion.
 *
 * @returns The extracted bill text (or original text if no extraction needed),
 *          plus a flag indicating whether extraction occurred.
 */
export function extractBillText(text: string, role: string): { text: string; extracted: boolean } {
	// Comparados are multi-column and redundant — skip entirely
	if (role === 'comparado') {
		return { text: '', extracted: false };
	}

	// Only informes and comisión mixta need extraction
	const needsExtraction = ['informe-comision', 'comision-mixta'];
	if (!needsExtraction.includes(role)) {
		return { text, extracted: false };
	}

	const lines = text.split('\n');

	// Find the LAST standalone "PROYECTO DE LEY" line (with or without colon)
	let billStartLine = -1;
	for (let i = lines.length - 1; i >= 0; i--) {
		const trimmed = lines[i].trim();
		if (/^PROYECTO DE LEY\s*:?\s*$/i.test(trimmed)) {
			billStartLine = i;
			break;
		}
	}

	if (billStartLine === -1) {
		return { text, extracted: false };
	}

	// Find terminator after the bill text:
	// 1) "- - -" line (optionally followed by "Acordado" within 3 lines)
	// 2) Roman-numeral section header (e.g. "VIII. DIPUTADO INFORMANTE.")
	// 3) Standalone "ACORDADO" line
	let billEndLine = lines.length;
	for (let i = billStartLine + 1; i < lines.length; i++) {
		const trimmed = lines[i].trim();

		// "- - -" followed by "Acordado" within next 3 non-empty lines
		if (trimmed === '- - -') {
			let hasAcordado = false;
			for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
				if (/^acordado/i.test(lines[j].trim())) {
					hasAcordado = true;
					break;
				}
			}
			if (hasAcordado) {
				billEndLine = i;
				break;
			}
		}

		// Roman-numeral section header (uppercase, at least 5 chars after numeral)
		// e.g. "VIII. DIPUTADO INFORMANTE."
		if (
			i > billStartLine + 3 &&
			/^[IVXLC]+\.\s+[A-ZÁÉÍÓÚÑ]{3,}/.test(trimmed)
		) {
			billEndLine = i;
			break;
		}

		// Standalone "ACORDADO" line
		if (trimmed === 'ACORDADO') {
			billEndLine = i;
			break;
		}
	}

	let extracted = lines.slice(billStartLine + 1, billEndLine).join('\n').trim();

	// Bill text in informes is typically wrapped in outer quotes: "Artículo 1°.-...".
	// Strip leading/trailing quotes so the article regex (which uses ^) can match.
	if (extracted.startsWith('"') || extracted.startsWith('\u201C')) {
		extracted = extracted.slice(1);
	}
	if (extracted.endsWith('".') || extracted.endsWith('\u201D.')) {
		extracted = extracted.slice(0, -2);
	} else if (extracted.endsWith('"') || extracted.endsWith('\u201D')) {
		extracted = extracted.slice(0, -1);
	}

	return { text: extracted.trim(), extracted: true };
}

