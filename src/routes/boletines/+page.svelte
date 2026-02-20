<script lang="ts">
	import BoletinCard from '$lib/components/boletin/BoletinCard.svelte';
	import FlagAr from '~icons/circle-flags/ar';
	import FlagBr from '~icons/circle-flags/br';
	import FlagCl from '~icons/circle-flags/cl';
	import FlagEs from '~icons/circle-flags/es';
	import FlagFr from '~icons/circle-flags/fr';
	import type { Component } from 'svelte';

	let { data } = $props();

	const flagMap: Record<string, Component> = {
		'empanadas-de-pino': FlagCl,
		'feijoada-carioca': FlagBr,
		'milanesa-argentina': FlagAr,
		'pan-de-campo': FlagCl,
		'paella-valenciana': FlagEs,
		'ratatouille-nicoise': FlagFr
	};

	const emojiMap: Record<string, string> = {
		'empanadas-de-pino': '🥟',
		'feijoada-carioca': '🫘',
		'milanesa-argentina': '🥩',
		'pan-de-campo': '🍞',
		'paella-valenciana': '🥘',
		'ratatouille-nicoise': '🍆'
	};

	const recetaOrder = [
		'paella-valenciana',
		'ratatouille-nicoise',
		'feijoada-carioca',
		'milanesa-argentina',
		'empanadas-de-pino',
		'pan-de-campo'
	];

	const recetaBoletines = $derived(
		data.boletines
			.filter((b) => recetaOrder.includes(b.slug))
			.sort((a, b) => recetaOrder.indexOf(a.slug) - recetaOrder.indexOf(b.slug))
	);
</script>

<main class="max-w-4xl mx-auto px-4 py-12">
	<!-- Breadcrumbs -->
	<nav class="text-xs font-mono text-gray-400 mb-6 flex items-center gap-1.5">
		<a href="/" class="hover:text-gray-600 transition-colors">Inicio</a>
		<svg class="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
		</svg>
		<span class="text-gray-700 font-medium">Boletines</span>
	</nav>

	<div class="text-center mb-12">
		<h1 class="text-3xl font-bold text-gray-900">AKN Diff</h1>
		<p class="text-gray-500 mt-3 text-sm max-w-lg mx-auto leading-relaxed">
			Visualización de cambios legislativos usando el estándar Akoma Ntoso 3.0
			con votaciones nominales y diff artículo por artículo.
		</p>
	</div>

	<!-- Ejemplos ficticios -->
	<section class="mb-14">
		<div class="mb-5 max-w-lg mx-auto">
			<h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
				<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">E</span>
				Recetas controversiales
			</h2>
			<p class="text-xs text-gray-400 mt-1.5 leading-relaxed">
				Para ejemplificar el formato sin la verbosidad de una ley real, convertimos recetas polémicas
				de cada país en proyectos de ley ficticios — con indicaciones, votaciones y todo el trámite legislativo.
			</p>
		</div>
		<div class="flex flex-col gap-4 max-w-lg mx-auto">
			{#each recetaBoletines as boletin (boletin.slug)}
				<BoletinCard
					slug={boletin.slug}
					title={boletin.title}
					documentCount={boletin.documentCount}
					flag={flagMap[boletin.slug]}
					emoji={emojiMap[boletin.slug]}
				/>
			{/each}
		</div>
	</section>

	<!-- Link a en desarrollo -->
	<div class="max-w-lg mx-auto">
		<a
			href="/boletines/dev"
			class="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			En desarrollo
			<span class="text-xs text-gray-300">— legislación real chilena</span>
		</a>
	</div>
</main>
