/**
 * Parse v1-schema.ts into a structured shape we can render.
 *
 * We pull two things out of the source file:
 *   1. The JSDoc block sitting above each `export const FooTable = ...`
 *   2. Each column's JSDoc + drizzle definition inside that block
 *
 * This is intentionally regex-based and a little fragile — the schema file
 * is hand-written and well-structured, and the regex blowing up on a
 * malformed comment is a feature, not a bug. The page surfaces it.
 *
 * If we ever rewrite v1-schema.ts in a way this parser can't handle, the
 * fix is to write the schema differently — not to make this parser
 * smarter. The parser exists to AVOID duplicating prose.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getTableConfig, type SQLiteTable } from 'drizzle-orm/sqlite-core';
import * as schema from '../../../../research/schema/current';

export type ColumnDoc = {
	/** column name in the DB ('country_code') */
	dbName: string;
	/** the TS field name ('countryCode') */
	tsName: string;
	sqlType: string;
	notNull: boolean;
	primary: boolean;
	hasDefault: boolean;
	jsDoc: string | null;
};

export type TableDoc = {
	/** export const name in the source: 'DocumentTable' */
	exportName: string;
	/** db table name: 'diff_documents' */
	dbName: string;
	jsDoc: string | null;
	columns: ColumnDoc[];
	indexes: Array<{ name: string; columns: string[]; unique: boolean }>;
	foreignKeys: Array<{ from: string[]; toTable: string; toColumns: string[]; onDelete?: string }>;
};

const SCHEMA_PATH = join(process.cwd(), 'research', 'schema', 'v1-schema.ts');

/**
 * Strip the leading `/**` ... `* /` markers and the per-line `*` from a
 * JSDoc block, returning clean prose. Preserves blank lines between
 * paragraphs.
 */
function cleanJsDoc(raw: string): string {
	return raw
		.replace(/^\s*\/\*\*/, '')
		.replace(/\*\/\s*$/, '')
		.split('\n')
		.map((l) => l.replace(/^\s*\*\s?/, ''))
		.join('\n')
		.trim();
}

/**
 * Find the JSDoc immediately preceding the position `idx` in `src`.
 * Returns the cleaned prose, or null if there isn't one.
 */
function jsDocBefore(src: string, idx: number): string | null {
	// Walk backwards over whitespace
	let i = idx - 1;
	while (i > 0 && /\s/.test(src[i])) i--;
	// Must end with */
	if (src[i] !== '/' || src[i - 1] !== '*') return null;
	// Walk back to opening /**
	const end = i + 1;
	let start = src.lastIndexOf('/**', end);
	if (start < 0) return null;
	const block = src.slice(start, end);
	return cleanJsDoc(block);
}

/**
 * Index every column's source position so we can attach inline JSDoc.
 * We look for the literal column name as a TS identifier `colName: ...`
 * inside the table block. Good enough for the well-formed schema.
 */
function findColumnJsDocs(
	src: string,
	tableStart: number,
	tableEnd: number,
	tsNames: string[]
): Map<string, string> {
	const result = new Map<string, string>();
	const block = src.slice(tableStart, tableEnd);
	for (const name of tsNames) {
		// Match `<name>: ` at start of trimmed line
		const re = new RegExp(`(^|\\n)\\s*${name}\\s*:\\s*`, 'g');
		const m = re.exec(block);
		if (!m) continue;
		const absoluteIdx = tableStart + m.index + m[1].length;
		const doc = jsDocBefore(src, absoluteIdx);
		if (doc) result.set(name, doc);
	}
	return result;
}

let _cache: TableDoc[] | null = null;

