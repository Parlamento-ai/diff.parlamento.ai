<script lang="ts">
	let { data } = $props();

	function fmtDate(d: Date | string | number | null | undefined): string {
		if (!d) return '—';
		return new Date(d).toISOString().slice(0, 10);
	}
</script>

<svelte:head>
	<title>{data.country.toUpperCase()} / {data.groupLabel} — research demo</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 pt-6 pb-8">
	<header class="mb-6">
		<div class="font-mono text-xs tracking-wider text-gray-500 uppercase">
			{data.country} / {data.group}
		</div>
		<h1 class="mt-1 text-xl font-bold">{data.groupLabel}</h1>
	</header>

	<div class="space-y-8">
		{#each data.types as t (t.type)}
			<section>
				<header class="mb-2 flex items-baseline justify-between border-b border-gray-200 pb-1">
					<a
						href="/demo/{data.country}/{t.type}"
						class="text-base font-bold hover:underline"
					>
						{t.info.label}
					</a>
					<span class="font-mono text-xs text-gray-500">
						{t.docs.length} doc{t.docs.length === 1 ? '' : 's'}
					</span>
				</header>
				<p class="mb-3 text-xs text-gray-500">{t.info.description}</p>

				{#if t.docs.length}
					<ul class="divide-y divide-gray-200 border border-gray-200 bg-white">
						{#each t.docs as doc (doc.id)}
							<li>
								<a
									href="/demo/{doc.countryCode}/{doc.type}/{doc.nativeId}"
									class="block px-4 py-3 hover:bg-gray-50"
								>
									<div class="flex items-baseline justify-between gap-4">
										<span class="font-mono text-sm font-bold">{doc.nativeId}</span>
										<span class="shrink-0 font-mono text-xs text-gray-400">
											{fmtDate(doc.publishedAt)}
										</span>
									</div>
									<div class="mt-1 text-sm text-gray-700">{doc.title}</div>
								</a>
							</li>
						{/each}
					</ul>
				{:else}
					<div
						class="border border-dashed border-gray-300 bg-white px-4 py-3 text-xs text-gray-500"
					>
						No {t.info.label.toLowerCase()} documents loaded for {data.country.toUpperCase()}.
					</div>
				{/if}
			</section>
		{/each}
	</div>
</div>
