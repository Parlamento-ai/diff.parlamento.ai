export const ENTITY_TYPES = [
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
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

type EntityTypeInfo = {
	label: string;
	description: string;
};

export const ENTITY_TYPE_INFO: Record<EntityType, EntityTypeInfo> = {
	bill: {
		label: 'Bill',
		description: 'A proposed law moving through the parliamentary process.'
	},
	act: {
		label: 'Act',
		description: 'An enacted law, decree, regulation, or consolidated legal text.'
	},
	amendment: {
		label: 'Amendment',
		description: 'A proposed change to a bill, act, article, or text fragment.'
	},
	judgment: {
		label: 'Judgment',
		description: 'A court or constitutional decision connected to the legislative record.'
	},
	journal: {
		label: 'Journal',
		description: 'An official gazette, daily journal, or publication record.'
	},
	document_collection: {
		label: 'Document collection',
		description: 'A bundle or collection that groups related documents.'
	},
	question: {
		label: 'Question',
		description: 'A parliamentary question and its procedural status.'
	},
	communication: {
		label: 'Communication',
		description: 'An official message between institutions, chambers, or offices.'
	},
	debate: {
		label: 'Debate',
		description: 'A debate transcript, session record, or deliberation document.'
	},
	citation: {
		label: 'Citation',
		description: 'A session citation, agenda item, or calendar-like parliamentary notice.'
	},
	change_set: {
		label: 'Change set',
		description: 'A computable set of textual changes extracted from the document corpus.'
	},
	statement: {
		label: 'Statement',
		description: 'A policy statement, position, declaration, or public communication.'
	},
	portion: {
		label: 'Portion',
		description: 'A reusable fragment of another parliamentary or legal document.'
	},
	doc: {
		label: 'Generic document',
		description: 'A fallback document type for records that do not yet fit a richer type.'
	}
};

export function isEntityType(value: string): value is EntityType {
	return ENTITY_TYPES.includes(value as EntityType);
}
