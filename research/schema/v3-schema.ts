/**
 * ═════════════════════════════════════════════════════════════════════
 * MISSION (unchanged from v1 / v2)
 * ═════════════════════════════════════════════════════════════════════
 *
 * Build a SQL schema, heavily inspired by Akoma Ntoso (AKN), that can
 * represent the ENTIRE parliamentary ritual of MULTIPLE countries
 * inside ONE shared schema.
 *
 * v3 keeps that bet. What changes is where the document body lives.
 *
 * ═════════════════════════════════════════════════════════════════════
 * WHAT'S NEW IN v3 — read this before anything else
 * ═════════════════════════════════════════════════════════════════════
 *
 * v2 had a `body` JSON column on every DocumentTable row. That column
 * was the schema admitting it had hit a wall: anything too nested,
 * recursive, mixed-content, or country-specific got dumped there.
 * Versioning the column required snapshotting whole rows. Querying
 * inside it required jsonb gymnastics that nobody actually used.
 *
 * v3 inverts the architecture:
 *
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │ The AKN XML file is the source of truth. Every document we     │
 *   │ mirror lives as a canonical AKN XML blob — articles,           │
 *   │ paragraphs, refs, remarks, mixed content, attributes — exactly │
 *   │ as AKN models it.                                              │
 *   │                                                                │
 *   │ The SQL columns are a derived index over the XML. Every column │
 *   │ exists because a hot query needs it. If a column is wrong, we  │
 *   │ change the extractor and rebuild. If a column is missing, we   │
 *   │ add an extractor and rebuild. The XML never moves.             │
 *   │                                                                │
 *   │ No `body` column exists anymore. It was the symptom of forcing │
 *   │ a tree into a row.                                             │
 *   └────────────────────────────────────────────────────────────────┘
 *
 * This dissolves the v2 questions about which fields should be
 * versioned vs. global, what belongs on detail tables, and which JSON
 * shape the body should take. There is one source of truth per
 * document — its AKN XML — and everything else is projection.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE FIELD SPLIT, MADE EXPLICIT
 * ─────────────────────────────────────────────────────────────────────
 *
 * For every field, v3 makes one of three choices, and the choice is
 * recorded in code (these comments + the SQL column placement):
 *
 *   1. IN SQL ONLY — plumbing.
 *      `id`, `nativeId`, `countryCode`, `fingerprint`, `lastActivityAt`,
 *      `scrapingId`, `createdAt`, `updatedAt`. Never appears in the
 *      XML. Overwritten in place. No history.
 *
 *   2. IN XML ONLY — anything deeply nested, recursive, mixed-content,
 *      or country-specific that the demo doesn't query in aggregate.
 *      Articles, paragraphs, justifications, remarks, internal cross-
 *      references, structural metadata. Lives only inside the XML
 *      blob. Read by parsing in app code when rendering. Versioned by
 *      virtue of living in the XML, which is itself versioned.
 *
 *   3. IN BOTH, WITH XML AUTHORITATIVE — a small, hand-picked set of
 *      fields the demo needs in joins or filters. `title`, `status`,
 *      `publishedAt`, `submittedAt`, `promulgatedAt`, sponsors,
 *      target bill, amends-act pointer, journal issue number, etc.
 *      Stored as columns AND present in the XML. The build script
 *      extracts them from the XML on ingest. If the column and the
 *      XML disagree, the XML wins — the column is regenerated.
 *
 * The list of (3) fields per document type is the schema-level
 * decision. It is small on purpose. Adding to it is cheap (extractor +
 * column + rebuild), so we err on the side of extracting only what the
 * demo's canonical queries actually need.
 *
 * ─────────────────────────────────────────────────────────────────────
 * VERSIONING
 * ─────────────────────────────────────────────────────────────────────
 *
 * v2 wrote a JSON snapshot of the whole document state on every
 * meaningful change. v3 writes the WHOLE AKN XML on every meaningful
 * change. Same idea, simpler artifact:
 *
 *   - `diff_document_versions` rows hold one column of XML plus
 *     identifying metadata (version number, publishedAt, fingerprint,
 *     optional changeNote, sourceUrl/storageUrl/extractedText,
 *     mimeType).
 *   - "Doc as of date T" → fetch the latest version row with
 *     `publishedAt <= T`, render the XML.
 *   - Side-by-side diff for AKN-Diff → fetch two version rows by id,
 *     hand both XML blobs to the renderer.
 *   - Current state for the homepage / search / list / detail pages →
 *     never touches versions; reads `diff_documents` + the type-
 *     specific detail row, both of which mirror the latest version's
 *     extracted columns.
 *
 * The AKN XML is self-describing, so we don't need a `_schemaVersion`
 * marker on the body content. We DO keep a small `schemaVersion`
 * column on the version row to record which v3.x extractor produced
 * the SQL projection — so future readers can rerun extraction if the
 * extraction rules changed.
 *
 * ─────────────────────────────────────────────────────────────────────
 * LINKS, EXTRACTED NOT AUTHORED
 * ─────────────────────────────────────────────────────────────────────
 *
 * In v2, links were authored as their own rows. In v3, links are
 * derived from the XML at ingest:
 *
 *   - The build script walks every `<ref href="...">`, `<mref>`,
 *     `<rref>`, `<authorialNote>`, `<passiveRef>` etc. it finds
 *     inside an XML blob.
 *   - Each one becomes a `diff_document_links` row with `fromId` =
 *     the document being ingested, `toId` = the document the href
 *     resolves to (if we mirror it), `relation` = inferred from the
 *     AKN element type and surrounding context, `source = 'extracted'`.
 *   - Hand-authored links (the manually added ones an analyst flagged)
 *     live alongside, with `source = 'manual'` and an optional pointer
 *     to the human who added them.
 *   - The append-only-with-active-flag design from v2 stays. Re-
 *     extraction never deletes; it deactivates rows whose href no
 *     longer appears in the new XML and inserts new ones for new
 *     hrefs.
 *
 * Why a real table and not "just query the XML": the killer query is
 * INCOMING edges — "every bill that amends this act", "every judgment
 * interpreting this act". That requires walking every XML in the
 * corpus on every query without an index. A table with a `byTo` index
 * makes it one lookup.
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHAT GOES AWAY FROM v2
 * ─────────────────────────────────────────────────────────────────────
 *
 *   - `DocumentTable.body` — gone. Its content is in the XML.
 *   - `DocumentTable.countrySpecific` — gone. Country-specific values
 *     live wherever AKN puts them (typically `<TLCConcept>` references,
 *     `<keyword>`, or namespaced extension elements). If they truly
 *     have no AKN home, they go inside an `<akndiff:countrySpecific>`
 *     element under the document's `<meta>` — never in SQL.
 *   - The Tier 1 / Tier 2 split as a versioning rule — gone.
 *     Versioning happens at the document level: the XML is the unit of
 *     versioning. SQL columns are derived; they don't have their own
 *     version history.
 *   - Per-detail-table `voteRecord`, `parties`, `agendaItems` JSON
 *     columns — gone. These structures live in the XML; if the demo
 *     needs to filter on them, they get extracted to a side table on
 *     ingest.
 *   - The `_schemaVersion` marker stamped inside snapshot JSON — gone.
 *     The XML is self-describing; only the row-level `schemaVersion`
 *     remains, recording which extractor produced the SQL projection.
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHAT STAYS FROM v2
 * ─────────────────────────────────────────────────────────────────────
 *
 *   - The DocumentType union, all 14 types.
 *   - Per-type detail tables, with the same identity-by-document_id
 *     1:1 relationship.
 *   - The link graph table shape (fromId, toId, relation, source,
 *     ordinal, confidence, activatedAt, deactivatedAt).
 *   - The bill events table — these are explicit transition records,
 *     not document state, and don't fit cleanly inside a single AKN
 *     bill XML. They stay first-class SQL.
 *   - The change_set type and its diff_article_changes rows. The base/
 *     result version pointers now resolve to XML version rows instead
 *     of JSON snapshot rows.
 *   - The set of LinkRelation, BillStatus, ActStatus,
 *     AmendmentOutcome, QuestionStatus, JudgmentInstance, ChangeKind,
 *     ChangeSetSource, LinkSource unions — unchanged.
 *   - SQLite as the target (drizzle-orm/sqlite-core).
 *
 * ─────────────────────────────────────────────────────────────────────
 * STORAGE AND TOOLING DECISIONS
 * ─────────────────────────────────────────────────────────────────────
 *
 *   - The XML column is `text('xml').notNull()` on DocumentTable
 *     (current state) and DocumentVersionTable (history).
 *   - We do NOT install an XML extension into SQLite. The DB sees XML
 *     as opaque text. All XML access happens in TypeScript using a
 *     parser (e.g. fast-xml-parser or a DOM-style library — the
 *     concrete pick is the build script's call, not the schema's).
 *   - Plain-text extraction for FTS / AI continues to live on the
 *     version row (`extractedText`), populated by the build script
 *     after parsing the XML.
 *   - The fingerprint stored on DocumentTable and on each version row
 *     is a hash of the canonical XML.
 *   - Build script ordering: parse XML → extract SQL projections +
 *     links → INSERT current row + detail row → INSERT version row →
 *     INSERT/UPDATE link rows. One transaction per document.
 *   - We validate every blob at build time against the OASIS AKN XSDs
 *     plus our own `akndiff:` namespace XSD. Validation isn't enforced
 *     by SQLite — the build script does it before insert.
 *
 * ─────────────────────────────────────────────────────────────────────
 * SQLITE NOTES (carried over from v1 / v2)
 * ─────────────────────────────────────────────────────────────────────
 *   - No native enums. text().$type<Union>() for compile-time safety.
 *   - No UUID. text + $defaultFn(crypto.randomUUID).
 *   - JSON columns use text({ mode: 'json' }), backed by SQLite's
 *     json1.
 *   - Timestamps use integer({ mode: 'timestamp_ms' }).
 */

