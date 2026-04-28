/**
 * Concept-first descriptions of every table.
 *
 * The schema source (research/schema/v1-schema.ts) is the technical
 * truth. This file is the human-readable layer on top — written for
 * a contributor about to model a parliament, who wants to know what
 * each thing represents and what facts hang off it.
 *
 * Keep prose tight. The audience already knows what a parliament is.
 *
 * Drift is OK. If a concept note says one thing and the schema says
 * another, the concept note is wrong (or the schema needs to change).
 * The /demo/schema page surfaces both, side by side.
 */

export type ConceptNote = {
	/** Human-readable name. Shown as the section heading. */
	displayName: string;
	/** One-line tagline rendered under the heading. */
	tagline: string;
	/**
	 * Markdown-ish prose. Bulleted lists with simple "**field** —
	 * description" lines render best. Keep paragraphs short.
	 */
	body: string;
	/** Optional. Things we deliberately didn't model. */
	notModeled?: string;
	/** Optional. Pointer to where the example will come from. */
	exampleHint?: string;
};

export const CONCEPT_NOTES: Record<string, ConceptNote> = {
	CountryTable: {
		displayName: 'Country',
		tagline: 'A jurisdiction we mirror. Five for now: cl, es, eu, pe, us.',
		body: `
Each country we research gets one row. The country code (a short ISO-ish
identifier like \`cl\`) flows through every other table as a tag, so the
same shared schema can hold a Chilean bill and a Spanish one without
mixing them up.

Facts we keep about a country:

- a **code** like \`cl\`, \`es\`, \`eu\`, \`pe\`, \`us\`
- the **display name** in its own language
- the **default timezone** for interpreting dates from gov sites
- whether it has **regions** we mirror separately (Spain's CCAAs, US
  states, EU member states)
		`
	},

	DocumentTable: {
		displayName: 'Document',
		tagline: 'The spine. Every artifact we mirror — bill, act, amendment, journal, anything — has one row here.',
		body: `
A "document" is the broadest unit. It's whatever the gov site published
that someone could link to: a bill, a promulgated act, an amendment, an
issue of the official gazette, a parliamentary question, a court
judgment. Each one is a document.

Every document, no matter the type, has the same shared facts:

- a **type** (bill, act, amendment, journal, etc.) — drives where the
  type-specific facts live
- a **country** it belongs to
- a **native id**: the identifier the gov site uses (a Chilean boletín
  number, an EU procedure ref, a Spanish proyecto número)
- a **title** as published, in the source language
- a **body** with the actual content, shaped per type (a bill has
  summary + articles; an act has preamble + articles + annexes)
- **topics** as the gov site tagged them (not normalized cross-country)
- a **published date** (when the gov side dated it) and a **last
  activity date** (last time anything changed upstream)
- the **canonical URL** on the gov site
- a **country-specific blob** for facts that don't fit the shared shape

The same string can be a Chilean boletín AND a Spanish proyecto — they
won't collide because the country tag separates them.
		`,
		notModeled: `
A unified persons table for sponsors / submitters. For now, that data
lives inside each type's facts as a small JSON blob (name, party,
chamber). Promote when a customer asks "all bills by X across countries."
		`
	},

	DocumentVersionTable: {
		displayName: 'Document version',
		tagline: 'Documents change over time. Each version is a snapshot, with the original file behind it.',
		body: `
A document is the *thing*; versions are its *snapshots* over time. An act
gets a new version every time it's amended (the consolidated text
changes). A bill might have a new version after each trámite stage
revises its text. Old versions are preserved forever — never overwritten.

For each version we track:

- a **version number** (monotonically increasing — highest = current)
- when the gov site **published** it
- a link to the **original file** on the gov site
- a copy in **our storage** (S3/R2), once we mirror it
- the **plain text** extracted from PDFs, for search and AI use
- optionally, a **structured form** (AKN XML, our own JSON) for
  computable diffs

If something is a sub-artifact rather than a new version of the *same*
text — a committee report about a bill, for example — it's a
**separate** document, not a version of the bill. Versions and "produced
during" are different relationships.
		`
	},

	DocumentLinkTable: {
		displayName: 'Link between documents',
		tagline: 'The graph. Every typed connection between two documents is one row.',
		body: `
This is the "navigate the parliament like the web" idea, stored
relationally. Every edge is one row: a typed link from one document to
another.

Each link records:

- a **from** document and a **to** document
- a **relation** describing what the link means (active voice, from →
  to). Examples:
  - bill **amends** act
  - amendment **modifies** bill
  - journal **promulgates** act
  - communication **refers to** bill
  - document collection **contains** bill
  - judgment **interprets** act
  - bill **responds to** question
- an **ordinal** for ordered collections (a journal's contents, a
  dossier's items)
- the **source** of the link — did it come from the gov site, was it
  extracted from text, inferred, or added manually? — drives a trust
  badge in the UI
- a **confidence** score for inferred or extracted links

The killer queries this enables: "every bill that amends this act",
"every document in this dossier in order", "which boletines were cited
in this comisión session."
		`
	},

	BillTable: {
		displayName: 'Bill',
		tagline: 'A proposal for a new law or a change to an existing one.',
		body: `
Every bill has the shared document facts (title, body, country, etc.)
plus the bill-specific ones:

- a **subtype** as the country uses it: \`mensaje\`, \`moción\`,
  \`proyecto de ley orgánica\`, etc. Free text — not normalized.
- a **status** from a normalized set: submitted, in committee, on the
  floor, second chamber, reconciliation, passed, enacted, rejected,
  withdrawn, archived
- the **original status string** in the country's language, kept
  verbatim. The normalized status drives queries; the local string
  preserves the nuance the gov site published, in case our normalization
  is wrong
- when it was **submitted**
- a list of **sponsors** (name, party, chamber)
- the **act it amends**, if any (a bill that creates new law has none)
- an **urgency tier** when the country has the concept (Chile's
  \`simple\`, \`suma\`, \`discusión inmediata\`)

A bill's life — its trámite log — lives in a separate concept (see
below).
		`,
		notModeled: `
A normalized "person" for sponsors. The sponsor list is JSON for now;
when a query like "all bills by deputy X across countries" becomes a
real ask, we lift to a persons table.
		`
	},

	BillEventTable: {
		displayName: 'Bill event (trámite log)',
		tagline: 'One ordered event in a bill\'s life. The bill\'s current status is derived from the latest event.',
		body: `
Every observable step in a bill's journey: ingreso, primer informe,
aprobación en general, segunda discusión, etc. Append-mostly — we add
events as they happen, never edit the past.

For each event:

- a **sequence number** (order within the bill)
- when it **happened**
- a normalized **action type** for cross-country comparison
- the **raw country-language description**
- which **chamber** it happened in
- if the step **produced a document** (an informe, an oficio, a vote
  record, a batch of indicaciones), a pointer to that document — which
  exists as its own row, with its own type
- a flexible **details** blob for anything else worth keeping

Bills are the only type with an event log right now. Other types could
grow their own (act amendments, judgment appeals) when needed.
		`
	},

	ActTable: {
		displayName: 'Act',
		tagline: 'A promulgated law. Acts gain new versions over time as they\'re amended; they don\'t disappear when changed.',
		body: `
An act is law that's been promulgated. Each amendment that passes
produces a new consolidated version (those live in the document version
concept).

Facts specific to an act:

- a **status**: in force, partially repealed, repealed, superseded,
  suspended
- when it was **promulgated** (became law)
- when it **took effect** (often promulgated + N days)
- when it was **repealed**, if applicable
- the **issuing body** in plain text — the values vary across types and
  countries (\`Congreso Nacional\`, \`Presidente de la República\`,
  \`Parlamento Europeo\`, \`Cortes Generales\`)
- the **journal** where it was officially published — that's the legal
  publication of record
		`
	},

	AmendmentTable: {
		displayName: 'Amendment (indicación)',
		tagline: 'A proposed modification to a bill. In Chile, an "indicación".',
		body: `
Amendments come in batches (a boletín de indicaciones). Each batch is
its own document of type \`document_collection\`; each individual
amendment is a row here, linked from the collection.

For each amendment:

- the **bill it targets** (required — an amendment with no target is
  meaningless)
- a **target locator** in free text: which articles or sections it
  modifies. Different countries express this differently
  ("art. 3 inciso 2", "§ 4", "Article 3(2)") — UI renders verbatim
- the **old text** (as the bill stood when the amendment was submitted)
- the proposed **new text**
- a **justification** by the proposer
- the **submitter** (name, party, chamber)
- when it was **submitted**
- an **outcome** once voted: pending, approved, rejected, withdrawn,
  inadmissible, merged
- a **vote record** with for/against/abstain counts and names

Note: the *computed diff* between old and new (the redline) is
intentionally absent here — that's the AKN Diff exploration, parked.
		`
	},

	JournalTable: {
		displayName: 'Journal (official gazette)',
		tagline: 'An issue of the gov\'s official publication: Diario Oficial, BOE, OJEU, Federal Register.',
		body: `
The journal is one document; its **contents** are other documents (acts,
decrees, notices) linked from it with an ordinal. This treats the
gazette as a collection of references, not as one big text dump — which
is what it actually is.

Facts about a journal issue:

- the **issue number** as the publisher uses it
- when it was **issued**
- the **publisher** ("Diario Oficial de la República de Chile", "BOE",
  "OJEU")
- a **scope**: national, regional, eu, or municipal — useful when one
  country has both national and regional gazettes (Spain has BOE +
  17 BOJA-likes)
- a **region code** when the scope isn't national
		`
	},

	JudgmentTable: {
		displayName: 'Judgment',
		tagline: 'A court decision. Useful when courts strike down or interpret legislation.',
		body: `
Judgments link to acts they interpret. The interpretation might say
"this provision means X" or "this provision is unconstitutional" — both
are legally relevant facts about an act's life.

For each judgment:

- the **court** that issued it
- the **case number** as the court uses it
- the **instance**: first, appeal, supreme, constitutional,
  administrative, other
- when it was **decided**
- the **parties** involved (plaintiff, defendant, etc. — roles vary)
- a **ruling summary** (the full text lives in the document versions)
		`
	},

	DocumentCollectionTable: {
		displayName: 'Document collection (dossier)',
		tagline: 'A bundle of related documents. The legislative dossier of a bill, an amendment batch, a committee packet.',
		body: `
A collection groups related documents into a navigable package. The
contents are linked from the collection with an ordinal so the order is
preserved.

Kinds of collections we model:

- a **legislative dossier** — a bill plus everything around it (informes,
  indicaciones, debates, final text, journal entry)
- an **amendments batch** — a boletín de indicaciones
- a **committee packet** — agenda + reports for a session
- a **topic collection** — manually curated

A collection can have an **anchor document** (a dossier's bill, for
example) or no anchor (a topic curation has none).
		`
	},

	QuestionTable: {
		displayName: 'Parliamentary question',
		tagline: 'A formal query from a legislator to the executive. Tracks the question, the deadline, and the response.',
		body: `
For each question:

- a **status**: submitted, admitted, pending response, answered,
  overdue, withdrawn, inadmissible
- the **questioner** (name, party, chamber)
- the **target** — who's being asked (a ministry, the presidency, etc.)
- when it was **submitted**
- the **deadline** for response (statutory or expected)
- when it was **answered**, if applicable
- a **kind**: oral, written, urgent (free text — varies by country)

The response itself, when it's a document, is a separate row linked back
with the relation "responds to."
		`
	},

	CommunicationTable: {
		displayName: 'Communication',
		tagline: 'A formal transmission between institutions: chamber to senate, executive to legislature, etc.',
		body: `
Records who sent what to whom. For each communication:

- the **sending body**
- the **receiving body**
- when it was **transmitted**
- a **kind**: \`oficio\` (Chile/Spain official correspondence),
  \`mensaje\` (executive submission), \`response\` (answer to a
  question), \`transmittal\` (forwarding a doc between bodies)
- the **document it's about**, if any — most communications carry or
  forward another document
		`
	},

	DebateTable: {
		displayName: 'Debate',
		tagline: 'The transcript of a legislative session. Lightweight here — the heavy lifting lives in the main app.',
		body: `
The main app's transcripts subsystem owns the actual speech data. This
table exists so the document graph can *reference* a debate (e.g. "this
bill was discussed in this debate") without duplicating content.

For each debate:

- the **chamber** where the session happened
- when the session **started** and **ended**
- a **pointer** back to the main app's transcript (id or URL)
		`
	},

	CitationTable: {
		displayName: 'Citation (session call)',
		tagline: 'A formal call to a session — date, time, place, agenda. Lightweight pointer to the main app.',
		body: `
Same shape as debates: the main app already scrapes session calls well,
so this is mostly a graph-friendly pointer.

For each citation:

- the **body being convened**
- when it's **scheduled for**
- the **location**
- ordered **agenda items**, each optionally referencing another
  document (a bill being discussed, a question being answered)

Citation was the concept that surfaced the "operative vs. juridical"
question on Feb 3 — strictly, it's operations, not law. We modeled it
anyway because without it the ritual is incomplete.
		`
	},

	StatementTable: {
		displayName: 'Statement',
		tagline: 'A formal declaration: minister\'s policy statement, party position paper, official press release with legal weight.',
		body: `
Skeletal until we know more. For each statement:

- the **author** (name, role, on behalf of)
- when it was **stated**
- a **kind**: policy, position, press, declaration (free text)
		`
	},

	PortionTable: {
		displayName: 'Portion',
		tagline: 'A fragment of a larger document, when only part of a text needs to be referenced independently.',
		body: `
Mostly an artifact of the AKN model we borrow from. May or may not earn
its keep; we keep the skeleton until something pulls on it.

For each portion:

- the **parent document** it's a fragment of
- a **locator** for the fragment ("art_3", "para_2.1", "section II")
		`
	},

	GenericDocTable: {
		displayName: 'Generic document',
		tagline: 'Catchall for things that don\'t fit other types: technical studies, opinions, administrative resolutions.',
		body: `
For things that are part of the legislative process but have their own
shape — a comisión technical study, a legal opinion, an administrative
resolution, an agenda PDF.

The only fact specific to a generic doc is its **kind**: the country's
own label for what this is (\`informe_de_comision\`, \`technical_study\`,
\`opinion\`, \`administrative_resolution\`, \`agenda\`). Most of the
content lives on the shared document concept.
		`
	},

	ChangeSetTable: {
		displayName: 'Change set (redline)',
		tagline: 'A computed diff between two text versions of a document. Schema-only for now.',
		body: `
This is the AKN Diff research idea, brought back as a first-class
document type. The graph can express "this amendment, when applied,
produces this change set, which transforms act v2 into act v3."

A change set has:

- a **base version** it starts from (required — a diff with no base is
  meaningless)
- a **result version** it produces (optional — for unvoted amendments
  we know the proposed changes but not yet the consolidated result)
- a **source**: gov site, computed by us, extracted from amendment text,
  inferred, or manual
- when it was **computed** or published
- an optional **vote record** when the change was voted as a single
  block (rare — usually each amendment carries its own vote)

Phase 1 doesn't populate change sets. The schema has the tables; the
data work waits.
		`
	},

	ArticleChangeTable: {
		displayName: 'Article change',
		tagline: 'One article-level edit inside a change set. A change set with twelve modified articles has twelve of these.',
		body: `
Each article change has:

- a **kind**: modify, insert, repeal, renumber, renumber+modify,
  replace block
- the **old locator** (null on insert)
- the **new locator** (null on repeal)
- the **old text** (null on insert)
- the **new text** (null on repeal)
- an **ordinal** for the order they're rendered in the redline view

Locator strings stay free text — different countries / AKN profiles use
different addressing schemes ("art_3", "§ 4.2", "Article 3(2)"). The UI
renders them verbatim; we don't try to normalize.
		`
	}
};

