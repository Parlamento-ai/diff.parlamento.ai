<script lang="ts">
	import type { ParsedSchema } from '$lib/akn-schema/types';
	import type { TermDef } from '$lib/docs/term-definitions';
	import SchemaTree from './SchemaTree.svelte';
	import TypePill from './TypePill.svelte';
	import AnatomyRowDetail from './AnatomyRowDetail.svelte';
	import {
		categoryOf,
		CATEGORY_STYLES,
		chipStyleOf,
		isDocumentType
	} from '$lib/docs/type-categories';

	let {
		schema,
		typeName,
		termDef,
		exampleHtml,
		exampleCaption,
		exampleSourceUrl
	}: {
		schema: ParsedSchema | null;
		typeName: string;
		termDef: TermDef | null;
		exampleHtml: string | null;
		exampleCaption: string | null;
		exampleSourceUrl: string | null;
	} = $props();

	const headerStyle = $derived(chipStyleOf(typeName));
	const headerLabel = $derived(
		isDocumentType(typeName) ? typeName : CATEGORY_STYLES[categoryOf(typeName)].label
	);

	// Tier 1 paragraph falls back to the schema's own doc field.
	const paragraph = $derived(termDef?.paragraph ?? schema?.doc ?? '');
	const fits = $derived(termDef?.fits);
	const siblings = $derived(termDef?.siblings ?? []);
	const anatomy = $derived(termDef?.anatomy);

	// Build the table rows. Each top-level row may carry inline children —
	// and each child can itself carry grandchildren — so the flat depth-tagged
	// parts list becomes a small tree.
	type AnatomyChild = {
		name: string;
		purpose: string;
		children: AnatomyChild[];
	};
	type AnatomyRow = {
		name: string;
		purpose: string;
		flavors?: string[];
		inlineChildren: AnatomyChild[];
	};
	const anatomyRows: AnatomyRow[] = $derived.by(() => {
		const parts = anatomy?.parts ?? [];
		const rows: AnatomyRow[] = [];
		// Walk the flat list, building a tree using depth.
		// Stack indices: stack[d] = the part at depth d we're currently inside.
		const stack: AnatomyChild[] = [];
		let currentRow: AnatomyRow | null = null;
		for (const p of parts) {
			const depth = p.depth ?? 0;
			if (depth === 0) {
				currentRow = {
					name: p.name,
					purpose: p.purpose,
					flavors: p.flavors,
					inlineChildren: []
				};
				rows.push(currentRow);
				stack.length = 0;
			} else if (currentRow) {
				const child: AnatomyChild = { name: p.name, purpose: p.purpose, children: [] };
				if (depth === 1) {
					currentRow.inlineChildren.push(child);
				} else {
					const parent = stack[depth - 2];
					if (parent) parent.children.push(child);
					else currentRow.inlineChildren.push(child); // fallback if data is malformed
				}
				stack[depth - 1] = child;
				stack.length = depth;
			}
		}
		return rows;
	});
</script>

