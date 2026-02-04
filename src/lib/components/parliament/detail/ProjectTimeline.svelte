<script lang="ts">
	import type { TimelineEvent, ParliamentChamber } from '$lib/types/parliament';
	import ChamberBadge from '../shared/ChamberBadge.svelte';
	import DocTypeBadge from '../shared/DocTypeBadge.svelte';

	let { timeline, parliamentId, chambers = [] }: {
		timeline: TimelineEvent[];
		parliamentId: string;
		chambers?: ParliamentChamber[];
	} = $props();

	const TYPE_DOT_COLORS: Record<string, string> = {
		bill: 'bg-blue-500',
		amendment: 'bg-amber-500',
		debate: 'bg-purple-500',
		communication: 'bg-violet-500',
		citation: 'bg-teal-500',
		judgment: 'bg-red-500',
		act: 'bg-emerald-500',
		question: 'bg-orange-500',
		officialGazette: 'bg-gray-500'
	};
</script>

<div>
	<h2 class="text-lg font-heading font-bold text-gray-900 mb-4">Timeline</h2>

	<div class="relative">
		<!-- Vertical line -->
		<div class="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200"></div>

		<div class="space-y-4">
			{#each timeline as event}
				<a href="/fake/{parliamentId}/documento{event.uri}" class="relative flex items-start gap-4 pl-8 group">
					<!-- Dot -->
					<div class="absolute left-1.5 top-2 w-3 h-3 rounded-full border-2 border-white {TYPE_DOT_COLORS[event.type] || 'bg-gray-400'} shadow-sm"></div>

					<div class="bg-white rounded-lg border border-gray-200 p-3 flex-1 group-hover:border-gray-300 group-hover:shadow-sm transition-all">
						<div class="flex items-center gap-2 mb-1 flex-wrap">
							<span class="text-xs font-medium text-gray-500">{event.date}</span>
							<DocTypeBadge type={event.type} />
							<ChamberBadge chamber={event.chamber} {chambers} />
						</div>
						<h3 class="font-heading font-medium text-sm text-gray-900">{event.title}</h3>
						<p class="text-xs text-gray-500 mt-0.5">{event.description}</p>
					</div>
				</a>
			{/each}
		</div>
	</div>
</div>
