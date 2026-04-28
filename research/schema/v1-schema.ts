/**
 * ═════════════════════════════════════════════════════════════════════
 * MISSION
 * ═════════════════════════════════════════════════════════════════════
 *
 * Build a SQL schema, heavily inspired by Akoma Ntoso, that can
 * represent the ENTIRE parliamentary ritual of MULTIPLE countries
 * inside ONE shared schema.
 *
 * The bet: as many shared, country-agnostic types as possible, without
 * collapsing under the weight of every country's edge cases. Where
 * countries genuinely diverge, the divergence lives in well-defined
 * escape hatches (countrySpecific JSONB, statusLocal, etc.) — never as
 * country-specific tables or branching schemas.
 *
 * Success looks like:
 *   - The same schema mirrors a Chilean boletín, a Spanish proyecto, a
 *     EU procedure, a Peruvian decreto — without per-country tables.
 *   - The same UI components render any of them, by reading the same
 *     columns + their type-specific detail row.
 *   - "Show me how this bill became this act, with every step in
 *     between" is one connected graph, regardless of country.
 *
 * Non-goals (intentionally):
 *   - Being a clean, finished AKN implementation. We borrow the model,
 *     not the XML.
 *   - Cross-jurisdiction ontology mapping ("Senate" ≡ "Cámara Alta").
 *     Out of scope until we have a customer who needs it.
 *
 * ═════════════════════════════════════════════════════════════════════
 *
 * diff-schema.ts — EXPLORATORY DRAFT, NOT WIRED UP
 * Target: SQLite (drizzle-orm/sqlite-core) so we can spin up a local DB
 * per country and play with shapes before committing to Postgres.
 *
 * ─────────────────────────────────────────────────────────────────────
 * SCOPE
 * ─────────────────────────────────────────────────────────────────────
 * All AKN primitives modeled. Some in detail, some as skeletons we'll
 * flesh out as the research progresses:
 *   ✅ bill
 *   ✅ act
 *   ✅ amendment
 *   ✅ judgment
 *   ✅ journal (officialGazette)
 *   ✅ document_collection
 *   ✅ question
 *   ✅ communication
 *   ✅ change_set    (the AKN Diff redline extension; rough, exploratory)
 *   🔧 debate        (lightweight; main app's transcripts stays authoritative)
 *   🔧 citation      (lightweight; main app's existing scrape stays authoritative)
 *   🔧 statement
 *   🔧 portion
 *   🔧 doc (generic catchall)
 *
 * Why include debate/citation here at all if the main app handles them?
 * So this schema can describe the WHOLE ritual end-to-end as a connected
 * graph (bill → debate → vote → act → journal → ...). The detail tables
 * stay thin — they're mostly link targets pointing back at the main
 * app's authoritative transcript / citation data via externalRef.
 *
 * ─────────────────────────────────────────────────────────────────────
 * SQLITE NOTES
 * ─────────────────────────────────────────────────────────────────────
 * - No native enums. We use `text().$type<Union>()` for compile-time
 *   safety. Run-time checks happen at the API boundary.
 * - No UUID type. We use `text` + `$defaultFn(crypto.randomUUID)`.
 * - JSON columns use `text({ mode: 'json' })` — backed by SQLite's json1.
 * - Timestamps use `integer({ mode: 'timestamp_ms' })` for cheap sorting.
 * - We DO create our own CountryTable here. The main app already has one,
 *   but this schema lives in its own research project and stays self-
 *   contained until/unless we lift it into the main DB.
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
// TYPE UNIONS (sqlite has no enums; these are TS-only)
// ──────────────────────────────────────────────────────────────────────

/**
 * The full set of document types we mirror. Drives the discriminator on
 * DocumentTable.type and the link table endpoints.
 */
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

/**
 * Bill lifecycle, country-agnostic. Each country's raw status string maps
 * to one of these. Local string is preserved on BillTable.statusLocal.
 */
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

/** Act lifecycle. Acts can be amended or repealed without disappearing. */
export type ActStatus =
	| 'in_force'
	| 'partially_repealed'
	| 'repealed'
	| 'superseded' // replaced by a newer act covering same matter
	| 'suspended';

/** Question / parliamentary query lifecycle. */
export type QuestionStatus =
	| 'submitted'
	| 'admitted'
	| 'pending_response'
	| 'answered'
	| 'overdue'
	| 'withdrawn'
	| 'inadmissible';

