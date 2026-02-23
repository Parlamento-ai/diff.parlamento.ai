/**
 * Phase 4: EXTRACT — Extract text from downloaded documents
 * 100% automated
 */
import { readdirSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { extractText } from '../lib/text-extractor.js';
import type { ExtractionResult } from '../types.js';

export async function extract(outDir: string): Promise<Map<string, ExtractionResult>> {
	console.log('\n=== Phase 4: EXTRACT ===\n');

	const docsDir = join(outDir, 'docs');
	const textsDir = join(outDir, 'texts');
	if (!existsSync(textsDir)) mkdirSync(textsDir, { recursive: true });

	const results = new Map<string, ExtractionResult>();

	// Extract text from downloaded docs
	const files = readdirSync(docsDir)
		.filter((f) => f.match(/\.(pdf|doc|docx|html)$/))
		.sort();

	for (const file of files) {
		const filePath = join(docsDir, file);
		const baseName = file.replace(/\.[^.]+$/, '');
		const outPath = join(textsDir, `${baseName}.txt`);

		// Skip if already extracted
		if (existsSync(outPath)) {
			console.log(`  SKIP ${baseName} (already extracted)`);
			continue;
		}

		console.log(`  Extracting ${file}...`);
		const result = await extractText(filePath);
		results.set(baseName, result);

		if (!result.failed) {
			writeFileSync(outPath, result.text, 'utf-8');
			console.log(`  -> ${baseName}.txt (${result.text.length} chars)`);
		} else {
			console.warn(`  WARNING: ${baseName} extraction failed`);
		}
	}

	// Also extract from LeyChile JSON if present
	const jsonDir = join(outDir, 'json');
	if (existsSync(jsonDir)) {
		const jsonFiles = readdirSync(jsonDir).filter((f) => f.endsWith('.json'));
		for (const file of jsonFiles) {
			const baseName = file.replace('.json', '');
			results.set(baseName, {
				text: '', // JSON is parsed directly in phase 5
				pages: 0,
				failed: false,
				source: file
			});
		}
	}

	const successCount = [...results.values()].filter((r) => !r.failed).length;
	console.log(`\n  Extracted ${successCount}/${results.size} documents`);

	return results;
}
