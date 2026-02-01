<script lang="ts">
	import { slide } from 'svelte/transition';
	import LawView from '$lib/components/law/LawView.svelte';
	import DiffView from '$lib/components/diff/DiffView.svelte';
	import { dur } from '$lib/utils/reduced-motion';

	let { data } = $props();

	const changedSet = $derived(new Set(data.changedArticleIds));
	const hasDiffs = $derived(data.diffs.length > 0);
	const hasAccumulatedDiffs = $derived(Object.keys(data.accumulatedDiffs).length > 0);

	type ViewMode = 'diff' | 'result' | 'plain';
	let viewMode: ViewMode = $state('diff');

	const versionColorMap: Record<string, string> = {
		act: 'bg-addition-50 text-addition-800',
		bill: 'bg-blue-50 text-blue-800',
		amendment: 'bg-amber-50 text-amber-800'
	};
	const versionColor = $derived(versionColorMap[data.versionType] || '');

	const voteResultLabel: Record<string, string> = {
		approved: 'Aprobado',
		rejected: 'Rechazado',
		withdrawn: 'Retirado',
		inadmissible: 'Inadmisible',
		pending: 'Pendiente'
	};
	const voteResultColor: Record<string, string> = {
		approved: 'text-addition-800',
		rejected: 'text-deletion-800',
		withdrawn: 'text-gray-500',
		inadmissible: 'text-gray-500',
		pending: 'text-amber-600'
	};

	const rejectedResults = new Set(['rejected', 'withdrawn', 'inadmissible']);
	const highlightColor = $derived<'amber' | 'green' | 'red'>(
		data.vote
			? rejectedResults.has(data.vote.result) ? 'red' : 'green'
			: 'amber'
	);
</script>

<div class="flex gap-4">
	<!-- Law content -->
	<div class="flex-1 min-w-0 card-layout p-4 sm:p-6">
		<!-- Version badge -->
		<div class="mb-4 pb-3 space-y-2">
			<div class="flex items-center gap-2 flex-wrap">
				<span class="badge {versionColor}">{data.versionLabel}</span>
				<span class="text-xs text-gray-400 font-mono">{data.versionDate}</span>
				{#if data.versionAuthor}
					<span class="text-xs text-gray-400">— {data.versionAuthor}</span>
				{/if}
				{#if data.vote}
					<span class="badge {data.vote.result === 'approved' ? 'bg-addition-100' : 'bg-deletion-100'} {voteResultColor[data.vote.result] || 'text-gray-500'}">
						{data.vote.result === 'approved' ? '\u2713' : '\u2717'}
						{voteResultLabel[data.vote.result] || data.vote.result}
						{data.vote.for.length}-{data.vote.against.length}-{data.vote.abstain.length}
					</span>
				{/if}
			</div>
			{#if hasAccumulatedDiffs}
				<div class="flex">
					<div class="flex border border-gray-200 rounded-md overflow-hidden text-xs">
						{#each [
							{ mode: 'diff' as ViewMode, label: 'Cambios', activeClass: 'bg-amber-50 text-amber-700' },
							{ mode: 'result' as ViewMode, label: 'Resultado', activeClass: 'bg-blue-50 text-blue-700' },
							{ mode: 'plain' as ViewMode, label: 'Ley', activeClass: 'bg-gray-100 text-gray-700' }
						] as { mode, label, activeClass }}
							<button
								onclick={() => viewMode = mode}
								class="px-3 py-1.5 font-medium transition-colors
									{viewMode === mode
										? activeClass
										: 'text-gray-400 hover:bg-gray-50'}"
							>
								{label}
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<LawView
			law={data.law}
			changedArticleIds={viewMode === 'plain' ? new Set() : changedSet}
			accumulatedDiffs={viewMode === 'plain' ? {} : data.accumulatedDiffs}
			cleanView={viewMode === 'result'}
			{highlightColor}
		/>
	</div>

	<!-- Diff panel (desktop) -->
	{#if hasDiffs}
		<aside class="hidden lg:block w-[360px] shrink-0" transition:slide={{ axis: 'x', duration: dur(300) }}>
			<div class="sticky top-20 card-layout max-h-[calc(100vh-6rem)] overflow-y-auto">
				<DiffView diffs={data.diffs} vote={data.vote} />
			</div>
		</aside>
	{/if}
</div>

<!-- Diff panel (mobile) -->
{#if hasDiffs}
	<div class="lg:hidden mt-4 card-layout" transition:slide={{ duration: dur(300) }}>
		<DiffView diffs={data.diffs} vote={data.vote} collapsed={true} />
	</div>
{/if}
