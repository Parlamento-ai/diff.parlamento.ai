/**
 * Phase 5: GENERATE — Produce AKN XML files from version snapshots
 *
 * For each timeline entry:
 *   - act-original: buildActXml with first snapshot
 *   - amendment-N:  computeChangeSet(prev, current) → buildAmendmentXml
 *   - act-final:    buildActXml with last snapshot
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { computeChangeSet } from '../../shared/changeset.js';
import { buildActXml, buildAmendmentXml } from '../lib/akn-builder.js';
import type { ESFRBRMeta } from '../lib/akn-builder.js';
import type { PipelineConfig, VersionSnapshot } from '../types.js';

export function generate(
	config: PipelineConfig,
	snapshots: VersionSnapshot[],
	outDir: string
): string[] {
	console.log('\n=== Phase 5: GENERATE ===\n');

	const aknDir = join(outDir, 'akn');
	if (!existsSync(aknDir)) mkdirSync(aknDir, { recursive: true });

	const generated: string[] = [];
	let fileIndex = 1;

	for (const entry of config.timeline) {
		const num = String(fileIndex).padStart(2, '0');
		const fileName = `${num}-${entry.slug}.xml`;

		console.log(`  Generating ${fileName} (${entry.label.slice(0, 50)})...`);

		const meta: ESFRBRMeta = {
			eli: config.eli,
			date: entry.date,
			dateName: entry.type === 'act-original' ? 'publicacion' : entry.type === 'act-final' ? 'vigente' : 'modificacion',
			authorHref: entry.type === 'amendment' ? `/es/congreso` : `/es/jefatura-del-estado`
		};

		let xml: string;

		switch (entry.type) {
			case 'act-original': {
				const snap = snapshots[0];
				if (!snap) {
					console.warn(`    WARNING: No snapshot for act-original, skipping`);
					continue;
				}
				xml = buildActXml(
					snap.articles,
					meta,
					`${config.slug}-original`,
					config.titulo
				);
				console.log(`    ${snap.articles.length} articles`);
				break;
			}

			case 'amendment': {
				// Find the snapshot index for this amendment
				const timelineIdx = config.timeline.indexOf(entry);
				const amendmentNum = config.timeline
					.slice(0, timelineIdx + 1)
					.filter((e) => e.type === 'amendment').length;

				const prevSnap = snapshots[amendmentNum - 1];
				const currSnap = snapshots[amendmentNum];

				if (!prevSnap || !currSnap) {
					console.warn(`    WARNING: Missing snapshots for amendment ${amendmentNum}, skipping`);
					continue;
				}

				// Convert to shared ParsedArticle format
				const oldArticles = prevSnap.articles.map((a) => ({
					eId: a.eId,
					num: a.num,
					heading: a.heading,
					content: a.content
				}));
				const newArticles = currSnap.articles.map((a) => ({
					eId: a.eId,
					num: a.num,
					heading: a.heading,
					content: a.content
				}));

				const changeResult = computeChangeSet(oldArticles, newArticles);
				console.log(
					`    Changes: ${changeResult.stats.substituted} sub, ${changeResult.stats.inserted} ins, ${changeResult.stats.repealed} rep`
				);

				const prevDate = prevSnap.fecha || entry.date;
				const baseUri = `${config.eli}/spa@${prevDate}`;
				const resultUri = `${config.eli}/spa@${entry.date}`;

				xml = buildAmendmentXml(
					changeResult.changes,
					meta,
					`${config.slug}-${entry.slug}`,
					entry.label,
					`Modificacion de ${config.titulo}`,
					baseUri,
					resultUri
				);
				break;
			}

			case 'act-final': {
				const snap = snapshots[snapshots.length - 1];
				if (!snap) {
					console.warn(`    WARNING: No snapshot for act-final, skipping`);
					continue;
				}
				xml = buildActXml(
					snap.articles,
					meta,
					`${config.slug}-vigente`,
					config.titulo
				);
				console.log(`    ${snap.articles.length} articles`);
				break;
			}

			default:
				console.warn(`    Unknown type: ${entry.type}`);
				continue;
		}

		const outPath = join(aknDir, fileName);
		writeFileSync(outPath, xml, 'utf-8');
		console.log(`    -> ${fileName} (${xml.length} chars)`);
		generated.push(fileName);
		fileIndex++;
	}

	console.log(`\n  Generated ${generated.length} AKN files in ${aknDir}`);
	return generated;
}
