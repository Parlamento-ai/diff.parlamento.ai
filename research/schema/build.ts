#!/usr/bin/env tsx
/**
 * build.ts — rebuild the research SQLite db from the YAML corpus.
 *
 * Usage:
 *   npm run research:build
 *
 * v3 round trip:
 *   1. Wipe research.db.
 *   2. Recreate every table from the current schema.
 *   3. Walk data/<country>/<type>/*.yaml in dependency order. For each
 *      file: parse YAML wrapper, parse + extract from the AKN XML,
 *      insert the document row + the type-specific detail row + any
 *      version rows + (for bills) any extracted events.
 *   4. Resolve cross-document links in a second pass — the loader
 *      pulled hrefs out of every <ref>/<componentRef>/etc., here we
 *      look them up by (country, type, nativeId) and write rows.
 *   5. Print a summary.
 *
 * Failure mode: print the offending file path + reason, then exit
 * non-zero. No "best effort" loading.
 */

import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { getTableConfig, type SQLiteTable } from 'drizzle-orm/sqlite-core';

import * as schema from './current';
import {
	fingerprintOf,
	LoaderError,
	parseDocFile,
	toEpochMs,
	type ExtractedLink,
	type ParsedDoc
} from './loader';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(HERE, 'data');
const DB_PATH = join(HERE, 'research.db');

// ──────────────────────────────────────────────────────────────────────
// Tiny logger — color-friendly, terse.
// ──────────────────────────────────────────────────────────────────────

const C = {
	dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
	red: (s: string) => `\x1b[31m${s}\x1b[0m`,
	green: (s: string) => `\x1b[32m${s}\x1b[0m`,
	yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
	cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
	bold: (s: string) => `\x1b[1m${s}\x1b[0m`
};

function logStep(msg: string) {
	console.log(C.cyan('▸ ') + msg);
}

function logOk(tag: string, file: string, detail: string) {
	console.log(`${C.green('✓')} ${C.dim(`[${tag}]`)} ${file} ${C.dim('—')} ${detail}`);
}

function logFail(tag: string, file: string, reason: string) {
	console.log(`${C.red('✗')} ${C.dim(`[${tag}]`)} ${file}`);
	for (const line of reason.split('\n')) {
		console.log(`    ${C.red(line)}`);
	}
}

function logWarn(msg: string) {
	console.log(`${C.yellow('!')} ${msg}`);
}

// ──────────────────────────────────────────────────────────────────────
// 1. Wipe + open the DB, create every table.
// ──────────────────────────────────────────────────────────────────────

function wipeAndOpen() {
	if (existsSync(DB_PATH)) {
		rmSync(DB_PATH);
		logStep(`Wiped ${C.dim(relative(process.cwd(), DB_PATH))}`);
	}
	const sqlite = new Database(DB_PATH);
	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('foreign_keys = ON');
	return { sqlite, db: drizzle(sqlite, { schema }) };
}

/**
 * Drizzle on SQLite has no built-in "create all tables from schema" —
 * normally you'd run drizzle-kit migrations. For this research rig the
 * schema is small and we don't care about migrations (we wipe every
 * build), so we generate CREATE TABLE statements directly from the
 * Drizzle metadata.
 */
function createAllTables(sqlite: Database.Database) {
	const tables = Object.values(schema).filter(
		(v): v is SQLiteTable =>
			typeof v === 'object' && v !== null && Symbol.for('drizzle:Name') in (v as object)
	);

	for (const table of tables) {
		const cfg = getTableConfig(table);
		const colDefs = cfg.columns
			.map((c) => {
				const parts: string[] = [`"${c.name}"`];
				parts.push(c.getSQLType());
				if (c.notNull) parts.push('NOT NULL');
				if (c.primary) parts.push('PRIMARY KEY');
				if (c.hasDefault && c.default !== undefined) {
					const d = c.default;
					if (typeof d === 'string') parts.push(`DEFAULT '${d.replace(/'/g, "''")}'`);
					else if (typeof d === 'number' || typeof d === 'boolean')
						parts.push(`DEFAULT ${Number(d)}`);
				}
				return '  ' + parts.join(' ');
			})
			.join(',\n');

		const fkDefs = cfg.foreignKeys
			.map((fk) => {
				const r = fk.reference();
				const cols = r.columns.map((c) => `"${c.name}"`).join(', ');
				const refCols = r.foreignColumns.map((c) => `"${c.name}"`).join(', ');
				const refTable = getTableConfig(r.foreignTable).name;
				const onDelete = fk.onDelete ? ` ON DELETE ${fk.onDelete.toUpperCase()}` : '';
				return `  FOREIGN KEY (${cols}) REFERENCES "${refTable}"(${refCols})${onDelete}`;
			})
			.join(',\n');

		const all = [colDefs, fkDefs].filter(Boolean).join(',\n');
		const sql = `CREATE TABLE "${cfg.name}" (\n${all}\n)`;
		sqlite.exec(sql);

		for (const idx of cfg.indexes) {
			const idxCfg = idx.config;
			const idxCols = idxCfg.columns.map((c) => `"${(c as { name: string }).name}"`).join(', ');
			const unique = idxCfg.unique ? 'UNIQUE ' : '';
			sqlite.exec(`CREATE ${unique}INDEX "${idxCfg.name}" ON "${cfg.name}" (${idxCols})`);
		}
	}
	logStep(`Created ${tables.length} tables`);
}

