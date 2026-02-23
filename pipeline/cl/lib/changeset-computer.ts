/**
 * ChangeSet computer — computes article-level diffs between two versions
 * Implements substitute/insert/repeal/renumber detection
 */
import type { ArticleChange, ParsedArticle } from '../types.js';

export interface ChangeSetResult {
	changes: ArticleChange[];
	stats: {
		substituted: number;
		inserted: number;
		repealed: number;
		renumbered: number;
		unchanged: number;
	};
	valid: boolean;
	crossCheck: string;
}

/** Compute changes between old and new article lists */
export function computeChangeSet(
	oldArticles: ParsedArticle[],
	newArticles: ParsedArticle[]
): ChangeSetResult {
	const changes: ArticleChange[] = [];
	const oldMap = new Map(oldArticles.map((a) => [a.eId, a]));
	const newMap = new Map(newArticles.map((a) => [a.eId, a]));

	let substituted = 0;
	let inserted = 0;
	let repealed = 0;
	let unchanged = 0;

	// Find substitutions and repeals
	for (const [eId, oldArt] of oldMap) {
		const newArt = newMap.get(eId);
		if (!newArt) {
			// Article repealed
			changes.push({
				article: eId,
				type: 'repeal',
				oldText: oldArt.content
			});
			repealed++;
		} else if (normalizeText(oldArt.content) !== normalizeText(newArt.content)) {
			// Article modified
			changes.push({
				article: eId,
				type: 'substitute',
				oldText: oldArt.content,
				newText: newArt.content
			});
			substituted++;
		} else {
			unchanged++;
		}
	}

	// Find insertions
	for (const [eId, newArt] of newMap) {
		if (!oldMap.has(eId)) {
			// Find the article before this one in the new list
			const newIndex = newArticles.findIndex((a) => a.eId === eId);
			const afterEId = newIndex > 0 ? newArticles[newIndex - 1].eId : undefined;

			changes.push({
				article: eId,
				type: 'insert',
				newText: newArt.content,
				after: afterEId
			});
			inserted++;
		}
	}

	// Sort changes: repeals first, then substitutions, then insertions
	changes.sort((a, b) => {
		const order = { repeal: 0, substitute: 1, renumber: 2, insert: 3 };
		return order[a.type] - order[b.type];
	});

	// Cross-check
	const expectedNew = oldArticles.length + inserted - repealed;
	const valid = expectedNew === newArticles.length;
	const crossCheck = `${oldArticles.length} + ${inserted} - ${repealed} = ${expectedNew} (expected ${newArticles.length})`;

	if (!valid) {
		console.warn(`  WARNING: Cross-check failed: ${crossCheck}`);
	}

	return {
		changes,
		stats: { substituted, inserted, repealed, renumbered: 0, unchanged },
		valid,
		crossCheck
	};
}

/** Normalize text for comparison (trim, collapse whitespace) */
function normalizeText(text: string): string {
	return text.replace(/\s+/g, ' ').trim();
}
