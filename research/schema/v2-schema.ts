/**
 * ═════════════════════════════════════════════════════════════════════
 * MISSION (unchanged from v1)
 * ═════════════════════════════════════════════════════════════════════
 *
 * Build a SQL schema, heavily inspired by Akoma Ntoso, that can
 * represent the ENTIRE parliamentary ritual of MULTIPLE countries
 * inside ONE shared schema.
 *
 * v2 keeps that bet. What changes is how we handle history.
 *
 * ═════════════════════════════════════════════════════════════════════
 * WHAT'S NEW IN v2 — read this before anything else
 * ═════════════════════════════════════════════════════════════════════
 *
 * v1 only versioned the body text via diff_document_versions. Every
 * other field — status, sponsors, dates, type-specific extras — was
 * overwritten in place. That left real audit gaps (a sponsor change
 * disappeared silently) AND it conflated two unrelated design choices:
 *
 *   1. shared row vs. type extras  (identity vs. type-specific data)
 *   2. versioning                  (current state vs. history)
 *
 * v2 separates them. The shared/extras split stays as-is. Versioning
 * becomes its own concern with a clear, uniform rule.
 *
 * ── Two tiers per field ──
 *
 *   Tier 1 — UNVERSIONED. Overwritten in place. No history.
 *            Reserved for plumbing: ids, fingerprints, lastActivityAt,
 *            scrapingId, timestamps.
 *
 *   Tier 2 — VERSIONED. When a Tier 2 field changes, a new whole-document
 *            JSON snapshot is written into diff_document_versions.
 *            Old snapshots stay forever.
 *
 * Tier assignment is editorial — decided per-field, listed once at the
 * top of this file (see UNVERSIONED_FIELDS), uniform across countries.
 *
 * ── Snapshots, not changelogs ──
 *
 * We rejected a per-field changelog tier. Reasons:
 *   - Scrapers shouldn't compute "what specifically changed" — that's a
 *     diffing job we don't want to own.
 *   - "Show me the doc as of date T" is one row read, not an N-event
 *     replay.
 *   - Per-doc version counts will stay in single digits. Storage is not
 *     a constraint.
 *
 * ── Snapshots as JSON, not typed columns ──
 *
 * Each version row holds the WHOLE document state — shared fields +
 * type extras + body — serialized as JSON. The win: schema evolution
 * doesn't force backfills. A v2 snapshot stays a valid v2 snapshot
 * forever, even when v3 lands.
 *
 * The cost: rendering an old version requires reading JSON and adapting
 * it to the current display components. We accept that cost because old
 * versions are only displayed in two niche, read-only views ("doc as of
 * T" + the AKN-Diff side-by-side). Homepage feed, search, list pages,
 * detail pages all read the current row — they never touch JSON.
 *
 * ── Current row is authoritative ──
 *
 * The current row stays the source of truth for reads. The versions
 * table is a journal you query when you want history. Each is queried
 * independently, neither replaces the other.
 *
 * ── How a snapshot is produced ──
 *
 * The build script regenerates the DB from scratch on every run (the
 * research plan is explicit on this). So there's no "live diff against
 * a previous snapshot" code path — for each YAML, the build walks its
 * `versions:` array and writes one snapshot row per entry. The last
 * entry's state is also written to the current row + type-extras.
 *
 * That's it. No fingerprint comparison, no conditional inserts.
 * Re-scraping logic only matters in production; here, every build is
 * fresh.
 *
 * ─────────────────────────────────────────────────────────────────────
 * SCOPE (unchanged from v1)
 * ─────────────────────────────────────────────────────────────────────
 *   ✅ bill / act / amendment / judgment / journal /
 *      document_collection / question / communication / change_set
 *   🔧 debate / citation / statement / portion / doc
 *
 * ─────────────────────────────────────────────────────────────────────
 * SQLITE NOTES (unchanged from v1)
 * ─────────────────────────────────────────────────────────────────────
 * - No native enums. text().$type<Union>() for compile-time safety.
 * - No UUID. text + $defaultFn(crypto.randomUUID).
 * - JSON columns use text({ mode: 'json' }), backed by SQLite's json1.
 * - Timestamps use integer({ mode: 'timestamp_ms' }).
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
// TIER 1 — UNVERSIONED FIELDS
// ──────────────────────────────────────────────────────────────────────

/**
 * Listed once, in code, so the rule is enforced uniformly across all
 * document types and isn't redecided per table.
 *
 * The build script uses this list to STRIP these fields out of the
 * JSON snapshot before writing it to diff_document_versions — they
 * have no business being in history because they aren't historical
 * data. They're plumbing.
 *
 * Treat this list as living. Anything we discover doesn't belong in
 * history (a debugging field, a derived counter, a join key) gets
 * added here. The price of getting it wrong is small: a versioned
 * field that should have been Tier 1 just produces a few junk
 * snapshot rows; a Tier 1 field that should have been versioned
 * means we silently lose audit info — so when in doubt, version it.
 */
