import { sql } from 'drizzle-orm';
import { getDb, schema } from '../db';

export const prerender = false;

type CountRow = { countryCode: string; type: string; n: number };

export async function load() {
	const db = getDb();

	const rows = db
		.select({
			countryCode: schema.DocumentTable.countryCode,
			type: schema.DocumentTable.type,
			n: sql<number>`count(*)`.as('n')
		})
		.from(schema.DocumentTable)
		.groupBy(schema.DocumentTable.countryCode, schema.DocumentTable.type)
		.all() as CountRow[];

	const byCountry: Record<string, { type: string; n: number }[]> = {};
	let total = 0;
	for (const r of rows) {
		(byCountry[r.countryCode] ??= []).push({ type: r.type, n: r.n });
		total += r.n;
	}

	const targetCountries = ['cl', 'es', 'eu', 'pe', 'us'];
	const present = new Set(Object.keys(byCountry));
	const missingCountries = targetCountries.filter((c) => !present.has(c));

	return { byCountry, total, missingCountries, targetCountries };
}
