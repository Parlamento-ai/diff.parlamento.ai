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
		'ratatouille-nicoise': FlagFr,
		'ley-21735-boletin': FlagCl,
		'ley-21735-dl-3500': FlagCl,
		'ley-21735-dfl-5-2003': FlagCl,
		'ley-21735-ley-18045': FlagCl,
		'ley-21735-dfl-28': FlagCl,
		'ley-21735-ley-20880': FlagCl,
		'ley-18045-historia': FlagCl,
		'ley-21670-boletin': FlagCl
	};

	const emojiMap: Record<string, string> = {
		'empanadas-de-pino': '🥟',
		'feijoada-carioca': '🫘',
		'milanesa-argentina': '🥩',
		'pan-de-campo': '🍞',
		'paella-valenciana': '🥘',
		'ratatouille-nicoise': '🍆'
	};

	const normOrder = [
		'ley-21735-dl-3500',
		'ley-21735-dfl-5-2003',
		'ley-21735-ley-18045',
		'ley-21735-dfl-28',
		'ley-21735-ley-20880'
	];

	const normChanges: Record<string, number> = {
		'ley-21735-dl-3500': 18,
		'ley-21735-dfl-5-2003': 2,
		'ley-21735-ley-18045': 1,
		'ley-21735-dfl-28': 2,
		'ley-21735-ley-20880': 1
	};

	const recetaOrder = [
		'paella-valenciana',
		'ratatouille-nicoise',
		'feijoada-carioca',
		'milanesa-argentina',
		'empanadas-de-pino',
		'pan-de-campo'
	];

	const leyBoletin = $derived(data.boletines.find((b) => b.slug === 'ley-21735-boletin'));

	const leyNormas = $derived(
		data.boletines
			.filter((b) => normOrder.includes(b.slug))
			.sort((a, b) => normOrder.indexOf(a.slug) - normOrder.indexOf(b.slug))
	);

	const ley18045 = $derived(data.boletines.find((b) => b.slug === 'ley-18045-historia'));

	const ley21670 = $derived(data.boletines.find((b) => b.slug === 'ley-21670-boletin'));

	const recetaBoletines = $derived(
		data.boletines
			.filter((b) => !b.slug.startsWith('ley-21735-') && b.slug !== 'ley-18045-historia' && b.slug !== 'ley-21670-boletin')
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

	<!-- Legislación real chilena -->
	<section class="mb-14">
		<div class="mb-5 max-w-lg mx-auto">
			<h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
				<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">L</span>
				Ley 21.735 — Reforma de Pensiones
			</h2>
			<p class="text-xs text-gray-400 mt-1.5 leading-relaxed">
				Boletín 15.480-13. Tramitación completa del proyecto de ley
				y su impacto en las 5 normas modificadas, con votación nominal del Senado (40-7).
			</p>
		</div>

		<div class="max-w-lg mx-auto">
			<!-- Proyecto de ley (entrada principal) -->
			{#if leyBoletin}
				<BoletinCard
					slug={leyBoletin.slug}
					title={leyBoletin.title}
					documentCount={leyBoletin.documentCount}
					flag={flagMap[leyBoletin.slug]}
				/>
			{/if}

			<!-- Normas modificadas -->
			{#if leyNormas.length > 0}
				<div class="mt-3 pl-4 border-l-2 border-gray-200">
					<p class="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Normas modificadas</p>
					<div class="flex flex-col gap-1">
						{#each leyNormas as norma (norma.slug)}
							{@const NormaFlag = flagMap[norma.slug]}
							<a
								href="/{norma.slug}/original"
								class="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
							>
								<span class="flex items-center gap-2 text-sm text-gray-700 group-hover:text-gray-900">
									<NormaFlag class="w-4 h-4 shrink-0" />
									{norma.title}
								</span>
								<span class="text-xs text-gray-400 tabular-nums">
									{normChanges[norma.slug]} {normChanges[norma.slug] === 1 ? 'cambio' : 'cambios'}
								</span>
							</a>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</section>

	<!-- Ley 18.045 — Historia de versiones -->
	{#if ley18045}
		<section class="mb-14">
			<div class="mb-5 max-w-lg mx-auto">
				<h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
					<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">H</span>
					Ley 18.045 — Ley de Mercado de Valores
				</h2>
				<p class="text-xs text-gray-400 mt-1.5 leading-relaxed">
					Historia completa de versiones desde 1981 hasta 2025.
					32 versiones históricas con 431 cambios a nivel de artículo,
					incluyendo las reformas MK1, MK2 y MK3 al mercado de capitales.
				</p>
			</div>

			<div class="max-w-lg mx-auto">
				<BoletinCard
					slug={ley18045.slug}
					title={ley18045.title}
					documentCount={ley18045.documentCount}
					flag={flagMap[ley18045.slug]}
				/>
			</div>
		</section>
	{/if}

	<!-- Ley 21.670 — Boletín completo -->
	{#if ley21670}
		<section class="mb-14">
			<div class="mb-5 max-w-lg mx-auto">
				<h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
					<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold">B</span>
					Ley 21.670 — Porte de Armas Aspirantes Policiales
				</h2>
				<p class="text-xs text-gray-400 mt-1.5 leading-relaxed">
					Boletín 15.995-02. Primer boletín real con tramitación legislativa completa:
					moción, 1er trámite (Cámara), 2do trámite (Senado con modificaciones),
					3er trámite y ley publicada. Votación nominal 31-0-2.
				</p>
			</div>

			<div class="max-w-lg mx-auto">
				<BoletinCard
					slug={ley21670.slug}
					title={ley21670.title}
					documentCount={ley21670.documentCount}
					flag={flagMap[ley21670.slug]}
				/>
			</div>
		</section>
	{/if}

	<!-- Ejemplos ficticios -->
	<section>
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
</main>