export const UNVERSIONED_FIELDS = [
	'id',
	'type',
	'countryCode',
	'nativeId',
	'lastActivityAt',
	'fingerprint',
	'scrapingId',
	'createdAt',
	'updatedAt'
] as const;

export type UnversionedField = (typeof UNVERSIONED_FIELDS)[number];

/**
 * Marker bumped whenever we make a structural change to the snapshot
 * shape. Stored on every version row as `_schemaVersion`. Old snapshots
 * keep their original marker forever — this is how a v3 reader knows it
 * needs to adapt a v2-shaped JSON blob.
 */
export const SCHEMA_VERSION = 2 as const;

// ──────────────────────────────────────────────────────────────────────
// TYPE UNIONS (sqlite has no enums; these are TS-only)
// ──────────────────────────────────────────────────────────────────────
// Carried over from v1 unchanged. The discrimination model didn't move
// — just versioning did.

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

export type ChangeSetSource = 'gov_site' | 'computed' | 'extracted' | 'inferred' | 'manual';

// ──────────────────────────────────────────────────────────────────────
// COUNTRIES — unchanged from v1
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
// DOCUMENTS — the shared base
// ──────────────────────────────────────────────────────────────────────

/**
 * Identity row + current state of every Tier 2 (versioned) field that
 * is shared across types.
 *
 * Reads always go through this row — it's the truth. The versions
 * table is the journal.
 *
 * The columns below are split into the two tiers in comments. The
 * physical schema doesn't enforce the split (SQLite has no such
 * concept); the build script does, by stripping UNVERSIONED_FIELDS
 * from the snapshot JSON before writing.
 */
