import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { getDb, schema } from '../db';

export const prerender = true;

export function entries() {
	const db = getDb();
	return db.select({ country: schema.CountryTable.code }).from(schema.CountryTable).all();
}

export async function load({ params, parent }) {
	const { country } = params;
	const layout = await parent();
	const known = layout.countries.find((c) => c.code === country);
	if (!known) throw error(404, `Unknown country: ${country}`);

	const db = getDb();
	const meta = db
		.select()
		.from(schema.CountryTable)
		.where(eq(schema.CountryTable.code, country))
		.get();

	return { country, meta };
}
