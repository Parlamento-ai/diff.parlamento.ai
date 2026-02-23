import type { AknDocument, LawState, Section, Article, ChangeSet, ReconstructedState, WordToken } from '$lib/types';
import { computeWordDiff } from '$lib/utils/word-diff';

function cloneLawState(state: LawState): LawState {
	return {
		title: state.title,
		preface: state.preface,
		sections: state.sections.map((sec) => ({
			eId: sec.eId,
			heading: sec.heading,
			num: sec.num,
			articles: sec.articles.map((art) => ({ ...art }))
		}))
	};
}

function findArticle(sections: Section[], eId: string): Article | undefined {
	for (const sec of sections) {
		const art = sec.articles.find((a) => a.eId === eId);
		if (art) return art;
	}
	return undefined;
}

function applyChangeSet(law: LawState, changeSet: ChangeSet): Set<string> {
	const changed = new Set<string>();

	for (const change of changeSet.changes) {
		switch (change.type) {
			case 'substitute': {
				const art = findArticle(law.sections, change.article);
				if (art && change.newText) {
					art.content = change.newText;
					changed.add(change.article);
				}
				break;
			}
			case 'insert': {
				if (!change.newText) break;
				const newArticle: Article = {
					eId: change.article,
					heading: formatInsertedHeading(change.article),
					content: change.newText
				};
				// Find the section containing the "after" article and insert after it
				for (const sec of law.sections) {
					const idx = sec.articles.findIndex((a) => a.eId === change.after);
					if (idx !== -1) {
						sec.articles.splice(idx + 1, 0, newArticle);
						changed.add(change.article);
						break;
					}
				}
				break;
			}
			case 'repeal': {
				for (const sec of law.sections) {
					const idx = sec.articles.findIndex((a) => a.eId === change.article);
					if (idx !== -1) {
						sec.articles.splice(idx, 1);
						changed.add(change.article);
						break;
					}
				}
				break;
			}
		}
	}

	return changed;
}

function formatInsertedHeading(eId: string): string {
	// Convert "art_11bis" to "Artículo 11 bis. ..."
	const match = eId.match(/^art_(\d+)(bis)?$/);
	if (match) {
		const num = match[1];
		const bis = match[2] ? ' bis' : '';
		return `Artículo ${num}${bis}.`;
	}
	// For art_5bis patterns
	const match2 = eId.match(/^art_(\d+)(\w+)?$/);
	if (match2) {
		const num = match2[1];
		const suffix = match2[2] ? ` ${match2[2]}` : '';
		return `Artículo ${num}${suffix}.`;
	}
	return eId;
}

/**
 * Reconstruct the law state at a given version index.
 * versionIndex 0 = original, 1 = after first changeSet, etc.
 */
export function reconstructState(
	original: AknDocument,
	documents: AknDocument[],
	versionIndex: number
): ReconstructedState {
	if (!original.body) {
		throw new Error('Original document must have a body');
	}

	// Snapshot original article contents before applying any changes
	const originalContents = new Map<string, string>();
	for (const sec of original.body.sections) {
		for (const art of sec.articles) {
			originalContents.set(art.eId, art.content);
		}
	}

	const law = cloneLawState(original.body);
	let changedArticleIds = new Set<string>();
	let currentChangeSet: ChangeSet | undefined;

	// Apply changeSets in order up to versionIndex
	// Skip rejected/withdrawn/inadmissible amendments — their changes don't carry forward
	const currentDoc = documents[versionIndex];
	const currentDocHasChangeSet = !!currentDoc?.changeSet;

	const rejectedResults = new Set(['rejected', 'withdrawn', 'inadmissible']);

	// Collect changeSets from documents before the current one
	const previousChangeSets: { doc: AknDocument; cs: ChangeSet }[] = [];
	for (let i = 0; i < versionIndex; i++) {
		const doc = documents[i];
		if (doc.changeSet) {
			previousChangeSets.push({ doc, cs: doc.changeSet });
		}
	}

	// Apply previous changeSets, skipping rejected ones
	for (const { cs } of previousChangeSets) {
		const wasRejected = cs.vote && rejectedResults.has(cs.vote.result);
		if (!wasRejected) {
			applyChangeSet(law, cs);
		}
	}

	// If the current document itself has a changeSet, apply it as the "current step"
	if (currentDocHasChangeSet) {
		currentChangeSet = currentDoc.changeSet!;
		changedArticleIds = applyChangeSet(law, currentChangeSet);
	}

	// Compute accumulated diffs: original vs current for every article
	const accumulatedDiffs: Record<string, WordToken[]> = {};
	for (const sec of law.sections) {
		for (const art of sec.articles) {
			const orig = originalContents.get(art.eId);
			if (orig === undefined) {
				// Inserted article — all tokens are "added"
				accumulatedDiffs[art.eId] = art.content
					.split(/\s+/)
					.filter(Boolean)
					.map((text) => ({ text, type: 'added' as const }));
			} else if (orig !== art.content) {
				accumulatedDiffs[art.eId] = computeWordDiff(orig, art.content);
			}
		}
	}

	return { law, changedArticleIds, currentChangeSet, accumulatedDiffs };
}
