import { error } from '@sveltejs/kit';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { getDb, schema } from '../../../db';
import { ENTITY_TYPE_INFO } from '../../../entity-types';
import { TAB_GROUPS, getTabGroup } from '../../../tab-groups';

export const prerender = true;

export function entries() {
	const db = getDb();
	const countries = db.select({ country: schema.CountryTable.code }).from(schema.CountryTable).all();
	return countries.flatMap(({ country }) =>
		TAB_GROUPS.filter((g) => g.id !== 'home').map((g) => ({ country, group: g.id }))
	);
}

export async function load({ params }) {
	const { country, group } = params;
	const tabGroup = getTabGroup(group);
	if (!tabGroup || tabGroup.id === 'home') {
		throw error(404, `Unknown group: ${group}`);
	}

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
		.where(
			and(
				eq(schema.DocumentTable.countryCode, country),
				inArray(schema.DocumentTable.type, tabGroup.types as never[])
			)
		)
		.orderBy(desc(schema.DocumentTable.publishedAt))
		.all();

	const byType: Record<string, typeof docs> = {};
	for (const t of tabGroup.types) byType[t] = [];
	for (const d of docs) (byType[d.type] ??= []).push(d);

	return {
		country,
		group: tabGroup.id,
		groupLabel: tabGroup.label,
		types: tabGroup.types.map((t) => ({
			type: t,
			info: ENTITY_TYPE_INFO[t],
			docs: byType[t] ?? []
		}))
	};
}
