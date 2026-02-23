/**
 * Pipeline types for EU AKN generation
 */

// Re-export core AKN types
export type { Article, ArticleChange, Vote, Voter, ChangeSet } from '../../src/lib/types.js';

/** Auto-discovered configuration from EP Open Data + CELLAR SPARQL */
export interface DiscoveredConfig {
	slug: string;
	title: string;
	billCelex: string;
	finalCelex: string;
	epPositionCelex: string | null;
	taReference: string | null;
	lang: string;
	procedure: string;
	voteDate: string;
	voteFor: number;
	voteAgainst: number;
	voteAbstain: number;
	pubDate: string | null;
	comDate: string | null;
}

export type Status = 'PASS' | 'FAIL' | 'WARN';

export interface StepResult {
	step: number;
	id: string;
	name: string;
	status: Status;
	detail: string;
	elapsed: number;
}

export interface CrossCheck {
	name: string;
	status: Status;
	detail: string;
}
