/**
 * Scrape Peru legislative sources for Ley 31814 (PL 2775/2022-CR)
 * using Playwright to bypass CloudFront and render SPAs.
 *
 * Each part uses a SEPARATE page to avoid cascading navigation errors.
 *
 * Usage: node scripts/peru-31814/scrape-sources.mjs
 */

import { chromium } from 'playwright';
import { writeFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '../../research/2026-02-24/peru-31814');
mkdirSync(OUT_DIR, { recursive: true });

const report = [];
function log(msg) {
	console.log(msg);
	report.push(msg);
}

// ─────────────────────────────────────────────────────────────────
// Part 1: spley-portal SPA — render expediente, capture XHR
// ─────────────────────────────────────────────────────────────────
async function scrapeSpleypPortal(context) {
	log('\n=== Part 1: spley-portal SPA ===\n');
	const page = await context.newPage();
	const xhrResponses = [];

	page.on('response', async (resp) => {
		const url = resp.url();
		const ct = resp.headers()['content-type'] || '';
		if (ct.includes('json') || url.includes('spley-portal-service') || url.includes('participacion')) {
			try {
				const body = await resp.text();
				xhrResponses.push({ url, status: resp.status(), contentType: ct, bodyLength: body.length, body: body.substring(0, 50000) });
				log(`    XHR: ${resp.status()} ${url.substring(0, 100)}`);
			} catch {
				xhrResponses.push({ url, status: resp.status(), error: 'unreadable' });
			}
		}
	});

	try {
		// Load with 'load' event (not networkidle which times out)
		log('  Loading spley-portal with expediente route...');
		await page.goto('https://wb2server.congreso.gob.pe/spley-portal/#/expediente/2021/2775', {
			waitUntil: 'load',
			timeout: 30_000
		});

		// Wait for Angular to bootstrap and render
		log('  Waiting for Angular to render...');
		await page.waitForTimeout(10000);

		// Check if the SPA rendered the expediente
		const bodyText = await page.evaluate(() => document.body.innerText);
		writeFileSync(join(OUT_DIR, 'spley-portal-text.txt'), bodyText, 'utf-8');
		log(`  Visible text: ${bodyText.length} chars`);
		log(`  First 300 chars: ${bodyText.substring(0, 300).replace(/\n/g, ' | ')}`);

		// Save full HTML and screenshot
		const html = await page.content();
		writeFileSync(join(OUT_DIR, 'spley-portal-page.html'), html, 'utf-8');
		await page.screenshot({ path: join(OUT_DIR, 'spley-portal-screenshot.png'), fullPage: true });

		// Look for PDF download links in the rendered DOM
		const allLinks = await page.$$eval('a', (els) =>
			els.map((el) => ({ href: el.href, text: el.textContent?.trim()?.substring(0, 100) }))
				.filter((l) => l.href || l.text)
		);
		log(`  Links found: ${allLinks.length}`);
		writeFileSync(join(OUT_DIR, 'spley-portal-links.json'), JSON.stringify(allLinks, null, 2), 'utf-8');
	} catch (err) {
		log(`  ERROR: ${err.message.split('\n')[0]}`);
	}

	writeFileSync(join(OUT_DIR, 'spley-portal-xhr.json'), JSON.stringify(xhrResponses, null, 2), 'utf-8');
	log(`  Total XHR captured: ${xhrResponses.length}`);
	await page.close();
	return xhrResponses;
}

