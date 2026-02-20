<script lang="ts">
	import type { WordToken } from '$lib/types';
	import WordDiffRenderer from '$lib/components/diff/WordDiffRenderer.svelte';

	let {
		eId,
		heading,
		content,
		highlighted = false,
		highlightColor = 'amber',
		wordDiff,
		cleanView = false,
		heavyMode = false
	}: {
		eId: string;
		heading: string;
		content: string;
		highlighted?: boolean;
		highlightColor?: 'amber' | 'green' | 'red';
		wordDiff?: WordToken[];
		cleanView?: boolean;
		heavyMode?: boolean;
	} = $props();

	const colorMap: Record<string, string> = {
		amber: 'border-amber-400 bg-amber-50',
		green: 'border-addition-500 bg-addition-50',
		red: 'border-deletion-500 bg-deletion-50'
	};
</script>

<article
	id={eId}
	class="py-1 px-4 border-l-2 transition-colors duration-300
		{highlighted ? colorMap[highlightColor] : 'border-transparent bg-transparent'}"
>
	<h4 class="text-sm font-semibold text-gray-800">{heading}</h4>
	{#if wordDiff}
		<p class="text-sm text-gray-700 mt-1 leading-relaxed">
			<WordDiffRenderer tokens={wordDiff} {cleanView} noAnimate={heavyMode} />
		</p>
	{:else}
		<p class="text-sm text-gray-700 mt-1 leading-relaxed">{content}</p>
	{/if}
</article>
