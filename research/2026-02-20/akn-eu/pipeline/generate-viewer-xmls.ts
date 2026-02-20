/**
 * Generic EU Regulation Viewer XML Generator
 *
 * Reads AKN source files and transforms them into the viewer-compatible
 * format used by diff.parlamento.ai. Auto-detects chapter/section structure.
 *
 * Usage:
 *   node --experimental-strip-types generate-viewer-xmls.ts <config.json>
 *
 * Config JSON format:
 *   {
 *     "slug": "ai-act-regulation",
 *     "sourcesDir": "../ai-act/sources",
 *     "outputDir": "../ai-act/akn",
 *     "billFile": "52021PC0206-bill-akn.xml",
 *     "finalFile": "32024R1689-akn.xml",
 *     "changesetFile": "changeset-ai-act.xml",
 *     "epAmendmentsFile": "ep-amendments-ai-act.xml",
 *     "proposal": { "celex": "52021PC0206", "comYear": 2021, "comNum": 206, "date": "2021-04-21", "title": "..." },
 *     "final": { "celex": "32024R1689", "regYear": 2024, "regNum": 1689, "date": "2024-07-12", "pubDate": "2024-07-12", "title": "..." },
 *     "legislativeProcedure": { "procedure": "2021/0106(COD)", "voteDate": "2024-03-13", "voteFor": 523, "voteAgainst": 46, "voteAbstain": 49 }
 *   }
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(join(process.cwd(), 'package.json'));
const { XMLParser } = require('fast-xml-parser');

// --- CLI ---
const args = process.argv.slice(2);
if (args.length < 1) {
	console.error('Usage: node generate-viewer-xmls.ts <config.json>');
	process.exit(1);
}

const configPath = resolve(args[0]);
const config = JSON.parse(readFileSync(configPath, 'utf-8'));
const SCRIPT_DIR = dirname(configPath);
const SOURCES_DIR = resolve(SCRIPT_DIR, config.sourcesDir || 'sources');
const OUTPUT_DIR = resolve(SCRIPT_DIR, config.outputDir || 'akn');

mkdirSync(OUTPUT_DIR, { recursive: true });

// --- XML Parser ---
const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '@_',
	removeNSPrefix: false,
	preserveOrder: false,
	trimValues: false,
	isArray: (name: string) => ['chapter', 'section', 'article', 'paragraph', 'citation', 'recital', 'p', 'point'].includes(name),
});

// --- Helpers ---

function extractText(node: unknown): string {
	if (typeof node === 'string') return node.trim();
	if (typeof node === 'number') return String(node);
	if (!node || typeof node !== 'object') return '';

	if (Array.isArray(node)) {
		return node.map(extractText).filter(Boolean).join(' ');
	}

	const obj = node as Record<string, unknown>;

	if ('#text' in obj) {
		const parts: string[] = [String(obj['#text'])];
		for (const [key, val] of Object.entries(obj)) {
			if (key !== '#text' && !key.startsWith('@_')) {
				parts.push(extractText(val));
			}
		}
		return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
	}

	const texts: string[] = [];
	for (const [key, val] of Object.entries(obj)) {
		if (!key.startsWith('@_')) {
			texts.push(extractText(val));
		}
	}
	return texts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function escapeXml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

interface ArticleData {
	eId: string;
	heading: string;
	content: string;
}

interface SectionData {
	eId: string;
	heading: string;
	articles: ArticleData[];
}

function extractArticle(art: Record<string, unknown>): ArticleData {
	const eId = (art['@_eId'] as string) || '';

	let heading = '';
	if (art.num) heading = extractText(art.num);
	if (art.heading) {
		const h = extractText(art.heading);
		heading = heading ? `${heading} ${h}` : h;
	}

	let content = '';
	if (art.paragraph) {
		const paragraphs = Array.isArray(art.paragraph) ? art.paragraph : [art.paragraph];
		content = paragraphs.map((p: Record<string, unknown>) => {
			const parts: string[] = [];
			const num = p.num ? extractText(p.num) : '';

			// Extract intro text (before points)
			if (p.intro) parts.push(extractText(p.intro));
			// Extract content (simple paragraph text)
			if (p.content) parts.push(extractText(p.content));

			// Extract points within the paragraph
			if (p.point) {
				const points = Array.isArray(p.point) ? p.point : [p.point];
				for (const pt of points) {
					parts.push(extractText(pt as Record<string, unknown>));
				}
			}

			// Fallback: extract all text from paragraph if no structured content found
			if (parts.length === 0) parts.push(extractText(p));

			const text = parts.join(' ');
			return num ? `${num} ${text}` : text;
		}).join(' ');
	} else if (art.content) {
		content = extractText(art.content);
	}

	// Fallback: <intro> + <point> (e.g. definitions article in bill AKN)
	if (!content || content.trim() === '') {
		const parts: string[] = [];
		if (art.intro) parts.push(extractText(art.intro));
		if (art.point) {
			const points = Array.isArray(art.point) ? art.point : [art.point];
			for (const pt of points) {
				parts.push(extractText(pt as Record<string, unknown>));
			}
		}
		if (parts.length > 0) content = parts.join(' ');
	}

	return { eId, heading: heading.replace(/\s+/g, ' ').trim(), content: content.replace(/\s+/g, ' ').trim() };
}

function artNum(eId: string): number {
	const m = eId.match(/art_(\d+)/);
	return m ? parseInt(m[1], 10) : 0;
}

/** Auto-detect chapter/section structure from AKN body */
function autoDetectSections(body: Record<string, unknown>): SectionData[] {
	const sections: SectionData[] = [];

	if (body.chapter) {
		const chapters = Array.isArray(body.chapter) ? body.chapter : [body.chapter];
		for (const chap of chapters) {
			const c = chap as Record<string, unknown>;
			const eId = (c['@_eId'] as string) || '';
			let heading = '';
			if (c.num) heading = extractText(c.num);
			if (c.heading) {
				const h = extractText(c.heading);
				heading = heading ? `${heading} – ${h}` : h;
			}

			// Collect articles directly under chapter
			const articles: ArticleData[] = [];
			if (c.article) {
				const arts = Array.isArray(c.article) ? c.article : [c.article];
				for (const art of arts) {
					articles.push(extractArticle(art as Record<string, unknown>));
				}
			}

			// Collect articles from sections within chapter
			if (c.section) {
				const secs = Array.isArray(c.section) ? c.section : [c.section];
				for (const sec of secs) {
					const s = sec as Record<string, unknown>;
					if (s.article) {
						const arts = Array.isArray(s.article) ? s.article : [s.article];
						for (const art of arts) {
							articles.push(extractArticle(art as Record<string, unknown>));
						}
					}
				}
			}

			if (articles.length > 0) {
				articles.sort((a, b) => artNum(a.eId) - artNum(b.eId));
				sections.push({ eId, heading, articles });
			}
		}
	} else {
		// No chapters — flat article list
		const articles: ArticleData[] = [];
		if (body.article) {
			const arts = Array.isArray(body.article) ? body.article : [body.article];
			for (const art of arts) {
				articles.push(extractArticle(art as Record<string, unknown>));
			}
		}
		if (articles.length > 0) {
			articles.sort((a, b) => artNum(a.eId) - artNum(b.eId));
			sections.push({ eId: 'body', heading: '', articles });
		}
	}

	return sections;
}

