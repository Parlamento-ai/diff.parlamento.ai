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

	const billHrefs = [
		parsed.identification.frbrWork,
		parsed.identification.frbrExpression,
		parsed.identification.frbrManifestation
	].filter((href): href is string => Boolean(href));

	const relatedDebates = db
		.select({
			country: schema.DocumentTable.countryCode,
			type: schema.DocumentTable.type,
			nativeId: schema.DocumentTable.nativeId,
			title: schema.DocumentTable.title,
			xml: schema.DocumentTable.xml
		})
		.from(schema.DocumentTable)
		.where(
			and(
				eq(schema.DocumentTable.countryCode, country),
				eq(schema.DocumentTable.type, 'debate')
			)
		)
		.all()
		.filter((debate) => billHrefs.some((href) => debate.xml.includes(href)));

	const relatedCitations = db
		.select({
			country: schema.DocumentTable.countryCode,
			type: schema.DocumentTable.type,
			nativeId: schema.DocumentTable.nativeId,
			title: schema.DocumentTable.title,
			xml: schema.DocumentTable.xml
		})
		.from(schema.DocumentTable)
		.where(
			and(
				eq(schema.DocumentTable.countryCode, country),
				eq(schema.DocumentTable.type, 'citation')
			)
		)
		.all()
		.filter((citation) => billHrefs.some((href) => citation.xml.includes(href)));

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
		),
		...relatedDebates.flatMap((debate) =>
			parseLinkedTimelineDocument({
				xml: debate.xml,
				origin: {
					type: 'debate',
					nativeId: debate.nativeId,
					title: debate.title,
					href: `/demo/${debate.country}/${debate.type}/${debate.nativeId}`
				}
			})
		),
		...relatedCitations.flatMap((citation) =>
			parseLinkedTimelineDocument({
				xml: citation.xml,
				origin: {
					type: 'citation',
					nativeId: citation.nativeId,
					title: citation.title,
					href: `/demo/${citation.country}/${citation.type}/${citation.nativeId}`
				}
			})
		)
	].sort((a, b) => {
		if (a.date !== b.date) return a.date < b.date ? -1 : 1;
		const sourceOrder = { bill: 0, citation: 1, amendment: 2, debate: 3 };
		const aSource = sourceOrder[a.origin?.type ?? 'bill'];
		const bSource = sourceOrder[b.origin?.type ?? 'bill'];
		if (aSource !== bSource) return aSource - bSource;
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
