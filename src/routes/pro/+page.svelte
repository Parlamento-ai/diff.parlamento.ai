<script lang="ts">
	import BoletinCard from '$lib/components/pro/boletin/BoletinCard.svelte';
	import FlagCl from '~icons/circle-flags/cl';
	import FlagEu from '~icons/circle-flags/eu';
	import FlagUs from '~icons/circle-flags/us';
	import FlagEs from '~icons/circle-flags/es';
	import type { Component } from 'svelte';

	let { data } = $props();

	const flagMap: Record<string, Component> = {
		'ley-21735-boletin': FlagCl,
		'ley-21735-dl-3500': FlagCl,
		'ley-21735-dfl-5-2003': FlagCl,
		'ley-21735-ley-18045': FlagCl,
		'ley-21735-dfl-28': FlagCl,
		'ley-21735-ley-20880': FlagCl,
		'ley-18045-historia': FlagCl,
		'ley-21670-boletin': FlagCl,
		'ley-17370-boletin': FlagCl,
		'ley-21120-boletin': FlagCl,
		'eu-dma': FlagEu,
		'eu-dsa': FlagEu,
		'eu-ai-act': FlagEu,
		'eu-cra': FlagEu,
		'eu-data-act': FlagEu,
		'us-s5-laken-riley': FlagUs,
		'us-s269-improper-payments': FlagUs,
		'us-s331-halt-fentanyl': FlagUs,
		'us-s1582-genius-act': FlagUs,
		'us-hr2196-ems-memorial': FlagUs,
		'es-lo3-2018-proteccion-datos': FlagEs,
		'es-ley39-2015-procedimiento-administrativo': FlagEs,
		'es-lssi-2002': FlagEs,
		'es-telecom-2022': FlagEs,
		'es-tram-economia-social': FlagEs,
		'es-tram-desperdicio-alimentario': FlagEs,
		'es-tram-menores-digitales': FlagEs,
		'es-tram-jornada-laboral': FlagEs
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

	const leyBoletin = $derived(data.boletines.find((b) => b.slug === 'ley-21735-boletin'));

	const leyNormas = $derived(
		data.boletines
			.filter((b) => normOrder.includes(b.slug))
			.sort((a, b) => normOrder.indexOf(a.slug) - normOrder.indexOf(b.slug))
	);

	const ley18045 = $derived(data.boletines.find((b) => b.slug === 'ley-18045-historia'));

	const ley21670 = $derived(data.boletines.find((b) => b.slug === 'ley-21670-boletin'));

	const ley17370 = $derived(data.boletines.find((b) => b.slug === 'ley-17370-boletin'));

	const ley21120 = $derived(data.boletines.find((b) => b.slug === 'ley-21120-boletin'));

	const euDma = $derived(data.boletines.find((b) => b.slug === 'eu-dma'));
	const euDsa = $derived(data.boletines.find((b) => b.slug === 'eu-dsa'));
	const euAiAct = $derived(data.boletines.find((b) => b.slug === 'eu-ai-act'));
	const euCra = $derived(data.boletines.find((b) => b.slug === 'eu-cra'));
	const euDataAct = $derived(data.boletines.find((b) => b.slug === 'eu-data-act'));

	const usS5 = $derived(data.boletines.find((b) => b.slug === 'us-s5-laken-riley'));
	const usS269 = $derived(data.boletines.find((b) => b.slug === 'us-s269-improper-payments'));
	const usS331 = $derived(data.boletines.find((b) => b.slug === 'us-s331-halt-fentanyl'));
	const usS1582 = $derived(data.boletines.find((b) => b.slug === 'us-s1582-genius-act'));
	const usHr2196 = $derived(data.boletines.find((b) => b.slug === 'us-hr2196-ems-memorial'));

	const esLo3 = $derived(data.boletines.find((b) => b.slug === 'es-lo3-2018-proteccion-datos'));
	const esLey39 = $derived(data.boletines.find((b) => b.slug === 'es-ley39-2015-procedimiento-administrativo'));
	const esLssi = $derived(data.boletines.find((b) => b.slug === 'es-lssi-2002'));
	const esTelecom = $derived(data.boletines.find((b) => b.slug === 'es-telecom-2022'));

	const esTramEconomiaSocial = $derived(data.boletines.find((b) => b.slug === 'es-tram-economia-social'));
	const esTramDesperdicio = $derived(data.boletines.find((b) => b.slug === 'es-tram-desperdicio-alimentario'));
	const esTramMenores = $derived(data.boletines.find((b) => b.slug === 'es-tram-menores-digitales'));
	const esTramJornada = $derived(data.boletines.find((b) => b.slug === 'es-tram-jornada-laboral'));
</script>

<main class="max-w-4xl mx-auto px-4 py-12">
	<!-- Breadcrumbs -->
	<nav class="text-xs font-mono text-gray-400 mb-6 flex items-center gap-1.5">
		<a href="/" class="hover:text-gray-600 transition-colors">Inicio</a>
		<svg class="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
		</svg>
		<span class="text-gray-700 font-medium">Profesional</span>
	</nav>

	<div class="text-center mb-12">
		<h1 class="text-3xl font-bold text-gray-900">Área profesional</h1>
		<p class="text-gray-500 mt-3 text-sm max-w-lg mx-auto leading-relaxed">
			Legislación real representada en AKN Diff.
			Legislacion real de Chile, UE, EE.UU. y España representada en AKN Diff, documentando distintos escenarios del proceso legislativo.
		</p>
	</div>

	<!-- Ley 21.735 — Reforma de Pensiones -->
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
			{#if leyBoletin}
				<BoletinCard
					slug={leyBoletin.slug}
					title={leyBoletin.title}
					documentCount={leyBoletin.documentCount}
					flag={flagMap[leyBoletin.slug]}
				/>
			{/if}

			{#if leyNormas.length > 0}
				<div class="mt-3 pl-4 border-l-2 border-gray-200">
					<p class="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Normas modificadas</p>
					<div class="flex flex-col gap-1">
						{#each leyNormas as norma (norma.slug)}
							{@const NormaFlag = flagMap[norma.slug]}
							<a
								href="/pro/{norma.slug}/original"
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

	<!-- Boletín 17.370-17 — Cumplimiento alternativo de penas (RECHAZADO) -->
	{#if ley17370}
		<section class="mb-14">
			<div class="mb-5 max-w-lg mx-auto">
				<h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
					<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold">R</span>
					Boletín 17.370-17 — Cumplimiento Alternativo de Penas
				</h2>
				<p class="text-xs text-gray-400 mt-1.5 leading-relaxed">
					Proyecto rechazado en Sala del Senado (21-24).
					Primer ejemplo con votación nominal de rechazo:
					moción de 4 artículos, modificada por la Comisión de DDHH,
					y rechazada en votación general.
				</p>
			</div>

			<div class="max-w-lg mx-auto">
				<BoletinCard
					slug={ley17370.slug}
					title={ley17370.title}
					documentCount={ley17370.documentCount}
					flag={flagMap[ley17370.slug]}
					firstVersion="bill"
				/>
			</div>
		</section>
	{/if}

	<!-- Ley 21.120 — Identidad de Género (con Comisión Mixta) -->
	{#if ley21120}
		<section class="mb-14">
			<div class="mb-5 max-w-lg mx-auto">
				<h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
					<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">M</span>
					Ley 21.120 — Identidad de Género
				</h2>
				<p class="text-xs text-gray-400 mt-1.5 leading-relaxed">
					Boletín 8924-07. Primer caso con Comisión Mixta: la Cámara rechazó
					las modificaciones del Senado (2do trámite), activando la comisión
					bicameral. Votación más estrecha: 22-18. 6 votaciones de rechazo
					durante el proceso.
				</p>
			</div>

			<div class="max-w-lg mx-auto">
				<BoletinCard
					slug={ley21120.slug}
					title={ley21120.title}
					documentCount={ley21120.documentCount}
					flag={flagMap[ley21120.slug]}
					firstVersion="bill"
				/>
			</div>
		</section>
	{/if}

	<!-- EU — Regulaciones europeas -->
	{#if euDma || euDsa || euAiAct || euCra || euDataAct}
		<section class="mb-14">
			<div class="mb-5 max-w-lg mx-auto">
				<h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
					<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">EU</span>
					Regulaciones de la UE
				</h2>
				<p class="text-xs text-gray-400 mt-1.5 leading-relaxed">
					Pipeline automatizado: CELLAR + EP Open Data + EUR-Lex a AKN 3.0.
					Cada regulación muestra propuesta, enmiendas del Parlamento Europeo y texto final.
				</p>
			</div>

			<div class="max-w-lg mx-auto flex flex-col gap-2">
				{#if euDma}
					<BoletinCard
						slug={euDma.slug}
						title={euDma.title}
						documentCount={euDma.documentCount}
						flag={flagMap[euDma.slug]}
					/>
				{/if}
				{#if euDsa}
					<BoletinCard
						slug={euDsa.slug}
						title={euDsa.title}
						documentCount={euDsa.documentCount}
						flag={flagMap[euDsa.slug]}
					/>
				{/if}
				{#if euAiAct}
					<BoletinCard
						slug={euAiAct.slug}
						title={euAiAct.title}
						documentCount={euAiAct.documentCount}
						flag={flagMap[euAiAct.slug]}
					/>
				{/if}
				{#if euCra}
					<BoletinCard
						slug={euCra.slug}
						title={euCra.title}
						documentCount={euCra.documentCount}
						flag={flagMap[euCra.slug]}
					/>
				{/if}
				{#if euDataAct}
					<BoletinCard
						slug={euDataAct.slug}
						title={euDataAct.title}
						documentCount={euDataAct.documentCount}
						flag={flagMap[euDataAct.slug]}
					/>
				{/if}
			</div>
		</section>
	{/if}

	<!-- US — United States Congress -->
	{#if usS5 || usS269 || usS331 || usS1582 || usHr2196}
		<section class="mb-14">
			<div class="mb-5 max-w-lg mx-auto">
				<h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
					<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold">US</span>
					United States Congress
				</h2>
				<p class="text-xs text-gray-400 mt-1.5 leading-relaxed">
					Pipeline from Congress.gov Bill DTD XML + Senate/House roll call votes to AKN 3.0.
					S.5 with roll call votes in both chambers; S.269 with voice votes; S.331 with 5 versions including committee report; S.1582 with 16 section-level changes; HR.2196 active bill (in committee).
				</p>
			</div>

			<div class="max-w-lg mx-auto flex flex-col gap-2">
				{#if usS5}
					<BoletinCard
						slug={usS5.slug}
						title={usS5.title}
						documentCount={usS5.documentCount}
						flag={flagMap[usS5.slug]}
						firstVersion="bill"
					/>
				{/if}
				{#if usS269}
					<BoletinCard
						slug={usS269.slug}
						title={usS269.title}
						documentCount={usS269.documentCount}
						flag={flagMap[usS269.slug]}
						firstVersion="bill"
					/>
				{/if}
				{#if usS331}
					<BoletinCard
						slug={usS331.slug}
						title={usS331.title}
						documentCount={usS331.documentCount}
						flag={flagMap[usS331.slug]}
						firstVersion="bill"
					/>
				{/if}
				{#if usS1582}
					<BoletinCard
						slug={usS1582.slug}
						title={usS1582.title}
						documentCount={usS1582.documentCount}
						flag={flagMap[usS1582.slug]}
						firstVersion="bill"
					/>
				{/if}
				{#if usHr2196}
					<BoletinCard
						slug={usHr2196.slug}
						title={usHr2196.title}
						documentCount={usHr2196.documentCount}
						flag={flagMap[usHr2196.slug]}
						firstVersion="bill"
					/>
				{/if}
			</div>
		</section>
	{/if}

	<!-- ES — España (BOE) -->
	{#if esLo3 || esLey39 || esLssi || esTelecom}
		<section class="mb-14">
			<div class="mb-5 max-w-lg mx-auto">
				<h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
					<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">ES</span>
					Legislacion consolidada — España (BOE)
				</h2>
				<p class="text-xs text-gray-400 mt-1.5 leading-relaxed">
					Pipeline desde la API de datos abiertos del BOE. Cada ley muestra su version original,
					todas las reformas por leyes posteriores (con changeSet) y el texto vigente actual.
				</p>
			</div>

			<div class="max-w-lg mx-auto flex flex-col gap-2">
				{#if esLo3}
					<BoletinCard
						slug={esLo3.slug}
						title={esLo3.title}
						documentCount={esLo3.documentCount}
						flag={flagMap[esLo3.slug]}
					/>
				{/if}
				{#if esLey39}
					<BoletinCard
						slug={esLey39.slug}
						title={esLey39.title}
						documentCount={esLey39.documentCount}
						flag={flagMap[esLey39.slug]}
					/>
				{/if}
				{#if esLssi}
					<BoletinCard
						slug={esLssi.slug}
						title={esLssi.title}
						documentCount={esLssi.documentCount}
						flag={flagMap[esLssi.slug]}
					/>
				{/if}
				{#if esTelecom}
					<BoletinCard
						slug={esTelecom.slug}
						title={esTelecom.title}
						documentCount={esTelecom.documentCount}
						flag={flagMap[esTelecom.slug]}
					/>
				{/if}
			</div>
		</section>
	{/if}

	<!-- ES — Tramitación parlamentaria (Congreso) -->
	{#if esTramEconomiaSocial || esTramDesperdicio || esTramMenores || esTramJornada}
		<section class="mb-14">
			<div class="mb-5 max-w-lg mx-auto">
				<h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
					<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">ES</span>
					Tramitacion parlamentaria — España (Congreso)
				</h2>
				<p class="text-xs text-gray-400 mt-1.5 leading-relaxed">
					Pipeline desde datos abiertos del Congreso + PDFs del BOCG. Evolución completa de proyectos de ley
					durante su tramitación parlamentaria: texto original, ponencia, dictamen, pleno y aprobación definitiva,
					con diff artículo por artículo entre cada fase legislativa.
				</p>
			</div>

			<div class="max-w-lg mx-auto flex flex-col gap-2">
				{#if esTramDesperdicio}
					<BoletinCard
						slug={esTramDesperdicio.slug}
						title={esTramDesperdicio.title}
						documentCount={esTramDesperdicio.documentCount}
						flag={flagMap[esTramDesperdicio.slug]}
						firstVersion="bill-original"
					/>
				{/if}
				{#if esTramMenores}
					<BoletinCard
						slug={esTramMenores.slug}
						title={esTramMenores.title}
						documentCount={esTramMenores.documentCount}
						flag={flagMap[esTramMenores.slug]}
						firstVersion="bill-original"
					/>
				{/if}
				{#if esTramEconomiaSocial}
					<BoletinCard
						slug={esTramEconomiaSocial.slug}
						title={esTramEconomiaSocial.title}
						documentCount={esTramEconomiaSocial.documentCount}
						flag={flagMap[esTramEconomiaSocial.slug]}
						firstVersion="bill-original"
					/>
				{/if}
				{#if esTramJornada}
					<BoletinCard
						slug={esTramJornada.slug}
						title={esTramJornada.title}
						documentCount={esTramJornada.documentCount}
						flag={flagMap[esTramJornada.slug]}
						firstVersion="bill-original"
					/>
				{/if}
			</div>
		</section>
	{/if}
</main>
