/**
 * YAML → row mapping for the v3 research schema.
 *
 * v3 inverts v2: the AKN XML is the source of truth, SQL columns are
 * a derived index. The YAML on disk is a thin wrapper carrying:
 *   - identity / plumbing the build script needs without parsing
 *     (`type`, `nativeId`, `sourceUrl`)
 *   - the canonical AKN XML under `xml:`
 *   - an optional `versions:` array, each with its own `xml:`
 *
 * EVERYTHING ELSE (title, status, sponsors, events, links, dates) is
 * extracted from the XML by this loader. If the XML disagrees with
 * any column we extract, the XML wins — the column is regenerated.
 *
 * Validation is "throw on mismatch". The entrypoint (build.ts) catches
 * and prints the file path + reason. We do NOT validate against OASIS
 * AKN XSDs in this rig — the corpus is small enough that misshapen
 * XML is caught by extraction failing loudly. XSD validation is a
 * later pass.
 */

import { readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
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

	// from the YAML wrapper (plumbing)
	type: DocumentType;
	nativeId: string;
	sourceUrl: string;

	// the source of truth
	xml: string;

	// extracted from the current XML
	title: string;
	language: string;
	topics: string[];
	publishedAt: string;
	lastActivityAt: string;

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
 * Date strings → epoch ms. Accepts 'YYYY-MM-DD' (treated as UTC midnight)
 * and full ISO strings. We don't try to be clever about timezones; the
 * experiment doesn't need it.
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

const KNOWN_TYPES: ReadonlySet<DocumentType> = new Set([
	'bill',
	'act',
	'amendment',
	'judgment',
	'journal',
	'document_collection',
	'question',
	'communication',
	'debate',
	'citation',
	'change_set',
	'statement',
	'portion',
	'doc'
]);

// ──────────────────────────────────────────────────────────────────────
// XML parser config — fast-xml-parser, namespace-stripped.
// ──────────────────────────────────────────────────────────────────────
//
// We parse with `removeNSPrefix: true`. AKN core and `akndiff:` elements
// look identical to the extractor afterwards, which is what we want:
// `<keyword>` and `<akndiff:keyword>` would both surface as `keyword`.
// We don't currently rely on this collision, but it keeps the extractor
// simple. If the corpus grows enough that we need to disambiguate, we
// flip `removeNSPrefix` off and key by the full prefixed name.

const xmlParser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '@_',
	removeNSPrefix: true,
	// Force these elements to always be arrays even when there's only
	// one — saves the extractor from sprinkling `Array.isArray()`
	// everywhere.
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

/** Walk an XML tree and collect every node where `pred` returns true. */
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
			if (Array.isArray(v)) return v[0] as XmlNode;
			if (typeof v === 'object' && v !== null) return v as XmlNode;
		}
	}
	return undefined;
}