import {
	sqliteTable,
	text,
	integer,
	uniqueIndex,
	index
} from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ──────────────────────────────────────────────────────────────────────
// SCHEMA VERSION MARKER
// ──────────────────────────────────────────────────────────────────────

/**
 * Bumped on any structural change to the SQL projection rules — i.e.
 * when the extractor that turns XML into SQL columns changes shape.
 *
 * Stored on every version row as `schemaVersion`. This lets a future
 * reader know which extractor produced the projected columns it's
 * looking at, and decide whether to re-run extraction. The XML itself
 * is self-describing and doesn't need a marker.
 */
export const SCHEMA_VERSION = 3 as const;

/**
 * The XML namespace we use for the AKN-Diff extensions (changeSet,
 * vote records, the rare countrySpecific escape hatch). Lives
 * alongside the core AKN namespace inside every blob. Validated by a
 * separate XSD so the core AKN validator passes regardless.
 */
export const AKNDIFF_NAMESPACE = 'https://akndiff.io/ns/akndiff' as const;

// ──────────────────────────────────────────────────────────────────────
// TYPE UNIONS (sqlite has no enums; these are TS-only)
// ──────────────────────────────────────────────────────────────────────
// Carried over from v2 unchanged. The discrimination model didn't move
// — only the body's storage did.

export type DocumentType =
	| 'bill'
	| 'act'
	| 'amendment'
	| 'judgment'
	| 'journal'
	| 'document_collection'
	| 'question'
	| 'communication'
	| 'debate'
	| 'citation'
	| 'change_set'
	| 'statement'
	| 'portion'
	| 'doc';

export type BillStatus =
	| 'submitted'
	| 'in_committee'
	| 'floor_debate'
	| 'second_chamber'
	| 'reconciliation'
	| 'passed'
	| 'enacted'
	| 'rejected'
	| 'withdrawn'
	| 'archived';

