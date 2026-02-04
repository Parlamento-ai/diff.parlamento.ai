<script lang="ts">
	import type { ParliamentMeta } from '$lib/types/parliament';
	import type { Snippet } from 'svelte';

	let {
		meta,
		selectedChamber = null,
		onChamberChange,
		children
	}: {
		meta: ParliamentMeta;
		selectedChamber?: string | null;
		onChamberChange?: (chamber: string | null) => void;
		children: Snippet;
	} = $props();
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white border-b border-gray-200 sticky top-0 z-10">
		<div class="max-w-6xl mx-auto px-4 py-4">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-xl font-heading font-bold text-gray-900">{meta.name}</h1>
					<p class="text-sm text-gray-500">{meta.legislativePeriod.name}</p>
				</div>
				<div class="text-right text-sm text-gray-500">
					<div class="font-medium">{meta.country.toUpperCase()}</div>
				</div>
			</div>

			<!-- Chamber tabs -->
			{#if onChamberChange}
				<div class="flex gap-1 mt-3">
					<button
						class="text-sm px-3 py-1.5 rounded-full font-medium transition-colors {selectedChamber === null ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}"
						onclick={() => onChamberChange(null)}
					>
						All
					</button>
					{#each meta.chambers as chamber}
						<button
							class="text-sm px-3 py-1.5 rounded-full font-medium transition-colors {selectedChamber === chamber.id ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}"
							onclick={() => onChamberChange(chamber.id)}
						>
							{chamber.nameEn}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</header>

	<!-- Content -->
	<main class="max-w-6xl mx-auto px-4 py-8">
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="border-t border-gray-200 mt-16 py-8 px-4">
		<div class="max-w-6xl mx-auto text-center text-sm text-gray-400">
			<p>Portal Parlamentario Fake &mdash; basado en primitivas AKN (Akoma Ntoso)</p>
			<p class="mt-1">Powered by <a href="/" class="text-gray-600 underline underline-offset-2 hover:text-gray-900 transition-colors">Diff by Parlamento.ai</a></p>
		</div>
	</footer>
</div>
