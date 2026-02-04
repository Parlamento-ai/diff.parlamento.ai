<script lang="ts">
	import type { ParliamentChamber } from '$lib/types/parliament';

	let { chamber, chambers = [] }: { chamber: string | null; chambers?: ParliamentChamber[] } = $props();

	const chamberInfo = $derived(chambers.find((c) => c.id === chamber));

	const CHAMBER_COLORS: Record<string, string> = {
		lower: 'text-blue-700 bg-blue-50 border-blue-200',
		upper: 'text-rose-700 bg-rose-50 border-rose-200'
	};

	const colorClass = $derived(chamberInfo ? CHAMBER_COLORS[chamberInfo.type] || 'text-gray-700 bg-gray-50 border-gray-200' : 'text-gray-500 bg-gray-50 border-gray-200');
	const label = $derived(chamberInfo?.nameEn || chamber || 'Both chambers');
</script>

{#if chamber}
	<span class="text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-full border font-medium {colorClass}">
		{label}
	</span>
{/if}