/** Amendment outcome (set after the vote). */
export type AmendmentOutcome =
	| 'pending'
	| 'approved'
	| 'rejected'
	| 'withdrawn'
	| 'inadmissible'
	| 'merged'; // merged into another amendment

/** Court instance for judgments — broad strokes that work cross-country. */
export type JudgmentInstance =
	| 'first'
	| 'appeal'
	| 'supreme'
	| 'constitutional'
	| 'administrative'
	| 'other';

/**
 * Typed relations for the document graph. Active voice from→to.
 * Examples:
 *   bill --amends--> act
 *   amendment --modifies--> bill
 *   journal --promulgates--> act
 *   communication --refers_to--> bill
 *   document_collection --contains--> bill
 *   judgment --interprets--> act
 *   bill --responds_to--> question
 */
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

/** How a link entered our DB. Drives trust + UI affordances. */
export type LinkSource = 'gov_site' | 'extracted' | 'inferred' | 'manual';

/**
 * Kind of article-level change inside a changeSet. Borrowed directly
 * from the AKN Diff exploration. Rough — we'll discover more as we
 * look at real data.
 */
export type ChangeKind =
	| 'modify'
	| 'insert'
	| 'repeal'
	| 'renumber'
	| 'renumber_modify'
	| 'replace_block';

/**
 * Where a changeSet came from. Mirrors LinkSource semantics — most
 * changeSets will be 'computed' (we ran a diff between two text
 * versions) or 'extracted' (we parsed it out of an amendment text).
 */
export type ChangeSetSource = 'gov_site' | 'computed' | 'extracted' | 'inferred' | 'manual';

// ──────────────────────────────────────────────────────────────────────
// COUNTRIES
// ──────────────────────────────────────────────────────────────────────

/**
 * The countries this schema mirrors. Standalone copy of the main app's
 * `countries` table — kept minimal here. We only need the fields the
 * research schema actually uses; operational fields (review schedules,
 * cron, etc.) stay in the main app.
 *
 * Seed it with: 'cl', 'es', 'eu', 'pe', 'us' to match Parlamento.ai's
 * current footprint.
 */
export const CountryTable = sqliteTable('diff_countries', {
	/** ISO-ish code: 'cl', 'es', 'eu', 'pe', 'us'. */
	code: text('code').primaryKey(),

	/** Display name in the source language: "Chile", "España", ... */
	name: text('name').notNull(),

	/** IANA timezone used for date/time interpretation. */
	defaultTimezone: text('default_timezone').notNull(),

	/**
	 * Whether this country has sub-jurisdictions we mirror separately
	 * (Spain's CCAAs, US states, EU member states). Doesn't change the
	 * schema, just signals that journal.scope='regional' rows are
	 * expected.
	 */
	hasRegions: integer('has_regions', { mode: 'boolean' }).notNull().default(false),

	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.notNull()
		.$defaultFn(() => new Date())
});

// ──────────────────────────────────────────────────────────────────────
// DOCUMENTS — the shared base
// ──────────────────────────────────────────────────────────────────────

/**
 * Every mirrored artifact has exactly one row here, regardless of type.
 *
 * This is the table the link graph references. It's also the table the
 * UI hits when rendering "any document" views (search, recent activity,
 * generic header). The type-specific tables below add the extras.
 *
 * Identity rule: (countryCode, type, nativeId) is the natural key.
 * The same boletín number is unique within Chile but a Spanish bill can
 * coincidentally have the same string — never the same row.
 */
