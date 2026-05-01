/**
 * Parse the OASIS Akoma Ntoso XSD into per-type JSON trees that we render
 * inside our docs explorer.
 *
 * Input:  static/akn-xsd/akomantoso30.xsd  (the vendored OASIS schema)
 * Output: src/lib/akn-schema/generated/<type>.json  (one per top-level AKN type)
 *         src/lib/akn-schema/generated/index.json   (list of types + meta)
 *
 * Design notes:
 *  - The XSD is monolithic; we pre-index every <complexType>, <simpleType>,
 *    <element>, <group> and <attributeGroup> by name.
 *  - For each top-level document type we walk the element's content model
 *    fully, expanding <element ref="...">, <group ref="...">, sequence,
 *    choice, and all. Cycles are broken by tracking the stack of types
 *    currently being expanded — when we'd recurse into one already on
 *    the stack, we emit a `cycleRef` node instead. This keeps the output
 *    finite even for AKN's heavily mutual-recursive definitions
 *    (hierarchy / block / inline).
 *  - Documentation strings are extracted from <xsd:documentation><comment>
 *    when present (the OASIS convention).
 */

import { XMLParser } from 'fast-xml-parser';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const XSD_PATH = join(ROOT, 'static/akn-xsd/akomantoso30.xsd');
const OUT_DIR = join(ROOT, 'src/lib/akn-schema/generated');

// The 12 official top-level document types, taken from the <xsd:group name="documentType">
// choice in the AKN schema. Order matches the schema.
const TOP_LEVEL_TYPES = [
	'amendmentList',
	'officialGazette',
	'documentCollection',
	'act',
	'bill',
	'debateReport',
	'debate',
	'statement',
	'amendment',
	'judgment',
	'portion',
	'doc'
] as const;

type Cardinality = { min: number; max: number | 'unbounded' };

type SchemaNode =
	| { kind: 'element'; name: string; typeRef?: string; doc?: string; card: Cardinality; attributes: AttrInfo[]; children: SchemaNode[]; childMode: 'sequence' | 'choice' | 'all' | 'leaf' }
	| { kind: 'cycle'; name: string; typeRef: string; card: Cardinality; doc?: string }
	| { kind: 'text'; doc?: string }; // mixed-content marker

type AttrInfo = {
	name: string;
	typeRef?: string;
	use: 'required' | 'optional';
	default?: string;
	doc?: string;
};

type ParsedTopType = {
	name: string;
	doc?: string;
	root: SchemaNode;
};

// ---------------------------------------------------------------------------
// XSD indexing
// ---------------------------------------------------------------------------

type XsdIndex = {
	complexTypes: Map<string, any>;
	simpleTypes: Map<string, any>;
	elements: Map<string, any>;
	groups: Map<string, any>;
	attributeGroups: Map<string, any>;
	attributes: Map<string, any>;
};

function buildIndex(schema: any): XsdIndex {
	const idx: XsdIndex = {
		complexTypes: new Map(),
		simpleTypes: new Map(),
		elements: new Map(),
		groups: new Map(),
		attributeGroups: new Map(),
		attributes: new Map()
	};

	const collect = (key: keyof XsdIndex, node: any) => {
		const list = asArray(node);
		for (const item of list) {
			const name = item['@_name'];
			if (name) (idx[key] as Map<string, any>).set(name, item);
		}
	};

	collect('complexTypes', schema['xsd:complexType']);
	collect('simpleTypes', schema['xsd:simpleType']);
	collect('elements', schema['xsd:element']);
	collect('groups', schema['xsd:group']);
	collect('attributeGroups', schema['xsd:attributeGroup']);
	collect('attributes', schema['xsd:attribute']);
	return idx;
}

function asArray<T>(v: T | T[] | undefined): T[] {
	if (v === undefined || v === null) return [];
	return Array.isArray(v) ? v : [v];
}

function readDoc(node: any): string | undefined {
	const ann = node?.['xsd:annotation'];
	if (!ann) return undefined;
	const docs = asArray(ann['xsd:documentation']);
	for (const d of docs) {
		// AKN convention: <xsd:documentation><comment>...</comment></xsd:documentation>
		const comment = d?.comment;
		if (typeof comment === 'string' && comment.trim()) return comment.trim();
		if (comment && typeof comment === 'object' && typeof comment['#text'] === 'string') {
			return comment['#text'].trim();
		}
		// Fallback: raw text content
		if (typeof d === 'string' && d.trim()) return d.trim();
		if (d && typeof d === 'object' && typeof d['#text'] === 'string' && d['#text'].trim()) {
			return d['#text'].trim();
		}
	}
	return undefined;
}

