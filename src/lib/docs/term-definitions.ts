/**
 * Canonical AKN term definitions.
 *
 * One source of truth for:
 *   - bill-page tooltips ([src/lib/bill/AknTerm.svelte])
 *   - the Tier 1 "Definition" section on /docs/explorer/schema/<typeName>
 *
 * Contract: tooltip copy and Tier 1 copy stay in sync because both read from here.
 * The first sentence of `paragraph` is what the tooltip shows; `paragraph` is the
 * 2–3 sentence expansion shown on the docs page.
 */

export type ExampleSource = {
	/** path under /docs (e.g. 'akn/05-metadata.md') */
	file: string;
	/** anchor / heading slug to find inside the file */
	anchor: string;
	/** override caption shown above the example block */
	caption?: string;
};

/**
 * One "part" inside an anatomy — a child element worth surfacing in plain language.
 * `name` is the element name (without angle brackets); we add brackets when rendering.
 * `flavors` is a small enumeration to surface when worth it (e.g. event types).
 */
export type AnatomyPart = {
	name: string;
	purpose: string;
	flavors?: string[];
	/** Indentation depth. 0 = top-level child of the type, 1 = nested one level, etc. Default 0. */
	depth?: number;
};

export type Anatomy = {
	/** One short paragraph framing the breakdown — optional. */
	intro?: string;
	parts: AnatomyPart[];
};

export type TermDef = {
	/** one-line definition; this is what tooltips display */
	short: string;
	/** 2–3 sentence definition for the Tier 1 section; first sentence MUST equal `short` */
	paragraph: string;
	/** "Where it fits" — one sentence about parents/siblings/relationships */
	fits?: string;
	/** Closely related types — rendered as clickable chips at the top of Tier 1 */
	siblings?: string[];
	/** Plain-language "what's inside" — the XSD-for-kids breakdown */
	anatomy?: Anatomy;
	/** Pointer into [docs/akn/*.md] for the Tier 2 example */
	exampleSource?: ExampleSource;
};

