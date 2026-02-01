<script lang="ts">
	import LawView from '$lib/components/law/LawView.svelte';
	import DiffView from '$lib/components/diff/DiffView.svelte';

	let { data } = $props();

	const changedSet = $derived(new Set(data.changedArticleIds));
	const hasDiffs = $derived(data.diffs.length > 0);

	const versionColorMap: Record<string, string> = {
		act: 'bg-emerald-100 text-emerald-800',
		bill: 'bg-blue-100 text-blue-800',
		amendment: 'bg-amber-100 text-amber-800'
	};
	const versionColor = $derived(versionColorMap[data.versionType] || '');
</script>

<div class="flex gap-4">
	<!-- Law content -->
	<div class="flex-1 min-w-0 bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
		<!-- Version badge -->
		<div class="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
			<span class="text-xs px-2 py-0.5 rounded {versionColor}">{data.versionLabel}</span>
			<span class="text-xs text-gray-400">{data.versionDate}</span>
			{#if data.versionAuthor}
				<span class="text-xs text-gray-400">— {data.versionAuthor}</span>
			{/if}
		</div>

		<LawView law={data.law} changedArticleIds={changedSet} />
	</div>

	<!-- Diff panel (desktop) -->
	{#if hasDiffs}
		<aside class="hidden lg:block w-[360px] shrink-0">
			<div class="sticky top-20 bg-white rounded-xl border border-gray-200 max-h-[calc(100vh-6rem)] overflow-y-auto">
				<DiffView diffs={data.diffs} />
			</div>
		</aside>
	{/if}
</div>

<!-- Diff panel (mobile) -->
{#if hasDiffs}
	<div class="lg:hidden mt-4 bg-white rounded-xl border border-gray-200">
		<DiffView diffs={data.diffs} collapsed={true} />
	</div>
{/if}
