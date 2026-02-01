<script lang="ts">
	import BoletinCard from '$lib/components/boletin/BoletinCard.svelte';
	import FlagBr from '~icons/circle-flags/br';
	import FlagCl from '~icons/circle-flags/cl';
	import FlagEs from '~icons/circle-flags/es';
	import FlagFr from '~icons/circle-flags/fr';
	import type { Component } from 'svelte';

	let { data } = $props();

	const flagMap: Record<string, Component> = {
		'empanadas-de-pino': FlagCl,
		'feijoada-carioca': FlagBr,
		'pan-de-campo': FlagCl,
		'paella-valenciana': FlagEs,
		'ratatouille-nicoise': FlagFr
	};

	const emojiMap: Record<string, string> = {
		'empanadas-de-pino': '🥟',
		'feijoada-carioca': '🫘',
		'pan-de-campo': '🍞',
		'paella-valenciana': '🥘',
		'ratatouille-nicoise': '🍆'
	};

	const order = ['paella-valenciana', 'ratatouille-nicoise', 'feijoada-carioca', 'empanadas-de-pino', 'pan-de-campo'];
	const sorted = $derived(
		[...data.boletines].sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug))
	);
</script>

<main class="max-w-4xl mx-auto px-4 py-12">
	<!-- Breadcrumbs -->
	<nav class="text-xs font-mono text-gray-400 mb-6 flex items-center gap-1.5">
		<a href="/" class="hover:text-gray-600 transition-colors">Inicio</a>
		<svg class="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
		</svg>
		<span class="text-gray-700 font-medium">Ejemplos</span>
	</nav>

	<div class="text-center mb-10">
		<h1 class="text-3xl font-bold text-gray-900">Recetas controversiales</h1>
		<p class="text-gray-500 mt-3 text-sm max-w-lg mx-auto leading-relaxed">
			Para ejemplificar el formato sin la verbosidad de una ley real, convertimos recetas polemicas de cada pais en proyectos de ley ficticios — con indicaciones, votaciones y todo el tramite legislativo.
		</p>
	</div>

	<div class="flex flex-col gap-4 max-w-lg mx-auto">
		{#each sorted as boletin (boletin.slug)}
			<BoletinCard
				slug={boletin.slug}
				title={boletin.title}
				documentCount={boletin.documentCount}
				flag={flagMap[boletin.slug]}
				emoji={emojiMap[boletin.slug]}
			/>
		{/each}
	</div>
</main>