// ──────────────────────────────────────────────────────────────────────
// 2. Walk data/ and parse every YAML file (no inserts yet).
// ──────────────────────────────────────────────────────────────────────

function walkCorpus(): { docs: ParsedDoc[]; countries: string[] } {
	if (!existsSync(DATA_DIR)) {
		logWarn(`No data/ directory at ${DATA_DIR} — nothing to load`);
		return { docs: [], countries: [] };
	}

	const countries = readdirSync(DATA_DIR).filter((entry) =>
		statSync(join(DATA_DIR, entry)).isDirectory()
	);

	const docs: ParsedDoc[] = [];
	for (const country of countries) {
		const countryDir = join(DATA_DIR, country);
		const types = readdirSync(countryDir).filter((entry) =>
			statSync(join(countryDir, entry)).isDirectory()
		);
		for (const typeDir of types) {
			const dir = join(countryDir, typeDir);
			const files = readdirSync(dir).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));
			for (const file of files) {
				docs.push(parseDocFile(join(dir, file), country));
			}
		}
	}
	return { docs, countries };
}

// ──────────────────────────────────────────────────────────────────────
// 3. Insert in dependency order:
//      countries → documents (+ details, versions, events) → links
// ──────────────────────────────────────────────────────────────────────

type Db = ReturnType<typeof drizzle>;

function seedCountries(db: Db, countries: string[]) {
	const meta: Record<string, { name: string; tz: string; hasRegions: boolean }> = {
		cl: { name: 'Chile', tz: 'America/Santiago', hasRegions: false },
		es: { name: 'España', tz: 'Europe/Madrid', hasRegions: true },
		eu: { name: 'European Union', tz: 'Europe/Brussels', hasRegions: true },
		pe: { name: 'Perú', tz: 'America/Lima', hasRegions: false },
		us: { name: 'United States', tz: 'America/New_York', hasRegions: true }
	};
	for (const code of countries) {
		const m = meta[code] ?? { name: code.toUpperCase(), tz: 'UTC', hasRegions: false };
		db.insert(schema.CountryTable)
			.values({
				code,
				name: m.name,
				defaultTimezone: m.tz,
				hasRegions: m.hasRegions
			})
			.run();
	}
	logStep(`Seeded ${countries.length} countries: ${countries.join(', ')}`);
}

/**
 * Per-doc map for link resolution: (country, type, nativeId) → uuid.
 */
type DocKey = string;
const docKey = (country: string, type: string, nativeId: string): DocKey =>
	`${country}::${type}::${nativeId}`;

function insertDocument(db: Db, doc: ParsedDoc): string {
	const id = crypto.randomUUID();
	const publishedAt = toEpochMs(doc.filePath, 'publishedAt', doc.publishedAt);
	const lastActivityAt = toEpochMs(doc.filePath, 'lastActivityAt', doc.lastActivityAt);

	db.insert(schema.DocumentTable)
		.values({
			id,
			type: doc.type,
			countryCode: doc.countryCode,
			nativeId: doc.nativeId,
			xml: doc.xml,
			title: doc.title,
			topics: doc.topics,
			language: doc.language,
			sourceUrl: doc.sourceUrl,
			scrapingId: `research:${doc.countryCode}:${doc.type}:${doc.nativeId}`,
			fingerprint: fingerprintOf(doc.xml),
			publishedAt: new Date(publishedAt),
			lastActivityAt: new Date(lastActivityAt)
		})
		.run();
	return id;
}

