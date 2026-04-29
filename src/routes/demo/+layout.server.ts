import { sql } from 'drizzle-orm';
import { getDb, schema } from './db';

export const prerender = false;

type Row = { countryCode: string; type: string; n: number };

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
		.all() as Row[];

	const countries = db
		.select({ code: schema.CountryTable.code, name: schema.CountryTable.name })
		.from(schema.CountryTable)
		.all();

	const typesByCountry: Record<string, { type: string; n: number }[]> = {};
	for (const r of rows) {
		(typesByCountry[r.countryCode] ??= []).push({ type: r.type, n: r.n });
	}
	for (const code of Object.keys(typesByCountry)) {
		typesByCountry[code].sort((a, b) => a.type.localeCompare(b.type));
	}

	const countryList = countries
		.filter((c) => typesByCountry[c.code]?.length)
		.sort((a, b) => a.code.localeCompare(b.code));

	return { countries: countryList, typesByCountry };
}
