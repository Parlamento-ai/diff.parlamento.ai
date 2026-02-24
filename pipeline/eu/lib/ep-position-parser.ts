/**
 * EP Position HTML Parser
 *
 * Parses European Parliament Position documents (full legislative text with articles),
 * as opposed to EP Amendment tables (two-column OJ format parsed by ep-amendments.ts).
 *
 * EP Position HTMLs contain the complete text as adopted by the EP, with articles
 * in <div class="eli-subdivision" id="art_N"> blocks.
 *
 * Example: Data Act TA-9-2023-0385_EN.html (748KB, ~53 articles)
 */

// ---------------------------------------------------------------------------
// HTML text extraction helpers (shared logic with ep-amendments.ts)
// ---------------------------------------------------------------------------

/** Strip HTML tags, decode entities, normalize whitespace */
function stripHtml(html: string): string {
	return html
		.replace(/<br\s*\/?>/gi, ' ')
		.replace(/<\/p>/gi, ' ')
		.replace(/<[^>]+>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#x2018;/g, '\u2018')
		.replace(/&#x2019;/g, '\u2019')
		.replace(/&#x201C;/g, '\u201C')
		.replace(/&#x201D;/g, '\u201D')
		.replace(/&#x2014;/g, '\u2014')
		.replace(/&#\d+;/g, (m) => String.fromCharCode(parseInt(m.slice(2, -1))))
		.replace(/&#x[\da-f]+;/gi, (m) => String.fromCharCode(parseInt(m.slice(3, -1), 16)))
		.replace(/\s+/g, ' ')
		.trim();
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EpPositionArticle {
	eId: string;
	num: number;
	heading: string;
	content: string;
}

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

/** Detect if an HTML is EP Position (full articles, NOT OJ amendment tables) */
export function isEpPositionHtml(html: string): boolean {
	const hasArticles = /class="oj-ti-art"/.test(html);
	const hasOjTable = /class="oj-table"/.test(html);
	// EP Position has articles but does NOT use oj-table for amendment comparison
	// (oj-table in EP Position is used for numbered point lists, not for two-column amendments)
	// The distinguishing feature: EP Position has eli-subdivision id="art_N" divs
	const hasArtSubdivisions = /class="eli-subdivision"\s+id="art_\d/.test(html);
	return hasArticles && hasArtSubdivisions && !isAmendmentTable(html);
}

/** Check if HTML contains the two-column amendment table pattern */
function isAmendmentTable(html: string): boolean {
	// OJ amendment tables have header rows with "Text proposed by the Commission" / "Amendment"
	return /Text proposed by the Commission/.test(html) && /class="oj-table"/.test(html);
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/** Parse articles from EP Position HTML */
export function parseEpPosition(html: string): { articles: EpPositionArticle[]; hasFullText: boolean } {
	const articles: EpPositionArticle[] = [];

	// Split by article subdivision markers
	const artRegex = /<div\s+class="eli-subdivision"\s+id="(art_[^"]+)">/g;
	const matches = [...html.matchAll(artRegex)];

	for (let i = 0; i < matches.length; i++) {
		const match = matches[i];
		const artId = match[1];
		const startIdx = match.index!;

		// Find the end of this article: next article or a reasonable boundary
		const endIdx = i + 1 < matches.length
			? matches[i + 1].index!
			: html.indexOf('</div><!-- end eli-container -->', startIdx) || html.length;

		const artHtml = html.slice(startIdx, endIdx);

		// Extract article number from oj-ti-art
		const numMatch = artHtml.match(/<p[^>]*class="oj-ti-art"[^>]*>Article\s+(\d+\w*)/);
		if (!numMatch) continue;

		const numStr = numMatch[1];
		const num = parseInt(numStr);
		if (isNaN(num)) continue;

		// Extract heading from oj-sti-art
		const headingMatch = artHtml.match(/<p\s+class="oj-sti-art">(.*?)<\/p>/s);
		const heading = headingMatch ? stripHtml(headingMatch[1]) : '';

		// Extract content: all oj-normal paragraphs after the heading
		const contentParts: string[] = [];
		const paraRegex = /<p\s+class="oj-normal">(.*?)<\/p>/gs;
		let paraMatch;
		while ((paraMatch = paraRegex.exec(artHtml)) !== null) {
			const text = stripHtml(paraMatch[1]);
			if (text) contentParts.push(text);
		}

		const content = contentParts.join(' ');
		if (!content && !heading) continue;

		articles.push({
			eId: artId,
			num,
			heading: `Article ${numStr}${heading ? ` ${heading}` : ''}`,
			content
		});
	}

	return {
		articles,
		hasFullText: articles.length > 0
	};
}
