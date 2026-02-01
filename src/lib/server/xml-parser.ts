import { XMLParser } from 'fast-xml-parser';
import type {
	AknDocument,
	DocumentType,
	FRBRInfo,
	LawState,
	Section,
	Article,
	ChangeSet,
	ArticleChange
} from '$lib/types';

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '@_',
	removeNSPrefix: false,
	isArray: (name) => {
		return ['section', 'article', 'aknpp:articleChange', 'eventRef'].includes(name);
	}
});

function extractText(node: unknown): string {
	if (typeof node === 'string') return node;
	if (typeof node === 'number') return String(node);
	if (!node || typeof node !== 'object') return '';

	const obj = node as Record<string, unknown>;

	// Handle <p> elements - could be string or object with nested elements
	if ('p' in obj) {
		return extractText(obj.p);
	}
	// Handle text content mixed with elements like <docTitle>
	if ('#text' in obj) {
		const parts: string[] = [];
		const textPart = String(obj['#text']);
		parts.push(textPart);
		for (const [key, val] of Object.entries(obj)) {
			if (key !== '#text' && !key.startsWith('@_')) {
				parts.push(extractText(val));
			}
		}
		return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
	}

	// Array of <p> elements
	if (Array.isArray(node)) {
		return node.map(extractText).join(' ');
	}

	// Try to find any text content in child elements
	const texts: string[] = [];
	for (const [key, val] of Object.entries(obj)) {
		if (!key.startsWith('@_')) {
			texts.push(extractText(val));
		}
	}
	return texts.filter(Boolean).join(' ').trim();
}

function extractParagraphText(content: unknown): string {
	if (!content || typeof content !== 'object') return extractText(content);
	const obj = content as Record<string, unknown>;
	if ('p' in obj) {
		const p = obj.p;
		if (typeof p === 'string') return p;
		if (Array.isArray(p)) return p.map(extractText).join(' ');
		return extractText(p);
	}
	return extractText(content);
}

function parseFRBR(identification: Record<string, unknown>, references?: Record<string, unknown>): FRBRInfo {
	const work = identification.FRBRWork as Record<string, unknown>;
	const expression = identification.FRBRExpression as Record<string, unknown>;

	const authorHref = (work.FRBRauthor as Record<string, unknown>)?.['@_href'] as string || '';

	let authorLabel = '';
	if (references) {
		// Look through TLCPerson and TLCOrganization
		for (const key of ['TLCPerson', 'TLCOrganization']) {
			const ref = references[key];
			if (ref) {
				const refs = Array.isArray(ref) ? ref : [ref];
				for (const r of refs) {
					const ro = r as Record<string, unknown>;
					if (ro['@_href'] === authorHref) {
						authorLabel = ro['@_showAs'] as string || '';
					}
				}
			}
		}
	}

	return {
		workUri: (work.FRBRuri as Record<string, unknown>)?.['@_value'] as string || '',
		expressionUri: (expression.FRBRuri as Record<string, unknown>)?.['@_value'] as string || '',
		date: (work.FRBRdate as Record<string, unknown>)?.['@_date'] as string || '',
		dateName: (work.FRBRdate as Record<string, unknown>)?.['@_name'] as string || '',
		author: authorHref,
		authorLabel
	};
}

function parseArticle(art: Record<string, unknown>): Article {
	return {
		eId: art['@_eId'] as string,
		heading: extractText(art.heading),
		content: extractParagraphText(art.content)
	};
}

function parseSections(body: Record<string, unknown>): Section[] {
	const sections = body.section as Record<string, unknown>[];
	if (!sections) return [];

	return sections.map((sec) => {
		const articles = (sec.article as Record<string, unknown>[]) || [];
		return {
			eId: sec['@_eId'] as string,
			heading: extractText(sec.heading),
			articles: articles.map(parseArticle)
		};
	});
}

function parseLawBody(doc: Record<string, unknown>): LawState {
	const preface = doc.preface as Record<string, unknown> | undefined;
	const body = doc.body as Record<string, unknown>;

	let title = '';
	let prefaceText = '';

	if (preface) {
		const longTitle = preface.longTitle as Record<string, unknown> | undefined;
		if (longTitle) {
			title = extractText(longTitle);
		}
		// Get the preface paragraph text (not the longTitle)
		const p = preface.p;
		if (p) {
			prefaceText = Array.isArray(p)
				? p.map(extractText).join(' ')
				: extractText(p);
		}
	}

	return {
		title,
		preface: prefaceText,
		sections: parseSections(body)
	};
}

function parseChangeSet(cs: Record<string, unknown>): ChangeSet {
	const articleChanges = cs['aknpp:articleChange'] as Record<string, unknown>[];

	const changes: ArticleChange[] = (articleChanges || []).map((ac) => {
		const change: ArticleChange = {
			article: ac['@_article'] as string,
			type: ac['@_type'] as ArticleChange['type']
		};

		if (ac['aknpp:old']) {
			change.oldText = extractText(ac['aknpp:old']);
		}
		if (ac['aknpp:new']) {
			change.newText = extractText(ac['aknpp:new']);
		}
		if (ac['@_after']) {
			change.after = ac['@_after'] as string;
		}

		return change;
	});

	return {
		base: cs['@_base'] as string,
		result: cs['@_result'] as string,
		changes
	};
}

function extractPreface(doc: Record<string, unknown>): { title: string; preface: string } {
	const preface = doc.preface as Record<string, unknown> | undefined;
	let title = '';
	let prefaceText = '';

	if (preface) {
		const longTitle = preface.longTitle as Record<string, unknown> | undefined;
		if (longTitle) {
			title = extractText(longTitle);
		}
		const p = preface.p;
		if (p) {
			prefaceText = Array.isArray(p)
				? p.map(extractText).join(' ')
				: extractText(p);
		}
	}

	return { title, preface: prefaceText };
}

export function parseAknDocument(xml: string, fileName: string): AknDocument {
	const parsed = parser.parse(xml);
	const root = parsed.akomaNtoso as Record<string, unknown>;

	// Detect document type
	let type: DocumentType;
	let doc: Record<string, unknown>;

	if (root.act) {
		type = 'act';
		doc = root.act as Record<string, unknown>;
	} else if (root.bill) {
		type = 'bill';
		doc = root.bill as Record<string, unknown>;
	} else if (root.amendment) {
		type = 'amendment';
		doc = root.amendment as Record<string, unknown>;
	} else {
		throw new Error(`Unknown document type in ${fileName}`);
	}

	const meta = doc.meta as Record<string, unknown>;
	const identification = meta.identification as Record<string, unknown>;
	const references = meta.references as Record<string, unknown> | undefined;
	const frbr = parseFRBR(identification, references);

	const { title: prefaceTitle, preface } = extractPreface(doc);

	const result: AknDocument = {
		type,
		name: doc['@_name'] as string || '',
		frbr,
		preface,
		prefaceTitle,
		fileName
	};

	// Parse body for acts
	if (type === 'act' && doc.body) {
		result.body = parseLawBody(doc);
	}

	// Parse changeSet if present
	const changeSet = doc['aknpp:changeSet'] as Record<string, unknown> | undefined;
	if (changeSet) {
		result.changeSet = parseChangeSet(changeSet);
	}

	return result;
}
