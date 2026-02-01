<script lang="ts">
	import type { ArticleDiff } from '$lib/types';
	import ArticleDiffCard from './ArticleDiffCard.svelte';

	let {
		diffs,
		collapsed = false
	}: {
		diffs: ArticleDiff[];
		collapsed?: boolean;
	} = $props();

	let isOpen = $state(true);

	$effect(() => {
		isOpen = !collapsed;
	});
</script>

<div>
	<!-- Mobile toggle -->
	<button
		class="flex items-center justify-between w-full px-4 py-2 bg-gray-50 border-b border-gray-200 lg:hidden"
		onclick={() => (isOpen = !isOpen)}
	>
		<span class="text-xs font-semibold uppercase tracking-wider text-gray-500">
			Comparado ({diffs.length} {diffs.length === 1 ? 'cambio' : 'cambios'})
		</span>
		<svg
			class="w-4 h-4 text-gray-400 transition-transform {isOpen ? 'rotate-180' : ''}"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	<!-- Desktop header -->
	<div class="hidden lg:block px-4 py-2 border-b border-gray-200">
		<h2 class="text-xs font-semibold uppercase tracking-wider text-gray-400">
			Comparado ({diffs.length} {diffs.length === 1 ? 'cambio' : 'cambios'})
		</h2>
	</div>

	<div class="p-3 space-y-3 {isOpen ? '' : 'hidden lg:block'}">
		{#each diffs as diff (diff.articleId)}
			<ArticleDiffCard {diff} />
		{/each}

		{#if diffs.length === 0}
			<p class="text-sm text-gray-400 italic text-center py-8">
				Sin cambios en esta versión
			</p>
		{/if}
	</div>
</div>
