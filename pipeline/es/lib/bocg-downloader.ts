/**
 * BOCG PDF Downloader — downloads PDFs from Congreso and extracts text
 *
 * Uses pdftotext (from poppler) for text extraction.
 * Handles encoding conversion from ISO-8859-1 to UTF-8.
 */
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import type { BocgUrl } from '../types-tramitacion.js';

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; parlamento-ai/1.0)' };

/**
 * Phases that contain full bill text (parseable articles).
 * Skip: 2 (enmiendas table), 3 (índice), 7 (procedural notes),
 *        8 (two-column Senate comparison — not reliably parseable).
 * Include: 1 (original), 4 (ponencia), 5 (dictamen), 6 (pleno), 9 (aprobación definitiva).
 */
const TEXT_PHASES = new Set([1, 4, 5, 6, 9]);

export interface DownloadedBocg {
	phase: number;
	label: string;
	pdfPath: string;
	txtPath: string;
	text: string;
	sourceUrl: string;
}

/**
 * Download BOCG PDFs and extract text for the relevant phases.
 * Only downloads phases 1 (original), 4 (ponencia), 5 (dictamen) by default.
 *
 * @param bocgUrls - BOCG URLs from discovery
 * @param outDir - Pipeline output directory
 * @param phases - Optional override of which phases to download (default: 1,4,5)
 * @returns Array of downloaded BOCGs with extracted text
 */
export async function downloadBocgs(
	bocgUrls: BocgUrl[],
	outDir: string,
	phases?: Set<number>
): Promise<DownloadedBocg[]> {
	console.log('\n=== Phase 2: DOWNLOAD ===\n');

	const targetPhases = phases || TEXT_PHASES;
	const sourcesDir = join(outDir, 'sources');
	if (!existsSync(sourcesDir)) mkdirSync(sourcesDir, { recursive: true });

	const toDownload = bocgUrls.filter((b) => targetPhases.has(b.phase));
	console.log(`  Downloading ${toDownload.length} BOCGs (phases: ${[...targetPhases].join(', ')})`);

	const results: DownloadedBocg[] = [];

	for (const bocg of toDownload) {
		const fileName = bocg.url.split('/').pop() || `bocg-phase-${bocg.phase}.PDF`;
		const baseName = fileName.replace(/\.PDF$/i, '').toLowerCase();
		const pdfPath = join(sourcesDir, `${baseName}.pdf`);
		const txtPath = join(sourcesDir, `${baseName}.txt`);

		// Cache: skip if text already exists
		if (existsSync(txtPath)) {
			console.log(`  [cached] ${baseName}.txt`);
			const text = readFileSync(txtPath, 'utf-8');
			results.push({
				phase: bocg.phase,
				label: bocg.label,
				pdfPath,
				txtPath,
				text,
				sourceUrl: bocg.url
			});
			continue;
		}

		// Download PDF
		console.log(`  Downloading ${fileName}...`);
		const res = await fetch(bocg.url, { headers: HEADERS });
		if (!res.ok) {
			console.warn(`    WARNING: HTTP ${res.status} for ${bocg.url}, skipping`);
			continue;
		}
		const buffer = Buffer.from(await res.arrayBuffer());
		writeFileSync(pdfPath, buffer);
		console.log(`    -> ${baseName}.pdf (${(buffer.length / 1024).toFixed(0)} KB)`);

		// Extract text with pdftotext
		const text = extractText(pdfPath, txtPath);
		if (!text) {
			console.warn(`    WARNING: pdftotext produced empty output for ${baseName}`);
			continue;
		}

		console.log(`    -> ${baseName}.txt (${text.length} chars)`);
		results.push({
			phase: bocg.phase,
			label: bocg.label,
			pdfPath,
			txtPath,
			text,
			sourceUrl: bocg.url
		});
	}

	console.log(`\n  Downloaded ${results.length} BOCGs with text`);
	return results;
}

/**
 * Extract text from PDF using pdftotext.
 * Handles encoding: pdftotext output may be in ISO-8859-1, we convert to UTF-8.
 */
function extractText(pdfPath: string, txtPath: string): string {
	try {
		// pdftotext with -layout preserves column structure, -enc UTF-8 requests UTF-8 output
		execSync(`pdftotext -layout -enc UTF-8 "${pdfPath}" "${txtPath}"`, {
			timeout: 30_000,
			stdio: 'pipe'
		});

		let text = readFileSync(txtPath, 'utf-8');

		// If we get garbled text, try ISO-8859-1 fallback
		if (hasGarbledChars(text)) {
			execSync(`pdftotext -layout "${pdfPath}" "${txtPath}"`, {
				timeout: 30_000,
				stdio: 'pipe'
			});
			const rawBuf = readFileSync(txtPath);
			text = new TextDecoder('iso-8859-1').decode(rawBuf);
			writeFileSync(txtPath, text, 'utf-8');
		}

		return text;
	} catch (err) {
		console.error(`    pdftotext error: ${(err as Error).message}`);
		return '';
	}
}

/**
 * Detect garbled characters (common when ISO-8859-1 is read as UTF-8).
 * Look for common patterns like Ã¡ (á), Ã© (é), Ã³ (ó), etc.
 */
function hasGarbledChars(text: string): boolean {
	return /\u00c3[\u00a0-\u00bf]/.test(text);
}
