<script lang="ts">
	import type { WordToken } from '$lib/types';
	import WordDiffRenderer from '$lib/components/diff/WordDiffRenderer.svelte';

	let {
		eId,
		heading,
		content,
		highlighted = false,
		wordDiff,
		cleanView = false
	}: {
		eId: string;
		heading: string;
		content: string;
		highlighted?: boolean;
		wordDiff?: WordToken[];
		cleanView?: boolean;
	} = $props();
</script>

<article
	id={eId}
	class="py-3 px-4 border-l-4 transition-colors
		{highlighted ? 'border-amber-400 bg-amber-50/50' : 'border-transparent'}"
>
	<h4 class="text-sm font-semibold text-gray-800">{heading}</h4>
	{#if wordDiff}
		<p class="text-sm text-gray-700 mt-1 leading-relaxed">
			<WordDiffRenderer tokens={wordDiff} {cleanView} />
		</p>
	{:else}
		<p class="text-sm text-gray-700 mt-1 leading-relaxed">{content}</p>
	{/if}
</article>