function insertDetail(db: Db, doc: ParsedDoc, documentId: string) {
	switch (doc.type) {
		case 'bill': {
			if (!doc.bill) return;
			db.insert(schema.BillTable)
				.values({
					documentId,
					subtype: doc.bill.subtype ?? null,
					status: doc.bill.status as 'submitted',
					statusLocal: doc.bill.statusLocal,
					submittedAt: new Date(toEpochMs(doc.filePath, 'bill.submittedAt', doc.bill.submittedAt)),
					sponsors: doc.bill.sponsors,
					urgency: doc.bill.urgency ?? null
				})
				.run();
			return;
		}
		case 'act': {
			if (!doc.act) return;
			db.insert(schema.ActTable)
				.values({
					documentId,
					status: doc.act.status as 'in_force',
					promulgatedAt: new Date(
						toEpochMs(doc.filePath, 'act.promulgatedAt', doc.act.promulgatedAt)
					),
					effectiveAt: doc.act.effectiveAt
						? new Date(toEpochMs(doc.filePath, 'act.effectiveAt', doc.act.effectiveAt))
						: null,
					repealedAt: doc.act.repealedAt
						? new Date(toEpochMs(doc.filePath, 'act.repealedAt', doc.act.repealedAt))
						: null,
					issuingBody: doc.act.issuingBody
				})
				.run();
			return;
		}
		case 'journal': {
			if (!doc.journal) return;
			db.insert(schema.JournalTable)
				.values({
					documentId,
					issueNumber: doc.journal.issueNumber,
					issuedAt: new Date(toEpochMs(doc.filePath, 'journal.issuedAt', doc.journal.issuedAt)),
					publisher: doc.journal.publisher,
					scope: doc.journal.scope,
					regionCode: doc.journal.regionCode ?? null
				})
				.run();
			return;
		}
		// Other types: no detail insert yet — they'll grow as Phase 1 needs them.
		default:
			return;
	}
}

function insertVersions(db: Db, doc: ParsedDoc, documentId: string): number {
	if (!doc.versions.length) return 0;
	for (const v of doc.versions) {
		db.insert(schema.DocumentVersionTable)
			.values({
				documentId,
				version: v.version,
				publishedAt: new Date(toEpochMs(doc.filePath, 'version.publishedAt', v.publishedAt)),
				xml: v.xml,
				schemaVersion: schema.SCHEMA_VERSION,
				changeNote: v.changeNote ?? null,
				documentType: doc.type,
				sourceUrl: v.sourceUrl ?? null,
				storageUrl: null,
				extractedText: null,
				mimeType: 'application/akn+xml',
				fingerprint: fingerprintOf(v.xml)
			})
			.run();
	}
	return doc.versions.length;
}

function insertEvents(db: Db, doc: ParsedDoc, documentId: string): number {
	if (doc.type !== 'bill' || !doc.events.length) return 0;
	for (const e of doc.events) {
		db.insert(schema.BillEventTable)
			.values({
				billId: documentId,
				sequence: e.sequence,
				occurredAt: new Date(toEpochMs(doc.filePath, 'event.occurredAt', e.occurredAt)),
				actionType: e.actionType,
				actionTypeLocal: e.actionTypeLocal,
				chamber: e.chamber ?? null,
				details: {}
			})
			.run();
	}
	return doc.events.length;
}

type LinkOutcome =
	| { ok: true; toId: string }
	| { ok: false; reason: 'unresolved' | 'external' | 'no-target' };

function resolveLink(link: ExtractedLink, idIndex: Map<DocKey, string>): LinkOutcome {
	if (!link.toCountry || !link.toType || !link.toNativeId) {
		// External URL or non-AKN href — kept on the row but unresolved.
		// Not an error.
		return { ok: false, reason: 'external' };
	}
	const toId = idIndex.get(docKey(link.toCountry, link.toType, link.toNativeId));
	if (!toId) return { ok: false, reason: 'unresolved' };
	return { ok: true, toId };
}

