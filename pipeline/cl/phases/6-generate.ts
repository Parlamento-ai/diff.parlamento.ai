/**
 * Phase 6: GENERATE — Generate AKN XML files from parsed articles
 * 100% automated from config + parsed data
 */
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { buildBillXml, buildAmendmentXml, buildActXml } from '../lib/akn-xml-builder.js';
import { computeChangeSet } from '../lib/changeset-computer.js';
import type { PipelineConfig, Discovery } from '../types.js';
import type { ParsedDocuments } from './5-parse.js';

const TYPE_TO_FILENAME: Record<string, string> = {
	bill: 'bill',
	act: 'act',
	'act-original': 'act-original',
	'act-final': 'act-final'
};

export async function generate(
	config: PipelineConfig,
	discovery: Discovery,
	parsed: ParsedDocuments,
	outDir: string
): Promise<string[]> {
	console.log('\n=== Phase 6: GENERATE ===\n');

	const aknDir = join(outDir, 'akn');
	if (!existsSync(aknDir)) mkdirSync(aknDir, { recursive: true });

	const generated: string[] = [];
	let fileIndex = 1;

	for (const entry of config.timeline) {
		const num = String(fileIndex).padStart(2, '0');
		const fileName = `${num}-${TYPE_TO_FILENAME[entry.type] || entry.slug}.xml`;

		console.log(`  Generating ${fileName} (${entry.label})...`);

		let xml: string;

		switch (entry.type) {
			case 'bill': {
				const articles = parsed[entry.source] || [];
				if (articles.length === 0) {
					console.warn(`    WARNING: No articles found for source "${entry.source}"`);
				}
				xml = buildBillXml(
					articles,
					{
						boletin: config.boletin,
						slug: `${config.slug}-${entry.slug}`,
						date: entry.date,
						dateName: 'presentación',
						authorHref: `/cl/${discovery.camaraOrigen.toLowerCase() === 'senado' ? 'senador' : 'diputado'}/autor`
					},
					config.titulo
				);
				break;
			}

			case 'amendment': {
				// Get previous articles and current articles
				const prevEntry = config.timeline[config.timeline.indexOf(entry) - 1];
				const prevArticles = prevEntry ? parsed[prevEntry.source] || [] : [];
				const currentArticles = parsed[entry.source] || [];

				if (currentArticles.length === 0) {
					console.warn(`    WARNING: No articles found for source "${entry.source}"`);
				}

				// Compute changeSet
				const changes = computeChangeSet(prevArticles, currentArticles);
				console.log(
					`    Changes: ${changes.stats.substituted} sub, ${changes.stats.inserted} ins, ${changes.stats.repealed} rep`
				);
				console.log(`    Cross-check: ${changes.crossCheck}`);

				// Get vote data
				const vote =
					entry.voteIndex !== undefined ? discovery.votaciones[entry.voteIndex] : undefined;

				const baseUri = `/cl/boletin/${config.boletin}/esp@${prevEntry?.date || entry.date}`;
				const resultUri = `/cl/boletin/${config.boletin}/esp@${entry.date}`;

				// Determine chamber for vote labels
				const chamber = entry.chamber || (discovery.camaraOrigen.toLowerCase() === 'senado' ? 'senado' : 'camara');
				const chamberLabel: 'senador' | 'diputado' = chamber === 'camara' ? 'diputado' : 'senador';

				xml = buildAmendmentXml(
					changes.changes,
					{
						boletin: config.boletin,
						slug: `${config.slug}-${entry.slug}`,
						date: entry.date,
						dateName: 'trámite',
						authorHref: `/cl/${chamber}/sesion/${entry.date}`
					},
					entry.label,
					baseUri,
					resultUri,
					vote,
					chamberLabel
				);
				break;
			}

			case 'act':
			case 'act-original': {
				const articles = parsed[entry.source] || [];
				if (articles.length === 0) {
					console.warn(`    WARNING: No articles found for source "${entry.source}"`);
					if (entry.type === 'act-original') {
						console.warn('    Make sure LeyChile JSON was downloaded and parsed in phases 3-5');
					}
				}
				xml = buildActXml(
					articles,
					{
						boletin: config.boletin,
						slug: `${config.slug}-${entry.slug}`,
						date: entry.date,
						dateName: entry.type === 'act-original' ? 'versión pre-reforma' : 'promulgación',
						authorHref: entry.type === 'act-original' ? '/cl/congreso' : '/cl/presidente'
					},
					entry.type === 'act-original' ? config.titulo + ' (pre-reforma)' : config.titulo
				);
				break;
			}

			case 'act-final': {
				const articles = parsed[entry.source] || [];
				if (articles.length === 0) {
					console.warn(`    WARNING: No articles found for source "${entry.source}"`);
					console.warn('    Make sure LeyChile JSON was downloaded and parsed');
				}
				xml = buildActXml(
					articles,
					{
						boletin: config.boletin,
						slug: `${config.slug}-${entry.slug}`,
						date: entry.date,
						dateName: 'promulgación',
						authorHref: '/cl/presidente'
					},
					config.titulo
				);
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
