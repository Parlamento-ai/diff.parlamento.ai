import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { getDb, schema } from '../../../db';

export const prerender = true;

export function entries() {
	const db = getDb();
	return db
		.select({
			country: schema.DocumentTable.countryCode,
			type: schema.DocumentTable.type,
			nativeId: schema.DocumentTable.nativeId
		})
		.from(schema.DocumentTable)
		.all();
}

export async function load({ params }) {
	const db = getDb();
	const { country, type, nativeId } = params;

	const doc = db
		.select()
		.from(schema.DocumentTable)
		.where(
			and(
				eq(schema.DocumentTable.countryCode, country),
				eq(schema.DocumentTable.type, type as never),
				eq(schema.DocumentTable.nativeId, nativeId)
			)
		)
		.get();

	if (!doc) {
		throw error(404, `${country}/${type}/${nativeId} not found`);
	}

	const versions = db
		.select()
		.from(schema.DocumentVersionTable)
		.where(eq(schema.DocumentVersionTable.documentId, doc.id))
		.all();

	const events =
		doc.type === 'bill'
			? db
					.select()
					.from(schema.BillEventTable)
					.where(eq(schema.BillEventTable.billId, doc.id))
					.all()
			: [];

	// Outgoing + incoming links, joined to the other endpoint so we can
	// render its country/type/nativeId/title.
	const outgoing = db
		.select({
			id: schema.DocumentLinkTable.id,
			relation: schema.DocumentLinkTable.relation,
			ordinal: schema.DocumentLinkTable.ordinal,
			source: schema.DocumentLinkTable.source,
			otherCountry: schema.DocumentTable.countryCode,
			otherType: schema.DocumentTable.type,
			otherNativeId: schema.DocumentTable.nativeId,
			otherTitle: schema.DocumentTable.title
		})
		.from(schema.DocumentLinkTable)
		.innerJoin(schema.DocumentTable, eq(schema.DocumentTable.id, schema.DocumentLinkTable.toId))
		.where(eq(schema.DocumentLinkTable.fromId, doc.id))
		.all();

	const incoming = db
		.select({
			id: schema.DocumentLinkTable.id,
			relation: schema.DocumentLinkTable.relation,
			ordinal: schema.DocumentLinkTable.ordinal,
			source: schema.DocumentLinkTable.source,
			otherCountry: schema.DocumentTable.countryCode,
			otherType: schema.DocumentTable.type,
			otherNativeId: schema.DocumentTable.nativeId,
			otherTitle: schema.DocumentTable.title
		})
		.from(schema.DocumentLinkTable)
		.innerJoin(schema.DocumentTable, eq(schema.DocumentTable.id, schema.DocumentLinkTable.fromId))
		.where(eq(schema.DocumentLinkTable.toId, doc.id))
		.all();

	// Type-specific detail row.
	let detail: Record<string, unknown> | null = null;
	if (doc.type === 'bill') {
		detail =
			db
				.select()
				.from(schema.BillTable)
				.where(eq(schema.BillTable.documentId, doc.id))
				.get() ?? null;
	} else if (doc.type === 'act') {
		detail =
			db
				.select()
				.from(schema.ActTable)
				.where(eq(schema.ActTable.documentId, doc.id))
				.get() ?? null;
	} else if (doc.type === 'journal') {
		detail =
			db
				.select()
				.from(schema.JournalTable)
				.where(eq(schema.JournalTable.documentId, doc.id))
				.get() ?? null;
	}

	return { doc, detail, versions, events, outgoing, incoming };
}
