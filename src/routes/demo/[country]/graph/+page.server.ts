import { error } from '@sveltejs/kit';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { getDb, schema } from '../../db';
import type { EntityType } from '../../entity-types';

export const prerender = true;

export function entries() {
	const db = getDb();
	return db.select({ country: schema.CountryTable.code }).from(schema.CountryTable).all();
}

const TITLE_MAX = 120;

function truncate(s: string): string {
	if (s.length <= TITLE_MAX) return s;
	return s.slice(0, TITLE_MAX - 1).trimEnd() + '…';
}

export async function load({ params, parent }) {
	const { country } = params;
	const layout = await parent();
	const known = layout.countries.find((c) => c.code === country);
	if (!known) throw error(404, `Unknown country: ${country}`);

	const db = getDb();

	const docs = db
		.select({
			id: schema.DocumentTable.id,
			type: schema.DocumentTable.type,
			nativeId: schema.DocumentTable.nativeId,
			title: schema.DocumentTable.title
		})
		.from(schema.DocumentTable)
		.where(eq(schema.DocumentTable.countryCode, country))
		.all();

	const nodes = docs.map((d) => ({
		id: d.id,
		type: d.type as EntityType,
		nativeId: d.nativeId,
		title: truncate(d.title)
	}));

	const ids = nodes.map((n) => n.id);
	const idSet = new Set(ids);

	let edges: { source: string; target: string; relation: string }[] = [];
	if (ids.length > 0) {
		const rows = db
			.select({
				fromId: schema.DocumentLinkTable.fromId,
				toId: schema.DocumentLinkTable.toId,
				relation: schema.DocumentLinkTable.relation
			})
			.from(schema.DocumentLinkTable)
			.where(
				and(
					isNull(schema.DocumentLinkTable.deactivatedAt),
					inArray(schema.DocumentLinkTable.fromId, ids)
				)
			)
			.all();

		edges = rows
			.filter((r) => idSet.has(r.toId) && r.fromId !== r.toId)
			.map((r) => ({ source: r.fromId, target: r.toId, relation: r.relation }));
	}

	return {
		country,
		meta: known,
		nodes,
		edges
	};
}
