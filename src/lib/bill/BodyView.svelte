<script lang="ts">
	import type { BodyNode } from './parse';
	import AknTerm from './AknTerm.svelte';
	import Self from './BodyView.svelte';

	type Props = {
		nodes: BodyNode[];
		highlightedEids: Set<string>;
		spanToEvents: Record<string, string[]>;
		onSpanClick: (eId: string) => void;
		depth?: number;
	};

	let { nodes, highlightedEids, spanToEvents, onSpanClick, depth = 0 }: Props = $props();
</script>

{#each nodes as n, i (i)}
	{@const highlighted = n.eId ? highlightedEids.has(n.eId) : false}
	{@const touchingEvents = n.eId ? (spanToEvents[n.eId] ?? []) : []}
	<div
		class="body-node"
		class:highlighted
		data-eid={n.eId ?? ''}
		style="margin-left: {depth * 12}px"
	>
		<div class="chip">
			<AknTerm term={n.tag} />
			{#if n.eId}
				<button
					type="button"
					class="eid"
					onclick={() => n.eId && onSpanClick(n.eId)}
					title={touchingEvents.length
						? `Touched by ${touchingEvents.length} event(s) — click to list`
						: 'No events touched this span'}
				>
					eId={n.eId}
				</button>
				{#if touchingEvents.length}
					<span class="touched">{touchingEvents.length} event(s)</span>
				{/if}
			{/if}
		</div>
		{#if n.num}<div class="num">{n.num}</div>{/if}
		{#if n.heading}<div class="heading">{n.heading}</div>{/if}
		{#if n.text}<div class="text">{n.text}</div>{/if}
		{#if n.children.length}
			<Self
				nodes={n.children}
				{highlightedEids}
				{spanToEvents}
				{onSpanClick}
				depth={depth + 1}
			/>
		{/if}
	</div>
{/each}

<style>
	.body-node {
		padding: 6px 8px;
		border-left: 2px solid transparent;
	}
	.body-node.highlighted {
		border-left-color: #d97706;
		background: #fffbeb;
	}
	.chip {
		font-size: 11px;
		color: #6b7280;
		font-family: ui-monospace, monospace;
		display: flex;
		gap: 8px;
		align-items: baseline;
	}
	.eid {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		color: #1f2937;
		font-family: inherit;
		font-size: inherit;
		text-decoration: underline dotted;
	}
	.eid:hover {
		color: #d97706;
	}
	.touched {
		color: #d97706;
	}
	.num {
		font-weight: 700;
		margin-top: 2px;
	}
	.heading {
		font-style: italic;
		color: #374151;
	}
	.text {
		margin-top: 4px;
		color: #1f2937;
		font-size: 13px;
		line-height: 1.5;
	}
</style>