/**
 * Reframed grouping. Same content as the technical groups but with a
 * conceptual heading — what the section is *about*, not which database
 * tables it contains.
 */
export const CONCEPT_GROUPS: Array<{ title: string; intent: string; tables: string[] }> = [
	{
		title: 'The shape of any document',
		intent:
			"Every artifact we mirror is a 'document'. The same handful of facts apply whether it's a bill, an act, an amendment, or a gazette entry — title, country, native id, body, links, versions. Type-specific facts hang off this shared shape.",
		tables: ['CountryTable', 'DocumentTable', 'DocumentVersionTable']
	},
	{
		title: 'How documents connect',
		intent:
			'The whole parliament becomes navigable when documents link to each other. Every link is typed: a bill *amends* an act, a journal *promulgates* an act, an amendment *modifies* a bill. This is what makes "every bill that amends this act" a one-query answer.',
		tables: ['DocumentLinkTable']
	},
	{
		title: 'The main types',
		intent:
			'The handful of types that carry most of the legislative ritual. Each is a kind of document, with its own facts.',
		tables: ['BillTable', 'BillEventTable', 'ActTable', 'AmendmentTable', 'JournalTable']
	},
	{
		title: 'Supporting types',
		intent:
			"Lighter-weight pieces of the ritual — judgments, dossiers, questions, communications, session debates and calls. Some are skeletons today. They're here so the graph can describe the whole process end-to-end, not just the headline acts.",
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
		title: 'AKN Diff (parked)',
		intent:
			"The redline / change-set extension from the Jan 31 entry. Schema-only — Phase 1 doesn't populate these. Here for reference; come back when we revive the diff work.",
		tables: ['ChangeSetTable', 'ArticleChangeTable']
	}
];

