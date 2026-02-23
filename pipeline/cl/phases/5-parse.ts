/**
 * Phase 5: PARSE — Parse articles from extracted text
 * Semi-automated: regex-first, user review if low confidence
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { parseArticles, extractBillText } from '../lib/article-parser.js';
import { parseLeychileArticles } from '../lib/leychile-api.js';
import type { PipelineConfig, ParsedArticle, ParseResult } from '../types.js';

export interface ParsedDocuments {
	[role: string]: ParsedArticle[];
}

export async function parse(
	config: PipelineConfig,
	outDir: string
): Promise<ParsedDocuments> {
	console.log('\n=== Phase 5: PARSE ===\n');

	const textsDir = join(outDir, 'texts');
	const jsonDir = join(outDir, 'json');
	const articlesPath = join(outDir, 'articles.json');

	// Load cached if exists
	if (existsSync(articlesPath)) {
		console.log(`  Loading cached ${articlesPath}`);
		return JSON.parse(readFileSync(articlesPath, 'utf-8'));
	}

	const parsed: ParsedDocuments = {};

	// Parse each document by role
	for (const doc of config.documentos) {
		const baseName = config.documentos.indexOf(doc);
		const prefix = String(baseName + 1).padStart(2, '0');

		// Find the text file
		const textFiles = existsSync(textsDir)
			? readdirSync(textsDir).filter((f) => f.startsWith(prefix))
			: [];

		if (textFiles.length > 0) {
			const textPath = join(textsDir, textFiles[0]);
			const rawText = readFileSync(textPath, 'utf-8');

			// Extract bill text section for informes/comisión mixta (skip debate)
			const { text, extracted } = extractBillText(rawText, doc.rol);
			if (doc.rol === 'comparado') {
				console.log(`  Skipping ${doc.rol} (multi-column, redundant)`);
				continue;
			}
			if (extracted) {
				console.log(`  Extracted bill text from ${doc.rol} (${text.length} chars from ${rawText.length})`);
			}

			console.log(`  Parsing ${doc.rol} (${textFiles[0]})...`);
			const result = parseArticles(text);
			logParseResult(doc.rol, result);

			// Don't overwrite existing articles with empty results (duplicate roles)
			const existing = parsed[doc.rol];
			if (!existing || existing.length === 0 || result.articles.length > existing.length) {
				parsed[doc.rol] = result.articles;
			} else {
				console.log(`    (keeping previous ${existing.length} articles for ${doc.rol})`);
			}
		}
	}

	// Parse LeyChile JSON if reforma
	if (config.reforma && existsSync(jsonDir)) {
		for (const norma of config.reforma.normasModificadas) {
			const slug = norma.nombre.replace(/ /g, '-');

			const prePath = join(jsonDir, `${slug}-pre.json`);
			if (existsSync(prePath)) {
				console.log(`  Parsing LeyChile ${norma.nombre} (pre-reform)...`);
				const json = JSON.parse(readFileSync(prePath, 'utf-8'));
				parsed[`leychile-${slug}-pre`] = parseLeychileArticles(json);
				console.log(`    -> ${parsed[`leychile-${slug}-pre`].length} articles`);
			}

			const postPath = join(jsonDir, `${slug}-post.json`);
			if (existsSync(postPath)) {
				console.log(`  Parsing LeyChile ${norma.nombre} (post-reform)...`);
				const json = JSON.parse(readFileSync(postPath, 'utf-8'));
				parsed[`leychile-${slug}-post`] = parseLeychileArticles(json);
				console.log(`    -> ${parsed[`leychile-${slug}-post`].length} articles`);
			}
		}
	}

	// Parse LeyChile final version for non-reforma published laws
	if (existsSync(jsonDir)) {
		const finalPath = join(jsonDir, 'leychile-final.json');
		if (existsSync(finalPath)) {
			console.log('  Parsing LeyChile final (published law)...');
			const json = JSON.parse(readFileSync(finalPath, 'utf-8'));
			parsed['leychile-final'] = parseLeychileArticles(json);
			console.log(`    -> ${parsed['leychile-final'].length} articles`);
		}
	}

	// Save
	writeFileSync(articlesPath, JSON.stringify(parsed, null, 2), 'utf-8');
	console.log(`\n  -> Saved ${articlesPath}`);

	return parsed;
}

function logParseResult(role: string, result: ParseResult): void {
	console.log(`    ${result.articles.length} articles, confidence: ${result.confidence.toFixed(2)}`);
	if (result.warnings.length > 0) {
		for (const w of result.warnings) console.warn(`    WARNING: ${w}`);
	}
	if (result.needsReview) {
		console.warn(`    ⚠ LOW CONFIDENCE — review ${role} articles manually`);
	}
}
