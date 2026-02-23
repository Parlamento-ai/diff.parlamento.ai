/**
 * Document downloader — Playwright-based for Cloudflare bypass
 * Consolidated from scripts/ley-17370/download-docs.mjs etc.
 */
import type { Page } from 'playwright';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const SENADO_DOC_URL =
	'https://www.senado.cl/appsenado/index.php?mo=tramitacion&ac=getDocto';

/** Download a Senate document (HTML, PDF, or DOC) */
export async function downloadSenateDoc(
	page: Page,
	iddocto: string,
	tipodoc: string,
	outDir: string,
	filename: string
): Promise<string | null> {
	const outPath = join(outDir, filename);

	// Check for existing file with any extension
	const baseName = filename.replace(/\.[^.]+$/, '');
	const extensions = ['html', 'pdf', 'doc', 'docx'];
	for (const ext of extensions) {
		if (existsSync(join(outDir, `${baseName}.${ext}`))) {
			console.log(`  SKIP ${baseName} (exists)`);
			return join(outDir, `${baseName}.${ext}`);
		}
	}

	const url = `${SENADO_DOC_URL}&iddocto=${iddocto}&tipodoc=${tipodoc}`;
	console.log(`  Downloading iddocto=${iddocto} (${tipodoc})...`);

	try {
		// Try download event first (for PDFs/DOCs)
		const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
		await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});

		const download = await downloadPromise;

		if (download) {
			const suggestedName = download.suggestedFilename();
			const ext = suggestedName.split('.').pop() || 'pdf';
			const finalPath = join(outDir, `${baseName}.${ext}`);
			await download.saveAs(finalPath);
			console.log(`  -> ${baseName}.${ext} (${suggestedName})`);
			return finalPath;
		}

		// No download event — it's HTML content
		await page.waitForTimeout(2000);
		const html = await page.content();
		const htmlPath = join(outDir, `${baseName}.html`);
		writeFileSync(htmlPath, html, 'utf-8');
		console.log(`  -> ${baseName}.html (${html.length} chars)`);
		return htmlPath;
	} catch (err) {
		console.error(`  ERROR downloading ${baseName}: ${(err as Error).message}`);
		return null;
	}
}

/** Download LeyChile JSON and save to file */
export async function downloadLeychileJson(
	page: Page,
	idNorma: number,
	version: string | undefined,
	outPath: string
): Promise<string | null> {
	if (existsSync(outPath)) {
		console.log(`  SKIP ${outPath} (exists)`);
		return outPath;
	}

	let url = `https://nuevo.leychile.cl/servicios/Navegar/get_norma_json?idNorma=${idNorma}`;
	if (version) url += `&idVersion=${version}`;

	console.log(`  Downloading LeyChile idNorma=${idNorma}${version ? ` v=${version}` : ''}...`);

	try {
		await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
		await page.waitForTimeout(3000);
		const text = await page.innerText('body');
		writeFileSync(outPath, text, 'utf-8');
		console.log(`  -> ${outPath} (${text.length} chars)`);
		return outPath;
	} catch (err) {
		console.error(`  ERROR: ${(err as Error).message}`);
		return null;
	}
}
