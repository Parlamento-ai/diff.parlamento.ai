/**
 * .xml file → row mapping for the v3 research schema.
 *
 * v3 inverts v2: the AKN XML IS the document. There is no YAML wrapper.
 * Plumbing the SQL needs but AKN core doesn't model lives in
 * `<akndiff:*>` elements under `<meta><proprietary>`.
 *
 * What we extract from one .xml file:
 *   - type            ← the AKN root element under <akomaNtoso>
 *                       (<bill>, <act>, <officialGazette>, ...)
 *   - nativeId        ← <akndiff:nativeId>
 *   - sourceUrl       ← <akndiff:sourceUrl>
 *   - title           ← <longTitle> (or <FRBRalias>)
 *   - topics          ← <keyword showAs="...">
 *   - language        ← <FRBRlanguage language="...">
 *   - publishedAt     ← per-type lifecycle event date
 *   - per-type detail (status, sponsors, dates, ...)
 *   - events (bills)  ← <lifecycle><eventRef>
 *   - links           ← <ref>, <componentRef>, <mref>, ...
 *   - prior versions  ← <akndiff:priorVersion href="..."> sibling files
 *
 * Filenames:
 *   - The current state of doc N is at  <type>s/N.xml.
 *   - Prior versions live alongside  <type>s/N.v1.xml,  N.v2.xml, etc.
 *   - The walker skips `.vN.xml` files; they're loaded indirectly via
 *     the `<akndiff:priorVersion>` declarations in the current XML.
 *
 * Validation is "throw on mismatch". The entrypoint (build.ts) catches
 * and prints the file path + reason. We don't validate against OASIS
 * AKN XSDs in this rig — XSD validation is a later pass.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import type { DocumentType } from './current';

// ──────────────────────────────────────────────────────────────────────
// Public types — what the build script consumes from us.
// ──────────────────────────────────────────────────────────────────────

export type ExtractedSponsor = {
	name: string;
	role?: string;
	party?: string;
	chamber?: string;
	externalId?: string;
};

export type ExtractedEvent = {
	sequence: number;
	occurredAt: string;
	actionType: string;
	actionTypeLocal: string;
	chamber?: string;
};

export type ExtractedLink = {
	relation: string;
	href: string;
	aknElement: string;
	ordinal?: number;
	/** The link's target as (country, type, nativeId) — resolved from
	 *  AKN FRBR-style `/akn/<country>/<type>/<date>/<nativeId>` hrefs. */
	toCountry?: string;
	toType?: DocumentType;
	toNativeId?: string;
};

export type ExtractedVersion = {
	version: number;
	publishedAt: string;
	xml: string;
	changeNote?: string;
	sourceUrl?: string;
};

export type ParsedDoc = {
	// path-derived
	filePath: string;
	countryCode: string;

	// extracted from the XML
	type: DocumentType;
	nativeId: string;
	sourceUrl: string;
	xml: string;
	title: string;
	language: string;
	topics: string[];
	publishedAt: string;
	lastActivityAt: string;
	/**
	 * Free-form notes the contributor authored alongside the data, in
	 * <akndiff:researchNotes> under <meta><proprietary>. Optional.
	 * NOT extracted — read verbatim from that element's text content.
	 */
	researchNotes?: string;

	// extracted, type-specific
	bill?: {
		subtype?: string;
		status: string;
		statusLocal: string;
		submittedAt: string;
		urgency?: string;
		sponsors: ExtractedSponsor[];
	};
	act?: {
		status: string;
		promulgatedAt: string;
		effectiveAt?: string;
		repealedAt?: string;
		issuingBody: string;
	};
	journal?: {
		issueNumber: string;
		issuedAt: string;
		publisher: string;
		scope: string;
		regionCode?: string;
	};

	// extracted, repeated rows
	events: ExtractedEvent[];
	links: ExtractedLink[];
	versions: ExtractedVersion[];
};

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

export class LoaderError extends Error {
	constructor(
		public filePath: string,
		public reason: string
	) {
		super(`${filePath}: ${reason}`);
		this.name = 'LoaderError';
	}
}

function requireField<T>(filePath: string, value: T | null | undefined, name: string): T {
	if (value === null || value === undefined || value === '') {
		throw new LoaderError(filePath, `missing required field '${name}'`);
	}
	return value;
}

