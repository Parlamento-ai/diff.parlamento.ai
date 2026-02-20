<script lang="ts">
	import { slide } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import type { Article, WordToken } from '$lib/types';
	import ArticleView from './ArticleView.svelte';
	import { dur } from '$lib/utils/reduced-motion';

	let {
		heading,
		articles,
		changedArticleIds = new Set(),
		accumulatedDiffs = {},
		cleanView = false,
		highlightColor = 'amber',
		heavyMode = false
	}: {
		heading: string;
		articles: Article[];
		changedArticleIds?: Set<string>;
		accumulatedDiffs?: Record<string, WordToken[]>;
		cleanView?: boolean;
		highlightColor?: 'amber' | 'green' | 'red';
		heavyMode?: boolean;
	} = $props();
</script>

<section class="mb-2">
	<h3 class="text-base font-bold text-gray-900 mb-2 px-4">{heading}</h3>
	<div>
		{#if heavyMode}
			{#each articles as article (article.eId)}
				<ArticleView
					eId={article.eId}
					heading={article.heading}
					content={article.content}
					highlighted={changedArticleIds.has(article.eId)}
					{highlightColor}
					wordDiff={accumulatedDiffs[article.eId]}
					{cleanView}
					{heavyMode}
				/>
			{/each}
		{:else}
			{#each articles as article (article.eId)}
				<div transition:slide={{ duration: dur(250) }} animate:flip={{ duration: dur(250) }}>
					<ArticleView
						eId={article.eId}
						heading={article.heading}
						content={article.content}
						highlighted={changedArticleIds.has(article.eId)}
						{highlightColor}
						wordDiff={accumulatedDiffs[article.eId]}
						{cleanView}
					/>
				</div>
			{/each}
		{/if}
	</div>
</section>