function serializeArticle(art: ArticleData): string {
	return `      <article eId="${escapeXml(art.eId)}">
        <heading>${escapeXml(art.heading)}</heading>
        <content>
        <p>${escapeXml(art.content)}</p>
        </content>
      </article>`;
}

function serializeSections(sections: SectionData[]): string {
	return sections.map(sec => {
		const arts = sec.articles.map(serializeArticle).join('\n');
		return `    <section eId="${escapeXml(sec.eId)}">
      <heading>${escapeXml(sec.heading)}</heading>
${arts}
    </section>`;
	}).join('\n');
}

function parseFile(filename: string): Record<string, unknown> {
	const xml = readFileSync(join(SOURCES_DIR, filename), 'utf-8');
	return parser.parse(xml);
}

// --- Generate 01-act-original.xml ---

function generateActOriginal() {
	console.log('Generating 01-act-original.xml (COM proposal)...');

	const parsed = parseFile(config.billFile);
	const root = parsed.akomaNtoso as Record<string, unknown>;
	const bill = root.bill as Record<string, unknown>;
	const body = bill.body as Record<string, unknown>;

	const sections = autoDetectSections(body);
	const totalArticles = sections.reduce((sum, s) => sum + s.articles.length, 0);
	console.log(`  Extracted ${totalArticles} articles in ${sections.length} sections`);

	const p = config.proposal;
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
  <act name="${escapeXml(config.slug)}-com-proposal">
    <meta>
      <identification source="#parlamento-ai">
        <FRBRWork>
          <FRBRthis value="http://data.europa.eu/eli/comProposal/${p.comYear}/${p.comNum}"/>
          <FRBRuri value="http://data.europa.eu/eli/comProposal/${p.comYear}/${p.comNum}"/>
          <FRBRdate date="${p.date}" name="proposal"/>
          <FRBRauthor href="http://publications.europa.eu/resource/authority/corporate-body/COM"/>
          <FRBRcountry value="eu"/>
        </FRBRWork>
        <FRBRExpression>
          <FRBRthis value="http://data.europa.eu/eli/comProposal/${p.comYear}/${p.comNum}/en"/>
          <FRBRuri value="http://data.europa.eu/eli/comProposal/${p.comYear}/${p.comNum}/en"/>
          <FRBRdate date="${p.date}" name="version"/>
          <FRBRlanguage language="en"/>
        </FRBRExpression>
        <FRBRManifestation>
          <FRBRthis value="http://data.europa.eu/eli/comProposal/${p.comYear}/${p.comNum}/en/akn"/>
          <FRBRuri value="http://data.europa.eu/eli/comProposal/${p.comYear}/${p.comNum}/en/akn"/>
          <FRBRdate date="2026-02-19" name="generation"/>
        </FRBRManifestation>
      </identification>
      <references>
        <TLCOrganization eId="com" href="http://publications.europa.eu/resource/authority/corporate-body/COM" showAs="European Commission"/>
      </references>
    </meta>
    <preface>
      <longTitle>
        <p><docTitle>${escapeXml(p.title)}</docTitle></p>
      </longTitle>
    </preface>
    <body>
${serializeSections(sections)}
    </body>
  </act>
</akomaNtoso>`;

	const outPath = join(OUTPUT_DIR, '01-act-original.xml');
	writeFileSync(outPath, xml, 'utf-8');
	console.log(`  Written: ${outPath} (${(xml.length / 1024).toFixed(0)} KB)`);
}

// --- Parse changeset and generate 03-amendment-2.xml ---

interface ChangeEntry {
	articleEId: string;
	type: 'substitute' | 'insert';
	oldText?: string;
	newText?: string;
}

function parseChangeset(): ChangeEntry[] {
	console.log('Parsing changeset...');

	const parsed = parseFile(config.changesetFile);
	const root = parsed.akomaNtoso as Record<string, unknown>;
	const doc = root.doc as Record<string, unknown>;
	const mainBody = doc.mainBody as Record<string, unknown>;
	const sections = mainBody.section as Record<string, unknown>[];

	const changes: ChangeEntry[] = [];

	for (const sec of sections) {
		const eId = (sec['@_eId'] as string) || '';
		if (eId === 'summary') continue;

		const heading = extractText(sec.heading);
		const isInsertion = heading.includes('insertion');

		const artMatch = eId.match(/(?:change|insert)_(.+)/);
		if (!artMatch) continue;
		const articleEId = artMatch[1];

		const content = sec.content as Record<string, unknown>;
		if (!content) continue;

		let oldText: string | undefined;
		let newText: string | undefined;

		const blocks = content.block;
		if (blocks) {
			const blockArr = Array.isArray(blocks) ? blocks : [blocks];
			for (const block of blockArr) {
				const b = block as Record<string, unknown>;
				const name = (b['@_name'] as string) || '';
				const text = extractText(b).trim();
				if (name === 'old') oldText = text;
				if (name === 'new') newText = text;
			}
		}

		changes.push({
			articleEId,
			type: isInsertion ? 'insert' : 'substitute',
			oldText: isInsertion ? undefined : oldText,
			newText: isInsertion ? (newText || oldText) : newText,
		});
	}

	console.log(`  Parsed ${changes.length} changes (${changes.filter(c => c.type === 'substitute').length} substitutions, ${changes.filter(c => c.type === 'insert').length} insertions)`);
	return changes;
}

function generateAmendment(changes: ChangeEntry[]) {
	console.log('Generating 03-amendment-2.xml (legislative procedure changes)...');

	const substitutions = changes.filter(c => c.type === 'substitute').sort((a, b) => artNum(a.articleEId) - artNum(b.articleEId));
	const insertions = changes.filter(c => c.type === 'insert').sort((a, b) => artNum(a.articleEId) - artNum(b.articleEId));

	let changeSetXml = '';

	for (const change of substitutions) {
		changeSetXml += `      <akndiff:articleChange article="${escapeXml(change.articleEId)}" type="substitute">\n`;
		if (change.oldText) changeSetXml += `        <akndiff:old>${escapeXml(change.oldText)}</akndiff:old>\n`;
		if (change.newText) changeSetXml += `        <akndiff:new>${escapeXml(change.newText)}</akndiff:new>\n`;
		changeSetXml += `      </akndiff:articleChange>\n`;
	}

	// Find the highest original article number for "after" reference
	const maxOriginal = substitutions.length > 0
		? Math.max(...substitutions.map(c => artNum(c.articleEId)))
		: 0;

	for (let i = 0; i < insertions.length; i++) {
		const change = insertions[i];
		const afterEId = i === 0 ? `art_${maxOriginal}` : insertions[i - 1].articleEId;
		changeSetXml += `      <akndiff:articleChange article="${escapeXml(change.articleEId)}" type="insert" after="${escapeXml(afterEId)}">\n`;
		if (change.newText) changeSetXml += `        <akndiff:new>${escapeXml(change.newText)}</akndiff:new>\n`;
		changeSetXml += `      </akndiff:articleChange>\n`;
	}

	const lp = config.legislativeProcedure;
	const f = config.final;
	const p = config.proposal;

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
  <amendment name="${escapeXml(config.slug)}-legislative-process">
    <meta>
      <identification source="#parlamento-ai">
        <FRBRWork>
          <FRBRthis value="http://data.europa.eu/eli/reg/${f.regYear}/${f.regNum}/legislative-process"/>
          <FRBRuri value="http://data.europa.eu/eli/reg/${f.regYear}/${f.regNum}"/>
          <FRBRdate date="${lp.voteDate}" name="adoption"/>
          <FRBRauthor href="http://data.europa.eu/resource/authority/corporate-body/EP"/>
          <FRBRcountry value="eu"/>
        </FRBRWork>
        <FRBRExpression>
          <FRBRthis value="http://data.europa.eu/eli/reg/${f.regYear}/${f.regNum}/legislative-process/en"/>
          <FRBRuri value="http://data.europa.eu/eli/reg/${f.regYear}/${f.regNum}/en"/>
          <FRBRdate date="${lp.voteDate}" name="version"/>
          <FRBRlanguage language="en"/>
        </FRBRExpression>
        <FRBRManifestation>
          <FRBRthis value="http://data.europa.eu/eli/reg/${f.regYear}/${f.regNum}/legislative-process/en/akn"/>
          <FRBRuri value="http://data.europa.eu/eli/reg/${f.regYear}/${f.regNum}/en/akn"/>
          <FRBRdate date="2026-02-19" name="generation"/>
        </FRBRManifestation>
      </identification>
      <references>
        <TLCOrganization eId="ep" href="http://data.europa.eu/resource/authority/corporate-body/EP" showAs="European Parliament"/>
        <TLCOrganization eId="council" href="http://data.europa.eu/resource/authority/corporate-body/CONSILIUM" showAs="Council of the European Union"/>
      </references>
    </meta>
    <preface>
      <longTitle>
        <p><docTitle>Ordinary Legislative Procedure — ${escapeXml(lp.procedure)}</docTitle></p>
      </longTitle>
      <p>Changes adopted during the ordinary legislative procedure (${escapeXml(lp.procedure)}). ${substitutions.length} articles were modified and ${insertions.length} new articles were added.</p>
    </preface>
    <amendmentBody>
      <amendmentContent>
        <p>The European Parliament and Council modified the Commission proposal COM(${p.comYear}) ${p.comNum} during the ordinary legislative procedure, resulting in Regulation (EU) ${f.regYear}/${f.regNum}.</p>
      </amendmentContent>
    </amendmentBody>
    <akndiff:changeSet
      base="http://data.europa.eu/eli/comProposal/${p.comYear}/${p.comNum}/en"
      result="http://data.europa.eu/eli/reg/${f.regYear}/${f.regNum}/oj/en">
      <akndiff:vote date="${lp.voteDate}" result="approved" source="http://data.europa.eu/resource/authority/corporate-body/EP">
        <akndiff:for count="${lp.voteFor}"/>
        <akndiff:against count="${lp.voteAgainst}"/>
        <akndiff:abstain count="${lp.voteAbstain}"/>
      </akndiff:vote>
${changeSetXml}    </akndiff:changeSet>
  </amendment>
</akomaNtoso>`;

	const outPath = join(OUTPUT_DIR, '03-amendment-2.xml');
	writeFileSync(outPath, xml, 'utf-8');
	console.log(`  Written: ${outPath} (${(xml.length / 1024).toFixed(0)} KB)`);
}

