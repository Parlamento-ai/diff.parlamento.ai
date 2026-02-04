<script lang="ts">
	import type { BillInProgress } from '$lib/types/parliament';
	import ChamberBadge from '../shared/ChamberBadge.svelte';
	import DocTypeBadge from '../shared/DocTypeBadge.svelte';

	let { bills, selectedChamber = null, parliamentId }: {
		bills: BillInProgress[];
		selectedChamber?: string | null;
		parliamentId: string;
	} = $props();

	const filtered = $derived(
		selectedChamber ? bills.filter((b) => b.chamber === selectedChamber) : bills
	);
</script>

<section>
	<h2 class="text-lg font-heading font-bold text-gray-900 mb-4">Bills in Progress</h2>

	{#if filtered.length === 0}
		<p class="text-sm text-gray-500">No bills in progress.</p>
	{:else}
		<div class="space-y-3">
			{#each filtered as bill}
				<a href="/fake/{parliamentId}/proyecto/{encodeURIComponent(bill.uri)}" class="block bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all">
					<div class="flex items-center gap-2 mb-2 flex-wrap">
						<DocTypeBadge type="bill" />
						<ChamberBadge chamber={bill.chamber} />
						<span class="text-xs text-gray-400 ml-auto">{bill.date}</span>
					</div>
					<h3 class="font-heading font-semibold text-gray-900 mb-1">{bill.title}</h3>
					{#if bill.author}
						<p class="text-sm text-gray-500 mb-2">by {bill.author}</p>
					{/if}
					<div class="flex items-center gap-2 text-sm">
						<span class="text-blue-700 bg-blue-50 border border-blue-200 text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-full font-medium">
							{bill.lastAction}
						</span>
						<span class="text-xs text-gray-400">{bill.lastActionDate}</span>
					</div>
					{#if bill.relatedDocs.length > 0}
						<div class="mt-2 flex flex-wrap gap-1">
							{#each bill.relatedDocs as doc}
								<span class="text-[10px] text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">
									{doc.type}
								</span>
							{/each}
						</div>
					{/if}
				</a>
			{/each}
		</div>
	{/if}
</section>
