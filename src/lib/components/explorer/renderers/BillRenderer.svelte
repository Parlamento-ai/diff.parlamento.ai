<script lang="ts">
	import type { AknNode, ManifestEntry } from '$lib/types/explorer';
	import { findNode, extractTextFromNode } from '$lib/utils/akn-helpers';
	import BlockContent from '../shared/BlockContent.svelte';
	import InlineContent from '../shared/InlineContent.svelte';

	let { root, manifest = [] }: { root: AknNode; manifest?: ManifestEntry[] } = $props();

	const preface = $derived(findNode(root, 'preface'));
	const preamble = $derived(findNode(root, 'preamble'));
	const body = $derived(findNode(root, 'body'));
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

{#if preamble}
	<div class="mb-6 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
		<h3 class="text-sm font-heading font-semibold text-blue-800 mb-2 uppercase tracking-wide">Preambulo</h3>
		{#each preamble.children as child}
			<BlockContent node={child} {manifest} />
		{/each}
	</div>
{/if}

{#if body}
	<div>
		{#each body.children as child}
			{#if child.name === 'article'}
				<div class="mb-4 pl-4 border-l-2 border-blue-300" id={child.attributes['eId']}>
					{#each child.children as artChild}
						{#if artChild.name === 'heading'}
							<h4 class="font-heading font-medium text-gray-700 mb-1">
								{extractTextFromNode(artChild)}
							</h4>
						{:else}
							<BlockContent node={artChild} {manifest} />
						{/if}
					{/each}
				</div>
			{:else}
				<BlockContent node={child} {manifest} />
			{/if}
		{/each}
	</div>
{/if}