export const DocumentTable = sqliteTable(
	'diff_documents',
	{
		/** UUID. We generate client-side. */
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),

		/** Discriminator. Determines which detail table to JOIN. */
		type: text('type').$type<DocumentType>().notNull(),

		/** ISO country code: 'cl', 'es', 'eu', 'pe', 'us'. */
		countryCode: text('country_code')
			.notNull()
			.references(() => CountryTable.code),

		/**
		 * The id the gov site uses. Stable for the doc's lifetime.
		 *   bill (cl)         "12345-07"  (boletín)
		 *   act (cl)          "Ley 21.000"
		 *   journal (cl)      "DO-2026-04-27" (issue id we synthesize)
		 *   judgment (cl)     "Rol 12345-2024" (corte suprema)
		 *   eu bill           "COD/2024/0123" (procedure ref)
		 */
		nativeId: text('native_id').notNull(),

		/** Free-text title as published, in the source language. */
		title: text('title').notNull(),

		/**
		 * Subject/topic tags as published. NOT normalized cross-country —
		 * cross-country topic mapping is its own ontology problem.
		 */
		topics: text('topics', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),

		/** Source language code: 'es', 'en', 'fr', etc. From gov site. */
		language: text('language').notNull().default('es'),

		/**
		 * Typed body — schema KNOWN per type. Defined as a discriminated
		 * union elsewhere (one TS type per DocumentType).
		 *
		 * For bills: { summary, fundamentos, articulos[] }
		 * For acts:  { preamble, articulos[], annexes[] }
		 * For journals: { issue_metadata, summary }
		 * etc.
		 */
		body: text('body', { mode: 'json' }).$type<unknown>().notNull().default(sql`'{}'`),

		/**
		 * Country-only fields the shared schema doesn't have a home for.
		 * Loose on purpose — fields here can be promoted to columns once
		 * we see them across 2+ countries.
		 */
		countrySpecific: text('country_specific', { mode: 'json' })
			.$type<Record<string, unknown>>()
			.notNull()
			.default(sql`'{}'`),

		/** Canonical URL on the gov site. */
		sourceUrl: text('source_url').notNull(),

		/**
		 * scraping_history.scraping_id — the existing infra tracks change
		 * detection there; this column is the join key. We don't put a
		 * SQLite FK constraint because in real life that table lives in
		 * Postgres on the main app DB. In the SQLite test rig we just
		 * mirror the string.
		 */
		scrapingId: text('scraping_id').notNull(),

		/**
		 * Doc-level fingerprint: hash of meaningful structural fields.
		 * NOT the same as scraping_history.fingerprint (which can be
		 * coarser). Drives cascade events to downstream consumers.
		 */
		fingerprint: text('fingerprint').notNull(),

		/**
		 * When the gov site itself published / dated this document.
		 * Different from createdAt (when WE first saw it).
		 */
		publishedAt: integer('published_at', { mode: 'timestamp_ms' }).notNull(),

		/**
		 * Last time anything about this doc was updated upstream. Mirrors
		 * scraping_history.last_seen_at semantics, but at the doc level.
		 */
		lastActivityAt: integer('last_activity_at', { mode: 'timestamp_ms' }).notNull(),

		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(t) => ({
		naturalKey: uniqueIndex('diff_docs_natural_key').on(t.countryCode, t.type, t.nativeId),
		// "Recent activity in country X" — the homepage feed query.
		byCountryActivity: index('diff_docs_country_activity_idx').on(
			t.countryCode,
			t.lastActivityAt
		),
		// "All documents of type X in country Y" — list pages.
		byCountryType: index('diff_docs_country_type_idx').on(t.countryCode, t.type),
		// scraping_history → document join
		byScrapingId: uniqueIndex('diff_docs_scraping_id_idx').on(t.scrapingId)
	})
);

// ──────────────────────────────────────────────────────────────────────
// DOCUMENT VERSIONS — generic versioning for any doc
// ──────────────────────────────────────────────────────────────────────

/**
 * Replaces v1's BillDocumentTable. Any document type can have versions:
 *   - Acts: each amendment produces a new consolidated text version.
 *   - Bills: each tramite stage may revise the text.
 *   - Judgments: rare but possible (errata, redactions).
 *   - Questions: an amended question text.
 *
 * The "current" version of a doc is the highest version number.
 * Old versions are preserved forever — never DELETE, only INSERT.
 *
 * Sub-artifacts that are NOT text versions of THIS doc (e.g. a comisión
 * report that informs a bill) are SEPARATE documents (type='doc') linked
 * via DocumentLinkTable. That keeps "version of" and "produced during"
 * distinct, which they are.
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

		/** Monotonic. Highest = current. */
		version: integer('version').notNull(),

		/** When this version was published / dated by the gov site. */
		publishedAt: integer('published_at', { mode: 'timestamp_ms' }).notNull(),

		/** Where the original file lives on the gov site. */
		sourceUrl: text('source_url').notNull(),

		/** Where we mirrored it (S3 / R2). Null until we fetch. */
		storageUrl: text('storage_url'),

		/** Plain-text extraction for FTS + AI. Null until extracted. */
		extractedText: text('extracted_text'),

		mimeType: text('mime_type'),

		/** Hash of the version's content. */
		fingerprint: text('fingerprint').notNull(),

		/**
		 * Optional: machine-readable structured representation. This is
		 * where AKN XML or our own structured JSON lives once we get to
		 * the conversion phase. Null for now.
		 */
		structured: text('structured', { mode: 'json' }).$type<unknown>(),

		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(t) => ({
		uniqueVersion: uniqueIndex('diff_doc_versions_unique').on(t.documentId, t.version),
		byDoc: index('diff_doc_versions_doc_idx').on(t.documentId, t.version)
	})
);

