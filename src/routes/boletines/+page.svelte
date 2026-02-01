<script lang="ts">
	import BoletinCard from '$lib/components/boletin/BoletinCard.svelte';

	let { data } = $props();
</script>

<main class="max-w-4xl mx-auto px-4 py-12">
	<div class="text-center mb-10">
		<h1 class="text-3xl font-bold text-gray-900">Boletines</h1>
		<p class="text-gray-500 mt-2 text-sm max-w-lg mx-auto">
			Explora la historia legislativa de cada documento en formato AKN++.
		</p>
	</div>

	<div class="grid gap-4 sm:grid-cols-2">
		{#each data.boletines as boletin (boletin.slug)}
			<BoletinCard
				slug={boletin.slug}
				title={boletin.title}
				documentCount={boletin.documentCount}
			/>
		{/each}
	</div>
</main>
