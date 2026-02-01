<script lang="ts">
	import type { TimelineEntry } from '$lib/types';
	import TimelineNode from './TimelineNode.svelte';

	let {
		entries,
		activeSlug,
		boletinSlug
	}: {
		entries: TimelineEntry[];
		activeSlug: string;
		boletinSlug: string;
	} = $props();
</script>

<nav class="flex flex-col" aria-label="Historia legislativa">
	<h2 class="text-xs font-mono font-semibold uppercase tracking-wider text-gray-400 px-2 mb-2">
		Historia legislativa
	</h2>
	{#each entries as entry, i (entry.slug)}
		<TimelineNode
			slug={entry.slug}
			label={entry.label}
			date={entry.date}
			type={entry.type}
			author={entry.author}
			voteResult={entry.voteResult}
			active={entry.slug === activeSlug}
			isLast={i === entries.length - 1}
			href="/{boletinSlug}/{entry.slug}"
		/>
	{/each}
</nav>
