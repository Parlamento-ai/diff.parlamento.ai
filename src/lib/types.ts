export interface Article {
	eId: string;
	heading: string;
	content: string;
}

export interface Section {
	eId: string;
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

export interface ChangeSet {
	base: string;
	result: string;
	changes: ArticleChange[];
}

export type DocumentType = 'act' | 'bill' | 'amendment';

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
}

export interface WordToken {
	text: string;
	type: 'unchanged' | 'added' | 'removed';
}

export interface ArticleDiff {
	articleId: string;
	heading: string;
	changeType: ArticleChange['type'];
	oldText?: string;
	newText?: string;
	wordDiff?: WordToken[];
}
