<script lang="ts">
	import FlagCl from '~icons/circle-flags/cl';
	import FlagEs from '~icons/circle-flags/es';
	import FlagFr from '~icons/circle-flags/fr';
	import FlagDe from '~icons/circle-flags/de';
	import FlagGb from '~icons/circle-flags/gb';
	import FlagUs from '~icons/circle-flags/us';
	import FlagIt from '~icons/circle-flags/it';
	import FlagBr from '~icons/circle-flags/br';
	import FlagEu from '~icons/circle-flags/eu';

	let visible = $state(false);

	$effect(() => {
		const timeout = setTimeout(() => visible = true, 100);
		return () => clearTimeout(timeout);
	});

	const names = [
		{ flag: FlagCl, country: 'Chile', name: 'Comparado' },
		{ flag: FlagEs, country: 'España', name: 'Texto comparado' },
		{ flag: FlagFr, country: 'France', name: 'Tableau comparatif' },
		{ flag: FlagDe, country: 'Deutschland', name: 'Synopse' },
		{ flag: FlagGb, country: 'UK', name: 'Redline' },
		{ flag: FlagUs, country: 'USA', name: 'Side-by-side' },
		{ flag: FlagIt, country: 'Italia', name: 'Testo a fronte' },
		{ flag: FlagBr, country: 'Brasil', name: 'Quadro comparativo' },
		{ flag: FlagEu, country: 'EU', name: 'Consolidated comparison' },
	];
</script>

