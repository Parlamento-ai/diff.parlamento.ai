/**
 * Phase 3: DOWNLOAD — Download all documents via Playwright
 * 100% automated from config.json
 */
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { chromium } from 'playwright';
import { downloadSenateDoc, downloadLeychileJson } from '../lib/doc-downloader.js';
import type { PipelineConfig } from '../types.js';

export async function download(config: PipelineConfig, outDir: string): Promise<void> {
	console.log('\n=== Phase 3: DOWNLOAD ===\n');

	const docsDir = join(outDir, 'docs');
	if (!existsSync(docsDir)) mkdirSync(docsDir, { recursive: true });

	const browser = await chromium.launch({ headless: false });
	const context = await browser.newContext({
		userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
		acceptDownloads: true
	});
	const page = await context.newPage();

	try {
		// Download Senate documents
		console.log('--- Senate documents ---\n');
		let downloaded = 0;
		for (const doc of config.documentos) {
			const filename = `${String(downloaded + 1).padStart(2, '0')}-${doc.rol}`;
			await downloadSenateDoc(page, doc.iddocto, doc.tipodoc, docsDir, filename);
			downloaded++;
			await page.waitForTimeout(1500);
		}
		console.log(`\n  Downloaded ${downloaded} Senate documents`);

		// Download LeyChile versions if reforma
		if (config.reforma) {
			console.log('\n--- LeyChile versions ---\n');
			const jsonDir = join(outDir, 'json');
			if (!existsSync(jsonDir)) mkdirSync(jsonDir, { recursive: true });

			for (const norma of config.reforma.normasModificadas) {
				const prePath = join(jsonDir, `${norma.nombre.replace(/ /g, '-')}-pre.json`);
				await downloadLeychileJson(page, norma.idNorma, norma.fechaPre, prePath);
				await page.waitForTimeout(1500);

				const postPath = join(jsonDir, `${norma.nombre.replace(/ /g, '-')}-post.json`);
				await downloadLeychileJson(page, norma.idNorma, norma.fechaPost, postPath);
				await page.waitForTimeout(1500);
			}
		}

		// Download LeyChile final version for non-reforma published laws
		if (config.leychileFinal) {
			console.log('\n--- LeyChile final version ---\n');
			const jsonDir = join(outDir, 'json');
			if (!existsSync(jsonDir)) mkdirSync(jsonDir, { recursive: true });

			const outPath = join(jsonDir, 'leychile-final.json');
			await downloadLeychileJson(page, config.leychileFinal.idNorma, config.leychileFinal.fecha, outPath);
			await page.waitForTimeout(1500);
		}
	} finally {
		await browser.close();
	}

	console.log('\n  Download phase complete.');
}
