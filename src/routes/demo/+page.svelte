<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Research demo — diff-law</title>
</svelte:head>

<div class="mx-auto max-w-4xl p-8">
	<h1 class="mb-2 text-2xl font-bold">Research schema demo</h1>
	<p class="mb-8 text-gray-600">
		Reads from <code>research/schema/research.db</code> — rebuild with
		<code>npm run research:build</code>. Pick an organization to explore.
	</p>

	{#if !data.countries.length}
		<p class="text-gray-500">No countries loaded yet. Run the build script.</p>
	{:else}
		<ul class="grid grid-cols-1 gap-3 sm:grid-cols-2">
			{#each data.countries as c (c.code)}
				{@const types = data.typesByCountry[c.code] ?? []}
				{@const total = types.reduce((s, t) => s + t.n, 0)}
				{@const first = types[0]?.type}
				<li>
					<a
						href={first ? `/demo/${c.code}/${first}` : `/demo/${c.code}`}
						class="block rounded border border-gray-200 bg-white p-4 transition-colors hover:border-gray-400"
					>
						<div class="flex items-baseline justify-between">
							<span class="text-xs uppercase tracking-wider text-gray-500">{c.code}</span>
							<span class="text-xs text-gray-400">{total} doc{total === 1 ? '' : 's'}</span>
						</div>
						<div class="mt-1 text-base font-bold">{c.name}</div>
						<div class="mt-2 flex flex-wrap gap-1">
							{#each types as t (t.type)}
								<span class="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
									{t.type} <span class="text-gray-400">{t.n}</span>
								</span>
							{/each}
						</div>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>