export function loadSchemaDocs(): TableDoc[] {
	if (_cache) return _cache;

	const src = readFileSync(SCHEMA_PATH, 'utf8');

	const tableExports = Object.entries(schema).filter(
		([, v]) => typeof v === 'object' && v !== null && Symbol.for('drizzle:Name') in (v as object)
	) as Array<[string, SQLiteTable]>;

	const docs: TableDoc[] = tableExports.map(([exportName, table]) => {
		const cfg = getTableConfig(table);

		// Find table-level JSDoc by locating `export const <exportName> = ` in source.
		const declMatch = src.indexOf(`export const ${exportName}`);
		const tableJsDoc = declMatch >= 0 ? jsDocBefore(src, declMatch) : null;

		// Find the table block range (rough — from the export to the next
		// `export const ` or end of file). Used to scope column-JSDoc lookup.
		const nextExport = src.indexOf('export const ', declMatch + 1);
		const tableEnd = nextExport >= 0 ? nextExport : src.length;

		// Map drizzle's DB column names back to the TS field names used in
		// the source (which is what the JSDoc sits next to).
		const tsNameByDbName = new Map<string, string>();
		for (const [tsName, col] of Object.entries(table) as Array<[string, unknown]>) {
			if (col && typeof col === 'object' && 'name' in (col as object)) {
				tsNameByDbName.set((col as { name: string }).name, tsName);
			}
		}
		const columnDocs = findColumnJsDocs(
			src,
			declMatch,
			tableEnd,
			[...tsNameByDbName.values()]
		);

		const columns: ColumnDoc[] = cfg.columns.map((c) => {
			const tsName = tsNameByDbName.get(c.name) ?? c.name;
			return {
				dbName: c.name,
				tsName,
				sqlType: c.getSQLType(),
				notNull: c.notNull,
				primary: c.primary,
				hasDefault: c.hasDefault,
				jsDoc: columnDocs.get(tsName) ?? null
			};
		});

		const indexes = cfg.indexes.map((idx) => {
			const cfgI = idx.config;
			return {
				name: cfgI.name,
				columns: cfgI.columns.map((c) => (c as { name: string }).name),
				unique: !!cfgI.unique
			};
		});

		const foreignKeys = cfg.foreignKeys.map((fk) => {
			const r = fk.reference();
			return {
				from: r.columns.map((c) => c.name),
				toTable: getTableConfig(r.foreignTable).name,
				toColumns: r.foreignColumns.map((c) => c.name),
				onDelete: fk.onDelete
			};
		});

		return {
			exportName,
			dbName: cfg.name,
			jsDoc: tableJsDoc,
			columns,
			indexes,
			foreignKeys
		};
	});

	_cache = docs;
	return docs;
}

/**
 * The grouping we use to render the page. Order matters — top-down
 * teaches the schema in the right order: identity → graph → details.
 */
export const TABLE_GROUPS: Array<{ title: string; intent: string; tables: string[] }> = [
	{
		title: 'Core',
		intent:
			'Every document, regardless of country or type, has one row in DocumentTable. This is the spine of the schema — links and details all hang off it.',
		tables: ['CountryTable', 'DocumentTable', 'DocumentVersionTable']
	},
	{
		title: 'Graph',
		intent:
			'Typed links between documents. The whole "navigate the parliament like the web" idea, stored as relational rows. Every edge is one row here.',
		tables: ['DocumentLinkTable']
	},
	{
		title: 'Per-type details — primary',
		intent:
			'One detail table per document type. The detail row is keyed BY the document_id (1:1 with cascade delete). Holds only the fields specific to that type — anything generic stays on DocumentTable.',
		tables: ['BillTable', 'BillEventTable', 'ActTable', 'AmendmentTable', 'JournalTable']
	},
	{
		title: 'Per-type details — secondary',
		intent:
			'Lighter-weight types we mirror so the graph is complete end-to-end. Some are skeletons — they grow as the experiment surfaces real data.',
		tables: [
			'JudgmentTable',
			'DocumentCollectionTable',
			'QuestionTable',
			'CommunicationTable',
			'DebateTable',
			'CitationTable',
			'StatementTable',
			'PortionTable',
			'GenericDocTable'
		]
	},
	{
		title: 'AKN Diff (exploratory)',
		intent:
			'The redline / changeSet extension from the Jan 31 entry. Schema-only for now — Phase 1 doesn\'t populate these.',
		tables: ['ChangeSetTable', 'ArticleChangeTable']
	}
];
