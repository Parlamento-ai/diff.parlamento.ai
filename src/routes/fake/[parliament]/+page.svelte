<script lang="ts">
	import type { PageData } from './$types';
	import ParliamentLayout from '$lib/components/parliament/ParliamentLayout.svelte';
	import UpcomingSessions from '$lib/components/parliament/sections/UpcomingSessions.svelte';
	import BillsInProgress from '$lib/components/parliament/sections/BillsInProgress.svelte';
	import RecentActivityFeed from '$lib/components/parliament/sections/RecentActivityFeed.svelte';
	import QuestionsSection from '$lib/components/parliament/sections/QuestionsSection.svelte';
	import PublishedLaws from '$lib/components/parliament/sections/PublishedLaws.svelte';

	let { data }: { data: PageData } = $props();

	const parliamentId = data.meta.id;
</script>

<ParliamentLayout meta={data.meta}>
	<div class="space-y-10">
		{#if data.upcomingSessions.length > 0}
			<UpcomingSessions sessions={data.upcomingSessions} {parliamentId} />
		{/if}

		<BillsInProgress bills={data.billsInProgress} {parliamentId} />

		<RecentActivityFeed activities={data.recentActivity} {parliamentId} />

		<QuestionsSection questions={data.questions} {parliamentId} />

		<PublishedLaws acts={data.publishedActs} {parliamentId} />
	</div>
</ParliamentLayout>
