<script lang="ts">
	let { data } = $props();

	function fmtDate(d: Date | string | number | null | undefined): string {
		if (!d) return '—';
		return new Date(d).toISOString().slice(0, 10);
	}
</script>

<svelte:head>
	<title>{data.country}/{data.type} — research demo</title>
</svelte:head>

<div class="mx-auto max-w-4xl p-8">
	<header class="mb-6">
		<div class="text-xs uppercase tracking-wider text-gray-500">
			{data.country} / {data.type}
		</div>
		<h1 class="mt-1 text-xl font-bold">
			{data.docs.length} {data.type}{data.docs.length === 1 ? '' : 's'}
		</h1>
	</header>

	<ul class="divide-y divide-gray-200 border border-gray-200 bg-white">
		{#each data.docs as doc (doc.id)}
			<li>
				<a
					href="/demo/{doc.countryCode}/{doc.type}/{doc.nativeId}"
					class="block px-4 py-3 hover:bg-gray-50"
				>
					<div class="flex items-baseline justify-between gap-4">
						<span class="font-bold">{doc.nativeId}</span>
						<span class="shrink-0 text-xs text-gray-400">{fmtDate(doc.publishedAt)}</span>
					</div>
					<div class="mt-1 text-sm text-gray-700">{doc.title}</div>
				</a>
			</li>
		{/each}
	</ul>
</div>