// ──────────────────────────────────────────────────────────────────────
// DOCUMENT LINKS — the graph
// ──────────────────────────────────────────────────────────────────────

/**
 * Now non-polymorphic: both endpoints are FKs to DocumentTable.id.
 * Real referential integrity, real cascade, easy joins both directions.
 *
 * The graph IS the "navigate like the web" idea from the Diff project,
 * just stored relationally. Every row is a typed hyperlink.
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

		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(t) => ({
		// Outgoing links — "what does this doc point to?"
		byFrom: index('diff_links_from_idx').on(t.fromId, t.relation),
		// Incoming links — "what points at this doc?" (the killer query
		// for "every bill that amends this act", etc.)
		byTo: index('diff_links_to_idx').on(t.toId, t.relation),
		// Don't double-record the same edge from the same source.
		uniqueEdge: uniqueIndex('diff_links_unique').on(
			t.fromId,
			t.toId,
			t.relation,
			t.source
		)
	})
);

// ──────────────────────────────────────────────────────────────────────
// PER-TYPE DETAIL TABLES
// ──────────────────────────────────────────────────────────────────────
// One row per matching DocumentTable row (1:1, FK with cascade delete).
// Holds ONLY the fields specific to that type. Anything generic stays
// on DocumentTable.
//
// Convention: detail table primary key IS the document_id. This enforces
// the 1:1 and makes joins natural.

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
		 * Sponsors as JSONB until a customer asks "all bills by X across
		 * countries", at which point we lift to a proper persons table.
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
		 * Pointer to the act this bill is amending, if any. Bills that
		 * create new law (no amendment) have null here. Same info exists
		 * in DocumentLinkTable as 'amends', this column just makes the
		 * common case a single-table read.
		 */
		amendsActId: text('amends_act_id').references(() => DocumentTable.id),

		/** Urgency tier (Chile's urgencia simple/suma/discusión inmediata). */
		urgency: text('urgency')
	},
	(t) => ({
		byStatus: index('diff_bills_status_idx').on(t.status),
		byAmendsAct: index('diff_bills_amends_act_idx').on(t.amendsActId)
	})
);

/**
 * The trámite log. One row = one observed step in the bill's life.
 * Append-mostly. The bill's currentStatus is derived from the latest row.
 *
 * Stays bill-specific. Other types could grow their own event tables
 * (act amendments, judgment appeals) if/when needed.
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

		/** Order within the bill. */
		sequence: integer('sequence').notNull(),

		occurredAt: integer('occurred_at', { mode: 'timestamp_ms' }).notNull(),

		/** Normalized step. Cross-country comparable. */
		actionType: text('action_type').notNull(),
		/** Raw country-language description. */
		actionTypeLocal: text('action_type_local').notNull(),

		chamber: text('chamber'),

		/**
		 * If the step produced a document (informe, oficio, vote record,
		 * indicaciones batch, ...), it's a SEPARATE document linked here.
		 * Distinct from a text revision of the bill itself, which lives in
		 * DocumentVersionTable.
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
 * An act is a promulgated law. Acts have versions over time (each
 * amendment produces a new consolidated text in DocumentVersionTable).
 */
export const ActTable = sqliteTable(
	'diff_acts',
	{
		documentId: text('document_id')
			.primaryKey()
			.references(() => DocumentTable.id, { onDelete: 'cascade' }),

		status: text('status').$type<ActStatus>().notNull(),

		/** When the act became law. */
		promulgatedAt: integer('promulgated_at', { mode: 'timestamp_ms' }).notNull(),
		/** When it took effect (often promulgated + N days). */
		effectiveAt: integer('effective_at', { mode: 'timestamp_ms' }),
		/** When repealed, if applicable. */
		repealedAt: integer('repealed_at', { mode: 'timestamp_ms' }),

		/**
		 * Issuing body. Free text since values vary cross-country and
		 * across types (legislature vs. executive decree).
		 *   "Congreso Nacional"  / "Presidente de la República"  /
		 *   "Parlamento Europeo" / "Cortes Generales"
		 */
		issuingBody: text('issuing_body').notNull(),

		/**
		 * Where the act was officially published. Normally a journal
		 * (DocumentTable row of type='journal'). This is the legal
		 * publication of record.
		 */
		publicationJournalId: text('publication_journal_id').references(() => DocumentTable.id)
	},
	(t) => ({
		byStatus: index('diff_acts_status_idx').on(t.status),
		byPromulgated: index('diff_acts_promulgated_idx').on(t.promulgatedAt)
	})
);

