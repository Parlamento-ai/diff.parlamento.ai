/**
 * Tooltip copy for AKN-native terms surfaced on the bill page.
 *
 * Centralized so the copy can be reviewed in one place, and so we can
 * later swap to an i18n loader without touching every component.
 */

export type AknTermDef = {
	short: string; // one-line definition
	example?: string; // optional concrete example for *this* page
};

export const AKN_TERMS: Record<string, AknTermDef> = {
	bill: {
		short: 'A bill is an AKN document type for a legislative proposal still moving through parliament.'
	},
	act: {
		short:
			'An act is an AKN document type for an enacted law — what the bill becomes once promulgated.'
	},
	amendment: {
		short:
			'An amendment is a standalone AKN document with its own metadata and body. The bill records which spans the amendment modified; the amendment itself describes the change it proposed.'
	},
	meta: {
		short: '<meta> holds the document\'s metadata: identification, lifecycle, references, classification.'
	},
	body: {
		short: '<body> holds the legislative text — articles, chapters, sections — the operative content.'
	},
	coverPage: { short: '<coverPage> is an optional title-page block that precedes <preface>.' },
	preface: { short: '<preface> is an optional introductory block before <body>.' },
	preamble: { short: '<preamble> contains exposition / motivation text before the operative body.' },
	lifecycle: {
		short:
			'<lifecycle> lists versioning events — each <eventRef> marks a moment when a new expression of the document came into being.'
	},
	eventRef: {
		short:
			'<eventRef> is one entry inside <lifecycle>. It points at a TLCEvent and carries date, refersTo, source.'
	},
	workflow: {
		short:
			'<workflow> lists procedural events — each <step> is something an actor did in the legislative process (committee referral, reading, vote).'
	},
	step: {
		short:
			'<step> is one entry inside <workflow>. It points at a TLCEvent and carries date, agent, role, outcome.'
	},
	analysis: {
		short:
			'<analysis> records textual consequences — what each event substituted, inserted, or repealed inside <body>.'
	},
	activeModifications: {
		short:
			'<activeModifications> are changes this document caused to other documents (or to its own body).'
	},
	passiveModifications: {
		short: '<passiveModifications> are changes other documents caused to this one.'
	},
	eId: {
		short:
			'eId is AKN\'s stable identifier for a piece of text — like an anchor. Events and modifications point at exact spans via eId, never via text matching.'
	},
	wId: { short: 'wId is the work-level identifier — stable across all expressions of a document.' },
	GUID: { short: 'GUID is a globally unique id, used for cross-system references.' },
	'FRBR work': {
		short:
			'A FRBR work is the abstract creation — "Bill 121/000036" as an idea, independent of any particular language or version.'
	},
	'FRBR expression': {
		short:
			'A FRBR expression is one realization of the work — e.g. the Spanish-language version on a specific date.'
	},
	'FRBR manifestation': {
		short:
			'A FRBR manifestation is one physical embodiment of an expression — e.g. the XML file or the PDF.'
	},
	TLCEvent: {
		short:
			'A TLCEvent is an entry in <references> describing one event in this document — the lifecycle/workflow/analysis sections all reference back to it by id.'
	},
	TLCPerson: { short: 'A TLCPerson is a person referenced elsewhere in the document by eId.' },
	TLCOrganization: {
		short: 'A TLCOrganization is an organization referenced elsewhere in the document by eId.'
	},
	TLCRole: { short: 'A TLCRole is a role definition referenced elsewhere in the document.' },
	agent: {
		short:
			'agent is the actor who performed a step — typically a TLCOrganization id like "#comision-trabajo".'
	},
	role: { short: 'role is the role the agent played in this step — referenced via a TLCRole id.' },
	outcome: { short: 'outcome is the result of a step — "approved", "rejected", "referred".' },
	refersTo: {
		short:
			'refersTo links a step or event to the kind of event it represents — e.g. "#submitted", "#passed_chamber".'
	},
	source: {
		short:
			'source on an event/step links to a TLCEvent in <references> — this is the shared id that joins lifecycle / workflow / analysis entries describing the same real-world event.'
	},
	references: {
		short:
			'<references> is the document\'s id table — every TLCEvent, TLCPerson, TLCOrganization referenced elsewhere is defined here.'
	},
	identification: {
		short:
			'<identification> carries the FRBR work / expression / manifestation triple that names this document.'
	},
	chamber: { short: 'chamber identifies which legislative body acted — e.g. congreso, senado.' },
	article: {
		short:
			'<article> is one of AKN\'s hierarchical containers in <body>. eId on an article anchors it for events and modifications.'
	},
	chapter: { short: '<chapter> is a hierarchical container above articles.' },
	section: { short: '<section> is a hierarchical container, often above articles.' },
	paragraph: { short: '<paragraph> is a hierarchical container inside an article.' }
};
