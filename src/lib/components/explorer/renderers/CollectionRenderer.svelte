<script lang="ts">
	import type { AknNode, ManifestEntry } from '$lib/types/explorer';
	import { findNode, extractTextFromNode } from '$lib/utils/akn-helpers';
	import BlockContent from '../shared/BlockContent.svelte';
	import AknRef from '../shared/AknRef.svelte';

	let { root, manifest = [], linkBase = '/docs/explorer' }: { root: AknNode; manifest?: ManifestEntry[]; linkBase?: string } = $props();

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
				<BlockContent node={child} {manifest} {linkBase} />
			{/if}
		{/each}
	</div>
{/if}

{#if collectionBody}
	<div class="space-y-3">
		{#each collectionBody.children as component}
			{#if component.name === 'component'}
				<div class="p-4 card-layout card-hover" id={component.attributes['eId']}>
					{#each component.children as child}
						{#if child.name === 'heading'}
							<h3 class="font-heading font-semibold text-gray-800 mb-2">
								{extractTextFromNode(child)}
							</h3>
						{:else if child.name === 'componentRef'}
							<div class="mb-1">
								<AknRef href={child.attributes['src'] || ''} {manifest} {linkBase}>
									{child.attributes['showAs'] || child.attributes['src'] || ''}
								</AknRef>
							</div>
						{:else}
							<BlockContent node={child} {manifest} {linkBase} />
						{/if}
					{/each}
				</div>
			{:else}
				<BlockContent node={component} {manifest} {linkBase} />
			{/if}
		{/each}
	</div>
{/if}
