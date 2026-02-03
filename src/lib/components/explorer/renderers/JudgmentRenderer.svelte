<script lang="ts">
	import type { AknNode, ManifestEntry } from '$lib/types/explorer';
	import { findNode, extractTextFromNode } from '$lib/utils/akn-helpers';
	import BlockContent from '../shared/BlockContent.svelte';

	let { root, manifest = [] }: { root: AknNode; manifest?: ManifestEntry[] } = $props();

	const header = $derived(findNode(root, 'header'));
	const judgmentBody = $derived(findNode(root, 'judgmentBody'));

	const SECTION_COLORS: Record<string, string> = {
		introduction: 'border-gray-300',
		background: 'border-gray-300',
		arguments: 'border-red-200',
		decision: 'border-red-400'
	};
</script>

{#if header}
	<div class="mb-6 text-center">
		{#each header.children as child}
			<BlockContent node={child} {manifest} />
		{/each}
	</div>
	<hr class="mb-6 border-gray-200" />
{/if}

{#if judgmentBody}
	{#each judgmentBody.children as section}
		{@const sectionName = section.name}
		<div class="mb-6 pl-4 border-l-2 {SECTION_COLORS[sectionName] || 'border-gray-200'}" id={section.attributes['eId']}>
			{#each section.children as child}
				{#if child.name === 'heading'}
					<h3 class="text-lg font-heading font-semibold text-gray-800 mb-3">
						{extractTextFromNode(child)}
					</h3>
				{:else if child.name === 'paragraph'}
					<div class="mb-3" id={child.attributes['eId']}>
						{#each child.children as pChild}
							{#if pChild.name === 'num'}
								<span class="font-heading font-semibold text-gray-600 mr-1">{extractTextFromNode(pChild)}</span>
							{:else}
								<BlockContent node={pChild} {manifest} />
							{/if}
						{/each}
					</div>
				{:else}
					<BlockContent node={child} {manifest} />
				{/if}
			{/each}
		</div>
	{/each}
{/if}