export const DocumentTable = sqliteTable(
	'diff_documents',
	{
		// ── Tier 1 (UNVERSIONED) ────────────────────────────────────────

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
		 * Doc-level fingerprint. Used in production to detect change for
		 * cascade events. In the research build it's just metadata —
		 * every build rebuilds from scratch.
		 */
		fingerprint: text('fingerprint').notNull(),

		/** Join key into the main app's scraping_history. */
		scrapingId: text('scraping_id').notNull(),

		/**
		 * Last time anything about this doc was updated upstream. Mirrors
		 * scraping_history.last_seen_at semantics. Updates in place — no
		 * snapshot is written when only this changes.
		 */
		lastActivityAt: integer('last_activity_at', { mode: 'timestamp_ms' }).notNull(),

		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.notNull()
			.$defaultFn(() => new Date()),

		// ── Tier 2 (VERSIONED) ──────────────────────────────────────────
		// These mirror the LATEST snapshot. They're here so the homepage
		// feed, search, list and detail pages can read a single row
		// without joining the versions table. When any of these changes,
		// the build writes a new snapshot.

		/** Free-text title as published, in the source language. */
		title: text('title').notNull(),

		/**
		 * Subject/topic tags as published. NOT normalized cross-country.
		 */
		topics: text('topics', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),

		/** Source language code: 'es', 'en', 'fr', etc. */
		language: text('language').notNull().default('es'),

		/**
		 * Typed body — schema KNOWN per type. Versioned. Kept on the
		 * current row (Q2 answer in v2-plan.md) for fast reads;
		 * duplicates the latest snapshot's body field. The build script
		 * is the single writer of both, so drift is structurally
		 * impossible — we trade a tiny bit of duplication for one fewer
		 * join on every detail page.
		 */
		body: text('body', { mode: 'json' }).$type<unknown>().notNull().default(sql`'{}'`),

		/**
		 * Country-only fields the shared schema doesn't have a home for.
		 * Versioned along with everything else: a country-specific
		 * status that flips silently is exactly the kind of thing we
		 * want history for.
		 */
		countrySpecific: text('country_specific', { mode: 'json' })
			.$type<Record<string, unknown>>()
			.notNull()
			.default(sql`'{}'`),

		/** Canonical URL on the gov site. */
		sourceUrl: text('source_url').notNull(),

		/**
		 * When the gov site itself published / dated this document.
		 * Different from createdAt (when WE first saw it).
		 */
		publishedAt: integer('published_at', { mode: 'timestamp_ms' }).notNull()
	},
	(t) => ({
		naturalKey: uniqueIndex('diff_docs_natural_key').on(t.countryCode, t.type, t.nativeId),
		byCountryActivity: index('diff_docs_country_activity_idx').on(
			t.countryCode,
			t.lastActivityAt
		),
		byCountryType: index('diff_docs_country_type_idx').on(t.countryCode, t.type),
		byScrapingId: uniqueIndex('diff_docs_scraping_id_idx').on(t.scrapingId)
	})
);

// ──────────────────────────────────────────────────────────────────────
// DOCUMENT VERSIONS — JSON snapshots, append-only
// ──────────────────────────────────────────────────────────────────────

/**
 * The journal. One row per snapshot of the whole document.
 *
 * What changed vs v1:
 *   - v1 versioned only the body text (sourceUrl/storageUrl/extractedText
 *     per version). Type-specific fields had no history.
 *   - v2 stores the WHOLE document state — shared row + type extras +
 *     body — as JSON in `snapshot`. Any meaningful change writes a new
 *     row.
 *
 * Why JSON over typed per-type version tables: schema evolution.
 * A v2 snapshot stays a valid v2 snapshot forever; when v3 lands and
 * adds/renames fields, old rows are not invalidated. The reader adapts
 * the JSON to the current display shape using `_schemaVersion`.
 *
 * Reads:
 *   - Current state: never touches this table. Read DocumentTable.
 *   - "Doc as of T":  ORDER BY publishedAt DESC LIMIT 1 WHERE <= T.
 *   - Side-by-side diff: two rows by id, hand to the AKN-Diff renderer.
 *
 * Writes (in the research build): one row per entry of the YAML's
 * `versions:` array. No live-diff logic — the build is fresh every run.
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
		 * stable identity, timestamps give a calendar — we keep both
		 * (Q7 in v2-plan.md).
		 */
		version: integer('version').notNull(),

		/** When this version was published / dated by the gov site. */
		publishedAt: integer('published_at', { mode: 'timestamp_ms' }).notNull(),

		/**
		 * The whole document state at this version, as JSON. Shape
		 * matches the document's read view: shared Tier-2 fields +
		 * type-specific extras + body, with a `_schemaVersion` marker
		 * (== SCHEMA_VERSION at the time of writing) so future readers
		 * can detect old shapes.
		 *
		 * Tier 1 fields are stripped before the write — they aren't
		 * historical data.
		 */
		snapshot: text('snapshot', { mode: 'json' })
			.$type<{
				_schemaVersion: number;
				// shared Tier 2 fields:
				title: string;
				topics: string[];
				language: string;
				body: unknown;
				countrySpecific: Record<string, unknown>;
				sourceUrl: string;
				publishedAt: number;
				// type-specific extras nested under their type's key, e.g.
				//   bill: { status, statusLocal, sponsors, ... }
				//   act:  { status, promulgatedAt, effectiveAt, ... }
				// Loose typing here is on purpose — the row's
				// `documentType` column tells you which extras to expect.
				typeExtras?: Record<string, unknown>;
			}>()
			.notNull(),

		/**
		 * Free-form note explaining WHY this snapshot exists.
		 *   "new amendment text published on bcn.cl"
		 *   "daily re-scrape, structural fields differ"
		 *   "manual correction: sponsor list typo"
		 *
		 * Not parsed by the app. Just useful for humans poking at the
		 * history. Optional.
		 */
		changeNote: text('change_note'),

		/**
		 * Discriminator copied from the document at write time, so the
		 * snapshot is self-describing without a join. Lets a tool dump
		 * the versions table and know what it's looking at.
		 */
		documentType: text('document_type').$type<DocumentType>().notNull(),

		/**
		 * Optional pointer to the original file on the gov site for
		 * THIS version. (v1 had this on every version row; we keep it
		 * because it's genuinely useful — different versions of an act
		 * often have different gov-site URLs.) Null if same as the
		 * document's sourceUrl.
		 */
		sourceUrl: text('source_url'),

		/** Where we mirrored it. Null until we fetch. */
		storageUrl: text('storage_url'),

		/** Plain-text extraction for FTS + AI. Null until extracted. */
		extractedText: text('extracted_text'),

		mimeType: text('mime_type'),

		/** Hash of the snapshot's content. */
		fingerprint: text('fingerprint').notNull(),

		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(t) => ({
		uniqueVersion: uniqueIndex('diff_doc_versions_unique').on(t.documentId, t.version),
		byDoc: index('diff_doc_versions_doc_idx').on(t.documentId, t.version),
		// "Doc as of date T": find the latest version <= T.
		byDocPublished: index('diff_doc_versions_published_idx').on(t.documentId, t.publishedAt)
	})
);

