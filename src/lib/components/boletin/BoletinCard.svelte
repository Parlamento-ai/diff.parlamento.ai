<script lang="ts">
	import type { Component } from 'svelte';

	let {
		slug,
		title,
		documentCount,
		flag,
		emoji,
		firstVersion = 'original'
	}: {
		slug: string;
		title: string;
		documentCount: number;
		flag?: Component;
		emoji?: string;
		firstVersion?: string;
	} = $props();
</script>

<a
	href="/{slug}/{firstVersion}"
	class="block p-5 card-layout card-hover group"
>
	<h2 class="text-base font-semibold text-gray-900 group-hover:text-brand-dark transition-colors flex items-center gap-2">
		{#if flag}
			<svelte:component this={flag} class="w-5 h-5 shrink-0" />
		{/if}
		{title}{#if emoji} <span>{emoji}</span>{/if}
		<svg class="w-4 h-4 ml-auto text-gray-300 group-hover:text-brand-dark group-hover:translate-x-0.5 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
		</svg>
	</h2>
	<p class="text-xs text-gray-400 mt-1">
		{documentCount} documentos
	</p>
</a>
