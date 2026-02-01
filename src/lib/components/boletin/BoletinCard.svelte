<script lang="ts">
	let {
		slug,
		title,
		documentCount
	}: {
		slug: string;
		title: string;
		documentCount: number;
	} = $props();
</script>

<a
	href="/{slug}/original"
	class="block p-6 bg-white rounded-xl border border-gray-200 shadow-sm
		hover:shadow-md hover:border-gray-300 transition-all group"
>
	<h2 class="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
		{title}
	</h2>
	<p class="text-sm text-gray-500 mt-2">
		{documentCount} documentos en la historia legislativa
	</p>
	<div class="mt-4 flex items-center text-xs text-emerald-600 font-medium">
		Ver historia
		<svg class="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
		</svg>
	</div>
</a>
