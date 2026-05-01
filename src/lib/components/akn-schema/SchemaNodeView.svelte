<script lang="ts">
	import { untrack } from 'svelte';
	import type { SchemaNode, Cardinality } from '$lib/akn-schema/types';
	import SchemaNodeView from './SchemaNodeView.svelte';

	let {
		node,
		linkBase,
		depth,
		expanded = false
	}: { node: SchemaNode; linkBase: string; depth: number; expanded?: boolean } = $props();

	// Capture initial open/closed state once at mount; the user can toggle from there.
	let isOpen = $state(untrack(() => expanded || depth < 1));

	function cardLabel(card: Cardinality): string {
		const max = card.max === 'unbounded' ? '∞' : String(card.max);
		if (card.min === card.max) return `${card.min}`;
		return `${card.min}..${max}`;
	}

	function cardClass(card: Cardinality): string {
		if (card.min === 0 && card.max === 1) return 'bg-gray-100 text-gray-600';
		if (card.min === 1 && card.max === 1) return 'bg-emerald-100 text-emerald-700';
		if (card.max === 'unbounded' && card.min === 0) return 'bg-blue-100 text-blue-700';
		if (card.max === 'unbounded' && card.min >= 1) return 'bg-amber-100 text-amber-700';
		return 'bg-gray-100 text-gray-600';
	}
</script>

{#if node.kind === 'text'}
	<div class="py-0.5 text-gray-400 italic">#text</div>
{:else if node.kind === 'cycle'}
	<div class="py-0.5 flex items-center gap-2">
		<a
			href="{linkBase}/{node.name}"
			class="text-gray-700 hover:text-blue-700 hover:underline underline-offset-2"
		>
			&lt;{node.name}&gt;
		</a>
		<span class="text-[10px] px-1.5 py-0.5 rounded {cardClass(node.card)}">{cardLabel(node.card)}</span>
		<span class="text-[10px] text-gray-400">→ ref</span>
		{#if node.doc}
			<span class="text-xs text-gray-500 truncate" title={node.doc}>— {node.doc}</span>
		{/if}
	</div>
{:else}
	<div class="py-0.5">
		<div class="flex items-center gap-2">
			{#if node.children.length > 0 || node.attributes.length > 0}
				<button
					type="button"
					class="text-gray-400 hover:text-gray-700 w-4 text-center select-none"
					onclick={() => (isOpen = !isOpen)}
					aria-label={isOpen ? 'Collapse' : 'Expand'}
				>
					{isOpen ? '▾' : '▸'}
				</button>
			{:else}
				<span class="w-4 inline-block"></span>
			{/if}
			<span class="text-gray-800">&lt;{node.name}&gt;</span>
			<span class="text-[10px] px-1.5 py-0.5 rounded {cardClass(node.card)}">{cardLabel(node.card)}</span>
			{#if node.typeRef}
				<span class="text-[10px] text-gray-400">: {node.typeRef}</span>
			{/if}
			{#if node.childMode === 'choice'}
				<span class="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">choice</span>
			{/if}
			{#if node.doc}
				<span class="text-xs text-gray-500 truncate" title={node.doc}>— {node.doc}</span>
			{/if}
		</div>
		{#if isOpen}
			<div class="ml-4 border-l border-gray-200 pl-3">
				{#if node.attributes.length > 0}
					<div class="py-1">
						<div class="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Attributes</div>
						{#each node.attributes as attr (attr.name)}
							<div class="flex items-center gap-2 py-0.5">
								<span class="text-gray-400 w-4 text-center">@</span>
								<span class="text-gray-700">{attr.name}</span>
								{#if attr.typeRef}
									<span class="text-[10px] text-gray-400">: {attr.typeRef}</span>
								{/if}
								<span class="text-[10px] px-1.5 py-0.5 rounded {attr.use === 'required' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-500'}">
									{attr.use}
								</span>
								{#if attr.default}
									<span class="text-[10px] text-gray-400">= {attr.default}</span>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
				{#each node.children as child, i (i)}
					<SchemaNodeView node={child} {linkBase} depth={depth + 1} />
				{/each}
			</div>
		{/if}
	</div>
{/if}
