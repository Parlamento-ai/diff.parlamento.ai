/**
 * Phase 2: Generate viewer-config.json + create directories
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import type { DiscoveredConfig } from '../types.js';
import { parseBillCelex, parseFinalCelex } from '../lib/helpers.js';

export function configure(config: DiscoveredConfig, outDir: string): void {
	const { slug, billCelex, finalCelex } = config;

	const regDir = resolve(outDir, slug);
	const srcDir = join(regDir, 'sources');
	const aknDir = join(regDir, 'akn');
	mkdirSync(srcDir, { recursive: true });
	mkdirSync(aknDir, { recursive: true });

	const hasEpAmendments = existsSync(join(srcDir, `ep-amendments-${slug}.xml`));
	const bill = parseBillCelex(billCelex);
	const final = parseFinalCelex(finalCelex);
	const typePrefix = final?.type === 'L' ? 'dir' : final?.type === 'D' ? 'dec' : 'reg';

	const viewerConfig = {
		slug: `${slug}-regulation`,
		sourcesDir: 'sources',
		outputDir: 'akn',
		billFile: `${billCelex}-bill-akn.xml`,
		finalFile: `${finalCelex}-akn.xml`,
		epAmendmentsFile: hasEpAmendments ? `ep-amendments-${slug}.xml` : null,
		proposal: {
			celex: billCelex,
			comYear: bill?.comYear ?? 0,
			comNum: bill?.comNum ?? 0,
			date: config.comDate ?? config.voteDate,
			title: `${config.title} — COM(${bill?.comYear ?? '?'}) ${bill?.comNum ?? '?'} Proposal`
		},
		final: {
			celex: finalCelex,
			regYear: final?.regYear ?? 0,
			regNum: final?.regNum ?? 0,
			date: config.pubDate ?? config.voteDate,
			pubDate: config.pubDate ?? config.voteDate,
			title: `${final?.type === 'L' ? 'Directive' : final?.type === 'D' ? 'Decision' : 'Regulation'} (EU) ${final?.regYear ?? '?'}/${final?.regNum ?? '?'} — ${config.title}`
		},
		legislativeProcedure: {
			procedure: config.procedure,
			voteDate: config.voteDate,
			voteFor: config.voteFor,
			voteAgainst: config.voteAgainst,
			voteAbstain: config.voteAbstain
		}
	};

	const configPath = join(regDir, 'viewer-config.json');
	writeFileSync(configPath, JSON.stringify(viewerConfig, null, 2), 'utf-8');
	console.log(`  Written: ${configPath}`);
}
