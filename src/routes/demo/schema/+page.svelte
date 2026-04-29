<script lang="ts">
	let { data } = $props();

	const countryNames: Record<string, string> = {
		cl: 'Chile',
		es: 'España',
		eu: 'Unión Europea',
		pe: 'Perú',
		us: 'Estados Unidos'
	};
</script>

<svelte:head>
	<title>El esquema, explicado — research demo</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-6 py-12 font-sans text-base leading-relaxed text-gray-800">
	<a href="/demo" class="text-sm text-blue-600 hover:underline">← volver al demo</a>

	<header class="mt-6 mb-12">
		<h1 class="mb-3 text-3xl font-bold tracking-tight">El esquema, explicado</h1>
		<p class="text-gray-600">
			Esta página es la filosofía detrás de la base de datos que estamos construyendo — no es
			una referencia de campos. Explica la apuesta que estamos haciendo, cómo manejamos la
			complejidad y dónde estamos hoy. Si querés detalle a nivel de campos, leé directamente
			<a
				href="https://github.com/Parlamento-ai/diff.parlamento.ai/blob/main/research/schema/v3-schema.ts"
				class="text-blue-600 hover:underline"
				target="_blank"
				rel="noopener">v3-schema.ts</a
			>.
		</p>
	</header>

	<!-- ─────────────────────────────── 1. El problema -->
	<section class="mb-14">
		<h2 class="mb-3 text-xl font-bold">1. El problema</h2>
		<p class="mb-4">
			Cada parlamento llama a las mismas cosas de forma distinta. Un <em>boletín</em> chileno
			es un <em>proyecto de ley</em> español es un <em>bill</em> estadounidense es una
			<em>proposal</em> europea. Las formas se parecen, pero cada país además tiene sus propias
			particularidades — urgencias en Chile, conference reports en EE.UU., leyes orgánicas vs.
			ordinarias en España.
		</p>
		<p class="mb-4">
			Existe un estándar internacional — <strong>Akoma Ntoso</strong> (AKN) — diseñado para
			modelar documentos parlamentarios de forma universal. Es un trabajo serio, bien
			mantenido, y casi nadie lo implementó. La mayoría de los parlamentos hicieron su propio
			XML y después se alejaron del estándar.
		</p>
		<p>
			Lo que queremos es un solo esquema que contenga Chile, España, la UE, Perú y EE.UU. lado
			a lado, consultable como si fueran un mismo parlamento. Misma forma, datos distintos.
			Sin ramas por país.
		</p>
	</section>

	<!-- ─────────────────────────────── 2. La apuesta -->
	<section class="mb-14">
		<h2 class="mb-3 text-xl font-bold">2. La apuesta</h2>
		<p class="mb-4">
			Aproximadamente el 90% del rito parlamentario es genuinamente compartido entre países.
			El 10% restante es diferencia real, pero acotada — manejada con un conjunto chico de
			escapes con nombre, no bifurcando el esquema.
		</p>
		<p class="mb-4">
			Este experimento existe para falsear o confirmar esa apuesta. No es "creemos que AKN va
			a funcionar" — es "vamos a cargar cinco países en un mismo esquema y ver qué se rompe".
		</p>

		<div class="my-6 rounded border-l-4 border-amber-400 bg-amber-50 p-4 text-sm">
			<p class="mb-2 font-bold text-amber-900">Cómo se ve "roto"</p>
			<ul class="list-disc space-y-1 pl-5 text-amber-950">
				<li>
					Un campo está lleno en un país y vacío en cuatro → generalizamos mal un concepto
					específico de un país.
				</li>
				<li>
					Un campo está vacío en todos los países → esquema muerto; lo sacamos.
				</li>
				<li>
					Datos reales no tienen dónde ir y terminan en un blob "country specific" → nos
					perdimos un concepto que probablemente debería ser una columna real.
				</li>
			</ul>
		</div>
	</section>

	<!-- ─────────────────────────────── 3. Cómo manejamos la complejidad -->
	<section class="mb-14">
		<h2 class="mb-3 text-xl font-bold">3. Cómo manejamos la complejidad</h2>
		<p class="mb-6 text-gray-600">
			Tres movimientos arquitectónicos, cada uno con su razón.
		</p>

		<!-- Movimiento A: XML como fuente de verdad -->
		<article class="mb-8 rounded border border-gray-200 bg-white p-5">
			<header class="mb-3">
				<p class="text-xs font-bold tracking-wider text-gray-500 uppercase">Movimiento A</p>
				<h3 class="text-lg font-bold">
					Los archivos XML son la fuente de verdad. SQL es una proyección.
				</h3>
			</header>
			<p class="mb-4 text-sm">
				Cada documento que modelamos vive como un archivo <code
					class="rounded bg-gray-100 px-1 text-xs">.xml</code
				>
				independiente en <code class="rounded bg-gray-100 px-1 text-xs"
					>research/schema/data/</code
				>, con la forma de AKN. La base SQLite se reconstruye desde cero en cada corrida,
				recorriendo esos archivos y extrayendo columnas. Nadie edita la base directamente.
			</p>

			<div class="my-5 rounded border border-gray-200 bg-gray-50 p-5">
				<svg viewBox="0 0 700 200" class="w-full" xmlns="http://www.w3.org/2000/svg">
					<defs>
						<marker
							id="arrowA"
							viewBox="0 0 10 10"
							refX="9"
							refY="5"
							markerWidth="6"
							markerHeight="6"
							orient="auto-start-reverse"
						>
							<path d="M0,0 L10,5 L0,10 z" fill="#374151" />
						</marker>
					</defs>

					<!-- Archivos XML (izquierda) -->
					<g>
						<rect
							x="40"
							y="50"
							width="200"
							height="110"
							rx="6"
							fill="#fff"
							stroke="#374151"
							stroke-width="2"
						/>
						<text x="140" y="78" text-anchor="middle" font-weight="bold" font-size="14"
							>data/**/*.xml</text
						>
						<text x="140" y="100" text-anchor="middle" font-size="11" fill="#6b7280"
							>versionado, revisable</text
						>
						<text x="140" y="118" text-anchor="middle" font-size="11" fill="#6b7280"
							>diffeable en PRs</text
						>
						<text x="140" y="140" text-anchor="middle" font-size="11" fill="#374151"
							font-weight="600">fuente de verdad</text
						>
					</g>

					<!-- Build script -->
					<g>
						<line
							x1="240"
							y1="105"
							x2="450"
							y2="105"
							stroke="#374151"
							stroke-width="2"
							marker-end="url(#arrowA)"
						/>
						<rect
							x="280"
							y="78"
							width="130"
							height="32"
							rx="4"
							fill="#fef3c7"
							stroke="#b45309"
							stroke-width="1.5"
						/>
						<text
							x="345"
							y="98"
							text-anchor="middle"
							font-size="12"
							font-weight="bold"
							fill="#92400e">build script</text
						>
						<text x="345" y="125" text-anchor="middle" font-size="10" fill="#6b7280"
							>extrae + inserta</text
						>
					</g>

					<!-- SQLite -->
					<g>
						<rect
							x="460"
							y="50"
							width="200"
							height="110"
							rx="6"
							fill="#fff"
							stroke="#374151"
							stroke-width="2"
							stroke-dasharray="4 3"
						/>
						<text x="560" y="78" text-anchor="middle" font-weight="bold" font-size="14"
							>research.db</text
						>
						<text x="560" y="100" text-anchor="middle" font-size="11" fill="#6b7280"
							>gitignored</text
						>
						<text x="560" y="118" text-anchor="middle" font-size="11" fill="#6b7280"
							>se reconstruye cada vez</text
						>
						<text x="560" y="140" text-anchor="middle" font-size="11" fill="#374151"
							font-weight="600">proyección / índice</text
						>
					</g>
				</svg>
			</div>

			<p class="mb-2 text-sm font-bold text-gray-700">Por qué</p>
			<ul class="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
				<li>
					Un <code class="rounded bg-gray-100 px-1 text-xs">.db</code> binario no se puede revisar
					en un PR ni mergear entre contribuyentes. Los archivos de texto sí.
				</li>
				<li>
					Un cambio de esquema se vuelve un cambio de código <em>más</em> un barrido por todo
					el corpus. Si el barrido es doloroso, el cambio de esquema está mal — ese es el bucle
					de feedback que queremos.
				</li>
				<li>
					Cualquiera clona el repo y corre un comando para reconstruir el experimento
					completo. Sin estado oculto.
				</li>
			</ul>
		</article>

		<!-- Movimiento B: Tres baldes por campo -->
		<article class="mb-8 rounded border border-gray-200 bg-white p-5">
			<header class="mb-3">
				<p class="text-xs font-bold tracking-wider text-gray-500 uppercase">Movimiento B</p>
				<h3 class="text-lg font-bold">
					Cada campo cae en uno de tres baldes.
				</h3>
			</header>
			<p class="mb-4 text-sm">
				Una vez que el XML es la fuente de verdad, la pregunta pasa a ser: ¿qué campos
				además necesitan ser columnas SQL? La respondimos con una división de tres vías — y
				la ubicación de cada campo está registrada en el propio archivo del esquema.
			</p>

			<div class="my-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
				<div class="rounded border border-gray-300 bg-gray-50 p-4">
					<p class="mb-1 text-xs font-bold tracking-wider text-gray-500 uppercase">
						Solo SQL
					</p>
					<p class="mb-2 text-sm font-bold">Cañería</p>
					<p class="text-xs text-gray-600">
						IDs, fingerprints, timestamps, metadatos de scraping. Nunca aparece en el XML.
						Se sobrescribe en su lugar. Sin historial.
					</p>
				</div>
				<div class="rounded border border-gray-300 bg-gray-50 p-4">
					<p class="mb-1 text-xs font-bold tracking-wider text-gray-500 uppercase">
						Solo XML
					</p>
					<p class="mb-2 text-sm font-bold">Contenido profundo</p>
					<p class="text-xs text-gray-600">
						Artículos, párrafos, fundamentos, referencias internas. Cualquier cosa anidada,
						recursiva o específica de un país que el demo no consulta en agregado.
					</p>
				</div>
				<div class="rounded border border-blue-300 bg-blue-50 p-4">
					<p class="mb-1 text-xs font-bold tracking-wider text-blue-700 uppercase">Ambos</p>
					<p class="mb-2 text-sm font-bold">Índice consultable</p>
					<p class="text-xs text-blue-900">
						Un conjunto chico y elegido a mano de campos que el demo necesita en joins y
						filtros. Almacenados como columnas <em>y</em> presentes en el XML.
						<strong>El XML manda</strong> si discrepan — la columna se regenera.
					</p>
				</div>
			</div>

			<p class="mb-2 text-sm font-bold text-gray-700">Por qué</p>
			<ul class="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
				<li>
					La versión anterior del esquema tenía una columna <code
						class="rounded bg-gray-100 px-1 text-xs">body</code
					>
					genérica en JSON que absorbía todo lo que no podíamos modelar. Era el esquema
					reconociendo que había chocado contra una pared. Los baldes obligan a responder
					la pregunta de forma explícita.
				</li>
				<li>
					Agregar un campo al balde "ambos" es barato: escribís un extractor, agregás una
					columna, reconstruís. Así podemos arrancar chico y promover un campo el día que
					una consulta lo necesita.
				</li>
				<li>
					El versionado se vuelve trivial — guardamos el XML completo por versión. Sin
					malabares con snapshots JSON, sin tablas de historial por columna.
				</li>
			</ul>
		</article>

		<!-- Movimiento C: Escapes con bucles de feedback -->
		<article class="mb-2 rounded border border-gray-200 bg-white p-5">
			<header class="mb-3">
				<p class="text-xs font-bold tracking-wider text-gray-500 uppercase">Movimiento C</p>
				<h3 class="text-lg font-bold">
					Los escapes son visibles, no ocultos.
				</h3>
			</header>
			<p class="mb-4 text-sm">
				El 10% que no encaja en la forma compartida va a escapes con nombre. La idea no es
				hacer desaparecer el desencaje — es hacerlo <em>contable</em>, para que el esquema
				pueda evolucionar hacia lo que los datos realmente son.
			</p>

			<div class="my-5 space-y-3">
				<div class="rounded border border-gray-200 p-3 text-sm">
					<p class="mb-1 font-bold text-gray-800">
						Blob <code class="rounded bg-gray-100 px-1 text-xs">countrySpecific</code>
					</p>
					<p class="text-gray-700">
						Un campo JSON libre en cada documento. Cuando un país registra algo para lo
						que no tenemos columna, va acá. Miramos qué se acumula: cuando la misma forma
						aparece en 2+ países, la promovemos a columna real.
					</p>
				</div>
				<div class="rounded border border-gray-200 p-3 text-sm">
					<p class="mb-1 font-bold text-gray-800">
						<code class="rounded bg-gray-100 px-1 text-xs">statusLocal</code> al lado de
						<code class="rounded bg-gray-100 px-1 text-xs">status</code>
					</p>
					<p class="text-gray-700">
						La frase del propio país para una etapa ("Tramitación terminada — pendiente de
						promulgación") se preserva al lado de nuestro status normalizado ("passed").
						Nunca tiramos la voz del país.
					</p>
				</div>
				<div class="rounded border border-gray-200 p-3 text-sm">
					<p class="mb-1 font-bold text-gray-800">Timelines append-only</p>
					<p class="text-gray-700">
						No modelamos las reglas del proceso de cada país (estilo BPMN). Solo
						registramos cada paso observado con un <code
							class="rounded bg-gray-100 px-1 text-xs">actionType</code
						>
						normalizado y la etiqueta local del país. La forma del proceso emerge del log,
						no de un modelo que escribimos nosotros.
					</p>
				</div>
			</div>

			<p class="mb-2 text-sm font-bold text-gray-700">Por qué</p>
			<ul class="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
				<li>
					Un escape es una confesión — nombrarlo explícitamente es lo que la hace útil.
					Esconder el desencaje en una columna JSON genérica sería el mismo error que
					cometimos con el viejo campo
					<code class="rounded bg-gray-100 px-1 text-xs">body</code>.
				</li>
				<li>
					La evolución del esquema se guía por lo que hay en los escapes, no por
					adivinanzas. El esquema se va ajustando a medida que aparecen patrones.
				</li>
			</ul>
		</article>
	</section>

	<!-- ─────────────────────────────── 4. Las dos métricas -->
	<section class="mb-14">
		<h2 class="mb-3 text-xl font-bold">4. Las dos métricas que guían todo</h2>
		<p class="mb-6 text-gray-600">
			Las dos métricas salen del trabajo solas, mientras mantengamos el corpus honesto.
		</p>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<div class="rounded border border-gray-200 bg-white p-5">
				<p class="mb-2 text-sm font-bold tracking-wider text-gray-500 uppercase">
					Cobertura
				</p>
				<p class="mb-3 text-lg font-bold">
					¿Qué % de los datos legislativos públicos del país entra en el esquema?
				</p>
				<p class="text-sm text-gray-700">
					Cobertura baja significa que existen datos pero nuestro esquema no los puede
					contener. Nos dice dónde el esquema es muy angosto.
				</p>
			</div>
			<div class="rounded border border-gray-200 bg-white p-5">
				<p class="mb-2 text-sm font-bold tracking-wider text-gray-500 uppercase">
					Completitud
				</p>
				<p class="mb-3 text-lg font-bold">
					¿Qué % de los campos del esquema termina poblado, por país?
				</p>
				<p class="text-sm text-gray-700">
					Completitud baja significa que nuestro esquema pide cosas que ese país no
					registra. Nos dice dónde el esquema es muy ancho.
				</p>
			</div>
		</div>

		<p class="mt-6 text-sm text-gray-600">
			Juntas triangulan la forma correcta: cobertura alta y completitud alta en los cinco
			países significa que la apuesta se sostuvo. Cualquier otra cosa es una señal apuntando
			a una corrección concreta.
		</p>
	</section>

	<!-- ─────────────────────────────── 5. Dónde estamos hoy -->
	<section class="mb-14">
		<h2 class="mb-3 text-xl font-bold">5. Dónde estamos hoy</h2>
		<p class="mb-4 text-gray-600">
			Esta sección lee del <code class="rounded bg-gray-100 px-1 text-xs">research.db</code>
			en vivo. Si se ve vacía, el build no se corrió.
		</p>

		<div class="mb-6 rounded border border-gray-200 bg-white p-5">
			<p class="mb-3 text-sm font-bold text-gray-700">
				Fase 1 — un proyecto de ley de punta a punta, por país
			</p>
			<p class="mb-4 text-sm text-gray-600">
				Para cada uno de los cinco países objetivo, modelamos un proyecto de ley que se
				convirtió en ley: el proyecto en sí, la ley que modificó, algunos eventos de
				trámite, una indicación, la entrada del diario oficial que la promulgó. Cinco
				países × ~7 documentos = ~35 archivos. Lo suficientemente chico como para tenerlo
				en la cabeza, lo suficientemente grande como para que aparezca fricción real.
			</p>

			<div class="grid grid-cols-1 gap-2 sm:grid-cols-5">
				{#each data.targetCountries as code (code)}
					{@const docs = data.byCountry[code]}
					{@const total = docs?.reduce((s, d) => s + d.n, 0) ?? 0}
					<div
						class="rounded border p-3 text-sm {total > 0
							? 'border-green-300 bg-green-50'
							: 'border-gray-200 bg-gray-50 text-gray-400'}"
					>
						<p class="text-xs tracking-wider uppercase">{code}</p>
						<p class="font-bold {total > 0 ? 'text-green-900' : ''}">
							{countryNames[code]}
						</p>
						<p class="mt-1 text-xs">
							{total === 0 ? 'aún no cargado' : `${total} doc${total === 1 ? '' : 's'}`}
						</p>
					</div>
				{/each}
			</div>
		</div>

		{#if data.total > 0}
			<div class="mb-6 rounded border border-gray-200 bg-white p-5">
				<p class="mb-3 text-sm font-bold text-gray-700">Qué está cargado</p>
				<table class="w-full text-sm">
					<thead class="border-b border-gray-200 text-left text-xs text-gray-500 uppercase">
						<tr>
							<th class="py-2 pr-4 font-bold">país</th>
							<th class="py-2 pr-4 font-bold">tipo</th>
							<th class="py-2 font-bold">cantidad</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{#each data.targetCountries as code (code)}
							{#each data.byCountry[code] ?? [] as row (code + row.type)}
								<tr>
									<td class="py-2 pr-4 text-gray-700">{countryNames[code]}</td>
									<td class="py-2 pr-4 font-mono text-xs">{row.type}</td>
									<td class="py-2 text-gray-700">{row.n}</td>
								</tr>
							{/each}
						{/each}
					</tbody>
					<tfoot class="border-t border-gray-200 text-sm">
						<tr>
							<td class="py-2 pr-4 font-bold" colspan="2">Total</td>
							<td class="py-2 font-bold">{data.total}</td>
						</tr>
					</tfoot>
				</table>
			</div>
		{/if}

		<div class="rounded border-l-4 border-blue-400 bg-blue-50 p-4 text-sm">
			<p class="mb-2 font-bold text-blue-900">Qué esperamos que la Fase 1 saque a la luz</p>
			<ul class="list-disc space-y-1 pl-5 text-blue-950">
				<li>
					Conceptos que generalizamos demasiado rápido — campos llenos en Chile y vacíos en
					todos los demás.
				</li>
				<li>
					Conceptos que nos perdimos — datos del país terminando en
					<code class="rounded bg-blue-100 px-1 text-xs">countrySpecific</code> por la misma
					razón en dos o más países.
				</li>
				<li>
					Consultas que deberían ser un solo join y resultan ser cinco — eso es el esquema
					diciéndonos que su forma está mal, incluso si todos los archivos cargan.
				</li>
			</ul>
		</div>
	</section>

	<!-- ─────────────────────────────── 6. Lo que deliberadamente no modelamos -->
	<section class="mb-14">
		<h2 class="mb-3 text-xl font-bold">6. Lo que deliberadamente no modelamos</h2>
		<p class="mb-4 text-gray-600">
			Los límites importan. Algunas cosas que podríamos haber construido y elegimos no
			construir:
		</p>
		<ul class="list-disc space-y-3 pl-5 text-sm">
			<li>
				<strong>Sin tabla de personas.</strong> Patrocinadores y autores se guardan como
				blobs JSON en cada documento. El día que alguien pregunte "todos los proyectos de la
				Diputada Pérez en los cinco países", lo levantamos a una tabla real — no antes.
			</li>
			<li>
				<strong>Sin ontología cross-país.</strong> La "Cámara de Diputados" de Chile y el
				"Congreso de los Diputados" de España son strings separados. AKN nos da el marco para
				vincularlos; no construimos el mapeo y no lo vamos a hacer hasta que una consulta
				lo necesite.
			</li>
			<li>
				<strong>Sin modelo de proceso.</strong> Registramos lo que pasó, no lo que
				<em>debería</em> pasar. Un modelo BPMN completo del proceso de cada país lo
				exploramos y lo dejamos en pausa.
			</li>
			<li>
				<strong>Sin normalización silenciosa.</strong> Cada etiqueta específica del país se
				preserva al lado de nuestra etiqueta normalizada. Nunca tiramos la voz del país.
			</li>
		</ul>
	</section>

	<footer class="mt-16 border-t border-gray-200 pt-6 text-sm text-gray-500">
		<p>
			Esquema activo:
			<a
				href="https://github.com/Parlamento-ai/diff.parlamento.ai/blob/main/research/schema/v3-schema.ts"
				class="text-blue-600 hover:underline"
				target="_blank"
				rel="noopener">research/schema/v3-schema.ts</a
			>. Plan de investigación:
			<a
				href="https://github.com/Parlamento-ai/diff.parlamento.ai/blob/main/research/schema/schema-research-plan.md"
				class="text-blue-600 hover:underline"
				target="_blank"
				rel="noopener">schema-research-plan.md</a
			>.
		</p>
	</footer>
</div>
