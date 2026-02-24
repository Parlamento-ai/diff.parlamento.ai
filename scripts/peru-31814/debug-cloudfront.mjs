/**
 * Final attempt: try alternative services and old Lotus Notes URLs.
 *
 * Radware WAF blocks all spley-portal-service endpoints.
 * Let's try:
 * 1. service-alfresco (document management backend)
 * 2. Lotus Notes Seguimiento de Proyectos (different DB than Expvirt)
 * 3. Old-format project tracking URLs
 * 4. Congreso web search for the proyecto
 *
 * Usage: node scripts/peru-31814/debug-cloudfront.mjs
 */

import { chromium } from 'playwright';
import { writeFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '../../research/2026-02-24/peru-31814');
mkdirSync(OUT_DIR, { recursive: true });

async function main() {
	console.log('=== Final attempt: alternative sources for PL 2775 ===\n');

	const browser = await chromium.launch({ headless: false });
	const ctx = await browser.newContext({
		userAgent:
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
		ignoreHTTPSErrors: true
	});

	const page = await ctx.newPage();

	// ── Test 1: service-alfresco ─────────────────────────────────────
	console.log('Test 1: service-alfresco (document management backend)...\n');
	const alfrescoUrls = [
		'https://wb2server.congreso.gob.pe/service-alfresco/alfresko/detalle/preview/file?idDocument=ODQ1OTA=',
		'https://wb2server.congreso.gob.pe/service-alfresco/alfresko/detalle/preview/file?idDocument=MTA4MTM4',
		'https://wb2server.congreso.gob.pe/service-alfresco/alfresko/detalle/84590',
		'https://api.congreso.gob.pe/service-alfresco/alfresko/detalle/preview/file?idDocument=ODQ1OTA=',
	];
	for (const url of alfrescoUrls) {
		try {
			const resp = await page.goto(url, { waitUntil: 'load', timeout: 10_000 });
			const status = resp?.status() || 'err';
			let size = 0;
			try { const b = await resp.body(); size = b?.length || 0; } catch {}
			const ct = resp?.headers()['content-type'] || '';
			console.log(`  ${status} ${size.toString().padStart(8)} bytes  ${ct.substring(0, 30)}  ${url.split('gob.pe')[1]}`);
			if (status === 200 && size > 500) {
				const body = await resp.body();
				const ext = ct.includes('pdf') ? 'pdf' : ct.includes('json') ? 'json' : 'html';
				writeFileSync(join(OUT_DIR, `alfresco-response.${ext}`), body);
				console.log(`    → Saved!`);
			}
		} catch (err) {
			console.log(`  ERROR: ${err.message.split('\n')[0].substring(0, 80)}`);
		}
	}

	// ── Test 2: Lotus Notes Seguimiento de Proyectos ─────────────────
	console.log('\n\nTest 2: Lotus Notes — Seguimiento de Proyectos...\n');
	const lotusUrls = [
		// Seguimiento — different DB than Expvirt
		'https://www2.congreso.gob.pe/Sicr/TraDocEstProc/CLProLey2021.nsf/PAporNumeroInwordc?OpenView&Start=1&Count=30&RestrictToCategory=02775',
		'https://www2.congreso.gob.pe/Sicr/TraDocEstProc/CLProLey2021.nsf/ProyectosAprobadosPorGrupo?OpenView&RestrictToCategory=02775',
		// Try with different period format
		'https://www2.congreso.gob.pe/Sicr/TraDocEstProc/CLProLey2021.nsf/PAporNumeroInwordc/02775?OpenDocument',
		// Direct document retrieval from Lotus Notes (if the doc attachment is stored there)
		'https://www2.congreso.gob.pe/Sicr/TraDocEstProc/Expvirt_2021.nsf/RepExpVirt?OpenForm&Db=202102775&View=',
	];
	for (const url of lotusUrls) {
		try {
			const resp = await page.goto(url, { waitUntil: 'load', timeout: 15_000 });
			const status = resp?.status() || 'err';
			const html = await page.content();
			console.log(`  ${status} ${html.length.toString().padStart(8)} chars  ${url.split('nsf/')[1] || url.substring(url.length - 60)}`);

			if (status === 200 && html.length > 500) {
				const shortName = url.split('nsf/')[1]?.split('?')[0] || 'lotus-page';
				writeFileSync(join(OUT_DIR, `lotus-${shortName.replace(/\//g, '-')}.html`), html, 'utf-8');

				// Extract links that might point to the proyecto PDF
				const links = await page.$$eval('a[href]', (els) =>
					els.map((el) => ({ href: el.href, text: el.textContent?.trim()?.substring(0, 100) }))
						.filter((l) => l.href && !l.href.includes('javascript'))
				);
				const pdfLinks = links.filter(
					(l) => l.href.includes('pdf') || l.href.includes('archivo') || l.href.includes('Documento') ||
						l.text?.toLowerCase().includes('proyecto') || l.text?.toLowerCase().includes('texto')
				);
				if (pdfLinks.length > 0) {
					console.log(`    PDF/doc links found:`);
					for (const l of pdfLinks.slice(0, 10)) {
						console.log(`      ${l.text} → ${l.href.substring(0, 100)}`);
					}
				}
			}
		} catch (err) {
			console.log(`  ERROR: ${err.message.split('\n')[0].substring(0, 80)}`);
		}
	}

	// ── Test 3: Check the Expediente Virtual "Expediente del Proyecto" menu ──
	console.log('\n\nTest 3: Expediente Virtual — navigate to different menu items...\n');
	try {
		// Load Expediente Virtual
		await page.goto(
			'https://www2.congreso.gob.pe/Sicr/TraDocEstProc/Expvirt_2021.nsf/RepExpVirt?OpenForm&Db=202102775&View=',
			{ waitUntil: 'load', timeout: 15_000 }
		);
		console.log('  Loaded Expediente Virtual');

		// Extract all menu items
		const menuItems = await page.$$eval('.menu li', (els) =>
			els.map((el) => ({
				text: el.textContent?.trim(),
				hasLink: el.querySelector('a') !== null,
				onclick: el.querySelector('a')?.getAttribute('onclick') || '',
				className: el.className
			}))
		);
		console.log('  Menu items:');
		for (const item of menuItems) {
			const status = item.hasLink ? '✓' : (item.className.includes('btnodata') ? '✗' : '?');
			console.log(`    ${status} ${item.text} ${item.onclick ? `[${item.onclick.substring(0, 50)}]` : ''}`);
		}

		// Try menu items we haven't tried yet
		const menuNums = ['06', '01', '04', '14', '11'];
		for (const num of menuNums) {
			try {
				await Promise.all([
					page.waitForNavigation({ waitUntil: 'load', timeout: 10_000 }).catch(() => {}),
					page.evaluate((n) => {
						document.forms[0].num.value = n;
						document._domino_target = '_self';
						document.forms[0].__Click.value = '$Refresh';
						document.forms[0].submit();
					}, num)
				]);
				await page.waitForTimeout(2000);

				const iframeSrc = await page.$eval('#windowO2', (el) => el?.src || '').catch(() => 'no-iframe');
				const title = await page.$eval('#titulo01', (el) => el?.textContent?.trim() || '').catch(() => '');
				console.log(`\n  Menu ${num}: iframe=${iframeSrc.substring(0, 80)} title=${title}`);

				// Check for any non-spley-portal links
				if (iframeSrc && !iframeSrc.includes('spley-portal-service') && iframeSrc.includes('http')) {
					console.log(`    → Non-blocked URL found: ${iframeSrc}`);
					// Try to download it
					try {
						const resp = await ctx.request.get(iframeSrc);
						if (resp.ok()) {
							const body = await resp.body();
							console.log(`    → Downloaded: ${body.length} bytes`);
							writeFileSync(join(OUT_DIR, `menu-${num}-content.pdf`), body);
						}
					} catch {}
				}
			} catch (err) {
				console.log(`  Menu ${num}: ERROR — ${err.message.split('\n')[0].substring(0, 60)}`);
			}
		}
	} catch (err) {
		console.log(`  ERROR: ${err.message.split('\n')[0]}`);
	}

	// ── Test 4: Try the Congreso search ──────────────────────────────
	console.log('\n\nTest 4: Congreso web search...\n');
	try {
		await page.goto('https://www.congreso.gob.pe/pley-2021-2026/', { waitUntil: 'load', timeout: 15_000 });
		const html = await page.content();
		console.log(`  pley-2021-2026: ${html.length} chars`);

		// Look for search forms or links
		const links = await page.$$eval('a[href]', (els) =>
			els.map((el) => ({ href: el.href, text: el.textContent?.trim()?.substring(0, 80) }))
				.filter((l) => l.text && (l.text.includes('proyecto') || l.text.includes('Proyecto') || l.href.includes('pley')))
		);
		console.log(`  Project-related links: ${links.length}`);
		for (const l of links.slice(0, 5)) {
			console.log(`    ${l.text} → ${l.href.substring(0, 80)}`);
		}
	} catch (err) {
		console.log(`  ERROR: ${err.message.split('\n')[0]}`);
	}

	await page.close();
	await ctx.close();
	await browser.close();
	console.log('\nDone.');
}

main().catch(console.error);
