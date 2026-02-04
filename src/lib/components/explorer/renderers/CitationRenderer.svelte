<script lang="ts">
	import type { AknNode, ManifestEntry } from '$lib/types/explorer';
	import { findNode, findAllNodes, extractTextFromNode } from '$lib/utils/akn-helpers';
	import BlockContent from '../shared/BlockContent.svelte';
	import AknRef from '../shared/AknRef.svelte';

	let { root, manifest = [], linkBase = '/docs/explorer' }: { root: AknNode; manifest?: ManifestEntry[]; linkBase?: string } = $props();

	const preface = $derived(findNode(root, 'preface'));
	const citationBody = $derived(findNode(root, 'citationBody'));
	const session = $derived(citationBody ? findNode(citationBody, 'session') : undefined);
	const agenda = $derived(citationBody ? findNode(citationBody, 'agenda') : undefined);

	const agendaSections = $derived.by(() =>
		agenda ? agenda.children.filter((child) => child.name === 'agendaSection') : []
	);

	function getAttr(node: AknNode | undefined, name: string): string {
		if (!node) return '';
		return node.attributes[name] || '';
	}

	function getAgendaItemContent(item: AknNode): AknNode[] {
		return item.children.filter(
			(child) => !['heading', 'step', 'ref'].includes(child.name)
		);
	}
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

{#if session}
	<div class="mb-6 p-4 rounded-lg border border-teal-200 bg-teal-50/60">
		<h3 class="text-sm font-heading font-semibold text-teal-800 uppercase tracking-wide mb-3">
			Session
		</h3>
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
			{#if getAttr(session, 'date')}
				<div>
					<div class="text-xs text-teal-700 uppercase tracking-wide">Date</div>
					<div class="font-medium">{getAttr(session, 'date')}</div>
				</div>
			{/if}
			{#if getAttr(session, 'time')}
				<div>
					<div class="text-xs text-teal-700 uppercase tracking-wide">Time</div>
					<div class="font-medium">{getAttr(session, 'time')}</div>
				</div>
			{/if}
			{#if getAttr(session, 'place')}
				<div>
					<div class="text-xs text-teal-700 uppercase tracking-wide">Place</div>
					<div class="font-medium">{getAttr(session, 'place')}</div>
				</div>
			{/if}
			{#if findNode(session, 'body')}
				<div>
					<div class="text-xs text-teal-700 uppercase tracking-wide">Body</div>
					<div class="font-medium">{extractTextFromNode(findNode(session, 'body') as AknNode)}</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

{#if agendaSections.length > 0}
	{#each agendaSections as section}
		<div class="mb-6">
			{#if findNode(section, 'heading')}
				<h3 class="text-lg font-heading font-semibold text-teal-900 mb-2">
					{extractTextFromNode(findNode(section, 'heading') as AknNode)}
				</h3>
			{/if}

			{#each section.children as child}
				{#if child.name === 'agendaItem'}
					{@const status = child.attributes['status'] || ''}
					{@const steps = findAllNodes(child, 'step')}
					{@const refs = findAllNodes(child, 'ref')}
					<div class="mb-3 p-4 rounded-lg border border-teal-100 bg-white">
						<div class="flex items-center gap-2 mb-2">
							{#if status}
								<span class="text-[11px] uppercase tracking-wide bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
									{status}
								</span>
							{/if}
							{#if findNode(child, 'heading')}
								<h4 class="font-heading font-semibold text-gray-800">
									{extractTextFromNode(findNode(child, 'heading') as AknNode)}
								</h4>
							{/if}
						</div>

						{#if steps.length > 0}
							<div class="flex flex-wrap gap-2 mb-2">
								{#each steps as step}
									<span class="text-xs text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
										{step.attributes['showAs'] || step.attributes['type'] || extractTextFromNode(step)}
									</span>
								{/each}
							</div>
						{/if}

						{#if refs.length > 0}
							<div class="text-sm text-gray-600 mb-2">
								{#each refs as ref}
									<div class="mb-1">
										<AknRef href={ref.attributes['href'] || ''} {manifest} {linkBase}>
											{extractTextFromNode(ref)}
										</AknRef>
									</div>
								{/each}
							</div>
						{/if}

						{#each getAgendaItemContent(child) as contentNode}
							<BlockContent node={contentNode} {manifest} {linkBase} />
						{/each}
					</div>
				{:else if child.name !== 'heading'}
					<BlockContent node={child} {manifest} {linkBase} />
				{/if}
			{/each}
		</div>
	{/each}
{/if}
