import { error, redirect } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js/lib/core';
import xml from 'highlight.js/lib/languages/xml';
import { sql } from 'drizzle-orm';
import { docs, slugToFile, getTermDef } from '$lib/docs';
import { loadManifest, loadDocument } from '$lib/server/explorer-loader';
import { loadExample } from '$lib/server/example-loader';
import { getDb, schema } from '../../demo/db';
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

type CountRow = { countryCode: string; type: string; n: number };

export const load: PageServerLoad = async ({ params }) => {
	const slug = params.slug;

	// AKN.db document types — overview of all 14 types and their links
	if (slug === 'akndb/document-types') {
		return {
			mode: 'akndb-document-types' as const,
			title: 'Tipos de documento',
			section: 'akndb',
			pageMetaTags: Object.freeze({
				title: 'Tipos de documento — AKN.db',
				openGraph: { title: 'Tipos de documento — AKN.db' }
			})
		};
	}

	// AKN.db overview — schema philosophy with live counts
	if (slug === 'akndb/overview') {
		const db = getDb();
		const rows = db
			.select({
				countryCode: schema.DocumentTable.countryCode,
				type: schema.DocumentTable.type,
				n: sql<number>`count(*)`.as('n')
			})
			.from(schema.DocumentTable)
			.groupBy(schema.DocumentTable.countryCode, schema.DocumentTable.type)
			.all() as CountRow[];

		const byCountry: Record<string, { type: string; n: number }[]> = {};
		let total = 0;
		for (const r of rows) {
			(byCountry[r.countryCode] ??= []).push({ type: r.type, n: r.n });
			total += r.n;
		}
		const targetCountries = ['cl', 'es', 'eu', 'pe', 'us'];

		return {
			mode: 'akndb-overview' as const,
			byCountry,
			total,
			targetCountries,
			title: 'AKN.db Overview',
			section: 'akndb',
			pageMetaTags: Object.freeze({
				title: 'AKN.db Overview — Diff Docs',
				openGraph: { title: 'AKN.db Overview — Diff Docs' }
			})
		};
	}

	// Bare explorer/<typeName> sidebar slugs (act, bill, debate, ...) redirect to the
	// schema reference page for that type. The schema view is the canonical "type details".
	const TOP_LEVEL_AKN_TYPES = new Set([
		'amendmentList',
		'officialGazette',
		'documentCollection',
		'act',
		'bill',
		'debateReport',
		'debate',
		'statement',
		'amendment',
		'judgment',
		'portion',
		'doc'
	]);
	if (slug.startsWith('explorer/')) {
		const tail = slug.slice('explorer/'.length);
		if (TOP_LEVEL_AKN_TYPES.has(tail)) {
			redirect(307, `/docs/explorer/schema/${tail}`);
		}
	}

	// AKN schema explorer — per-type structural view (reads vendored OASIS XSD via build-time JSON)
	if (slug.startsWith('explorer/schema/')) {
		const typeName = slug.slice('explorer/schema/'.length);

		// Top-level types have generated XSD JSON; deeper types (lifecycle, eventRef…)
		// don't, but we still want a docs page when there's a term-definition for them.
		let parsed: { name: string; doc?: string; root: unknown } | null = null;
		try {
			const schemaPath = join(process.cwd(), 'src/lib/akn-schema/generated', `${typeName}.json`);
			const raw = await readFile(schemaPath, 'utf-8');
			parsed = JSON.parse(raw) as { name: string; doc?: string; root: unknown };
		} catch {
			parsed = null;
		}

		const termDef = getTermDef(typeName);

		// 404 only if we have neither a schema tree nor a term definition.
		if (!parsed && !termDef) {
			error(404, `Schema not found for type: ${typeName}`);
		}

		let exampleHtml: string | undefined;
		let exampleCaption: string | undefined;
		let exampleSourceUrl: string | undefined;
		if (termDef?.exampleSource) {
			const ex = await loadExample(termDef.exampleSource.file, termDef.exampleSource.anchor);
			if (ex) {
				exampleHtml = hljs.highlight(ex.xml, { language: 'xml' }).value;
				exampleCaption = termDef.exampleSource.caption ?? ex.caption;
				exampleSourceUrl = ex.sourceUrl;
			}
		}

		return {
			mode: 'schema-type' as const,
			schema: parsed,
			typeName,
			termDef: termDef ?? null,
			exampleHtml: exampleHtml ?? null,
			exampleCaption: exampleCaption ?? null,
			exampleSourceUrl: exampleSourceUrl ?? null,
			title: `${typeName} — Schema reference`,
			section: 'explorer' as const,
			pageMetaTags: Object.freeze({
				title: `${typeName} — AKN schema reference`,
				openGraph: { title: `${typeName} — AKN schema reference` }
			})
		};
	}

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

	// Explorer document viewer (e.g. explorer/akn/poc/act/valencian-paella-recipe)
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
