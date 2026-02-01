import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js/lib/core';
import xml from 'highlight.js/lib/languages/xml';
import { docs, slugToFile } from '$lib/docs';
import type { PageServerLoad } from './$types';

hljs.registerLanguage('xml', xml);

const marked = new Marked(
	markedHighlight({
		langPrefix: 'hljs language-',
		highlight(code, lang) {
			if (lang && hljs.getLanguage(lang)) {
				return hljs.highlight(code, { language: lang }).value;
			}
			// Try auto-detecting for unlabeled blocks (most are XML)
			return hljs.highlightAuto(code).value;
		}
	})
);

export const load: PageServerLoad = async ({ params }) => {
	const slug = params.slug;
	const file = slugToFile[slug];

	if (!file) {
		error(404, 'Document not found');
	}

	const filePath = join(process.cwd(), 'docs', file);

	let raw: string;
	try {
		raw = await readFile(filePath, 'utf-8');
	} catch {
		error(404, 'Document not found');
	}

	const html = await marked.parse(raw, {
		gfm: true,
		breaks: false
	});

	const entry = docs.find((d) => d.slug === slug);

	const title = entry?.title ?? slug;

	return {
		html,
		title,
		section: entry?.section ?? 'akn',
		pageMetaTags: Object.freeze({
			title: `${title} — Diff Docs`,
			openGraph: {
				title: `${title} — Diff Docs`
			}
		})
	};
};
