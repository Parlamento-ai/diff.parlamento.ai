import { getDb, schema } from './db';

export const prerender = false;

export async function load() {
	const db = getDb();
	const docs = db
		.select({
			id: schema.DocumentTable.id,
			countryCode: schema.DocumentTable.countryCode,
			type: schema.DocumentTable.type,
			nativeId: schema.DocumentTable.nativeId,
			title: schema.DocumentTable.title,
			publishedAt: schema.DocumentTable.publishedAt
		})
		.from(schema.DocumentTable)
		.all();

	docs.sort((a, b) => {
		if (a.countryCode !== b.countryCode) return a.countryCode.localeCompare(b.countryCode);
		if (a.type !== b.type) return a.type.localeCompare(b.type);
		return a.nativeId.localeCompare(b.nativeId);
	});

	return { docs };
}
