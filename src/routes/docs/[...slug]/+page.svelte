<script lang="ts">
	import 'highlight.js/styles/github-dark.min.css';
	import ExplorerIndex from '$lib/components/explorer/ExplorerIndex.svelte';
	import ExplorerDocViewer from '$lib/components/explorer/ExplorerDocViewer.svelte';
	import SchemaPhilosophy from '$lib/components/akndb/SchemaPhilosophy.svelte';
	import DocumentTypes from '$lib/components/akndb/DocumentTypes.svelte';
	import SchemaTypePage from '$lib/components/akn-schema/SchemaTypePage.svelte';

	let { data } = $props();
</script>

{#if data.mode === 'explorer-index'}
	<ExplorerIndex documents={data.documents} />
{:else if data.mode === 'explorer-doc'}
	<ExplorerDocViewer
		document={data.document}
		uri={data.uri}
		title={data.title}
		manifest={data.manifest}
	/>
{:else if data.mode === 'akndb-overview'}
	<SchemaPhilosophy
		byCountry={data.byCountry}
		total={data.total}
		targetCountries={data.targetCountries}
	/>
{:else if data.mode === 'akndb-document-types'}
	<DocumentTypes />
{:else if data.mode === 'schema-type'}
	<SchemaTypePage
		schema={data.schema}
		typeName={data.typeName}
		termDef={data.termDef}
		exampleHtml={data.exampleHtml}
		exampleCaption={data.exampleCaption}
		exampleSourceUrl={data.exampleSourceUrl}
	/>
{:else}
	<article class="prose prose-gray max-w-none prose-headings:font-heading prose-code:font-mono prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-sm prose-code:before:content-[''] prose-code:after:content-[''] prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:border prose-pre:border-gray-800 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit prose-table:text-sm prose-th:bg-gray-50 prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 prose-a:text-addition-800 prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-addition-500">
		{@html data.html}
	</article>
{/if}
