<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>{data.country.toUpperCase()} — research demo</title>
</svelte:head>

<div class="mx-auto max-w-4xl p-8">
	<h1 class="text-xl font-bold">{data.meta?.name ?? data.country}</h1>
	<p class="mt-2 text-gray-500">No documents loaded for this country yet.</p>
</div>
