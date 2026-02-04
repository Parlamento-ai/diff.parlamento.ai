<script lang="ts">
	import type { PageData } from './$types';
	import ParliamentLayout from '$lib/components/parliament/ParliamentLayout.svelte';
	import ExplorerDocViewer from '$lib/components/explorer/ExplorerDocViewer.svelte';

	let { data }: { data: PageData } = $props();

	const parliamentId = data.meta.id;
	const linkBase = `/fake/${parliamentId}/documento`;
</script>

<ParliamentLayout meta={data.meta}>
	<div class="mb-4">
		<a href="/fake/{parliamentId}" class="text-sm text-gray-500 hover:text-gray-700 transition-colors">
			&larr; Back to home
		</a>
	</div>

	<ExplorerDocViewer
		document={data.document}
		uri={data.uri}
		title={data.title}
		manifest={data.manifest}
		{linkBase}
	/>
</ParliamentLayout>