// ──────────────────────────────────────────────────────────────────────
// DOCUMENT LINKS — the graph, now versioned
// ──────────────────────────────────────────────────────────────────────

/**
 * The graph IS the "navigate like the web" idea, stored relationally.
 *
 * What changed vs v1: links are versioned (Q4 answer in v2-plan.md).
 *
 * The shape we use is "append-only with active flag", NOT a per-link
 * version history. Reasoning:
 *   - Snapshots already capture rich per-doc history. Per-link
 *     history would multiply the surface area for marginal value.
 *   - The interesting question for links is "did this edge exist on
 *     date T?", which an active-flag + activatedAt/deactivatedAt pair
 *     answers cleanly.
 *   - Re-creating the same edge after a deactivation creates a new
 *     row, not an update — so the audit trail is intact.
 *
 * Active reads (the common case) filter `WHERE deactivated_at IS NULL`.
 * History reads (rare) walk the table.
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
		 * Order within the source. Used by document_collection (dossier
		 * order) and journal (publication order). Null when irrelevant.
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
		 * When this edge was first observed. Lets us answer "did this
		 * link exist on date T?" without scanning snapshots.
		 */
		activatedAt: integer('activated_at', { mode: 'timestamp_ms' })
			.notNull()
			.$defaultFn(() => new Date()),

		/**
		 * Set when the edge stops existing upstream (citation removed,
		 * amendment retracted). Null = currently active. Append-only:
		 * we never DELETE rows. If the edge comes back, it's a NEW row
		 * with a fresh activatedAt — preserves the full graph history.
		 */
		deactivatedAt: integer('deactivated_at', { mode: 'timestamp_ms' }),

		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(t) => ({
		// Outgoing edges, active-first.
		byFrom: index('diff_links_from_idx').on(t.fromId, t.relation, t.deactivatedAt),
		// Incoming edges — "what points at this doc?"
		byTo: index('diff_links_to_idx').on(t.toId, t.relation, t.deactivatedAt),
		// "Did this edge exist on T?" range scan.
		byActivation: index('diff_links_activation_idx').on(t.fromId, t.toId, t.activatedAt)
		// NOTE: no uniqueEdge index in v2. The same (from, to, relation,
		// source) tuple can legitimately appear multiple times across
		// time (deactivated and re-activated). De-duping is the build
		// script's job: when re-loading from YAML, only one row per
		// active edge should exist at any moment.
	})
);

