/**
 * Bill DTD XML parser — extracts sections from US Congress bill XML
 * Converted from research/2026-02-23/us/generate-akn.mjs
 */
import { XMLParser } from 'fast-xml-parser';
import type { ParsedSection } from '../types.js';

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '@_',
	textNodeName: '#text',
	trimValues: true,
	preserveOrder: false
});

export function parseBillXml(xmlContent: string): { parsed: any; raw: string } {
	return { parsed: parser.parse(xmlContent), raw: xmlContent };
}

/**
 * Extract text from a node recursively, preserving enum values.
 * Skips XML attributes (@_...) but includes everything else.
 */
function extractNodeText(node: any): string {
	if (!node) return '';
	const parts: string[] = [];

	function walk(n: any): void {
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

/** Extract text from a <text> element, handling inline elements */
function extractTextElement(textNode: any): string {
	if (!textNode) return '';
	if (typeof textNode === 'string') return textNode.trim();
	return extractNodeText(textNode);
}

/**
 * Extract text from raw XML string by stripping tags.
 * Preserves document order for mixed content that fast-xml-parser can't handle.
 */
function extractTextFromRawXml(rawXml: string, sectionId: string): string | null {
	if (!rawXml || !sectionId) return null;
	const sectionRegex = new RegExp(
		`<section[^>]*id="${sectionId}"[^>]*>([\\s\\S]*?)(?=<section[^>]*id=|<\\/legis-body|$)`
	);
	const match = rawXml.match(sectionRegex);
	if (!match) return null;
	const sectionXml = match[1];

	const textParts: string[] = [];
	const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/g;
	let m: RegExpExecArray | null;
	while ((m = textRegex.exec(sectionXml)) !== null) {
		const cleaned = m[1]
			.replace(/<[^>]+>/g, '')
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
function extractStructuralText(node: any): string {
	if (!node) return '';
	const parts: string[] = [];

	if (node.enum) {
		const e = typeof node.enum === 'object' ? node.enum['#text'] : node.enum;
		if (e) parts.push(String(e).trim());
	}
	if (node.header) {
		const h = typeof node.header === 'object' ? node.header['#text'] : node.header;
		if (h) parts.push(String(h).trim());
	}
	if (node.text) {
		parts.push(extractTextElement(node.text));
	}
	for (const key of ['paragraph', 'subparagraph', 'clause', 'quoted-block', 'subsection']) {
		if (node[key]) {
			const children = Array.isArray(node[key]) ? node[key] : [node[key]];
			for (const child of children) {
				parts.push(extractStructuralText(child));
			}
		}
	}
	if (node['after-quoted-block']) {
		const aqb = node['after-quoted-block'];
		const t = typeof aqb === 'object' ? aqb['#text'] || '' : String(aqb);
		if (t.trim()) parts.push(t.trim());
	}

	return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

/** Extract paragraphs from a section */
function extractSectionParagraphs(section: any, rawXml: string): string[] {
	if (!section) return [];

	if (section.subsection) {
		const subs = Array.isArray(section.subsection) ? section.subsection : [section.subsection];
		const result: string[] = [];
		if (section.text) result.push(extractTextElement(section.text));
		for (const sub of subs) result.push(extractStructuralText(sub));
		return result.filter(Boolean);
	}

	if (section.paragraph) {
		const paras = Array.isArray(section.paragraph) ? section.paragraph : [section.paragraph];
		const result: string[] = [];
		if (section.text) result.push(extractTextElement(section.text));
		for (const para of paras) result.push(extractStructuralText(para));
		return result.filter(Boolean);
	}

	if (section.text && rawXml && section['@_id']) {
		const rawText = extractTextFromRawXml(rawXml, section['@_id']);
		if (rawText) return [rawText];
	}
	if (section.text) {
		return [extractTextElement(section.text)].filter(Boolean);
	}

	return [];
}

/** Extract all sections from a parsed bill XML */
export function extractSections(billXml: any, rawXml: string): ParsedSection[] {
	const bill = billXml.bill;
	if (!bill) return [];
	const body = bill['legis-body'];
	if (!body) return [];
	let sections = body.section;
	if (!sections) return [];
	if (!Array.isArray(sections)) sections = [sections];

	return sections.map((sec: any, i: number) => {
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
