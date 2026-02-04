<script lang="ts">
	import type { ParliamentManifestEntry, ParliamentChamber } from '$lib/types/parliament';
	import type { FRBRMeta } from '$lib/types/explorer';
	import ChamberBadge from '../shared/ChamberBadge.svelte';
	import DocTypeBadge from '../shared/DocTypeBadge.svelte';

	let { entry, frbr, chambers = [] }: {
		entry: ParliamentManifestEntry;
		frbr: FRBRMeta;
		chambers?: ParliamentChamber[];
	} = $props();
</script>

<div class="bg-white rounded-lg border border-gray-200 p-6">
	<div class="flex items-center gap-2 mb-3 flex-wrap">
		<DocTypeBadge type={entry.type} />
		<ChamberBadge chamber={entry.chamber} {chambers} />
	</div>
	<h1 class="text-2xl font-heading font-bold text-gray-900 mb-2">{entry.title}</h1>
	<p class="text-gray-600 mb-4">{entry.description}</p>

	<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
		{#if frbr.date}
			<div>
				<div class="text-xs text-gray-500 uppercase tracking-wide">Date</div>
				<div class="font-medium text-gray-900">{frbr.date}</div>
			</div>
		{/if}
		{#if frbr.dateName}
			<div>
				<div class="text-xs text-gray-500 uppercase tracking-wide">Event</div>
				<div class="font-medium text-gray-900">{frbr.dateName}</div>
			</div>
		{/if}
		{#if frbr.authorLabel}
			<div>
				<div class="text-xs text-gray-500 uppercase tracking-wide">Author</div>
				<div class="font-medium text-gray-900">{frbr.authorLabel}</div>
			</div>
		{/if}
		{#if frbr.workUri}
			<div>
				<div class="text-xs text-gray-500 uppercase tracking-wide">URI</div>
				<div class="font-mono text-xs text-gray-700 truncate">{frbr.workUri}</div>
			</div>
		{/if}
	</div>
</div>
