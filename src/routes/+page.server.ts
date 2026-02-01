import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		pageMetaTags: Object.freeze({
			titleTemplate: '%s',
			title: 'Diff — Comparado Legislativo Automatico'
		})
	};
};