export type ActStatus =
	| 'in_force'
	| 'partially_repealed'
	| 'repealed'
	| 'superseded'
	| 'suspended';

export type QuestionStatus =
	| 'submitted'
	| 'admitted'
	| 'pending_response'
	| 'answered'
	| 'overdue'
	| 'withdrawn'
	| 'inadmissible';

export type AmendmentOutcome =
	| 'pending'
	| 'approved'
	| 'rejected'
	| 'withdrawn'
	| 'inadmissible'
	| 'merged';

export type JudgmentInstance =
	| 'first'
	| 'appeal'
	| 'supreme'
	| 'constitutional'
	| 'administrative'
	| 'other';

export type LinkRelation =
	| 'amends'
	| 'modifies'
	| 'promulgates'
	| 'mentions'
	| 'cites'
	| 'replaces'
	| 'derives_from'
	| 'contains'
	| 'refers_to'
	| 'responds_to'
	| 'interprets'
	| 'consolidates'
	| 'transmits';

export type LinkSource = 'gov_site' | 'extracted' | 'inferred' | 'manual';

export type ChangeKind =
	| 'modify'
	| 'insert'
	| 'repeal'
	| 'renumber'
	| 'renumber_modify'
	| 'replace_block';

export type ChangeSetSource =
	| 'gov_site'
	| 'computed'
	| 'extracted'
	| 'inferred'
	| 'manual';

// ──────────────────────────────────────────────────────────────────────
// COUNTRIES — unchanged from v1 / v2
// ──────────────────────────────────────────────────────────────────────

export const CountryTable = sqliteTable('diff_countries', {
	code: text('code').primaryKey(),
	name: text('name').notNull(),
	defaultTimezone: text('default_timezone').notNull(),
	hasRegions: integer('has_regions', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.notNull()
		.$defaultFn(() => new Date())
});

// ──────────────────────────────────────────────────────────────────────
// DOCUMENTS — identity + the canonical XML + extracted index columns
// ──────────────────────────────────────────────────────────────────────

/**
 * The current row for every document. Holds three things:
 *
 *   1. PLUMBING (in SQL only) — id, nativeId, countryCode, scrapingId,
 *      timestamps, fingerprint. None of these appear in the XML.
 *
 *   2. THE XML (the source of truth) — the canonical AKN blob for the
 *      document's current state. Validated against the OASIS AKN
 *      XSDs + our akndiff: extension XSD before insert.
 *
 *   3. A SMALL SET OF EXTRACTED INDEX COLUMNS — `title`, `language`,
 *      `publishedAt`, `topics`, `sourceUrl`. These exist because the
 *      homepage feed, search, list pages, and detail pages need them
 *      in WHERE/ORDER BY clauses without parsing XML on every read.
 *      They are derived from the XML; the build script repopulates
 *      them on every ingest. If they disagree with the XML, the XML
 *      wins — the column is wrong and gets regenerated.
 *
 * Reads on the demo's hot paths always go through this row plus the
 * type-specific detail row. The versions table is a journal you query
 * only when you want history.
 */
export const DocumentTable = sqliteTable(
	'diff_documents',
	{
		// ── Plumbing (SQL only) ─────────────────────────────────────────

		/** UUID. Stable across the doc's lifetime. */
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),

		/** Discriminator. Determines which detail table to JOIN. */
		type: text('type').$type<DocumentType>().notNull(),

		/** ISO country code. */
		countryCode: text('country_code')
			.notNull()
			.references(() => CountryTable.code),

		/** The id the gov site uses. Stable for the doc's lifetime. */
		nativeId: text('native_id').notNull(),

		/**
		 * Hash of the canonical XML. Used in production to detect
		 * change for cascade events. In the research build it's just
		 * metadata — every build rebuilds from scratch.
		 */
		fingerprint: text('fingerprint').notNull(),

		/** Join key into the main app's scraping_history. */
		scrapingId: text('scraping_id').notNull(),

		/**
		 * Last time anything about this doc was updated upstream.
		 * Mirrors scraping_history.last_seen_at semantics. Updates in
		 * place — no version row is written when only this changes.
		 */
		lastActivityAt: integer('last_activity_at', { mode: 'timestamp_ms' }).notNull(),

		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.notNull()
			.$defaultFn(() => new Date()),

		// ── The source of truth ─────────────────────────────────────────

		/**
		 * The canonical AKN XML for the document's CURRENT state. This
		 * is the document; everything else here is projection.
		 *
		 * Includes the akndiff: namespace declaration alongside the
		 * core AKN one so changeSet / vote / countrySpecific extension
		 * elements can be authored inline without breaking core
		 * validation. Inlined per blob (redundant but unambiguous —
		 * no schema-level inference fragility).
		 *
		 * Opaque to SQL. Read it via a TS parser in app code.
		 */
		xml: text('xml').notNull(),

		// ── Extracted index columns (XML authoritative) ─────────────────
		// These mirror values the build script extracts from the XML.
		// Repopulated on every ingest. If they disagree with the XML,
		// the XML wins.

		/** Free-text title as published, in the source language. */
		title: text('title').notNull(),

		/** Source language code: 'es', 'en', 'fr', etc. */
		language: text('language').notNull().default('es'),

		/**
		 * Subject/topic tags as published. NOT normalized cross-
		 * country. Extracted from `<keyword>` / `<TLCConcept>`
		 * references in the AKN `<meta>` block.
		 */
		topics: text('topics', { mode: 'json' })
			.$type<string[]>()
			.notNull()
			.default(sql`'[]'`),

		/** Canonical URL on the gov site. */
		sourceUrl: text('source_url').notNull(),

		/**
		 * When the gov site itself published / dated this document.
		 * Different from createdAt (when WE first saw it).
		 *
		 * Extracted from the AKN identification block's
		 * `<FRBRdate name="generation"/>` (or the appropriate per-
		 * type equivalent — bills use submission, acts use
		 * promulgation, etc., normalized to one field here).
		 */
		publishedAt: integer('published_at', { mode: 'timestamp_ms' }).notNull()
	},
	(t) => ({
		naturalKey: uniqueIndex('diff_docs_natural_key').on(
			t.countryCode,
			t.type,
			t.nativeId
		),
		byCountryActivity: index('diff_docs_country_activity_idx').on(
			t.countryCode,
			t.lastActivityAt
		),
		byCountryType: index('diff_docs_country_type_idx').on(t.countryCode, t.type),
		byScrapingId: uniqueIndex('diff_docs_scraping_id_idx').on(t.scrapingId)
	})
);

