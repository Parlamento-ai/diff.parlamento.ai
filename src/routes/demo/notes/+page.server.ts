import { isNotNull, asc, eq } from 'drizzle-orm';
import { getDb, schema } from '../db';

export const prerender = true;

export async function load() {
	const db = getDb();

	const notes = db
		.select({
			id: schema.DocumentTable.id,
			countryCode: schema.DocumentTable.countryCode,
			countryName: schema.CountryTable.name,
			type: schema.DocumentTable.type,
			nativeId: schema.DocumentTable.nativeId,
			title: schema.DocumentTable.title,
			publishedAt: schema.DocumentTable.publishedAt,
			researchNotes: schema.DocumentTable.researchNotes
		})
		.from(schema.DocumentTable)
		.innerJoin(
			schema.CountryTable,
			eq(schema.CountryTable.code, schema.DocumentTable.countryCode)
		)
		.where(isNotNull(schema.DocumentTable.researchNotes))
		.orderBy(
			asc(schema.DocumentTable.countryCode),
			asc(schema.DocumentTable.type),
			asc(schema.DocumentTable.nativeId)
		)
		.all();

	return { notes };
}