function parseCardinality(node: any): Cardinality {
	const min = node['@_minOccurs'] !== undefined ? Number(node['@_minOccurs']) : 1;
	const rawMax = node['@_maxOccurs'];
	const max: number | 'unbounded' =
		rawMax === undefined ? 1 : rawMax === 'unbounded' ? 'unbounded' : Number(rawMax);
	return { min, max };
}

// ---------------------------------------------------------------------------
// Walking the schema
// ---------------------------------------------------------------------------

class Walker {
	idx: XsdIndex;
	/** Element names currently on the recursion stack — used for cycle detection. */
	elementStack: Set<string> = new Set();
	/** Group names currently on the recursion stack. */
	groupStack: Set<string> = new Set();
	/**
	 * Maximum tree depth from the top-level type. Beyond this depth elements are
	 * emitted as cycle/ref markers so each per-type page renders the IMMEDIATE
	 * structural model fully but keeps deeply nested branches as clickable refs.
	 * Matches the OASIS reference style: each page is local, not a full unfold.
	 */
	maxDepth = 1;
	depth = 0;

	constructor(idx: XsdIndex) {
		this.idx = idx;
	}

	/** Resolve a top-level <element name=...> declaration into a SchemaNode tree. */
	walkTopLevelElement(name: string): SchemaNode {
		const elDecl = this.idx.elements.get(name);
		if (!elDecl) {
			throw new Error(`Top-level element <${name}> not found in schema`);
		}
		return this.resolveElement(elDecl, { min: 1, max: 1 });
	}

	/**
	 * An element declaration: either it has @type pointing to a named complexType,
	 * or an inline <xsd:complexType>, or it has @ref pointing to another top-level element,
	 * or it's a simple-text element.
	 */
	resolveElement(decl: any, card: Cardinality): SchemaNode {
		// <xsd:element ref="name" .../>  → resolve to that top-level element
		const ref = decl['@_ref'];
		if (ref) {
			const target = this.idx.elements.get(ref);
			if (target) {
				// Stop expanding at depth limit, or on cycle — emit back-reference.
				if (this.elementStack.has(ref) || this.depth >= this.maxDepth) {
					return {
						kind: 'cycle',
						name: ref,
						typeRef: target['@_type'] ?? ref,
						card,
						doc: readDoc(target)
					};
				}
				this.elementStack.add(ref);
				this.depth++;
				try {
					return this.resolveElement(target, card);
				} finally {
					this.elementStack.delete(ref);
					this.depth--;
				}
			}
			// External (xml:lang etc.) — render as a leaf
			return {
				kind: 'element',
				name: ref,
				card,
				attributes: [],
				children: [],
				childMode: 'leaf'
			};
		}

		const name = decl['@_name'];
		const doc = readDoc(decl);
		const typeAttr = decl['@_type'];
		const inlineComplex = decl['xsd:complexType'];
		const inlineSimple = decl['xsd:simpleType'];

		if (inlineComplex) {
			const expanded = this.expandComplexType(inlineComplex, name);
			return {
				kind: 'element',
				name,
				doc,
				card,
				attributes: expanded.attributes,
				children: expanded.children,
				childMode: expanded.childMode
			};
		}

		if (typeAttr) {
			// Named type. If it's a complexType, expand. Otherwise it's a leaf with text content.
			if (this.idx.complexTypes.has(typeAttr)) {
				const expanded = this.expandNamedComplexType(typeAttr);
				return {
					kind: 'element',
					name,
					typeRef: typeAttr,
					doc,
					card,
					attributes: expanded.attributes,
					children: expanded.children,
					childMode: expanded.childMode
				};
			}
			// Simple/built-in type → leaf
			return {
				kind: 'element',
				name,
				typeRef: typeAttr,
				doc,
				card,
				attributes: [],
				children: [],
				childMode: 'leaf'
			};
		}

		if (inlineSimple) {
			return {
				kind: 'element',
				name,
				doc,
				card,
				attributes: [],
				children: [],
				childMode: 'leaf'
			};
		}

		// No type info — treat as leaf
		return {
			kind: 'element',
			name,
			doc,
			card,
			attributes: [],
			children: [],
			childMode: 'leaf'
		};
	}

	expandNamedComplexType(typeName: string): {
		children: SchemaNode[];
		attributes: AttrInfo[];
		childMode: 'sequence' | 'choice' | 'all' | 'leaf';
	} {
		const ct = this.idx.complexTypes.get(typeName);
		if (!ct) return { children: [], attributes: [], childMode: 'leaf' };
		return this.expandComplexType(ct, typeName);
	}

