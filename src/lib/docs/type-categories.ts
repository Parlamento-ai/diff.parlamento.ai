/**
 * AKN element categories.
 *
 * Five buckets, no more. Color signals "what kind of thing is this?" so a reader
 * traversing the schema docs can recognize at a glance whether an element is a
 * top-level document, structural container, metadata block, event/change machinery,
 * or an identifier/reference.
 *
 * The 6th value 'uncategorized' is the cue: a chip rendered gray means "come back
 * and put this type in the map."
 */

export type Category =
	| 'document'
	| 'structural'
	| 'metadata'
	| 'event'
	| 'identifier'
	| 'uncategorized';

export type CategoryStyle = {
	label: string;
	chip: string; // tailwind classes for the colored chip
	dot: string; // small dot used inline next to type names
};

export const CATEGORY_STYLES: Record<Category, CategoryStyle> = {
	document: {
		label: 'Document type',
		chip: 'bg-blue-50 text-blue-700 border-blue-200',
		dot: 'bg-blue-400'
	},
	structural: {
		label: 'Structural container',
		chip: 'bg-stone-50 text-stone-700 border-stone-200',
		dot: 'bg-stone-400'
	},
	metadata: {
		label: 'Metadata container',
		chip: 'bg-slate-50 text-slate-600 border-slate-200',
		dot: 'bg-slate-400'
	},
	event: {
		// Same accent family as the bill timeline so readers recognize "this is the
		// event family I clicked on the timeline."
		chip: 'bg-amber-50 text-amber-800 border-amber-200',
		dot: 'bg-amber-500',
		label: 'Event / change'
	},
	identifier: {
		chip: 'bg-violet-50 text-violet-700 border-violet-200',
		dot: 'bg-violet-400',
		label: 'Identifier / reference'
	},
	uncategorized: {
		chip: 'bg-gray-50 text-gray-500 border-gray-200',
		dot: 'bg-gray-300',
		label: 'Uncategorized'
	}
};

export const TYPE_CATEGORY: Record<string, Category> = {
	// — Document type — top-level things under <akomaNtoso>
	act: 'document',
	bill: 'document',
	amendment: 'document',
	amendmentList: 'document',
	judgment: 'document',
	debate: 'document',
	debateReport: 'document',
	statement: 'document',
	portion: 'document',
	doc: 'document',
	documentCollection: 'document',
	officialGazette: 'document',
	// Diff Parlamento extension types — not part of OASIS AKN, but live at the
	// same conceptual layer ("a top-level thing the platform tracks").
	citation: 'document',
	communication: 'document',

	// — Structural container — bodies and hierarchical content
	body: 'structural',
	mainBody: 'structural',
	amendmentBody: 'structural',
	debateBody: 'structural',
	collectionBody: 'structural',
	coverPage: 'structural',
	preface: 'structural',
	preamble: 'structural',
	conclusions: 'structural',
	attachments: 'structural',
	components: 'structural',
	component: 'structural',
	// hierarchy
	article: 'structural',
	chapter: 'structural',
	section: 'structural',
	subsection: 'structural',
	part: 'structural',
	subpart: 'structural',
	title: 'structural',
	subtitle: 'structural',
	book: 'structural',
	tome: 'structural',
	division: 'structural',
	subdivision: 'structural',
	paragraph: 'structural',
	subparagraph: 'structural',
	clause: 'structural',
	subclause: 'structural',
	list: 'structural',
	point: 'structural',
	indent: 'structural',
	level: 'structural',
	rule: 'structural',
	hcontainer: 'structural',
	heading: 'structural',
	subheading: 'structural',
	content: 'structural',
	intro: 'structural',
	wrap: 'structural',
	num: 'structural',
	tblock: 'structural',
	blockList: 'structural',
	item: 'structural',
	speech: 'structural',
	question: 'structural',
	answer: 'structural',
	other: 'structural',

	// — Metadata container
	meta: 'metadata',
	identification: 'metadata',
	publication: 'metadata',
	classification: 'metadata',
	temporalData: 'metadata',
	references: 'metadata',
	notes: 'metadata',
	proprietary: 'metadata',
	presentation: 'metadata',
	keyword: 'metadata',

	// — Event / change machinery
	lifecycle: 'event',
	eventRef: 'event',
	workflow: 'event',
	step: 'event',
	analysis: 'event',
	activeModifications: 'event',
	passiveModifications: 'event',
	parliamentary: 'event',
	judicial: 'event',
	restrictions: 'event',
	mappings: 'event',
	textualMod: 'event',
	meaningMod: 'event',
	temporalGroup: 'event',
	timeInterval: 'event',
	voting: 'event',
	count: 'event',

	// — Identifier / reference
	FRBRWork: 'identifier',
	FRBRExpression: 'identifier',
	FRBRManifestation: 'identifier',
	FRBRItem: 'identifier',
	FRBRthis: 'identifier',
	FRBRuri: 'identifier',
	FRBRalias: 'identifier',
	FRBRdate: 'identifier',
	FRBRauthor: 'identifier',
	FRBRcountry: 'identifier',
	FRBRlanguage: 'identifier',
	FRBRtranslation: 'identifier',
	FRBRformat: 'identifier',
	FRBRname: 'identifier',
	FRBRnumber: 'identifier',
	FRBRprescriptive: 'identifier',
	FRBRauthoritative: 'identifier',
	FRBRsubtype: 'identifier',
	TLCEvent: 'identifier',
	TLCPerson: 'identifier',
	TLCOrganization: 'identifier',
	TLCConcept: 'identifier',
	TLCRole: 'identifier',
	TLCLocation: 'identifier',
	TLCObject: 'identifier',
	TLCProcess: 'identifier',
	TLCTerm: 'identifier',
	TLCReference: 'identifier',
	original: 'identifier',
	passiveRef: 'identifier',
	activeRef: 'identifier',
	jurisprudence: 'identifier',
	hasAttachment: 'identifier',
	attachmentOf: 'identifier'
};