// ──────────────────────────────────────────────────────────────────────
// DOCUMENT VERSIONS — XML snapshots, append-only
// ──────────────────────────────────────────────────────────────────────

/**
 * The journal. One row per snapshot of one document at one point in
 * time. The snapshot is the AKN XML itself.
 *
 * What changed vs v2:
 *   - v2 stored a `snapshot` JSON column with the whole document
 *     state. v3 stores `xml` — the same AKN blob you'd find on the
 *     current row, just at a prior point in time.
 *   - No `_schemaVersion` marker inside the snapshot. The XML is
 *     self-describing. We do keep a row-level `schemaVersion` to
 *     record which extractor produced the SQL projection at that
 *     moment.
 *
 * Reads:
 *   - Current state: never touches this table. Read DocumentTable.
 *   - "Doc as of T":  ORDER BY publishedAt DESC LIMIT 1 WHERE <= T.
 *   - Side-by-side diff: two rows by id, hand the XML blobs to the
 *     AKN-Diff renderer.
 *
 * Writes (in the research build): one row per entry of the YAML's
 * `versions:` array. No live-diff logic — the build is fresh every
 * run.
 */
export const DocumentVersionTable = sqliteTable(
	'diff_document_versions',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),

		documentId: text('document_id')
			.notNull()
			.references(() => DocumentTable.id, { onDelete: 'cascade' }),

		/**
		 * Monotonic per document. Highest = current. Numbers give
		 * stable identity, timestamps give a calendar — we keep both.
		 */
		version: integer('version').notNull(),

		/** When this version was published / dated by the gov site. */
		publishedAt: integer('published_at', { mode: 'timestamp_ms' }).notNull(),

		/**
		 * The full AKN XML at this version. Self-describing — no
		 * outer wrapper. Validated against the AKN + akndiff: XSDs
		 * before insert.
		 */
		xml: text('xml').notNull(),

		/**
		 * Which v3.x extractor produced the SQL projection for this
		 * version. If extraction rules change, a future build can
		 * re-extract from the unchanged XML and bump this column —
		 * the XML never moves.
		 */
		schemaVersion: integer('schema_version').notNull().default(SCHEMA_VERSION),

		/**
		 * Free-form note explaining WHY this version exists.
		 *   "new amendment text published on bcn.cl"
		 *   "daily re-scrape, structural fields differ"
		 *   "manual correction: sponsor list typo"
		 *
		 * Not parsed by the app. Just useful for humans poking at
		 * the history. Optional.
		 */
		changeNote: text('change_note'),

		/**
		 * Discriminator copied from the document at write time, so
		 * the version row is self-describing without a join. Lets a
		 * tool dump the table and know what it's looking at.
		 */
		documentType: text('document_type').$type<DocumentType>().notNull(),

		/**
		 * Optional pointer to the original file on the gov site for
		 * THIS version. Different versions of an act often have
		 * different gov-site URLs. Null if same as the document's
		 * sourceUrl.
		 */
		sourceUrl: text('source_url'),

		/** Where we mirrored it. Null until we fetch. */
		storageUrl: text('storage_url'),

		/**
		 * Plain-text extraction for FTS + AI. Populated by the build
		 * script after parsing the XML. Null until extracted.
		 */
		extractedText: text('extracted_text'),

		mimeType: text('mime_type'),

		/** Hash of the canonical XML. */
		fingerprint: text('fingerprint').notNull(),

		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(t) => ({
		uniqueVersion: uniqueIndex('diff_doc_versions_unique').on(t.documentId, t.version),
		byDoc: index('diff_doc_versions_doc_idx').on(t.documentId, t.version),
		// "Doc as of date T": find the latest version <= T.
		byDocPublished: index('diff_doc_versions_published_idx').on(
			t.documentId,
			t.publishedAt
		)
	})
);

// ──────────────────────────────────────────────────────────────────────
// DOCUMENT LINKS — extracted from <ref> at ingest, append-only
// ──────────────────────────────────────────────────────────────────────

/**
 * The graph IS the "navigate like the web" idea, stored relationally.
 *
 * What changed vs v2: links are derived from the XML, not authored.
 * The build script walks `<ref href="...">`, `<mref>`, `<rref>`,
 * `<authorialNote>`, `<passiveRef>` etc. inside the XML and emits
 * one row per discovered edge with `source = 'extracted'`. Manual
 * links (analyst-flagged) live alongside with `source = 'manual'`.
 *
 * The append-only-with-active-flag shape from v2 stays. Re-extraction
 * never deletes; it deactivates rows whose href no longer appears in
 * the new XML and inserts new ones for new hrefs. Re-creating the
 * same edge after a deactivation creates a new row, not an update —
 * so the audit trail is intact.
 *
 * Active reads (the common case) filter `WHERE deactivated_at IS NULL`.
 * History reads (rare) walk the table.
 *
 * Why a real table and not "just query the XML": the killer query is
 * INCOMING edges — "every bill that amends this act", "every judgment
 * interpreting this act". A table with `byTo` index makes it one
 * lookup; otherwise we'd parse every XML in the corpus on every
 * query.
 */
