import { error } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import { getDb, schema } from '../../db';

export const prerender = false;

export async function load({ params }) {
	const db = getDb();
	const { country, type } = params;

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

	if (!docs.length) {
		throw error(404, `No ${type} documents for ${country}`);
	}

	return { country, type, docs };
}
