import { listBoletines } from '$lib/server/boletin-loader';
import type { PageServerLoad } from './$types';

const DEV_SLUGS = [
	'ley-21735-boletin',
	'ley-21735-dl-3500',
	'ley-21735-dfl-5-2003',
	'ley-21735-ley-18045',
	'ley-21735-dfl-28',
	'ley-21735-ley-20880',
	'ley-18045-historia',
	'ley-21670-boletin',
	'ley-17370-boletin',
	'ley-21120-boletin',
	'eu-dma',
	'eu-dsa',
	'eu-ai-act',
	'eu-cra',
	'eu-data-act',
	'us-s5-laken-riley',
	'us-s269-improper-payments',
	'es-lo3-2018-proteccion-datos',
	'es-ley39-2015-procedimiento-administrativo'
];

export const load: PageServerLoad = async () => {
	const boletines = await listBoletines(DEV_SLUGS);
	return { boletines };
};
