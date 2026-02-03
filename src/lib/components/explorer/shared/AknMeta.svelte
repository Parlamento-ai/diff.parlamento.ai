<script lang="ts">
	import type { FRBRMeta, ExplorerDocType } from '$lib/types/explorer';

	let { frbr, type }: { frbr: FRBRMeta; type: ExplorerDocType } = $props();
</script>

<div class="mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">
	<div class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
		<span class="text-gray-500">URI</span>
		<span class="font-mono text-xs text-gray-700">{frbr.workUri}</span>
		{#if frbr.date}
			<span class="text-gray-500">Fecha</span>
			<span class="text-gray-700">{frbr.date} ({frbr.dateName})</span>
		{/if}
		{#if frbr.authorLabel}
			<span class="text-gray-500">Autor</span>
			<span class="text-gray-700">{frbr.authorLabel}</span>
		{/if}
		{#if frbr.country}
			<span class="text-gray-500">Pais</span>
			<span class="text-gray-700">{frbr.country}</span>
		{/if}
	</div>
</div>