<div class="overflow-hidden">
	<!-- ═══ HERO ═══ -->
	<section class="max-w-5xl mx-auto px-4 pt-16 pb-12">
		<div class="flex flex-col lg:flex-row gap-10 lg:gap-14 items-start">
			<!-- Left: Message -->
			<div class="flex-1 max-w-xl" class:hero-visible={visible}>
				<div class="inline-block badge bg-brand text-brand-dark mb-4 hero-stagger-1">
					Research Project
				</div>
				<h1 class="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight leading-[1.1] hero-stagger-2">
					Las leyes cambian.<br/>
					<span class="text-gray-400">No deberias tener que adivinar como.</span>
				</h1>
				<p class="text-lg text-gray-500 mt-5 leading-relaxed hero-stagger-3">
					Diff es un proof-of-concept de comparados legislativos automaticos: visualiza exactamente que lineas se agregan, se retiran o se modifican en cada etapa del proceso legislativo.
				</p>
				<div class="flex gap-3 mt-8 hero-stagger-4">
					<a href="/boletines" class="btn-primary">
						Ejemplos
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
					</a>
					<a href="#el-pdf" class="btn-secondary">
						Por que esto importa
					</a>
				</div>
			</div>

			<!-- Right: Mini diff demo -->
			<div class="flex-1 w-full lg:max-w-md" class:hero-visible={visible}>
				<div class="card overflow-hidden hero-stagger-3">
					<!-- Fake diff header -->
					<div class="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b-2 border-gray-800">
						<div class="flex items-center gap-2">
							<span class="badge bg-amber-100 text-amber-800">amendment</span>
							<span class="font-mono text-xs text-gray-400">Indicacion 1</span>
						</div>
						<span class="badge bg-addition-100 text-addition-800">&#x2713; Aprobado</span>
					</div>
					<!-- Diff lines -->
					<div class="p-4 space-y-1 font-mono text-sm leading-relaxed">
						<div class="text-gray-500">&nbsp;&nbsp;Articulo 22. Jornada ordinaria</div>
						<div class="flex">
							<span class="w-6 shrink-0 text-deletion-500 text-right select-none">−</span>
							<span class="flex-1 bg-deletion-100 text-deletion-800 px-2 rounded-sm line-through ml-1">
								La jornada ordinaria no excedera de <strong>45 horas</strong> semanales.
							</span>
						</div>
						<div class="flex">
							<span class="w-6 shrink-0 text-addition-500 text-right select-none">+</span>
							<span class="flex-1 bg-addition-100 text-addition-800 px-2 rounded-sm ml-1">
								La jornada ordinaria no excedera de <strong>40 horas</strong> semanales.
							</span>
						</div>
						<div class="text-gray-500">&nbsp;&nbsp;</div>
						<div class="text-gray-500">&nbsp;&nbsp;Articulo 22 bis. Teletrabajo</div>
						<div class="flex">
							<span class="w-6 shrink-0 text-addition-500 text-right select-none">+</span>
							<span class="flex-1 bg-addition-100 text-addition-800 px-2 rounded-sm ml-1">
								El empleador debera ofrecer modalidad de
							</span>
						</div>
						<div class="flex">
							<span class="w-6 shrink-0 text-addition-500 text-right select-none">+</span>
							<span class="flex-1 bg-addition-100 text-addition-800 px-2 rounded-sm ml-1">
								teletrabajo cuando la naturaleza lo permita.
							</span>
						</div>
					</div>
					<!-- Fake vote bar -->
					<div class="px-4 py-2.5 bg-addition-50 border-t-2 border-gray-800 flex items-center gap-3 text-xs">
						<span class="font-semibold text-addition-800">A favor: 5</span>
						<span class="text-gray-300">|</span>
						<span class="font-semibold text-deletion-800">En contra: 0</span>
						<span class="text-gray-300">|</span>
						<span class="text-gray-500">Abstencion: 1</span>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- ═══ WHAT IS A COMPARADO ═══ -->
	<section class="max-w-4xl mx-auto px-4 py-12">
		<div class="text-center mb-10">
			<h2 class="text-2xl sm:text-3xl font-bold text-gray-900">
				¿Que es un texto comparado?
			</h2>
			<p class="text-gray-500 mt-3 max-w-2xl mx-auto leading-relaxed">
				En cada pais tiene un nombre distinto, pero el concepto es el mismo: un documento que pone <strong class="text-gray-700">lado a lado</strong> el texto original de una ley y el texto modificado, para que cualquier persona pueda ver que cambio.
			</p>
		</div>

		<!-- Names with flags -->
		<div class="flex flex-wrap justify-center gap-x-6 gap-y-4 mb-10">
			{#each names as { flag, country, name }}
				<div class="flex items-center gap-2.5">
					<svelte:component this={flag} class="w-6 h-6 shrink-0" />
					<div class="leading-tight">
						<span class="block text-[11px] font-mono text-gray-400">{country}</span>
						<span class="text-sm font-semibold text-gray-900">{name}</span>
					</div>
				</div>
			{/each}
		</div>

		<!-- Traditional PDF mock -->
		<div class="text-center mb-4">
			<p class="text-sm text-gray-400 font-mono">// Asi se ve un comparado tradicional</p>
		</div>
		<div class="pdf-mock relative">
			<!-- PDF viewer chrome -->
			<div class="flex items-center gap-2 px-3 py-1.5 bg-[#323232] rounded-t-lg">
				<div class="flex gap-1.5">
					<span class="w-2.5 h-2.5 rounded-full bg-[#ff5f57]"></span>
					<span class="w-2.5 h-2.5 rounded-full bg-[#febc2e]"></span>
					<span class="w-2.5 h-2.5 rounded-full bg-[#28c840]"></span>
				</div>
				<span class="text-[11px] text-gray-400 ml-1 truncate">comparado_ley_19799_indicaciones_comision_trabajo_v2_FINAL_rev3.pdf</span>
			</div>
			<!-- PDF grey surround -->
			<div class="bg-[#525659] px-4 sm:px-8 py-6 rounded-b-lg">
				<!-- The "page" -->
				<div class="bg-white shadow-2xl pdf-page px-6 sm:px-10 py-8 relative overflow-hidden">
					<!-- Bureaucratic header -->
					<div class="text-center mb-5 pdf-text">
						<p class="text-[10px] uppercase tracking-[0.2em] text-gray-400">Republica de Pastalandia</p>
						<p class="text-[9px] uppercase tracking-[0.15em] text-gray-400 mt-0.5">Senado &mdash; Comision de Gastronomia y Tradiciones</p>
						<div class="w-12 h-px bg-gray-300 mx-auto my-2"></div>
						<p class="text-xs font-bold text-gray-700 uppercase tracking-wide">Cuadro Comparado</p>
						<p class="text-[9px] text-gray-400 mt-1">Boletin N° 11.179-13 &mdash; Segundo Tramite Constitucional</p>
					</div>

					<!-- Table with visible borders like a real gov PDF -->
					<table class="w-full border-collapse pdf-text text-[11px] sm:text-xs leading-snug">
						<thead>
							<tr>
								<th class="border border-gray-400 bg-gray-100 px-2 py-1.5 text-left text-[9px] uppercase tracking-wider text-gray-600 w-1/2">Texto vigente</th>
								<th class="border border-gray-400 bg-gray-100 px-2 py-1.5 text-left text-[9px] uppercase tracking-wider text-gray-600 w-1/2">Texto propuesto por la Comision</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td class="border border-gray-300 px-2 py-2 align-top text-gray-700">
									<strong>Articulo 22.-</strong> El tiempo minimo de coccion de la pasta seca no podra ser inferior a <span class="underline decoration-red-400">doce</span> minutos, salvo disposicion reglamentaria en contrario.
								</td>
								<td class="border border-gray-300 px-2 py-2 align-top text-gray-700">
									<strong>Articulo 22.-</strong> El tiempo minimo de coccion de la pasta seca no podra ser inferior a <span class="underline decoration-red-400">ocho</span> minutos, salvo disposicion reglamentaria en contrario.
								</td>
							</tr>
							<tr>
								<td class="border border-gray-300 px-2 py-2 align-top text-gray-400 italic">
									(no existe)
								</td>
								<td class="border border-gray-300 px-2 py-2 align-top text-gray-700">
									<strong>Articulo 22 bis.-</strong> Autorizase el uso de salsa pesto como acompañamiento oficial en actos protocolares de la Republica.
								</td>
							</tr>
							<tr>
								<td class="border border-gray-300 px-2 py-2 align-top text-gray-700">
									<strong>Articulo 23.-</strong> Sin alteracion.
								</td>
								<td class="border border-gray-300 px-2 py-2 align-top text-gray-700">
									<strong>Articulo 23.-</strong> Sin alteracion.
								</td>
							</tr>
						</tbody>
					</table>

					<!-- Stamp / signature area -->
					<div class="mt-6 flex items-end justify-between pdf-text">
						<div class="text-[8px] text-gray-300 leading-relaxed">
							<p>Secretaria de la Comision</p>
							<p>S.C.L., 15 de enero de 2026</p>
						</div>
						<div class="stamp text-[9px] text-red-300/60 border-2 border-red-300/40 rounded px-2 py-1 uppercase tracking-wider font-bold -rotate-6">
							Tramitacion
						</div>
					</div>

					<!-- Page number -->
					<div class="text-center mt-4 text-[8px] text-gray-300 pdf-text">— 1 —</div>
				</div>
			</div>
			<!-- Caption below -->
			<div class="mt-4 flex items-center gap-3 text-[11px] text-gray-400 justify-center">
				<svg class="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<span>Imagen estatica. No se puede buscar, filtrar ni computar. No indica quien voto ni en que etapa del tramite ocurrio cada cambio.</span>
			</div>
		</div>

	</section>

	<!-- ═══ WHY PDF MUST GO ═══ -->
	<section id="el-pdf" class="max-w-4xl mx-auto px-4 py-12">
		<div class="text-center mb-10">
			<h2 class="text-2xl sm:text-3xl font-bold text-gray-900">
				El PDF no es la <span class="text-deletion-500 line-through">respuesta</span>
			</h2>
			<p class="text-gray-500 mt-3 max-w-2xl mx-auto leading-relaxed">
				Hoy, si quieres seguir la historia completa de una ley, te toca descargar decenas de archivos sueltos, uno por cada etapa. Ninguno se conecta con el otro.
			</p>
		</div>

		<!-- Finder window with PDFs -->
		<div class="mb-8">
			<!-- Window chrome -->
			<div class="flex items-center gap-2 px-3 py-1.5 bg-[#323232] rounded-t-lg">
				<div class="flex gap-1.5">
					<span class="w-2.5 h-2.5 rounded-full bg-[#ff5f57]"></span>
					<span class="w-2.5 h-2.5 rounded-full bg-[#febc2e]"></span>
					<span class="w-2.5 h-2.5 rounded-full bg-[#28c840]"></span>
				</div>
				<span class="text-[11px] text-gray-400 ml-1 truncate">~/Descargas/Boletin_11179-13_Ley_Coccion_Pastas</span>
			</div>
			<!-- Toolbar -->
			<div class="flex items-center gap-3 px-3 py-1.5 bg-[#3d3d3d] border-b border-[#4a4a4a] text-[10px] text-gray-400">
				<span>Nombre</span>
				<span class="ml-auto">6 elementos</span>
			</div>
			<!-- File list -->
			<div class="bg-[#1e1e1e] rounded-b-lg px-1 py-1">
				{#each [
					{ name: 'comparado_comision_gastronomia_v1.pdf', size: '245 KB', date: '12-03-2025' },
					{ name: 'comparado_comision_gastronomia_v2.pdf', size: '310 KB', date: '18-03-2025' },
					{ name: 'indicaciones_aprobadas_sala.pdf', size: '189 KB', date: '02-04-2025' },
					{ name: 'comparado_comision_presupuesto.pdf', size: '278 KB', date: '15-05-2025' },
					{ name: 'comparado_mixta_final.pdf', size: '412 KB', date: '03-06-2025' },
					{ name: 'texto_refundido_v3_FINAL(2).pdf', size: '534 KB', date: '20-06-2025' },
				] as file, i}
					<div class="flex items-center gap-3 px-3 py-1.5 rounded {i % 2 === 0 ? 'bg-[#262626]' : ''} finder-row">
						<!-- PDF icon -->
						<svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
							<rect x="4" y="1" width="16" height="22" rx="2" fill="#e74c3c" opacity="0.85"/>
							<path d="M14 1v5h5" fill="#c0392b"/>
							<path d="M14 1l5 5h-5z" fill="#c0392b" opacity="0.5"/>
							<text x="12" y="17" font-size="6" font-weight="700" fill="white" text-anchor="middle" font-family="sans-serif">PDF</text>
						</svg>
						<span class="text-[12px] text-gray-300 truncate flex-1 font-mono">{file.name}</span>
						<span class="text-[10px] text-gray-500 shrink-0 hidden sm:block w-16 text-right">{file.date}</span>
						<span class="text-[10px] text-gray-500 shrink-0 w-12 text-right">{file.size}</span>
					</div>
				{/each}
			</div>
			<!-- Caption -->
			<div class="mt-4 text-center">
				<p class="text-sm text-gray-500">6 archivos, 3 etapas, <strong class="text-gray-900">cero conexion entre ellos</strong>.</p>
				<p class="text-xs text-gray-400 mt-1">¿Cual es la ultima version? ¿Que cambio entre la v1 y la v2? Solo hay una forma de saberlo: abrir cada uno y comparar a mano.</p>
			</div>
		</div>

		<!-- Manual reconstruction -->
		<div class="mb-8">
			<p class="text-sm font-mono text-gray-400 mb-5 text-center">// Para saber en que esta la ley hoy, tienes que hacer esto:</p>
			<div class="flex flex-col sm:flex-row items-center gap-3 sm:gap-2 justify-center">
				<!-- Step 1: the law -->
				<div class="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
					<svg class="w-5 h-5 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<path d="M6 2h12v20H6z" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M9 6h6M9 10h6M9 14h3" stroke-linecap="round"/>
					</svg>
					<span class="text-xs font-semibold text-blue-800">Ley original</span>
				</div>
				<!-- Arrow -->
				<span class="text-gray-300 text-lg hidden sm:block">+</span>
				<span class="text-gray-300 text-lg sm:hidden">+</span>
				<!-- Step 2: PDF 1 -->
				<div class="flex items-center gap-1.5 px-3 py-2 bg-deletion-50 border border-deletion-200 rounded-lg">
					<svg class="w-4 h-4 text-deletion-400 shrink-0" viewBox="0 0 24 24" fill="none">
						<rect x="4" y="1" width="16" height="22" rx="2" fill="#e74c3c" opacity="0.85"/>
						<text x="12" y="17" font-size="6" font-weight="700" fill="white" text-anchor="middle" font-family="sans-serif">PDF</text>
					</svg>
					<span class="text-[11px] font-mono text-gray-600">v1</span>
				</div>
				<span class="text-gray-300 text-lg">+</span>
				<!-- Step 3: PDF 2 -->
				<div class="flex items-center gap-1.5 px-3 py-2 bg-deletion-50 border border-deletion-200 rounded-lg">
					<svg class="w-4 h-4 text-deletion-400 shrink-0" viewBox="0 0 24 24" fill="none">
						<rect x="4" y="1" width="16" height="22" rx="2" fill="#e74c3c" opacity="0.85"/>
						<text x="12" y="17" font-size="6" font-weight="700" fill="white" text-anchor="middle" font-family="sans-serif">PDF</text>
					</svg>
					<span class="text-[11px] font-mono text-gray-600">v2</span>
				</div>
				<span class="text-gray-300 text-lg">+</span>
				<!-- Step 4: PDF 3 -->
				<div class="flex items-center gap-1.5 px-3 py-2 bg-deletion-50 border border-deletion-200 rounded-lg">
					<svg class="w-4 h-4 text-deletion-400 shrink-0" viewBox="0 0 24 24" fill="none">
						<rect x="4" y="1" width="16" height="22" rx="2" fill="#e74c3c" opacity="0.85"/>
						<text x="12" y="17" font-size="6" font-weight="700" fill="white" text-anchor="middle" font-family="sans-serif">PDF</text>
					</svg>
					<span class="text-[11px] font-mono text-gray-600">...</span>
				</div>
				<!-- Arrow to result -->
				<span class="text-gray-300 text-lg">=</span>
				<!-- Result: unknown -->
				<div class="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg border-dashed">
					<span class="text-lg">🤷</span>
					<span class="text-xs font-semibold text-amber-800">¿Ley actual?</span>
				</div>
			</div>
			<p class="text-xs text-gray-400 mt-5 text-center max-w-lg mx-auto leading-relaxed">
				Tomas la ley original, abres cada PDF, aplicas los cambios mentalmente uno por uno, y rezas no haberte saltado ninguno. <strong class="text-gray-600">Eso es lo que hace hoy un abogado, un periodista o un ciudadano que quiere entender que paso con una ley.</strong>
			</p>
		</div>

		<!-- Pain points as simple checklist -->
		<div class="max-w-md mx-auto space-y-3">
			<div class="flex items-start gap-3">
				<span class="text-deletion-500 font-bold text-lg leading-none mt-0.5">✗</span>
				<p class="text-sm text-gray-600"><strong class="text-gray-900">No puedes buscar por articulo.</strong> Hay que recorrer el PDF completo para encontrar que cambio.</p>
			</div>
			<div class="flex items-start gap-3">
				<span class="text-deletion-500 font-bold text-lg leading-none mt-0.5">✗</span>
				<p class="text-sm text-gray-600"><strong class="text-gray-900">No puedes reconstruir el historial.</strong> Cada archivo es una isla; ningun sistema puede conectarlos.</p>
			</div>
			<div class="flex items-start gap-3">
				<span class="text-deletion-500 font-bold text-lg leading-none mt-0.5">✗</span>
				<p class="text-sm text-gray-600"><strong class="text-gray-900">No sabes quien voto que.</strong> El PDF no registra votos, autores ni etapas.</p>
			</div>
		</div>
	</section>


	<!-- ═══ THE SOLUTION ═══ -->
	<section class="max-w-4xl mx-auto px-4 py-12">
		<div class="text-center mb-10">
			<h2 class="text-2xl sm:text-3xl font-bold text-gray-900">
				La propuesta: AKN++
			</h2>
			<p class="text-gray-500 mt-3 max-w-2xl mx-auto leading-relaxed">
				Una extension del estandar internacional <strong class="text-gray-700">Akoma Ntoso</strong> que agrega un <code class="badge bg-gray-100 text-xs">changeSet</code> computable, permitiendo reconstruir el comparado de cualquier modificacion de forma automatica.
			</p>
		</div>

		<!-- Before / After -->
		<div class="grid sm:grid-cols-2 gap-4 mb-10">
			<!-- Before -->
			<div class="card overflow-hidden border-l-4 border-l-deletion-500">
				<div class="px-4 py-2.5 bg-deletion-50 border-b-2 border-gray-800">
					<h3 class="text-sm font-bold text-deletion-800">Hoy: el Amendment</h3>
				</div>
				<div class="p-4 text-sm text-gray-600 space-y-2 leading-relaxed">
					<p class="font-mono text-xs text-gray-400">// Lenguaje natural, no computable</p>
					<p class="italic">"Reemplazase en el articulo 22 la expresion <span class="bg-deletion-100 px-1 rounded-sm">'45 horas'</span> por <span class="bg-addition-100 px-1 rounded-sm">'40 horas'</span>"</p>
					<p class="text-xs text-gray-400 mt-3">Un humano tiene que leer cada indicacion y reconstruir mentalmente el comparado.</p>
				</div>
			</div>

			<!-- After -->
			<div class="card overflow-hidden border-l-4 border-l-addition-500">
				<div class="px-4 py-2.5 bg-addition-50 border-b-2 border-gray-800">
					<h3 class="text-sm font-bold text-addition-800">AKN++: el changeSet</h3>
				</div>
				<div class="p-4 font-mono text-xs text-gray-600 space-y-1 leading-relaxed">
					<p class="text-gray-400">// Computable, automatico</p>
					<p>&lt;changeSet base=<span class="text-blue-600">"/ley/19799/v2"</span>&gt;</p>
					<p class="ml-3">&lt;articleChange article=<span class="text-blue-600">"art_22"</span>&gt;</p>
					<p class="ml-6 bg-deletion-100 text-deletion-800 rounded-sm px-1 inline-block">&lt;old&gt;45 horas&lt;/old&gt;</p>
					<p class="ml-6 bg-addition-100 text-addition-800 rounded-sm px-1 inline-block">&lt;new&gt;40 horas&lt;/new&gt;</p>
					<p class="ml-3">&lt;/articleChange&gt;</p>
					<p>&lt;/changeSet&gt;</p>
				</div>
			</div>
		</div>

		<!-- Features row -->
		<div class="grid gap-4 sm:grid-cols-3">
			<div class="card p-5 border-l-4 border-l-blue-500">
				<h3 class="text-sm font-bold text-gray-900 mb-1">Formato estructurado</h3>
				<p class="text-xs text-gray-500 leading-relaxed">
					Basado en Akoma Ntoso, el estandar XML internacional para documentos legislativos. Extendido con campos computables.
				</p>
			</div>
			<div class="card p-5 border-l-4 border-l-amber-500">
				<h3 class="text-sm font-bold text-gray-900 mb-1">Comparado automatico</h3>
				<p class="text-xs text-gray-500 leading-relaxed">
					Diferencias palabra por palabra entre versiones. Vista acumulada para entender la evolucion completa del texto.
				</p>
			</div>
			<div class="card p-5 border-l-4 border-l-addition-500">
				<h3 class="text-sm font-bold text-gray-900 mb-1">Votaciones incluidas</h3>
				<p class="text-xs text-gray-500 leading-relaxed">
					Quien voto a favor, en contra o se abstuvo. El resultado real de cada cambio, no solo el texto final.
				</p>
			</div>
		</div>
	</section>

	<br>
	<br>
	<!-- ═══ WHY "DIFF" ═══ -->
	<section class="max-w-4xl mx-auto px-4 py-12">
		<div class="text-center mb-10">
			<h2 class="text-2xl sm:text-3xl font-bold text-gray-900">
				¿Por que <span class="text-addition-500">"Diff"</span>?
			</h2>
			<p class="text-gray-500 mt-3 max-w-2xl mx-auto leading-relaxed">
				En el mundo del software, un <strong class="text-gray-700">diff</strong> es la herramienta mas basica del trabajo en equipo: muestra exactamente que lineas cambiaron entre una version y otra. Millones de desarrolladores la usan todos los dias, desde hace mas de <span class="font-mono text-addition-800 bg-addition-100 px-1 rounded-sm">20 años</span>.
			</p>
			<p class="text-gray-500 mt-3 max-w-2xl mx-auto leading-relaxed">
				Cuando descubrimos como el mundo legislativo lidia con el mismo problema — <span class="font-mono text-deletion-800 bg-deletion-100 px-1 rounded-sm line-through">PDFs</span>, comparados manuales, cero trazabilidad — no lo podiamos creer. Estamos trayendo al Congreso lo que los desarrolladores han tenido por decadas.
			</p>
		</div>
	</section>

	<!-- ═══ CTA ═══ -->
	<section class="max-w-4xl mx-auto px-4 py-16 text-center">
		<h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
			Explora el proof of concept
		</h2>
		<p class="text-gray-500 max-w-xl mx-auto leading-relaxed mb-8">
			Este es un proyecto de investigacion abierto. Queremos generar un debate sobre como deberian publicarse los cambios legislativos.
		</p>
		<div class="flex flex-col sm:flex-row gap-3 justify-center items-center">
			<a href="/boletines" class="btn-primary">
				Ejemplos
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>
		</div>
	
	</section>
</div>

<style>
	.hero-stagger-1, .hero-stagger-2, .hero-stagger-3, .hero-stagger-4 {
		opacity: 0;
		transform: translateY(12px);
		transition: opacity 0.5s ease, transform 0.5s ease;
	}
	.hero-visible .hero-stagger-1 { opacity: 1; transform: translateY(0); transition-delay: 0ms; }
	.hero-visible .hero-stagger-2 { opacity: 1; transform: translateY(0); transition-delay: 80ms; }
	.hero-visible .hero-stagger-3 { opacity: 1; transform: translateY(0); transition-delay: 160ms; }
	.hero-visible .hero-stagger-4 { opacity: 1; transform: translateY(0); transition-delay: 240ms; }

	.pdf-page {
		font-variant-ligatures: none;
	}
	.pdf-text {
		font-family: 'Times New Roman', 'DejaVu Serif', Georgia, serif;
	}
	.finder-row {
		transition: background-color 0.1s ease;
	}
	.finder-row:hover {
		background-color: #2d4f8a !important;
	}
</style>
