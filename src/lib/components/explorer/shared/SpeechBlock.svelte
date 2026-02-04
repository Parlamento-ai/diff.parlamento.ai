<script lang="ts">
	import type { AknNode, ManifestEntry } from '$lib/types/explorer';
	import AknRef from './AknRef.svelte';
	import { extractTextFromNode } from '$lib/utils/akn-helpers';

	let { node, manifest = [], linkBase = '/docs/explorer' }: { node: AknNode; manifest?: ManifestEntry[]; linkBase?: string } = $props();

	function getSpeaker(speech: AknNode): string {
		const from = speech.children.find((c) => c.name === 'from');
		if (from) return extractTextFromNode(from);
		return speech.attributes['by']?.replace('#', '') || 'Desconocido';
	}
</script>

<div class="mb-4 pl-4 border-l-2 border-gray-200">
	<div class="font-heading font-semibold text-sm text-gray-700 mb-1">
		{getSpeaker(node)}
	</div>
	{#each node.children as child}
		{#if child.name === 'p'}
			<p class="text-gray-700 mb-2 leading-relaxed">
				{#each child.children as inline}
					{#if inline.name === '#text'}
						{inline.text}
					{:else if inline.name === 'ref'}
						<AknRef href={inline.attributes['href'] || ''} {manifest} {linkBase}>{extractTextFromNode(inline)}</AknRef>
					{:else}
						{extractTextFromNode(inline)}
					{/if}
				{/each}
				{#if child.children.length === 0}
					{extractTextFromNode(child)}
				{/if}
			</p>
		{/if}
	{/each}
</div>
