import { loadBoletin, getVersionIndex } from '$lib/server/boletin-loader';
import { reconstructState } from '$lib/server/state-reconstructor';
import { computeWordDiff } from '$lib/utils/word-diff';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { ArticleDiff, LawState, Section, Article } from '$lib/types';

function serializeLawState(law: LawState) {
	return {
		title: law.title,
		preface: law.preface,
		sections: law.sections.map((s) => ({
			eId: s.eId,
			heading: s.heading,
			articles: s.articles.map((a) => ({
				eId: a.eId,
				heading: a.heading,
				content: a.content
			}))
		}))
	};
}

export const load: PageServerLoad = async ({ params }) => {
	let boletin;
	try {
		boletin = await loadBoletin(params.boletin);
	} catch {
		error(404, 'Boletín no encontrado');
	}

	let versionIndex: number;
	try {
		versionIndex = getVersionIndex(boletin, params.version);
	} catch {
		error(404, 'Versión no encontrada');
	}

	const original = boletin.documents.find((d) => d.type === 'act' && d.fileName.startsWith('01-'))
		|| boletin.documents[0];
	if (!original?.body) {
		error(500, 'Documento original no encontrado');
	}

	// Documents that have changeSets (bills + amendments, not acts)
	const changeDocuments = boletin.documents.filter((d) => d.changeSet);

	const { law, changedArticleIds, currentChangeSet, accumulatedDiffs } = reconstructState(
		original,
		boletin.documents,
		versionIndex
	);

	// Build diffs for the current step
	const diffs: ArticleDiff[] = [];
	if (currentChangeSet) {
		for (const change of currentChangeSet.changes) {
			const diff: ArticleDiff = {
				articleId: change.article,
				heading: findArticleHeading(law, change.article) || change.article,
				changeType: change.type,
				oldText: change.oldText,
				newText: change.newText
			};

			if (change.type === 'substitute' && change.oldText && change.newText) {
				diff.wordDiff = computeWordDiff(change.oldText, change.newText);
			}

			diffs.push(diff);
		}
	}

	const currentEntry = boletin.timeline[versionIndex];

	return {
		law: serializeLawState(law),
		changedArticleIds: [...changedArticleIds],
		diffs,
		vote: currentChangeSet?.vote ?? null,
		versionSlug: params.version,
		versionLabel: currentEntry.label,
		versionType: currentEntry.type,
		versionDate: currentEntry.date,
		versionAuthor: currentEntry.author,
		accumulatedDiffs
	};
};

function findArticleHeading(law: LawState, eId: string): string | undefined {
	for (const sec of law.sections) {
		const art = sec.articles.find((a) => a.eId === eId);
		if (art) return art.heading;
	}
	return undefined;
}
