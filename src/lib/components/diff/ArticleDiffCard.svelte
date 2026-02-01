<script lang="ts">
	import type { ArticleDiff } from '$lib/types';
	import WordDiffRenderer from './WordDiffRenderer.svelte';

	let { diff }: { diff: ArticleDiff } = $props();

	const typeLabels: Record<string, { label: string; color: string }> = {
		substitute: { label: 'Sustituido', color: 'bg-amber-100 text-amber-800' },
		insert: { label: 'Insertado', color: 'bg-green-100 text-green-800' },
		repeal: { label: 'Derogado', color: 'bg-red-100 text-red-800' },
		renumber: { label: 'Renumerado', color: 'bg-blue-100 text-blue-800' }
	};

	const typeInfo = $derived(typeLabels[diff.changeType] || typeLabels.substitute);
</script>

<div class="border border-gray-200 rounded-lg overflow-hidden">
	<!-- Header -->
	<div class="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
		<span class="text-xs font-mono font-medium text-gray-600">{diff.articleId}</span>
		<span class="text-xs px-1.5 py-0.5 rounded {typeInfo.color}">{typeInfo.label}</span>
	</div>

	{#if diff.changeType === 'substitute' && diff.wordDiff}
		<!-- Side-by-side for substitutes -->
		<div class="grid grid-cols-2 divide-x divide-gray-200 text-xs">
			<div class="p-3 bg-red-50/30">
				<p class="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Anterior</p>
				<p class="text-gray-700 leading-relaxed">{diff.oldText}</p>
			</div>
			<div class="p-3 bg-green-50/30">
				<p class="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Nuevo</p>
				<p class="text-gray-700 leading-relaxed">{diff.newText}</p>
			</div>
		</div>
		<!-- Word diff -->
		<div class="px-3 py-2 border-t border-gray-100 bg-gray-50/50 text-xs">
			<p class="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Cambios</p>
			<WordDiffRenderer tokens={diff.wordDiff} />
		</div>
	{:else if diff.changeType === 'insert'}
		<div class="p-3 bg-green-50/30 text-xs">
			<p class="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Nuevo artículo</p>
			<p class="text-gray-700 leading-relaxed">{diff.newText}</p>
		</div>
	{:else if diff.changeType === 'repeal'}
		<div class="p-3 bg-red-50/30 text-xs">
			<p class="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Artículo derogado</p>
			<p class="text-gray-700 leading-relaxed line-through">{diff.oldText}</p>
		</div>
	{/if}
</div>
