/**
 * Phase 3: DOWNLOAD — Fetch bill XMLs and vote XMLs
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Config } from '../types.js';

export async function download(config: Config, outDir: string): Promise<void> {
	console.log('\n=== Phase 3: DOWNLOAD ===\n');

	const srcDir = join(outDir, 'sources');
	if (!existsSync(srcDir)) mkdirSync(srcDir, { recursive: true });

	let downloaded = 0;
	let cached = 0;

	for (const item of config.downloads) {
		const dest = join(srcDir, item.filename);

		// Skip if already downloaded and non-empty
		if (existsSync(dest)) {
			const { statSync } = await import('node:fs');
			const stat = statSync(dest);
			if (stat.size > 100) {
				console.log(`  [CACHED] ${item.filename}`);
				cached++;
				continue;
			}
		}

		console.log(`  Downloading ${item.filename}...`);
		console.log(`    URL: ${item.url}`);

		try {
			const res = await fetch(item.url);
			if (!res.ok) {
				console.error(`    FAILED: HTTP ${res.status}`);
				continue;
			}
			const text = await res.text();

			// Basic validation
			if (text.length < 100) {
				console.error(`    FAILED: Response too small (${text.length} bytes)`);
				continue;
			}
			if (item.type === 'bill-xml' && !text.includes('<bill')) {
				console.warn(`    WARNING: No <bill> tag found in ${item.filename}`);
			}
			if (item.type === 'vote-xml' && !text.includes('<roll_call_vote') && !text.includes('<rollcall-vote')) {
				console.warn(`    WARNING: No vote root element found in ${item.filename}`);
			}

			writeFileSync(dest, text, 'utf-8');
			console.log(`    OK (${text.length} bytes)`);
			downloaded++;
		} catch (err: any) {
			console.error(`    FAILED: ${err.message}`);
		}
	}

	console.log(`\n  Downloaded: ${downloaded}, Cached: ${cached}, Total: ${config.downloads.length}`);
}
