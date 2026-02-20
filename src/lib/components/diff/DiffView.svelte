<script lang="ts">
	import { fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import type { ArticleDiff, Vote } from '$lib/types';
	import ArticleDiffCard from './ArticleDiffCard.svelte';
	import { dur } from '$lib/utils/reduced-motion';

	let {
		diffs,
		vote = undefined,
		collapsed = false
	}: {
		diffs: ArticleDiff[];
		vote?: Vote | null;
		collapsed?: boolean;
	} = $props();

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
				<span class="font-mono font-normal opacity-75">{vote.for.length}-{vote.against.length}-{vote.abstain.length}</span>
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
	<div class="hidden lg:block px-4 py-2 border-b border-gray-200">
		<h2 class="text-xs font-mono font-semibold uppercase tracking-wider text-gray-400">
			Comparado ({diffs.length} {diffs.length === 1 ? 'cambio' : 'cambios'})
		</h2>
	</div>

	<div class="p-3 space-y-3 {isOpen ? '' : 'hidden lg:block'}">
		{#each diffs as diff (diff.articleId)}
			<div transition:fade={{ duration: dur(200) }} animate:flip={{ duration: dur(250) }}>
				<ArticleDiffCard {diff} />
			</div>
		{/each}

		{#if diffs.length === 0}
			<!-- Skeleton placeholders -->
			{#each { length: 3 } as _, i}
				<div class="border border-gray-100 rounded-lg overflow-hidden animate-pulse">
					<div class="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
						<div class="h-3 w-20 bg-gray-200 rounded"></div>
						<div class="h-4 w-16 bg-gray-200 rounded-full"></div>
					</div>
					<div class="p-3 space-y-2">
						<div class="h-2.5 w-full bg-gray-100 rounded"></div>
						<div class="h-2.5 w-4/5 bg-gray-100 rounded"></div>
						{#if i === 0}
							<div class="h-2.5 w-3/5 bg-gray-100 rounded"></div>
						{/if}
					</div>
				</div>
			{/each}
			<p class="text-xs text-gray-300 italic text-center">
				Sin cambios en esta versión
			</p>
		{/if}
	</div>
</div>
