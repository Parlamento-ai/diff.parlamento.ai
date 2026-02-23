import { XMLParser } from 'fast-xml-parser';
import type {
	AknDocument,
	DocumentType,
	FRBRInfo,
	LawState,
	Section,
	Article,
	ChangeSet,
	ArticleChange,
	Vote,
	Voter
} from '$lib/types';

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '@_',
	removeNSPrefix: false,
	isArray: (name) => {
		return ['section', 'article', 'akndiff:articleChange', 'eventRef', 'akndiff:voter'].includes(name);
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
		for (const key of ['TLCPerson', 'TLCOrganization', 'TLCReference']) {
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
	if (sections) {
		return sections.map((sec) => {
			const articles = (sec.article as Record<string, unknown>[]) || [];
			const result: Section = {
				eId: sec['@_eId'] as string,
				heading: extractText(sec.heading),
				articles: articles.map(parseArticle)
			};
			const num = sec.num != null ? extractText(sec.num) : undefined;
			if (num) result.num = num;
			return result;
		});
	}

	// Handle articles directly in body (no section wrapper)
	const articles = body.article as Record<string, unknown>[];
	if (articles && articles.length > 0) {
		return [{
			eId: '_default',
			heading: '',
			articles: articles.map(parseArticle)
		}];
	}

	return [];
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

function parseVoters(group: unknown): Voter[] {
	if (!group || typeof group !== 'object') return [];
	const obj = group as Record<string, unknown>;
	const voters = obj['akndiff:voter'] as Record<string, unknown>[] | undefined;
	if (!voters) return [];
	return voters.map((v) => ({
		href: (v['@_href'] as string) || '',
		showAs: (v['@_showAs'] as string) || ''
	}));
}

function parseVoteGroupCount(group: unknown): number | undefined {
	if (!group || typeof group !== 'object') return undefined;
	const obj = group as Record<string, unknown>;
	const count = obj['@_count'];
	if (count !== undefined) return Number(count);
	return undefined;
}

function parseVote(voteNode: Record<string, unknown>): Vote {
	const vote: Vote = {
		date: (voteNode['@_date'] as string) || '',
		result: (voteNode['@_result'] as Vote['result']) || 'pending',
		source: (voteNode['@_source'] as string) || '',
		for: parseVoters(voteNode['akndiff:for']),
		against: parseVoters(voteNode['akndiff:against']),
		abstain: parseVoters(voteNode['akndiff:abstain'])
	};
	const forCount = parseVoteGroupCount(voteNode['akndiff:for']);
	const againstCount = parseVoteGroupCount(voteNode['akndiff:against']);
	const abstainCount = parseVoteGroupCount(voteNode['akndiff:abstain']);
	if (forCount !== undefined) vote.forCount = forCount;
	if (againstCount !== undefined) vote.againstCount = againstCount;
	if (abstainCount !== undefined) vote.abstainCount = abstainCount;
	return vote;
}

function parseChangeSet(cs: Record<string, unknown>): ChangeSet {
	const articleChanges = cs['akndiff:articleChange'] as Record<string, unknown>[];

	const changes: ArticleChange[] = (articleChanges || []).map((ac) => {
		const change: ArticleChange = {
			article: ac['@_article'] as string,
			type: ac['@_type'] as ArticleChange['type']
		};

		if (ac['akndiff:old']) {
			change.oldText = extractText(ac['akndiff:old']);
		}
		if (ac['akndiff:new']) {
			change.newText = extractText(ac['akndiff:new']);
		}
		if (ac['@_after']) {
			change.after = ac['@_after'] as string;
		}

		return change;
	});

	const result: ChangeSet = {
		base: cs['@_base'] as string,
		result: cs['@_result'] as string,
		changes
	};

	const voteNode = cs['akndiff:vote'] as Record<string, unknown> | undefined;
	if (voteNode) {
		result.vote = parseVote(voteNode);
	}

	return result;
}

function extractPreface(doc: Record<string, unknown>): { title: string; preface: string } {
	const preface = doc.preface as Record<string, unknown> | undefined;
	let title = '';
	let prefaceText = '';

	if (preface) {
		const longTitle = preface.longTitle as Record<string, unknown> | undefined;
		if (longTitle) {
			const ltP = longTitle.p as Record<string, unknown> | undefined;
			const docTitle = ltP?.docTitle as Record<string, unknown> | string | undefined;
			if (docTitle) {
				title = typeof docTitle === 'string' ? docTitle : extractText(docTitle);
			} else {
				title = extractText(longTitle);
			}
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
	} else if (root.doc) {
		type = 'doc';
		doc = root.doc as Record<string, unknown>;
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

	// Set docSubType for <doc> elements (e.g., "communication", "votes", "changeSet")
	if (type === 'doc') {
		result.docSubType = doc['@_name'] as string || undefined;
	}

	// Parse body for acts and bills (both contain article content)
	if ((type === 'act' || type === 'bill') && doc.body) {
		result.body = parseLawBody(doc);
	}

	// Parse mainBody for doc elements (uses mainBody instead of body)
	if (type === 'doc' && doc.mainBody) {
		result.body = parseLawBody({ ...doc, body: doc.mainBody });
	}

	// Parse changeSet if present
	const changeSet = doc['akndiff:changeSet'] as Record<string, unknown> | undefined;
	if (changeSet) {
		result.changeSet = parseChangeSet(changeSet);
	}

	return result;
}
