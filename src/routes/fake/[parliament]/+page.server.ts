import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	loadParliamentMeta,
	loadParliamentManifest,
	loadAllDocuments,
	getUpcomingSessions,
	getRecentActivity,
	getBillsInProgress,
	getQuestionsSummary,
	getPublishedActs
} from '$lib/server/parliament-loader';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const meta = await loadParliamentMeta(params.parliament);
		const manifest = await loadParliamentManifest();
		const docs = await loadAllDocuments(manifest);

		return {
			meta,
			upcomingSessions: getUpcomingSessions(docs, manifest),
			recentActivity: getRecentActivity(docs, manifest),
			billsInProgress: getBillsInProgress(docs, manifest),
			questions: getQuestionsSummary(docs, manifest),
			publishedActs: getPublishedActs(docs, manifest),
			chambers: meta.chambers
		};
	} catch (e) {
		error(404, `Parliament not found: ${params.parliament}`);
	}
};
