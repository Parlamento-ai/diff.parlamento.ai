import { getSqlite } from '../db';
import { loadSchemaDocs, type TableDoc } from './parse-schema';
import { CONCEPT_GROUPS, CONCEPT_NOTES, WHERE_DOES_IT_GO } from './concept-notes';

export const prerender = false;

export type TableSummary = TableDoc & {
	rowCount: number;
	example: Record<string, unknown> | null;
};

export async function load() {
	const tableDocs = loadSchemaDocs();
	const sqlite = getSqlite();

	const summaries: TableSummary[] = tableDocs.map((td) => {
		let rowCount = 0;
		let example: Record<string, unknown> | null = null;
		try {
			const countRow = sqlite
				.prepare(`SELECT COUNT(*) AS c FROM "${td.dbName}"`)
				.get() as { c: number } | undefined;
			rowCount = countRow?.c ?? 0;
			if (rowCount > 0) {
				example =
					(sqlite
						.prepare(`SELECT * FROM "${td.dbName}" LIMIT 1`)
						.get() as Record<string, unknown> | undefined) ?? null;
			}
		} catch {
			// Table might not exist if the DB hasn't been built yet.
		}
		return { ...td, rowCount, example };
	});

	return {
		groups: CONCEPT_GROUPS,
		notes: CONCEPT_NOTES,
		whereDoesItGo: WHERE_DOES_IT_GO,
		tables: summaries
	};
}
