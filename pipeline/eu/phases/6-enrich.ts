/**
 * Phase 6: Enrich with communication, votes, citation, gazette
 */
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import type { DiscoveredConfig, StepResult } from '../types.js';
import { buildCommunication } from '../lib/ep-communication.js';
import { buildVotes } from '../lib/ep-votes.js';
import { buildCitation } from '../lib/ep-citation.js';
import { downloadFormexToc } from '../lib/cellar-formex.js';
import { convertFormexTocToGazette } from '../lib/formex-gazette.js';
import { countTag } from '../lib/helpers.js';

export async function enrich(
	config: DiscoveredConfig,
	outDir: string
): Promise<StepResult[]> {
	const { slug, finalCelex } = config;
	const regDir = resolve(outDir, slug);
	const srcDir = join(regDir, 'sources');
	mkdirSync(srcDir, { recursive: true });

	const results: StepResult[] = [];

	const procId = config.procedure.replace(/\(.*\)/, '').replace(/\//g, '-');
	const procType = config.procedure.match(/\((\w+)\)/)?.[1] ?? 'COD';
	const commRef = `${procId}-${procType}`;
	const meetingId = `MTG-PL-${config.voteDate}`;

	// --- Communication ---
	{
		const id = 'communication',
			num = 1,
			name = 'Communication';
		const t0 = Date.now();
		const commPath = join(srcDir, `eu-communication-${commRef}.xml`);

		if (existsSync(commPath)) {
			const xml = readFileSync(commPath, 'utf-8');
			const events = countTag(xml, 'section');
			results.push({
				step: num,
				id,
				name,
				status: events > 0 ? 'PASS' : 'FAIL',
				detail: events > 0 ? `${events} events (cached)` : '0 events cached',
				elapsed: Date.now() - t0
			});
		} else {
			try {
				const procYear = config.procedure.substring(0, 4);
				const procApiId = config.procedure.replace(/\(.*\)/, '').replace('/', '-');
				await buildCommunication(procYear, procApiId, procType, commPath);
				if (existsSync(commPath)) {
					const xml = readFileSync(commPath, 'utf-8');
					const events = countTag(xml, 'section');
					results.push({
						step: num,
						id,
						name,
						status: events > 0 ? 'PASS' : 'WARN',
						detail: events > 0 ? `${events} events` : '0 events',
						elapsed: Date.now() - t0
					});
				} else {
					results.push({
						step: num,
						id,
						name,
						status: 'FAIL',
						detail: 'output not created',
						elapsed: Date.now() - t0
					});
				}
			} catch (e: any) {
				const cleanErr = e.message
					? e.message.match(/HTTP (\d+)/)?.[0] ?? e.message.slice(0, 80)
					: 'unknown error';
				results.push({
					step: num,
					id,
					name,
					status: 'FAIL',
					detail: cleanErr,
					elapsed: Date.now() - t0
				});
			}
		}
	}

	// --- Votes ---
	{
		const id = 'votes',
			num = 2,
			name = 'Votes';
		const t0 = Date.now();
		const votesPath = join(srcDir, `eu-votes-${meetingId}.xml`);

		if (existsSync(votesPath)) {
			const xml = readFileSync(votesPath, 'utf-8');
			const decisions = countTag(xml, 'section');
			results.push({
				step: num,
				id,
				name,
				status: decisions > 0 ? 'PASS' : 'FAIL',
				detail: decisions > 0 ? `${decisions} decisions (cached)` : '0 decisions cached',
				elapsed: Date.now() - t0
			});
		} else {
			try {
				await buildVotes(meetingId, 0, votesPath);
				if (existsSync(votesPath)) {
					const xml = readFileSync(votesPath, 'utf-8');
					const decisions = countTag(xml, 'section');
					results.push({
						step: num,
						id,
						name,
						status: decisions > 0 ? 'PASS' : 'WARN',
						detail: decisions > 0 ? `${decisions} decisions` : '0 decisions',
						elapsed: Date.now() - t0
					});
				} else {
					results.push({
						step: num,
						id,
						name,
						status: 'FAIL',
						detail: 'output not created',
						elapsed: Date.now() - t0
					});
				}
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
		}
	}

	// --- Citation ---
	{
		const id = 'citation',
			num = 3,
			name = 'Citation';
		const t0 = Date.now();
		const citationPath = join(srcDir, `eu-citation-${meetingId}.xml`);

		if (existsSync(citationPath)) {
			const xml = readFileSync(citationPath, 'utf-8');
			const items = countTag(xml, 'section');
			results.push({
				step: num,
				id,
				name,
				status: items > 0 ? 'PASS' : 'FAIL',
				detail: items > 0 ? `${items} agenda items (cached)` : '0 items cached',
				elapsed: Date.now() - t0
			});
		} else {
			try {
				await buildCitation(meetingId, citationPath);
				if (existsSync(citationPath)) {
					const xml = readFileSync(citationPath, 'utf-8');
					const items = countTag(xml, 'section');
					results.push({
						step: num,
						id,
						name,
						status: items > 0 ? 'PASS' : 'WARN',
						detail: items > 0 ? `${items} agenda items` : '0 items',
						elapsed: Date.now() - t0
					});
				} else {
					results.push({
						step: num,
						id,
						name,
						status: 'FAIL',
						detail: 'output not created',
						elapsed: Date.now() - t0
					});
				}
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
		}
	}

	// --- Gazette ---
	{
		const id = 'gazette',
			num = 4,
			name = 'Gazette';
		const t0 = Date.now();
		const gazetteTocPath = join(srcDir, `${finalCelex}-toc-formex.xml`);
		const gazetteAknPath = join(srcDir, `gazette-${slug}.xml`);

		if (existsSync(gazetteAknPath)) {
			const xml = readFileSync(gazetteAknPath, 'utf-8');
			const docs = countTag(xml, 'component');
			results.push({
				step: num,
				id,
				name,
				status: docs > 0 ? 'PASS' : 'FAIL',
				detail: docs > 0 ? `${docs} OJ entries (cached)` : '0 entries cached',
				elapsed: Date.now() - t0
			});
		} else {
			// Download TOC formex if needed
			if (!existsSync(gazetteTocPath)) {
				try {
					await downloadFormexToc(finalCelex, srcDir);
				} catch {
					// TOC not available is non-fatal
				}
			}

			if (!existsSync(gazetteTocPath)) {
				results.push({
					step: num,
					id,
					name,
					status: 'WARN',
					detail: 'TOC formex not available from CELLAR',
					elapsed: Date.now() - t0
				});
			} else {
				try {
					convertFormexTocToGazette(gazetteTocPath, gazetteAknPath);
					if (existsSync(gazetteAknPath)) {
						const xml = readFileSync(gazetteAknPath, 'utf-8');
						const docs = countTag(xml, 'component');
						results.push({
							step: num,
							id,
							name,
							status: docs > 0 ? 'PASS' : 'WARN',
							detail: docs > 0 ? `${docs} OJ entries` : '0 entries',
							elapsed: Date.now() - t0
						});
					} else {
						results.push({
							step: num,
							id,
							name,
							status: 'FAIL',
							detail: 'conversion failed',
							elapsed: Date.now() - t0
						});
					}
				} catch (e: any) {
					results.push({
						step: num,
						id,
						name,
						status: 'FAIL',
						detail: e.message || 'conversion error',
						elapsed: Date.now() - t0
					});
				}
			}
		}
	}

	return results;
}