// ─────────────────────────────────────────────────────────────────
// Part 2: Download bill PDF via multiple methods
// ─────────────────────────────────────────────────────────────────
async function downloadBillPdf(context) {
	log('\n=== Part 2: Download bill PDF ===\n');

	const pdfPath = join(OUT_DIR, 'pl-2775-proyecto.pdf');
	const pdfUrl = 'https://wb2server.congreso.gob.pe/spley-portal-service/archivo/ODQ1OTA=/pdf/PL%202775%20(U)';

	// Method 1: Direct navigation with download event (new page)
	log('  Method 1: Direct navigation with download event...');
	try {
		const page = await context.newPage();
		const [download] = await Promise.all([
			page.waitForEvent('download', { timeout: 20000 }),
			page.goto(pdfUrl).catch(() => {})
		]);
		await download.saveAs(pdfPath);
		await page.close();
		const size = statSync(pdfPath).size;
		if (size > 1000) {
			log(`  Method 1: OK — ${size} bytes`);
			return true;
		}
		log(`  Method 1: Too small (${size} bytes)`);
	} catch (err) {
		log(`  Method 1: FAILED — ${err.message.split('\n')[0]}`);
	}

	// Method 2: Navigate to spley-portal SPA first, then fetch PDF in that context
	log('  Method 2: Establish session in SPA, then fetch PDF...');
	try {
		const page = await context.newPage();
		await page.goto('https://wb2server.congreso.gob.pe/spley-portal/', { waitUntil: 'load', timeout: 30_000 });
		await page.waitForTimeout(5000);

		const result = await page.evaluate(async (url) => {
			try {
				const resp = await fetch(url, { credentials: 'include', mode: 'cors' });
				if (!resp.ok) return { ok: false, status: resp.status };
				const buf = await resp.arrayBuffer();
				const bytes = new Uint8Array(buf);
				let binary = '';
				for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
				return { ok: true, data: btoa(binary), length: buf.byteLength };
			} catch (e) {
				return { ok: false, error: String(e) };
			}
		}, pdfUrl);

		await page.close();

		if (result.ok && result.length > 1000) {
			writeFileSync(pdfPath, Buffer.from(result.data, 'base64'));
			log(`  Method 2: OK — ${result.length} bytes`);
			return true;
		}
		log(`  Method 2: FAILED — ${JSON.stringify(result)}`);
	} catch (err) {
		log(`  Method 2: ERROR — ${err.message.split('\n')[0]}`);
	}

	// Method 3: Playwright context API request
	log('  Method 3: Playwright context.request.get...');
	try {
		const resp = await context.request.get(pdfUrl);
		if (resp.ok()) {
			const body = await resp.body();
			if (body.length > 1000) {
				writeFileSync(pdfPath, body);
				log(`  Method 3: OK — ${body.length} bytes`);
				return true;
			}
		}
		log(`  Method 3: HTTP ${resp.status()}`);
	} catch (err) {
		log(`  Method 3: ERROR — ${err.message.split('\n')[0]}`);
	}

	// Method 4: Try alternate URL patterns
	log('  Method 4: Trying alternate PDF URLs...');
	const altUrls = [
		'https://api.congreso.gob.pe/spley-portal-service/archivo/ODQ1OTA=/pdf',
		'https://wb2server.congreso.gob.pe/service-alfresco/alfresko/detalle/preview/file?idDocument=ODQ1OTA='
	];
	for (const altUrl of altUrls) {
		try {
			const resp = await context.request.get(altUrl);
			const body = await resp.body();
			log(`    ${altUrl.substring(0, 80)}: HTTP ${resp.status()}, ${body.length} bytes`);
			if (resp.ok() && body.length > 1000) {
				writeFileSync(pdfPath, body);
				log(`  Method 4: OK — ${body.length} bytes`);
				return true;
			}
		} catch (err) {
			log(`    ERROR: ${err.message.split('\n')[0]}`);
		}
	}

	log('  ALL METHODS FAILED for bill PDF');
	return false;
}