// ──────────────────────────────────────────────────────────────────────
// PER-TYPE DETAIL TABLES — current state only
// ──────────────────────────────────────────────────────────────────────
// One row per matching DocumentTable row (1:1, FK cascade delete).
// These hold the LATEST values of type-specific Tier-2 fields. History
// for these fields lives inside the snapshot JSON in
// diff_document_versions, under typeExtras.
//
// Why mirror the latest values here when they're already in the
// snapshot? Same reason as DocumentTable.body: detail-page reads stay
// a single JOIN, no JSON parsing.

// ─────────────── BILLS ───────────────

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
		 * Sponsors as JSONB. Versioned in the snapshot (a sponsor join /
		 * leave produces a new snapshot row). Kept inline because we
		 * still don't have a persons table — that's deliberately out of
		 * scope (see v2-plan.md §4).
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
		 * Pointer to the act this bill is amending, if any. Same info
		 * as a DocumentLinkTable row with relation='amends'; this column
		 * just makes the common case a single-table read.
		 */
		amendsActId: text('amends_act_id').references(() => DocumentTable.id),

		/** Urgency tier. */
		urgency: text('urgency')
	},
	(t) => ({
		byStatus: index('diff_bills_status_idx').on(t.status),
		byAmendsAct: index('diff_bills_amends_act_idx').on(t.amendsActId)
	})
);

/**
 * The trámite log. Append-only, captures status transitions
 * EXPLICITLY — complements the snapshot model (snapshots show state,
 * events show transitions).
 *
 * Event rows are themselves Tier 1 (no per-event versioning). If an
 * event is corrected upstream, we either INSERT a corrective event or
 * UPDATE in place + accept the small audit gap. The bill snapshot
 * captures status changes; events capture HOW the transition happened.
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
		 * snapshot in DocumentVersionTable).
		 */
		producedDocumentId: text('produced_document_id').references(() => DocumentTable.id),

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
 * amendment produces a new consolidated text snapshot in
 * DocumentVersionTable.
 *
 * Status changes (in_force → partially_repealed → repealed) are
 * Tier 2: each transition produces a new snapshot. The CURRENT status
 * mirror lives here.
 */
export const ActTable = sqliteTable(
	'diff_acts',
	{
		documentId: text('document_id')
			.primaryKey()
			.references(() => DocumentTable.id, { onDelete: 'cascade' }),

		status: text('status').$type<ActStatus>().notNull(),

		/** When the act became law. Rarely changes; still Tier 2. */
		promulgatedAt: integer('promulgated_at', { mode: 'timestamp_ms' }).notNull(),
		/** When it took effect (often promulgated + N days). */
		effectiveAt: integer('effective_at', { mode: 'timestamp_ms' }),
		/** When repealed, if applicable. */
		repealedAt: integer('repealed_at', { mode: 'timestamp_ms' }),

		/** Issuing body. Free text since values vary cross-country. */
		issuingBody: text('issuing_body').notNull(),

		/** Where the act was officially published. */
		publicationJournalId: text('publication_journal_id').references(() => DocumentTable.id)
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

		/** Free text. Different countries express locators differently. */
		targetLocator: text('target_locator'),

		textOld: text('text_old'),
		textNew: text('text_new'),
		justification: text('justification'),

		submitter: text('submitter', { mode: 'json' })
			.$type<{ name: string; party?: string; chamber?: string; externalId?: string }>()
			.notNull(),

		submittedAt: integer('submitted_at', { mode: 'timestamp_ms' }).notNull(),

		outcome: text('outcome').$type<AmendmentOutcome>().notNull().default('pending'),
		votedAt: integer('voted_at', { mode: 'timestamp_ms' }),

		/**
		 * Vote tallies once recorded. Versioned along with the rest of
		 * the row — the snapshot history lets you see the moment the
		 * outcome flipped from 'pending' to 'approved'.
		 */
		voteRecord: text('vote_record', { mode: 'json' }).$type<{
			for?: number;
			against?: number;
			abstain?: number;
			forNames?: string[];
			againstNames?: string[];
			abstainNames?: string[];
		}>()
	},
	(t) => ({
		byTargetBill: index('diff_amendments_target_bill_idx').on(t.targetBillId),
		byOutcome: index('diff_amendments_outcome_idx').on(t.outcome)
	})
);