// ─────────────── AMENDMENTS ───────────────

/**
 * A proposed modification to a bill. In Chile = "indicación".
 * Amendments come in batches (boletines de indicaciones). The batch is
 * a document_collection; each amendment is its own row here, linked from
 * the collection via DocumentLinkTable (relation='contains').
 *
 * NOTE: the COMPUTED diff/changeSet is intentionally absent. That was
 * the AKN Diff research; we parked it. When we revive it, it goes in
 * DocumentVersionTable.structured, not here.
 */
export const AmendmentTable = sqliteTable(
	'diff_amendments',
	{
		documentId: text('document_id')
			.primaryKey()
			.references(() => DocumentTable.id, { onDelete: 'cascade' }),

		/** The bill this amendment targets. Required. */
		targetBillId: text('target_bill_id')
			.notNull()
			.references(() => DocumentTable.id),

		/**
		 * Which article(s) of the target bill. Free text — different
		 * countries express this differently ("art. 3 inciso 2", "§ 4",
		 * "Article 3(2)", etc.). UI renders verbatim.
		 */
		targetLocator: text('target_locator'),

		/** Old text (as bill stood when amendment submitted). */
		textOld: text('text_old'),
		/** Proposed new text. */
		textNew: text('text_new'),

		/** Free-text justification by the proposer. */
		justification: text('justification'),

		/**
		 * Submitter info. JSONB until a real persons table is justified.
		 *   { name, party?, chamber?, externalId? }
		 */
		submitter: text('submitter', { mode: 'json' })
			.$type<{ name: string; party?: string; chamber?: string; externalId?: string }>()
			.notNull(),

		submittedAt: integer('submitted_at', { mode: 'timestamp_ms' }).notNull(),

		outcome: text('outcome').$type<AmendmentOutcome>().notNull().default('pending'),
		votedAt: integer('voted_at', { mode: 'timestamp_ms' }),

		/**
		 * Vote tallies once recorded. Optional; empty until voted.
		 *   { for: number, against: number, abstain: number,
		 *     forNames?: string[], againstNames?: string[], ... }
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

/**
 * A court decision. Useful when courts strike down or interpret
 * legislation — we link the judgment to the act it interprets via
 * DocumentLinkTable (relation='interprets').
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

		/**
		 * Parties as JSONB. Open question whether to standardize roles.
		 *   [{ role: 'plaintiff'|'defendant'|'appellant'|..., name, ... }]
		 */
		parties: text('parties', { mode: 'json' })
			.$type<Array<{ role: string; name: string; representedBy?: string }>>()
			.notNull()
			.default(sql`'[]'`),

		/** Short ruling summary. Full text lives in DocumentVersionTable. */
		rulingSummary: text('ruling_summary')
	},
	(t) => ({
		byCourt: index('diff_judgments_court_idx').on(t.court, t.decidedAt),
		byCase: uniqueIndex('diff_judgments_case_idx').on(t.court, t.caseNumber)
	})
);

// ─────────────── JOURNALS (officialGazette) ───────────────

/**
 * An issue of the official gazette. The journal itself is one document;
 * its CONTENTS are other documents (acts, decrees, notices) linked via
 * DocumentLinkTable with relation='contains' and an ordinal.
 *
 * This is the "journal as a collection of references" view from the
 * AKN type description.
 */
export const JournalTable = sqliteTable(
	'diff_journals',
	{
		documentId: text('document_id')
			.primaryKey()
			.references(() => DocumentTable.id, { onDelete: 'cascade' }),

		/** Issue identifier as the publisher uses it. */
		issueNumber: text('issue_number').notNull(),

		issuedAt: integer('issued_at', { mode: 'timestamp_ms' }).notNull(),

		/** Publisher name: "Diario Oficial de la República de Chile", "BOE", "OJEU". */
		publisher: text('publisher').notNull(),

		/**
		 * Geographic scope of the journal. Useful when one country has
		 * national + regional gazettes (Spain has BOE + 17 BOJA-likes).
		 *   'national' | 'regional' | 'eu' | 'municipal'
		 */
		scope: text('scope').notNull().default('national'),

		/** Region/CCAA/state code if scope != 'national'. Free text. */
		regionCode: text('region_code')
	},
	(t) => ({
		byIssued: index('diff_journals_issued_idx').on(t.publisher, t.issuedAt),
		byIssue: uniqueIndex('diff_journals_issue_idx').on(t.publisher, t.issueNumber)
	})
);

