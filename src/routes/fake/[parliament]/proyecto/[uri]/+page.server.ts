import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { loadParliamentMeta, loadBillDetail } from '$lib/server/parliament-loader';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const meta = await loadParliamentMeta(params.parliament);
		const billUri = decodeURIComponent(params.uri);
		const detail = await loadBillDetail(billUri);

		return {
			meta,
			bill: {
				type: detail.bill.type,
				name: detail.bill.name,
				frbr: detail.bill.frbr,
				root: detail.bill.root,
				rawXml: detail.bill.rawXml
			},
			entry: detail.entry,
			timeline: detail.timeline,
			relatedDocs: detail.relatedDocs.map((d) => ({
				entry: d.entry,
				doc: {
					type: d.doc.type,
					name: d.doc.name,
					frbr: d.doc.frbr
				}
			}))
		};
	} catch (e) {
		error(404, `Bill not found`);
	}
};