export const DocumentLinkTable = sqliteTable(
	'diff_document_links',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),

		fromId: text('from_id')
			.notNull()
			.references(() => DocumentTable.id, { onDelete: 'cascade' }),
		toId: text('to_id')
			.notNull()
			.references(() => DocumentTable.id, { onDelete: 'cascade' }),

		relation: text('relation').$type<LinkRelation>().notNull(),

		/**
		 * The exact AKN element type the link was extracted from
		 * (`ref`, `mref`, `rref`, `passiveRef`, ...). Useful for
		 * debugging extraction rules and for the UI to distinguish
		 * structural references from prose mentions. Null when the
		 * link is `source = 'manual'`.
		 */
		aknElement: text('akn_element'),

		/**
		 * The original href as written in the XML (eldas-style or
		 * relative). Kept verbatim so we can re-resolve later if the
		 * resolver rules change. Null for manual links.
		 */
		href: text('href'),

		/**
		 * Order within the source. Used by document_collection
		 * (dossier order) and journal (publication order). Null when
		 * irrelevant.
		 */
		ordinal: integer('ordinal'),

		/** How we learned about this link. Drives UI trust badge. */
		source: text('source').$type<LinkSource>().notNull(),

		/** 0..100 for inferred/extracted; null for gov_site/manual. */
		confidence: integer('confidence'),

		/** Citing sentence, regex match, AI rationale, etc. */
		details: text('details', { mode: 'json' })
			.$type<Record<string, unknown>>()
			.notNull()
			.default(sql`'{}'`),

		/**
		 * When this edge was first observed. Lets us answer "did
		 * this link exist on date T?" without scanning versions.
		 */
		activatedAt: integer('activated_at', { mode: 'timestamp_ms' })
			.notNull()
			.$defaultFn(() => new Date()),

		/**
		 * Set when the edge stops existing upstream (citation
		 * removed, amendment retracted, href no longer present in
		 * the latest XML). Null = currently active. Append-only:
		 * we never DELETE rows. If the edge comes back, it's a NEW
		 * row with a fresh activatedAt.
		 */
		deactivatedAt: integer('deactivated_at', { mode: 'timestamp_ms' }),

		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(t) => ({
		// Outgoing edges, active-first.
		byFrom: index('diff_links_from_idx').on(t.fromId, t.relation, t.deactivatedAt),
		// Incoming edges — "what points at this doc?" The killer query.
		byTo: index('diff_links_to_idx').on(t.toId, t.relation, t.deactivatedAt),
		// "Did this edge exist on T?" range scan.
		byActivation: index('diff_links_activation_idx').on(
			t.fromId,
			t.toId,
			t.activatedAt
		)
		// NOTE: no uniqueEdge index. The same (from, to, relation,
		// source) tuple can legitimately appear multiple times across
		// time (deactivated and re-activated). De-duping is the build
		// script's job: when re-loading from YAML, only one row per
		// active edge should exist at any moment.
	})
);

// ──────────────────────────────────────────────────────────────────────
// PER-TYPE DETAIL TABLES — extracted projections of the XML
// ──────────────────────────────────────────────────────────────────────
// One row per matching DocumentTable row (1:1, FK cascade delete).
// These hold values the build script extracts from the AKN XML on
// ingest. Every column on these tables answers a query the demo runs
// often enough that parsing XML per page-load would be wrong. Anything
// the demo doesn't filter or join on stays in the XML.
//
// History for these fields lives by virtue of the version row's XML
// — re-extracting from a prior version's XML reproduces the prior
// values. No per-detail-table version history exists.
//
// XML AUTHORITATIVE: if a column disagrees with the latest XML, the
// build script regenerates it from the XML. Hand-editing detail rows
// is wrong; edit the YAML's xml: blob and rebuild.

// ─────────────── BILLS ───────────────

/**
 * Extracted from the AKN bill XML's `<meta>` and `<lifecycle>`.
 *
 *   - status / statusLocal — from the most recent `<lifecycle/eventRef>`.
 *   - submittedAt — from the submission lifecycle event date.
 *   - sponsors — from `<TLCPerson>` references in `<proprietary>` or
 *     equivalent country-specific blocks; flattened to a list because
 *     we still don't have a persons table.
 *   - amendsActId — resolved from the bill's `<amendsAct>` ref (or
 *     equivalent). Same info as a DocumentLinkTable row with
 *     relation='amends'; this column makes the common case a single-
 *     table read.
 *   - urgency — from country-specific `<TLCConcept>` keyword or an
 *     `<akndiff:urgency>` extension element.
 */
export const BillTable = sqliteTable(
	'diff_bills',
	{
		documentId: text('document_id')
			.primaryKey()
			.references(() => DocumentTable.id, { onDelete: 'cascade' }),

		/** Bill subtype as the country uses it: 'mensaje', 'moción', etc. */
		subtype: text('subtype'),

		status: text('status').$type<BillStatus>().notNull(),
		statusLocal: text('status_local').notNull(),

		submittedAt: integer('submitted_at', { mode: 'timestamp_ms' }).notNull(),

		/**
		 * Sponsors flattened from AKN person refs. Persons table is
		 * still deliberately out of scope (see v2-plan §4) — promote
		 * when a customer asks.
		 */
		sponsors: text('sponsors', { mode: 'json' })
			.$type<
				Array<{
					name: string;
					role?: string;
					party?: string;
					chamber?: string;
					externalId?: string;
				}>
			>()
			.notNull()
			.default(sql`'[]'`),

		/**
		 * Pointer to the act this bill is amending, if any. Same
		 * info as a DocumentLinkTable row with relation='amends';
		 * this column just makes the common case a single-table
		 * read.
		 */
		amendsActId: text('amends_act_id').references(() => DocumentTable.id),

		/** Urgency tier. Free text — values vary cross-country. */
		urgency: text('urgency')
	},
	(t) => ({
		byStatus: index('diff_bills_status_idx').on(t.status),
		byAmendsAct: index('diff_bills_amends_act_idx').on(t.amendsActId)
	})
);

