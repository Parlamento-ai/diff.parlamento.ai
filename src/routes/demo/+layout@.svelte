<script lang="ts">
	import '../layout.css';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { MetaTags } from 'svelte-meta-tags';
	import LayoutDashboardIcon from '~icons/lucide/layout-dashboard';
	import FileTextIcon from '~icons/lucide/file-text';
	import CalendarIcon from '~icons/lucide/calendar';
	import MessageCircleQuestionIcon from '~icons/lucide/message-circle-question';
	import ScaleIcon from '~icons/lucide/scale';
	import { TAB_GROUPS, tabGroupForType, type TabGroupId } from './tab-groups';
	import { isEntityType } from './entity-types';

	let { data, children } = $props();

	const country = $derived($page.params.country as string | undefined);
	const type = $derived($page.params.type as string | undefined);
	const groupParam = $derived($page.params.group as string | undefined);
	const path = $derived($page.url.pathname);

	const activeCountry = $derived(
		country ? data.countries.find((c) => c.code === country) : undefined
	);

	const title = $derived(
		activeCountry ? `${activeCountry.name} AKN++ Viewer` : 'AKN++ Viewer'
	);

	const activeGroup = $derived<TabGroupId | null>(
		!country
			? null
			: groupParam
				? (groupParam as TabGroupId)
				: type && isEntityType(type)
					? tabGroupForType(type)
					: path === `/demo/${country}`
						? 'home'
						: null
	);

	const tabIcons: Record<TabGroupId, typeof LayoutDashboardIcon> = {
		home: LayoutDashboardIcon,
		bills: FileTextIcon,
		sessions: CalendarIcon,
		questions: MessageCircleQuestionIcon,
		acts: ScaleIcon
	};

	function tabHref(g: TabGroupId): string {
		if (!country) return '/demo';
		if (g === 'home') return `/demo/${country}`;
		return `/demo/${country}/g/${g}`;
	}

	function switchCountry(nextCode: string) {
		if (!nextCode) return;
		if (activeGroup && activeGroup !== 'home') {
			goto(`/demo/${nextCode}/g/${activeGroup}`);
			return;
		}
		goto(`/demo/${nextCode}`);
	}
</script>

<MetaTags {title} titleTemplate="%s | Diff research" />

<div class="min-h-screen bg-gray-50 font-sans text-sm text-gray-900">
	<header class="sticky top-0 z-10 border-b border-gray-200 bg-white">
		<nav class="bg-white">
			<div class="mx-auto flex max-w-6xl items-center gap-3 overflow-x-auto px-4">
				{#if data.countries.length}
					<div class="flex items-center gap-1.5 py-1.5">
						<span class="text-sm font-bold tracking-tight text-gray-900">
							{activeCountry ? activeCountry.name : 'Pick org'}
						</span>
						<span class="org-trigger relative inline-block h-5 w-5">
							<span
								class="pointer-events-none absolute inset-0 inline-flex items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors group-hover:bg-gray-200"
							>
								<svg
									class="h-3 w-3"
									viewBox="0 0 12 12"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"
								>
									<path d="M3 4.5 6 7.5 9 4.5" />
								</svg>
							</span>
							<select
								class="org-select absolute inset-0 h-full w-full cursor-pointer opacity-0"
								value={country ?? ''}
								onchange={(e) =>
									switchCountry((e.currentTarget as HTMLSelectElement).value)}
								aria-label="Switch organization"
							>
								{#if !country}
									<option value="" disabled>— pick org —</option>
								{/if}
								{#each data.countries as c (c.code)}
									<option value={c.code}>{c.name}</option>
								{/each}
							</select>
						</span>
					</div>
				{/if}

				{#if country}
					<div class="flex gap-1">
						{#each TAB_GROUPS as g (g.id)}
							{@const Icon = tabIcons[g.id]}
							{@const active = activeGroup === g.id}
							<a
								href={tabHref(g.id)}
								class="-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors {active
									? 'border-gray-900 text-gray-900'
									: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
							>
								<Icon class="h-4 w-4" />
								{g.label}
							</a>
						{/each}
					</div>
				{/if}

				<a
					href="/"
					class="ml-auto shrink-0 text-xs text-gray-500 hover:text-gray-900 hover:underline"
				>
					main app →
				</a>
			</div>
		</nav>
	</header>

	{@render children()}
</div>

<svg class="hidden">
	<filter id="grain">
		<feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
		<feColorMatrix type="saturate" values="0" />
	</filter>
</svg>

<style>
	:global(.org-select) {
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
		background-image: none;
	}
	:global(.org-select::-ms-expand) {
		display: none;
	}
</style>
