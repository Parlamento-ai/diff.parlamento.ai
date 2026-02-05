<script lang="ts">
	import type { PageData } from './$types';
	import ParliamentLayout from '$lib/components/parliament/ParliamentLayout.svelte';

	let { data }: { data: PageData } = $props();
</script>

<ParliamentLayout meta={data.meta}>
	<div class="space-y-6">
		<div>
			<h2 class="text-2xl font-heading font-bold text-gray-900 mb-2">Leyes Publicadas</h2>
			<p class="text-gray-500">Leyes y diario oficial</p>
		</div>

		{#if data.acts.length === 0}
			<p class="text-sm text-gray-500">No hay leyes publicadas.</p>
		{:else}
			<div class="space-y-2">
				{#each data.acts as act}
					<a
						href="/fake/{data.meta.id}/documento{act.uri}"
						class="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-3 hover:border-emerald-300 hover:shadow-sm transition-all"
					>
						<span
							class="text-emerald-700 bg-emerald-50 border border-emerald-200 text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-full font-medium shrink-0"
						>
							{act.uri.includes('gazette') ? 'diario' : 'ley'}
						</span>
						<span class="font-heading font-medium text-sm text-gray-900 flex-1 truncate"
							>{act.title}</span
						>
						<span class="text-xs text-gray-400 shrink-0">{act.date}</span>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</ParliamentLayout>
