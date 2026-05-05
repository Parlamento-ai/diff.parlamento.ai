import { sql } from 'drizzle-orm';
import { getDb, schema } from './db';
import { ENTITY_TYPES, type EntityType } from './entity-types';
import { TAB_GROUPS } from './tab-groups';

export const prerender = true;

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

	const countsByCountry: Record<string, Record<string, number>> = {};
	for (const r of rows) {
		(countsByCountry[r.countryCode] ??= {})[r.type] = r.n;
	}

	const countryList = countries
		.filter((c) => countsByCountry[c.code])
		.sort((a, b) => a.code.localeCompare(b.code));

	const typesByCountry: Record<string, { type: EntityType; n: number }[]> = {};
	const groupCountsByCountry: Record<string, Record<string, number>> = {};

	for (const country of countryList) {
		const counts = countsByCountry[country.code] ?? {};
		typesByCountry[country.code] = ENTITY_TYPES.map((type) => ({
			type,
			n: counts[type] ?? 0
		}));

		const groupCounts: Record<string, number> = {};
		for (const g of TAB_GROUPS) {
			if (!g.types.length) continue;
			groupCounts[g.id] = g.types.reduce((s, t) => s + (counts[t] ?? 0), 0);
		}
		groupCountsByCountry[country.code] = groupCounts;
	}

	return { countries: countryList, typesByCountry, groupCountsByCountry };
}
