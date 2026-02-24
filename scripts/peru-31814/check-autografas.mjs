/**
 * Quick check: does the "Proyectos aprobados (Autógrafas)" page have
 * PDFs hosted on a non-blocked domain?
 */
import { chromium } from 'playwright';

async function main() {
	const browser = await chromium.launch({ headless: false });
	const ctx = await browser.newContext({
		userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
		ignoreHTTPSErrors: true
	});
	const page = await ctx.newPage();

	console.log('Loading autógrafas page...');
	await page.goto('https://www.congreso.gob.pe/proyectosAprobados-autografas/', {
		waitUntil: 'load',
		timeout: 20_000
	});
	await page.waitForTimeout(5000);

	const text = await page.evaluate(() => document.body?.innerText || '');
	console.log(`Text (${text.length} chars): ${text.substring(0, 400).replace(/\n/g, ' | ')}`);

	// Check iframes
	const iframes = await page.$$eval('iframe', (els) => els.map((el) => ({ src: el.src, id: el.id })));
	console.log(`\nIframes: ${iframes.length}`);
	for (const f of iframes) console.log(`  ${f.src}`);

	// If there's an iframe, try to access its content
	for (const iframe of iframes) {
		if (iframe.src) {
			console.log(`\nNavigating to iframe: ${iframe.src}`);
			const iframePage = await ctx.newPage();
			try {
				await iframePage.goto(iframe.src, { waitUntil: 'load', timeout: 15_000 });
				await iframePage.waitForTimeout(3000);
				const iText = await iframePage.evaluate(() => document.body?.innerText || '');
				console.log(`  Text (${iText.length} chars): ${iText.substring(0, 400).replace(/\n/g, ' | ')}`);

				// Look for links
				const links = await iframePage.$$eval('a[href]', (els) =>
					els.map((el) => ({ href: el.href, text: el.textContent?.trim()?.substring(0, 80) }))
						.filter((l) => l.text && l.text.length > 2)
				);
				console.log(`  Links: ${links.length}`);
				for (const l of links.slice(0, 20)) {
					console.log(`    ${l.text} → ${l.href.substring(0, 100)}`);
				}
			} catch (err) {
				console.log(`  ERROR: ${err.message.split('\n')[0]}`);
			}
			await iframePage.close();
		}
	}

	// Also check: try Lotus Notes autógrafa tracking
	console.log('\n\nChecking Lotus Notes autógrafa tracking...');
	try {
		await page.goto(
			'https://www2.congreso.gob.pe/Sicr/TraDocEstProc/Expvirt_2021.nsf/visbusqptraam/02775?OpenDocument',
			{ waitUntil: 'load', timeout: 15_000 }
		);
		const status = page.url();
		const html = await page.content();
		console.log(`  URL: ${status}`);
		console.log(`  HTML: ${html.length} chars`);
		if (html.length > 500) {
			const bodyText = await page.evaluate(() => document.body?.innerText || '');
			console.log(`  Text: ${bodyText.substring(0, 400).replace(/\n/g, ' | ')}`);
		}
	} catch (err) {
		console.log(`  ERROR: ${err.message.split('\n')[0]}`);
	}

	await page.close();
	await ctx.close();
	await browser.close();
}

main().catch(console.error);
