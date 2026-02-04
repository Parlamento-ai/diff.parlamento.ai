<script lang="ts">
	import type { RecentActivity } from '$lib/types/parliament';
	import ChamberBadge from '../shared/ChamberBadge.svelte';
	import DocTypeBadge from '../shared/DocTypeBadge.svelte';

	let { activities, parliamentId }: {
		activities: RecentActivity[];
		parliamentId: string;
	} = $props();
</script>

<section>
	<h2 class="text-lg font-heading font-bold text-gray-900 mb-4">Recent Activity</h2>

	{#if activities.length === 0}
		<p class="text-sm text-gray-500">No recent activity.</p>
	{:else}
		<div class="space-y-2">
			{#each activities as activity}
				<a href="/fake/{parliamentId}/documento{activity.uri}" class="flex items-start gap-3 bg-white rounded-lg border border-gray-200 p-3 hover:border-gray-300 hover:shadow-sm transition-all">
					<div class="shrink-0 mt-0.5">
						<DocTypeBadge type={activity.type} />
					</div>
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2 mb-0.5">
							<span class="font-heading font-medium text-sm text-gray-900 truncate">{activity.title}</span>
							<ChamberBadge chamber={activity.chamber} />
						</div>
						<p class="text-xs text-gray-500 truncate">{activity.summary}</p>
					</div>
					<span class="text-xs text-gray-400 shrink-0">{activity.date}</span>
				</a>
			{/each}
		</div>
	{/if}
</section>
