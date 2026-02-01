<script lang="ts">
	import type { WordToken } from '$lib/types';

	let { tokens }: { tokens: WordToken[] } = $props();
</script>

<span class="leading-relaxed">
	{#each tokens as token}
		{#if token.type === 'added'}
			<span class="bg-green-200 text-green-900 rounded-sm px-0.5">{token.text}</span>
		{:else if token.type === 'removed'}
			<span class="bg-red-200 text-red-900 line-through rounded-sm px-0.5">{token.text}</span>
		{:else}
			<span>{token.text}</span>
		{/if}
		{' '}
	{/each}
</span>
