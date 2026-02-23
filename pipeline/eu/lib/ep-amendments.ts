/**
 * EUR-Lex EP Amendment Table Parser (Generic)
 *
 * Parses EUR-Lex HTML documents containing European Parliament amendments
 * (two-column table format: "Text proposed by the Commission" vs "Amendment")
 * and generates a viewer-compatible AKN XML with <akndiff:changeSet>.
 *
 * Reusable for any EU regulation — all TA-9 amendment documents use the same format.
 *
 * Metadata format:
 *   { "name": "...", "workUri": "...", "expressionUri": "...", "date": "...",
 *     "dateName": "...", "voteFor": 523, "voteAgainst": 46, "voteAbstain": 49,
 *     "prefaceTitle": "EP Amendments to COM(...) — ...",
 *     "base": "...", "result": "...",
 *     "authorHref?": "...", "authorShowAs?": "...", "voteDate?": "...", "voteResult?": "..." }
 *
 * Zero npm dependencies.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// ---------------------------------------------------------------------------
// HTML text extraction helpers
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

/** Escape XML special characters */
function escXml(text: string): string {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Amendment parsing
// ---------------------------------------------------------------------------

/** Extract the outer oj-table content, handling nested <table> tags */
function extractOjTable(html: string): string | null {
	const start = html.match(/<table[^>]*class="oj-table"[^>]*>/);
	if (!start) return null;
	let pos = start.index! + start[0].length;
	let depth = 1;
	while (depth > 0 && pos < html.length) {
		const nextOpen = html.indexOf('<table', pos);
		const nextClose = html.indexOf('</table>', pos);
		if (nextClose === -1) break;
		if (nextOpen !== -1 && nextOpen < nextClose) {
			depth++;
			pos = nextOpen + 6;
		} else {
			depth--;
			if (depth === 0) return html.slice(start.index! + start[0].length, nextClose);
			pos = nextClose + 8;
		}
	}
	return null;
}

interface RawAmendment {
	number: number;
	target: string;
	oldText: string;
	newText: string;
}

interface ArticleAmendment {
	articleNum: number;
	articleId: string;
	isNew: boolean;
	afterArticle?: number;
	fragments: { old: string; new: string; target: string }[];
}

function parseAmendments(html: string): RawAmendment[] {
	const amendments: RawAmendment[] = [];
	const parts = html.split(/(?=<span class="oj-bold">Amendment\s+\d+<\/span>)/);

	for (const part of parts) {
		const numMatch = part.match(/<span class="oj-bold">Amendment\s+(\d+)<\/span>/);
		if (!numMatch) continue;
		const number = parseInt(numMatch[1]);

		const targetMatches = [
			...part.matchAll(
				/<span class="oj-bold">((?:Article|Recital|Title|Citation|Annex)[^<]*)<\/span>/g
			),
		];
		const target = targetMatches.length > 0 ? stripHtml(targetMatches[targetMatches.length - 1][1]) : '';
		if (!target) continue;

		const tableHtml = extractOjTable(part);
		if (!tableHtml) continue;

		const rows = tableHtml.split(/<tr class="oj-table">/);
		if (rows.length < 3) continue;

		let oldTexts: string[] = [];
		let newTexts: string[] = [];

		for (let i = 2; i < rows.length; i++) {
			const row = rows[i];
			const cells = row.split(/<td[^>]*class="oj-table"[^>]*>/);
			if (cells.length < 3) continue;

			const leftText = stripHtml(cells[1]);
			const rightText = stripHtml(cells[2]);

			if (leftText && leftText.trim()) oldTexts.push(leftText.trim());
			if (rightText && rightText.trim()) newTexts.push(rightText.trim());
		}

		amendments.push({
			number,
			target,
			oldText: oldTexts.join(' '),
			newText: newTexts.join(' '),
		});
	}

	return amendments;
}

function groupByArticle(amendments: RawAmendment[]): Map<string, ArticleAmendment> {
	const map = new Map<string, ArticleAmendment>();

	for (const am of amendments) {
		const artMatch = am.target.match(/^Article\s+(\d+)\s*(\w*)/);
		if (!artMatch) continue;

		const artNum = parseInt(artMatch[1]);
		const artSuffix = artMatch[2] || '';
		const isNew = am.target.includes('(new)');
		const artId = `art_${artNum}${artSuffix}`;

		if (!map.has(artId)) {
			map.set(artId, {
				articleNum: artNum,
				articleId: artId,
				isNew,
				afterArticle: isNew ? artNum : undefined,
				fragments: [],
			});
		}

		map.get(artId)!.fragments.push({
			old: am.oldText,
			new: am.newText,
			target: am.target,
		});
	}

	return map;
}

// ---------------------------------------------------------------------------
// AKN XML generation
// ---------------------------------------------------------------------------

function generateAmendmentXml(articleAmendments: Map<string, ArticleAmendment>, metadata: any): string {
	const changes: string[] = [];

	const sorted = [...articleAmendments.values()].sort((a, b) => {
		if (a.articleNum !== b.articleNum) return a.articleNum - b.articleNum;
		return a.articleId.localeCompare(b.articleId);
	});

	for (const art of sorted) {
		const oldText = art.fragments.map((f) => f.old).filter(Boolean).join(' ');
		const newText = art.fragments.map((f) => f.new).filter(Boolean).join(' ');

		if (art.isNew) {
			const afterAttr = art.afterArticle ? ` after="art_${art.afterArticle}"` : '';
			changes.push(
				`      <akndiff:articleChange article="${art.articleId}" type="insert"${afterAttr}>` +
					`\n        <akndiff:new>${escXml(newText)}</akndiff:new>` +
					`\n      </akndiff:articleChange>`
			);
		} else if (oldText && newText) {
			changes.push(
				`      <akndiff:articleChange article="${art.articleId}" type="substitute">` +
					`\n        <akndiff:old>${escXml(oldText)}</akndiff:old>` +
					`\n        <akndiff:new>${escXml(newText)}</akndiff:new>` +
					`\n      </akndiff:articleChange>`
			);
		}
	}

	const m = metadata;
	return `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
  <amendment name="${m.name}">
    <meta>
      <identification source="#ep">
        <FRBRWork>
          <FRBRthis value="${m.workUri}"/>
          <FRBRuri value="${m.workUri}"/>
          <FRBRdate date="${m.date}" name="${m.dateName}"/>
          <FRBRauthor href="${m.authorHref}"/>
          <FRBRcountry value="eu"/>
        </FRBRWork>
        <FRBRExpression>
          <FRBRthis value="${m.expressionUri}"/>
          <FRBRuri value="${m.expressionUri}"/>
          <FRBRdate date="${m.date}" name="${m.dateName}"/>
          <FRBRlanguage language="en"/>
        </FRBRExpression>
        <FRBRManifestation>
          <FRBRthis value="${m.expressionUri}/akn"/>
          <FRBRuri value="${m.expressionUri}/akn"/>
          <FRBRdate date="${new Date().toISOString().slice(0, 10)}" name="generation"/>
        </FRBRManifestation>
      </identification>
      <references>
        <TLCOrganization eId="ep" href="${m.authorHref}" showAs="${m.authorShowAs}"/>
      </references>
    </meta>
    <preface>
      <longTitle><p>${escXml(m.prefaceTitle)}</p></longTitle>
    </preface>
    <akndiff:changeSet base="${m.base}" result="${m.result}">
      <akndiff:vote date="${m.voteDate}" result="${m.voteResult}" source="${m.authorHref}">
        <akndiff:for count="${m.voteFor}"/>
        <akndiff:against count="${m.voteAgainst}"/>
        <akndiff:abstain count="${m.voteAbstain}"/>
      </akndiff:vote>
${changes.join('\n')}
    </akndiff:changeSet>
  </amendment>
</akomaNtoso>`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function convertEpAmendments(htmlPath: string, outputPath: string, metadata: any): void {
	// Apply defaults
	metadata.authorHref = metadata.authorHref || 'https://www.europarl.europa.eu';
	metadata.authorShowAs = metadata.authorShowAs || 'European Parliament';
	metadata.voteDate = metadata.voteDate || metadata.date;
	metadata.voteResult = metadata.voteResult || 'approved';
	if (!metadata.base) throw new Error('metadata.base is required (full ELI URI of the base document)');
	if (!metadata.result) throw new Error('metadata.result is required (full expression URI of the result)');

	const html = readFileSync(htmlPath, 'utf-8');

	const rawAmendments = parseAmendments(html);

	const grouped = groupByArticle(rawAmendments);

	const xml = generateAmendmentXml(grouped, metadata);

	mkdirSync(dirname(outputPath), { recursive: true });
	writeFileSync(outputPath, xml, 'utf-8');
}
