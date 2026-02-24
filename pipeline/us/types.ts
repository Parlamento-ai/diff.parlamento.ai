/**
 * Pipeline types for US Congress AKN generation
 */

// Re-export core AKN types
export type { Article, ArticleChange, Vote, Voter, ChangeSet } from '../../src/lib/types.js';

/** Parsed bill ID components */
export interface BillId {
	type: string; // 's', 'hr', 'hjres', 'sjres', etc.
	number: number;
	congress: number;
}

/** Text version from Congress.gov API */
export interface BillTextVersion {
	code: string; // IS, IH, PCS, ES, EH, ENR, etc.
	date: string; // YYYY-MM-DD
	url?: string; // Congress.gov URL for text
	govInfoUrl?: string; // GovInfo bulk download URL
}

/** Recorded vote reference from Congress.gov actions */
export interface RecordedVoteRef {
	chamber: 'Senate' | 'House';
	congress: number;
	session: number;
	rollNumber: number;
	date: string;
	url: string; // Direct URL to vote XML (senate.gov or clerk.house.gov)
}

/** Discovery output (Phase 1) */
export interface Discovery {
	billId: BillId;
	title: string;
	shortTitle?: string;
	sponsor?: { name: string; party: string; state: string };
	status: 'introduced' | 'passed-one' | 'passed-both' | 'enacted';
	publicLaw?: { congress: number; number: number };
	textVersions: BillTextVersion[];
	recordedVotes: RecordedVoteRef[];
	passageActions: PassageAction[];
}

/** A legislative passage action (e.g., "Passed Senate", "Passed House") */
export interface PassageAction {
	date: string;
	chamber: 'Senate' | 'House';
	description: string;
	voteRef?: RecordedVoteRef; // undefined = voice vote
	resultingVersionCode?: string; // ES, EH, ENR, etc.
}

/** Timeline entry describing an AKN document to generate */
export interface TimelineConfig {
	index: number;
	type: 'bill' | 'amendment' | 'act';
	label: string;
	date: string;
	versionCode: string; // IS, PCS, ES, ENR, etc.
	voteRef?: RecordedVoteRef;
	chamber?: 'Senate' | 'House';
}

/** Pipeline config (Phase 2 output) */
export interface Config {
	billId: BillId;
	title: string;
	slug: string;
	publicLaw?: { congress: number; number: number };
	timeline: TimelineConfig[];
	downloads: DownloadItem[];
}

/** Item to download in Phase 3 */
export interface DownloadItem {
	url: string;
	filename: string;
	type: 'bill-xml' | 'vote-xml';
}

/** Parsed section from a Bill DTD XML */
export interface ParsedSection {
	eId: string;
	heading: string;
	paragraphs: string[];
	content: string;
}

/** Parsed vote from a Senate or House XML */
export interface ParsedVote {
	chamber: 'Senate' | 'House';
	date: string;
	result: 'approved' | 'rejected';
	source: string; // FRBR-style URI
	forVoters: ParsedVoter[];
	againstVoters: ParsedVoter[];
	forCount: number;
	againstCount: number;
}

/** Individual voter record */
export interface ParsedVoter {
	href: string;
	showAs: string;
}

/** Phase 4 output — all parsed data */
export interface ParsedData {
	versions: Record<string, ParsedSection[]>; // keyed by versionCode
	votes: Record<string, ParsedVote>; // keyed by "senate-{n}" or "house-{n}"
}
