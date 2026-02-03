import { XMLParser } from 'fast-xml-parser';
import type {
	AknNode,
	ExplorerDocType,
	FRBRMeta,
	GenericAknDocument
} from '$lib/types/explorer';
import { findNode } from '$lib/utils/akn-helpers';

const DOC_TYPES: ExplorerDocType[] = [
	'act',
	'bill',
	'amendment',
	'debate',
	'judgment',
	'officialGazette',
	'documentCollection',
	'doc',
	'statement',
	'portion'
];

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '@_',
	removeNSPrefix: false,
	preserveOrder: true,
	trimValues: false,
	textNodeName: '#text'
});

function buildAknNode(ordered: Record<string, unknown>): AknNode | null {
	// Each item in preserveOrder output is { tagName: [...children], ':@': { attrs } }
	const keys = Object.keys(ordered).filter((k) => k !== ':@' && k !== '#text');

	if (keys.length === 0) {
		// Text-only node
		const text = ordered['#text'];
		if (text !== undefined) {
			return { name: '#text', attributes: {}, children: [], text: String(text) };
		}
		return null;
	}

	const tagName = keys[0];
	const attrs: Record<string, string> = {};
	const rawAttrs = (ordered as Record<string, unknown>)[':@'] as
		| Record<string, unknown>
		| undefined;
	if (rawAttrs) {
		for (const [key, val] of Object.entries(rawAttrs)) {
			const attrName = key.startsWith('@_') ? key.slice(2) : key;
			attrs[attrName] = String(val);
		}
	}

	const childArray = (ordered as Record<string, unknown>)[tagName];
	const children: AknNode[] = [];

	if (Array.isArray(childArray)) {
		for (const child of childArray) {
			if (typeof child === 'object' && child !== null) {
				const node = buildAknNode(child as Record<string, unknown>);
				if (node) children.push(node);
			}
		}
	}

	return { name: tagName, attributes: attrs, children };
}

function parseFRBR(meta: AknNode): FRBRMeta {
	const identification = findNode(meta, 'identification');
	const references = findNode(meta, 'references');

	const work = identification ? findNode(identification, 'FRBRWork') : undefined;
	const expression = identification ? findNode(identification, 'FRBRExpression') : undefined;

	const workUri =
		work
			? findNode(work, 'FRBRuri')?.attributes['value'] || ''
			: '';
	const workDate = work ? findNode(work, 'FRBRdate') : undefined;
	const workAuthor = work ? findNode(work, 'FRBRauthor') : undefined;
	const workCountry = work ? findNode(work, 'FRBRcountry') : undefined;

	const expressionUri =
		expression
			? findNode(expression, 'FRBRuri')?.attributes['value'] || ''
			: '';

	const authorHref = workAuthor?.attributes['href'] || '';
	let authorLabel = '';

	if (references) {
		for (const child of references.children) {
			if (
				(child.name === 'TLCPerson' || child.name === 'TLCOrganization') &&
				child.attributes['href'] === authorHref
			) {
				authorLabel = child.attributes['showAs'] || '';
			}
		}
	}

	return {
		workUri,
		expressionUri,
		date: workDate?.attributes['date'] || '',
		dateName: workDate?.attributes['name'] || '',
		author: authorHref,
		authorLabel,
		country: workCountry?.attributes['value']
	};
}

export function parseGenericAkn(xml: string): GenericAknDocument {
	const ordered = parser.parse(xml) as Record<string, unknown>[];

	// Find the akomaNtoso root
	let aknRoot: AknNode | null = null;
	for (const item of ordered) {
		const node = buildAknNode(item);
		if (node && node.name === 'akomaNtoso') {
			aknRoot = node;
			break;
		}
	}
	if (!aknRoot) {
		throw new Error('No akomaNtoso root element found');
	}

	// Detect document type
	let docType: ExplorerDocType | null = null;
	let docNode: AknNode | null = null;

	for (const child of aknRoot.children) {
		if (DOC_TYPES.includes(child.name as ExplorerDocType)) {
			docType = child.name as ExplorerDocType;
			docNode = child;
			break;
		}
	}

	if (!docType || !docNode) {
		throw new Error('Unknown AKN document type');
	}

	// Parse FRBR metadata
	const meta = findNode(docNode, 'meta');
	const frbr = meta ? parseFRBR(meta) : {
		workUri: '',
		expressionUri: '',
		date: '',
		dateName: '',
		author: '',
		authorLabel: ''
	};

	return {
		type: docType,
		name: docNode.attributes['name'] || '',
		frbr,
		root: docNode,
		rawXml: xml
	};
}