<article class="space-y-8">
	<!-- ─── Tier 1 — Definition ─────────────────────────────────────── -->
	<section id="definition" class="space-y-4 scroll-mt-20">
		<header class="space-y-3">
			<div class="flex items-center gap-3 flex-wrap">
				<h1 class="font-mono text-2xl text-gray-900">&lt;{typeName}&gt;</h1>
				<span
					class="inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide {headerStyle.chip}"
				>
					<span class="w-1.5 h-1.5 rounded-full {headerStyle.dot}"></span>
					{headerLabel}
				</span>
				<span class="text-xs uppercase tracking-wide text-gray-400">AKN schema reference</span>
			</div>
			{#if paragraph}
				<p class="text-gray-700 max-w-3xl whitespace-pre-line text-base leading-relaxed">
					{paragraph}
				</p>
			{/if}
			{#if fits}
				<p class="text-sm text-gray-600 max-w-3xl">
					<span class="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mr-2">Where it fits</span>
					{fits}
				</p>
			{/if}
		</header>

		{#if siblings.length > 0}
			<div class="flex flex-wrap items-center gap-2 max-w-3xl">
				<span class="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Related</span>
				{#each siblings as s (s)}
					<TypePill typeName={s} />
				{/each}
			</div>
		{/if}
	</section>

	<!-- ─── Tier 1.5 — Anatomy (XSD for kids) ──────────────────────── -->
	{#if anatomy}
		<section id="anatomy" class="space-y-3 scroll-mt-20">
			<header class="flex items-baseline gap-2">
				<h2 class="text-sm font-semibold uppercase tracking-wide text-gray-700">
					What's inside
				</h2>
				<span class="text-xs text-gray-400">— the gist, in plain language. Click a row for more.</span>
			</header>
			{#if anatomy.intro}
				<p class="text-sm text-gray-600 max-w-3xl leading-relaxed">{anatomy.intro}</p>
			{/if}
			<div class="max-w-3xl border border-gray-200 rounded-md overflow-hidden">
				{#each anatomyRows as row, i (row.name)}
					<details class="group {i > 0 ? 'border-t border-gray-200' : ''}">
						<summary
							class="flex items-baseline gap-3 px-4 py-2.5 cursor-pointer list-none select-none hover:bg-gray-50 transition-colors"
						>
							<span class="text-gray-300 transition-transform group-open:rotate-90 text-xs leading-none pt-0.5"
								>▸</span
							>
							<span class="font-mono text-sm text-gray-900 shrink-0">&lt;{row.name}&gt;</span>
							<span class="text-sm text-gray-700">{row.purpose}</span>
						</summary>
						<div class="border-t border-gray-100">
							<AnatomyRowDetail name={row.name} inlineChildren={row.inlineChildren} />
							{#if row.flavors && row.flavors.length > 0}
								<div class="px-4 py-3 bg-gray-50 border-l-2 border-gray-200 space-y-1.5">
									<div class="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">
										Flavors
									</div>
									<ul class="space-y-0.5">
										{#each row.flavors as flavor (flavor)}
											<li class="text-xs text-gray-600">
												<span class="text-gray-400">→</span>
												{flavor}
											</li>
										{/each}
									</ul>
								</div>
							{/if}
						</div>
					</details>
				{/each}
			</div>
		</section>
	{/if}

	<!-- ─── Tier 2 — Real example ──────────────────────────────────── -->
	{#if exampleHtml}
		<section id="example" class="space-y-3 scroll-mt-20">
			<header class="flex items-baseline gap-2">
				<h2 class="text-sm font-semibold uppercase tracking-wide text-gray-700">Example</h2>
				{#if exampleSourceUrl}
					<a
						href={exampleSourceUrl}
						class="text-xs text-addition-700 hover:text-addition-500 underline underline-offset-2"
					>
						read more →
					</a>
				{/if}
			</header>
			{#if exampleCaption}
				<p class="text-sm text-gray-600 max-w-3xl">{exampleCaption}</p>
			{/if}
			<pre
				class="bg-gray-900 text-gray-100 rounded-lg border border-gray-800 p-4 overflow-x-auto text-xs leading-relaxed"><code class="hljs language-xml">{@html exampleHtml}</code></pre>
		</section>
	{:else if !termDef?.exampleSource}
		<section id="example" class="scroll-mt-20">
			<p class="text-xs text-gray-400 italic max-w-3xl">
				No curated example yet for &lt;{typeName}&gt; — see the formal spec below.
			</p>
		</section>
	{/if}

	<!-- ─── Tier 3 — Formal spec (collapsed) ────────────────────────── -->
	{#if schema}
		<section id="spec" class="scroll-mt-20">
			<details class="group">
				<summary
					class="flex items-center gap-2 cursor-pointer list-none select-none py-2 px-3 rounded border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
				>
					<span class="text-gray-400 transition-transform group-open:rotate-90">▸</span>
					<span class="text-sm font-semibold text-gray-700">View formal schema (XSD-derived)</span>
					<span class="text-xs text-gray-400">— {schema.root.kind === 'element' ? schema.root.children.length : 0} top-level children</span>
				</summary>

				<div class="mt-4 space-y-4">
					<p class="text-xs text-gray-500 max-w-3xl">
						Generated from
						<a
							href="https://docs.oasis-open.org/legaldocml/akn-core/v1.0/os/part2-specs/schemas/akomantoso30.xsd"
							class="underline underline-offset-2 hover:text-gray-700"
							rel="external"
							target="_blank">akomantoso30.xsd</a
						>
						(OASIS Akoma Ntoso v1.0). Click any
						<span class="text-gray-700">&lt;ref&gt;</span> to navigate to that element's own page.
					</p>

					<section class="card-layout p-4 overflow-x-auto">
						<SchemaTree root={schema.root} />
					</section>

					<section class="text-xs text-gray-500 space-y-2 max-w-3xl">
						<h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Cardinality legend</h3>
						<ul class="space-y-1.5">
							<li>
								<span class="font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px]">1</span>
								required, exactly once
							</li>
							<li>
								<span class="font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px]">0..1</span>
								optional, at most once
							</li>
							<li>
								<span class="font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px]">0..∞</span>
								zero or more
							</li>
							<li>
								<span class="font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px]">1..∞</span>
								one or more
							</li>
							<li>
								<span class="font-mono px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px]">choice</span>
								exactly one of the listed children must appear
							</li>
						</ul>
						<h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide pt-3">Category legend</h3>
						<p class="text-gray-500 max-w-prose">
							Each top-level document type carries its own accent color (see the sidebar).
							Sub-elements share these five category buckets.
						</p>
						<ul class="space-y-1.5">
							{#each Object.entries(CATEGORY_STYLES) as [key, st] (key)}
								<li class="flex items-center gap-2">
									<span class="w-1.5 h-1.5 rounded-full {st.dot}"></span>
									<span class="text-gray-600">{st.label}</span>
								</li>
							{/each}
						</ul>
					</section>
				</div>
			</details>
		</section>
	{:else}
		<section id="spec" class="scroll-mt-20">
			<p class="text-xs text-gray-500 max-w-3xl italic">
				No standalone XSD page is generated for &lt;{typeName}&gt; — it is a
				nested element. Open a top-level type (e.g.
				<a href="/docs/explorer/schema/bill" class="text-addition-700 hover:text-addition-500 underline underline-offset-2">bill</a>)
				to see &lt;{typeName}&gt; in the formal schema tree.
			</p>
		</section>
	{/if}
</article>
