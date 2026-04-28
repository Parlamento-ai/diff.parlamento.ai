/**
 * Connection to the research SQLite database.
 *
 * The DB is rebuilt by `npm run research:build` from the YAML corpus
 * under research/schema/data/. It's a build artifact, not committed.
 *
 * This module is server-only — never import it from a .svelte file
 * outside of +page.server.ts / +layout.server.ts.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../../research/schema/current';

const DB_PATH = join(process.cwd(), 'research', 'schema', 'research.db');

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _sqlite: Database.Database | null = null;

function open() {
	if (!existsSync(DB_PATH)) {
		throw new Error(
			`research.db not found at ${DB_PATH}. Run \`npm run research:build\` first.`
		);
	}
	_sqlite = new Database(DB_PATH, { readonly: true });
	_sqlite.pragma('journal_mode = WAL');
	_db = drizzle(_sqlite, { schema });
}

export function getDb() {
	if (!_db) open();
	return _db!;
}

/** Escape hatch for raw SQL — used by /demo/schema for table introspection. */
export function getSqlite() {
	if (!_sqlite) open();
	return _sqlite!;
}

export { schema };