export function categoryOf(typeName: string): Category {
	return TYPE_CATEGORY[typeName] ?? 'uncategorized';
}

export function styleOf(typeName: string): CategoryStyle {
	return CATEGORY_STYLES[categoryOf(typeName)];
}

/**
 * Per-type accent colors for top-level document types only. Sub-elements
 * (structural, metadata, event, identifier) keep the broader 5-category palette
 * — they would be a soup otherwise. Top-level docs each get a unique tint so
 * the eye can recognize them across sidebar, page header, and reading lists.
 */
export const DOC_TYPE_STYLES: Record<string, CategoryStyle> = {
	act: {
		label: 'act',
		chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
		dot: 'bg-emerald-500'
	},
	bill: {
		label: 'bill',
		chip: 'bg-blue-50 text-blue-700 border-blue-200',
		dot: 'bg-blue-500'
	},
	amendment: {
		label: 'amendment',
		chip: 'bg-amber-50 text-amber-700 border-amber-200',
		dot: 'bg-amber-500'
	},
	amendmentList: {
		label: 'amendmentList',
		chip: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
		dot: 'bg-fuchsia-500'
	},
	debate: {
		label: 'debate',
		chip: 'bg-purple-50 text-purple-700 border-purple-200',
		dot: 'bg-purple-500'
	},
	debateReport: {
		label: 'debateReport',
		chip: 'bg-indigo-50 text-indigo-700 border-indigo-200',
		dot: 'bg-indigo-500'
	},
	judgment: {
		label: 'judgment',
		chip: 'bg-red-50 text-red-700 border-red-200',
		dot: 'bg-red-500'
	},
	officialGazette: {
		label: 'officialGazette',
		chip: 'bg-gray-100 text-gray-700 border-gray-300',
		dot: 'bg-gray-500'
	},
	documentCollection: {
		label: 'documentCollection',
		chip: 'bg-cyan-50 text-cyan-700 border-cyan-200',
		dot: 'bg-cyan-500'
	},
	doc: {
		label: 'doc',
		chip: 'bg-stone-50 text-stone-700 border-stone-200',
		dot: 'bg-stone-500'
	},
	statement: {
		label: 'statement',
		chip: 'bg-rose-50 text-rose-700 border-rose-200',
		dot: 'bg-rose-500'
	},
	portion: {
		label: 'portion',
		chip: 'bg-sky-50 text-sky-700 border-sky-200',
		dot: 'bg-sky-500'
	},
	citation: {
		label: 'citation',
		chip: 'bg-teal-50 text-teal-700 border-teal-200',
		dot: 'bg-teal-500'
	},
	question: {
		// AKN <question> is structural; in our format "question" is also the
		// top-level document type. The DOC color is what shows up on the
		// per-type docs page and the sidebar.
		label: 'question',
		chip: 'bg-orange-50 text-orange-700 border-orange-200',
		dot: 'bg-orange-500'
	},
	communication: {
		label: 'communication',
		chip: 'bg-violet-50 text-violet-700 border-violet-200',
		dot: 'bg-violet-500'
	}
};

/**
 * Resolve the chip style for a type. For top-level document types, returns the
 * per-type accent. For everything else, returns the 5-category style.
 */
export function chipStyleOf(typeName: string): CategoryStyle {
	return DOC_TYPE_STYLES[typeName] ?? CATEGORY_STYLES[categoryOf(typeName)];
}

export function isDocumentType(typeName: string): boolean {
	return typeName in DOC_TYPE_STYLES;
}
