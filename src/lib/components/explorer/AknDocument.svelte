<script lang="ts">
	import type { AknNode, ManifestEntry, ExplorerDocType } from '$lib/types/explorer';
	import ActRenderer from './renderers/ActRenderer.svelte';
	import BillRenderer from './renderers/BillRenderer.svelte';
	import AmendmentRenderer from './renderers/AmendmentRenderer.svelte';
	import DebateRenderer from './renderers/DebateRenderer.svelte';
	import JudgmentRenderer from './renderers/JudgmentRenderer.svelte';
	import GazetteRenderer from './renderers/GazetteRenderer.svelte';
	import CollectionRenderer from './renderers/CollectionRenderer.svelte';
	import GenericDocRenderer from './renderers/GenericDocRenderer.svelte';
	import CitationRenderer from './renderers/CitationRenderer.svelte';
	import QuestionRenderer from './renderers/QuestionRenderer.svelte';
	import CommunicationRenderer from './renderers/CommunicationRenderer.svelte';

	let { document, manifest = [], linkBase = '/docs/explorer' }: {
		document: { type: ExplorerDocType; root: AknNode };
		manifest?: ManifestEntry[];
		linkBase?: string;
	} = $props();
</script>

{#if document.type === 'act'}
	<ActRenderer root={document.root} {manifest} {linkBase} />
{:else if document.type === 'bill'}
	<BillRenderer root={document.root} {manifest} {linkBase} />
{:else if document.type === 'amendment'}
	<AmendmentRenderer root={document.root} {manifest} {linkBase} />
{:else if document.type === 'debate'}
	<DebateRenderer root={document.root} {manifest} {linkBase} />
{:else if document.type === 'judgment'}
	<JudgmentRenderer root={document.root} {manifest} {linkBase} />
{:else if document.type === 'officialGazette'}
	<GazetteRenderer root={document.root} {manifest} {linkBase} />
{:else if document.type === 'documentCollection'}
	<CollectionRenderer root={document.root} {manifest} {linkBase} />
{:else if document.type === 'citation'}
	<CitationRenderer root={document.root} {manifest} {linkBase} />
{:else if document.type === 'question'}
	<QuestionRenderer root={document.root} {manifest} {linkBase} />
{:else if document.type === 'communication'}
	<CommunicationRenderer root={document.root} {manifest} {linkBase} />
{:else}
	<GenericDocRenderer root={document.root} {manifest} {linkBase} />
{/if}