/**
 * The trámite log. Append-only, captures status transitions
 * EXPLICITLY — these are first-class SQL because they don't fit
 * cleanly inside a single bill XML (they reference produced
 * documents that may live elsewhere in the corpus).
 *
 * Event rows are plumbing: no per-event versioning. If an event is
 * corrected upstream, we either INSERT a corrective event or UPDATE
 * in place. The bill version row's XML captures the resulting
 * status; events capture HOW the transition happened.
 */
export const BillEventTable = sqliteTable(
	'diff_bill_events',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),

		billId: text('bill_id')
			.notNull()
			.references(() => BillTable.documentId, { onDelete: 'cascade' }),

		sequence: integer('sequence').notNull(),
		occurredAt: integer('occurred_at', { mode: 'timestamp_ms' }).notNull(),

		/** Normalized step. Cross-country comparable. */
		actionType: text('action_type').notNull(),
		/** Raw country-language description. */
		actionTypeLocal: text('action_type_local').notNull(),

		chamber: text('chamber'),

		/**
		 * If the step produced a document, link to it here. Distinct
		 * from a text revision of the bill itself (which lives as a
		 * version row in DocumentVersionTable).
		 */
		producedDocumentId: text('produced_document_id').references(
			() => DocumentTable.id
		),

		details: text('details', { mode: 'json' })
			.$type<Record<string, unknown>>()
			.notNull()
			.default(sql`'{}'`)
	},
	(t) => ({
		byBill: index('diff_bill_events_bill_idx').on(t.billId, t.sequence),
		byTime: index('diff_bill_events_time_idx').on(t.occurredAt)
	})
);

// ─────────────── ACTS ───────────────

/**
 * An act is a promulgated law. Acts have versions over time — each
 * amendment produces a new consolidated AKN XML in
 * DocumentVersionTable.
 *
 * Status changes (in_force → partially_repealed → repealed) ride
 * along with new XML versions; the columns here mirror the LATEST
 * version's extracted state. Extracted from the act's `<lifecycle>`
 * and FRBR identification blocks.
 */
export const ActTable = sqliteTable(
	'diff_acts',
	{
		documentId: text('document_id')
			.primaryKey()
			.references(() => DocumentTable.id, { onDelete: 'cascade' }),

		status: text('status').$type<ActStatus>().notNull(),

		/** When the act became law. Rarely changes. */
		promulgatedAt: integer('promulgated_at', { mode: 'timestamp_ms' }).notNull(),
		/** When it took effect (often promulgated + N days). */
		effectiveAt: integer('effective_at', { mode: 'timestamp_ms' }),
		/** When repealed, if applicable. */
		repealedAt: integer('repealed_at', { mode: 'timestamp_ms' }),

		/** Issuing body. Free text since values vary cross-country. */
		issuingBody: text('issuing_body').notNull(),

		/** Where the act was officially published. */
		publicationJournalId: text('publication_journal_id').references(
			() => DocumentTable.id
		)
	},
	(t) => ({
		byStatus: index('diff_acts_status_idx').on(t.status),
		byPromulgated: index('diff_acts_promulgated_idx').on(t.promulgatedAt)
	})
);

// ─────────────── AMENDMENTS ───────────────

/**
 * A proposed modification to a bill. The COMPUTED diff/changeSet is
 * NOT here — it lives as its own document of type 'change_set' (see
 * ChangeSetTable). That keeps the AKN-Diff research alive without
 * smearing it across types.
 *
 * Note: the `textOld` / `textNew` / `justification` fields from v2
 * are GONE. The amendment's body — original prose, proposed prose,
 * justification — lives inside the AKN XML's `<amendmentBody>` /
 * `<amendmentJustification>` elements. Read it by parsing the XML
 * when rendering. This table holds only what the demo joins or
 * filters on.
 */
export const AmendmentTable = sqliteTable(
	'diff_amendments',
	{
		documentId: text('document_id')
			.primaryKey()
			.references(() => DocumentTable.id, { onDelete: 'cascade' }),

		targetBillId: text('target_bill_id')
			.notNull()
			.references(() => DocumentTable.id),

		/**
		 * AKN locator string identifying the target node within the
		 * bill (`#art_3__para_2` or similar). Different countries
		 * format these differently; we keep the raw value.
		 */
		targetLocator: text('target_locator'),

		submitter: text('submitter', { mode: 'json' })
			.$type<{
				name: string;
				party?: string;
				chamber?: string;
				externalId?: string;
			}>()
			.notNull(),

		submittedAt: integer('submitted_at', { mode: 'timestamp_ms' }).notNull(),

		outcome: text('outcome').$type<AmendmentOutcome>().notNull().default('pending'),
		votedAt: integer('voted_at', { mode: 'timestamp_ms' })

		// NOTE: `voteRecord` JSON is gone. Vote tallies live inside
		// the amendment's AKN XML under our `<akndiff:vote>`
		// extension. If a hot query needs to filter on tally counts,
		// promote them to a side table at extraction time — don't
		// add a JSON column here.
	},
	(t) => ({
		byTargetBill: index('diff_amendments_target_bill_idx').on(t.targetBillId),
		byOutcome: index('diff_amendments_outcome_idx').on(t.outcome)
	})
);

// ─────────────── JUDGMENTS ───────────────

/**
 * Note: `parties` JSON is gone. Parties live as `<TLCPerson>` /
 * `<TLCOrganization>` references inside the judgment's AKN XML's
 * `<meta>` block. Read by parsing when rendering.
 */
export const JudgmentTable = sqliteTable(
	'diff_judgments',
	{
		documentId: text('document_id')
			.primaryKey()
			.references(() => DocumentTable.id, { onDelete: 'cascade' }),

		court: text('court').notNull(),
		caseNumber: text('case_number').notNull(),
		instance: text('instance').$type<JudgmentInstance>().notNull(),

		decidedAt: integer('decided_at', { mode: 'timestamp_ms' }).notNull(),

		/** Short ruling summary. Full ruling text lives in the XML. */
		rulingSummary: text('ruling_summary')
	},
	(t) => ({
		byCourt: index('diff_judgments_court_idx').on(t.court, t.decidedAt),
		byCase: uniqueIndex('diff_judgments_case_idx').on(t.court, t.caseNumber)
	})
);

