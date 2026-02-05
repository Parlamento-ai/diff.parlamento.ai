<script lang="ts">
	import type { UpcomingSession } from '$lib/types/parliament';
	import ChamberBadge from '../shared/ChamberBadge.svelte';

	let { sessions, parliamentId }: {
		sessions: UpcomingSession[];
		parliamentId: string;
	} = $props();
</script>

<section>
	<h2 class="text-lg font-heading font-bold text-gray-900 mb-4">Proximas Sesiones</h2>

	{#if sessions.length === 0}
		<p class="text-sm text-gray-500">No hay sesiones programadas.</p>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			{#each sessions as session}
				<a href="/fake/{parliamentId}/documento{session.uri}" class="block bg-white rounded-lg border border-gray-200 p-4 hover:border-teal-300 hover:shadow-sm transition-all">
					<div class="flex items-center gap-2 mb-2">
						<span class="text-teal-700 bg-teal-50 border border-teal-200 text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-full font-medium">
							{session.date}
						</span>
						{#if session.time}
							<span class="text-xs text-gray-500">{session.time}</span>
						{/if}
						<ChamberBadge chamber={session.chamber} />
					</div>
					<h3 class="font-heading font-semibold text-gray-900 mb-1">{session.body}</h3>
					{#if session.place}
						<p class="text-xs text-gray-500 mb-2">{session.place}</p>
					{/if}
					{#if session.agendaItems.length > 0}
						<div class="space-y-1">
							{#each session.agendaItems as item}
								<div class="text-sm text-gray-600 flex items-center gap-2">
									<span class="w-1 h-1 rounded-full bg-teal-400 shrink-0"></span>
									{item.heading}
								</div>
							{/each}
						</div>
					{/if}
				</a>
			{/each}
		</div>
	{/if}
</section>
