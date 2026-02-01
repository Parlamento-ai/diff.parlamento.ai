<script lang="ts">
	import LawView from '$lib/components/law/LawView.svelte';
	import DiffView from '$lib/components/diff/DiffView.svelte';

	let { data } = $props();

	const changedSet = $derived(new Set(data.changedArticleIds));
	const hasDiffs = $derived(data.diffs.length > 0);
	const hasAccumulatedDiffs = $derived(Object.keys(data.accumulatedDiffs).length > 0);

	type ViewMode = 'diff' | 'result' | 'plain';
	let viewMode: ViewMode = $state('diff');

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
		<div class="flex items-center gap-2 mb-4 pb-3">
			<span class="text-xs px-2 py-0.5 rounded {versionColor}">{data.versionLabel}</span>
			<span class="text-xs text-gray-400">{data.versionDate}</span>
			{#if data.versionAuthor}
				<span class="text-xs text-gray-400">— {data.versionAuthor}</span>
			{/if}
			{#if hasAccumulatedDiffs}
				<div class="ml-auto flex rounded-md border border-gray-200 overflow-hidden text-xs">
					{#each [
						{ mode: 'diff', label: 'Cambios' },
						{ mode: 'result', label: 'Resultado' },
						{ mode: 'plain', label: 'Ley' }
					] as { mode, label }}
						<button
							onclick={() => viewMode = mode}
							class="px-2.5 py-1 transition-colors
								{viewMode === mode
									? mode === 'diff' ? 'bg-amber-50 text-amber-700' : mode === 'result' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'
									: 'text-gray-400 hover:bg-gray-50'}"
						>
							{label}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<LawView
			law={data.law}
			changedArticleIds={viewMode === 'plain' ? new Set() : changedSet}
			accumulatedDiffs={viewMode === 'plain' ? {} : data.accumulatedDiffs}
			cleanView={viewMode === 'result'}
		/>
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
