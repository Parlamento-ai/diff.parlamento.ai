<script lang="ts">
	import { AKN_TERMS, termDocsUrl } from './terms';

	type Props = {
		term: string;
		label?: string; // override displayed text (default: term)
		example?: string;
	};

	let { term, label, example }: Props = $props();

	const def = $derived(AKN_TERMS[term]);
	const display = $derived(label ?? term);
	const docsUrl = $derived(termDocsUrl(term));
</script>

<span class="akn-term" role="button" tabindex="0">
	<span class="text">{display}</span>
	{#if def}
		<span class="tip">
			<span class="tip-term">{term}</span>
			<span class="tip-body">{def.short}</span>
			{#if example ?? def.example}
				<span class="tip-example">e.g. {example ?? def.example}</span>
			{/if}
			{#if docsUrl}
				<a class="tip-link" href={docsUrl}>open docs →</a>
			{/if}
		</span>
	{:else}
		<span class="tip">
			<span class="tip-term">{term}</span>
			<span class="tip-body">No definition registered yet.</span>
		</span>
	{/if}
</span>

<style>
	.akn-term {
		position: relative;
		cursor: help;
		border-bottom: 1px dotted #9ca3af;
		display: inline;
	}
	.akn-term:focus {
		outline: none;
	}
	.akn-term:focus .tip,
	.akn-term:hover .tip {
		display: block;
	}
	.tip {
		display: none;
		position: absolute;
		left: 0;
		top: 100%;
		margin-top: 4px;
		z-index: 50;
		min-width: 240px;
		max-width: 360px;
		background: #111827;
		color: #f9fafb;
		padding: 8px 10px;
		font-size: 11px;
		line-height: 1.5;
		border-radius: 2px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}
	.tip-term {
		display: block;
		font-weight: 700;
		color: #fde68a;
		font-family: ui-monospace, monospace;
		margin-bottom: 4px;
	}
	.tip-body {
		display: block;
	}
	.tip-example {
		display: block;
		margin-top: 4px;
		color: #d1d5db;
		font-style: italic;
	}
	.tip-link {
		display: inline-block;
		margin-top: 6px;
		color: #fde68a;
		text-decoration: underline;
		text-underline-offset: 2px;
		pointer-events: auto;
	}
	.tip-link:hover {
		color: #fef3c7;
	}
</style>