// ─────────────── JOURNALS (officialGazette) ───────────────

export const JournalTable = sqliteTable(
	'diff_journals',
	{
		documentId: text('document_id')
			.primaryKey()
			.references(() => DocumentTable.id, { onDelete: 'cascade' }),

		issueNumber: text('issue_number').notNull(),
		issuedAt: integer('issued_at', { mode: 'timestamp_ms' }).notNull(),
		publisher: text('publisher').notNull(),

		/** 'national' | 'regional' | 'eu' | 'municipal' */
		scope: text('scope').notNull().default('national'),

		regionCode: text('region_code')
	},
	(t) => ({
		byIssued: index('diff_journals_issued_idx').on(t.publisher, t.issuedAt),
		byIssue: uniqueIndex('diff_journals_issue_idx').on(t.publisher, t.issueNumber)
	})
);

// ─────────────── DOCUMENT COLLECTIONS ───────────────

export const DocumentCollectionTable = sqliteTable(
	'diff_document_collections',
	{
		documentId: text('document_id')
			.primaryKey()
			.references(() => DocumentTable.id, { onDelete: 'cascade' }),

		collectionKind: text('collection_kind').notNull(),

		anchorDocumentId: text('anchor_document_id').references(() => DocumentTable.id),

		isAutoMaintained: integer('is_auto_maintained', { mode: 'boolean' })
			.notNull()
			.default(true)
	},
	(t) => ({
		byAnchor: index('diff_collections_anchor_idx').on(t.anchorDocumentId),
		byKind: index('diff_collections_kind_idx').on(t.collectionKind)
	})
);

// ─────────────── QUESTIONS ───────────────

export const QuestionTable = sqliteTable(
	'diff_questions',
	{
		documentId: text('document_id')
			.primaryKey()
			.references(() => DocumentTable.id, { onDelete: 'cascade' }),

		status: text('status').$type<QuestionStatus>().notNull(),

		questioner: text('questioner', { mode: 'json' })
			.$type<{
				name: string;
				party?: string;
				chamber?: string;
				externalId?: string;
			}>()
			.notNull(),

		target: text('target').notNull(),

		submittedAt: integer('submitted_at', { mode: 'timestamp_ms' }).notNull(),
		deadlineAt: integer('deadline_at', { mode: 'timestamp_ms' }),
		answeredAt: integer('answered_at', { mode: 'timestamp_ms' }),

		questionKind: text('question_kind')
	},
	(t) => ({
		byStatus: index('diff_questions_status_idx').on(t.status),
		byDeadline: index('diff_questions_deadline_idx').on(t.deadlineAt)
	})
);

// ─────────────── COMMUNICATIONS ───────────────

export const CommunicationTable = sqliteTable(
	'diff_communications',
	{
		documentId: text('document_id')
			.primaryKey()
			.references(() => DocumentTable.id, { onDelete: 'cascade' }),

		fromBody: text('from_body').notNull(),
		toBody: text('to_body').notNull(),

		transmittedAt: integer('transmitted_at', { mode: 'timestamp_ms' }).notNull(),

		communicationKind: text('communication_kind').notNull(),

		refersToDocumentId: text('refers_to_document_id').references(
			() => DocumentTable.id
		)
	},
	(t) => ({
		byFromTo: index('diff_communications_from_to_idx').on(t.fromBody, t.toBody),
		byTransmitted: index('diff_communications_transmitted_idx').on(t.transmittedAt)
	})
);

// ─────────────── STATEMENTS (minimal) ───────────────

export const StatementTable = sqliteTable('diff_statements', {
	documentId: text('document_id')
		.primaryKey()
		.references(() => DocumentTable.id, { onDelete: 'cascade' }),

	author: text('author', { mode: 'json' })
		.$type<{ name: string; role?: string; onBehalfOf?: string }>()
		.notNull(),

	statedAt: integer('stated_at', { mode: 'timestamp_ms' }).notNull(),

	statementKind: text('statement_kind')
});

// ─────────────── PORTIONS (minimal) ───────────────

export const PortionTable = sqliteTable('diff_portions', {
	documentId: text('document_id')
		.primaryKey()
		.references(() => DocumentTable.id, { onDelete: 'cascade' }),

	parentDocumentId: text('parent_document_id')
		.notNull()
		.references(() => DocumentTable.id),

	locator: text('locator').notNull()
});

// ─────────────── GENERIC DOC ───────────────

export const GenericDocTable = sqliteTable('diff_generic_docs', {
	documentId: text('document_id')
		.primaryKey()
		.references(() => DocumentTable.id, { onDelete: 'cascade' }),

	kind: text('kind').notNull()
});

// ─────────────── DEBATES (lightweight) ───────────────

/**
 * The full transcript lives in the AKN XML as a `<debateBody>` of
 * `<speech>` elements. Anything beyond chamber + session window
 * timing belongs there.
 */
export const DebateTable = sqliteTable(
	'diff_debates',
	{
		documentId: text('document_id')
			.primaryKey()
			.references(() => DocumentTable.id, { onDelete: 'cascade' }),

		chamber: text('chamber').notNull(),

		sessionStartedAt: integer('session_started_at', {
			mode: 'timestamp_ms'
		}).notNull(),
		sessionEndedAt: integer('session_ended_at', { mode: 'timestamp_ms' }),

		externalRef: text('external_ref', { mode: 'json' }).$type<{
			transcriptId?: number;
			url?: string;
		}>()
	},
	(t) => ({
		bySession: index('diff_debates_session_idx').on(t.sessionStartedAt)
	})
);

// ─────────────── CITATIONS (lightweight) ───────────────

