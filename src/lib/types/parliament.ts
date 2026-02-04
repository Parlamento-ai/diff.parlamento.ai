import type { ExplorerDocType, ManifestEntry, GenericAknDocument } from './explorer';

export interface ParliamentChamber {
	id: string;
	name: string;
	nameEn: string;
	type: 'lower' | 'upper';
}

export interface LegislativePeriod {
	name: string;
	startDate: string;
	endDate: string;
}

export interface ParliamentMeta {
	id: string;
	name: string;
	nameEn: string;
	country: string;
	chambers: ParliamentChamber[];
	legislativePeriod: LegislativePeriod;
}

export interface ParliamentManifestEntry extends ManifestEntry {
	chamber: string | null;
}

export interface ParliamentManifest {
	documents: ParliamentManifestEntry[];
}

export interface UpcomingSession {
	uri: string;
	title: string;
	date: string;
	time: string;
	place: string;
	chamber: string | null;
	body: string;
	agendaItems: { heading: string; status: string }[];
}

export interface RecentActivity {
	uri: string;
	title: string;
	type: ExplorerDocType;
	date: string;
	chamber: string | null;
	summary: string;
}

export interface BillInProgress {
	uri: string;
	title: string;
	chamber: string | null;
	date: string;
	author: string;
	lastAction: string;
	lastActionDate: string;
	relatedDocs: { uri: string; title: string; type: ExplorerDocType }[];
}

export interface QuestionSummary {
	uri: string;
	title: string;
	chamber: string | null;
	status: 'pending' | 'answered';
	askedBy: string;
	addressedTo: string;
	dateAsked: string;
	dateAnswered?: string;
}

export interface PublishedAct {
	uri: string;
	title: string;
	date: string;
}

export interface BillDetail {
	bill: GenericAknDocument;
	entry: ParliamentManifestEntry;
	timeline: TimelineEvent[];
	relatedDocs: { entry: ParliamentManifestEntry; doc: GenericAknDocument }[];
}

export interface TimelineEvent {
	date: string;
	type: ExplorerDocType;
	title: string;
	uri: string;
	chamber: string | null;
	description: string;
}
