<script lang="ts">
	import type { LawState } from '$lib/types';
	import SectionView from './SectionView.svelte';

	let {
		law,
		changedArticleIds = new Set()
	}: {
		law: LawState;
		changedArticleIds?: Set<string>;
	} = $props();
</script>

<div class="prose prose-sm max-w-none">
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
		/>
	{/each}
</div>
