<script lang="ts">
	import type { AknNode, ManifestEntry } from '$lib/types/explorer';
	import { findNode, findAllNodes, extractTextFromNode } from '$lib/utils/akn-helpers';
	import BlockContent from '../shared/BlockContent.svelte';

	let { root, manifest = [], linkBase = '/docs/explorer' }: { root: AknNode; manifest?: ManifestEntry[]; linkBase?: string } = $props();

	const preface = $derived(findNode(root, 'preface'));
	const questionBody = $derived(findNode(root, 'questionBody'));
	const questionStatus = $derived(questionBody ? findNode(questionBody, 'questionStatus') : undefined);
	const questionContent = $derived(questionBody ? findNode(questionBody, 'questionContent') : undefined);
	const answerContent = $derived(questionBody ? findNode(questionBody, 'answerContent') : undefined);

	const questionItems = $derived.by(() =>
		questionContent ? questionContent.children.filter((child) => child.name === 'question') : []
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

	function getStatusAttr(name: string): string {
		if (!questionStatus) return '';
		return questionStatus.attributes[name] || '';
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

{#if questionStatus}
	<div class="mb-6 p-4 rounded-lg border border-orange-200 bg-orange-50/60">
		<h3 class="text-sm font-heading font-semibold text-orange-800 uppercase tracking-wide mb-3">
			Question Status
		</h3>
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
			{#if getStatusAttr('status')}
				<div>
					<div class="text-xs text-orange-700 uppercase tracking-wide">Status</div>
					<div class="font-medium">{getStatusAttr('status')}</div>
				</div>
			{/if}
			{#if getStatusAttr('askedBy')}
				<div>
					<div class="text-xs text-orange-700 uppercase tracking-wide">Asked By</div>
					<div class="font-medium">{resolveShowAs(getStatusAttr('askedBy'))}</div>
				</div>
			{/if}
			{#if getStatusAttr('addressedTo')}
				<div>
					<div class="text-xs text-orange-700 uppercase tracking-wide">Addressed To</div>
					<div class="font-medium">{resolveShowAs(getStatusAttr('addressedTo'))}</div>
				</div>
			{/if}
			{#if getStatusAttr('dateAsked')}
				<div>
					<div class="text-xs text-orange-700 uppercase tracking-wide">Date Asked</div>
					<div class="font-medium">{getStatusAttr('dateAsked')}</div>
				</div>
			{/if}
			{#if getStatusAttr('dateAnswered')}
				<div>
					<div class="text-xs text-orange-700 uppercase tracking-wide">Date Answered</div>
					<div class="font-medium">{getStatusAttr('dateAnswered')}</div>
				</div>
			{/if}
			{#if getStatusAttr('deadline')}
				<div>
					<div class="text-xs text-orange-700 uppercase tracking-wide">Deadline</div>
					<div class="font-medium">{getStatusAttr('deadline')}</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

{#if questionContent}
	<div class="mb-6">
		<h3 class="text-lg font-heading font-semibold text-orange-900 mb-3">Questions</h3>
		{#if questionItems.length > 0}
			{#each questionItems as item, index}
				<div class="mb-4 p-4 rounded-lg border border-orange-100 bg-white">
					<div class="text-xs font-heading font-semibold text-orange-700 uppercase tracking-wide mb-2">
						Question {index + 1}
					</div>
					{#each item.children as child}
						<BlockContent node={child} {manifest} {linkBase} />
					{/each}
				</div>
			{/each}
		{:else}
			{#each questionContent.children as child}
				<BlockContent node={child} {manifest} {linkBase} />
			{/each}
		{/if}
	</div>
{/if}

{#if answerContent}
	<div class="mb-2">
		<h3 class="text-lg font-heading font-semibold text-orange-900 mb-3">Answer</h3>
		<div class="p-4 rounded-lg border border-orange-100 bg-orange-50/40">
			{#each answerContent.children as child}
				<BlockContent node={child} {manifest} {linkBase} />
			{/each}
		</div>
	</div>
{/if}
