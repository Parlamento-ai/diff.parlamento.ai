<script lang="ts">
	let { data } = $props();
	const { doc, detail, versions, events, outgoing, incoming } = $derived(data);

	function fmtDate(d: Date | string | number | null | undefined): string {
		if (!d) return '—';
		return new Date(d).toISOString().slice(0, 10);
	}
</script>

<svelte:head>
	<title>{doc.nativeId} — research demo</title>
</svelte:head>

<div class="mx-auto max-w-4xl p-8 font-mono text-sm">
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

	<section class="mb-8">
		<h2 class="mb-2 font-bold uppercase">Detail ({doc.type})</h2>
		{#if detail}
			<table class="w-full">
				<tbody>
					{#each Object.entries(detail) as [k, v] (k)}
						<tr class="border-b border-gray-100">
							<td class="py-1 pr-4 align-top text-gray-500">{k}</td>
							<td class="py-1">
								{#if v === null || v === undefined}
									<span class="text-gray-300">—</span>
								{:else if v instanceof Date}
									{fmtDate(v)}
								{:else if typeof v === 'object'}
									<pre class="text-xs whitespace-pre-wrap">{JSON.stringify(v, null, 2)}</pre>
								{:else}
									{String(v)}
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<p class="text-gray-400">No type-specific row.</p>
		{/if}
	</section>

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
			<ul>
				{#each versions as v (v.id)}
					<li class="border-b border-gray-100 py-1">
						<span class="font-bold">v{v.version}</span>
						<span class="ml-2">{fmtDate(v.publishedAt)}</span>
						{#if v.sourceUrl}
							<a href={v.sourceUrl} class="ml-2 text-blue-600 hover:underline" target="_blank"
								>{v.sourceUrl}</a
							>
						{/if}
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

	{#if doc.body && Object.keys(doc.body).length}
		<section class="mb-8">
			<h2 class="mb-2 font-bold uppercase">Body</h2>
			<pre class="overflow-x-auto bg-gray-50 p-3 text-xs">{JSON.stringify(doc.body, null, 2)}</pre>
		</section>
	{/if}

	{#if doc.countrySpecific && Object.keys(doc.countrySpecific).length}
		<section class="mb-8">
			<h2 class="mb-2 font-bold uppercase">Country-specific</h2>
			<pre class="overflow-x-auto bg-gray-50 p-3 text-xs">{JSON.stringify(doc.countrySpecific, null, 2)}</pre>
		</section>
	{/if}
</div>