function resolveLinks(
	db: Db,
	docs: Array<{ doc: ParsedDoc; id: string }>,
	idIndex: Map<DocKey, string>
): { ok: number; skipped: number; bad: Array<{ doc: ParsedDoc; link: ExtractedLink }> } {
	let ok = 0;
	let skipped = 0;
	const bad: Array<{ doc: ParsedDoc; link: ExtractedLink }> = [];
	for (const { doc, id: fromId } of docs) {
		// De-dupe identical (relation, toId) edges within one source doc —
		// the same href can appear multiple times in one XML and we only
		// want one active row per edge.
		const seen = new Set<string>();
		for (const link of doc.links) {
			const outcome = resolveLink(link, idIndex);
			if (!outcome.ok) {
				if (outcome.reason === 'external') {
					skipped++;
					continue;
				}
				bad.push({ doc, link });
				continue;
			}
			const dedupeKey = `${link.relation}::${outcome.toId}`;
			if (seen.has(dedupeKey)) continue;
			seen.add(dedupeKey);
			db.insert(schema.DocumentLinkTable)
				.values({
					fromId,
					toId: outcome.toId,
					relation: link.relation as 'amends',
					aknElement: link.aknElement,
					href: link.href,
					ordinal: link.ordinal ?? null,
					source: 'extracted',
					confidence: null,
					details: {}
				})
				.run();
			ok++;
		}
	}
	return { ok, skipped, bad };
}

// ──────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────

async function main() {
	console.log(C.bold('\nRebuilding research.db from YAML corpus (v3 schema)\n'));

	const { sqlite, db } = wipeAndOpen();
	try {
		createAllTables(sqlite);

		const { docs, countries } = walkCorpus();
		if (countries.length === 0) {
			logWarn('No documents to load. Done.');
			return;
		}

		seedCountries(db, countries);

		const inserted: Array<{ doc: ParsedDoc; id: string }> = [];
		const idIndex = new Map<DocKey, string>();

		// Insert order across types: acts and journals first (so bills can
		// link to them in the second pass without forward-reference fuss),
		// then everything else. The link resolver is a separate pass anyway,
		// so this ordering only matters for type-specific FK columns.
		const TYPE_ORDER: ParsedDoc['type'][] = [
			'act',
			'journal',
			'bill',
			'amendment',
			'judgment',
			'document_collection',
			'question',
			'communication',
			'debate',
			'citation',
			'change_set',
			'statement',
			'portion',
			'doc'
		];
		const sorted = [...docs].sort(
			(a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type)
		);

		for (const doc of sorted) {
			const tag = `${doc.countryCode}/${doc.type}s`;
			const file = relative(DATA_DIR, doc.filePath);
			try {
				const id = insertDocument(db, doc);
				insertDetail(db, doc, id);
				const nVersions = insertVersions(db, doc, id);
				const nEvents = insertEvents(db, doc, id);
				const nLinks = doc.links.length;

				idIndex.set(docKey(doc.countryCode, doc.type, doc.nativeId), id);
				inserted.push({ doc, id });

				const detail = [
					`"${doc.title.length > 60 ? doc.title.slice(0, 57) + '…' : doc.title}"`,
					nEvents ? `${nEvents} events` : null,
					nVersions ? `${nVersions} versions` : null,
					nLinks ? `${nLinks} links` : null
				]
					.filter(Boolean)
					.join(', ');
				logOk(tag, file, detail);
			} catch (err) {
				if (err instanceof LoaderError) {
					logFail(tag, file, err.reason);
				} else {
					logFail(tag, file, (err as Error).stack ?? (err as Error).message);
				}
				process.exitCode = 1;
				return;
			}
		}

		// Pass 2 — links.
		console.log('');
		logStep('Resolving cross-document links from extracted <ref> elements');
		const { ok, skipped, bad } = resolveLinks(db, inserted, idIndex);
		console.log(`  ${C.green(`✓ ${ok} links resolved`)}`);
		if (skipped) {
			console.log(`  ${C.dim(`(${skipped} external/non-AKN hrefs skipped)`)}`);
		}
		if (bad.length) {
			for (const { doc, link } of bad) {
				logFail(
					`${doc.countryCode}/${doc.type}s`,
					relative(DATA_DIR, doc.filePath),
					`unresolved link → ${link.href} (${link.toCountry}/${link.toType}/${link.toNativeId})`
				);
			}
			process.exitCode = 1;
			return;
		}

		// Summary.
		console.log('');
		logStep('Summary');
		const counts = new Map<string, number>();
		for (const d of docs) {
			const k = `${d.countryCode}/${d.type}`;
			counts.set(k, (counts.get(k) ?? 0) + 1);
		}
		const keys = [...counts.keys()].sort();
		for (const k of keys) {
			console.log(`  ${C.dim(k.padEnd(20))} ${counts.get(k)}`);
		}
		console.log(`  ${C.bold('total'.padEnd(20))} ${docs.length}`);
		console.log(`\n${C.green('Done.')} → ${C.dim(relative(process.cwd(), DB_PATH))}\n`);
	} finally {
		sqlite.close();
	}
}

main().catch((err) => {
	console.error(C.red('\nFatal error:'), err);
	process.exit(1);
});
