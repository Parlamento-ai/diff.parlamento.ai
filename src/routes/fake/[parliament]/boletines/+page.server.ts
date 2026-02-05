import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	loadParliamentMeta,
	loadParliamentManifest,
	loadAllDocuments,
	getBillsInProgress
} from '$lib/server/parliament-loader';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const meta = await loadParliamentMeta(params.parliament);
		const manifest = await loadParliamentManifest();
		const docs = await loadAllDocuments(manifest);

		return {
			meta,
			bills: getBillsInProgress(docs, manifest)
		};
	} catch (e) {
		error(404, `Parliament not found: ${params.parliament}`);
	}
};
