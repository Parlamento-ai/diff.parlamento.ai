<script lang="ts">
	import type { ArticleDiff, WordToken } from '$lib/types';
	import { computeWordDiff } from '$lib/utils/word-diff';
	import WordDiffRenderer from './WordDiffRenderer.svelte';

	let {
		diff,
		expanded = true
	}: {
		diff: ArticleDiff;
		expanded?: boolean;
	} = $props();

	let isExpanded = $state(expanded);
	let lazyWordDiff = $state<WordToken[] | undefined>(diff.wordDiff);

	// Compute word-diff on first expand if not pre-computed by server
	$effect(() => {
		if (isExpanded && !lazyWordDiff && diff.changeType === 'substitute' && diff.oldText && diff.newText) {
			lazyWordDiff = computeWordDiff(diff.oldText, diff.newText);
		}
	});

	const typeLabels: Record<string, { label: string; bg: string }> = {
		substitute: { label: 'Sustituido', bg: 'bg-amber-100' },
		insert: { label: 'Insertado', bg: 'bg-addition-100' },
		repeal: { label: 'Derogado', bg: 'bg-deletion-100' },
		renumber: { label: 'Renumerado', bg: 'bg-blue-100' }
	};

	const typeInfo = $derived(typeLabels[diff.changeType] || typeLabels.substitute);
</script>

<div class="border border-gray-200 rounded-lg overflow-hidden">
	<!-- Header — clickable to toggle -->
	<button
		class="flex items-center justify-between w-full px-3 py-2 bg-gray-50 border-b border-gray-200 text-left hover:bg-gray-100 transition-colors"
		onclick={() => (isExpanded = !isExpanded)}
	>
		<span class="font-mono text-xs font-medium text-gray-700">{diff.articleId}</span>
		<span class="flex items-center gap-1.5">
			<span class="badge {typeInfo.bg}">{typeInfo.label}</span>
			<svg
				class="w-3.5 h-3.5 text-gray-400 transition-transform {isExpanded ? 'rotate-180' : ''}"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</span>
	</button>

	{#if isExpanded}
		{#if diff.changeType === 'substitute' && (lazyWordDiff || (diff.oldText && diff.newText))}
			<!-- Side-by-side for substitutes -->
			<div class="grid grid-cols-2 divide-x divide-gray-200 text-xs">
				<div class="p-3 bg-deletion-50">
					<p class="text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">Anterior</p>
					<p class="text-gray-700 leading-relaxed">{diff.oldText}</p>
				</div>
				<div class="p-3 bg-addition-50">
					<p class="text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">Nuevo</p>
					<p class="text-gray-700 leading-relaxed">{diff.newText}</p>
				</div>
			</div>
			<!-- Word diff -->
			{#if lazyWordDiff}
				<div class="px-3 py-2 border-t border-gray-100 bg-gray-50 text-xs">
					<p class="text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">Cambios</p>
					<WordDiffRenderer tokens={lazyWordDiff} />
				</div>
			{/if}
		{:else if diff.changeType === 'insert'}
			<div class="p-3 bg-addition-50 text-xs">
				<p class="text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">Nuevo articulo</p>
				<p class="text-gray-700 leading-relaxed">{diff.newText}</p>
			</div>
		{:else if diff.changeType === 'repeal'}
			<div class="p-3 bg-deletion-50 text-xs">
				<p class="text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">Articulo derogado</p>
				<p class="text-gray-700 leading-relaxed line-through">{diff.oldText}</p>
			</div>
		{/if}
	{/if}
</div>
