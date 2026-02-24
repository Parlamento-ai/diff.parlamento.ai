/**
 * Phase 4: Convert formex → AKN + EP amendments HTML → AKN
 */
import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import type { DiscoveredConfig, StepResult } from '../types.js';
import { convertFormexToAkn } from '../lib/formex-to-akn.js';
import { convertEpAmendments } from '../lib/ep-amendments.js';
import { isEpPositionHtml, parseEpPosition } from '../lib/ep-position-parser.js';
import {
	countTag,
	extractFRBRuri,
	celexMatchesUri,
	isOjAmendmentHtml,
	parseBillCelex,
	deriveTaFromCelex
} from '../lib/helpers.js';

export async function convert(
	config: DiscoveredConfig,
	outDir: string
): Promise<StepResult[]> {
	const { slug, billCelex, finalCelex, epPositionCelex, taReference } = config;
	const regDir = resolve(outDir, slug);
	const srcDir = join(regDir, 'sources');

	const results: StepResult[] = [];
	const failed = new Set<string>();

	function record(
		step: number,
		id: string,
		name: string,
		status: 'PASS' | 'FAIL' | 'WARN',
		detail: string,
		t0: number
	) {
		results.push({ step, id, name, status, detail, elapsed: Date.now() - t0 });
		if (status === 'FAIL') failed.add(id);
	}

	// --- Step 1: Formex → AKN ---
	{
		const id = 'formex-to-akn',
			num = 1,
			name = 'Formex → AKN';
		const t0 = Date.now();
		const formexPath = join(srcDir, `${finalCelex}-formex.xml`);
		const finalAknPath = join(srcDir, `${finalCelex}-akn.xml`);

		if (!existsSync(formexPath)) {
			record(num, id, name, 'FAIL', 'formex source not found', t0);
		} else if (existsSync(finalAknPath)) {
			const xml = readFileSync(finalAknPath, 'utf-8');
			const articles = countTag(xml, 'article');
			record(
				num,
				id,
				name,
				articles > 0 ? 'PASS' : 'FAIL',
				articles > 0 ? `${articles} articles (cached)` : '0 articles cached',
				t0
			);
		} else {
			try {
				convertFormexToAkn(formexPath, finalAknPath);
				if (existsSync(finalAknPath)) {
					const xml = readFileSync(finalAknPath, 'utf-8');
					const articles = countTag(xml, 'article');
					record(
						num,
						id,
						name,
						articles > 0 ? 'PASS' : 'WARN',
						articles > 0 ? `${articles} articles` : '0 articles',
						t0
					);
				} else {
					record(num, id, name, 'FAIL', 'output not created', t0);
				}
			} catch (e: any) {
				record(num, id, name, 'FAIL', e.message || 'conversion error', t0);
			}
		}
	}

	// --- Step 2: EP amendments ---
	{
		const id = 'ep-amendments',
			num = 2,
			name = 'EP amendments';
		const t0 = Date.now();
		const epAmendmentsPath = join(srcDir, `ep-amendments-${slug}.xml`);

		if (existsSync(epAmendmentsPath)) {
			const xml = readFileSync(epAmendmentsPath, 'utf-8');
			const changes = countTag(xml, 'akndiff:articleChange');
			if (changes > 0) {
				record(num, id, name, 'PASS', `${changes} article changes (cached)`, t0);
			} else {
				unlinkSync(epAmendmentsPath);
			}
		}

		if (!results.find((r) => r.id === id)) {
			if (!epPositionCelex) {
				record(
					num,
					id,
					name,
					'WARN',
					'EP position CELEX not found (no SPARQL result)',
					t0
				);
			} else {
				const epHtmlName = taReference
					? `${taReference}_EN.html`
					: `${epPositionCelex}-ep-amendments.html`;
				const epHtmlPath = join(srcDir, epHtmlName);

				if (!existsSync(epHtmlPath)) {
					record(num, id, name, 'FAIL', 'EP HTML source not found', t0);
				} else {
					const html = readFileSync(epHtmlPath, 'utf-8');
					if (!isOjAmendmentHtml(html)) {
						record(
							num,
							id,
							name,
							'WARN',
							'No amendment tables in OJ HTML (trilogue text)',
							t0
						);
					} else {
						const taFile = deriveTaFromCelex(epPositionCelex);
						const billParsed = parseBillCelex(billCelex);
						const metadata = {
							name: `EP legislative resolution - ${config.title}`,
							workUri: `/akn/eu/amendment/ep/${config.voteDate}/${taFile?.replace('.html', '')}/main`,
							expressionUri: `/akn/eu/amendment/ep/${config.voteDate}/${taFile?.replace('.html', '')}/eng@${config.voteDate}`,
							date: config.voteDate,
							dateName: 'EP First Reading',
							authorHref: 'https://www.europarl.europa.eu',
							base: `http://data.europa.eu/eli/comProposal/${billParsed?.comYear ?? '0'}/${billParsed?.comNum ?? '0'}/en`,
							result: `/akn/eu/amendment/ep/${config.voteDate}/${taFile?.replace('.html', '')}/eng@${config.voteDate}`,
							voteFor: config.voteFor,
							voteAgainst: config.voteAgainst,
							voteAbstain: config.voteAbstain,
							prefaceTitle: `EP legislative resolution on ${config.title}`
						};

						// Save metadata for reference
						const metaTmpPath = join(srcDir, `_ep-meta-${slug}.json`);
						writeFileSync(metaTmpPath, JSON.stringify(metadata, null, 2), 'utf-8');

						try {
							convertEpAmendments(epHtmlPath, epAmendmentsPath, metadata);
							if (existsSync(epAmendmentsPath)) {
								const xml = readFileSync(epAmendmentsPath, 'utf-8');
								const changes = countTag(xml, 'akndiff:articleChange');
								record(
									num,
									id,
									name,
									changes > 0 ? 'PASS' : 'WARN',
									changes > 0 ? `${changes} article changes` : '0 articleChange',
									t0
								);
							} else {
								record(num, id, name, 'FAIL', 'output not created', t0);
							}
						} catch (e: any) {
							record(num, id, name, 'FAIL', e.message || 'conversion error', t0);
						}
					}
				}
			}
		}
	}

	// --- Step 3: EP Position (full text) ---
	{
		const id = 'ep-position',
			num = 3,
			name = 'EP Position';
		const t0 = Date.now();

		// Read viewer-config to check if this regulation uses ep-position-html
		const configPath = join(regDir, 'viewer-config.json');
		let hasEpPosition = false;
		if (existsSync(configPath)) {
			const viewerConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
			hasEpPosition = viewerConfig.timeline?.some(
				(e: { sourceType?: string }) => e.sourceType === 'ep-position-html'
			);
		}

		if (!hasEpPosition) {
			// Not applicable — skip silently
		} else {
			const epHtmlName = taReference
				? `${taReference}_EN.html`
				: `${epPositionCelex}-ep-amendments.html`;
			const epHtmlPath = join(srcDir, epHtmlName);
			const epPositionJsonPath = join(srcDir, `ep-position-${slug}.json`);

			if (existsSync(epPositionJsonPath)) {
				const cached = JSON.parse(readFileSync(epPositionJsonPath, 'utf-8'));
				record(num, id, name, 'PASS', `${cached.articles?.length ?? 0} articles (cached)`, t0);
			} else if (!existsSync(epHtmlPath)) {
				record(num, id, name, 'FAIL', 'EP Position HTML not found', t0);
			} else {
				const html = readFileSync(epHtmlPath, 'utf-8');
				if (!isEpPositionHtml(html)) {
					record(num, id, name, 'WARN', 'HTML is not EP Position format', t0);
				} else {
					const result = parseEpPosition(html);
					writeFileSync(epPositionJsonPath, JSON.stringify(result, null, 2), 'utf-8');
					record(
						num,
						id,
						name,
						result.articles.length > 0 ? 'PASS' : 'WARN',
						`${result.articles.length} articles parsed from EP Position`,
						t0
					);
				}
			}
		}
	}

	return results;
}
