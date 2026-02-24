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
		pending: 'Pendiente',
		'voice-vote': 'Voice Vote'
	};
	const resultColors: Record<string, string> = {
		approved: 'bg-addition-100 text-addition-800',
		rejected: 'bg-deletion-100 text-deletion-800',
		withdrawn: 'bg-gray-100 text-gray-600',
		inadmissible: 'bg-gray-100 text-gray-600',
		pending: 'bg-amber-100 text-amber-800',
		'voice-vote': 'bg-blue-100 text-blue-800'
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
				{#if vote.result === 'voice-vote'}
					<span class="badge bg-blue-200">{'\u2713'}</span>
				{:else}
					<span class="badge {vote.result === 'approved' ? 'bg-addition-200' : 'bg-deletion-200'}">
						{vote.result === 'approved' ? '\u2713' : '\u2717'}
					</span>
				{/if}
				<span>{resultLabels[vote.result] || vote.result}</span>
				{#if vote.result !== 'voice-vote'}
					<span class="font-mono font-normal opacity-75">{vote.forCount ?? vote.for.length}-{vote.againstCount ?? vote.against.length}-{vote.abstainCount ?? vote.abstain.length}</span>
				{/if}
			</div>
			{#if vote.rapporteur}
				<p class="text-xs mt-1 opacity-75">Rapporteur: {vote.rapporteur}</p>
			{/if}
			{#each [
				{ label: 'A favor', voters: vote.for, count: vote.forCount },
				{ label: 'En contra', voters: vote.against, count: vote.againstCount },
				{ label: 'Abstenciones', voters: vote.abstain, count: vote.abstainCount }
			] as group (group.label)}
				{#if group.voters.length > 0}
					{@const preview = group.voters.slice(0, 5).map(v => v.showAs).join(', ')}
					{@const rest = group.voters.length - 5}
					<p class="text-xs mt-1 opacity-75">
						<span class="font-medium">{group.label} ({group.count ?? group.voters.length}):</span>
						{preview}{#if rest > 0}<span class="text-[11px]">...</span>{/if}
					</p>
					{#if rest > 0}
						<details class="text-xs opacity-75 ml-2">
							<summary class="cursor-pointer text-[11px] text-gray-400 hover:text-gray-600">
								ver {rest} más
							</summary>
							<p class="mt-1 max-h-40 overflow-y-auto text-[11px] leading-relaxed">
								{group.voters.slice(5).map(v => v.showAs).join(', ')}
							</p>
						</details>
					{/if}
				{/if}
			{/each}
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
