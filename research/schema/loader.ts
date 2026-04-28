/**
 * YAML → row mapping for the research schema build.
 *
 * Every public function here is "best-effort, throw-on-mismatch". The
 * entrypoint (build.ts) catches and prints the file path + reason.
 *
 * NOTE: validation is hand-rolled for now. If this gets painful as the
 * schema grows, lift to Zod (one schema per document type).
 */

import { readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import type { DocumentType } from './current';

// ──────────────────────────────────────────────────────────────────────
// File-shape types — what we expect a YAML file to look like AFTER parse.
// Mirror the schema, but loose: extra keys are tolerated and forwarded
// into countrySpecific so contributors can experiment freely.
// ──────────────────────────────────────────────────────────────────────

export type LinkRef = {
	relation: string;
	toCountry: string;
	toType: DocumentType;
	toNativeId: string;
	ordinal?: number;
	source?: string;
	confidence?: number;
	details?: Record<string, unknown>;
};

export type ParsedDoc = {
	// path-derived
	filePath: string;
	countryCode: string;

	// shared (DocumentTable)
	type: DocumentType;
	nativeId: string;
	title: string;
	language?: string;
	sourceUrl?: string;
	publishedAt: string;
	lastActivityAt?: string;
	topics?: string[];
	body?: Record<string, unknown>;
	countrySpecific?: Record<string, unknown>;

	// type-specific block, raw — interpreted per type below
	bill?: Record<string, unknown>;
	act?: Record<string, unknown>;
	journal?: Record<string, unknown>;
	amendment?: Record<string, unknown>;
	judgment?: Record<string, unknown>;
	question?: Record<string, unknown>;
	communication?: Record<string, unknown>;
	debate?: Record<string, unknown>;
	citation?: Record<string, unknown>;
	statement?: Record<string, unknown>;
	portion?: Record<string, unknown>;
	doc?: Record<string, unknown>;
	change_set?: Record<string, unknown>;
	document_collection?: Record<string, unknown>;

	// inline sub-collections
	events?: Array<Record<string, unknown>>;
	versions?: Array<Record<string, unknown>>;
	links?: LinkRef[];
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

function require<T>(filePath: string, value: T | null | undefined, name: string): T {
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
		// 'YYYY-MM-DD' — pin to UTC midnight so all hosts agree.
		if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
			return Date.parse(value + 'T00:00:00Z');
		}
		const ms = Date.parse(value);
		if (!Number.isNaN(ms)) return ms;
	}
	throw new LoaderError(filePath, `field '${name}' is not a valid date: ${JSON.stringify(value)}`);
}

// ──────────────────────────────────────────────────────────────────────
// Parse one YAML file into a ParsedDoc shape, given its path.
// ──────────────────────────────────────────────────────────────────────

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

	const type = require(filePath, parsed.type as DocumentType, 'type');
	if (!KNOWN_TYPES.has(type)) {
		throw new LoaderError(
			filePath,
			`unknown type '${type}'. Known: ${[...KNOWN_TYPES].join(', ')}`
		);
	}

	return {
		filePath,
		countryCode,
		type,
		nativeId: require(filePath, parsed.nativeId as string, 'nativeId'),
		title: require(filePath, parsed.title as string, 'title'),
		language: (parsed.language as string) ?? 'es',
		sourceUrl: parsed.sourceUrl as string | undefined,
		publishedAt: require(filePath, parsed.publishedAt as string, 'publishedAt'),
		lastActivityAt: parsed.lastActivityAt as string | undefined,
		topics: (parsed.topics as string[]) ?? [],
		body: (parsed.body as Record<string, unknown>) ?? {},
		countrySpecific: (parsed.countrySpecific as Record<string, unknown>) ?? {},

		bill: parsed.bill as Record<string, unknown> | undefined,
		act: parsed.act as Record<string, unknown> | undefined,
		journal: parsed.journal as Record<string, unknown> | undefined,
		amendment: parsed.amendment as Record<string, unknown> | undefined,
		judgment: parsed.judgment as Record<string, unknown> | undefined,
		question: parsed.question as Record<string, unknown> | undefined,
		communication: parsed.communication as Record<string, unknown> | undefined,
		debate: parsed.debate as Record<string, unknown> | undefined,
		citation: parsed.citation as Record<string, unknown> | undefined,
		statement: parsed.statement as Record<string, unknown> | undefined,
		portion: parsed.portion as Record<string, unknown> | undefined,
		doc: parsed.doc as Record<string, unknown> | undefined,
		change_set: parsed.change_set as Record<string, unknown> | undefined,
		document_collection: parsed.document_collection as Record<string, unknown> | undefined,

		events: parsed.events as Array<Record<string, unknown>> | undefined,
		versions: parsed.versions as Array<Record<string, unknown>> | undefined,
		links: parsed.links as LinkRef[] | undefined
	};
}

// ──────────────────────────────────────────────────────────────────────
// Fingerprints — cheap and deterministic. Just enough for the schema's
// NOT NULL constraint; not cryptographically meaningful for this rig.
// ──────────────────────────────────────────────────────────────────────

export function fingerprintOf(input: unknown): string {
	const s = JSON.stringify(input);
	let h = 0;
	for (let i = 0; i < s.length; i++) {
		h = (h * 31 + s.charCodeAt(i)) | 0;
	}
	return `fp_${(h >>> 0).toString(16)}`;
}
