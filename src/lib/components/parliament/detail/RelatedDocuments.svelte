<script lang="ts">
	import type { ParliamentManifestEntry, ParliamentChamber } from '$lib/types/parliament';
	import type { FRBRMeta } from '$lib/types/explorer';
	import ChamberBadge from '../shared/ChamberBadge.svelte';
	import DocTypeBadge from '../shared/DocTypeBadge.svelte';

	let { relatedDocs, parliamentId, chambers = [] }: {
		relatedDocs: { entry: ParliamentManifestEntry; doc: { type: string; name: string; frbr: FRBRMeta } }[];
		parliamentId: string;
		chambers?: ParliamentChamber[];
	} = $props();
</script>

<div>
	<h2 class="text-lg font-heading font-bold text-gray-900 mb-4">Related Documents</h2>

	{#if relatedDocs.length === 0}
		<p class="text-sm text-gray-500">No related documents found.</p>
	{:else}
		<div class="space-y-2">
			{#each relatedDocs as { entry, doc }}
				<a href="/fake/{parliamentId}/documento{entry.uri}" class="block bg-white rounded-lg border border-gray-200 p-3 hover:border-gray-300 hover:shadow-sm transition-all">
					<div class="flex items-center gap-2 mb-1 flex-wrap">
						<DocTypeBadge type={entry.type} />
						<ChamberBadge chamber={entry.chamber} {chambers} />
					</div>
					<h3 class="font-heading font-medium text-sm text-gray-900">{entry.title}</h3>
					<p class="text-xs text-gray-500 mt-0.5">{doc.frbr.date} &mdash; {entry.description}</p>
				</a>
			{/each}
		</div>
	{/if}
</div>
