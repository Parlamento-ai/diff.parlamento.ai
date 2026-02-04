<script lang="ts">
	import type { PageData } from './$types';
	import ParliamentLayout from '$lib/components/parliament/ParliamentLayout.svelte';
	import ProjectHeader from '$lib/components/parliament/detail/ProjectHeader.svelte';
	import ProjectTimeline from '$lib/components/parliament/detail/ProjectTimeline.svelte';
	import RelatedDocuments from '$lib/components/parliament/detail/RelatedDocuments.svelte';

	let { data }: { data: PageData } = $props();

	const parliamentId = data.meta.id;
</script>

<ParliamentLayout meta={data.meta}>
	<div class="mb-4">
		<a href="/fake/{parliamentId}" class="text-sm text-gray-500 hover:text-gray-700 transition-colors">
			&larr; Back to home
		</a>
	</div>

	<ProjectHeader entry={data.entry} frbr={data.bill.frbr} chambers={data.meta.chambers} />

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
		<div class="lg:col-span-2">
			<ProjectTimeline timeline={data.timeline} {parliamentId} chambers={data.meta.chambers} />
		</div>
		<div>
			<RelatedDocuments relatedDocs={data.relatedDocs} {parliamentId} chambers={data.meta.chambers} />
		</div>
	</div>
</ParliamentLayout>
