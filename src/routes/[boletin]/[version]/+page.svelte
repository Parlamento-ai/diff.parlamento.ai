<script lang="ts">
	import { slide } from 'svelte/transition';
	import LawView from '$lib/components/law/LawView.svelte';
	import DiffView from '$lib/components/diff/DiffView.svelte';
	import { dur } from '$lib/utils/reduced-motion';

	let { data } = $props();

	const HEAVY_THRESHOLD = 30;
	const changedSet = $derived(new Set(data.changedArticleIds));
	const hasDiffs = $derived(data.diffs.length > 0);
	const hasAccumulatedDiffs = $derived(Object.keys(data.accumulatedDiffs).length > 0);
	const heavyMode = $derived(data.diffs.length > HEAVY_THRESHOLD);

	type ViewMode = 'diff' | 'result' | 'plain';
	let viewMode: ViewMode = $state('diff');

	// Reset to plain text on heavy pages to avoid rendering 50K+ word-diff spans
	$effect(() => {
		viewMode = heavyMode ? 'plain' : 'diff';
	});

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

	let showSources = $state(false);
	const hasSources = $derived(data.sources.length > 0);
	// Index into [AKN XML, ...source docs] — 0 = AKN XML, 1+ = source docs
	let activeSourceTab = $state(0);
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
						{data.vote.result === 'approved' ? '✓' : '✗'}
						{voteResultLabel[data.vote.result] || data.vote.result}
						{data.vote.forCount ?? data.vote.for.length}-{data.vote.againstCount ?? data.vote.against.length}-{data.vote.abstainCount ?? data.vote.abstain.length}
					</span>
				{/if}
				{#if data.sourceUrl}
					<a
						href={data.sourceUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="text-xs text-blue-500 hover:text-blue-700 hover:underline transition-colors"
					>
						{data.sourceLabel || 'Ver documento'}
					</a>
				{/if}
				<button
					onclick={() => { showSources = !showSources; activeSourceTab = 0; }}
					class="text-xs font-mono text-gray-400 hover:text-gray-600 transition-colors"
				>
					{showSources ? 'Ocultar' : 'Ver'} fuentes
					<span class="opacity-50">({hasSources ? data.sources.length + 1 : 1})</span>
				</button>
			</div>
			<div class="flex">
				<div class="flex border border-gray-200 rounded-md overflow-hidden text-xs">
					{#each [
						{ mode: 'diff' as ViewMode, label: 'Cambios', activeClass: 'bg-amber-50 text-amber-700' },
						{ mode: 'result' as ViewMode, label: 'Resultado', activeClass: 'bg-blue-50 text-blue-700' },
						{ mode: 'plain' as ViewMode, label: 'Ley', activeClass: 'bg-gray-100 text-gray-700' }
					] as { mode, label, activeClass }}
						<button
							onclick={() => viewMode = mode}
							disabled={!hasAccumulatedDiffs}
							class="px-3 py-1.5 font-medium transition-colors
								{!hasAccumulatedDiffs
									? 'text-gray-300 cursor-not-allowed'
									: viewMode === mode
										? activeClass
										: 'text-gray-400 hover:bg-gray-50'}"
						>
							{label}
						</button>
					{/each}
				</div>
			</div>
		</div>

		<LawView
			law={data.law}
			changedArticleIds={viewMode === 'plain' ? new Set() : changedSet}
			accumulatedDiffs={viewMode === 'plain' ? {} : data.accumulatedDiffs}
			cleanView={viewMode === 'result'}
			{highlightColor}
			{heavyMode}
		/>
	</div>

	<!-- Diff panel (desktop) -->
	<aside class="hidden lg:block w-[360px] shrink-0">
		<div class="sticky top-20 card-layout max-h-[calc(100vh-6rem)] overflow-y-auto">
			<DiffView diffs={data.diffs} vote={data.vote} />
		</div>
	</aside>
</div>

<!-- Diff panel (mobile) -->
{#if hasDiffs || data.vote}
	<div class="lg:hidden mt-4 card-layout" transition:slide={{ duration: dur(300) }}>
		<DiffView diffs={data.diffs} vote={data.vote} collapsed={true} />
	</div>
{/if}

<!-- Source documents viewer -->
{#if showSources}
	<div class="mt-4 card-layout overflow-hidden" transition:slide={{ duration: dur(200) }}>
		<!-- Tab bar -->
		<div class="flex items-center gap-0 px-2 bg-gray-50 border-b border-gray-200 overflow-x-auto">
			<button
				onclick={() => (activeSourceTab = 0)}
				class="shrink-0 px-3 py-2 text-xs font-mono transition-colors border-b-2 {activeSourceTab === 0
					? 'border-blue-500 text-blue-700'
					: 'border-transparent text-gray-400 hover:text-gray-600'}"
			>
				AKN XML
			</button>
			{#each data.sources as source, i}
				<button
					onclick={() => (activeSourceTab = i + 1)}
					class="shrink-0 px-3 py-2 text-xs font-mono transition-colors border-b-2 {activeSourceTab === i + 1
						? 'border-blue-500 text-blue-700'
						: 'border-transparent text-gray-400 hover:text-gray-600'}"
				>
					{source.label}
				</button>
			{/each}
			<span class="flex-1"></span>
			<button
				onclick={() => (showSources = false)}
				class="shrink-0 px-2 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
			>
				Cerrar
			</button>
		</div>

		<!-- Content area -->
		{#if activeSourceTab === 0}
			<div class="px-3 py-1.5 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
				<span class="text-[10px] font-mono text-gray-400">{data.sourceFileName}</span>
			</div>
			<pre class="p-4 text-xs font-mono text-gray-700 bg-gray-50 overflow-x-auto max-h-[70vh] overflow-y-auto leading-relaxed whitespace-pre-wrap break-all">{data.rawXml}</pre>
		{:else}
			{@const source = data.sources[activeSourceTab - 1]}
			<div class="px-3 py-1.5 bg-gray-100 border-b border-gray-200 flex items-center justify-between gap-2">
				<span class="text-[10px] font-mono text-gray-400 truncate">{source.path}</span>
				{#if source.url}
					<a
						href={source.url}
						target="_blank"
						rel="noopener noreferrer"
						class="shrink-0 text-[10px] font-mono text-blue-500 hover:text-blue-700 hover:underline"
					>
						Ver documento oficial
					</a>
				{/if}
			</div>
			{#if source.content}
				<pre class="p-4 text-xs font-mono text-gray-700 bg-gray-50 overflow-x-auto max-h-[70vh] overflow-y-auto leading-relaxed whitespace-pre-wrap break-all">{source.content}</pre>
			{:else if source.url}
				<div class="p-6 text-center">
					<a
						href={source.url}
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
						</svg>
						Abrir en {source.url.includes('leychile') ? 'LeyChile' : 'Senado'}
					</a>
					<p class="mt-2 text-[10px] font-mono text-gray-400">{source.path}</p>
				</div>
			{:else}
				<div class="p-4 text-xs text-gray-400 italic">
					Archivo {source.type === 'json' ? 'JSON' : source.type} — contenido no disponible inline
				</div>
			{/if}
		{/if}
	</div>
{/if}
