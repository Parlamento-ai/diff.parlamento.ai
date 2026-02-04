import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { loadParliamentMeta, loadDocumentByUri } from '$lib/server/parliament-loader';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const meta = await loadParliamentMeta(params.parliament);
		const uri = '/' + params.slug;
		const { doc, entry, manifest } = await loadDocumentByUri(uri);

		return {
			meta,
			document: doc,
			uri,
			title: entry.title,
			manifest: manifest.documents,
			entry
		};
	} catch (e) {
		error(404, `Document not found`);
	}
};