export const TERM_DEFINITIONS: Record<string, TermDef> = {
	// ─────────────────────────── Document types ───────────────────────────
	bill: {
		short:
			'A bill is an AKN document type for a legislative proposal still moving through parliament.',
		paragraph:
			'A bill is an AKN document type for a legislative proposal still moving through parliament. Like an act, it carries a hierarchical body of articles and chapters, but it is not yet enacted — its lifecycle records the votes, readings, and amendments that move it toward becoming law.',
		fits: 'A top-level document under <akomaNtoso>. Holds <meta> and <body>. Tracked through parliament via <lifecycle>, <workflow>, and <analysis>.',
		siblings: ['act', 'amendment', 'meta', 'body', 'lifecycle'],
		anatomy: {
			intro:
				'A bill is a wrapper around two big things — what it says, and its history of changes — plus a few smaller blocks for front-matter and conclusion.',
			parts: [
				{
					name: 'meta',
					purpose:
						'Everything *about* the bill — its identity, dates, who is involved, and its history. Required.'
				},
				{
					name: 'identification',
					purpose: 'The FRBR identity — the bill\'s "name."',
					depth: 1
				},
				{
					name: 'lifecycle',
					purpose: 'When the bill changed — generation, amendment, repeal events.',
					depth: 1
				},
				{
					name: 'workflow',
					purpose: 'What parliament did to it — committee referrals, readings, votes.',
					depth: 1
				},
				{
					name: 'analysis',
					purpose: 'What each event actually changed inside the body.',
					depth: 1
				},
				{
					name: 'references',
					purpose: 'The id table — every person, organization, or event mentioned.',
					depth: 1
				},
				{ name: 'coverPage', purpose: 'Optional title page that goes before the preface.' },
				{
					name: 'preface',
					purpose: 'Front-matter: the title, the proponent, anything before the operative text.'
				},
				{
					name: 'preamble',
					purpose: 'Optional "whereas" clauses — the motivation for the bill.'
				},
				{
					name: 'body',
					purpose:
						'The actual legislative text, organized as a hierarchy of articles, chapters, and sections.'
				},
				{ name: 'chapter', purpose: 'A grouping container above articles.', depth: 1 },
				{
					name: 'article',
					purpose: 'The most common operative unit — usually numbered.',
					depth: 1
				},
				{
					name: 'paragraph',
					purpose: 'Numbered subdivision inside an article.',
					depth: 2
				},
				{
					name: 'conclusions',
					purpose: 'Optional closing block — final formulas, signatures.'
				},
				{
					name: 'attachments',
					purpose: 'Optional annexes — schedules, tables, supporting material.'
				}
			]
		},
		exampleSource: {
			file: 'akn/03-document-types.md',
			anchor: 'minimal-act-example',
			caption:
				'A minimal act — bills share the same shape, with the lifecycle still marking pre-enactment events.'
		}
	},
	act: {
		short:
			'An act is an AKN document type for an enacted law — what the bill becomes once promulgated.',
		paragraph:
			'An act is an AKN document type for an enacted law — what the bill becomes once promulgated. The structure mirrors a bill: a <meta> block carrying identification and lifecycle, plus a <body> of articles and chapters that hold the operative text.',
		fits: 'A top-level document under <akomaNtoso>. Same shape as a bill but with a lifecycle that includes the enactment event.',
		siblings: ['bill', 'amendment', 'meta', 'body', 'lifecycle'],
		anatomy: {
			intro:
				'An act has the same shape as a bill — the only difference is that its lifecycle includes the enactment event.',
			parts: [
				{
					name: 'meta',
					purpose:
						'Identity, dates, history. The lifecycle now includes the moment the bill was enacted.'
				},
				{ name: 'identification', purpose: 'The FRBR identity.', depth: 1 },
				{ name: 'lifecycle', purpose: 'Versioning events, including enactment.', depth: 1 },
				{ name: 'analysis', purpose: 'Textual changes the act caused (and received).', depth: 1 },
				{ name: 'preface', purpose: 'Title and front-matter.' },
				{ name: 'preamble', purpose: 'Optional "whereas" clauses.' },
				{
					name: 'body',
					purpose: 'The operative text — articles, chapters, sections.'
				},
				{ name: 'chapter', purpose: 'A grouping container above articles.', depth: 1 },
				{ name: 'article', purpose: 'The numbered operative unit.', depth: 1 },
				{ name: 'conclusions', purpose: 'Optional closing block — promulgation formulas, signatures.' },
				{ name: 'attachments', purpose: 'Optional annexes.' }
			]
		},
		exampleSource: { file: 'akn/03-document-types.md', anchor: 'minimal-act-example' }
	},
	amendment: {
		short:
			'An amendment is a standalone AKN document with its own metadata and body, describing a change proposed to a bill or act.',
		paragraph:
			'An amendment is a standalone AKN document with its own metadata and body, describing a change proposed to a bill or act. Unlike <act> or <bill>, it uses <amendmentBody> rather than <body>, and points at the document it modifies via <affectedDocument> in its preface.',
		fits: 'A top-level document under <akomaNtoso>. Uses <amendmentBody> instead of <body>. References the bill it modifies via <affectedDocument>.',
		siblings: ['bill', 'amendmentBody', 'amendmentList', 'analysis'],
		anatomy: {
			intro:
				'An amendment is small. It has metadata, points at the document it changes, and carries the change itself plus the reasoning.',
			parts: [
				{
					name: 'meta',
					purpose:
						'Identity of the amendment, plus <affectedDocument> in the preface — pointing at the bill or act being changed.'
				},
				{
					name: 'amendmentBody',
					purpose: 'The change itself.'
				},
				{
					name: 'amendmentContent',
					purpose: 'What to do — the actual text of the modification.',
					depth: 1
				},
				{
					name: 'amendmentJustification',
					purpose: 'Why — the reasoning behind the change.',
					depth: 1
				}
			]
		},
		exampleSource: { file: 'akn/03-document-types.md', anchor: 'amendment-structure' }
	},
	amendmentList: {
		short: 'An amendmentList is a collection of amendments — typically an omnibus package.',
		paragraph:
			'An amendmentList is a collection of amendments — typically an omnibus package. It groups individual <amendment> documents into a single shipped artifact.',
		fits: 'A top-level document. Holds metadata + a body of <amendment> entries.',
		siblings: ['amendment', 'documentCollection'],
		anatomy: {
			intro: 'A wrapper that bundles many amendments into a single shipped artifact.',
			parts: [
				{ name: 'meta', purpose: 'Identity and references for the package as a whole.' },
				{
					name: 'amendmentBody',
					purpose:
						'The list itself — a sequence of <amendment> entries, each with its own content and justification.'
				}
			]
		}
	},
	judgment: {
		short: 'A judgment is an AKN document type for a court decision.',
		paragraph:
			'A judgment is an AKN document type for a court decision. It uses <mainBody> rather than the legislative <body>, since court decisions are structured around arguments and rulings rather than articles.',
		fits: 'A top-level document under <akomaNtoso>. Uses <mainBody>.',
		siblings: ['doc', 'statement', 'mainBody'],
		anatomy: {
			intro:
				'A judgment is structured around arguments and rulings, not articles — so it uses the generic <mainBody> instead of <body>.',
			parts: [
				{
					name: 'meta',
					purpose: 'Identity of the case, the court, the date, and the parties involved.'
				},
				{ name: 'header', purpose: 'The case heading — court, date, parties, case number.' },
				{
					name: 'judgmentBody',
					purpose: 'The body of the decision — background, arguments, ruling.'
				},
				{ name: 'conclusions', purpose: 'The disposition — what the court actually orders.' }
			]
		}
	},
	debate: {
		short: 'A debate is an AKN document type for a parliamentary debate transcript.',
		paragraph:
			'A debate is an AKN document type for a parliamentary debate transcript. It uses <debateBody>, which is structured around <speech>, <question>, and voting blocks rather than the hierarchical articles of a bill or act.',
		fits: 'A top-level document under <akomaNtoso>. Uses <debateBody>.',
		siblings: ['debateReport', 'debateBody', 'speech'],
		anatomy: {
			intro:
				'A debate is shaped like a transcript — speakers taking turns, interrupted by questions and votes — not like a hierarchy of articles.',
			parts: [
				{
					name: 'meta',
					purpose: 'Date of the session, chamber, attendees, and references to the speakers.'
				},
				{
					name: 'debateBody',
					purpose:
						'The transcript itself — a stream of speeches, questions, answers, and voting blocks.'
				},
				{ name: 'speech', purpose: 'One turn at the podium, attributed to a speaker.', depth: 1 },
				{
					name: 'question',
					purpose: 'A parliamentary question raised during the debate.',
					depth: 1
				},
				{ name: 'answer', purpose: 'A reply to a question.', depth: 1 },
				{ name: 'vote', purpose: 'A recorded voting block.', depth: 1 }
			]
		}
	},
	debateReport: {
		short: 'A debateReport is an AKN document type for an official summary of a debate.',
		paragraph:
			'A debateReport is an AKN document type for an official summary of a debate. Same body shape as a <debate>, but represents the report/Hansard-style record rather than the raw transcript.',
		fits: 'A top-level document. Uses <debateBody>.',
		siblings: ['debate', 'debateBody'],
		anatomy: {
			intro:
				'Same shape as a <debate>, but represents the official report — the Hansard-style record rather than the raw transcript.',
			parts: [
				{ name: 'meta', purpose: 'Date, chamber, attendees, references.' },
				{
					name: 'debateBody',
					purpose:
						'The report — usually edited speeches, questions, and votes. Same building blocks as <debate>.'
				}
			]
		}
	},
	statement: {
		short:
			'A statement is an AKN document type for an official declaration that may or may not be normative.',
		paragraph:
			'A statement is an AKN document type for an official declaration that may or may not be normative — for example, a government press release or a parliamentary resolution.',
		fits: 'A top-level document. Body shape varies by use.',
		siblings: ['doc', 'judgment'],
		anatomy: {
			intro:
				'A statement is intentionally generic — used for anything official that does not fit the named types.',
			parts: [
				{ name: 'meta', purpose: 'Identity, date, the body that issued the statement.' },
				{ name: 'preface', purpose: 'Optional title and front-matter.' },
				{
					name: 'mainBody',
					purpose:
						'Free-form text — paragraphs, headings, blocks. No assumed hierarchy of articles.'
				}
			]
		}
	},
	portion: {
		short: 'A portion is an AKN document representing only a fragment of a larger document.',
		paragraph:
			'A portion is an AKN document representing only a fragment of a larger document. Used when a system holds or transmits a single article or chapter independent of the full text.',
		fits: 'A top-level document. Wraps a single fragment of another document.',
		siblings: ['act', 'bill'],
		anatomy: {
			intro:
				'A portion is a way to ship one piece of a larger document on its own — for example, a single article extracted from an act.',
			parts: [
				{
					name: 'meta',
					purpose:
						'Identity of the fragment, plus a pointer to the parent document it came from.'
				},
				{
					name: 'portionBody',
					purpose:
						'The fragment itself — typically a single hierarchy element (article, chapter, section).'
				}
			]
		}
	},
	doc: {
		short: 'doc is the AKN catch-all document type — anything that does not fit another type.',
		paragraph:
			'doc is the AKN catch-all document type — anything that does not fit another type. It uses <mainBody> and is reserved for memoranda, reports, or anything else outside the named types.',
		fits: 'A top-level document under <akomaNtoso>. Uses <mainBody>.',
		siblings: ['statement', 'judgment', 'mainBody'],
		anatomy: {
			intro:
				'<doc> is the catch-all — it has no fixed shape beyond "metadata + a free-form body."',
			parts: [
				{ name: 'meta', purpose: 'Identity, date, author or issuing body.' },
				{ name: 'preface', purpose: 'Optional title and front-matter.' },
				{
					name: 'mainBody',
					purpose:
						'Free-form text — memos, reports, anything that does not fit a stricter type.'
				}
			]
		},
		exampleSource: { file: 'akn/03-document-types.md', anchor: 'when-to-use-doc' }
	},
	officialGazette: {
		short:
			'An officialGazette is an AKN document representing one issue of a national or supranational gazette.',
		paragraph:
			'An officialGazette is an AKN document representing one issue of a national or supranational gazette. It is itself a collection of the documents published in that issue.',
		fits: 'A top-level document. Aggregates published acts, bills, and notices into one issue.',
		siblings: ['documentCollection'],
		anatomy: {
			intro:
				'An official gazette is a special kind of collection — one issue, gathering everything published that day.',
			parts: [
				{
					name: 'meta',
					purpose: 'Identity of the issue — gazette name, date, issue number.'
				},
				{
					name: 'collectionBody',
					purpose:
						'A list of <component> entries, each pointing at one published document (act, decree, notice).'
				}
			]
		}
	},
	documentCollection: {
		short:
			'A documentCollection groups related documents together — for example, a bill plus its explanatory memorandum.',
		paragraph:
			'A documentCollection groups related documents together — for example, a bill plus its explanatory memorandum. It uses <collectionBody> with <component> children, each pointing at one document via <documentRef>.',
		fits: 'A top-level document. Uses <collectionBody>.',
		siblings: ['officialGazette', 'collectionBody', 'component'],
		anatomy: {
			intro:
				'A document collection is a wrapper that groups several documents that belong together — a bill plus its explanatory memorandum, for example.',
			parts: [
				{ name: 'meta', purpose: 'Identity of the collection itself.' },
				{
					name: 'collectionBody',
					purpose:
						'A list of <component> entries. Each component carries a <documentRef> pointing at one of the documents in the bundle.'
				}
			]
		},
		exampleSource: { file: 'akn/03-document-types.md', anchor: 'document-collections' }
	},

	// ─────────────────────── Diff Parlamento extensions ───────────────────────
	// Not part of OASIS AKN. Documented here so the platform's docs are complete.
	citation: {
		short:
			'A citation (Diff Parlamento extension) is a parliamentary committee summons — typically a request for a minister or official to appear before a chamber.',
		paragraph:
			'A citation (Diff Parlamento extension) is a parliamentary committee summons — typically a request for a minister or official to appear before a chamber. It is not part of the OASIS AKN core types; we track it as a first-class document because national parliaments treat it as one.',
		fits: 'A Diff-Parlamento top-level type. Sits alongside <bill> and <debate> in our index.',
		siblings: ['question', 'communication', 'debate'],
		anatomy: {
			intro:
				'A citation is a parliamentary summons — a date, a person being summoned, a chamber doing the summoning, a topic.',
			parts: [
				{
					name: 'meta',
					purpose: 'Identity of the citation, plus references to the people and bodies involved.'
				},
				{
					name: 'citationBody',
					purpose:
						'Who is being summoned, when, by whom, and on what topic. Designed to be CalDAV-compatible — a citation is also a calendar event.'
				}
			]
		}
	},
	question: {
		short:
			'A question (in our format) is a written parliamentary question — a formal query a legislator submits to the executive, with a recorded reply.',
		paragraph:
			'A question (in our format) is a written parliamentary question — a formal query a legislator submits to the executive, with a recorded reply. Note: AKN itself defines <question> as a debate-body element (one question asked during a debate). Diff Parlamento uses the same name for the top-level document type that wraps a written question and its reply.',
		fits: 'A Diff-Parlamento top-level type. Distinct from the AKN <question> element used inside <debate>.',
		siblings: ['citation', 'communication', 'answer', 'debate'],
		anatomy: {
			intro:
				'A written question pairs the formal query with its recorded reply — both live in the same document.',
			parts: [
				{
					name: 'meta',
					purpose: 'Who asked, who is supposed to answer, the date submitted.'
				},
				{
					name: 'questionBody',
					purpose: 'The text of the question.'
				},
				{
					name: 'answerBody',
					purpose: 'The recorded reply — usually filled in later, when the executive responds.'
				}
			]
		}
	},
	communication: {
		short:
			'A communication (Diff Parlamento extension) is an official message exchanged between branches — typically the executive informing parliament, or vice versa.',
		paragraph:
			'A communication (Diff Parlamento extension) is an official message exchanged between branches — typically the executive informing parliament, or vice versa. We track it as a top-level document type; it is not part of OASIS AKN.',
		fits: 'A Diff-Parlamento top-level type. Sits alongside <bill> and <debate> in our index.',
		siblings: ['citation', 'question', 'statement'],
		anatomy: {
			intro:
				'A communication is an official message between branches — the executive informing parliament, or vice versa.',
			parts: [
				{
					name: 'meta',
					purpose: 'Sender, recipient, date, subject — and any documents the message refers to.'
				},
				{
					name: 'communicationBody',
					purpose: 'The message itself — usually a short formal text.'
				}
			]
		}
	},

	// ─────────────────────────── Structural ───────────────────────────
	meta: {
		short: '<meta> holds the document\'s metadata: identification, lifecycle, references, classification.',
		paragraph:
			"<meta> holds the document's metadata: identification, lifecycle, references, classification. It is the only required section in every AKN document — everything <em>about</em> the document lives here, while <body> holds the operative content.",
		fits: 'Required first child of every document type. Sibling of <body> / <mainBody> / <debateBody>.',
		siblings: ['identification', 'lifecycle', 'references', 'body'],
		anatomy: {
			intro:
				'Think of <meta> as the document\'s record card. Three things matter most: who am I, what happened to me, and who else am I talking about.',
			parts: [
				{
					name: 'identification',
					purpose:
						'Who am I. The FRBR identity — Work / Expression / Manifestation. Required.'
				},
				{ name: 'FRBRWork', purpose: 'The abstract creation — the document "as an idea."', depth: 1 },
				{ name: 'FRBRExpression', purpose: 'One realization (e.g. Spanish, on a date).', depth: 1 },
				{ name: 'FRBRManifestation', purpose: 'One embodiment (XML, PDF, HTML).', depth: 1 },
				{
					name: 'lifecycle',
					purpose:
						'When did I change. A list of versioning events — generation, amendment, repeal.'
				},
				{ name: 'eventRef', purpose: 'One entry in the lifecycle. Points at a TLCEvent.', depth: 1 },
				{
					name: 'workflow',
					purpose:
						'What did parliament do to me. Procedural events — referrals, readings, votes.'
				},
				{ name: 'step', purpose: 'One procedural event. Has agent, role, outcome.', depth: 1 },
				{
					name: 'analysis',
					purpose:
						'What did each event actually change. The textual diff — what was inserted, substituted, repealed.'
				},
				{
					name: 'activeModifications',
					purpose: 'Changes this document caused to others.',
					depth: 1
				},
				{
					name: 'passiveModifications',
					purpose: 'Changes other documents caused to this one.',
					depth: 1
				},
				{
					name: 'references',
					purpose:
						'Who am I talking about. The id table — every TLCEvent, TLCPerson, TLCOrganization referenced elsewhere is defined here.'
				},
				{ name: 'TLCEvent', purpose: 'An event entry, referenced by lifecycle/workflow/analysis.', depth: 1 },
				{ name: 'TLCPerson', purpose: 'A person — sponsor, speaker, judge.', depth: 1 },
				{ name: 'TLCOrganization', purpose: 'An organization — chamber, committee.', depth: 1 },
				{
					name: 'temporalData',
					purpose: 'Optional. Time-based applicability for provisions that take effect on different dates.'
				},
				{
					name: 'classification',
					purpose: 'Optional. Subject keywords / topical tags.'
				},
				{
					name: 'publication',
					purpose: 'Optional. Where and when this expression was officially published.'
				}
			]
		},
		exampleSource: { file: 'akn/05-metadata.md', anchor: 'overview' }
	},
	body: {
		short: '<body> holds the legislative text — articles, chapters, sections — the operative content.',
		paragraph:
			'<body> holds the legislative text — articles, chapters, sections — the operative content. Every event in <lifecycle> and every modification in <analysis> ultimately points back at a span inside <body>, identified by eId.',
		fits: 'Required content section of <act> and <bill>. Contains exactly one top-level container (article, chapter, section…).',
		siblings: ['meta', 'article', 'chapter', 'mainBody']
	},
	mainBody: {
		short: '<mainBody> is the generic body container used by <doc>, <statement>, and <judgment>.',
		paragraph:
			'<mainBody> is the generic body container used by <doc>, <statement>, and <judgment>. Unlike <body>, it does not assume a strict hierarchy of articles and chapters — it can hold paragraphs, headings, and free-form blocks.',
		fits: 'Used in place of <body> for non-hierarchical document types.',
		siblings: ['body', 'doc', 'statement', 'judgment']
	},
	amendmentBody: {
		short: '<amendmentBody> is the body container for an <amendment> document.',
		paragraph:
			'<amendmentBody> is the body container for an <amendment> document. It holds <amendmentContent> (the change itself) and optionally <amendmentJustification> (the reasoning).',
		fits: 'Used in place of <body> inside an <amendment>.',
		siblings: ['amendment', 'body']
	},
	debateBody: {
		short: '<debateBody> is the body container for <debate> and <debateReport>.',
		paragraph:
			'<debateBody> is the body container for <debate> and <debateReport>. Structured around <speech>, <question>, and voting blocks rather than articles.',
		fits: 'Used in place of <body> for debate document types.',
		siblings: ['debate', 'debateReport', 'speech']
	},
	collectionBody: {
		short: '<collectionBody> is the body container for <documentCollection> and <officialGazette>.',
		paragraph:
			'<collectionBody> is the body container for <documentCollection> and <officialGazette>. Holds <component> entries that each point at one document via <documentRef>.',
		fits: 'Used in place of <body> for collection-style documents.',
		siblings: ['documentCollection', 'officialGazette', 'component']
	},
	coverPage: { short: '<coverPage> is an optional title-page block that precedes <preface>.', paragraph: '<coverPage> is an optional title-page block that precedes <preface>. Used for cover sheets, gazette mastheads, or front-matter banners.', siblings: ['preface', 'preamble'] },
	preface: { short: '<preface> is an optional introductory block before <body>.', paragraph: '<preface> is an optional introductory block before <body>. Holds the document title, the proponent, and other front-matter that is not yet operative text.', siblings: ['coverPage', 'preamble', 'body'] },
	preamble: { short: '<preamble> contains exposition / motivation text before the operative body.', paragraph: '<preamble> contains exposition / motivation text before the operative body — recitals, "whereas" clauses, and the reasoning behind the document.', siblings: ['preface', 'body'] },
	article: {
		short: '<article> is one of AKN\'s hierarchical containers in <body>.',
		paragraph:
			"<article> is one of AKN's hierarchical containers in <body>. Articles are the most common operative unit; their eId anchors them so that events and modifications can point at exact spans rather than matching text.",
		fits: 'Lives inside <body>, often nested under <chapter>, <section>, <part>.',
		siblings: ['chapter', 'section', 'paragraph', 'body']
	},
	chapter: { short: '<chapter> is a hierarchical container above articles.', paragraph: '<chapter> is a hierarchical container above articles. Like all AKN hierarchy elements, it carries an eId so events and modifications can point at it.', siblings: ['article', 'section', 'part', 'title'] },
	section: { short: '<section> is a hierarchical container, often above articles.', paragraph: '<section> is a hierarchical container, often above articles. National profiles vary in whether sections sit above or below chapters.', siblings: ['article', 'chapter', 'part'] },
	paragraph: { short: '<paragraph> is a hierarchical container inside an article.', paragraph: '<paragraph> is a hierarchical container inside an article. It typically holds the numbered subdivisions of an article (1, 2, 3…).', siblings: ['article', 'subparagraph'] },

	// ─────────────────────────── Event / change machinery ───────────────────────────
	lifecycle: {
		short:
			'<lifecycle> lists versioning events — each <eventRef> marks a moment when a new expression of the document came into being.',
		paragraph:
			'<lifecycle> lists versioning events — each <eventRef> marks a moment when a new expression of the document came into being. The lifecycle is the spine that <workflow> and <analysis> hang off of: a procedural step or a textual modification can both point back at the same <eventRef>.',
		fits: 'Lives inside <meta>. Holds <eventRef> children. Joined to <workflow>, <analysis>, and <temporalData> via shared event ids.',
		siblings: ['eventRef', 'workflow', 'analysis', 'TLCEvent', 'meta'],
		exampleSource: { file: 'akn/05-metadata.md', anchor: 'lifecycle-event-history' }
	},
	eventRef: {
		short:
			'<eventRef> is one entry inside <lifecycle>. It points at a TLCEvent and carries date, refersTo, source.',
		paragraph:
			'<eventRef> is one entry inside <lifecycle>. It points at a TLCEvent in <references>, and carries the event date, type (generation, amendment, repeal), and source. The same TLCEvent can be referenced by a <step> in <workflow> and a modification in <analysis>, joining the procedural and textual views of the same real-world event.',
		fits: 'Lives inside <lifecycle>. Points at a TLCEvent in <references>. Shares its event with <step> in <workflow> and modifications in <analysis>.',
		siblings: ['lifecycle', 'step', 'workflow', 'analysis', 'TLCEvent'],
		exampleSource: { file: 'akn/05-metadata.md', anchor: 'lifecycle-event-history' }
	},
	workflow: {
		short:
			'<workflow> lists procedural events — each <step> is something an actor did in the legislative process (committee referral, reading, vote).',
		paragraph:
			'<workflow> lists procedural events — each <step> is something an actor did in the legislative process (committee referral, reading, vote). Where <lifecycle> tracks the abstract "a new version came into being," <workflow> tracks the concrete "this committee voted on it on this date."',
		fits: 'Lives inside <meta>. Holds <step> children. Joined to <lifecycle> via shared event ids.',
		siblings: ['step', 'lifecycle', 'analysis', 'meta'],
		exampleSource: { file: 'akn/05-metadata.md', anchor: 'workflow-processing-steps' }
	},
	step: {
		short:
			'<step> is one entry inside <workflow>. It points at a TLCEvent and carries date, agent, role, outcome.',
		paragraph:
			'<step> is one entry inside <workflow>. It points at a TLCEvent and carries the date, the agent (typically a TLCOrganization), the role they played, and the outcome of the step.',
		fits: 'Lives inside <workflow>. Points at a TLCEvent in <references>. Sibling concept: <eventRef> in <lifecycle>.',
		siblings: ['workflow', 'eventRef', 'TLCEvent', 'TLCOrganization', 'TLCRole'],
		exampleSource: { file: 'akn/05-metadata.md', anchor: 'workflow-processing-steps' }
	},
	analysis: {
		short:
			'<analysis> records textual consequences — what each event substituted, inserted, or repealed inside <body>.',
		paragraph:
			'<analysis> records textual consequences — what each event substituted, inserted, or repealed inside <body>. The "active" subsection lists changes this document caused to others; the "passive" subsection lists changes other documents caused to this one.',
		fits: 'Lives inside <meta>. Holds <activeModifications> and <passiveModifications>.',
		siblings: ['activeModifications', 'passiveModifications', 'lifecycle', 'workflow'],
		exampleSource: { file: 'akn/05-metadata.md', anchor: 'analysis-modification-tracking' }
	},
	activeModifications: {
		short:
			'<activeModifications> are changes this document caused to other documents (or to its own body).',
		paragraph:
			'<activeModifications> are changes this document caused to other documents (or to its own body). Each <textualMod> child names the source span and the destination span, with a type like insertion, substitution, repeal, or renumbering.',
		fits: 'Lives inside <analysis>.',
		siblings: ['analysis', 'passiveModifications', 'textualMod']
	},
	passiveModifications: {
		short: '<passiveModifications> are changes other documents caused to this one.',
		paragraph:
			'<passiveModifications> are changes other documents caused to this one. Each entry names the source (the modifying document/event) and the destination (the span inside this document that was changed).',
		fits: 'Lives inside <analysis>.',
		siblings: ['analysis', 'activeModifications', 'textualMod']
	},
	temporalData: {
		short:
			'<temporalData> defines time-based applicability for provisions that take effect on different dates.',
		paragraph:
			'<temporalData> defines time-based applicability for provisions that take effect on different dates. Its <temporalGroup> children carry <timeInterval> entries that reference <eventRef> elements as their start/end.',
		fits: 'Lives inside <meta>. Joined to <lifecycle> via shared event ids.',
		siblings: ['lifecycle', 'eventRef', 'meta']
	},

	// ─────────────────────────── Identifier / reference ───────────────────────────
	references: {
		short:
			"<references> is the document's id table — every TLCEvent, TLCPerson, TLCOrganization referenced elsewhere is defined here.",
		paragraph:
			"<references> is the document's id table — every TLCEvent, TLCPerson, TLCOrganization referenced elsewhere is defined here. The lifecycle, workflow, and analysis sections all point into <references> by id rather than carrying entity data inline.",
		fits: 'Lives inside <meta>. Holds TLC* and document-reference children.',
		siblings: ['TLCEvent', 'TLCPerson', 'TLCOrganization', 'meta'],
		exampleSource: { file: 'akn/05-metadata.md', anchor: 'references-external-entities' }
	},
	identification: {
		short:
			'<identification> carries the FRBR work / expression / manifestation triple that names this document.',
		paragraph:
			'<identification> carries the FRBR work / expression / manifestation triple that names this document. It is the only required child of <meta> — every AKN document must declare its FRBR identity.',
		fits: 'Required child of <meta>.',
		siblings: ['FRBRWork', 'FRBRExpression', 'FRBRManifestation', 'meta'],
		exampleSource: { file: 'akn/05-metadata.md', anchor: 'identification-frbr-identity' }
	},
	FRBRWork: {
		short: 'The abstract creation — the document "as an idea," independent of language or version.',
		paragraph:
			'The abstract creation — the document "as an idea," independent of language or version. Bill 121/000036 in the abstract is one Work; its Spanish text on a given date is one Expression of that Work.',
		fits: 'Required child of <identification>. Paired with <FRBRExpression> and <FRBRManifestation>.',
		siblings: ['FRBRExpression', 'FRBRManifestation', 'identification']
	},
	FRBRExpression: {
		short: 'One realization of a Work — for example, the Spanish-language version on a specific date.',
		paragraph:
			'One realization of a Work — for example, the Spanish-language version on a specific date. Each <eventRef> in <lifecycle> typically marks the boundary between two Expressions.',
		fits: 'Required child of <identification>. One Work has many Expressions over time.',
		siblings: ['FRBRWork', 'FRBRManifestation', 'lifecycle']
	},
	FRBRManifestation: {
		short: 'One physical embodiment of an Expression — for example, the XML file or the PDF.',
		paragraph:
			'One physical embodiment of an Expression — for example, the XML file or the PDF. The same Expression can have multiple Manifestations (XML, PDF, HTML).',
		fits: 'Required child of <identification>.',
		siblings: ['FRBRWork', 'FRBRExpression', 'identification']
	},
	TLCEvent: {
		short:
			'A TLCEvent is an entry in <references> describing one event — the lifecycle/workflow/analysis sections all reference back to it by id.',
		paragraph:
			'A TLCEvent is an entry in <references> describing one event in this document. The lifecycle, workflow, and analysis sections all reference back to it by id, which is how the procedural view (workflow) and the textual view (analysis) get joined to the version history (lifecycle).',
		fits: 'Lives inside <references>. Pointed at by <eventRef>, <step>, and modifications.',
		siblings: ['eventRef', 'step', 'references', 'TLCPerson']
	},
	TLCPerson: {
		short: 'A TLCPerson is a person referenced elsewhere in the document by eId.',
		paragraph:
			'A TLCPerson is a person referenced elsewhere in the document by eId — for example, the bill\'s sponsor, a speaker in a debate, or a judge in a judgment.',
		fits: 'Lives inside <references>.',
		siblings: ['TLCOrganization', 'TLCRole', 'references']
	},
	TLCOrganization: {
		short: 'A TLCOrganization is an organization referenced elsewhere in the document by eId.',
		paragraph:
			'A TLCOrganization is an organization referenced elsewhere in the document by eId — typically the parliamentary chamber or committee that performed a workflow step.',
		fits: 'Lives inside <references>.',
		siblings: ['TLCPerson', 'TLCRole', 'references']
	},
	TLCRole: {
		short: 'A TLCRole is a role definition referenced elsewhere in the document.',
		paragraph:
			'A TLCRole is a role definition referenced elsewhere in the document — for example, "speaker," "rapporteur," or "sponsor."',
		fits: 'Lives inside <references>.',
		siblings: ['TLCPerson', 'TLCOrganization', 'references']
	},
	eId: {
		short:
			"eId is AKN's stable identifier for a piece of text — like an anchor. Events and modifications point at exact spans via eId, never via text matching.",
		paragraph:
			"eId is AKN's stable identifier for a piece of text — like an anchor. Events and modifications point at exact spans via eId, never via text matching, so a typo fix or a renumbering doesn't break the link.",
		fits: 'An attribute carried by every hierarchy element and by entries in <lifecycle>, <workflow>, <analysis>, and <references>.',
		siblings: ['wId', 'GUID']
	},
	wId: {
		short: 'wId is the work-level identifier — stable across all expressions of a document.',
		paragraph:
			'wId is the work-level identifier — stable across all expressions of a document. Where eId can change between expressions if the document was renumbered, wId is the persistent anchor across all versions.',
		fits: 'Optional attribute alongside eId on hierarchy elements.',
		siblings: ['eId', 'GUID']
	},
	GUID: {
		short: 'GUID is a globally unique id, used for cross-system references.',
		paragraph: 'GUID is a globally unique id, used for cross-system references when an eId or wId is not enough.',
		fits: 'Optional attribute on hierarchy elements.',
		siblings: ['eId', 'wId']
	}
};

/** Best-effort lookup. Falls back to undefined; callers handle missing types gracefully. */
export function getTermDef(typeName: string): TermDef | undefined {
	return TERM_DEFINITIONS[typeName];
}
