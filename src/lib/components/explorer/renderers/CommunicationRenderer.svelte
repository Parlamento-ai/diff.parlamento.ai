<script lang="ts">
	import type { AknNode, ManifestEntry } from '$lib/types/explorer';
	import { findNode, findAllNodes, extractTextFromNode } from '$lib/utils/akn-helpers';
	import BlockContent from '../shared/BlockContent.svelte';
	import AknRef from '../shared/AknRef.svelte';

	let { root, manifest = [], linkBase = '/docs/explorer' }: { root: AknNode; manifest?: ManifestEntry[]; linkBase?: string } = $props();

	const preface = $derived(findNode(root, 'preface'));
	const communicationBody = $derived(findNode(root, 'communicationBody'));
	const transmission = $derived(communicationBody ? findNode(communicationBody, 'transmission') : undefined);
	const content = $derived(communicationBody ? findNode(communicationBody, 'content') : undefined);
	const rationales = $derived.by(() =>
		communicationBody ? communicationBody.children.filter((child) => child.name === 'rationale') : []
	);

	const referenceNodes = $derived.by(() => [
		...findAllNodes(root, 'TLCPerson'),
		...findAllNodes(root, 'TLCOrganization')
	]);

	function resolveShowAs(ref: string | undefined): string {
		if (!ref) return '';
		const normalized = ref.startsWith('#') ? ref.slice(1) : ref;
		const match = referenceNodes.find((node) => node.attributes['eId'] === normalized);
		return match?.attributes['showAs'] || normalized;
	}

	function getTransmissionAttr(name: string): string {
		if (!transmission) return '';
		return transmission.attributes[name] || '';
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

{#if transmission}
	<div class="mb-6 p-4 rounded-lg border border-violet-200 bg-violet-50/60">
		<h3 class="text-sm font-heading font-semibold text-violet-800 uppercase tracking-wide mb-3">
			Transmission
		</h3>
		<div class="flex flex-col gap-2 text-sm text-gray-700">
			<div class="flex flex-wrap items-center gap-2">
				<span class="font-medium">{resolveShowAs(getTransmissionAttr('from'))}</span>
				<span class="text-gray-400">&#8594;</span>
				<span class="font-medium">{resolveShowAs(getTransmissionAttr('to'))}</span>
				{#if getTransmissionAttr('type')}
					<span class="text-xs uppercase tracking-wide bg-violet-100 text-violet-800 px-2 py-0.5 rounded-full">
						{getTransmissionAttr('type')}
					</span>
				{/if}
			</div>
			{#if getTransmissionAttr('date')}
				<div>
					<span class="text-xs text-violet-700 uppercase tracking-wide">Date</span>
					<span class="ml-2 font-medium">{getTransmissionAttr('date')}</span>
				</div>
			{/if}
			{#if getTransmissionAttr('refersTo')}
				<div>
					<span class="text-xs text-violet-700 uppercase tracking-wide">Refers To</span>
					<span class="ml-2">
						<AknRef href={getTransmissionAttr('refersTo')} {manifest} {linkBase}>
							{getTransmissionAttr('refersTo')}
						</AknRef>
					</span>
				</div>
			{/if}
		</div>
	</div>
{/if}

{#if content}
	<div class="mb-6">
		<h3 class="text-lg font-heading font-semibold text-violet-900 mb-3">Content</h3>
		{#each content.children as child}
			<BlockContent node={child} {manifest} {linkBase} />
		{/each}
	</div>
{/if}

{#if rationales.length > 0}
	<div>
		{#each rationales as rationale}
			<div class="mb-4 p-4 rounded-lg border border-violet-100 bg-violet-50/40">
				{#if findNode(rationale, 'heading')}
					<h4 class="font-heading font-semibold text-violet-900 mb-2">
						{extractTextFromNode(findNode(rationale, 'heading') as AknNode)}
					</h4>
				{/if}
				{#each rationale.children as child}
					{#if child.name !== 'heading'}
						<BlockContent node={child} {manifest} {linkBase} />
					{/if}
				{/each}
			</div>
		{/each}
	</div>
{/if}
