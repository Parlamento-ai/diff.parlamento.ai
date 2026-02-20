import { listBoletines } from '$lib/server/boletin-loader';
import type { PageServerLoad } from './$types';

const RECETA_SLUGS = [
	'empanadas-de-pino',
	'feijoada-carioca',
	'milanesa-argentina',
	'pan-de-campo',
	'paella-valenciana',
	'ratatouille-nicoise'
];

export const load: PageServerLoad = async () => {
	const boletines = await listBoletines(RECETA_SLUGS);
	return { boletines };
};
