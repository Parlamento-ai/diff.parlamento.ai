import { error } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import { getDb, schema } from '../../db';
import { ENTITY_TYPE_INFO, ENTITY_TYPES, isEntityType } from '../../entity-types';

export const prerender = true;

export function entries() {
	const db = getDb();
	const countries = db.select({ country: schema.CountryTable.code }).from(schema.CountryTable).all();
	return countries.flatMap(({ country }) => ENTITY_TYPES.map((type) => ({ country, type })));
}

export async function load({ params }) {
	const db = getDb();
	const { country, type } = params;

	if (!isEntityType(type)) {
		throw error(404, `Unknown entity type: ${type}`);
	}

	const docs = db
		.select({
			id: schema.DocumentTable.id,
			countryCode: schema.DocumentTable.countryCode,
			type: schema.DocumentTable.type,
			nativeId: schema.DocumentTable.nativeId,
			title: schema.DocumentTable.title,
			publishedAt: schema.DocumentTable.publishedAt,
			lastActivityAt: schema.DocumentTable.lastActivityAt
		})
		.from(schema.DocumentTable)
		.where(
			and(
				eq(schema.DocumentTable.countryCode, country),
				eq(schema.DocumentTable.type, type as never)
			)
		)
		.orderBy(desc(schema.DocumentTable.publishedAt))
		.all();

	return { country, type, typeInfo: ENTITY_TYPE_INFO[type], docs };
}