/**
 * Note: `agendaItems` JSON is gone. Agenda items live inside the
 * citation's AKN XML as a structured list (typically a
 * `<componentRef>` / `<TLCConcept>` block). Read by parsing when
 * rendering. If the demo ever needs to filter citations by their
 * agenda items' referenced documents, that becomes a side table at
 * extraction time, NOT a JSON column here.
 */
export const CitationTable = sqliteTable(
	'diff_citations',
	{
		documentId: text('document_id')
			.primaryKey()
			.references(() => DocumentTable.id, { onDelete: 'cascade' }),

		convenedBody: text('convened_body').notNull(),

		scheduledFor: integer('scheduled_for', { mode: 'timestamp_ms' }).notNull(),
		location: text('location'),

		externalRef: text('external_ref', { mode: 'json' }).$type<{
			citationId?: number;
			url?: string;
		}>()
	},
	(t) => ({
		byScheduled: index('diff_citations_scheduled_idx').on(t.scheduledFor)
	})
);

// ─────────────── CHANGE SETS (the AKN-Diff extension) ───────────────

/**
 * The AKN-Diff redline as its own document type. Carried over from
 * v2 with one re-grounding: the base/result version pointers now
 * resolve to XML version rows (DocumentVersionTable.xml) instead of
 * JSON snapshot rows. The AKN-Diff renderer now receives two AKN XML
 * blobs and the redline metadata, which is closer to how production
 * AKN tooling works.
 *
 * Note: `voteRecord` JSON stays here for now (carried over from v2)
 * because the change_set type is the moment the vote attaches to a
 * concrete redline. We could move it inside an `<akndiff:vote>`
 * element under the changeSet's XML in a later pass — open question
 * §4 in v3-plan.md. Keeping it as a column until the redline UI
 * proves slow with the alternative.
 */
export const ChangeSetTable = sqliteTable(
	'diff_change_sets',
	{
		documentId: text('document_id')
			.primaryKey()
			.references(() => DocumentTable.id, { onDelete: 'cascade' }),

		baseVersionId: text('base_version_id')
			.notNull()
			.references(() => DocumentVersionTable.id),

		resultVersionId: text('result_version_id').references(
			() => DocumentVersionTable.id
		),

		source: text('source').$type<ChangeSetSource>().notNull(),

		computedAt: integer('computed_at', { mode: 'timestamp_ms' })
			.notNull()
			.$defaultFn(() => new Date()),

		voteRecord: text('vote_record', { mode: 'json' }).$type<{
			result?: 'approved' | 'rejected' | 'withdrawn' | 'inadmissible' | 'pending';
			votedAt?: number;
			for?: { count: number; names?: string[] };
			against?: { count: number; names?: string[] };
			abstain?: { count: number; names?: string[] };
			sourceDebateId?: string;
		}>()
	},
	(t) => ({
		byBase: index('diff_change_sets_base_idx').on(t.baseVersionId),
		byResult: index('diff_change_sets_result_idx').on(t.resultVersionId)
	})
);

/**
 * Per-article redline rows. Kept as SQL (rather than moved into the
 * AKN-Diff XML as `<changeSet>` elements) until the redline UI
 * proves this is too slow — open question §4 in v3-plan.md. Faster
 * to query for the redline view that lists every changed article.
 */
export const ArticleChangeTable = sqliteTable(
	'diff_article_changes',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),

		changeSetId: text('change_set_id')
			.notNull()
			.references(() => ChangeSetTable.documentId, { onDelete: 'cascade' }),

		ordinal: integer('ordinal').notNull(),

		kind: text('kind').$type<ChangeKind>().notNull(),

		locatorOld: text('locator_old'),
		locatorNew: text('locator_new'),

		textOld: text('text_old'),
		textNew: text('text_new')
	},
	(t) => ({
		byChangeSet: index('diff_article_changes_set_idx').on(t.changeSetId, t.ordinal)
	})
);

// ──────────────────────────────────────────────────────────────────────
// THINGS WE DELIBERATELY DID NOT MODEL (carried over from v1 / v2)
// ──────────────────────────────────────────────────────────────────────
//
// - A unified persons table for legislators. Lives as JSONB on the
//   detail tables that need it (bill sponsors, amendment submitter,
//   question questioner, statement author). Promote when a customer
//   asks. AKN's TLCPerson framework lives in the XML — we just
//   flatten on extraction.
//
// - Cross-jurisdiction ontology mapping. AKN gives a TLCConcept
//   framework; we don't ship the mapping.
//
// - BPMN-style process model per country. The events table is enough.
//
// - i18n tables for status labels. UI translates client-side.
//
// - status_mapping table. Local→normalized mapping stays in code.
//
// - An XML extension for SQLite. SQL sees XML as opaque text. All
//   parsing happens in TypeScript.
//
// - jsonb-style queryable body projection. Considered and rejected
//   in v3-plan.md: the moment a query against the body becomes hot,
//   we promote it to a real SQL column or side table, at which point
//   the body's storage format is irrelevant.
//
// ──────────────────────────────────────────────────────────────────────
// WHAT v3 ADDED, IN ONE PARAGRAPH
// ──────────────────────────────────────────────────────────────────────
//
// Every document is a row in diff_documents holding the canonical
// AKN XML plus a small set of extracted index columns the demo joins
// on. Type-specific detail tables hold further extracted columns
// (BillTable.status, ActTable.promulgatedAt, etc.) — small, hand-
// picked, justified by the demo's hot queries. The XML is the source
// of truth; columns are projections, regenerated from the XML on
// every ingest. Versioning is at the document level: each meaningful
// change writes one row into diff_document_versions holding the
// full AKN XML at that point in time. Links are extracted from
// `<ref>` elements on ingest and written to diff_document_links;
// hand-authored manual links live alongside with `source = 'manual'`.
// The current row stays authoritative for reads; the versions table
// is a journal you query when you want history; the AKN-Diff
// renderer fetches two version-row XMLs and renders.