// ─────────────────────────────────────────────────────────────────
// Part 3: Votaciones del Pleno (separate page)
// ─────────────────────────────────────────────────────────────────
async function scrapeVotaciones(context) {
	log('\n=== Part 3: Votaciones del Pleno ===\n');
	const page = await context.newPage();
	const xhrResponses = [];

	page.on('response', async (resp) => {
		const url = resp.url();
		const ct = resp.headers()['content-type'] || '';
		if (
			ct.includes('json') || ct.includes('xml') ||
			url.includes('Storage') || url.includes('modsnw') ||
			url.includes('votacion') || url.includes('asistencia') ||
			url.includes('pleno') || url.includes('Sicr')
		) {
			try {
				const body = await resp.text();
				xhrResponses.push({ url, status: resp.status(), contentType: ct, bodyLength: body.length, body: body.substring(0, 100000) });
				log(`    XHR: ${resp.status()} ${url.substring(0, 100)}`);
			} catch {
				xhrResponses.push({ url, status: resp.status(), error: 'unreadable' });
			}
		}
	});

	try {
		log('  Loading votaciones page...');
		await page.goto('https://www.congreso.gob.pe/AsistenciasVotacionesPleno/asistencia-votacion-pleno', {
			waitUntil: 'load',
			timeout: 30_000
		});
		await page.waitForTimeout(5000);
		log(`  Page loaded. Title: ${await page.title()}`);

		const html = await page.content();
		writeFileSync(join(OUT_DIR, 'votaciones-pleno-page.html'), html, 'utf-8');
		log(`  HTML: ${html.length} chars`);

		await page.screenshot({ path: join(OUT_DIR, 'votaciones-pleno-screenshot.png'), fullPage: true });
		log('  Screenshot saved');

		// Extract all links
		const links = await page.$$eval('a[href]', (els) =>
			els.map((el) => ({ href: el.href, text: el.textContent?.trim() }))
				.filter((l) => l.text && l.text.length > 0)
		);
		writeFileSync(join(OUT_DIR, 'votaciones-all-links.json'), JSON.stringify(links, null, 2), 'utf-8');
		log(`  Links: ${links.length}`);

		// Check for iframes
		const iframes = await page.$$eval('iframe', (els) =>
			els.map((el) => ({ src: el.src, id: el.id, name: el.name }))
		);
		log(`  Iframes: ${iframes.length}`);
		if (iframes.length > 0) {
			writeFileSync(join(OUT_DIR, 'votaciones-iframes.json'), JSON.stringify(iframes, null, 2), 'utf-8');
			for (const iframe of iframes) {
				if (iframe.src) log(`    Iframe: ${iframe.src}`);
			}
		}
	} catch (err) {
		log(`  ERROR: ${err.message.split('\n')[0]}`);
	}

	// Try the Lotus Notes voting pages directly
	try {
		log('\n  Trying Lotus Notes voting pages...');
		const lotusUrls = [
			'https://www2.congreso.gob.pe/Sicr/TraDocEstProc/Expvirt_2021.nsf/RepExpVirt?OpenForm&Db=202102775&View=',
			'https://www2.congreso.gob.pe/Sicr/TraDocEstProc/CLVotaci.nsf/votacionplenary2021?OpenView&Start=1&Count=50&RestrictToCategory=2023-05'
		];
		for (const url of lotusUrls) {
			try {
				const resp = await page.goto(url, { waitUntil: 'load', timeout: 15_000 });
				const status = resp?.status() || 'unknown';
				log(`    ${url.split('nsf/')[1]?.substring(0, 60) || url}: ${status}`);
				if (status === 200) {
					const html = await page.content();
					const filename = url.includes('CLVotaci') ? 'votaciones-lotus.html' : 'expediente-lotus.html';
					writeFileSync(join(OUT_DIR, filename), html, 'utf-8');
					log(`    Saved ${filename} (${html.length} chars)`);
					await page.screenshot({ path: join(OUT_DIR, filename.replace('.html', '-screenshot.png')), fullPage: true });
				}
			} catch (e) {
				log(`    ERROR: ${e.message.split('\n')[0]}`);
			}
		}
	} catch (err) {
		log(`  Lotus Notes ERROR: ${err.message.split('\n')[0]}`);
	}

	writeFileSync(join(OUT_DIR, 'votaciones-xhr-responses.json'), JSON.stringify(xhrResponses, null, 2), 'utf-8');
	log(`  Total XHR: ${xhrResponses.length}`);
	await page.close();
	return xhrResponses;
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────
async function main() {
	log('╔════════════════════════════════════════════════╗');
	log('║  Peru Scraper — Ley 31814 (PL 2775/2022-CR)   ║');
	log('╚════════════════════════════════════════════════╝');
	log(`  Output: ${OUT_DIR}`);
	log(`  Date: ${new Date().toISOString()}\n`);

	const browser = await chromium.launch({ headless: false });
	const context = await browser.newContext({
		userAgent:
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
		acceptDownloads: true,
		ignoreHTTPSErrors: true
	});

	try {
		await scrapeSpleypPortal(context);
		await downloadBillPdf(context);
		await scrapeVotaciones(context);

		// Summary
		log('\n\n========== SCRAPE SUMMARY ==========');
		const check = (f) => existsSync(join(OUT_DIR, f));
		const size = (f) => check(f) ? statSync(join(OUT_DIR, f)).size : 0;
		log(`  spley-portal text: ${size('spley-portal-text.txt')} chars`);
		log(`  spley-portal XHR:  ${check('spley-portal-xhr.json') ? 'SAVED' : 'FAILED'}`);
		log(`  Bill PDF:          ${size('pl-2775-proyecto.pdf') > 1000 ? `OK (${size('pl-2775-proyecto.pdf')} bytes)` : 'NOT DOWNLOADED'}`);
		log(`  Votaciones page:   ${size('votaciones-pleno-page.html') > 100 ? 'SAVED' : 'FAILED'}`);
		log(`  Votaciones XHR:    ${check('votaciones-xhr-responses.json') ? 'SAVED' : 'FAILED'}`);
		log('====================================\n');
	} catch (err) {
		log(`\nFATAL ERROR: ${err.message}`);
	} finally {
		writeFileSync(join(OUT_DIR, 'scrape-report.txt'), report.join('\n'), 'utf-8');
		log('Report saved to scrape-report.txt');
		await browser.close();
	}
}

main().catch(console.error);
