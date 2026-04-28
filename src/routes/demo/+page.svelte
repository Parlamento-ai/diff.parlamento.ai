<script lang="ts">
	let { data } = $props();

	const byCountry = $derived(
		data.docs.reduce<Record<string, typeof data.docs>>((acc, d) => {
			(acc[d.countryCode] ??= []).push(d);
			return acc;
		}, {})
	);
</script>

<svelte:head>
	<title>Research demo — diff-law</title>
</svelte:head>

<div class="mx-auto max-w-4xl p-8 font-mono text-sm">
	<h1 class="mb-2 text-2xl font-bold">Research schema demo</h1>
	<p class="mb-2 text-gray-600">
		Reads from <code>research/schema/research.db</code> — rebuild with
		<code>npm run research:build</code>. {data.docs.length} documents loaded.
	</p>
	<p class="mb-8">
		<a href="/demo/schema" class="text-blue-600 hover:underline">→ schema reference</a>
	</p>

	{#each Object.entries(byCountry) as [country, docs] (country)}
		<section class="mb-8">
			<h2 class="mb-2 text-lg font-bold uppercase">{country}</h2>
			<ul class="divide-y divide-gray-200 border border-gray-200">
				{#each docs as doc (doc.id)}
					<li class="p-3 hover:bg-gray-50">
						<a
							href="/demo/{doc.countryCode}/{doc.type}/{doc.nativeId}"
							class="block"
						>
							<span class="inline-block w-20 text-xs text-gray-500">{doc.type}</span>
							<span class="font-bold">{doc.nativeId}</span>
							<span class="text-gray-400"> — </span>
							<span>{doc.title}</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>
