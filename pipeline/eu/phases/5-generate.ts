/**
 * Phase 5: Generate viewer XMLs
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import type { DiscoveredConfig, StepResult } from '../types.js';
import { generateViewerXmls } from '../lib/viewer-generator.js';

export function generate(config: DiscoveredConfig, outDir: string): StepResult[] {
	const { slug } = config;
	const regDir = resolve(outDir, slug);
	const aknDir = join(regDir, 'akn');

	const results: StepResult[] = [];

	const id = 'viewer-xmls',
		num = 1,
		name = 'Viewer XMLs';
	const t0 = Date.now();
	const configPath = join(regDir, 'viewer-config.json');

	if (!existsSync(configPath)) {
		results.push({
			step: num,
			id,
			name,
			status: 'FAIL',
			detail: 'viewer-config.json not found',
			elapsed: Date.now() - t0
		});
		return results;
	}

	try {
		generateViewerXmls(configPath);

		// Determine expected files from timeline or legacy detection
		let expectedFiles: string[];
		const viewerConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
		if (viewerConfig.timeline) {
			expectedFiles = viewerConfig.timeline.map(
				(entry: { slug: string }, i: number) => {
					const num = String(i + 1).padStart(2, '0');
					return `${num}-${entry.slug}.xml`;
				}
			);
		} else {
			expectedFiles = ['01-act-original.xml', '03-act-final.xml'];
			const epAmendmentsPath = join(regDir, 'sources', `ep-amendments-${slug}.xml`);
			if (existsSync(epAmendmentsPath)) {
				expectedFiles.splice(1, 0, '02-amendment-1.xml');
			}
		}

		const existing = expectedFiles.filter((f) => existsSync(join(aknDir, f)));
		if (existing.length === expectedFiles.length)
			results.push({
				step: num,
				id,
				name,
				status: 'PASS',
				detail: `${existing.length} files`,
				elapsed: Date.now() - t0
			});
		else
			results.push({
				step: num,
				id,
				name,
				status: 'WARN',
				detail: `${existing.length}/${expectedFiles.length} files`,
				elapsed: Date.now() - t0
			});
	} catch (e: any) {
		results.push({
			step: num,
			id,
			name,
			status: 'FAIL',
			detail: e.message || 'unknown error',
			elapsed: Date.now() - t0
		});
	}

	return results;
}