// ─────────────── DOCUMENT COLLECTIONS ───────────────

/**
 * A collection groups related documents into a navigable package.
 * Used for legislative dossiers (the bill + its informes + indicaciones
 * + debate + final text + journal entry, all under one umbrella).
 *
 * The contents are linked via DocumentLinkTable with relation='contains'
 * and an ordinal.
 */
export const DocumentCollectionTable = sqliteTable(
	'diff_document_collections',
	{
		documentId: text('document_id')
			.primaryKey()
			.references(() => DocumentTable.id, { onDelete: 'cascade' }),

		/**
		 * What kind of collection.
		 *   'legislative_dossier' — bill + everything around it
		 *   'amendments_batch'    — boletín de indicaciones
		 *   'committee_packet'    — agenda + reports for a session
		 *   'topic_collection'    — manually curated
		 */
		collectionKind: text('collection_kind').notNull(),

		/**
		 * The "central" document, if any. For a legislative dossier this
		 * is the bill. Optional because some collections (topic curation)
		 * have no single anchor.
		 */
		anchorDocumentId: text('anchor_document_id').references(() => DocumentTable.id),

		/** Whether the collection auto-updates when new docs are linked. */
		isAutoMaintained: integer('is_auto_maintained', { mode: 'boolean' }).notNull().default(true)
	},
	(t) => ({
		byAnchor: index('diff_collections_anchor_idx').on(t.anchorDocumentId),
		byKind: index('diff_collections_kind_idx').on(t.collectionKind)
	})
);

// ─────────────── QUESTIONS ───────────────

/**
 * Parliamentary question to the executive. Tracks the question, the
 * deadline, and the eventual response in one row. The response itself,
 * if it's a document, is also a DocumentTable row linked via
 * DocumentLinkTable (relation='responds_to').
 */
export const QuestionTable = sqliteTable(
	'diff_questions',
	{
		documentId: text('document_id')
			.primaryKey()
			.references(() => DocumentTable.id, { onDelete: 'cascade' }),

		status: text('status').$type<QuestionStatus>().notNull(),

		/** Who asked. */
		questioner: text('questioner', { mode: 'json' })
			.$type<{ name: string; party?: string; chamber?: string; externalId?: string }>()
			.notNull(),

		/** Body or person being asked (Ministerio de X, Presidencia, ...). */
		target: text('target').notNull(),

		submittedAt: integer('submitted_at', { mode: 'timestamp_ms' }).notNull(),

		/** Statutory or expected deadline for response. */
		deadlineAt: integer('deadline_at', { mode: 'timestamp_ms' }),

		answeredAt: integer('answered_at', { mode: 'timestamp_ms' }),

		/** Type: oral/written/urgent. Free text since values vary. */
		questionKind: text('question_kind')
	},
	(t) => ({
		byStatus: index('diff_questions_status_idx').on(t.status),
		byDeadline: index('diff_questions_deadline_idx').on(t.deadlineAt)
	})
);

// ─────────────── COMMUNICATIONS ───────────────

/**
 * Formal transmission between institutions: chamber → senate, executive
 * → legislature, etc. Records who sent what to whom.
 */
export const CommunicationTable = sqliteTable(
	'diff_communications',
	{
		documentId: text('document_id')
			.primaryKey()
			.references(() => DocumentTable.id, { onDelete: 'cascade' }),

		/** Sending body. Free text since institutional names vary. */
		fromBody: text('from_body').notNull(),
		/** Receiving body. */
		toBody: text('to_body').notNull(),

		transmittedAt: integer('transmitted_at', { mode: 'timestamp_ms' }).notNull(),

		/**
		 * Communication subtype.
		 *   'oficio'       — Chile/Spain official correspondence
		 *   'mensaje'      — executive submission
		 *   'response'     — answer to a question/request
		 *   'transmittal'  — forwarding a doc between bodies
		 */
		communicationKind: text('communication_kind').notNull(),

		/**
		 * What document this communication is about, if any. Most
		 * communications carry/transmit another document. Same info as a
		 * DocumentLinkTable row with relation='refers_to', but as a
		 * column for the common case.
		 */
		refersToDocumentId: text('refers_to_document_id').references(() => DocumentTable.id)
	},
	(t) => ({
		byFromTo: index('diff_communications_from_to_idx').on(t.fromBody, t.toBody),
		byTransmitted: index('diff_communications_transmitted_idx').on(t.transmittedAt)
	})
);