/**
 * "I have a fact, where does it go?" — quick-reference lookup.
 * Each entry is a phrase a contributor might think, and the answer.
 */
export const WHERE_DOES_IT_GO: Array<{ fact: string; answer: string }> = [
	{
		fact: 'A list of sponsors / submitters',
		answer:
			'On the bill (sponsors) or amendment (submitter), as a list of {name, party, chamber}. No persons table yet.'
	},
	{
		fact: 'An urgency level',
		answer: 'On the bill, free text. We don\'t normalize across countries.'
	},
	{
		fact: 'When an act took effect (vs. when it was promulgated)',
		answer: 'On the act — both dates have their own field.'
	},
	{
		fact: 'Where a journal issue was published',
		answer:
			'On the journal: publisher (name), scope (national / regional / eu / municipal), and region code if needed.'
	},
	{
		fact: 'A trámite step that produced a document (informe, oficio)',
		answer:
			'The step is a bill event with a pointer to the produced document — which is its own row, with its own type.'
	},
	{
		fact: 'The text of a new version of an act',
		answer:
			'A new document version row. Old versions stay forever; we never overwrite.'
	},
	{
		fact: 'A status string we don\'t recognize',
		answer:
			'On the bill: keep the original phrasing in statusLocal, and pick the closest normalized status. Note the mismatch.'
	},
	{
		fact: 'Something the country tracks that we don\'t have a home for',
		answer:
			'Drop it in the document\'s countrySpecific blob. When the same shape shows up in 2+ countries, promote it to a real field.'
	},
	{
		fact: 'A vote tally',
		answer:
			'On the amendment (vote record) or, in the AKN Diff exploration, on a change set. Block-level votes are rare in practice.'
	},
	{
		fact: 'A reference to the main app\'s existing data',
		answer:
			'Debate and citation rows have an externalRef pointer (id or URL) — the main app stays authoritative.'
	}
];
