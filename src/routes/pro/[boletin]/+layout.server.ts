import { loadBoletin } from '$lib/server/boletin-loader';
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params }) => {
	try {
		const boletin = await loadBoletin(params.boletin);
		return {
			boletin: {
				slug: boletin.slug,
				title: boletin.title,
				timeline: boletin.timeline,
				procedureEvents: boletin.procedureEvents
			}
		};
	} catch {
		error(404, 'Boletín no encontrado');
	}
};
