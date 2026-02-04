<script lang="ts">
	import type { AknNode, ManifestEntry } from '$lib/types/explorer';
	import { findNode, findAllNodes, extractTextFromNode } from '$lib/utils/akn-helpers';
	import BlockContent from '../shared/BlockContent.svelte';
	import InlineContent from '../shared/InlineContent.svelte';

	let { root, manifest = [], linkBase = '/docs/explorer' }: { root: AknNode; manifest?: ManifestEntry[]; linkBase?: string } = $props();

	const preface = $derived(findNode(root, 'preface'));
	const body = $derived(findNode(root, 'body'));
	const sections = $derived(body ? body.children.filter((c) => c.name === 'section') : []);
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

{#if sections.length > 0}
	{#each sections as section}
		<div class="mb-6" id={section.attributes['eId']}>
			{#each section.children as child}
				{#if child.name === 'heading'}
					<h3 class="text-lg font-heading font-semibold text-gray-800 mb-3 pb-1 border-b border-gray-100">
						{extractTextFromNode(child)}
					</h3>
				{:else if child.name === 'article'}
					<div class="mb-4 pl-4 border-l-2 border-brand/30" id={child.attributes['eId']}>
						{#each child.children as artChild}
							{#if artChild.name === 'heading'}
								<h4 class="font-heading font-medium text-gray-700 mb-1">
									{extractTextFromNode(artChild)}
								</h4>
							{:else}
								<BlockContent node={artChild} {manifest} {linkBase} />
							{/if}
						{/each}
					</div>
				{:else}
					<BlockContent node={child} {manifest} {linkBase} />
				{/if}
			{/each}
		</div>
	{/each}
{:else if body}
	<!-- Body without sections (articles directly) -->
	{#each body.children as child}
		{#if child.name === 'article'}
			<div class="mb-4 pl-4 border-l-2 border-brand/30" id={child.attributes['eId']}>
				{#each child.children as artChild}
					{#if artChild.name === 'heading'}
						<h4 class="font-heading font-medium text-gray-700 mb-1">
							{extractTextFromNode(artChild)}
						</h4>
					{:else}
						<BlockContent node={artChild} {manifest} {linkBase} />
					{/if}
				{/each}
			</div>
		{:else}
			<BlockContent node={child} {manifest} {linkBase} />
		{/if}
	{/each}
{/if}
