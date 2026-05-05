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
		class:has-depth={depth > 0}
		data-eid={n.eId ?? ''}
	>
		<div class="chip">
			<span class="tag-name"><AknTerm term={n.tag} /></span>
			{#if n.eId}
				<button
					type="button"
					class="eid-pill"
					onclick={() => n.eId && onSpanClick(n.eId)}
					title={touchingEvents.length
						? `Touched by ${touchingEvents.length} event(s) — click to list`
						: 'No events touched this span'}
				>
					eId=<span class="ink">{n.eId}</span>
				</button>
				{#if touchingEvents.length}
					<span class="touched">{touchingEvents.length} event{touchingEvents.length === 1 ? '' : 's'}</span>
				{/if}
			{/if}
		</div>
		{#if n.num}<div class="num">{n.num}</div>{/if}
		{#if n.heading}<div class="heading">{n.heading}</div>{/if}
		{#if n.text}<div class="text">{n.text}</div>{/if}
		{#if n.children.length}
			<div class="children">
				<Self
					nodes={n.children}
					{highlightedEids}
					{spanToEvents}
					{onSpanClick}
					depth={depth + 1}
				/>
			</div>
		{/if}
	</div>
{/each}

<style>
	.body-node {
		padding: 6px 0 6px 10px;
		border-left: 3px solid transparent;
		margin-left: 0;
		transition: background-color 0.15s ease;
	}
	.body-node.highlighted {
		border-left-color: var(--color-brand-dark);
		background: #f4fbe9;
		border-radius: 0 4px 4px 0;
	}
	.children {
		margin-left: 14px;
		border-left: 1px dotted #d1d5db;
		padding-left: 6px;
		margin-top: 4px;
	}
	.chip {
		font-size: 11px;
		color: #6b7280;
		font-family: var(--font-mono);
		display: flex;
		gap: 8px;
		align-items: center;
		flex-wrap: wrap;
	}
	.tag-name :global(.akn-term) {
		color: var(--color-brand-dark);
		font-weight: 600;
	}
	.eid-pill {
		background: #f3f4f6;
		border: 1px solid #d1d5db;
		padding: 1px 6px;
		border-radius: 3px;
		font-family: var(--font-mono);
		font-size: 10.5px;
		color: #4b5563;
		cursor: pointer;
		transition: all 0.1s ease;
	}
	.eid-pill:hover {
		background: var(--color-brand);
		border-color: var(--color-brand-dark);
		color: var(--color-brand-dark);
	}
	.eid-pill .ink {
		color: #0a0f1c;
	}
	.touched {
		font-family: var(--font-mono);
		font-size: 10px;
		color: #92400e;
		background: #fef3c7;
		padding: 1px 5px;
		border-radius: 3px;
		border: 1px solid color-mix(in srgb, #92400e 25%, transparent);
	}
	.num {
		font-family: var(--font-mono);
		font-weight: 700;
		margin-top: 4px;
		color: #0a0f1c;
		font-size: 12.5px;
	}
	.heading {
		font-family: var(--font-mono);
		font-style: italic;
		color: #374151;
		margin-top: 2px;
		font-size: 12px;
	}
	.text {
		margin-top: 5px;
		color: #1f2937;
		font-size: 12.5px;
		line-height: 1.6;
		font-family: var(--font-mono);
	}
</style>
