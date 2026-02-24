/**
 * Phase 2: CONFIGURE — Build timeline and download config from discovery
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Discovery, Config, TimelineConfig, DownloadItem } from '../types.js';
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

	// Build timeline
	const timeline: TimelineConfig[] = [];
	const downloads: DownloadItem[] = [];
	const downloadedCodes = new Set<string>();
	let index = 0;

	// Helper: get best download URL for a version
	const getUrl = (code: string): string => {
		const version = textVersions.find((v) => v.code.toUpperCase() === code.toUpperCase());
		return version?.govInfoUrl || billXmlUrl(billId, code);
	};

	// First version → bill
	const firstVersion = sortedVersions[0];
	if (firstVersion) {
		timeline.push({
			index,
			type: 'bill',
			label: versionCodeToLabel(firstVersion.code),
			date: firstVersion.date,
			versionCode: firstVersion.code
		});
		const code = firstVersion.code.toLowerCase();
		downloads.push({
			url: getUrl(firstVersion.code),
			filename: `${String(index + 1).padStart(2, '0')}-${code}.xml`,
			type: 'bill-xml'
		});
		downloadedCodes.add(code);
		index++;
	}

	// Each passage action → amendment
	for (const passage of passageActions) {
		const resultCode = findResultingVersion(passage, sortedVersions);
		if (!resultCode) continue;

		const code = resultCode.toLowerCase();
		const entry: TimelineConfig = {
			index,
			type: 'amendment',
			label: `${passage.chamber} Passage`,
			date: passage.date,
			versionCode: resultCode,
			voteRef: passage.voteRef,
			chamber: passage.chamber
		};
		timeline.push(entry);

		// Download the resulting bill version (if not already queued)
		if (!downloadedCodes.has(code)) {
			downloads.push({
				url: getUrl(resultCode),
				filename: `${String(index + 1).padStart(2, '0')}-${code}.xml`,
				type: 'bill-xml'
			});
			downloadedCodes.add(code);
		}

		// Download vote XML if roll call
		if (passage.voteRef) {
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
	}

	// If enacted → act (download ENR if not already)
	if (discovery.status === 'enacted') {
		const enrVersion = sortedVersions.find((v) => v.code.toLowerCase() === 'enr');
		if (enrVersion && !downloadedCodes.has('enr')) {
			downloads.push({
				url: getUrl('ENR'),
				filename: `${String(index + 1).padStart(2, '0')}-enr.xml`,
				type: 'bill-xml'
			});
			downloadedCodes.add('enr');
		}

		// Use the latest passage date as ENR date if ENR has no date
		const enrDate =
			enrVersion?.date ||
			passageActions[passageActions.length - 1]?.date ||
			'';

		timeline.push({
			index,
			type: 'act',
			label: publicLaw ? `Public Law ${publicLaw.congress}-${publicLaw.number}` : 'Enacted',
			date: enrDate,
			versionCode: 'ENR'
		});
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
			: t.type === 'amendment'
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

/** Find the version code that results from a passage action */
function findResultingVersion(
	passage: { chamber: string; date: string },
	versions: { code: string; date: string }[]
): string | undefined {
	if (passage.chamber === 'Senate') {
		const es = versions.find((v) => v.code.toUpperCase() === 'ES');
		if (es) return es.code;
		const eas = versions.find((v) => v.code.toUpperCase() === 'EAS');
		if (eas) return eas.code;
	}
	if (passage.chamber === 'House') {
		const eh = versions.find((v) => v.code.toUpperCase() === 'EH');
		if (eh) return eh.code;
		const eah = versions.find((v) => v.code.toUpperCase() === 'EAH');
		if (eah) return eah.code;
		// If House is the last chamber and bill originated in Senate,
		// House passage may go directly to ENR
		const enr = versions.find((v) => v.code.toUpperCase() === 'ENR');
		if (enr) return enr.code;
	}
	return undefined;
}
