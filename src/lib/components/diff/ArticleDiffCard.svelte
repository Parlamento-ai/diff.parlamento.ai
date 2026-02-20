<script lang="ts">
	import type { ArticleDiff } from '$lib/types';
	import WordDiffRenderer from './WordDiffRenderer.svelte';

	let { diff }: { diff: ArticleDiff } = $props();

	const typeLabels: Record<string, { label: string; bg: string }> = {
		substitute: { label: 'Sustituido', bg: 'bg-amber-100' },
		insert: { label: 'Insertado', bg: 'bg-addition-100' },
		repeal: { label: 'Derogado', bg: 'bg-deletion-100' },
		renumber: { label: 'Renumerado', bg: 'bg-blue-100' }
	};

	const typeInfo = $derived(typeLabels[diff.changeType] || typeLabels.substitute);
</script>

<div class="border border-gray-200 rounded-lg overflow-hidden">
	<!-- Header -->
	<div class="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
		<span class="font-mono text-xs font-medium text-gray-700">{diff.articleId}</span>
		<span class="badge {typeInfo.bg}">{typeInfo.label}</span>
	</div>

	{#if diff.changeType === 'substitute' && diff.wordDiff}
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
		<div class="px-3 py-2 border-t border-gray-100 bg-gray-50 text-xs">
			<p class="text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">Cambios</p>
			<WordDiffRenderer tokens={diff.wordDiff} />
		</div>
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
</div>