	expandComplexType(
		ct: any,
		_owner: string | undefined
	): {
		children: SchemaNode[];
		attributes: AttrInfo[];
		childMode: 'sequence' | 'choice' | 'all' | 'leaf';
	} {
		// Handle <xsd:complexContent><xsd:extension base="...">...</xsd:extension></xsd:complexContent>
		const complexContent = ct['xsd:complexContent'];
		if (complexContent) {
			const extension = complexContent['xsd:extension'];
			if (extension) {
				const base = extension['@_base'];
				const baseExpanded = base && this.idx.complexTypes.has(base)
					? this.expandNamedComplexType(base)
					: { children: [], attributes: [], childMode: 'leaf' as const };

				const ownChildren: SchemaNode[] = [];
				let childMode: 'sequence' | 'choice' | 'all' | 'leaf' = baseExpanded.childMode;
				if (extension['xsd:sequence']) {
					childMode = 'sequence';
					ownChildren.push(...this.expandParticleContainer(extension['xsd:sequence']));
				}
				if (extension['xsd:choice']) {
					childMode = 'choice';
					ownChildren.push(...this.expandParticleContainer(extension['xsd:choice']));
				}
				if (extension['xsd:all']) {
					childMode = 'all';
					ownChildren.push(...this.expandParticleContainer(extension['xsd:all']));
				}
				const ownAttrs = this.collectAttributes(extension);
				return {
					children: [...baseExpanded.children, ...ownChildren],
					attributes: [...baseExpanded.attributes, ...ownAttrs],
					childMode
				};
			}
			// restriction etc. — fall through, treat as leaf
		}

		// Direct content models
		if (ct['xsd:sequence']) {
			return {
				children: this.expandParticleContainer(ct['xsd:sequence']),
				attributes: this.collectAttributes(ct),
				childMode: 'sequence'
			};
		}
		if (ct['xsd:choice']) {
			return {
				children: this.expandParticleContainer(ct['xsd:choice']),
				attributes: this.collectAttributes(ct),
				childMode: 'choice'
			};
		}
		if (ct['xsd:all']) {
			return {
				children: this.expandParticleContainer(ct['xsd:all']),
				attributes: this.collectAttributes(ct),
				childMode: 'all'
			};
		}
		if (ct['xsd:group']) {
			// complexType wrapping a group ref directly
			return {
				children: this.expandGroupRef(ct['xsd:group']),
				attributes: this.collectAttributes(ct),
				childMode: 'sequence'
			};
		}

		return {
			children: [],
			attributes: this.collectAttributes(ct),
			childMode: 'leaf'
		};
	}

	/**
	 * Expand the children of a sequence/choice/all container into SchemaNodes.
	 * Container may itself contain nested sequence/choice/group — we flatten one level
	 * because nesting depth in AKN is high and a faithful nested rendering becomes noise;
	 * the cardinality on the outer container is reasonably preserved by walking each child.
	 */
	expandParticleContainer(container: any): SchemaNode[] {
		const out: SchemaNode[] = [];

		// Direct <xsd:element> children
		for (const el of asArray(container['xsd:element'])) {
			const card = parseCardinality(el);
			out.push(this.resolveElement(el, card));
		}
		// <xsd:group ref="...">
		for (const g of asArray(container['xsd:group'])) {
			const groupCard = parseCardinality(g);
			const groupChildren = this.expandGroupRef(g);
			// Apply the group's cardinality to each expanded child by intersecting
			for (const child of groupChildren) {
				if (child.kind === 'element' || child.kind === 'cycle') {
					out.push({
						...child,
						card: combineCard(child.card, groupCard)
					});
				} else {
					out.push(child);
				}
			}
		}
		// Nested sequence/choice/all — recurse and flatten
		for (const seq of asArray(container['xsd:sequence'])) {
			out.push(...this.expandParticleContainer(seq));
		}
		for (const ch of asArray(container['xsd:choice'])) {
			out.push(...this.expandParticleContainer(ch));
		}
		for (const all of asArray(container['xsd:all'])) {
			out.push(...this.expandParticleContainer(all));
		}
		// <xsd:any> — text/anything marker
		if (container['xsd:any']) {
			out.push({ kind: 'text' });
		}
		return out;
	}