// ─────────────── STATEMENTS (minimal) ───────────────

/**
 * A formal declaration by a person or body — minister's policy
 * statement, party position paper, official press release with legal
 * weight. Minimal until we know more.
 */
export const StatementTable = sqliteTable('diff_statements', {
	documentId: text('document_id')
		.primaryKey()
		.references(() => DocumentTable.id, { onDelete: 'cascade' }),

	/** Who made the statement. */
	author: text('author', { mode: 'json' })
		.$type<{ name: string; role?: string; onBehalfOf?: string }>()
		.notNull(),

	statedAt: integer('stated_at', { mode: 'timestamp_ms' }).notNull(),

	/**
	 * Statement subtype: 'policy', 'position', 'press', 'declaration'.
	 * Free text until we see the spread.
	 */
	statementKind: text('statement_kind')
});

// ─────────────── PORTIONS (minimal) ───────────────

/**
 * A fragment of a larger document, used when only part of a text needs
 * to be referenced or transmitted independently. Mostly an artifact of
 * AKN; we may or may not need it. Keeping it skeletal until it pulls
 * its weight.
 */
export const PortionTable = sqliteTable('diff_portions', {
	documentId: text('document_id')
		.primaryKey()
		.references(() => DocumentTable.id, { onDelete: 'cascade' }),

	/** The document this is a portion of. */
	parentDocumentId: text('parent_document_id')
		.notNull()
		.references(() => DocumentTable.id),

	/** What fragment. Free text — "art_3", "para_2.1", "section II". */
	locator: text('locator').notNull()
});

// ─────────────── GENERIC DOC ───────────────

/**
 * Catchall for things that don't fit other types: committee technical
 * studies, opinions, administrative documents that are part of the
 * legislative process but have their own format.
 *
 * Most of the row's content lives on DocumentTable; this table just
 * adds a kind discriminator.
 */
export const GenericDocTable = sqliteTable('diff_generic_docs', {
	documentId: text('document_id')
		.primaryKey()
		.references(() => DocumentTable.id, { onDelete: 'cascade' }),

	/**
	 * What kind of doc this is. Examples:
	 *   'committee_report' / 'informe_de_comision'
	 *   'technical_study'
	 *   'opinion'
	 *   'administrative_resolution'
	 *   'agenda'
	 */
	kind: text('kind').notNull()
});

// ─────────────── DEBATES (lightweight) ───────────────

/**
 * The transcript of a legislative session. The MAIN APP's transcripts
 * subsystem is the source of truth — that's where the actual speech
 * data lives. This table exists so the graph can REFERENCE a debate
 * (e.g. bill --discussed_in--> debate) without duplicating content.
 *
 * Most fields are pointers / metadata. The body of the debate stays
 * in the main app.
 */
