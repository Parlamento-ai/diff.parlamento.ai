<script lang="ts">
	import type { PageData } from './$types';
	import ParliamentLayout from '$lib/components/parliament/ParliamentLayout.svelte';
	import ChamberBadge from '$lib/components/parliament/shared/ChamberBadge.svelte';

	let { data }: { data: PageData } = $props();

	const now = new Date();
	const upcoming = $derived(data.sessions.filter((s) => new Date(s.date) > now));
	const past = $derived(data.sessions.filter((s) => new Date(s.date) <= now));
</script>

<ParliamentLayout meta={data.meta}>
	<div class="space-y-10">
		<div>
			<h2 class="text-2xl font-heading font-bold text-gray-900 mb-2">Citaciones</h2>
			<p class="text-gray-500">Calendario de sesiones del {data.meta.name}</p>
		</div>

		{#if upcoming.length > 0}
			<section>
				<h3 class="text-lg font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
					<span class="w-2 h-2 rounded-full bg-teal-500"></span>
					Proximas Sesiones
				</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					{#each upcoming as session}
						<a
							href="/fake/{data.meta.id}/documento{session.uri}"
							class="block bg-white rounded-lg border border-gray-200 p-4 hover:border-teal-300 hover:shadow-sm transition-all"
						>
							<div class="flex items-center gap-2 mb-2">
								<span
									class="text-teal-700 bg-teal-50 border border-teal-200 text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-full font-medium"
								>
									{session.date}
								</span>
								{#if session.time}
									<span class="text-xs text-gray-500">{session.time}</span>
								{/if}
								<ChamberBadge chamber={session.chamber} />
							</div>
							<h4 class="font-heading font-semibold text-gray-900 mb-1">{session.body}</h4>
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
			</section>
		{/if}

		{#if past.length > 0}
			<section>
				<h3 class="text-lg font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
					<span class="w-2 h-2 rounded-full bg-gray-400"></span>
					Sesiones Pasadas
				</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					{#each past as session}
						<a
							href="/fake/{data.meta.id}/documento{session.uri}"
							class="block bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all opacity-75"
						>
							<div class="flex items-center gap-2 mb-2">
								<span
									class="text-gray-600 bg-gray-100 border border-gray-200 text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-full font-medium"
								>
									{session.date}
								</span>
								{#if session.time}
									<span class="text-xs text-gray-500">{session.time}</span>
								{/if}
								<ChamberBadge chamber={session.chamber} />
							</div>
							<h4 class="font-heading font-semibold text-gray-900 mb-1">{session.body}</h4>
							{#if session.place}
								<p class="text-xs text-gray-500 mb-2">{session.place}</p>
							{/if}
							{#if session.agendaItems.length > 0}
								<div class="space-y-1">
									{#each session.agendaItems as item}
										<div class="text-sm text-gray-600 flex items-center gap-2">
											<span class="w-1 h-1 rounded-full bg-gray-400 shrink-0"></span>
											{item.heading}
										</div>
									{/each}
								</div>
							{/if}
						</a>
					{/each}
				</div>
			</section>
		{/if}

		{#if data.sessions.length === 0}
			<p class="text-gray-500">No hay citaciones registradas.</p>
		{/if}
	</div>
</ParliamentLayout>
