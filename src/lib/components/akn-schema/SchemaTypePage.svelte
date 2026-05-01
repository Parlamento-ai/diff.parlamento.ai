<script lang="ts">
	import type { ParsedSchema } from '$lib/akn-schema/types';
	import SchemaTree from './SchemaTree.svelte';

	let {
		schema,
		typeName,
		topLevelTypes
	}: { schema: ParsedSchema; typeName: string; topLevelTypes: string[] } = $props();
</script>

<article class="space-y-6">
	<header class="space-y-3">
		<div class="flex items-baseline gap-3">
			<h1 class="font-mono text-2xl text-gray-900">&lt;{typeName}&gt;</h1>
			<span class="text-xs uppercase tracking-wide text-gray-400">AKN schema reference</span>
		</div>
		{#if schema.doc}
			<p class="text-gray-700 max-w-3xl whitespace-pre-line">{schema.doc}</p>
		{/if}
		<p class="text-xs text-gray-500">
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
	</header>

	<nav
		class="flex flex-wrap gap-1.5 text-xs font-mono border-b border-gray-200 pb-3"
		aria-label="Top-level AKN types"
	>
		<span class="text-gray-400 uppercase tracking-wide pr-2 self-center">Types</span>
		{#each topLevelTypes as t (t)}
			<a
				href="/docs/explorer/schema/{t}"
				class="px-2 py-0.5 rounded border {t === typeName
					? 'bg-gray-900 text-white border-gray-900'
					: 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:text-gray-900'}"
			>
				{t}
			</a>
		{/each}
	</nav>

	<section class="card-layout p-4 overflow-x-auto">
		<SchemaTree root={schema.root} />
	</section>

	<section class="text-xs text-gray-500 space-y-2 max-w-3xl">
		<h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Legend</h2>
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
		<p class="pt-2 text-gray-400">
			Tree depth is limited so each page stays focused on this element's direct content model.
			Children that have their own structure show as <code class="font-mono text-gray-600">→ ref</code>
			links — only types in the top-row currently have dedicated pages; deeper element pages can be added
			by re-running <code class="font-mono">npm run akn-schema:build</code>.
		</p>
	</section>
</article>
