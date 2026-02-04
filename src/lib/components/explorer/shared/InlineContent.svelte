<script lang="ts">
	import type { AknNode, ManifestEntry } from '$lib/types/explorer';
	import AknRef from './AknRef.svelte';
	import { extractTextFromNode } from '$lib/utils/akn-helpers';
	import InlineContent from './InlineContent.svelte';

	let { node, manifest = [], linkBase = '/docs/explorer' }: { node: AknNode; manifest?: ManifestEntry[]; linkBase?: string } = $props();
</script>

{#if node.name === '#text'}
	{node.text}
{:else if node.name === 'ref'}
	<AknRef href={node.attributes['href'] || ''} {manifest} {linkBase}>{extractTextFromNode(node)}</AknRef>
{:else if node.name === 'mod'}
	<span class="bg-blue-50 border-l-2 border-blue-300 pl-2 inline">{extractTextFromNode(node)}</span>
{:else if node.name === 'ins'}
	<span class="bg-addition-50 border-l-2 border-addition-500 pl-2 inline">{extractTextFromNode(node)}</span>
{:else if node.name === 'del'}
	<span class="bg-deletion-50 line-through">{extractTextFromNode(node)}</span>
{:else}
	{#each node.children as child}
		<InlineContent node={child} {manifest} {linkBase} />
	{/each}
{/if}
