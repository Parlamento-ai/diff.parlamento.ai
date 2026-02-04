<script lang="ts">
	import type { ExplorerDocType } from '$lib/types/explorer';

	let { type }: { type: ExplorerDocType } = $props();

	const TYPE_COLORS: Record<string, string> = {
		act: 'text-emerald-700 bg-emerald-50 border-emerald-200',
		bill: 'text-blue-700 bg-blue-50 border-blue-200',
		amendment: 'text-amber-700 bg-amber-50 border-amber-200',
		debate: 'text-purple-700 bg-purple-50 border-purple-200',
		judgment: 'text-red-700 bg-red-50 border-red-200',
		officialGazette: 'text-gray-700 bg-gray-50 border-gray-200',
		citation: 'text-teal-700 bg-teal-50 border-teal-200',
		question: 'text-orange-700 bg-orange-50 border-orange-200',
		communication: 'text-violet-700 bg-violet-50 border-violet-200',
		doc: 'text-stone-700 bg-stone-50 border-stone-200',
		documentCollection: 'text-cyan-700 bg-cyan-50 border-cyan-200'
	};
</script>

<span class="text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-full border font-medium {TYPE_COLORS[type] || 'text-gray-700 bg-gray-50 border-gray-200'}">
	{type}
</span>
