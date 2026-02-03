<script lang="ts">
	import AknDocument from './AknDocument.svelte';
	import RawXmlView from './shared/RawXmlView.svelte';
	import AknMeta from './shared/AknMeta.svelte';
	import type { ExplorerDocType, ManifestEntry, AknNode, FRBRMeta } from '$lib/types/explorer';

	let { document, uri, title, manifest }: {
		document: { type: ExplorerDocType; name: string; frbr: FRBRMeta; root: AknNode; rawXml: string };
		uri: string;
		title: string;
		manifest: ManifestEntry[];
	} = $props();

	const TYPE_COLORS: Record<ExplorerDocType, string> = {
		act: 'text-emerald-700 bg-emerald-50 border-emerald-200',
		bill: 'text-blue-700 bg-blue-50 border-blue-200',
		amendment: 'text-amber-700 bg-amber-50 border-amber-200',
		debate: 'text-purple-700 bg-purple-50 border-purple-200',
		judgment: 'text-red-700 bg-red-50 border-red-200',
		officialGazette: 'text-gray-700 bg-gray-50 border-gray-200',
		documentCollection: 'text-cyan-700 bg-cyan-50 border-cyan-200',
		doc: 'text-stone-700 bg-stone-50 border-stone-200',
		statement: 'text-pink-700 bg-pink-50 border-pink-200',
		portion: 'text-indigo-700 bg-indigo-50 border-indigo-200'
	};

	type ViewMode = 'rendered' | 'split' | 'raw';
	let viewMode: ViewMode = $state('rendered');
</script>

<div>
	<!-- Browser chrome -->
	<div class="card-layout mb-4">
		<div class="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
			<a href="/docs/explorer/overview" class="text-sm text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded hover:bg-gray-50" title="Back to index">
				&larr;
			</a>
			<button onclick={() => history.back()} class="text-sm text-gray-400 hover:text-gray-600 transition-colors px-1 py-1 rounded hover:bg-gray-50" title="Back">
				&#9664;
			</button>
			<button onclick={() => history.forward()} class="text-sm text-gray-400 hover:text-gray-600 transition-colors px-1 py-1 rounded hover:bg-gray-50" title="Forward">
				&#9654;
			</button>
			<div class="flex-1 bg-gray-50 rounded px-3 py-1.5 font-mono text-sm text-gray-600 truncate border border-gray-200">
				{uri}
			</div>
			<span class="badge {TYPE_COLORS[document.type]}">{document.type}</span>
		</div>
		<!-- View mode toggle -->
		<div class="flex items-center gap-1 px-3 py-1.5 bg-gray-50 border-b border-gray-100">
			<button
				class="text-xs px-2 py-1 rounded font-heading font-medium transition-colors {viewMode === 'rendered' ? 'bg-white border border-gray-200 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
				onclick={() => viewMode = 'rendered'}
			>
				Rendered
			</button>
			<button
				class="text-xs px-2 py-1 rounded font-heading font-medium transition-colors {viewMode === 'split' ? 'bg-white border border-gray-200 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
				onclick={() => viewMode = 'split'}
			>
				Split
			</button>
			<button
				class="text-xs px-2 py-1 rounded font-heading font-medium transition-colors {viewMode === 'raw' ? 'bg-white border border-gray-200 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
				onclick={() => viewMode = 'raw'}
			>
				XML
			</button>
		</div>
	</div>

	<!-- Content area -->
	{#if viewMode === 'rendered'}
		<div class="card-layout p-6">
			<AknMeta frbr={document.frbr} type={document.type} />
			<AknDocument {document} {manifest} />
		</div>
	{:else if viewMode === 'raw'}
		<RawXmlView xml={document.rawXml} />
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			<div class="card-layout p-6 overflow-auto">
				<AknMeta frbr={document.frbr} type={document.type} />
				<AknDocument {document} {manifest} />
			</div>
			<div class="overflow-auto">
				<RawXmlView xml={document.rawXml} />
			</div>
		</div>
	{/if}
</div>
