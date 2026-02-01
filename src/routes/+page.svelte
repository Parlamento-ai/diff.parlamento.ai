<main class="max-w-4xl mx-auto px-4 py-16">
	<!-- Hero -->
	<div class="text-center mb-16">
		<h1 class="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
			Comparado Legislativo
		</h1>
		<p class="text-lg text-gray-500 mt-4 max-w-2xl mx-auto leading-relaxed">
			Visualiza la evolucion de documentos legislativos paso a paso.
			Compara versiones, observa cada cambio y entiende como se transforma una ley.
		</p>
		<a
			href="/boletines"
			class="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
		>
			Ver boletines
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
		</a>
	</div>

	<!-- Features -->
	<div class="grid gap-8 sm:grid-cols-3 mb-16">
		<div class="text-center">
			<div class="w-10 h-10 mx-auto mb-3 rounded-lg bg-blue-100 flex items-center justify-center">
				<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
			</div>
			<h3 class="text-sm font-semibold text-gray-900">Formato AKN++</h3>
			<p class="text-xs text-gray-500 mt-1">
				Extension de Akoma Ntoso para modelar el proceso legislativo completo, incluyendo proyectos de ley, indicaciones y votaciones.
			</p>
		</div>
		<div class="text-center">
			<div class="w-10 h-10 mx-auto mb-3 rounded-lg bg-amber-100 flex items-center justify-center">
				<svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
				</svg>
			</div>
			<h3 class="text-sm font-semibold text-gray-900">Comparado visual</h3>
			<p class="text-xs text-gray-500 mt-1">
				Diferencias palabra por palabra entre versiones, con vista acumulada para entender la evolucion completa del texto.
			</p>
		</div>
		<div class="text-center">
			<div class="w-10 h-10 mx-auto mb-3 rounded-lg bg-emerald-100 flex items-center justify-center">
				<svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
				</svg>
			</div>
			<h3 class="text-sm font-semibold text-gray-900">Votaciones</h3>
			<p class="text-xs text-gray-500 mt-1">
				Registro de votaciones por cada etapa: quienes votaron a favor, en contra o se abstuvieron, y si la indicacion fue aprobada o rechazada.
			</p>
		</div>
	</div>

	<!-- What is AKN++ -->
	<div class="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
		<h2 class="text-lg font-bold text-gray-900 mb-3">Que es AKN++?</h2>
		<div class="text-sm text-gray-600 space-y-3 leading-relaxed">
			<p>
				<strong>Akoma Ntoso</strong> (AKN) es un estandar XML internacional para representar documentos legislativos, parlamentarios y judiciales de forma estructurada y semantica.
			</p>
			<p>
				<strong>AKN++</strong> es una extension experimental que agrega elementos para modelar el <em>proceso</em> legislativo: proyectos de ley con conjuntos de cambios (<code class="text-xs bg-gray-100 px-1 py-0.5 rounded">changeSet</code>), indicaciones que modifican articulos especificos, y votaciones con detalle de cada parlamentario.
			</p>
			<p>
				Este comparado permite navegar cada etapa de la tramitacion, ver exactamente que cambio en cada paso, y entender como el texto final llego a ser lo que es.
			</p>
		</div>
	</div>
</main>
