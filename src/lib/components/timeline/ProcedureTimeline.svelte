<script lang="ts">
	import type { ProcedureEvent } from '$lib/types';

	let {
		events
	}: {
		events: ProcedureEvent[];
	} = $props();

	let isOpen = $state(false);
</script>

{#if events.length > 0}
	<div class="mt-4">
		<button
			class="flex items-center justify-between w-full text-xs font-mono font-semibold uppercase tracking-wider text-gray-400 px-2 mb-2 hover:text-gray-600 transition-colors"
			onclick={() => (isOpen = !isOpen)}
		>
			<span>Procedure ({events.length})</span>
			<svg
				class="w-3 h-3 transition-transform {isOpen ? 'rotate-180' : ''}"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</button>

		{#if isOpen}
			<div class="space-y-1 px-2">
				{#each events as event, i (i)}
					<div class="flex items-start gap-2 text-xs">
						<span class="font-mono text-gray-400 shrink-0">{event.date.slice(0, 10)}</span>
						<span class="text-gray-600">{event.title}</span>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}