// --- Generate 04-act-final.xml ---

function generateActFinal() {
	console.log('Generating 04-act-final.xml (Final Regulation)...');

	const parsed = parseFile(config.finalFile);
	const root = parsed.akomaNtoso as Record<string, unknown>;
	const act = root.act as Record<string, unknown>;
	const body = act.body as Record<string, unknown>;

	const sections = autoDetectSections(body);
	const totalArticles = sections.reduce((sum, s) => sum + s.articles.length, 0);
	console.log(`  Extracted ${totalArticles} articles in ${sections.length} sections`);

	const f = config.final;
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
  <act name="${escapeXml(config.slug)}-regulation-${f.regYear}-${f.regNum}">
    <meta>
      <identification source="#parlamento-ai">
        <FRBRWork>
          <FRBRthis value="http://data.europa.eu/eli/reg/${f.regYear}/${f.regNum}/oj"/>
          <FRBRuri value="http://data.europa.eu/eli/reg/${f.regYear}/${f.regNum}/oj"/>
          <FRBRdate date="${f.pubDate}" name="publication"/>
          <FRBRauthor href="http://publications.europa.eu/resource/authority/corporate-body/CONSILIUM"/>
          <FRBRcountry value="eu"/>
        </FRBRWork>
        <FRBRExpression>
          <FRBRthis value="http://data.europa.eu/eli/reg/${f.regYear}/${f.regNum}/oj/en"/>
          <FRBRuri value="http://data.europa.eu/eli/reg/${f.regYear}/${f.regNum}/oj/en"/>
          <FRBRdate date="${f.pubDate}" name="publication"/>
          <FRBRlanguage language="en"/>
        </FRBRExpression>
        <FRBRManifestation>
          <FRBRthis value="http://data.europa.eu/eli/reg/${f.regYear}/${f.regNum}/oj/en/akn"/>
          <FRBRuri value="http://data.europa.eu/eli/reg/${f.regYear}/${f.regNum}/oj/en/akn"/>
          <FRBRdate date="2026-02-19" name="generation"/>
        </FRBRManifestation>
      </identification>
      <references>
        <TLCOrganization eId="council" href="http://publications.europa.eu/resource/authority/corporate-body/CONSILIUM" showAs="Council of the European Union"/>
      </references>
    </meta>
    <preface>
      <longTitle>
        <p><docTitle>${escapeXml(f.title)}</docTitle></p>
      </longTitle>
    </preface>
    <body>
${serializeSections(sections)}
    </body>
  </act>
</akomaNtoso>`;

	const outPath = join(OUTPUT_DIR, '04-act-final.xml');
	writeFileSync(outPath, xml, 'utf-8');
	console.log(`  Written: ${outPath} (${(xml.length / 1024).toFixed(0)} KB)`);
}

// --- Copy 02-amendment-1.xml (EP amendments) ---

function copyEpAmendments() {
	if (!config.epAmendmentsFile) {
		console.log('Skipping 02-amendment-1.xml (no epAmendmentsFile in config)');
		return;
	}

	const src = join(SOURCES_DIR, config.epAmendmentsFile);
	if (!existsSync(src)) {
		console.log(`Warning: EP amendments file not found: ${src}`);
		return;
	}

	const outPath = join(OUTPUT_DIR, '02-amendment-1.xml');
	copyFileSync(src, outPath);
	console.log(`Copied 02-amendment-1.xml from ${config.epAmendmentsFile}`);
}

// --- Quality checks ---

function qualityCheck() {
	console.log('\n--- Quality Check ---');
	let issues = 0;

	for (const file of ['01-act-original.xml', '04-act-final.xml']) {
		const path = join(OUTPUT_DIR, file);
		if (!existsSync(path)) continue;
		const xml = readFileSync(path, 'utf-8');

		// Check for empty articles
		const emptyArticles = [...xml.matchAll(/<article eId="([^"]+)">\s*<heading>([^<]*)<\/heading>\s*<content>\s*<p><\/p>\s*<\/content>\s*<\/article>/g)];
		if (emptyArticles.length > 0) {
			console.log(`  WARNING: ${file} has ${emptyArticles.length} empty articles: ${emptyArticles.map(m => m[1]).join(', ')}`);
			issues++;
		}

		// Check for articles without headings
		const noHeading = [...xml.matchAll(/<article eId="([^"]+)">\s*<heading><\/heading>/g)];
		if (noHeading.length > 0) {
			console.log(`  WARNING: ${file} has ${noHeading.length} articles without headings`);
			issues++;
		}
	}

	if (issues === 0) {
		console.log('  All checks passed!');
	}
}

// --- Main ---

console.log(`=== Viewer XML Generator (${config.slug}) ===\n`);

generateActOriginal();
copyEpAmendments();
const changes = parseChangeset();
generateAmendment(changes);
generateActFinal();
qualityCheck();

console.log(`\nDone! Generated viewer XMLs in ${OUTPUT_DIR}`);
