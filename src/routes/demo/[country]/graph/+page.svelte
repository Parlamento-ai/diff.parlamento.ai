<script lang="ts">
	import Graph from './Graph.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.country.toUpperCase()} / Graph — research demo</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 pt-6">
	<header class="mb-4">
		<div class="font-mono text-xs tracking-wider text-gray-500 uppercase">
			{data.country} / graph
		</div>
		<h1 class="mt-1 text-xl font-bold">Graph</h1>
		<p class="mt-1 text-xs text-gray-500">
			{data.nodes.length} document{data.nodes.length === 1 ? '' : 's'} ·
			{data.edges.length} link{data.edges.length === 1 ? '' : 's'}
		</p>
	</header>
</div>

{#if data.nodes.length === 0}
	<div class="mx-auto max-w-6xl px-4">
		<div
			class="rounded border border-dashed border-gray-300 bg-white px-6 py-16 text-center"
		>
			<p class="text-sm font-medium text-gray-700">No documents in {data.meta.name} yet.</p>
		</div>
	</div>
{:else}
	<div class="h-[calc(100vh-12rem)] w-full">
		<Graph nodes={data.nodes} edges={data.edges} country={data.country} />
	</div>
{/if}
