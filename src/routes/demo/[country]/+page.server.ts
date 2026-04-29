import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { getDb, schema } from '../db';

export const prerender = false;

export async function load({ params, parent }) {
	const { country } = params;
	const layout = await parent();
	const types = layout.typesByCountry[country];

	if (!types?.length) {
		const known = layout.countries.find((c) => c.code === country);
		if (!known) throw error(404, `Unknown country: ${country}`);
		// Country exists but has no docs — fall through and render an empty state.
		const db = getDb();
		const meta = db
			.select()
			.from(schema.CountryTable)
			.where(eq(schema.CountryTable.code, country))
			.get();
		return { country, meta, types: [] };
	}

	throw redirect(307, `/demo/${country}/${types[0].type}`);
}