	expandGroupRef(g: any): SchemaNode[] {
		const ref = g['@_ref'];
		if (!ref) return [];
		const groupDef = this.idx.groups.get(ref);
		if (!groupDef) return [];
		if (this.groupStack.has(ref) || this.depth > this.maxDepth) {
			return [
				{
					kind: 'cycle',
					name: ref,
					typeRef: `group:${ref}`,
					card: { min: 0, max: 'unbounded' }
				}
			];
		}
		this.groupStack.add(ref);
		try {
			return this.expandParticleContainer(groupDef);
		} finally {
			this.groupStack.delete(ref);
		}
	}

	collectAttributes(node: any): AttrInfo[] {
		const out: AttrInfo[] = [];
		for (const a of asArray(node['xsd:attribute'])) {
			out.push(this.toAttrInfo(a));
		}
		for (const ag of asArray(node['xsd:attributeGroup'])) {
			const ref = ag['@_ref'];
			if (!ref) continue;
			const def = this.idx.attributeGroups.get(ref);
			if (!def) continue;
			out.push(...this.collectAttributes(def));
		}
		// Dedupe by name (later wins)
		const seen = new Map<string, AttrInfo>();
		for (const a of out) seen.set(a.name, a);
		return [...seen.values()];
	}

	toAttrInfo(a: any): AttrInfo {
		const ref = a['@_ref'];
		if (ref) {
			const def = this.idx.attributes.get(ref);
			if (def) return this.toAttrInfo(def);
			return { name: ref, use: 'optional' };
		}
		return {
			name: a['@_name'],
			typeRef: a['@_type'],
			use: a['@_use'] === 'required' ? 'required' : 'optional',
			default: a['@_default'] ?? a['@_fixed'],
			doc: readDoc(a)
		};
	}
}

function cloneWithCard(node: SchemaNode, card: Cardinality): SchemaNode {
	if (node.kind === 'text') return { ...node };
	if (node.kind === 'cycle') return { ...node, card };
	return {
		...node,
		card,
		attributes: node.attributes.map((a) => ({ ...a })),
		children: node.children.map((c) => cloneWithCard(c, c.kind === 'element' ? c.card : (c as any).card ?? { min: 1, max: 1 }))
	};
}

function combineCard(a: Cardinality, b: Cardinality): Cardinality {
	const min = a.min * b.min;
	const max =
		a.max === 'unbounded' || b.max === 'unbounded'
			? 'unbounded'
			: (a.max as number) * (b.max as number);
	return { min, max };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
	const xml = await readFile(XSD_PATH, 'utf-8');
	const parser = new XMLParser({
		ignoreAttributes: false,
		attributeNamePrefix: '@_',
		preserveOrder: false,
		removeNSPrefix: false,
		allowBooleanAttributes: true,
		parseAttributeValue: false,
		trimValues: true
	});
	const doc = parser.parse(xml);
	const schemaRoot = doc['xsd:schema'];
	if (!schemaRoot) throw new Error('No <xsd:schema> root found');

	const idx = buildIndex(schemaRoot);
	const walker = new Walker(idx);

	await mkdir(OUT_DIR, { recursive: true });

	const indexEntries: { name: string; doc?: string; nodeCount: number }[] = [];

	for (const typeName of TOP_LEVEL_TYPES) {
		walker.elementStack = new Set();
		walker.groupStack = new Set();
		walker.depth = 0;
		const root = walker.walkTopLevelElement(typeName);
		const elDecl = idx.elements.get(typeName);
		const doc = readDoc(elDecl);
		const result: ParsedTopType = { name: typeName, doc, root };
		const nodeCount = countNodes(root);
		indexEntries.push({ name: typeName, doc, nodeCount });
		const outPath = join(OUT_DIR, `${typeName}.json`);
		await writeFile(outPath, JSON.stringify(result, null, 2), 'utf-8');
		console.log(`[akn-schema] ✓ ${typeName} — ${nodeCount} nodes`);
	}

	const indexPath = join(OUT_DIR, 'index.json');
	await writeFile(
		indexPath,
		JSON.stringify(
			{
				generatedAt: new Date().toISOString(),
				source: 'static/akn-xsd/akomantoso30.xsd',
				topLevelTypes: TOP_LEVEL_TYPES,
				types: indexEntries
			},
			null,
			2
		),
		'utf-8'
	);
	console.log(`[akn-schema] ✓ index → ${indexPath.replace(ROOT, '.')}`);
}

function countNodes(n: SchemaNode): number {
	if (n.kind !== 'element') return 1;
	let total = 1;
	for (const c of n.children) total += countNodes(c);
	return total;
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
