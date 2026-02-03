<script lang="ts">
	import type { AknNode, ManifestEntry } from '$lib/types/explorer';
	import InlineContent from './InlineContent.svelte';
	import { extractTextFromNode } from '$lib/utils/akn-helpers';
	import BlockContent from './BlockContent.svelte';

	let { node, manifest = [] }: { node: AknNode; manifest?: ManifestEntry[] } = $props();
</script>

{#if node.name === 'p'}
	<p class="text-gray-700 mb-2 leading-relaxed">
		{#each node.children as child}
			<InlineContent node={child} {manifest} />
		{/each}
		{#if node.children.length === 0}
			{extractTextFromNode(node)}
		{/if}
	</p>
{:else if node.name === 'heading'}
	<h3 class="font-heading font-semibold text-gray-800 mb-1">{extractTextFromNode(node)}</h3>
{:else if node.name === 'num'}
	<span class="font-heading font-semibold text-gray-600 mr-2">{extractTextFromNode(node)}</span>
{:else if node.name === 'content'}
	{#each node.children as child}
		<BlockContent node={child} {manifest} />
	{/each}
{:else if node.name === '#text'}
	{node.text}
{:else}
	{#each node.children as child}
		<BlockContent node={child} {manifest} />
	{/each}
{/if}
