export interface Article {
	eId: string;
	heading: string;
	content: string;
}

export interface Section {
	eId: string;
	num?: string;
	heading: string;
	articles: Article[];
}

export interface LawState {
	title: string;
	preface: string;
	sections: Section[];
}

export interface ArticleChange {
	article: string;
	type: 'substitute' | 'insert' | 'repeal' | 'renumber';
	oldText?: string;
	newText?: string;
	after?: string;
}

export interface Voter {
	href: string;
	showAs: string;
}

export interface Vote {
	date: string;
	result: 'approved' | 'rejected' | 'withdrawn' | 'inadmissible' | 'pending';
	source: string;
	for: Voter[];
	against: Voter[];
	abstain: Voter[];
	forCount?: number;
	againstCount?: number;
	abstainCount?: number;
}

export interface ChangeSet {
	base: string;
	result: string;
	changes: ArticleChange[];
	vote?: Vote;
}

export type DocumentType = 'act' | 'bill' | 'amendment' | 'doc';

export interface FRBRInfo {
	workUri: string;
	expressionUri: string;
	date: string;
	dateName: string;
	author: string;
	authorLabel: string;
}

export interface AknDocument {
	type: DocumentType;
	name: string;
	docSubType?: string;
	frbr: FRBRInfo;
	preface: string;
	prefaceTitle: string;
	body?: LawState;
	changeSet?: ChangeSet;
	fileName: string;
}

export interface TimelineEntry {
	slug: string;
	label: string;
	date: string;
	type: DocumentType;
	author: string;
	fileName: string;
	voteResult?: Vote['result'];
	sourceUrl?: string;
	sourceLabel?: string;
}

export interface Boletin {
	slug: string;
	title: string;
	documents: AknDocument[];
	timeline: TimelineEntry[];
}

export interface ReconstructedState {
	law: LawState;
	changedArticleIds: Set<string>;
	currentChangeSet?: ChangeSet;
	accumulatedDiffs: Record<string, WordToken[]>;
}

export interface WordToken {
	text: string;
	type: 'unchanged' | 'added' | 'removed';
}

export interface SourceRef {
	label: string;
	path: string;
	type: 'text' | 'json' | 'xml' | 'binary';
	url?: string;
}

export interface ArticleDiff {
	articleId: string;
	heading: string;
	changeType: ArticleChange['type'];
	oldText?: string;
	newText?: string;
	wordDiff?: WordToken[];
}
