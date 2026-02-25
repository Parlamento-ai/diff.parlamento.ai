/**
 * Phase 2: CONFIGURE — Build timeline and download config from discovery
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Discovery, Config, TimelineConfig, DownloadItem, PassageAction } from '../types.js';
import { billXmlUrl } from '../lib/govinfo.js';

/** Version codes ordered by legislative progression */
const VERSION_ORDER = ['ih', 'is', 'pcs', 'rfs', 'rds', 'rs', 'rh', 'rcs', 'es', 'eh', 'eas', 'eah', 'enr', 'plaw'];

function versionCodeToLabel(code: string): string {
	const labels: Record<string, string> = {
		ih: 'Introduced in House',
		is: 'Introduced in Senate',
		pcs: 'Placed on Calendar Senate',
		rfs: 'Referred in Senate',
		rds: 'Received in Senate',
		rs: 'Reported in Senate',
		rh: 'Reported in House',
		es: 'Engrossed in Senate',
		eh: 'Engrossed in House',
		eas: 'Engrossed Amendment Senate',
		eah: 'Engrossed Amendment House',
		enr: 'Enrolled Bill',
		pp: 'Public Print'
	};
	return labels[code.toLowerCase()] || code.toUpperCase();
}

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.slice(0, 50);
}

/** Infer chamber from version code */
function inferChamber(code: string): 'Senate' | 'House' | undefined {
	const lower = code.toLowerCase();
	if (['is', 'pcs', 'rfs', 'rds', 'rs', 'es', 'eas'].includes(lower)) return 'Senate';
	if (['ih', 'rh', 'rcs', 'eh', 'eah'].includes(lower)) return 'House';
	return undefined;
}

/** Map passage actions to the version codes they produce */
function buildPassageMap(
	passageActions: PassageAction[],
	sortedVersions: { code: string }[]
): Map<string, PassageAction> {
	const map = new Map<string, PassageAction>();
	const versionSet = new Set(sortedVersions.map((v) => v.code.toUpperCase()));

	for (const passage of passageActions) {
		let targetCode: string | undefined;
		if (passage.chamber === 'Senate') {
			if (versionSet.has('ES')) targetCode = 'ES';
			else if (versionSet.has('EAS')) targetCode = 'EAS';
		} else if (passage.chamber === 'House') {
			if (versionSet.has('EH')) targetCode = 'EH';
			else if (versionSet.has('EAH')) targetCode = 'EAH';
			else if (versionSet.has('ENR')) targetCode = 'ENR';
		}
		if (targetCode) {
			map.set(targetCode, passage);
		}
	}

	return map;
}

export async function configure(discovery: Discovery, outDir: string): Promise<Config> {
	console.log('\n=== Phase 2: CONFIGURE ===\n');

	const { billId, textVersions, passageActions, publicLaw } = discovery;

	// Filter out PLAW (not downloadable as Bill DTD XML from GovInfo bulk)
	const billVersions = textVersions.filter((v) => v.code.toUpperCase() !== 'PLAW');

	// Sort versions by legislative progression
	const sortedVersions = [...billVersions].sort((a, b) => {
		const ai = VERSION_ORDER.indexOf(a.code.toLowerCase());
		const bi = VERSION_ORDER.indexOf(b.code.toLowerCase());
		return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
	});

	// Map passage actions to their resulting version codes
	const passageMap = buildPassageMap(passageActions, sortedVersions);

	// Build timeline and downloads by iterating ALL versions
	const timeline: TimelineConfig[] = [];
	const downloads: DownloadItem[] = [];
	const downloadedCodes = new Set<string>();
	let index = 0;

	// Helper: get best download URL for a version
	const getUrl = (code: string): string => {
		const version = textVersions.find((v) => v.code.toUpperCase() === code.toUpperCase());
		return version?.govInfoUrl || billXmlUrl(billId, code);
	};

	for (let i = 0; i < sortedVersions.length; i++) {
		const version = sortedVersions[i];
		const code = version.code.toUpperCase();
		const codeLower = version.code.toLowerCase();
		const passage = passageMap.get(code);

		// Determine entry type
		let type: 'bill' | 'amendment' | 'act';
		if (i === 0) {
			type = 'bill';
		} else if (code === 'ENR' && discovery.status === 'enacted' && !passage) {
			// ENR without a passage action → just the act snapshot
			type = 'act';
		} else {
			type = 'amendment';
		}

		// Use passage date when available (textVersion date may be empty for ENR)
		const date = passage?.date || version.date;

		// Build label
		let label: string;
		if (type === 'act') {
			label = publicLaw ? `Public Law ${publicLaw.congress}-${publicLaw.number}` : 'Enacted';
		} else if (passage) {
			label = `${passage.chamber} Passage`;
		} else {
			label = versionCodeToLabel(version.code);
		}

		// Build timeline entry
		const entry: TimelineConfig = {
			index,
			type,
			label,
			date,
			versionCode: version.code
		};
		if (passage) {
			entry.chamber = passage.chamber;
			if (passage.voteRef) entry.voteRef = passage.voteRef;
		} else if (type === 'amendment') {
			const chamber = inferChamber(version.code);
			if (chamber) entry.chamber = chamber;
		}

		timeline.push(entry);

		// Queue download
		if (!downloadedCodes.has(codeLower)) {
			downloads.push({
				url: getUrl(version.code),
				filename: `${String(index + 1).padStart(2, '0')}-${codeLower}.xml`,
				type: 'bill-xml'
			});
			downloadedCodes.add(codeLower);
		}

		// Download vote XML if roll call
		if (passage?.voteRef) {
			const voteFilename =
				passage.voteRef.chamber === 'Senate'
					? `vote-senate-${String(passage.voteRef.rollNumber).padStart(3, '0')}.xml`
					: `vote-house-${String(passage.voteRef.rollNumber).padStart(3, '0')}.xml`;
			downloads.push({
				url: passage.voteRef.url,
				filename: voteFilename,
				type: 'vote-xml'
			});
		}

		index++;

		// Special case: ENR with passage AND enacted → also emit act entry
		if (code === 'ENR' && passage && discovery.status === 'enacted') {
			timeline.push({
				index,
				type: 'act',
				label: publicLaw ? `Public Law ${publicLaw.congress}-${publicLaw.number}` : 'Enacted',
				date: date || '',
				versionCode: 'ENR'
			});
			index++;
		}
	}

	// Generate slug
	const titleSlug = slugify(discovery.shortTitle || discovery.title);
	const slug = `${billId.type}${billId.number}-${billId.congress}-${titleSlug}`;

	const config: Config = {
		billId,
		title: discovery.title,
		slug,
		publicLaw,
		timeline,
		downloads
	};

	console.log(`  Slug: ${slug}`);
	console.log(`  Timeline: ${timeline.length} entries`);
	for (const t of timeline) {
		const voteInfo = t.voteRef
			? ` (roll call ${t.voteRef.chamber} #${t.voteRef.rollNumber})`
			: t.type === 'amendment' && t.label.toLowerCase().includes('passage')
				? ' (voice vote)'
				: '';
		console.log(`    ${t.index + 1}. [${t.type}] ${t.label} (${t.date})${voteInfo}`);
	}
	console.log(`  Downloads: ${downloads.length} files`);

	const outPath = join(outDir, 'config.json');
	writeFileSync(outPath, JSON.stringify(config, null, 2), 'utf-8');
	console.log(`  Saved: config.json`);

	return config;
}
