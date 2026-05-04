import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { getDb, schema } from '../../../db';
import { parseBill, parseLinkedTimelineDocument } from '$lib/bill/parse';
import { analyzeAknDocument } from '$lib/aknlint/analyze';
import { billProfile } from '../../../../../../research/schema/profiles/bill';

export const prerender = true;

export function entries() {
	const db = getDb();
	return db
		.select({
			country: schema.DocumentTable.countryCode,
			id: schema.DocumentTable.nativeId
		})
		.from(schema.DocumentTable)
		.where(eq(schema.DocumentTable.type, 'bill'))
		.all();
}

export async function load({ params }) {
	const db = getDb();
	const { country, id } = params;

	const doc = db
		.select()
		.from(schema.DocumentTable)
		.where(
			and(
				eq(schema.DocumentTable.countryCode, country),
				eq(schema.DocumentTable.type, 'bill'),
				eq(schema.DocumentTable.nativeId, id)
			)
		)
		.get();

	if (!doc) {
		throw error(404, `bill ${country}/${id} not found`);
	}

	const parsed = parseBill(doc.xml);
	const lint = analyzeAknDocument(doc.xml, billProfile);

	// Amendments that reference this bill — via DocumentLinkTable. Any
	// amendment whose XML carries an akndiff:targetBill or a <ref href>
	// pointing at this bill produces an inbound link with relation 'amends'.
	const incomingAmendments = db
		.select({
			country: schema.DocumentTable.countryCode,
			type: schema.DocumentTable.type,
			nativeId: schema.DocumentTable.nativeId,
			title: schema.DocumentTable.title,
			xml: schema.DocumentTable.xml,
			publishedAt: schema.DocumentTable.publishedAt,
			lastActivityAt: schema.DocumentTable.lastActivityAt,
			relation: schema.DocumentLinkTable.relation
		})
		.from(schema.DocumentLinkTable)
		.innerJoin(
			schema.DocumentTable,
			eq(schema.DocumentTable.id, schema.DocumentLinkTable.fromId)
		)
		.where(
			and(
				eq(schema.DocumentLinkTable.toId, doc.id),
				eq(schema.DocumentTable.type, 'amendment')
			)
		)
		.all();

	parsed.timeline = [
		...parsed.timeline,
		...incomingAmendments.flatMap((amendment) =>
			parseLinkedTimelineDocument({
				xml: amendment.xml,
				origin: {
					type: 'amendment',
					nativeId: amendment.nativeId,
					title: amendment.title,
					href: `/demo/${amendment.country}/${amendment.type}/${amendment.nativeId}`
				}
			})
		)
	].sort((a, b) => {
		if (a.date !== b.date) return a.date < b.date ? -1 : 1;
		const aSource = a.origin?.type ?? 'bill';
		const bSource = b.origin?.type ?? 'bill';
		if (aSource !== bSource) return aSource === 'bill' ? -1 : 1;
		return a.id.localeCompare(b.id);
	});

	return {
		doc,
		parsed,
		amendments: incomingAmendments.map((amendment) => ({
			country: amendment.country,
			type: amendment.type,
			nativeId: amendment.nativeId,
			title: amendment.title,
			publishedAt: amendment.publishedAt,
			lastActivityAt: amendment.lastActivityAt,
			relation: amendment.relation
		})),
		lint
	};
}
