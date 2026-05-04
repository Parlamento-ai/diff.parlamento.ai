/**
 * Pulls a Tier-2 XML example out of the existing /docs/akn/*.md files.
 *
 * The lookup key is a heading anchor — for example, the markdown
 *
 *     ## `<lifecycle>` — Event history
 *
 * is matched by the slug "lifecycle-event-history". We find the heading, walk
 * forward to the first ```xml fenced block, and return the code (plus the line
 * of prose that immediately precedes the fence, when present, as the caption).
 *
 * Runtime extraction is intentional: the markdown files are already authored
 * and read elsewhere, and adding a build step felt like overhead for this
 * many lookups. If hot pages start hammering disk, promote to a build step.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export type LoadedExample = {
	xml: string;
	caption?: string;
	sourceFile: string;
	sourceUrl: string;
};

function slugify(s: string): string {
	// Strip the angle brackets but KEEP the element name itself, since
	// headings like "## `<lifecycle>` — Event history" want to slug as
	// "lifecycle-event-history".
	return s
		.toLowerCase()
		.replace(/<([^>]+)>/g, '$1')
		.replace(/[`*_]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function fileToDocsUrl(file: string): string {
	// 'akn/05-metadata.md' → '/docs/akn/metadata'
	const m = file.match(/^([^/]+)\/(?:\d+-)?(.+)\.md$/);
	if (!m) return '/docs/' + file.replace(/\.md$/, '');
	return `/docs/${m[1]}/${m[2]}`;
}

export async function loadExample(
	file: string,
	anchor: string
): Promise<LoadedExample | undefined> {
	const filePath = join(process.cwd(), 'docs', file);
	let raw: string;
	try {
		raw = await readFile(filePath, 'utf-8');
	} catch {
		return undefined;
	}

	const lines = raw.split('\n');
	let headingIdx = -1;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const m = line.match(/^(#{1,6})\s+(.*)$/);
		if (!m) continue;
		if (slugify(m[2]) === anchor) {
			headingIdx = i;
			break;
		}
	}
	if (headingIdx === -1) return undefined;

	// Find the next ```xml fence within the section
	let fenceStart = -1;
	let nextHeading = lines.length;
	for (let i = headingIdx + 1; i < lines.length; i++) {
		const line = lines[i];
		if (/^#{1,6}\s/.test(line)) {
			nextHeading = i;
			break;
		}
		if (line.startsWith('```xml')) {
			fenceStart = i;
			break;
		}
	}
	if (fenceStart === -1) return undefined;

	let fenceEnd = -1;
	for (let i = fenceStart + 1; i < lines.length; i++) {
		if (lines[i].startsWith('```')) {
			fenceEnd = i;
			break;
		}
	}
	if (fenceEnd === -1) return undefined;

	const xml = lines.slice(fenceStart + 1, fenceEnd).join('\n');

	// Caption: the last non-empty paragraph between the heading and the fence,
	// stripped of trailing colons and markdown fluff. Stays one line.
	let caption: string | undefined;
	for (let i = fenceStart - 1; i > headingIdx; i--) {
		const line = lines[i].trim();
		if (!line) continue;
		caption = line.replace(/[:.]\s*$/, '').trim();
		break;
	}

	return {
		xml,
		caption,
		sourceFile: file,
		sourceUrl: fileToDocsUrl(file)
	};
}
