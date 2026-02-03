import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js/lib/core';
import xml from 'highlight.js/lib/languages/xml';
import { docs, slugToFile } from '$lib/docs';
import { loadManifest, loadDocument } from '$lib/server/explorer-loader';
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

	// Explorer overview page
	if (slug === 'explorer/overview') {
		const manifest = await loadManifest();
		return {
			mode: 'explorer-index' as const,
			documents: manifest.documents,
			title: 'AKN Explorer',
			section: 'explorer',
			pageMetaTags: Object.freeze({
				title: 'AKN Explorer — Diff Docs',
				openGraph: { title: 'AKN Explorer — Diff Docs' }
			})
		};
	}

	// Explorer document viewer (e.g. explorer/akn/poc/act/receta-paella-valenciana)
	if (slug.startsWith('explorer/') && slug !== 'explorer/overview') {
		const uri = '/' + slug.replace('explorer/', '');
		try {
			const [doc, manifest] = await Promise.all([loadDocument(uri), loadManifest()]);
			const entry = manifest.documents.find((d) => d.uri === uri);
			const title = entry?.title || doc.name;
			return {
				mode: 'explorer-doc' as const,
				document: {
					type: doc.type,
					name: doc.name,
					frbr: doc.frbr,
					root: doc.root,
					rawXml: doc.rawXml
				},
				uri,
				title,
				manifest: manifest.documents,
				section: 'explorer',
				pageMetaTags: Object.freeze({
					title: `${title} — AKN Explorer`,
					openGraph: { title: `${title} — AKN Explorer` }
				})
			};
		} catch {
			error(404, `Document not found: ${uri}`);
		}
	}

	// Regular markdown docs
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
		mode: 'markdown' as const,
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
