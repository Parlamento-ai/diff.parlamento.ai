/**
 * generate-akn.mjs — Generates AKN Diff XMLs for S.5 Laken Riley Act
 *
 * Reads raw Bill DTD XML files + vote XMLs from s5-laken-riley/
 * Produces 4 AKN Diff XMLs in s5-laken-riley/akn/
 *
 * Usage: node research/2026-02-23/us/generate-akn.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = join(__dirname, 's5-laken-riley');
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

/**
 * Extract text from a node recursively, preserving enum values for readability.
 * Skips XML attributes (@_...) but includes everything else.
 */
function extractNodeText(node) {
	if (!node) return '';
	const parts = [];

	function walk(n) {
		if (typeof n === 'string') {
			parts.push(n.trim());
			return;
		}
		if (typeof n === 'number') {
			parts.push(String(n));
			return;
		}
		if (Array.isArray(n)) {
			n.forEach(walk);
			return;
		}
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

/**
 * Extract text from a <text> element, handling inline elements like <quote>, <short-title>.
 * Uses raw XML regex for mixed content to preserve document order.
 */
function extractTextElement(textNode, rawXml) {
	if (!textNode) return '';
	if (typeof textNode === 'string') return textNode.trim();
	// For elements with mixed content (text + inline elements), the parsed
	// JSON loses document order. Fall back to extractNodeText which is good enough
	// for non-mixed content.
	return extractNodeText(textNode);
}

/**
 * Extract text from raw XML string by stripping tags and normalizing whitespace.
 * This preserves document order for mixed content that fast-xml-parser can't handle.
 */
function extractTextFromRawXml(rawXml, sectionId) {
	if (!rawXml || !sectionId) return null;
	// Find the section by id
	const sectionRegex = new RegExp(`<section[^>]*id="${sectionId}"[^>]*>([\\s\\S]*?)(?=<section[^>]*id=|<\\/legis-body|$)`);
	const match = rawXml.match(sectionRegex);
	if (!match) return null;
	const sectionXml = match[1];

	// Extract just the <text> elements' content, strip tags, normalize whitespace
	const textParts = [];
	const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/g;
	let m;
	while ((m = textRegex.exec(sectionXml)) !== null) {
		const cleaned = m[1]
			.replace(/<[^>]+>/g, '') // strip all XML tags
			.replace(/\s+/g, ' ')
			.trim();
		if (cleaned) textParts.push(cleaned);
	}
	return textParts.length ? textParts.join(' ') : null;
}

/**
 * Extract text from a subsection or paragraph, including its enum and header.
 * E.g., "(a) In general.— Section 236(c) of the Immigration..."
 */
function extractStructuralText(node) {
	if (!node) return '';
	const parts = [];

	// Include enum: "(a)", "(1)", etc.
	if (node.enum) {
		const e = typeof node.enum === 'object' ? node.enum['#text'] : node.enum;
		if (e) parts.push(String(e).trim());
	}
	// Include header: "In general", "Detainer", etc.
	if (node.header) {
		const h = typeof node.header === 'object' ? node.header['#text'] : node.header;
		if (h) parts.push(String(h).trim());
	}
	// Include direct <text>
	if (node.text) {
		parts.push(extractTextElement(node.text));
	}
	// Include nested paragraphs, subparagraphs, quoted-blocks, clauses
	for (const key of ['paragraph', 'subparagraph', 'clause', 'quoted-block', 'subsection']) {
		if (node[key]) {
			const children = Array.isArray(node[key]) ? node[key] : [node[key]];
			for (const child of children) {
				parts.push(extractStructuralText(child));
			}
		}
	}
	// Include after-quoted-block text (e.g., "." or ";")
	if (node['after-quoted-block']) {
		const aqb = node['after-quoted-block'];
		const t = typeof aqb === 'object' ? (aqb['#text'] || '') : String(aqb);
		if (t.trim()) parts.push(t.trim());
	}

	return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Extract paragraphs from a section. Returns array of strings,
 * one per top-level structural element (subsection or paragraph).
 * Uses rawXml for simple text-only sections to preserve document order.
 */
function extractSectionParagraphs(section, rawXml) {
	if (!section) return [];

	// Section has <subsection> children → one paragraph per subsection
	if (section.subsection) {
		const subs = Array.isArray(section.subsection) ? section.subsection : [section.subsection];
		const result = [];
		if (section.text) {
			result.push(extractTextElement(section.text));
		}
		for (const sub of subs) {
			result.push(extractStructuralText(sub));
		}
		return result.filter(Boolean);
	}

	// Section has <paragraph> children at top level → one paragraph per paragraph
	if (section.paragraph) {
		const paras = Array.isArray(section.paragraph) ? section.paragraph : [section.paragraph];
		const result = [];
		if (section.text) {
			result.push(extractTextElement(section.text));
		}
		for (const para of paras) {
			result.push(extractStructuralText(para));
		}
		return result.filter(Boolean);
	}

	// Simple section with just <text> — use raw XML to preserve mixed content order
	if (section.text && rawXml && section['@_id']) {
		const rawText = extractTextFromRawXml(rawXml, section['@_id']);
		if (rawText) return [rawText];
	}
	if (section.text) {
		return [extractTextElement(section.text)].filter(Boolean);
	}

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

// ─── Parse Vote XMLs ───

function parseSenateVote(filename) {
	const { parsed: xml } = readXml(filename);
	const vote = xml['roll_call_vote'];
	const members = vote.members.member;
	const membersList = Array.isArray(members) ? members : [members];

	const forVoters = [];
	const againstVoters = [];

	for (const m of membersList) {
		const voter = {
			href: `/us/senator/${m.last_name.toLowerCase().replace(/\s+/g, '-')}`,
			showAs: `${m.first_name} ${m.last_name} (${m.party}-${m.state})`
		};
		if (m.vote_cast === 'Yea') forVoters.push(voter);
		else if (m.vote_cast === 'Nay') againstVoters.push(voter);
	}

	return {
		date: '2025-01-20',
		result: 'approved',
		source: '/us/senate/119/1/vote/7',
		forVoters,
		againstVoters,
		forCount: Number(vote.count.yeas),
		againstCount: Number(vote.count.nays)
	};
}

function parseHouseVote(filename) {
	const { parsed: xml } = readXml(filename);
	const vote = xml['rollcall-vote'];
	const meta = vote['vote-metadata'];
	const data = vote['vote-data'];
	const records = data['recorded-vote'];
	const recordsList = Array.isArray(records) ? records : [records];

	const forVoters = [];
	const againstVoters = [];

	for (const r of recordsList) {
		const leg = r.legislator;
		const name = typeof leg === 'object' ? (leg['#text'] || '') : leg;
		const party = typeof leg === 'object' ? (leg['@_party'] || '') : '';
		const state = typeof leg === 'object' ? (leg['@_state'] || '') : '';
		const nameId = typeof leg === 'object' ? (leg['@_name-id'] || '') : '';
		const voteVal = r.vote;

		const normalizedName = name.toLowerCase().replace(/[^a-z\s-]/g, '').replace(/\s+/g, '-');
		const voter = {
			href: `/us/representative/${normalizedName}`,
			showAs: `${name} (${party}-${state})`
		};

		if (voteVal === 'Yea') forVoters.push(voter);
		else if (voteVal === 'Nay') againstVoters.push(voter);
	}

	// Get totals from metadata
	const totals = meta['vote-totals']['totals-by-vote'];

	return {
		date: '2025-01-22',
		result: 'approved',
		source: '/us/house/119/1/roll/23',
		forVoters,
		againstVoters,
		forCount: Number(totals['yea-total']),
		againstCount: Number(totals['nay-total'])
	};
}

// ─── Generate AKN XMLs ───

function voterXml(voters, indent = '\t\t\t\t') {
	return voters.map(v =>
		`${indent}<akndiff:voter href="${v.href}" showAs="${escXml(v.showAs)}"/>`
	).join('\n');
}

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

console.log('Parsing bill versions...');
const pcs = readXml('01-pcs-placed-calendar.xml');
const es = readXml('02-es-engrossed.xml');
const enr = readXml('03-enr-enrolled.xml');

const pcsSections = extractSections(pcs.parsed, pcs.raw);
const esSections = extractSections(es.parsed, es.raw);
const enrSections = extractSections(enr.parsed, enr.raw);

console.log(`PCS: ${pcsSections.length} sections`);
console.log(`ES:  ${esSections.length} sections`);
console.log(`ENR: ${enrSections.length} sections`);

// Detect changes between PCS and ES
const changes = [];
for (let i = 0; i < pcsSections.length; i++) {
	if (pcsSections[i].content !== esSections[i].content) {
		changes.push({
			article: pcsSections[i].eId,
			type: 'substitute',
			oldText: pcsSections[i].content,
			newText: esSections[i].content
		});
		console.log(`  Change detected in ${pcsSections[i].eId}: ${pcsSections[i].heading}`);
		console.log(`    Old: ${pcsSections[i].content.length} chars`);
		console.log(`    New: ${esSections[i].content.length} chars`);
	}
}

console.log('\nParsing votes...');
const senateVote = parseSenateVote('vote-senate-007.xml');
const houseVote = parseHouseVote('vote-house-023.xml');
console.log(`Senate: ${senateVote.forCount}-${senateVote.againstCount} (${senateVote.forVoters.length} yea, ${senateVote.againstVoters.length} nay)`);
console.log(`House:  ${houseVote.forCount}-${houseVote.againstCount} (${houseVote.forVoters.length} yea, ${houseVote.againstVoters.length} nay)`);

// ─── 01-bill.xml (PCS — Placed on Calendar Senate) ───

const bill = `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
	<bill name="s5-119-pcs">
		<meta>
${frbr('/us/bill/119/s/5/pcs', '/us/bill/119/s/5', '2025-01-07', 'introduced', '/us/senator/britt-katie', 'us')}
			<references>
				<TLCPerson eId="britt" href="/us/senator/britt-katie" showAs="Sen. Katie Britt (R-AL)"/>
			</references>
		</meta>

		<preface>
			<longTitle><p>S. 5 — <docTitle>Laken Riley Act</docTitle></p></longTitle>
			<p>A bill to require the Secretary of Homeland Security to take into custody aliens who have been charged in the United States with theft, and for other purposes.</p>
		</preface>

		<body>
${articlesXml(pcsSections)}
		</body>
	</bill>
</akomaNtoso>
`;

// ─── 02-amendment-1.xml (Senate Passage with amendments) ───

const amendment1 = `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
	<amendment name="s5-119-senate-passage">
		<meta>
${frbr('/us/bill/119/s/5/es', '/us/bill/119/s/5', '2025-01-20', 'passage', '/us/senate', 'us')}
			<references>
				<TLCOrganization eId="senate" href="/us/senate" showAs="United States Senate"/>
			</references>
		</meta>

		<preface>
			<longTitle><p><docTitle>Senate Passage — S. 5 Laken Riley Act</docTitle></p></longTitle>
			<p>Passed Senate with amendments by roll call vote 64-35 on January 20, 2025.</p>
		</preface>

		<amendmentBody>
			<amendmentContent>
				<p>The Senate passed S. 5 with an amendment in the nature of a substitute, adding "assault of a law enforcement officer" to the list of offenses requiring mandatory detention.</p>
			</amendmentContent>
		</amendmentBody>

		<akndiff:changeSet
			base="/us/bill/119/s/5/eng@2025-01-07"
			result="/us/bill/119/s/5/eng@2025-01-20">

			<akndiff:vote date="2025-01-20" result="approved" source="/us/senate/119/1/vote/7">
				<akndiff:for count="${senateVote.forCount}">
${voterXml(senateVote.forVoters, '\t\t\t\t\t')}
				</akndiff:for>
				<akndiff:against count="${senateVote.againstCount}">
${voterXml(senateVote.againstVoters, '\t\t\t\t\t')}
				</akndiff:against>
				<akndiff:abstain/>
			</akndiff:vote>

${changes.map(c => `			<akndiff:articleChange article="${c.article}" type="${c.type}">
				<akndiff:old>${escXml(c.oldText)}</akndiff:old>
				<akndiff:new>${escXml(c.newText)}</akndiff:new>
			</akndiff:articleChange>`).join('\n')}
		</akndiff:changeSet>
	</amendment>
</akomaNtoso>
`;

// ─── 03-amendment-2.xml (House Passage, no text changes) ───

const amendment2 = `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
	<amendment name="s5-119-house-passage">
		<meta>
${frbr('/us/bill/119/s/5/enr', '/us/bill/119/s/5', '2025-01-22', 'passage', '/us/house', 'us')}
			<references>
				<TLCOrganization eId="house" href="/us/house" showAs="United States House of Representatives"/>
			</references>
		</meta>

		<preface>
			<longTitle><p><docTitle>House Passage — S. 5 Laken Riley Act</docTitle></p></longTitle>
			<p>Passed House without amendment by roll call vote 263-156 on January 22, 2025.</p>
		</preface>

		<amendmentBody>
			<amendmentContent>
				<p>The House passed S. 5 as received from the Senate without amendment. No text changes were made.</p>
			</amendmentContent>
		</amendmentBody>

		<akndiff:changeSet
			base="/us/bill/119/s/5/eng@2025-01-20"
			result="/us/bill/119/s/5/eng@2025-01-22">

			<akndiff:vote date="2025-01-22" result="approved" source="/us/house/119/1/roll/23">
				<akndiff:for count="${houseVote.forCount}">
${voterXml(houseVote.forVoters, '\t\t\t\t\t')}
				</akndiff:for>
				<akndiff:against count="${houseVote.againstCount}">
${voterXml(houseVote.againstVoters, '\t\t\t\t\t')}
				</akndiff:against>
				<akndiff:abstain/>
			</akndiff:vote>
		</akndiff:changeSet>
	</amendment>
</akomaNtoso>
`;

// ─── 04-act-final.xml (Public Law 119-1) ───

const actFinal = `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
	<act name="public-law-119-1">
		<meta>
${frbr('/us/pl/119/1', '/us/pl/119/1', '2025-01-29', 'enacted', '/us/congress', 'us')}
		</meta>

		<preface>
			<longTitle><p>Public Law 119-1 — <docTitle>Laken Riley Act</docTitle></p></longTitle>
			<p>An Act to require the Secretary of Homeland Security to take into custody aliens who have been charged in the United States with theft, and for other purposes. Signed by the President on January 29, 2025.</p>
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
writeFileSync(join(OUT, '03-amendment-2.xml'), amendment2);
console.log('  03-amendment-2.xml');
writeFileSync(join(OUT, '04-act-final.xml'), actFinal);
console.log('  04-act-final.xml');

console.log('\nDone! Generated 4 AKN Diff XMLs in s5-laken-riley/akn/');
