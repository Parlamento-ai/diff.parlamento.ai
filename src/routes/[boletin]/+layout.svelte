<script lang="ts">
	import Timeline from '$lib/components/timeline/Timeline.svelte';
	import { page } from '$app/state';

	let { data, children } = $props();

	const activeSlug = $derived(page.params.version || 'original');
</script>

<div class="max-w-7xl mx-auto px-4 py-4">
	<!-- Breadcrumbs -->
	<nav class="text-xs text-gray-400 mb-4 flex items-center gap-1">
		<a href="/" class="hover:text-gray-600 transition-colors">Inicio</a>
		<span>/</span>
		<span class="text-gray-700 font-medium">{data.boletin.title}</span>
	</nav>

	<!-- 3-column layout -->
	<div class="flex gap-4">
		<!-- Timeline sidebar -->
		<aside class="hidden lg:block w-60 shrink-0">
			<div class="sticky top-20 bg-white rounded-xl border border-gray-200 p-3">
				<Timeline
					entries={data.boletin.timeline}
					{activeSlug}
					boletinSlug={data.boletin.slug}
				/>
			</div>
		</aside>

		<!-- Mobile timeline -->
		<div class="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 z-10 overflow-x-auto">
			<div class="flex gap-2 px-2">
				{#each data.boletin.timeline as entry (entry.slug)}
					{@const colors = { act: 'bg-emerald-500', bill: 'bg-blue-500', amendment: 'bg-amber-500' }}
					<a
						href="/{data.boletin.slug}/{entry.slug}"
						class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors
							{activeSlug === entry.slug ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'}"
					>
						<span class="w-2 h-2 rounded-full {colors[entry.type]}"></span>
						{entry.label}
					</a>
				{/each}
			</div>
		</div>

		<!-- Main content area -->
		<div class="flex-1 min-w-0 pb-16 lg:pb-0">
			{@render children()}
		</div>
	</div>
</div>
