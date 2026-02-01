import { listBoletines } from '$lib/server/boletin-loader';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const boletines = await listBoletines();
	return { boletines };
};
