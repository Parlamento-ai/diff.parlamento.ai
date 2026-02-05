<script lang="ts">
	import type { PageData } from './$types';
	import ParliamentLayout from '$lib/components/parliament/ParliamentLayout.svelte';
	import ChamberBadge from '$lib/components/parliament/shared/ChamberBadge.svelte';

	let { data }: { data: PageData } = $props();

	const pending = $derived(data.questions.filter((q) => q.status === 'pending'));
	const answered = $derived(data.questions.filter((q) => q.status === 'answered'));
</script>

<ParliamentLayout meta={data.meta}>
	<div class="space-y-6">
		<div>
			<h2 class="text-2xl font-heading font-bold text-gray-900 mb-2">Preguntas Parlamentarias</h2>
			<p class="text-gray-500">Preguntas realizadas por los parlamentarios</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<!-- Pending -->
			<div>
				<h3
					class="text-sm font-heading font-semibold text-orange-800 uppercase tracking-wide mb-3"
				>
					Pendientes ({pending.length})
				</h3>
				{#if pending.length === 0}
					<p class="text-sm text-gray-500">No hay preguntas pendientes.</p>
				{:else}
					<div class="space-y-2">
						{#each pending as q}
							<a
								href="/fake/{data.meta.id}/documento{q.uri}"
								class="block bg-white rounded-lg border border-orange-200 p-3 hover:border-orange-300 hover:shadow-sm transition-all"
							>
								<div class="flex items-center gap-2 mb-1">
									<span class="w-2 h-2 rounded-full bg-orange-400"></span>
									<ChamberBadge chamber={q.chamber} />
								</div>
								<h4 class="font-heading font-medium text-sm text-gray-900">{q.title}</h4>
								<p class="text-xs text-gray-500 mt-1">por {q.askedBy} &rarr; {q.addressedTo}</p>
								<p class="text-xs text-gray-400 mt-0.5">Preguntado {q.dateAsked}</p>
							</a>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Answered -->
			<div>
				<h3
					class="text-sm font-heading font-semibold text-emerald-800 uppercase tracking-wide mb-3"
				>
					Respondidas ({answered.length})
				</h3>
				{#if answered.length === 0}
					<p class="text-sm text-gray-500">No hay preguntas respondidas.</p>
				{:else}
					<div class="space-y-2">
						{#each answered as q}
							<a
								href="/fake/{data.meta.id}/documento{q.uri}"
								class="block bg-white rounded-lg border border-gray-200 p-3 hover:border-emerald-300 hover:shadow-sm transition-all"
							>
								<div class="flex items-center gap-2 mb-1">
									<span class="w-2 h-2 rounded-full bg-emerald-400"></span>
									<ChamberBadge chamber={q.chamber} />
								</div>
								<h4 class="font-heading font-medium text-sm text-gray-900">{q.title}</h4>
								<p class="text-xs text-gray-500 mt-1">por {q.askedBy} &rarr; {q.addressedTo}</p>
								<p class="text-xs text-gray-400 mt-0.5">Respondida {q.dateAnswered}</p>
							</a>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</ParliamentLayout>
