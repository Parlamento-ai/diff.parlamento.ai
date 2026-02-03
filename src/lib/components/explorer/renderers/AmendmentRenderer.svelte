<script lang="ts">
	import type { AknNode, ManifestEntry } from '$lib/types/explorer';
	import { findNode, extractTextFromNode } from '$lib/utils/akn-helpers';
	import BlockContent from '../shared/BlockContent.svelte';

	let { root, manifest = [] }: { root: AknNode; manifest?: ManifestEntry[] } = $props();

	const preface = $derived(findNode(root, 'preface'));
	const amendmentBody = $derived(findNode(root, 'amendmentBody'));
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

{#if amendmentBody}
	{#each amendmentBody.children as section}
		{#if section.name === 'amendmentContent'}
			{#each section.children as block}
				{#if block.name === 'block'}
					<div class="mb-4 p-4 rounded-lg {block.attributes['name'] === 'justificacion' ? 'bg-amber-50/50 border border-amber-100' : 'bg-gray-50 border border-gray-200'}">
						{#if block.attributes['name'] === 'justificacion'}
							<h4 class="text-sm font-heading font-semibold text-amber-800 mb-2 uppercase tracking-wide">Justificacion</h4>
						{:else if block.attributes['name'] === 'enmienda'}
							<h4 class="text-sm font-heading font-semibold text-gray-700 mb-2 uppercase tracking-wide">Texto de la enmienda</h4>
						{/if}
						{#each block.children as child}
							<BlockContent node={child} {manifest} />
						{/each}
					</div>
				{:else}
					<BlockContent node={block} {manifest} />
				{/if}
			{/each}
		{:else}
			<BlockContent node={section} {manifest} />
		{/if}
	{/each}
{/if}