export const DebateTable = sqliteTable(
	'diff_debates',
	{
		documentId: text('document_id')
			.primaryKey()
			.references(() => DocumentTable.id, { onDelete: 'cascade' }),

		/** Chamber/body where the session happened. */
		chamber: text('chamber').notNull(),

		sessionStartedAt: integer('session_started_at', { mode: 'timestamp_ms' }).notNull(),
		sessionEndedAt: integer('session_ended_at', { mode: 'timestamp_ms' }),

		/**
		 * External reference into the main app's transcript table. Format
		 * TBD — could be the transcript id, a URL, or a structured ref.
		 *   { transcriptId: number, ... }
		 * Null when we know a debate happened but haven't matched it
		 * to a transcript yet.
		 */
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
 * A formal call to a session — date, time, place, agenda. Same story
 * as debates: the main app already scrapes and stores these well, so
 * this table is mostly a graph-friendly pointer.
 */
export const CitationTable = sqliteTable(
	'diff_citations',
	{
		documentId: text('document_id')
			.primaryKey()
			.references(() => DocumentTable.id, { onDelete: 'cascade' }),

		/** Body being convened. */
		convenedBody: text('convened_body').notNull(),

		scheduledFor: integer('scheduled_for', { mode: 'timestamp_ms' }).notNull(),
		location: text('location'),

		/**
		 * Ordered agenda items. Each item may reference another document
		 * (a bill being discussed, a question being answered). For full
		 * graph fidelity, agenda items that reference docs SHOULD also
		 * appear as DocumentLinkTable rows (relation='refers_to'); the
		 * JSON here is the rendered representation.
		 */
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

		/** Pointer back to the main app's existing citation row, if any. */
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
 * A computed redline between two text versions of a document. This is
 * the AKN Diff research idea, brought back as a first-class document
 * type so the graph can express "this amendment, when applied, produces
 * this changeSet, which transforms act v2 into act v3".
 *
 * Rough on purpose. The shape will move once we have real data.
 *
 * Typical sources of a changeSet:
 *   - Computed by us by diffing two DocumentVersionTable rows.
 *   - Extracted from an amendment's "old text → new text" structure.
 *   - Eventually published natively by a parliament (none do today).
 */
export const ChangeSetTable = sqliteTable(
	'diff_change_sets',
	{
		documentId: text('document_id')
			.primaryKey()
			.references(() => DocumentTable.id, { onDelete: 'cascade' }),

		/**
		 * The version this changeSet starts FROM. Usually a DocumentVersion
		 * of an act or bill. Required: a diff with no base is meaningless.
		 */
		baseVersionId: text('base_version_id')
			.notNull()
			.references(() => DocumentVersionTable.id),

		/**
		 * The version this changeSet produces. Optional because for an
		 * unvoted amendment, the "result" version doesn't exist yet —
		 * we know the proposed changes but not yet the consolidated text.
		 */
		resultVersionId: text('result_version_id').references(() => DocumentVersionTable.id),

		source: text('source').$type<ChangeSetSource>().notNull(),

		/** When the diff was computed (or published, if gov-side). */
		computedAt: integer('computed_at', { mode: 'timestamp_ms' })
			.notNull()
			.$defaultFn(() => new Date()),

		/**
		 * Optional vote outcome attached to the changeSet — borrowed from
		 * the akndiff:vote shape we sketched. Filled in when the change
		 * was voted as a single block (rare in practice; usually each
		 * amendment carries its own vote and this stays null).
		 */
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
 * Individual article-level changes inside a changeSet. One changeSet
 * may have many of these (a bill that amends a dozen articles produces
 * a dozen rows here).
 *
 * locator strings stay free text — different countries/AKN profiles
 * use different addressing schemes ("art_3", "§ 4.2", "Article 3(2)").
 * UI renders verbatim; we don't try to normalize.
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

		/** Order within the changeSet — drives "redline view" rendering. */
		ordinal: integer('ordinal').notNull(),

		kind: text('kind').$type<ChangeKind>().notNull(),

		/** Article locator BEFORE the change (null on insert). */
		locatorOld: text('locator_old'),
		/** Article locator AFTER the change (null on repeal). */
		locatorNew: text('locator_new'),

		/** Old text body (null on insert). */
		textOld: text('text_old'),
		/** New text body (null on repeal). */
		textNew: text('text_new')
	},
	(t) => ({
		byChangeSet: index('diff_article_changes_set_idx').on(t.changeSetId, t.ordinal)
	})
);

// ──────────────────────────────────────────────────────────────────────
// THINGS WE DELIBERATELY DID NOT MODEL
// ──────────────────────────────────────────────────────────────────────
//
// - A unified persons table for legislators. Lives as JSONB on the
//   types that need it (bill sponsors, amendment submitter, question
//   questioner, statement author). Promote when a customer asks.
//
// - BPMN-style process model per country. The events table is enough
//   until we want machine-readable ritual definitions per country.
//
// - i18n tables for status labels. The UI translates client-side from
//   the normalized enum. Server-side localization waits for email/PDF
//   alerts that don't have a runtime to translate.
//
// - status_mapping table. Keeping the local→normalized mapping in code
//   for now. Lift to a table the day a non-engineer needs to triage
//   unknown statuses without a deploy.
//
// ──────────────────────────────────────────────────────────────────────
// NEXT STEPS WHEN PLAYING WITH THIS
// ──────────────────────────────────────────────────────────────────────
//
// 1. Spin up a SQLite file and a migration. Seed with 5-10 real Chilean
//    bills + their events + their amendments. See if the shape holds.
// 2. Add a Spanish bill with different urgency semantics. See what
//    pushes back into countrySpecific vs. promotes to a column.
// 3. Try a query: "for boletín X, give me the bill, all its events, all
//    its versions, all amendments targeting it, the act it modifies,
//    and the journal entry that promulgated it." This is the canonical
//    'detail page' query — if it's painful, the schema is wrong.
// 4. Try the cross-doc query: "every amendment in Chile last week with
//    its target bill's title and current status." If this is one query
//    with one JOIN through DocumentLinkTable, we win.