/**
 * Date strings → epoch ms. Accepts 'YYYY-MM-DD' (UTC midnight) and
 * full ISO strings. The experiment doesn't need timezone subtlety.
 */
export function toEpochMs(filePath: string, name: string, value: unknown): number {
	if (value instanceof Date) return value.getTime();
	if (typeof value === 'number') return value;
	if (typeof value === 'string') {
		if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
			return Date.parse(value + 'T00:00:00Z');
		}
		const ms = Date.parse(value);
		if (!Number.isNaN(ms)) return ms;
	}
	throw new LoaderError(filePath, `field '${name}' is not a valid date: ${JSON.stringify(value)}`);
}

// ──────────────────────────────────────────────────────────────────────
// XML parser config — fast-xml-parser, namespace-stripped.
// ──────────────────────────────────────────────────────────────────────
//
// We parse with `removeNSPrefix: true`. AKN core and `akndiff:` elements
// look identical to the extractor afterwards, which is what we want
// today: `<keyword>` and `<akndiff:keyword>` would both surface as
// `keyword`. If the corpus grows enough that the namespaces need to be
// disambiguated, flip `removeNSPrefix` off and key by prefixed name.

const xmlParser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '@_',
	removeNSPrefix: true,
	// Force these elements to always be arrays, even when there's only
	// one — saves the extractor from sprinkling `Array.isArray()`.
	isArray: (name) =>
		new Set([
			'eventRef',
			'keyword',
			'sponsor',
			'TLCPerson',
			'TLCRole',
			'ref',
			'mref',
			'rref',
			'componentRef',
			'passiveRef',
			'authorialNote',
			'priorVersion',
			'article',
			'p'
		]).has(name)
});

type XmlNode = Record<string, unknown>;

function parseXmlOrThrow(filePath: string, xml: string, where: string): XmlNode {
	try {
		return xmlParser.parse(xml) as XmlNode;
	} catch (err) {
		throw new LoaderError(
			filePath,
			`failed to parse XML at ${where}: ${(err as Error).message}`
		);
	}
}

/** Walk an XML tree and yield every node. */
function* walk(node: unknown): IterableIterator<XmlNode> {
	if (!node || typeof node !== 'object') return;
	if (Array.isArray(node)) {
		for (const c of node) yield* walk(c);
		return;
	}
	yield node as XmlNode;
	for (const v of Object.values(node as XmlNode)) {
		if (v && typeof v === 'object') yield* walk(v);
	}
}

function findFirst(root: unknown, key: string): XmlNode | undefined {
	for (const n of walk(root)) {
		if (key in n) {
			const v = n[key];
			if (Array.isArray(v)) {
				const first = v[0];
				return typeof first === 'object' && first !== null ? (first as XmlNode) : undefined;
			}
			if (typeof v === 'object' && v !== null) return v as XmlNode;
			// Text-only element, e.g. <akndiff:nativeId>ley-21000</akndiff:nativeId>.
			// fast-xml-parser collapses those to a bare string. Synthesize a
			// node so the rest of the extractor doesn't have to care.
			if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
				return { '#text': String(v) };
			}
		}
	}
	return undefined;
}

function findAll(root: unknown, key: string): XmlNode[] {
	const out: XmlNode[] = [];
	for (const n of walk(root)) {
		if (key in n) {
			const v = n[key];
			if (Array.isArray(v)) {
				for (const item of v) {
					if (typeof item === 'object' && item !== null) out.push(item as XmlNode);
					else if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
						out.push({ '#text': String(item) });
					}
				}
			} else if (typeof v === 'object' && v !== null) out.push(v as XmlNode);
			else if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
				out.push({ '#text': String(v) });
			}
		}
	}
	return out;
}

/** Concatenate the `#text` content of a node tree, recursively. */
function textOf(node: unknown): string {
	if (node === null || node === undefined) return '';
	if (typeof node === 'string') return node;
	if (typeof node === 'number' || typeof node === 'boolean') return String(node);
	if (Array.isArray(node)) return node.map(textOf).join(' ');
	if (typeof node === 'object') {
		const obj = node as XmlNode;
		const parts: string[] = [];
		if ('#text' in obj) parts.push(String(obj['#text']));
		for (const [k, v] of Object.entries(obj)) {
			if (k.startsWith('@_') || k === '#text') continue;
			parts.push(textOf(v));
		}
		return parts.join(' ').replace(/\s+/g, ' ').trim();
	}
	return '';
}

