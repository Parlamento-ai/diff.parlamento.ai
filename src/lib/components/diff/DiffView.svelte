<script lang="ts">
	import { fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import type { ArticleDiff, Vote } from '$lib/types';
	import ArticleDiffCard from './ArticleDiffCard.svelte';
	import { dur } from '$lib/utils/reduced-motion';

	const HEAVY_THRESHOLD = 30;

	let {
		diffs,
		vote = undefined,
		collapsed = false
	}: {
		diffs: ArticleDiff[];
		vote?: Vote | null;
		collapsed?: boolean;
	} = $props();

	const PAGE_SIZE = 50;
	const isHeavy = $derived(diffs.length > HEAVY_THRESHOLD);
	let allExpanded = $state(false);
	let expandKey = $state(0);
	let visibleCount = $state(PAGE_SIZE);

	const visibleDiffs = $derived(isHeavy ? diffs.slice(0, visibleCount) : diffs);
	const hasMore = $derived(isHeavy && visibleCount < diffs.length);

	function toggleAll() {
		allExpanded = !allExpanded;
		expandKey++;
	}

	function showMore() {
		visibleCount = Math.min(visibleCount + PAGE_SIZE, diffs.length);
	}

	const resultLabels: Record<string, string> = {
		approved: 'Aprobado',
		rejected: 'Rechazado',
		withdrawn: 'Retirado',
		inadmissible: 'Inadmisible',
		pending: 'Pendiente'
	};
	const resultColors: Record<string, string> = {
		approved: 'bg-addition-100 text-addition-800',
		rejected: 'bg-deletion-100 text-deletion-800',
		withdrawn: 'bg-gray-100 text-gray-600',
		inadmissible: 'bg-gray-100 text-gray-600',
		pending: 'bg-amber-100 text-amber-800'
	};

	let isOpen = $state(true);

	$effect(() => {
		isOpen = !collapsed;
	});
</script>

<div>
	{#if vote}
		<div class="px-4 py-3 border-b border-gray-200 {resultColors[vote.result] || 'bg-gray-100 text-gray-600'}">
			<div class="flex items-center gap-2 text-sm font-semibold">
				<span class="badge {vote.result === 'approved' ? 'bg-addition-200' : 'bg-deletion-200'}">
					{vote.result === 'approved' ? '\u2713' : '\u2717'}
				</span>
				<span>{resultLabels[vote.result] || vote.result}</span>
				<span class="font-mono font-normal opacity-75">{vote.forCount ?? vote.for.length}-{vote.againstCount ?? vote.against.length}-{vote.abstainCount ?? vote.abstain.length}</span>
			</div>
			{#if vote.for.length > 0}
				<p class="text-xs mt-1 opacity-75">
					<span class="font-medium">A favor:</span>
					{vote.for.map(v => v.showAs).join(', ')}
				</p>
			{/if}
			{#if vote.against.length > 0}
				<p class="text-xs mt-1 opacity-75">
					<span class="font-medium">En contra:</span>
					{vote.against.map(v => v.showAs).join(', ')}
				</p>
			{/if}
			{#if vote.abstain.length > 0}
				<p class="text-xs mt-1 opacity-75">
					<span class="font-medium">Abstenciones:</span>
					{vote.abstain.map(v => v.showAs).join(', ')}
				</p>
			{/if}
		</div>
	{/if}

	<!-- Mobile toggle -->
	<button
		class="flex items-center justify-between w-full px-4 py-2 bg-gray-50 border-b border-gray-200 lg:hidden"
		onclick={() => (isOpen = !isOpen)}
	>
		<span class="text-xs font-mono font-semibold uppercase tracking-wider text-gray-500">
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
	<div class="hidden lg:flex items-center justify-between px-4 py-2 border-b border-gray-200">
		<h2 class="text-xs font-mono font-semibold uppercase tracking-wider text-gray-400">
			Comparado ({diffs.length} {diffs.length === 1 ? 'cambio' : 'cambios'})
		</h2>
		{#if isHeavy}
			<button
				class="text-[10px] font-mono text-gray-400 hover:text-gray-600 transition-colors"
				onclick={toggleAll}
			>
				{allExpanded ? 'Colapsar' : 'Expandir'} todo
			</button>
		{/if}
	</div>

	<div class="p-3 space-y-1.5 {isOpen ? '' : 'hidden lg:block'}">
		{#if isHeavy}
			{#each visibleDiffs as diff (diff.articleId)}
				{#key expandKey}
					<ArticleDiffCard {diff} expanded={allExpanded} />
				{/key}
			{/each}

			{#if hasMore}
				<button
					class="w-full py-2 text-xs font-mono text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
					onclick={showMore}
				>
					Mostrar más ({diffs.length - visibleCount} restantes)
				</button>
			{/if}
		{:else}
			{#each diffs as diff (diff.articleId)}
				<div transition:fade={{ duration: dur(200) }} animate:flip={{ duration: dur(250) }}>
					<ArticleDiffCard {diff} />
				</div>
			{/each}
		{/if}

		{#if diffs.length === 0}
			<p class="text-xs text-gray-300 italic text-center py-2">
				Sin cambios en esta versión
			</p>
		{/if}
	</div>
</div>
