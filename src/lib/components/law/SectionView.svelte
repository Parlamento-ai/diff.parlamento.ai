<script lang="ts">
	import type { Article, WordToken } from '$lib/types';
	import ArticleView from './ArticleView.svelte';

	let {
		heading,
		articles,
		changedArticleIds = new Set(),
		accumulatedDiffs = {},
		cleanView = false
	}: {
		heading: string;
		articles: Article[];
		changedArticleIds?: Set<string>;
		accumulatedDiffs?: Record<string, WordToken[]>;
		cleanView?: boolean;
	} = $props();
</script>

<section class="mb-2">
	<h3 class="text-base font-bold text-gray-900 mb-2 px-4">{heading}</h3>
	<div>
		{#each articles as article (article.eId)}
			<ArticleView
				eId={article.eId}
				heading={article.heading}
				content={article.content}
				highlighted={changedArticleIds.has(article.eId)}
				wordDiff={accumulatedDiffs[article.eId]}
				{cleanView}
			/>
		{/each}
	</div>
</section>
