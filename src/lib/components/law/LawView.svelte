<script lang="ts">
	import type { LawState, WordToken } from '$lib/types';
	import SectionView from './SectionView.svelte';

	let {
		law,
		changedArticleIds = new Set(),
		accumulatedDiffs = {},
		cleanView = false,
		highlightColor = 'amber',
		heavyMode = false
	}: {
		law: LawState;
		changedArticleIds?: Set<string>;
		accumulatedDiffs?: Record<string, WordToken[]>;
		cleanView?: boolean;
		highlightColor?: 'amber' | 'green' | 'red';
		heavyMode?: boolean;
	} = $props();
</script>

<div class="max-w-none">
	{#if law.title}
		<h2 class="text-lg font-bold text-gray-900 mb-1">{law.title}</h2>
	{/if}
	{#if law.preface}
		<p class="text-sm text-gray-500 mb-4 italic">{law.preface}</p>
	{/if}

	{#each law.sections as section (section.eId)}
		<SectionView
			heading={section.heading}
			articles={section.articles}
			{changedArticleIds}
			{accumulatedDiffs}
			{cleanView}
			{highlightColor}
			{heavyMode}
		/>
	{/each}
</div>
