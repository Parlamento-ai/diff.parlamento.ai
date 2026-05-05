<script lang="ts">
	import hljs from 'highlight.js/lib/core';
	import xmlLang from 'highlight.js/lib/languages/xml';

	hljs.registerLanguage('xml', xmlLang);

	let { data } = $props();
	const { doc, detail, detailTableName, documentTableName, versions, events, outgoing, incoming } =
		$derived(data);

	let showRaw = $state(false);

	const highlightedDocXml = $derived(hljs.highlight(doc.xml, { language: 'xml' }).value);

	function fmtDate(d: Date | string | number | null | undefined): string {
		if (!d) return '—';
		return new Date(d).toISOString().slice(0, 10);
	}

	function highlightXml(xml: string): string {
		return hljs.highlight(xml, { language: 'xml' }).value;
	}

	function renderValue(v: unknown): string {
		if (v === null || v === undefined) return '—';
		if (v instanceof Date) return fmtDate(v);
		if (typeof v === 'object') return JSON.stringify(v, null, 2);
		return String(v);
	}
</script>

<svelte:head>
	<title>{doc.nativeId} — research demo</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 pt-6 pb-8 font-mono text-sm">
	<a href="/demo" class="text-blue-600 hover:underline">← all docs</a>

	<header class="mt-4 mb-8 border-b border-gray-200 pb-4">
		<div class="mb-1 text-xs text-gray-500">
			{doc.countryCode} / {doc.type} / {doc.nativeId}
		</div>
		<h1 class="text-xl font-bold">{doc.title}</h1>
		<div class="mt-2 text-xs text-gray-500">
			Published {fmtDate(doc.publishedAt)} · Last activity {fmtDate(doc.lastActivityAt)}
		</div>
	</header>

	{#if events.length}
		<section class="mb-8">
			<h2 class="mb-2 font-bold uppercase">Events ({events.length})</h2>
			<ol class="space-y-1">
				{#each events as e (e.id)}
					<li class="border-b border-gray-100 py-1">
						<span class="text-gray-500">#{e.sequence}</span>
						<span class="ml-2">{fmtDate(e.occurredAt)}</span>
						<span class="ml-2 font-bold">{e.actionType}</span>
						<span class="ml-2 text-gray-500">— {e.actionTypeLocal}</span>
						{#if e.chamber}<span class="ml-2 text-gray-400">({e.chamber})</span>{/if}
					</li>
				{/each}
			</ol>
		</section>
	{/if}

	{#if versions.length}
		<section class="mb-8">
			<h2 class="mb-2 font-bold uppercase">Versions ({versions.length})</h2>
			<ul class="space-y-4">
				{#each versions as v (v.id)}
					<li class="border-b border-gray-100 pb-3">
						<div>
							<span class="font-bold">v{v.version}</span>
							<span class="ml-2">{fmtDate(v.publishedAt)}</span>
							{#if v.changeNote}
								<span class="ml-2 text-gray-500">— {v.changeNote}</span>
							{/if}
							{#if v.sourceUrl}
								<a
									href={v.sourceUrl}
									class="ml-2 text-blue-600 hover:underline"
									target="_blank">{v.sourceUrl}</a
								>
							{/if}
						</div>
						<details class="mt-2">
							<summary class="cursor-pointer text-xs text-gray-500 hover:text-gray-800"
								>show AKN XML ({v.xml.length} bytes)</summary
							>
							<pre
								class="mt-2 overflow-x-auto rounded bg-gray-50 p-3 text-xs"><code class="hljs">{@html highlightXml(v.xml)}</code></pre>
						</details>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<section class="mb-8 grid grid-cols-2 gap-8">
		<div>
			<h2 class="mb-2 font-bold uppercase">Outgoing → ({outgoing.length})</h2>
			{#if outgoing.length}
				<ul class="space-y-1">
					{#each outgoing as l (l.id)}
						<li>
							<span class="text-gray-500">{l.relation}</span>
							<a
								href="/demo/{l.otherCountry}/{l.otherType}/{l.otherNativeId}"
								class="ml-2 text-blue-600 hover:underline"
							>
								{l.otherCountry}/{l.otherType}/{l.otherNativeId}
							</a>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="text-gray-400">none</p>
			{/if}
		</div>
		<div>
			<h2 class="mb-2 font-bold uppercase">← Incoming ({incoming.length})</h2>
			{#if incoming.length}
				<ul class="space-y-1">
					{#each incoming as l (l.id)}
						<li>
							<a
								href="/demo/{l.otherCountry}/{l.otherType}/{l.otherNativeId}"
								class="text-blue-600 hover:underline"
							>
								{l.otherCountry}/{l.otherType}/{l.otherNativeId}
							</a>
							<span class="ml-2 text-gray-500">{l.relation}</span>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="text-gray-400">none</p>
			{/if}
		</div>
	</section>

	<section class="mt-12 border-t border-gray-200 pt-6">
		<button
			type="button"
			onclick={() => (showRaw = !showRaw)}
			class="flex w-full items-center justify-between border border-gray-300 bg-gray-50 px-4 py-2 text-left text-xs font-bold tracking-wider uppercase hover:bg-gray-100"
		>
			<span>Raw database state</span>
			<span class="text-gray-500">{showRaw ? '▼ hide' : '▶ show'}</span>
		</button>

		{#if showRaw}
			<p class="mt-3 text-xs text-gray-500">
				Exact rows stored in SQLite, plus the AKN XML blob from which the columns above
				were projected. The shared <code>{documentTableName}</code> row holds fields
				common to every document type; the type-specific row holds fields unique to
				<code>{doc.type}</code>.
			</p>

			<div class="mt-6">
				<h3 class="mb-2 text-xs font-bold tracking-wider text-gray-700 uppercase">
					Shared document table — <code>{documentTableName}</code>
				</h3>
				<table class="w-full">
					<tbody>
						{#each Object.entries(doc) as [k, v] (k)}
							{#if k !== 'xml'}
								<tr class="border-b border-gray-100">
									<td class="w-48 py-1 pr-4 align-top text-gray-500">{k}</td>
									<td class="py-1">
										{#if v === null || v === undefined}
											<span class="text-gray-300">—</span>
										{:else if typeof v === 'object' && !(v instanceof Date)}
											<pre class="text-xs whitespace-pre-wrap">{JSON.stringify(v, null, 2)}</pre>
										{:else}
											{renderValue(v)}
										{/if}
									</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>

			<div class="mt-6">
				<h3 class="mb-2 text-xs font-bold tracking-wider text-gray-700 uppercase">
					Type-specific table —
					{#if detailTableName}
						<code>{detailTableName}</code>
					{:else}
						<span class="text-gray-400">(none for this type)</span>
					{/if}
				</h3>
				{#if detail}
					<table class="w-full">
						<tbody>
							{#each Object.entries(detail) as [k, v] (k)}
								<tr class="border-b border-gray-100">
									<td class="w-48 py-1 pr-4 align-top text-gray-500">{k}</td>
									<td class="py-1">
										{#if v === null || v === undefined}
											<span class="text-gray-300">—</span>
										{:else if typeof v === 'object' && !(v instanceof Date)}
											<pre class="text-xs whitespace-pre-wrap">{JSON.stringify(v, null, 2)}</pre>
										{:else}
											{renderValue(v)}
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{:else}
					<p class="text-gray-400">No row found in the type-specific table.</p>
				{/if}
			</div>

			<div class="mt-6">
				<h3 class="mb-2 text-xs font-bold tracking-wider text-gray-700 uppercase">
					AKN XML — <code>{documentTableName}.xml</code>
				</h3>
				<pre
					class="overflow-x-auto rounded bg-gray-50 p-3 text-xs"><code class="hljs">{@html highlightedDocXml}</code></pre>
			</div>
		{/if}
	</section>
</div>

<style>
	:global(.hljs) {
		background: transparent;
		color: #1f2937;
	}
	:global(.hljs-tag) {
		color: #0369a1;
	}
	:global(.hljs-name) {
		color: #0e7490;
	}
	:global(.hljs-attr) {
		color: #b45309;
	}
	:global(.hljs-string) {
		color: #15803d;
	}
	:global(.hljs-comment) {
		color: #9ca3af;
		font-style: italic;
	}
	:global(.hljs-meta) {
		color: #6b7280;
	}
</style>