function attr(node: XmlNode | undefined, name: string): string | undefined {
	if (!node) return undefined;
	const v = node[`@_${name}`];
	return typeof v === 'string' ? v : undefined;
}

// ──────────────────────────────────────────────────────────────────────
// Type discrimination
// ──────────────────────────────────────────────────────────────────────

/**
 * Every AKN-shaped document has exactly one root child of <akomaNtoso>:
 * <bill>, <act>, <officialGazette>, etc. Map that element name to our
 * DocumentType union.
 */
const AKN_ROOT_TO_TYPE: Record<string, DocumentType> = {
	bill: 'bill',
	act: 'act',
	amendment: 'amendment',
	judgment: 'judgment',
	officialGazette: 'journal',
	doc: 'doc',
	statement: 'statement',
	debate: 'debate',
	portion: 'portion',
	documentCollection: 'document_collection',
	communication: 'communication',
	question: 'question',
	citation: 'citation',
	changeSet: 'change_set'
};

function inferType(filePath: string, xmlRoot: XmlNode): DocumentType {
	const akn = xmlRoot.akomaNtoso as XmlNode | undefined;
	if (!akn) {
		throw new LoaderError(filePath, 'XML root is not <akomaNtoso>');
	}
	for (const key of Object.keys(akn)) {
		if (key.startsWith('@_') || key === '#text') continue;
		const t = AKN_ROOT_TO_TYPE[key];
		if (t) return t;
	}
	throw new LoaderError(
		filePath,
		`<akomaNtoso> contains no recognized AKN root element (one of: ${Object.keys(AKN_ROOT_TO_TYPE).join(', ')})`
	);
}

// ──────────────────────────────────────────────────────────────────────
// Extractors — XML → projected SQL columns.
// ──────────────────────────────────────────────────────────────────────

function extractTitle(filePath: string, xmlRoot: XmlNode): string {
	const longTitle = findFirst(xmlRoot, 'longTitle');
	if (longTitle) {
		const t = textOf(longTitle);
		if (t) return t;
	}
	const alias = findFirst(xmlRoot, 'FRBRalias');
	if (alias) {
		const v = attr(alias, 'value');
		if (v) return v;
	}
	throw new LoaderError(filePath, 'no <longTitle> or <FRBRalias> found in XML');
}

function extractTopics(xmlRoot: XmlNode): string[] {
	const out: string[] = [];
	for (const k of findAll(xmlRoot, 'keyword')) {
		const showAs = attr(k, 'showAs');
		const value = attr(k, 'value');
		const label = showAs ?? value;
		if (label) out.push(label);
	}
	return out;
}

function extractLanguage(xmlRoot: XmlNode): string {
	const lang = findFirst(xmlRoot, 'FRBRlanguage');
	const code = attr(lang, 'language') ?? 'spa';
	const map: Record<string, string> = {
		spa: 'es',
		eng: 'en',
		fra: 'fr',
		deu: 'de',
		ita: 'it',
		por: 'pt'
	};
	return map[code] ?? code;
}

/**
 * The single "publishedAt" column normalizes per type:
 *   - bill    → submission date
 *   - act     → promulgation date
 *   - journal → issue date
 *   - else    → first <FRBRdate name="generation">
 */
function extractPublishedAt(filePath: string, type: DocumentType, xmlRoot: XmlNode): string {
	if (type === 'bill') {
		const ev = findAll(xmlRoot, 'eventRef').find(
			(e) => attr(e, 'refersTo') === '#submitted'
		);
		const d = attr(ev, 'date');
		if (d) return d;
	}
	if (type === 'act') {
		const ev = findAll(xmlRoot, 'eventRef').find(
			(e) => attr(e, 'refersTo') === '#promulgation'
		);
		const d = attr(ev, 'date');
		if (d) return d;
	}
	if (type === 'journal') {
		const pub = findFirst(xmlRoot, 'publication');
		const d = attr(pub, 'date');
		if (d) return d;
	}
	const work = findFirst(xmlRoot, 'FRBRWork');
	if (work) {
		const dates = findAll(work, 'FRBRdate');
		const gen = dates.find((d) => attr(d, 'name') === 'generation');
		const d = attr(gen ?? dates[0], 'date');
		if (d) return d;
	}
	throw new LoaderError(filePath, `could not extract publishedAt from XML for type ${type}`);
}

