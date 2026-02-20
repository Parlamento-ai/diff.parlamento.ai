<script lang="ts">
	import type { WordToken } from '$lib/types';

	let {
		tokens,
		cleanView = false,
		noAnimate = false
	}: {
		tokens: WordToken[];
		cleanView?: boolean;
		noAnimate?: boolean;
	} = $props();

	const anim = $derived(noAnimate ? '' : 'token-animate');
</script>

<span class="leading-relaxed">
	{#each tokens as token}
		{#if cleanView}
			{#if token.type === 'added'}
				<span class="{anim} bg-blue-100 text-blue-800 border-b-2 border-blue-500 rounded-sm px-0.5">{token.text}</span>
			{:else if token.type !== 'removed'}
				<span>{token.text}</span>
			{/if}
		{:else}
			{#if token.type === 'added'}
				<span class="{anim} bg-addition-100 text-addition-800 border-b-2 border-addition-500 rounded-sm px-0.5">{token.text}</span>
			{:else if token.type === 'removed'}
				<span class="{anim} bg-deletion-100 text-deletion-800 border-b-2 border-deletion-500 line-through rounded-sm px-0.5 opacity-75">{token.text}</span>
			{:else}
				<span>{token.text}</span>
			{/if}
		{/if}
		{#if !(cleanView && token.type === 'removed')}
			{' '}
		{/if}
	{/each}
</span>

<style>
	@media (prefers-reduced-motion: no-preference) {
		.token-animate {
			animation: token-fade-in 300ms ease-out;
		}
	}

	@keyframes token-fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
