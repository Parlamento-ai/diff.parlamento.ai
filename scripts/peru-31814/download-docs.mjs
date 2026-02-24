/**
 * Download documents from Peru's Expediente Virtual for Ley 31814
 *
 * Strategy: Navigate to the Expediente Virtual (Lotus Notes) which embeds PDFs
 * in iframes. We intercept the network responses to capture the PDF bytes,
 * since cross-origin fetch/download methods fail (different domains).
 *
 * The Expediente Virtual has menu items that load different PDFs in an iframe:
 *   - 05: Texto aprobado (Autógrafa) → archivo/MTA4MTM4/pdf/AU2775
 *   - 01: Norma legal publicada → archivo/MTE2MTkw/pdf/31814-LEY
 *   - 06: Texto consolidado → leyes.congreso.gob.pe (already downloaded)
 *
 * The proyecto original (PL 2775) is NOT accessible via Expediente Virtual
 * menu — it's only available via spley-portal which we'll try separately.
 *
 * Usage: node scripts/peru-31814/download-docs.mjs
 */

import { chromium } from 'playwright';
import { writeFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '../../research/2026-02-24/peru-31814');
mkdirSync(OUT_DIR, { recursive: true });

/**
 * Navigate to a menu item in the Expediente Virtual Lotus Notes form.
 * Menu items are identified by number (01, 05, 06, etc.)
 * Each menu item loads a different document in the iframe.
 */
async function navigateMenu(page, menuNum) {
	await page.evaluate((num) => {
		document.forms[0].num.value = num;
		document._domino_target = '_self';
		document.forms[0].__Click.value = '$Refresh';
		document.forms[0].submit();
	}, menuNum);
}