// ─────────────── JUDGMENTS ───────────────

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

		parties: text('parties', { mode: 'json' })
			.$type<Array<{ role: string; name: string; representedBy?: string }>>()
			.notNull()
			.default(sql`'[]'`),

		/** Short ruling summary. Full text lives in the snapshot. */
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

		isAutoMaintained: integer('is_auto_maintained', { mode: 'boolean' }).notNull().default(true)
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
			.$type<{ name: string; party?: string; chamber?: string; externalId?: string }>()
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

		refersToDocumentId: text('refers_to_document_id').references(() => DocumentTable.id)
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

export const DebateTable = sqliteTable(
	'diff_debates',
	{
		documentId: text('document_id')
			.primaryKey()
			.references(() => DocumentTable.id, { onDelete: 'cascade' }),

		chamber: text('chamber').notNull(),

		sessionStartedAt: integer('session_started_at', { mode: 'timestamp_ms' }).notNull(),
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

export const CitationTable = sqliteTable(
	'diff_citations',
	{
		documentId: text('document_id')
			.primaryKey()
			.references(() => DocumentTable.id, { onDelete: 'cascade' }),

		convenedBody: text('convened_body').notNull(),

		scheduledFor: integer('scheduled_for', { mode: 'timestamp_ms' }).notNull(),
		location: text('location'),

		agendaItems: text('agenda_items', { mode: 'json' })
			.$type<
				Array<{
					ordinal: number;
					title: string;
					referencesDocumentId?: string;
				}>
			>()
			.notNull()
			.default(sql`'[]'`),

		externalRef: text('external_ref', { mode: 'json' }).$type<{
			citationId?: number;
			url?: string;
		}>()
	},
	(t) => ({
		byScheduled: index('diff_citations_scheduled_idx').on(t.scheduledFor)
	})
);

// ─────────────── CHANGE SETS (the AKN Diff extension) ───────────────

/**
 * AKN Diff stays in v2 (Q3 in v2-plan.md). The base/result version
 * pointers still resolve cleanly because DocumentVersionTable still
 * exists — its rows just hold JSON snapshots now instead of body-only
 * text rows.
 *
 * The two tables below are unchanged from v1 in shape. The only thing
 * that's different is what the version pointers RESOLVE to (a snapshot,
 * not a body row).
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

		resultVersionId: text('result_version_id').references(() => DocumentVersionTable.id),

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
// THINGS WE DELIBERATELY DID NOT MODEL (unchanged from v1)
// ──────────────────────────────────────────────────────────────────────
//
// - A unified persons table for legislators. Lives as JSONB on the
//   types that need it (bill sponsors, amendment submitter, question
//   questioner, statement author). Promote when a customer asks.
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
// ──────────────────────────────────────────────────────────────────────
// WHAT v2 ADDED, IN ONE PARAGRAPH
// ──────────────────────────────────────────────────────────────────────
//
// Every document is a row in diff_documents plus a row in a type-
// specific table. Every meaningful change to that document writes a
// new JSON snapshot into diff_document_versions — append-only, with
// an optional human-written changeNote, readable as of any point in
// the past. Pure plumbing fields (UNVERSIONED_FIELDS) are excluded
// from versioning and overwrite freely. Links are append-only with an
// active flag, so the graph itself has history. Change sets carry
// over from v1, pointing at version rows that now hold whole-document
// snapshots. The current row stays authoritative for reads; the
// versions table is a journal you query when you want history.
