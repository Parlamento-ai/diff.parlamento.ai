<script lang="ts">
	import { TAB_GROUPS } from '../tab-groups';
	import { ENTITY_TYPE_INFO } from '../entity-types';
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

	const visibleGroups = TAB_GROUPS.filter((g) => g.id !== 'home' && g.id !== 'graph');
	const counts = $derived(
		Object.fromEntries(
			(data.typesByCountry?.[data.country] ?? []).map(
				(t: { type: string; n: number }) => [t.type, t.n]
			)
		) as Record<string, number>
	);
	const groupCounts = $derived(data.groupCountsByCountry?.[data.country] ?? {});
	const total = $derived(
		Object.values(groupCounts).reduce((s: number, n) => s + (n as number), 0)
	);
</script>

<svelte:head>
	<title>{data.country.toUpperCase()} — research demo</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 pt-6 pb-8">
	<header class="mb-8">
		<div class="font-mono text-xs tracking-wider text-gray-500 uppercase">{data.country}</div>
		<h1 class="mt-1 text-2xl font-bold">{data.meta?.name ?? data.country}</h1>
		<p class="mt-2 text-xs text-gray-500">
			{total} document{total === 1 ? '' : 's'} across {visibleGroups.length} sections
		</p>
	</header>

	<ul class="grid grid-cols-1 gap-4 md:grid-cols-2">
		{#each visibleGroups as g (g.id)}
			{@const Icon = groupIcons[g.id as keyof typeof groupIcons]}
			{@const n = groupCounts[g.id] ?? 0}
			<li>
				<a
					href="/demo/{data.country}/g/{g.id}"
					class="block rounded border border-gray-200 bg-white p-4 transition-colors hover:border-gray-400 {n ===
					0
						? 'opacity-60'
						: ''}"
				>
					<div class="flex items-center gap-2">
						<Icon class="h-4 w-4 text-gray-500" />
						<span class="text-base font-bold">{g.label}</span>
						<span class="ml-auto font-mono text-xs text-gray-500">{n}</span>
					</div>
					<ul class="mt-3 flex flex-wrap gap-1">
						{#each g.types as t (t)}
							<span
								class="rounded bg-gray-100 px-2 py-0.5 font-mono text-[11px] text-gray-600"
							>
								{ENTITY_TYPE_INFO[t].label.toLowerCase()}
								<span class="text-gray-400">{counts[t] ?? 0}</span>
							</span>
						{/each}
					</ul>
				</a>
			</li>
		{/each}
	</ul>
</div>