async function main() {
	console.log('╔════════════════════════════════════════════════════╗');
	console.log('║  Download Peru docs — Ley 31814 (PL 2775/2022-CR) ║');
	console.log('╚════════════════════════════════════════════════════╝\n');

	const browser = await chromium.launch({ headless: false });
	const context = await browser.newContext({
		userAgent:
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
		acceptDownloads: true,
		ignoreHTTPSErrors: true
	});

	const results = {};

	// ── Step 1: Load Expediente Virtual ──────────────────────────────
	console.log('Step 1: Loading Expediente Virtual...');
	const page = await context.newPage();

	// Intercept ALL responses to capture PDFs
	const capturedPdfs = new Map();
	page.on('response', async (resp) => {
		const url = resp.url();
		if (url.includes('spley-portal-service/archivo') || url.includes('api.congreso.gob.pe')) {
			try {
				const ct = resp.headers()['content-type'] || '';
				const status = resp.status();
				console.log(`  [intercept] ${status} ${ct.substring(0, 30)} ${url.substring(0, 100)}`);
				if (status === 200 && (ct.includes('pdf') || ct.includes('octet'))) {
					const body = await resp.body();
					if (body.length > 1000) {
						capturedPdfs.set(url, body);
						console.log(`  [intercept] CAPTURED ${body.length} bytes from ${url.substring(0, 80)}`);
					}
				}
			} catch {
				// Response body may not be available (e.g., redirects)
			}
		}
	});

	try {
		await page.goto(
			'https://www2.congreso.gob.pe/Sicr/TraDocEstProc/Expvirt_2021.nsf/RepExpVirt?OpenForm&Db=202102775&View=',
			{ waitUntil: 'load', timeout: 30_000 }
		);
		console.log('  Expediente Virtual loaded.\n');
		await page.waitForTimeout(2000);
	} catch (err) {
		console.log(`  FATAL: ${err.message.split('\n')[0]}`);
		await browser.close();
		return;
	}

	// ── Step 2: Navigate to "Texto aprobado" (menu 05) ──────────────
	// This loads the Autógrafa PDF in the iframe
	const autografaPath = join(OUT_DIR, 'autografa-au2775.pdf');
	if (existsSync(autografaPath) && statSync(autografaPath).size > 1000) {
		console.log(`Step 2: SKIP autógrafa (already exists, ${statSync(autografaPath).size} bytes)\n`);
	} else {
		console.log('Step 2: Navigating to "Texto aprobado" (Autógrafa)...');
		try {
			await Promise.all([
				page.waitForNavigation({ waitUntil: 'load', timeout: 20_000 }).catch(() => {}),
				navigateMenu(page, '05')
			]);
			// Wait for the iframe to load the PDF
			await page.waitForTimeout(8000);

			// Check if we captured the PDF via response interception
			for (const [url, body] of capturedPdfs) {
				if (url.includes('MTA4MTM4') || url.includes('AU2775')) {
					writeFileSync(autografaPath, body);
					console.log(`  Autógrafa: OK — ${body.length} bytes (intercepted)\n`);
					results.autografa = body.length;
					break;
				}
			}

			if (!results.autografa) {
				console.log('  Autógrafa: NOT captured via interception');
				// Fallback: try to get the iframe URL and navigate to it in a new page
				const iframeSrc = await page.$eval('#windowO2', (el) => el.src).catch(() => '');
				console.log(`  Iframe src: ${iframeSrc}`);
			}
		} catch (err) {
			console.log(`  ERROR: ${err.message.split('\n')[0]}`);
		}
	}

	// ── Step 3: Navigate to "Norma legal publicada" (menu 01) ───────
	const leyPath = join(OUT_DIR, 'ley-31814-publicada.pdf');
	if (existsSync(leyPath) && statSync(leyPath).size > 1000) {
		console.log(`Step 3: SKIP ley publicada (already exists, ${statSync(leyPath).size} bytes)\n`);
	} else {
		console.log('Step 3: Navigating to "Norma legal publicada"...');
		capturedPdfs.clear();
		try {
			await Promise.all([
				page.waitForNavigation({ waitUntil: 'load', timeout: 20_000 }).catch(() => {}),
				navigateMenu(page, '01')
			]);
			await page.waitForTimeout(8000);

			// Check captured PDFs
			for (const [url, body] of capturedPdfs) {
				if (url.includes('MTE2MTkw') || url.includes('31814-LEY')) {
					writeFileSync(leyPath, body);
					console.log(`  Ley publicada: OK — ${body.length} bytes (intercepted)\n`);
					results.ley = body.length;
					break;
				}
			}

			if (!results.ley) {
				console.log('  Ley publicada: NOT captured via interception');
				const iframeSrc = await page.$eval('#windowO2', (el) => el.src).catch(() => '');
				console.log(`  Iframe src: ${iframeSrc}\n`);
			}
		} catch (err) {
			console.log(`  ERROR: ${err.message.split('\n')[0]}`);
		}
	}

	// ── Step 4: Try proyecto original via spley-portal ───────────────
	// The proyecto is not in the Expediente Virtual menu — it's only accessible
	// via spley-portal. Try establishing session there first.
	const proyectoPath = join(OUT_DIR, 'pl-2775-proyecto.pdf');
	if (existsSync(proyectoPath) && statSync(proyectoPath).size > 1000) {
		console.log(`Step 4: SKIP proyecto (already exists, ${statSync(proyectoPath).size} bytes)\n`);
	} else {
		console.log('Step 4: Trying proyecto original via spley-portal...');
		capturedPdfs.clear();
		const spaPage = await context.newPage();

		// Intercept responses on SPA page too
		spaPage.on('response', async (resp) => {
			const url = resp.url();
			if (url.includes('spley-portal-service/archivo') || url.includes('api.congreso.gob.pe')) {
				try {
					const ct = resp.headers()['content-type'] || '';
					const status = resp.status();
					console.log(`  [spa-intercept] ${status} ${ct.substring(0, 30)} ${url.substring(0, 100)}`);
					if (status === 200 && (ct.includes('pdf') || ct.includes('octet'))) {
						const body = await resp.body();
						if (body.length > 1000) {
							capturedPdfs.set(url, body);
							console.log(`  [spa-intercept] CAPTURED ${body.length} bytes`);
						}
					}
				} catch {}
			}
		});

		try {
			// Load SPA to establish session
			console.log('  Loading spley-portal SPA...');
			await spaPage.goto('https://wb2server.congreso.gob.pe/spley-portal/#/expediente/2021/2775', {
				waitUntil: 'load',
				timeout: 30_000
			});
			await spaPage.waitForTimeout(8000);

			// Now try to navigate to the PDF URL directly
			console.log('  Navigating to proyecto PDF URL...');
			const proyectoUrl =
				'https://wb2server.congreso.gob.pe/spley-portal-service/archivo/ODQ1OTA=/pdf/PL%202775%20(U)';

			// Method 1: route interception — fulfill the request but capture it
			const respPromise = spaPage.waitForResponse(
				(resp) => resp.url().includes('ODQ1OTA') || resp.url().includes('PL%202775'),
				{ timeout: 15_000 }
			).catch(() => null);

			await spaPage.goto(proyectoUrl, { waitUntil: 'load', timeout: 15_000 }).catch(() => {});
			await spaPage.waitForTimeout(5000);

			const pdfResp = await respPromise;
			if (pdfResp && pdfResp.status() === 200) {
				try {
					const body = await pdfResp.body();
					if (body.length > 1000) {
						writeFileSync(proyectoPath, body);
						console.log(`  Proyecto: OK — ${body.length} bytes (response intercept)\n`);
						results.proyecto = body.length;
					}
				} catch (err) {
					console.log(`  Could not read response body: ${err.message.split('\n')[0]}`);
				}
			}

			// Check if anything was captured by the response listener
			if (!results.proyecto) {
				for (const [url, body] of capturedPdfs) {
					if (url.includes('ODQ1OTA') || url.includes('PL')) {
						writeFileSync(proyectoPath, body);
						console.log(`  Proyecto: OK — ${body.length} bytes (listener)\n`);
						results.proyecto = body.length;
						break;
					}
				}
			}

			if (!results.proyecto) {
				// Method 2: Try context.request (Playwright API request with browser cookies)
				console.log('  Method 2: context.request.get...');
				const cookies = await context.cookies();
				console.log(`  Cookies: ${cookies.length} total`);
				for (const c of cookies) {
					console.log(`    ${c.domain}: ${c.name}=${c.value.substring(0, 20)}...`);
				}

				try {
					const resp = await context.request.get(proyectoUrl);
					const ct = resp.headers()['content-type'] || '';
					console.log(`  context.request: ${resp.status()} ${ct}`);
					if (resp.ok()) {
						const body = await resp.body();
						if (body.length > 1000) {
							writeFileSync(proyectoPath, body);
							console.log(`  Proyecto: OK — ${body.length} bytes (context.request)\n`);
							results.proyecto = body.length;
						}
					}
				} catch (err) {
					console.log(`  context.request: ${err.message.split('\n')[0]}`);
				}
			}

			if (!results.proyecto) {
				console.log('  Proyecto: ALL METHODS FAILED\n');
			}
		} catch (err) {
			console.log(`  ERROR: ${err.message.split('\n')[0]}`);
		}
		await spaPage.close();
	}

	// ── Summary ──────────────────────────────────────────────────────
	console.log('========== DOWNLOAD SUMMARY ==========');
	const files = [
		{ name: 'autografa-au2775.pdf', desc: 'Autógrafa' },
		{ name: 'ley-31814-publicada.pdf', desc: 'Ley publicada' },
		{ name: 'pl-2775-proyecto.pdf', desc: 'Proyecto original' }
	];
	for (const f of files) {
		const path = join(OUT_DIR, f.name);
		const exists = existsSync(path);
		const size = exists ? statSync(path).size : 0;
		console.log(`  ${f.desc}: ${size > 1000 ? `OK (${size} bytes)` : 'FAILED'}`);
	}
	console.log('======================================\n');

	await page.close();
	await browser.close();
}

main().catch(console.error);