function extractEvents(xmlRoot: XmlNode): ExtractedEvent[] {
	const out: ExtractedEvent[] = [];
	const events = findAll(xmlRoot, 'eventRef');
	let seq = 0;
	for (const e of events) {
		const date = attr(e, 'date');
		const refersTo = attr(e, 'refersTo') ?? '';
		const showAs = attr(e, 'showAs') ?? '';
		if (!date) continue;
		seq++;
		out.push({
			sequence: seq,
			occurredAt: date,
			actionType: refersTo.replace(/^#/, ''),
			actionTypeLocal: showAs
		});
	}
	return out;
}

/**
 * Walk every AKN linking element and pull href + relation. This is the
 * heart of v3's "links extracted not authored" rule.
 *
 * Hrefs come in three shapes:
 *   - Internal AKN URIs: `/akn/<country>/<type>/<date>/<nativeId>` —
 *     parsed into (country, type, nativeId) for resolution.
 *   - Anchor refs: `#some-eId` — internal cross-references, not edges.
 *     Skipped at extraction time.
 *   - External http(s) URLs: kept verbatim, left unresolved.
 */
function extractLinks(xmlRoot: XmlNode): ExtractedLink[] {
	const out: ExtractedLink[] = [];

	const visit = (key: string, defaultRelation: string) => {
		for (const n of findAll(xmlRoot, key)) {
			const href = attr(n, 'href') ?? attr(n, 'src');
			if (!href) continue;
			if (href.startsWith('#')) continue;
			const parsed = parseAknHref(href);
			out.push({
				relation: inferRelation(key, defaultRelation),
				href,
				aknElement: key,
				toCountry: parsed?.country,
				toType: parsed?.type,
				toNativeId: parsed?.nativeId
			});
		}
	};

	visit('ref', 'mentions');
	visit('mref', 'mentions');
	visit('rref', 'refers_to');
	visit('passiveRef', 'refers_to');
	visit('componentRef', 'contains');
	visit('authorialNote', 'cites');

	return out;
}

function inferRelation(elementName: string, fallback: string): string {
	switch (elementName) {
		case 'componentRef':
			return 'contains';
		case 'authorialNote':
			return 'cites';
		default:
			return fallback;
	}
}

/**
 * Parse an AKN-style URI: `/akn/<country>/<type>/<date>?/<nativeId>...`
 * Returns undefined for non-AKN hrefs (http URLs, anchors, etc.).
 */
function parseAknHref(
	href: string
): { country: string; type: DocumentType; nativeId: string } | undefined {
	if (!href.startsWith('/akn/')) return undefined;
	const parts = href.replace(/^\/akn\//, '').split('/');
	if (parts.length < 3) return undefined;
	const [country, aknType, third, fourth] = parts;
	const type = AKN_ROOT_TO_TYPE[aknType];
	if (!type) return undefined;
	const dateLike = /^\d{4}-\d{2}-\d{2}$/.test(third);
	const nativeId = dateLike
		? fourth?.split('!')[0]?.split('@')[0]
		: third?.split('!')[0]?.split('@')[0];
	if (!nativeId) return undefined;
	return { country, type, nativeId };
}

// ─── Per-type detail extractors ───────────────────────────────────────

function extractBill(filePath: string, xmlRoot: XmlNode): ParsedDoc['bill'] {
	const work = findFirst(xmlRoot, 'FRBRWork');
	const subtypeNode = work ? findFirst(work, 'FRBRsubtype') : undefined;

	const statusNode = findFirst(xmlRoot, 'billStatus');
	const status = attr(statusNode, 'normalized') ?? 'submitted';
	const statusLocal = textOf(statusNode);

	const submittedEv = findAll(xmlRoot, 'eventRef').find(
		(e) => attr(e, 'refersTo') === '#submitted'
	);
	const submittedAt = attr(submittedEv, 'date');
	if (!submittedAt) {
		throw new LoaderError(filePath, 'bill XML has no eventRef[refersTo="#submitted"]');
	}

	const urgencyNode = findFirst(xmlRoot, 'urgency');
	const urgency = urgencyNode ? textOf(urgencyNode) : undefined;

	const persons = new Map<string, XmlNode>();
	for (const p of findAll(xmlRoot, 'TLCPerson')) {
		const id = attr(p, 'eId');
		if (id) persons.set(id, p);
	}
	const sponsors: ExtractedSponsor[] = [];
	for (const s of findAll(xmlRoot, 'sponsor')) {
		const ref = (attr(s, 'refersTo') ?? '').replace(/^#/, '');
		const person = persons.get(ref);
		if (!person) continue;
		const partyNode = findFirst(person, 'party');
		const chamberNode = findFirst(person, 'chamber');
		sponsors.push({
			name: attr(person, 'showAs') ?? ref,
			externalId: attr(person, 'href') ?? undefined,
			party: partyNode ? textOf(partyNode) : undefined,
			chamber: chamberNode ? textOf(chamberNode) : undefined
		});
	}

	return {
		subtype: attr(subtypeNode, 'value') ?? undefined,
		status,
		statusLocal: statusLocal || status,
		submittedAt,
		urgency,
		sponsors
	};
}

function extractAct(filePath: string, xmlRoot: XmlNode): ParsedDoc['act'] {
	const events = findAll(xmlRoot, 'eventRef');

	const promEv = events.find((e) => attr(e, 'refersTo') === '#promulgation');
	const promulgatedAt = attr(promEv, 'date');
	if (!promulgatedAt) {
		throw new LoaderError(filePath, 'act XML has no eventRef[refersTo="#promulgation"]');
	}

	const effEv = events.find((e) => attr(e, 'refersTo') === '#commencement');
	const repealEv = events.find((e) => attr(e, 'refersTo') === '#repeal');

	const statusNode = findFirst(xmlRoot, 'actStatus');
	const status = attr(statusNode, 'normalized') ?? 'in_force';

	const issuingBodyNode = findFirst(xmlRoot, 'issuingBody');
	const issuingBody = issuingBodyNode ? textOf(issuingBodyNode) : '';

	return {
		status,
		promulgatedAt,
		effectiveAt: attr(effEv, 'date'),
		repealedAt: attr(repealEv, 'date'),
		issuingBody
	};
}

function extractJournal(filePath: string, xmlRoot: XmlNode): ParsedDoc['journal'] {
	const work = findFirst(xmlRoot, 'FRBRWork');
	const numberNode = work ? findFirst(work, 'FRBRnumber') : undefined;
	const issueNumber = attr(numberNode, 'value');
	if (!issueNumber) {
		throw new LoaderError(filePath, 'journal XML has no FRBRWork/FRBRnumber');
	}

	const pub = findFirst(xmlRoot, 'publication');
	const issuedAt = attr(pub, 'date');
	if (!issuedAt) {
		throw new LoaderError(filePath, 'journal XML has no publication[@date]');
	}

	const publisherNode = findFirst(xmlRoot, 'publisher');
	const publisher = publisherNode ? textOf(publisherNode) : '';

	const scopeNode = findFirst(xmlRoot, 'scope');
	const scope = scopeNode ? textOf(scopeNode) : 'national';

	return {
		issueNumber,
		issuedAt,
		publisher,
		scope,
		regionCode: undefined
	};
}

// ─── Prior version files ──────────────────────────────────────────────

/**
 * Read every <akndiff:priorVersion href="..." date="..." version="..."/>
 * declared on the current XML, resolve hrefs relative to the current
 * file, and load the sibling .xml content. The build script writes one
 * row per entry into diff_document_versions.
 */
function extractVersions(filePath: string, xmlRoot: XmlNode): ExtractedVersion[] {
	const out: ExtractedVersion[] = [];
	const decls = findAll(xmlRoot, 'priorVersion');
	const baseDir = dirname(filePath);
	for (const d of decls) {
		const href = attr(d, 'href');
		if (!href) {
			throw new LoaderError(filePath, '<akndiff:priorVersion> missing href');
		}
		const versionStr = attr(d, 'version');
		const date = attr(d, 'date');
		if (!versionStr || !date) {
			throw new LoaderError(
				filePath,
				`<akndiff:priorVersion href="${href}"> needs version + date attributes`
			);
		}
		const versionPath = join(baseDir, href);
		let xml: string;
		try {
			xml = readFileSync(versionPath, 'utf8');
		} catch (err) {
			throw new LoaderError(
				filePath,
				`<akndiff:priorVersion href="${href}"> cannot be read: ${(err as Error).message}`
			);
		}
		// Validate that the sibling parses — we discard the parsed AST,
		// the build only stores the raw string.
		parseXmlOrThrow(filePath, xml, `priorVersion[${href}]`);
		out.push({
			version: Number(versionStr),
			publishedAt: date,
			xml,
			changeNote: attr(d, 'changeNote'),
			sourceUrl: attr(d, 'sourceUrl')
		});
	}
	return out;
}

// ──────────────────────────────────────────────────────────────────────
// Main entrypoint: parse one .xml file into a ParsedDoc.
// ──────────────────────────────────────────────────────────────────────

/**
 * Returns true for files that look like a prior-version sibling
 * (e.g. `ley-21000.v1.xml`). The walker uses this to skip them — they
 * load indirectly via `<akndiff:priorVersion>` declarations on their
 * current-state parent.
 */
export function isPriorVersionFile(filename: string): boolean {
	return /\.v\d+\.xml$/i.test(filename);
}

export function parseDocFile(filePath: string, countryCode: string): ParsedDoc {
	const xml = readFileSync(filePath, 'utf8');
	const xmlRoot = parseXmlOrThrow(filePath, xml, 'root');

	const type = inferType(filePath, xmlRoot);

	const nativeIdNode = findFirst(xmlRoot, 'nativeId');
	const nativeId = requireField(
		filePath,
		nativeIdNode ? textOf(nativeIdNode) : undefined,
		'akndiff:nativeId'
	);

	const sourceUrlNode = findFirst(xmlRoot, 'sourceUrl');
	const sourceUrl = requireField(
		filePath,
		sourceUrlNode ? textOf(sourceUrlNode) : undefined,
		'akndiff:sourceUrl'
	);

	const researchNotesNode = findFirst(xmlRoot, 'researchNotes');
	const researchNotesText = researchNotesNode ? textOf(researchNotesNode).trim() : '';
	const researchNotes = researchNotesText ? researchNotesText : undefined;

	const title = extractTitle(filePath, xmlRoot);
	const language = extractLanguage(xmlRoot);
	const topics = extractTopics(xmlRoot);
	const publishedAt = extractPublishedAt(filePath, type, xmlRoot);

	const versions = extractVersions(filePath, xmlRoot);

	const events = type === 'bill' ? extractEvents(xmlRoot) : [];
	const lastActivityAt =
		[...events].map((e) => e.occurredAt).sort().pop() ??
		(versions.length ? versions[versions.length - 1].publishedAt : publishedAt);

	const links = extractLinks(xmlRoot);

	const doc: ParsedDoc = {
		filePath,
		countryCode,
		type,
		nativeId,
		sourceUrl,
		xml,
		title,
		language,
		topics,
		publishedAt,
		lastActivityAt,
		researchNotes,
		events,
		links,
		versions
	};

	if (type === 'bill') doc.bill = extractBill(filePath, xmlRoot);
	if (type === 'act') doc.act = extractAct(filePath, xmlRoot);
	if (type === 'journal') doc.journal = extractJournal(filePath, xmlRoot);

	return doc;
}

// ──────────────────────────────────────────────────────────────────────
// Fingerprints — cheap and deterministic. Same bytes → same fingerprint.
// Just enough for the schema's NOT NULL constraint.
// ──────────────────────────────────────────────────────────────────────

export function fingerprintOf(input: string): string {
	let h = 0;
	for (let i = 0; i < input.length; i++) {
		h = (h * 31 + input.charCodeAt(i)) | 0;
	}
	return `fp_${(h >>> 0).toString(16)}`;
}
