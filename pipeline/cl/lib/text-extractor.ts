/**
 * Text extraction from PDFs, DOCs, DOCX, HTML
 * Consolidated from scripts/ley-17370/extract-text.mjs etc.
 */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
import type { ExtractionResult } from '../types.js';

const require = createRequire(import.meta.url);

/** Extract text from any supported document format */
export async function extractText(filePath: string): Promise<ExtractionResult> {
	const ext = filePath.split('.').pop()?.toLowerCase();
	const source = filePath.split(/[/\\]/).pop() || filePath;

	try {
		let text: string;
		let pages = 0;

		switch (ext) {
			case 'pdf':
				({ text, pages } = await extractPdf(filePath));
				break;
			case 'doc':
				text = await extractDoc(filePath);
				break;
			case 'docx':
				text = await extractDocx(filePath);
				break;
			case 'html':
				text = extractHtml(filePath);
				break;
			case 'json':
				text = readFileSync(filePath, 'utf-8');
				break;
			default:
				text = readFileSync(filePath, 'utf-8');
		}

		if (!text || text.trim().length < 50) {
			console.warn(`  WARNING: ${source} produced minimal text (${text.length} chars)`);
			return { text: text || '', pages, failed: true, source };
		}

		return { text, pages, failed: false, source };
	} catch (err) {
		console.error(`  ERROR extracting ${source}: ${(err as Error).message}`);
		return { text: '', pages: 0, failed: true, source };
	}
}

async function extractPdf(filePath: string): Promise<{ text: string; pages: number }> {
	const { PDFParse } = await import('pdf-parse');
	const buffer = readFileSync(filePath);
	const pdf = new PDFParse(new Uint8Array(buffer));
	await pdf.load();
	const result = await pdf.getText();
	pdf.destroy();
	return { text: result.text, pages: result.total || 0 };
}

async function extractDoc(filePath: string): Promise<string> {
	const WordExtractor = require('word-extractor');
	const extractor = new WordExtractor();
	const doc = await extractor.extract(filePath);
	return doc.getBody();
}

async function extractDocx(filePath: string): Promise<string> {
	const mammoth = require('mammoth');
	const result = await mammoth.extractRawText({ path: filePath });
	return result.value;
}

function extractHtml(filePath: string): string {
	const html = readFileSync(filePath, 'utf-8');
	return html
		.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
		.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/\s+/g, ' ')
		.trim();
}
