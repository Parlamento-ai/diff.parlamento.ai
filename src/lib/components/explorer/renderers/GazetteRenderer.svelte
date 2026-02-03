<script lang="ts">
	import type { AknNode, ManifestEntry } from '$lib/types/explorer';
	import { findNode, extractTextFromNode } from '$lib/utils/akn-helpers';
	import BlockContent from '../shared/BlockContent.svelte';
	import AknRef from '../shared/AknRef.svelte';

	let { root, manifest = [] }: { root: AknNode; manifest?: ManifestEntry[] } = $props();

	const preface = $derived(findNode(root, 'preface'));
	const collectionBody = $derived(findNode(root, 'collectionBody'));
</script>

{#if preface}
	<div class="mb-6">
		{#each preface.children as child}
			{#if child.name === 'longTitle'}
				<h2 class="text-2xl font-heading font-bold text-gray-900 mb-2">
					{extractTextFromNode(child)}
				</h2>
			{:else}
				<BlockContent node={child} {manifest} />
			{/if}
		{/each}
	</div>
{/if}

{#if collectionBody}
	{#each collectionBody.children as component}
		{#if component.name === 'component'}
			<div class="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200" id={component.attributes['eId']}>
				{#each component.children as child}
					{#if child.name === 'heading'}
						<h3 class="font-heading font-semibold text-gray-800 mb-2">
							{extractTextFromNode(child)}
						</h3>
					{:else if child.name === 'componentRef'}
						<div class="mb-2">
							<AknRef href={child.attributes['src'] || ''} {manifest}>
								{child.attributes['showAs'] || child.attributes['src'] || ''}
							</AknRef>
						</div>
					{:else}
						<BlockContent node={child} {manifest} />
					{/if}
				{/each}
			</div>
		{:else}
			<BlockContent node={component} {manifest} />
		{/if}
	{/each}
{/if}
