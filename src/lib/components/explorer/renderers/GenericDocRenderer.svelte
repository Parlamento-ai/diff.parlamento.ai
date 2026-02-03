<script lang="ts">
	import type { AknNode, ManifestEntry } from '$lib/types/explorer';
	import { findNode, extractTextFromNode } from '$lib/utils/akn-helpers';
	import BlockContent from '../shared/BlockContent.svelte';

	let { root, manifest = [] }: { root: AknNode; manifest?: ManifestEntry[] } = $props();

	const preface = $derived(findNode(root, 'preface'));
	const mainBody = $derived(findNode(root, 'mainBody') || findNode(root, 'body'));
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

{#if mainBody}
	{#each mainBody.children as section}
		{#if section.name === 'section'}
			<div class="mb-6" id={section.attributes['eId']}>
				{#each section.children as child}
					{#if child.name === 'heading'}
						<h3 class="text-lg font-heading font-semibold text-gray-800 mb-3 pb-1 border-b border-gray-100">
							{extractTextFromNode(child)}
						</h3>
					{:else}
						<BlockContent node={child} {manifest} />
					{/if}
				{/each}
			</div>
		{:else}
			<BlockContent node={section} {manifest} />
		{/if}
	{/each}
{/if}
