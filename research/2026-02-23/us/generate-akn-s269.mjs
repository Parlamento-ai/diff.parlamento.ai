/**
 * generate-akn-s269.mjs — Generates AKN Diff XMLs for S.269 Ending Improper Payments
 *
 * Reads raw Bill DTD XML files from s269-poc/
 * Produces 3 AKN Diff XMLs in s269-poc/akn/
 * S.269 passed both chambers by voice vote (no roll call).
 *
 * Usage: node research/2026-02-23/us/generate-akn-s269.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = join(__dirname, 's269-poc');
const OUT = join(BASE, 'akn');

mkdirSync(OUT, { recursive: true });

// ─── Parse Bill DTD XML ───

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '@_',
	textNodeName: '#text',
	trimValues: true,
	preserveOrder: false
});

function readXml(filename) {
	const raw = readFileSync(join(BASE, filename), 'utf-8');
	return { parsed: parser.parse(raw), raw };
}

// ─── Text Extraction (same approach as generate-akn.mjs) ───

function extractNodeText(node) {
	if (!node) return '';
	const parts = [];

	function walk(n) {
		if (typeof n === 'string') { parts.push(n.trim()); return; }
		if (typeof n === 'number') { parts.push(String(n)); return; }
		if (Array.isArray(n)) { n.forEach(walk); return; }
		if (typeof n === 'object' && n !== null) {
			for (const [key, val] of Object.entries(n)) {
				if (key.startsWith('@_')) continue;
				if (key === '#text') {
					if (val != null && String(val).trim()) parts.push(String(val).trim());
					continue;
				}
				walk(val);
			}
		}
	}

	walk(node);
	return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function extractTextElement(textNode) {
	if (!textNode) return '';
	if (typeof textNode === 'string') return textNode.trim();
	return extractNodeText(textNode);
}

function extractTextFromRawXml(rawXml, sectionId) {
	if (!rawXml || !sectionId) return null;
	const sectionRegex = new RegExp(`<section[^>]*id="${sectionId}"[^>]*>([\\s\\S]*?)(?=<section[^>]*id=|<\\/legis-body|$)`);
	const match = rawXml.match(sectionRegex);
	if (!match) return null;
	const sectionXml = match[1];
	const textParts = [];
	const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/g;
	let m;
	while ((m = textRegex.exec(sectionXml)) !== null) {
		const cleaned = m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
		if (cleaned) textParts.push(cleaned);
	}
	return textParts.length ? textParts.join(' ') : null;
}

function extractStructuralText(node) {
	if (!node) return '';
	const parts = [];
	if (node.enum) {
		const e = typeof node.enum === 'object' ? node.enum['#text'] : node.enum;
		if (e) parts.push(String(e).trim());
	}
	if (node.header) {
		const h = typeof node.header === 'object' ? node.header['#text'] : node.header;
		if (h) parts.push(String(h).trim());
	}
	if (node.text) parts.push(extractTextElement(node.text));
	for (const key of ['paragraph', 'subparagraph', 'clause', 'quoted-block', 'subsection']) {
		if (node[key]) {
			const children = Array.isArray(node[key]) ? node[key] : [node[key]];
			for (const child of children) parts.push(extractStructuralText(child));
		}
	}
	if (node['after-quoted-block']) {
		const aqb = node['after-quoted-block'];
		const t = typeof aqb === 'object' ? (aqb['#text'] || '') : String(aqb);
		if (t.trim()) parts.push(t.trim());
	}
	return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function extractSectionParagraphs(section, rawXml) {
	if (!section) return [];

	if (section.subsection) {
		const subs = Array.isArray(section.subsection) ? section.subsection : [section.subsection];
		const result = [];
		if (section.text) result.push(extractTextElement(section.text));
		for (const sub of subs) result.push(extractStructuralText(sub));
		return result.filter(Boolean);
	}

	if (section.paragraph) {
		const paras = Array.isArray(section.paragraph) ? section.paragraph : [section.paragraph];
		const result = [];
		if (section.text) result.push(extractTextElement(section.text));
		for (const para of paras) result.push(extractStructuralText(para));
		return result.filter(Boolean);
	}

	if (section.text && rawXml && section['@_id']) {
		const rawText = extractTextFromRawXml(rawXml, section['@_id']);
		if (rawText) return [rawText];
	}
	if (section.text) return [extractTextElement(section.text)].filter(Boolean);
	return [];
}

function extractSections(billXml, rawXml) {
	const bill = billXml.bill;
	const body = bill['legis-body'];
	let sections = body.section;
	if (!Array.isArray(sections)) sections = [sections];

	return sections.map((sec, i) => {
		const header = typeof sec.header === 'object' ? sec.header['#text'] : sec.header;
		const paragraphs = extractSectionParagraphs(sec, rawXml);
		const content = paragraphs.join(' ');
		return {
			eId: `art_${i + 1}`,
			heading: `Section ${i + 1}. ${header || ''}`.trim(),
			paragraphs,
			content
		};
	});
}

// ─── XML Generation ───

function escXml(str) {
	return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function frbr(thisVal, uri, date, dateName, author, country, lang = 'eng') {
	return `		<identification source="#parlamento-ai">
			<FRBRWork>
				<FRBRthis value="${thisVal}"/>
				<FRBRuri value="${uri}"/>
				<FRBRdate date="${date}" name="${dateName}"/>
				<FRBRauthor href="${author}"/>
				<FRBRcountry value="${country}"/>
			</FRBRWork>
			<FRBRExpression>
				<FRBRthis value="${thisVal}/${lang}@${date}"/>
				<FRBRuri value="${uri}/${lang}@${date}"/>
				<FRBRdate date="${date}" name="version"/>
				<FRBRlanguage language="${lang}"/>
			</FRBRExpression>
			<FRBRManifestation>
				<FRBRthis value="${thisVal}/${lang}@${date}/akn"/>
				<FRBRuri value="${uri}/${lang}@${date}/akn"/>
				<FRBRdate date="2026-02-23" name="generation"/>
			</FRBRManifestation>
		</identification>`;
}

function articlesXml(sections) {
	return sections.map(s => {
		const paras = (s.paragraphs || [s.content]).map(p => `\t\t\t\t<p>${escXml(p)}</p>`).join('\n');
		return `\t\t<article eId="${s.eId}">
\t\t\t<heading>${escXml(s.heading)}</heading>
\t\t\t<content>
${paras}
\t\t\t</content>
\t\t</article>`;
	}).join('\n');
}

// ─── Main ───

console.log('Parsing S.269 bill versions...');
const is = readXml('01-is-introduced.xml');
const es = readXml('02-es-engrossed.xml');
const enr = readXml('03-enr-enrolled.xml');

const isSections = extractSections(is.parsed, is.raw);
const esSections = extractSections(es.parsed, es.raw);
const enrSections = extractSections(enr.parsed, enr.raw);

console.log(`IS:  ${isSections.length} sections`);
console.log(`ES:  ${esSections.length} sections`);
console.log(`ENR: ${enrSections.length} sections`);

// Detect changes between IS and ES
const changes = [];
for (let i = 0; i < Math.min(isSections.length, esSections.length); i++) {
	if (isSections[i].content !== esSections[i].content) {
		changes.push({
			article: isSections[i].eId,
			type: 'substitute',
			oldText: isSections[i].content,
			newText: esSections[i].content
		});
		console.log(`  Change detected in ${isSections[i].eId}: ${isSections[i].heading}`);
		console.log(`    Old: ${isSections[i].content.length} chars`);
		console.log(`    New: ${esSections[i].content.length} chars`);
	}
}
if (changes.length === 0) console.log('  No text changes detected between IS and ES');

// Also check ES vs ENR
let esEnrChanges = false;
for (let i = 0; i < Math.min(esSections.length, enrSections.length); i++) {
	if (esSections[i].content !== enrSections[i].content) {
		esEnrChanges = true;
		console.log(`  ES→ENR change in ${esSections[i].eId}`);
	}
}
if (!esEnrChanges) console.log('  ES and ENR are identical (expected)');

// ─── 01-bill.xml (IS — Introduced in Senate) ───

const bill = `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
	<bill name="s269-119-is">
		<meta>
${frbr('/us/bill/119/s/269/is', '/us/bill/119/s/269', '2025-01-28', 'introduced', '/us/senator/kennedy-john', 'us')}
			<references>
				<TLCPerson eId="kennedy" href="/us/senator/kennedy-john" showAs="Sen. John Kennedy (R-LA)"/>
			</references>
		</meta>

		<preface>
			<longTitle><p>S. 269 — <docTitle>Ending Improper Payments to Deceased People Act</docTitle></p></longTitle>
			<p>A bill to improve coordination between Federal and State agencies and the Do Not Pay working system.</p>
		</preface>

		<body>
${articlesXml(isSections)}
		</body>
	</bill>
</akomaNtoso>
`;

// ─── 02-amendment-1.xml (Senate Passage — voice vote, with text changes) ───

const amendment1 = `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
	<amendment name="s269-119-senate-passage">
		<meta>
${frbr('/us/bill/119/s/269/es', '/us/bill/119/s/269', '2025-09-19', 'passage', '/us/senate', 'us')}
			<references>
				<TLCOrganization eId="senate" href="/us/senate" showAs="United States Senate"/>
			</references>
		</meta>

		<preface>
			<longTitle><p><docTitle>Senate Passage — S. 269 Ending Improper Payments to Deceased People Act</docTitle></p></longTitle>
			<p>Passed Senate by voice vote on September 19, 2025. Passed House by voice vote on January 12, 2026.</p>
		</preface>

		<amendmentBody>
			<amendmentContent>
				<p>S. 269 was amended to directly modify Section 205(r) of the Social Security Act instead of amending the Consolidated Appropriations Act. Added paragraph (12) requiring clear and convincing evidence before recording a death, and added subparagraph (C) for error notification.</p>
			</amendmentContent>
		</amendmentBody>

		<akndiff:changeSet
			base="/us/bill/119/s/269/eng@2025-01-28"
			result="/us/bill/119/s/269/eng@2025-09-19">
${changes.map(c => `\t\t\t<akndiff:articleChange article="${c.article}" type="${c.type}">
\t\t\t\t<akndiff:old>${escXml(c.oldText)}</akndiff:old>
\t\t\t\t<akndiff:new>${escXml(c.newText)}</akndiff:new>
\t\t\t</akndiff:articleChange>`).join('\n')}
		</akndiff:changeSet>
	</amendment>
</akomaNtoso>
`;

// ─── 03-act-final.xml (Public Law 119-77) ───

const actFinal = `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
	<act name="public-law-119-77">
		<meta>
${frbr('/us/pl/119/77', '/us/pl/119/77', '2026-02-10', 'enacted', '/us/congress', 'us')}
		</meta>

		<preface>
			<longTitle><p>Public Law 119-77 — <docTitle>Ending Improper Payments to Deceased People Act</docTitle></p></longTitle>
			<p>An Act to improve coordination between Federal and State agencies and the Do Not Pay working system. Signed by the President on February 10, 2026.</p>
		</preface>

		<body>
${articlesXml(enrSections)}
		</body>
	</act>
</akomaNtoso>
`;

// ─── Write files ───

console.log('\nWriting AKN XMLs...');
writeFileSync(join(OUT, '01-bill.xml'), bill);
console.log('  01-bill.xml');
writeFileSync(join(OUT, '02-amendment-1.xml'), amendment1);
console.log('  02-amendment-1.xml');
writeFileSync(join(OUT, '03-act-final.xml'), actFinal);
console.log('  03-act-final.xml');

console.log('\nDone! Generated 3 AKN Diff XMLs in s269-poc/akn/');
