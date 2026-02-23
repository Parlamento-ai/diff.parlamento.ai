/**
 * Phase 3: Download bill + formex + EP HTML sources
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import type { DiscoveredConfig, StepResult } from '../types.js';
import { downloadFile } from '../lib/http.js';
import { downloadBill } from '../lib/cellar-bill.js';
import { downloadFormex } from '../lib/cellar-formex.js';
import { countTag, extractFRBRuri, celexMatchesUri, deriveTaFromCelex } from '../lib/helpers.js';

export async function download(
	config: DiscoveredConfig,
	outDir: string
): Promise<StepResult[]> {
	const { slug, billCelex, finalCelex, epPositionCelex, taReference, lang } = config;
	const regDir = resolve(outDir, slug);
	const srcDir = join(regDir, 'sources');
	mkdirSync(srcDir, { recursive: true });

	const results: StepResult[] = [];
	const failed = new Set<string>();

	function record(
		step: number,
		id: string,
		name: string,
		status: 'PASS' | 'FAIL' | 'WARN',
		detail: string,
		t0: number
	) {
		results.push({ step, id, name, status, detail, elapsed: Date.now() - t0 });
		if (status === 'FAIL') failed.add(id);
	}

	// --- Step 1: Download bill ---
	{
		const id = 'download-bill',
			num = 1,
			name = 'Download bill';
		const t0 = Date.now();
		const billPath = join(srcDir, `${billCelex}-bill-akn.xml`);

		if (existsSync(billPath)) {
			const xml = readFileSync(billPath, 'utf-8');
			const articles = countTag(xml, 'article');
			const uri = extractFRBRuri(xml) || '';
			if (articles > 0 && celexMatchesUri(billCelex, uri))
				record(num, id, name, 'PASS', `${articles} articles (cached)`, t0);
			else if (articles > 0)
				record(num, id, name, 'WARN', `${articles} articles, CELEX mismatch (cached)`, t0);
			else record(num, id, name, 'FAIL', '0 articles in cached file', t0);
		} else {
			try {
				await downloadBill(billCelex, billPath);
				if (existsSync(billPath)) {
					const xml = readFileSync(billPath, 'utf-8');
					const articles = countTag(xml, 'article');
					record(
						num,
						id,
						name,
						articles > 0 ? 'PASS' : 'FAIL',
						articles > 0 ? `${articles} articles` : '0 articles',
						t0
					);
				} else {
					record(num, id, name, 'FAIL', 'output not created', t0);
				}
			} catch (e: any) {
				record(num, id, name, 'FAIL', e.message || 'download error', t0);
			}
		}
	}

	// --- Step 2: Download Formex ---
	{
		const id = 'download-formex',
			num = 2,
			name = 'Download formex';
		const t0 = Date.now();
		const formexPath = join(srcDir, `${finalCelex}-formex.xml`);

		if (existsSync(formexPath)) {
			const xml = readFileSync(formexPath, 'utf-8');
			const articles = countTag(xml, 'ARTICLE');
			record(
				num,
				id,
				name,
				articles > 0 ? 'PASS' : 'FAIL',
				articles > 0 ? `${articles} ARTICLE (cached)` : '0 ARTICLE in cached',
				t0
			);
		} else {
			try {
				await downloadFormex(finalCelex, srcDir);
				if (existsSync(formexPath)) {
					const xml = readFileSync(formexPath, 'utf-8');
					const articles = countTag(xml, 'ARTICLE');
					record(
						num,
						id,
						name,
						articles > 0 ? 'PASS' : 'WARN',
						articles > 0 ? `${articles} ARTICLE` : '0 ARTICLE',
						t0
					);
				} else {
					record(num, id, name, 'FAIL', 'output not created', t0);
				}
			} catch (e: any) {
				record(num, id, name, 'FAIL', e.message || 'download error', t0);
			}
		}
	}

	// --- Step 3: Download EP HTML ---
	{
		const id = 'download-ep-html',
			num = 3,
			name = 'Download EP HTML';
		const t0 = Date.now();

		if (!epPositionCelex) {
			record(num, id, name, 'WARN', 'EP position CELEX not found', t0);
		} else {
			const epHtmlName = taReference
				? `${taReference}_EN.html`
				: `${epPositionCelex}-ep-amendments.html`;
			const epHtmlPath = join(srcDir, epHtmlName);

			if (existsSync(epHtmlPath)) {
				record(num, id, name, 'PASS', `cached: ${epHtmlName}`, t0);
			} else {
				const cellarUrl = `https://publications.europa.eu/resource/celex/${epPositionCelex}`;
				console.log(`  Downloading EP OJ HTML: ${epPositionCelex}`);
				const downloaded = await downloadFile(cellarUrl, epHtmlPath, {
					Accept: 'application/xhtml+xml, text/html',
					'Accept-Language': lang
				});
				if (downloaded) {
					record(num, id, name, 'PASS', `downloaded: ${epHtmlName}`, t0);
				} else {
					record(
						num,
						id,
						name,
						'FAIL',
						`CELLAR download failed: ${epPositionCelex}`,
						t0
					);
				}
			}
		}
	}

	return results;
}
