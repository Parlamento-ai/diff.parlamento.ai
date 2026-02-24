/**
 * Phase 2: Generate viewer-config.json + create directories
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import type { DiscoveredConfig } from '../types.js';
import { parseBillCelex, parseFinalCelex } from '../lib/helpers.js';
import { isEpPositionHtml } from '../lib/ep-position-parser.js';

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

	// Detect intermediate document type
	let intermediateType: 'ep-amendments' | 'ep-position' | 'none' = 'none';
	if (hasEpAmendments) {
		intermediateType = 'ep-amendments';
	} else if (config.taReference) {
		const taHtmlPath = join(srcDir, `${config.taReference}_EN.html`);
		if (existsSync(taHtmlPath)) {
			const html = readFileSync(taHtmlPath, 'utf-8');
			if (isEpPositionHtml(html)) intermediateType = 'ep-position';
		}
	}

	// Build timeline with real legislative steps
	const timeline: { slug: string; type: string; label: string; sourceType?: string }[] = [];
	timeline.push({ slug: 'act-original', type: 'act', label: 'COM Proposal' });
	if (intermediateType === 'ep-amendments') {
		timeline.push({ slug: 'amendment-1', type: 'amendment', label: 'EP First Reading', sourceType: 'ep-amendments-xml' });
	} else if (intermediateType === 'ep-position') {
		timeline.push({ slug: 'amendment-1', type: 'amendment', label: 'EP First Reading', sourceType: 'ep-position-html' });
	}
	timeline.push({ slug: 'act-final', type: 'act', label: 'Regulation Published' });

	const viewerConfig = {
		slug: `${slug}-regulation`,
		sourcesDir: 'sources',
		outputDir: 'akn',
		billFile: `${billCelex}-bill-akn.xml`,
		finalFile: `${finalCelex}-akn.xml`,
		epAmendmentsFile: hasEpAmendments ? `ep-amendments-${slug}.xml` : null,
		timeline,
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
