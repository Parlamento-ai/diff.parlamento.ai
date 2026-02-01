<script lang="ts">
	import type { Article } from '$lib/types';
	import ArticleView from './ArticleView.svelte';

	let {
		heading,
		articles,
		changedArticleIds = new Set()
	}: {
		heading: string;
		articles: Article[];
		changedArticleIds?: Set<string>;
	} = $props();
</script>

<section class="mb-6">
	<h3 class="text-base font-bold text-gray-900 mb-2 px-4">{heading}</h3>
	<div class="divide-y divide-gray-100">
		{#each articles as article (article.eId)}
			<ArticleView
				eId={article.eId}
				heading={article.heading}
				content={article.content}
				highlighted={changedArticleIds.has(article.eId)}
			/>
		{/each}
	</div>
</section>
