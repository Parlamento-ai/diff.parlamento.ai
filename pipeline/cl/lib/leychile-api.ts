/**
 * LeyChile JSON API client (requires Playwright for Cloudflare bypass)
 * Source: nuevo.leychile.cl/servicios/Navegar/get_norma_json?idNorma=X&idVersion=YYYY-MM-DD
 */
import type { Page } from 'playwright';
import type { LeychileNorma, ParsedArticle } from '../types.js';

const LEYCHILE_BASE = 'https://nuevo.leychile.cl/servicios/Navegar';

/** Fetch a norma version from LeyChile JSON API using Playwright */
export async function fetchLeychileVersion(
	page: Page,
	idNorma: number,
	version?: string
): Promise<LeychileNorma> {
	let url = `${LEYCHILE_BASE}/get_norma_json?idNorma=${idNorma}`;
	if (version) url += `&idVersion=${version}`;

	console.log(`  Fetching LeyChile: idNorma=${idNorma}${version ? ` version=${version}` : ''}`);

	await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
	await page.waitForTimeout(3000);

	const text = await page.innerText('body');
	const json = JSON.parse(text);

	return json as LeychileNorma;
}

/** Parse articles from LeyChile JSON response */
export function parseLeychileArticles(json: LeychileNorma): ParsedArticle[] {
	const articles: ParsedArticle[] = [];

	for (const section of json.html || []) {
		const items = section.h || [];
		for (const item of items) {
			const rawHtml = item.t || '';
			const cleanText = cleanLeychileHtml(rawHtml);

			if (!cleanText.trim()) continue;

			// Extract article number from text (e.g., "Artículo 6°.-" or "Artículo 1°.-")
			const artMatch = cleanText.match(/Art[ií]culo\s+(\d+|[A-Za-záéíóúñ]+)[°º]?\s*\.?-?/i);
			const num = artMatch ? artMatch[1] : String(articles.length + 1);
			const eId = `art_${num.toLowerCase().replace(/\s+/g, '_')}`;

			articles.push({
				eId,
				num,
				heading: `Artículo ${num}`,
				content: cleanText
			});
		}
	}

	return articles;
}

/** Clean LeyChile HTML: strip tags, entities, inline annotations */
function cleanLeychileHtml(html: string): string {
	return (
		html
			// Remove HTML tags
			.replace(/<[^>]+>/g, '\n')
			// Decode numeric HTML entities (&#xF3; → ó, &#xED; → í, etc.)
			.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
			.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
			// Decode named entities
			.replace(/&nbsp;/g, ' ')
			.replace(/&amp;/g, '&')
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&quot;/g, '"')
			// Remove inline annotations like "LEY XXXX\nArt...\nD.O..."
			.replace(/\n\s*LEY\s+\d+.*$/gm, '')
			.replace(/\n\s*D\.O\.\s+\d+.*$/gm, '')
			// Collapse whitespace
			.replace(/\n{3,}/g, '\n\n')
			.trim()
	);
}
