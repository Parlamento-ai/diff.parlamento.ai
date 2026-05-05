<script lang="ts">
	import { TAB_GROUPS } from './tab-groups';
	import FileTextIcon from '~icons/lucide/file-text';
	import CalendarIcon from '~icons/lucide/calendar';
	import MessageCircleQuestionIcon from '~icons/lucide/message-circle-question';
	import ScaleIcon from '~icons/lucide/scale';

	let { data } = $props();

	const groupIcons = {
		bills: FileTextIcon,
		sessions: CalendarIcon,
		questions: MessageCircleQuestionIcon,
		acts: ScaleIcon
	} as const;

	const visibleGroups = TAB_GROUPS.filter((g) => g.id !== 'home');
</script>

<svelte:head>
	<title>Research demo — diff-law</title>
</svelte:head>

<div class="mx-auto max-w-5xl p-8">
	<header class="mb-8 flex items-start justify-between gap-6">
		<div>
			<h1 class="mb-2 text-2xl font-bold">Research schema demo</h1>
			<p class="max-w-2xl text-gray-600">
				Reads from <code class="font-mono text-xs">research/schema/research.db</code> —
				rebuild with <code class="font-mono text-xs">npm run research:build</code>. Pick an
				organization to explore.
			</p>
		</div>
		<a
			href="/demo/notes"
			class="shrink-0 rounded border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-900"
		>
			research notes →
		</a>
	</header>

	{#if !data.countries.length}
		<p class="text-gray-500">No countries loaded yet. Run the build script.</p>
	{:else}
		<ul class="grid grid-cols-1 gap-4 lg:grid-cols-2">
			{#each data.countries as c (c.code)}
				{@const groupCounts = data.groupCountsByCountry[c.code] ?? {}}
				{@const total = Object.values(groupCounts).reduce((s, n) => s + n, 0)}
				<li class="rounded border border-gray-200 bg-white">
					<a
						href="/demo/{c.code}"
						class="flex items-baseline justify-between border-b border-gray-100 px-4 py-3 hover:bg-gray-50"
					>
						<div>
							<span class="font-mono text-xs tracking-wider text-gray-500 uppercase"
								>{c.code}</span
							>
							<span class="ml-3 text-base font-bold">{c.name}</span>
						</div>
						<span class="text-xs text-gray-400">
							{total} doc{total === 1 ? '' : 's'}
						</span>
					</a>
					<ul class="divide-y divide-gray-100">
						{#each visibleGroups as g (g.id)}
							{@const n = groupCounts[g.id] ?? 0}
							{@const Icon = groupIcons[g.id as keyof typeof groupIcons]}
							<li>
								<a
									href="/demo/{c.code}/g/{g.id}"
									class="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 {n ===
									0
										? 'opacity-50'
										: ''}"
								>
									<Icon class="h-4 w-4 text-gray-400" />
									<span class="text-gray-700">{g.label}</span>
									<span class="ml-auto font-mono text-xs text-gray-500">{n}</span>
								</a>
							</li>
						{/each}
					</ul>
				</li>
			{/each}
		</ul>
	{/if}
</div>