function findAll(root: unknown, key: string): XmlNode[] {
	const out: XmlNode[] = [];
	for (const n of walk(root)) {
		if (key in n) {
			const v = n[key];
			if (Array.isArray(v)) out.push(...(v as XmlNode[]));
			else if (typeof v === 'object' && v !== null) out.push(v as XmlNode);
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
// Extractors — XML → projected SQL columns.
// ──────────────────────────────────────────────────────────────────────

/**
 * Pull the document title. AKN puts it in `<longTitle><p>...</p></longTitle>`
 * inside `<preface>`. Fall back to the first `<FRBRalias>` if missing.
 */
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
	// AKN uses ISO 639-3 ('spa'); the rest of our system uses ISO 639-1 ('es').
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
 * The single "publishedAt" column on DocumentTable normalizes per type:
 *   - bill → submission date
 *   - act → promulgation date
 *   - journal → issue date
 *   - else → first FRBRdate name="generation"
 */
function extractPublishedAt(filePath: string, type: DocumentType, xmlRoot: XmlNode): string {
	if (type === 'bill') {
		const ev = findAll(xmlRoot, 'eventRef').find((e) => attr(e, 'refersTo') === '#submitted');
		if (ev) {
			const d = attr(ev, 'date');
			if (d) return d;
		}
	}
	if (type === 'act') {
		const ev = findAll(xmlRoot, 'eventRef').find((e) => attr(e, 'refersTo') === '#promulgation');
		if (ev) {
			const d = attr(ev, 'date');
			if (d) return d;
		}
	}
	if (type === 'journal') {
		const pub = findFirst(xmlRoot, 'publication');
		const d = attr(pub, 'date');
		if (d) return d;
	}
	// Generic fallback: first <FRBRdate name="generation"> under FRBRWork.
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
 * Hrefs come in two shapes here:
 *
 *   Internal AKN URIs: `/akn/<country>/<type>/<date>/<nativeId>` — we
 *   parse out (country, type, nativeId) so the build script can resolve
 *   to a real document id during the second pass.
 *
 *   Anchor refs: `#some-eId` — internal cross-references, not edges to
 *   other documents. Skipped at extraction time.
 *
 *   External http(s) URLs: kept verbatim on the row but left
 *   unresolved.
 */
function extractLinks(xmlRoot: XmlNode): ExtractedLink[] {
	const out: ExtractedLink[] = [];

	const visit = (key: string, defaultRelation: string) => {
		for (const n of findAll(xmlRoot, key)) {
			const href = attr(n, 'href') ?? attr(n, 'src');
			if (!href) continue;
			if (href.startsWith('#')) continue; // internal anchor
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

	// Promotion: a bill's body containing a <ref> to an act is normally
	// a `mentions`. But if the AKN proprietary block declares the bill
	// amends an act, prefer 'amends' for that target. We don't have
	// that explicit element yet; left as a future extractor refinement.
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
	const aknToType: Record<string, DocumentType> = {
		bill: 'bill',
		act: 'act',
		amendment: 'amendment',
		judgment: 'judgment',
		officialGazette: 'journal',
		journal: 'journal',
		statement: 'statement',
		debate: 'debate',
		doc: 'doc',
		portion: 'portion',
		documentCollection: 'document_collection',
		communication: 'communication',
		question: 'question',
		citation: 'citation',
		changeSet: 'change_set'
	};
	const type = aknToType[aknType];
	if (!type) return undefined;
	// AKN URIs typically encode date before the work id:
	// /akn/cl/act/2018-03-15/ley-21000  → nativeId = 'ley-21000'
	// /akn/cl/journal/DO-2026-01-15     → nativeId = 'DO-2026-01-15' (no date)
	const dateLike = /^\d{4}-\d{2}-\d{2}$/.test(third);
	const nativeId = dateLike ? fourth?.split('!')[0]?.split('@')[0] : third?.split('!')[0]?.split('@')[0];
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

	// Sponsors: <akndiff:sponsor refersTo="#dip-perez"/> + the matching
	// <TLCPerson eId="dip-perez" showAs="Diputada Pérez">...</TLCPerson>.
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

// ──────────────────────────────────────────────────────────────────────
// Main entrypoint: parse one YAML file into a ParsedDoc.
// ──────────────────────────────────────────────────────────────────────

export function parseDocFile(filePath: string, countryCode: string): ParsedDoc {
	const raw = readFileSync(filePath, 'utf8');
	let parsed: Record<string, unknown>;
	try {
		parsed = parseYaml(raw) as Record<string, unknown>;
	} catch (err) {
		throw new LoaderError(filePath, `YAML parse error: ${(err as Error).message}`);
	}
	if (!parsed || typeof parsed !== 'object') {
		throw new LoaderError(filePath, 'top-level YAML is not an object');
	}

	const type = requireField(filePath, parsed.type as DocumentType, 'type');
	if (!KNOWN_TYPES.has(type)) {
		throw new LoaderError(
			filePath,
			`unknown type '${type}'. Known: ${[...KNOWN_TYPES].join(', ')}`
		);
	}
	const nativeId = requireField(filePath, parsed.nativeId as string, 'nativeId');
	const sourceUrl = requireField(filePath, parsed.sourceUrl as string, 'sourceUrl');
	const xml = requireField(filePath, parsed.xml as string, 'xml');

	const xmlRoot = parseXmlOrThrow(filePath, xml, 'xml');

	const title = extractTitle(filePath, xmlRoot);
	const language = extractLanguage(xmlRoot);
	const topics = extractTopics(xmlRoot);
	const publishedAt = extractPublishedAt(filePath, type, xmlRoot);

	const versions: ExtractedVersion[] = [];
	if (Array.isArray(parsed.versions)) {
		for (const v of parsed.versions as Array<Record<string, unknown>>) {
			const vXml = requireField(filePath, v.xml as string, 'versions[].xml');
			parseXmlOrThrow(filePath, vXml, 'versions[].xml'); // validate parses
			versions.push({
				version: requireField(filePath, v.version as number, 'versions[].version'),
				publishedAt: requireField(
					filePath,
					v.publishedAt as string,
					'versions[].publishedAt'
				),
				xml: vXml,
				changeNote: (v.changeNote as string) ?? undefined,
				sourceUrl: (v.sourceUrl as string) ?? undefined
			});
		}
	}

	// lastActivityAt: latest event date if any, else publishedAt.
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
// Fingerprints — cheap and deterministic. In v3 we hash the canonical
// XML directly: same bytes → same fingerprint. Just enough for the
// schema's NOT NULL constraint.
// ──────────────────────────────────────────────────────────────────────

export function fingerprintOf(input: string): string {
	let h = 0;
	for (let i = 0; i < input.length; i++) {
		h = (h * 31 + input.charCodeAt(i)) | 0;
	}
	return `fp_${(h >>> 0).toString(16)}`;
}
