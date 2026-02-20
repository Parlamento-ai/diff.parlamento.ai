import { loadBoletin, getVersionIndex, loadRawXml, getSourceDocuments } from '$lib/server/boletin-loader';
import { reconstructState } from '$lib/server/state-reconstructor';
import { computeWordDiff } from '$lib/utils/word-diff';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { ArticleDiff, LawState, SourceRef } from '$lib/types';

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

	// Use the first document with a body as the base state
	// (usually an act, but can be a bill for in-progress boletines)
	const original = boletin.documents.find((d) => d.body && d.fileName.startsWith('01-'));
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
	const HEAVY_THRESHOLD = 30;
	const diffs: ArticleDiff[] = [];
	if (currentChangeSet) {
		const isHeavy = currentChangeSet.changes.length > HEAVY_THRESHOLD;
		for (const change of currentChangeSet.changes) {
			const diff: ArticleDiff = {
				articleId: change.article,
				heading: findArticleHeading(law, change.article) || change.article,
				changeType: change.type,
				oldText: change.oldText,
				newText: change.newText
			};

			// Skip word-diff computation for heavy changeSets — computed client-side on demand
			if (!isHeavy && change.type === 'substitute' && change.oldText && change.newText) {
				diff.wordDiff = computeWordDiff(change.oldText, change.newText);
			}

			diffs.push(diff);
		}
	}

	const currentEntry = boletin.timeline[versionIndex];
	const currentDoc = boletin.documents[versionIndex];
	const rawXml = await loadRawXml(params.boletin, currentDoc.fileName);

	// Load source documents (oficios, JSONs, votes) used to generate this AKN XML
	const sourceRefs = getSourceDocuments(params.boletin, params.version);
	const sources: { label: string; path: string; type: SourceRef['type']; content?: string }[] = [];
	for (const ref of sourceRefs) {
		let content: string | undefined;
		if (ref.type === 'text' || ref.type === 'xml') {
			try {
				content = await readFile(join(process.cwd(), ref.path), 'utf-8');
			} catch { /* file may not exist */ }
		}
		sources.push({ ...ref, content });
	}

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
		sourceUrl: currentEntry.sourceUrl ?? null,
		sourceLabel: currentEntry.sourceLabel ?? null,
		sourceFileName: currentDoc.fileName,
		rawXml,
		sources,
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
