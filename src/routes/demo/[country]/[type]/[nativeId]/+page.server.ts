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

	// Each entity type has its own SQL table keyed by documentId. We also
	// surface the underlying SQL table name so the raw-view in the UI can
	// label both the shared row and the type-specific row clearly.
	const fetchDetail = (
		table:
			| typeof schema.BillTable
			| typeof schema.ActTable
			| typeof schema.AmendmentTable
			| typeof schema.JudgmentTable
			| typeof schema.JournalTable
			| typeof schema.DocumentCollectionTable
			| typeof schema.QuestionTable
			| typeof schema.CommunicationTable
			| typeof schema.DebateTable
			| typeof schema.CitationTable
			| typeof schema.ChangeSetTable
			| typeof schema.StatementTable
			| typeof schema.PortionTable
			| typeof schema.GenericDocTable
	): Record<string, unknown> | null =>
		(db
			.select()
			.from(table as never)
			.where(eq((table as { documentId: never }).documentId, doc.id))
			.get() as Record<string, unknown> | undefined) ?? null;

	let detail: Record<string, unknown> | null = null;
	let detailTableName: string | null = null;
	switch (doc.type) {
		case 'bill':
			detailTableName = 'diff_bills';
			detail = fetchDetail(schema.BillTable);
			break;
		case 'act':
			detailTableName = 'diff_acts';
			detail = fetchDetail(schema.ActTable);
			break;
		case 'amendment':
			detailTableName = 'diff_amendments';
			detail = fetchDetail(schema.AmendmentTable);
			break;
		case 'judgment':
			detailTableName = 'diff_judgments';
			detail = fetchDetail(schema.JudgmentTable);
			break;
		case 'journal':
			detailTableName = 'diff_journals';
			detail = fetchDetail(schema.JournalTable);
			break;
		case 'document_collection':
			detailTableName = 'diff_document_collections';
			detail = fetchDetail(schema.DocumentCollectionTable);
			break;
		case 'question':
			detailTableName = 'diff_questions';
			detail = fetchDetail(schema.QuestionTable);
			break;
		case 'communication':
			detailTableName = 'diff_communications';
			detail = fetchDetail(schema.CommunicationTable);
			break;
		case 'debate':
			detailTableName = 'diff_debates';
			detail = fetchDetail(schema.DebateTable);
			break;
		case 'citation':
			detailTableName = 'diff_citations';
			detail = fetchDetail(schema.CitationTable);
			break;
		case 'change_set':
			detailTableName = 'diff_change_sets';
			detail = fetchDetail(schema.ChangeSetTable);
			break;
		case 'statement':
			detailTableName = 'diff_statements';
			detail = fetchDetail(schema.StatementTable);
			break;
		case 'portion':
			detailTableName = 'diff_portions';
			detail = fetchDetail(schema.PortionTable);
			break;
		case 'doc':
			detailTableName = 'diff_generic_docs';
			detail = fetchDetail(schema.GenericDocTable);
			break;
	}

	return {
		doc,
		detail,
		detailTableName,
		documentTableName: 'diff_documents',
		versions,
		events,
		outgoing,
		incoming
	};
}
