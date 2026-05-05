<script lang="ts">
	import type { BodyNode } from './parse';
	import AknTerm from './AknTerm.svelte';
	import Self from './BodyView.svelte';

	type Props = {
		nodes: BodyNode[];
		highlightedEids: Set<string>;
		depth?: number;
	};

	let { nodes, highlightedEids, depth = 0 }: Props = $props();

	let openEids = $state(new Set<string>());

	function toggleAkn(eId: string | undefined, idx: number) {
		const key = eId ?? `__idx_${depth}_${idx}`;
		if (openEids.has(key)) openEids.delete(key);
		else openEids.add(key);
		openEids = new Set(openEids);
	}
	function isAknOpen(eId: string | undefined, idx: number) {
		const key = eId ?? `__idx_${depth}_${idx}`;
		return openEids.has(key);
	}
</script>

{#each nodes as n, i (i)}
	{@const highlighted = n.eId ? highlightedEids.has(n.eId) : false}
	{@const aknOpen = isAknOpen(n.eId, i)}
	<div
		class="body-node"
		class:highlighted
		class:has-depth={depth > 0}
		data-eid={n.eId ?? ''}
	>
		<div class="content">
			{#if n.num}<div class="num">{n.num}</div>{/if}
			{#if n.heading}<div class="heading">{n.heading}</div>{/if}
			{#if n.text}<div class="text">{n.text}</div>{/if}
		</div>

		<button
			type="button"
			class="akn-toggle"
			class:akn-toggle-open={aknOpen}
			onclick={() => toggleAkn(n.eId, i)}
			aria-expanded={aknOpen}
			title="Show AKN tag and identifiers"
		>
			AKN <span class="akn-caret" aria-hidden="true">{aknOpen ? '▾' : '▸'}</span>
		</button>

		{#if aknOpen}
			<div class="akn-panel">
				<div class="akn-row">
					<dt>tag</dt>
					<dd><AknTerm term={n.tag} /></dd>
				</div>
				{#if n.eId}
					<div class="akn-row">
						<dt><AknTerm term="eId" /></dt>
						<dd class="mono ink">{n.eId}</dd>
					</div>
				{/if}
			</div>
		{/if}

		{#if n.children.length}
			<div class="children">
				<Self nodes={n.children} {highlightedEids} depth={depth + 1} />
			</div>
		{/if}
	</div>
{/each}

<style>
	.body-node {
		position: relative;
		padding: 8px 0 8px 12px;
		border-left: 3px solid transparent;
		margin-left: 0;
		transition: background-color 0.15s ease, border-left-color 0.15s ease;
	}
	.body-node.highlighted {
		border-left-color: #334155;
		background: #f1f5f9;
		border-radius: 0 4px 4px 0;
	}
	.body-node.flash-highlight {
		background: #fef3c7;
		border-left-color: #f59e0b;
		transition: background-color 0.6s ease, border-left-color 0.6s ease;
	}
	.children {
		margin-left: 16px;
		border-left: 1px dotted #d1d5db;
		padding-left: 8px;
		margin-top: 6px;
	}
	.content {
		font-family: var(--font-heading);
		color: #111827;
		line-height: 1.6;
	}
	.num {
		font-family: var(--font-heading);
		font-weight: 600;
		font-size: 13px;
		color: #0a0f1c;
	}
	.heading {
		font-family: var(--font-heading);
		font-weight: 500;
		font-size: 13px;
		color: #1f2937;
		margin-top: 2px;
	}
	.text {
		margin-top: 5px;
		color: #1f2937;
		font-size: 13px;
		line-height: 1.65;
	}
	.akn-toggle {
		position: absolute;
		top: 8px;
		right: 4px;
		display: inline-flex;
		align-items: center;
		gap: 4px;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 4px;
		padding: 1px 6px;
		font-family: var(--font-heading);
		font-size: 9px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #cbd5e1;
		cursor: pointer;
		opacity: 0;
		transition: opacity 0.15s ease, color 0.1s ease, background-color 0.1s ease, border-color 0.1s ease;
	}
	.body-node:hover > .akn-toggle,
	.akn-toggle:focus-visible,
	.akn-toggle.akn-toggle-open {
		opacity: 1;
	}
	.akn-toggle:hover {
		color: #1f2937;
		background: #f3f4f6;
		border-color: #e5e7eb;
	}
	.akn-toggle-open {
		color: #1f2937;
		background: #f3f4f6;
		border-color: #e5e7eb;
	}
	.akn-caret {
		font-size: 8px;
	}
	.akn-panel {
		margin-top: 8px;
		padding: 8px 10px;
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 4px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.akn-row {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 4px 12px;
		font-size: 11px;
	}
	.akn-row dt {
		font-family: var(--font-heading);
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #6b7280;
	}
	.akn-row dd {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 11px;
		color: #4b5563;
		word-break: break-all;
	}
	.akn-row dd.ink {
		color: #334155;
	}
</style>
