<script lang="ts">
	import { page } from '$app/stores';
	import type { ParliamentMeta } from '$lib/types/parliament';
	import type { Snippet } from 'svelte';
	import HomeIcon from '~icons/lucide/home';
	import LayoutDashboardIcon from '~icons/lucide/layout-dashboard';
	import FileTextIcon from '~icons/lucide/file-text';
	import CalendarIcon from '~icons/lucide/calendar';
	import MessageCircleQuestionIcon from '~icons/lucide/message-circle-question';
	import ScaleIcon from '~icons/lucide/scale';

	let {
		meta,
		children
	}: {
		meta: ParliamentMeta;
		children: Snippet;
	} = $props();

	const basePath = $derived(`/fake/${meta.id}`);
	const currentPath = $derived($page.url.pathname);

	const navItems = $derived([
		{ href: basePath, label: 'Inicio', icon: LayoutDashboardIcon, exact: true },
		{ href: `${basePath}/boletines`, label: 'Boletines', icon: FileTextIcon },
		{ href: `${basePath}/citaciones`, label: 'Citaciones', icon: CalendarIcon },
		{ href: `${basePath}/preguntas`, label: 'Preguntas', icon: MessageCircleQuestionIcon },
		{ href: `${basePath}/leyes`, label: 'Leyes Publicadas', icon: ScaleIcon }
	]);

	function isActive(href: string, exact: boolean = false): boolean {
		if (exact) return currentPath === href;
		return currentPath.startsWith(href);
	}
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white border-b border-gray-200 sticky top-0 z-10">
		<div class="max-w-6xl mx-auto px-4 py-4">
			<div class="flex items-center justify-between">
				<div>
					<a
						href="/"
						class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors mb-1"
					>
						<HomeIcon class="w-3 h-3" />
						Volver a Diff
					</a>
					<h1 class="text-xl font-heading font-bold text-gray-900">{meta.name}</h1>
				</div>
			</div>

			<!-- Section navigation -->
			<nav class="flex gap-1 mt-4 -mb-4 overflow-x-auto">
				{#each navItems as item}
					<a
						href={item.href}
						class="flex items-center gap-1.5 text-sm px-3 py-2 font-medium transition-colors whitespace-nowrap border-b-2 {isActive(item.href, item.exact)
							? 'border-gray-900 text-gray-900'
							: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					>
						<item.icon class="w-4 h-4" />
						{item.label}
					</a>
				{/each}
			</nav>
		</div>
	</header>

	<!-- Content -->
	<main class="max-w-6xl mx-auto px-4 py-8">
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="border-t border-gray-200 mt-16 py-8 px-4">
		<div class="max-w-6xl mx-auto text-center text-sm text-gray-400">
			<p>Portal Parlamentario de Prueba &mdash; basado en primitivas AKN (Akoma Ntoso)</p>
			<p class="mt-1">Desarrollado por <a href="/" class="text-gray-600 underline underline-offset-2 hover:text-gray-900 transition-colors">Diff by Parlamento.ai</a></p>
		</div>
	</footer>
</div>
