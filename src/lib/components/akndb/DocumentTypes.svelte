<script lang="ts">
	interface DocType {
		key: string;
		name: string;
		blurb: string;
		links: string[];
		color: string;
	}

	const types: DocType[] = [
		{
			key: 'bill',
			name: 'bill',
			blurb:
				'Proyecto de ley en trámite. El "commit propuesto" sobre una ley vigente. Es el centro del rito legislativo.',
			links: [
				'modifica un act (amendsActId)',
				'recibe amendments (indicaciones)',
				'genera change_sets (redlines)',
				'es discutido en debates',
				'aparece en citations (orden del día)',
				'puede ser referido por questions y communications'
			],
			color: 'blue'
		},
		{
			key: 'act',
			name: 'act',
			blurb:
				'Ley promulgada y vigente. Tiene versiones en el tiempo: cada modificación produce un nuevo XML consolidado.',
			links: [
				'modificada por bills y amendments',
				'publicada en un journal (publicationJournalId)',
				'interpretada o anulada por judgments',
				'mencionada por questions, communications y otros acts'
			],
			color: 'emerald'
		},
		{
			key: 'amendment',
			name: 'amendment',
			blurb:
				'Indicación a un proyecto: el cambio escrito propuesto sobre uno o varios artículos. No es el redline computado, es el texto de la propuesta.',
			links: [
				'apunta a un único bill (targetBillId) — no se pega directamente a un act',
				'puede ser la base de un change_set (redline computable)',
				'su votación queda registrada en un debate'
			],
			color: 'amber'
		},
		{
			key: 'change_set',
			name: 'change_set',
			blurb:
				'El redline computable de AKN-Diff. La extensión del proyecto: lo que AKN no tiene de forma nativa.',
			links: [
				'baseVersionId → versión XML "antes"',
				'resultVersionId → versión XML "después"',
				'una fila por artículo cambiado en article_changes',
				'opcionalmente trae el voteRecord asociado'
			],
			color: 'rose'
		},
		{
			key: 'debate',
			name: 'debate',
			blurb:
				'Sesión parlamentaria. La transcripción completa con cada speech vive dentro del XML; SQL solo guarda chamber + ventana de tiempo.',
			links: [
				'discute bills, amendments y questions',
				'contiene statements (intervenciones individuales)',
				'es la fuente de los voteRecords que aparecen en change_sets'
			],
			color: 'purple'
		},
		{
			key: 'citation',
			name: 'citation',
			blurb:
				'Orden del día / convocatoria. Tipo no nativo de AKN — lo agregamos para cubrir el lado operativo del rito.',
			links: [
				'lista bills, acts y otros documentos en su agenda',
				'convoca a un órgano (convenedBody) en una fecha programada',
				'precede a un debate'
			],
			color: 'teal'
		},
		{
			key: 'journal',
			name: 'journal',
			blurb:
				'Diario oficial / boletín de Estado. El acto de publicación que hace que una ley exista jurídicamente.',
			links: [
				'promulga acts (la fila ActTable.publicationJournalId apunta acá)',
				'puede publicar también communications, judgments y otros documentos oficiales'
			],
			color: 'gray'
		},
		{
			key: 'judgment',
			name: 'judgment',
			blurb: 'Fallo judicial que interpreta o anula una ley.',
			links: [
				'interpreta o deroga un act (link relation: interprets / replaces)',
				'cita otros judgments y acts',
				'puede ser publicado en un journal'
			],
			color: 'red'
		},
		{
			key: 'question',
			name: 'question',
			blurb:
				'Pregunta parlamentaria dirigida a un órgano del Ejecutivo. El target es texto libre porque varía mucho entre países.',
			links: [
				'puede referenciar bills o acts en su contenido',
				'recibe respuesta como otro question o como communication',
				'a veces se trata en un debate'
			],
			color: 'orange'
		},
		{
			key: 'communication',
			name: 'communication',
			blurb:
				'Comunicación oficial entre órganos (entre cámaras, entre Ejecutivo y Legislativo, etc.).',
			links: [
				'tiene fromBody y toBody como strings libres',
				'puede referirse a cualquier otro documento (refersToDocumentId)',
				'transmite bills entre cámaras, responde questions, etc.'
			],
			color: 'violet'
		},
		{
			key: 'document_collection',
			name: 'document_collection',
			blurb:
				'Dossier o expediente: una colección de documentos relacionados. Por ejemplo, todo lo asociado a un bill (proyecto + indicaciones + informes + debates).',
			links: [
				'anclada a un documento principal (anchorDocumentId)',
				'contiene N documentos vía links con relation="contains"',
				'puede mantenerse automáticamente o curarse a mano'
			],
			color: 'cyan'
		},
		{
			key: 'statement',
			name: 'statement',
			blurb:
				'Declaración individual de un parlamentario, fuera o dentro de un debate. Tipo minimalista.',
			links: [
				'normalmente vive dentro de un debate',
				'puede referirse a bills, acts o questions'
			],
			color: 'pink'
		},
		{
			key: 'portion',
			name: 'portion',
			blurb:
				'Un fragmento citable de otro documento — un artículo de un act, un párrafo de un bill. Permite linkear partes específicas sin duplicar el documento entero.',
			links: [
				'parentDocumentId apunta al documento del que es porción',
				'locator identifica qué parte'
			],
			color: 'stone'
		},
		{
			key: 'doc',
			name: 'doc',
			blurb:
				'Tipo genérico de AKN. Escape hatch para documentos que no encajan en ningún otro tipo (informes de comisión, reportes, anexos).',
			links: ['kind describe qué es; el resto vive en el XML'],
			color: 'slate'
		}
	];

	const colorClasses: Record<string, string> = {
		blue: 'border-blue-300 bg-blue-50',
		emerald: 'border-emerald-300 bg-emerald-50',
		amber: 'border-amber-300 bg-amber-50',
		rose: 'border-rose-300 bg-rose-50',
		purple: 'border-purple-300 bg-purple-50',
		teal: 'border-teal-300 bg-teal-50',
		gray: 'border-gray-300 bg-gray-50',
		red: 'border-red-300 bg-red-50',
		orange: 'border-orange-300 bg-orange-50',
		violet: 'border-violet-300 bg-violet-50',
		cyan: 'border-cyan-300 bg-cyan-50',
		pink: 'border-pink-300 bg-pink-50',
		stone: 'border-stone-300 bg-stone-50',
		slate: 'border-slate-300 bg-slate-50'
	};

	const badgeClasses: Record<string, string> = {
		blue: 'bg-blue-200 text-blue-900',
		emerald: 'bg-emerald-200 text-emerald-900',
		amber: 'bg-amber-200 text-amber-900',
		rose: 'bg-rose-200 text-rose-900',
		purple: 'bg-purple-200 text-purple-900',
		teal: 'bg-teal-200 text-teal-900',
		gray: 'bg-gray-200 text-gray-900',
		red: 'bg-red-200 text-red-900',
		orange: 'bg-orange-200 text-orange-900',
		violet: 'bg-violet-200 text-violet-900',
		cyan: 'bg-cyan-200 text-cyan-900',
		pink: 'bg-pink-200 text-pink-900',
		stone: 'bg-stone-200 text-stone-900',
		slate: 'bg-slate-200 text-slate-900'
	};
</script>

<div class="font-sans text-base leading-relaxed text-gray-800">
	<header class="mb-10">
		<h1 class="mb-3 text-3xl font-bold tracking-tight">Tipos de documento</h1>
		<p class="text-gray-600">
			AKN.db tiene <strong>14 tipos de documento</strong>, todos compartiendo la misma tabla
			<code class="rounded bg-gray-100 px-1 text-xs">diff_documents</code>. Cada tipo además
			tiene su propia tabla de detalle (<code class="rounded bg-gray-100 px-1 text-xs"
				>diff_bills</code
			>, <code class="rounded bg-gray-100 px-1 text-xs">diff_acts</code>, etc.) con las columnas
			extraídas del XML que el demo necesita en joins. Esta página explica qué representa cada
			uno y cómo se conectan entre ellos.
		</p>
	</header>

	<!-- ─────────────────────────── 1. Diagrama de relaciones -->
	<section class="mb-14">
		<h2 class="mb-3 text-xl font-bold">1. Cómo se conectan</h2>
		<p class="mb-2 text-sm text-gray-600">
			La mayoría de las relaciones pasan por el eje <strong>bill → act</strong>. Los demás tipos
			orbitan ese eje según su rol: la sala (debate, citation, statement), la publicación
			(journal), la revisión judicial (judgment), la comunicación con el Ejecutivo (question,
			communication) y los tipos estructurales que envuelven o fragmentan documentos
			(document_collection, portion, doc).
		</p>
		<p class="mb-6 text-sm text-gray-600">
			Las flechas sólidas son relaciones del modelo de la app — generalmente una FK directa,
			a veces invertida para legibilidad. Las flechas punteadas son relaciones inferidas del
			XML, de la tabla <code class="rounded bg-gray-100 px-1 text-xs">diff_document_links</code>
			o de convención de dominio.
		</p>

		<div class="overflow-x-auto rounded-lg border border-gray-200 bg-white p-4">
			<svg
				viewBox="0 0 1100 1000"
				class="mx-auto block w-full"
				style="min-width: 820px; max-width: 980px;"
				xmlns="http://www.w3.org/2000/svg"
				role="img"
				aria-label="Diagrama de relaciones entre los tipos de documento"
			>
				<defs>
					<marker
						id="arrow"
						viewBox="0 0 10 10"
						refX="9"
						refY="5"
						markerWidth="7"
						markerHeight="7"
						orient="auto-start-reverse"
					>
						<path d="M0,0 L10,5 L0,10 z" fill="#374151" />
					</marker>
					<marker
						id="arrow-light"
						viewBox="0 0 10 10"
						refX="9"
						refY="5"
						markerWidth="7"
						markerHeight="7"
						orient="auto-start-reverse"
					>
						<path d="M0,0 L10,5 L0,10 z" fill="#9ca3af" />
					</marker>
				</defs>

				<!--
					Layout: vertical hierarchy with generous spacing. The act is the apex
					of the legal world (top); the bill is the apex of the legislative
					ritual (middle); structural / generic types live at the bottom.
					Lanes are deliberately wide so arrow labels don't collide with boxes.

					Box width: 170, height: 64. Vertical spacing between rows: 130.
				-->

				<!-- ═════════════ TIER 0 — fragmento (encima del act) ═════════════ -->
				<!-- portion sits directly above the act so its "parte de" arrow is short. -->
				<g>
					<rect x="465" y="40" width="170" height="48" rx="8" fill="#f5f5f4" stroke="#57534e" stroke-width="2" />
					<text x="550" y="62" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="14" fill="#292524">portion</text>
					<text x="550" y="78" text-anchor="middle" font-size="10" fill="#292524">fragmento</text>
				</g>

				<!-- ═════════════ TIER 1 — el acto jurídico ═════════════ -->
				<!-- journal (left) — act (center) — judgment (right) -->
				<g>
					<rect x="80" y="120" width="170" height="64" rx="8" fill="#f3f4f6" stroke="#4b5563" stroke-width="2" />
					<text x="165" y="148" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="15" fill="#1f2937">journal</text>
					<text x="165" y="168" text-anchor="middle" font-size="11" fill="#1f2937">diario oficial</text>
				</g>
				<g>
					<rect x="465" y="120" width="170" height="64" rx="8" fill="#d1fae5" stroke="#047857" stroke-width="2" />
					<text x="550" y="148" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="15" fill="#064e3b">act</text>
					<text x="550" y="168" text-anchor="middle" font-size="11" fill="#064e3b">ley vigente</text>
				</g>
				<g>
					<rect x="850" y="120" width="170" height="64" rx="8" fill="#fee2e2" stroke="#b91c1c" stroke-width="2" />
					<text x="935" y="148" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="15" fill="#7f1d1d">judgment</text>
					<text x="935" y="168" text-anchor="middle" font-size="11" fill="#7f1d1d">fallo judicial</text>
				</g>

				<!-- ═════════════ TIER 2 — el proyecto ═════════════ -->
				<!-- bill (center) -->
				<g>
					<rect x="465" y="220" width="170" height="64" rx="8" fill="#dbeafe" stroke="#1d4ed8" stroke-width="2" />
					<text x="550" y="248" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="15" fill="#1e3a8a">bill</text>
					<text x="550" y="268" text-anchor="middle" font-size="11" fill="#1e3a8a">proyecto</text>
				</g>

				<!-- ═════════════ TIER 3 — alrededor del bill ═════════════ -->
				<!-- communication (far left) — amendment — citation — (right edge empty) -->
				<g>
					<rect x="80" y="380" width="170" height="64" rx="8" fill="#ede9fe" stroke="#5b21b6" stroke-width="2" />
					<text x="165" y="408" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="14" fill="#4c1d95">communication</text>
					<text x="165" y="428" text-anchor="middle" font-size="11" fill="#4c1d95">entre órganos</text>
				</g>
				<g>
					<rect x="290" y="380" width="170" height="64" rx="8" fill="#fef3c7" stroke="#b45309" stroke-width="2" />
					<text x="375" y="408" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="15" fill="#78350f">amendment</text>
					<text x="375" y="428" text-anchor="middle" font-size="11" fill="#78350f">indicación</text>
				</g>
				<g>
					<rect x="640" y="380" width="170" height="64" rx="8" fill="#ccfbf1" stroke="#0f766e" stroke-width="2" />
					<text x="725" y="408" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="15" fill="#134e4a">citation</text>
					<text x="725" y="428" text-anchor="middle" font-size="11" fill="#134e4a">orden del día</text>
				</g>

				<!-- ═════════════ TIER 4 — debajo de cada lateral ═════════════ -->
				<!-- question (under communication) — change_set (under amendment) — debate (under citation) -->
				<g>
					<rect x="80" y="540" width="170" height="64" rx="8" fill="#ffedd5" stroke="#c2410c" stroke-width="2" />
					<text x="165" y="568" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="14" fill="#7c2d12">question</text>
					<text x="165" y="588" text-anchor="middle" font-size="11" fill="#7c2d12">pregunta parl.</text>
				</g>
				<g>
					<rect x="290" y="540" width="170" height="64" rx="8" fill="#ffe4e6" stroke="#be123c" stroke-width="2" />
					<text x="375" y="568" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="15" fill="#881337">change_set</text>
					<text x="375" y="588" text-anchor="middle" font-size="11" fill="#881337">AKN-Diff redline</text>
				</g>
				<g>
					<rect x="640" y="540" width="170" height="64" rx="8" fill="#ede9fe" stroke="#6d28d9" stroke-width="2" />
					<text x="725" y="568" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="15" fill="#4c1d95">debate</text>
					<text x="725" y="588" text-anchor="middle" font-size="11" fill="#4c1d95">sesión</text>
				</g>

				<!-- ═════════════ TIER 5 — document_version & statement ═════════════ -->
				<g>
					<rect x="290" y="700" width="170" height="64" rx="8" fill="#e0e7ff" stroke="#4338ca" stroke-width="2" stroke-dasharray="4 3" />
					<text x="375" y="728" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="14" fill="#312e81">document_version</text>
					<text x="375" y="748" text-anchor="middle" font-size="11" fill="#312e81">snapshot XML</text>
				</g>
				<g>
					<rect x="640" y="700" width="170" height="64" rx="8" fill="#fce7f3" stroke="#be185d" stroke-width="2" />
					<text x="725" y="728" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="14" fill="#831843">statement</text>
					<text x="725" y="748" text-anchor="middle" font-size="11" fill="#831843">intervención</text>
				</g>

				<!-- ═════════════ TIER 6 — estructurales / escapes ═════════════ -->
				<!-- doc — document_collection — portion -->
				<g>
					<rect x="80" y="820" width="170" height="64" rx="8" fill="#f1f5f9" stroke="#334155" stroke-width="2" />
					<text x="165" y="848" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="15" fill="#0f172a">doc</text>
					<text x="165" y="868" text-anchor="middle" font-size="11" fill="#0f172a">genérico</text>
				</g>
				<g>
					<rect x="430" y="820" width="240" height="64" rx="8" fill="#cffafe" stroke="#0e7490" stroke-width="2" />
					<text x="550" y="848" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="15" fill="#155e75">document_collection</text>
					<text x="550" y="868" text-anchor="middle" font-size="11" fill="#155e75">dossier / expediente</text>
				</g>

				<!-- ═════════════ FLECHAS SÓLIDAS (core) ═════════════ -->

				<!-- journal → act : publica -->
				<g>
					<line x1="250" y1="152" x2="465" y2="152" stroke="#374151" stroke-width="2" marker-end="url(#arrow)" />
					<text x="357" y="144" text-anchor="middle" font-size="12" fill="#374151" font-style="italic">publica</text>
				</g>

				<!-- judgment → act : interpreta -->
				<g>
					<line x1="850" y1="152" x2="635" y2="152" stroke="#374151" stroke-width="2" marker-end="url(#arrow)" />
					<text x="742" y="144" text-anchor="middle" font-size="12" fill="#374151" font-style="italic">interpreta</text>
				</g>

				<!-- bill → act : modifica -->
				<g>
					<line x1="550" y1="220" x2="550" y2="184" stroke="#374151" stroke-width="2" marker-end="url(#arrow)" />
					<text x="560" y="206" font-size="12" fill="#374151" font-style="italic">modifica</text>
				</g>

				<!-- portion → act : parte de -->
				<g>
					<line x1="550" y1="88" x2="550" y2="120" stroke="#374151" stroke-width="2" marker-end="url(#arrow)" />
					<text x="560" y="108" font-size="12" fill="#374151" font-style="italic">parte de</text>
				</g>

				<!-- amendment → bill : indica -->
				<g>
					<line x1="430" y1="380" x2="490" y2="284" stroke="#374151" stroke-width="2" marker-end="url(#arrow)" />
					<text x="430" y="335" text-anchor="end" font-size="12" fill="#374151" font-style="italic">indica</text>
				</g>

				<!-- change_set → document_version : base/result -->
				<g>
					<line x1="375" y1="604" x2="375" y2="700" stroke="#374151" stroke-width="2" marker-end="url(#arrow)" />
					<text x="385" y="658" font-size="12" fill="#374151" font-style="italic">base/result</text>
				</g>

				<!-- document_collection → bill : ancla / agrupa
				     straight up the center lane (x=550 is clear of all left/right column boxes) -->
				<g>
					<line x1="550" y1="820" x2="550" y2="284" stroke="#374151" stroke-width="2" marker-end="url(#arrow)" />
					<text x="560" y="650" font-size="12" fill="#374151" font-style="italic">ancla / agrupa</text>
				</g>


				<!-- ═════════════ FLECHAS PUNTEADAS (inferidas) ═════════════ -->

				<!-- amendment → change_set : puede generar -->
				<g>
					<line x1="375" y1="444" x2="375" y2="540" stroke="#9ca3af" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#arrow-light)" />
					<text x="365" y="498" text-anchor="end" font-size="11" fill="#6b7280" font-style="italic">puede generar</text>
				</g>

				<!-- citation → bill : agenda cita -->
				<g>
					<line x1="640" y1="395" x2="635" y2="280" stroke="#9ca3af" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#arrow-light)" />
					<text x="645" y="345" font-size="11" fill="#6b7280" font-style="italic">agenda cita</text>
				</g>

				<!-- citation → debate : convoca / precede -->
				<g>
					<line x1="725" y1="444" x2="725" y2="540" stroke="#9ca3af" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#arrow-light)" />
					<text x="735" y="498" font-size="11" fill="#6b7280" font-style="italic">convoca / precede</text>
				</g>

				<!-- bill → debate : discutido en
				     drop down from right side of bill, then across to debate's top -->
				<g>
					<path
						d="M 615 284 L 615 510 L 725 510 L 725 540"
						fill="none"
						stroke="#9ca3af"
						stroke-width="1.5"
						stroke-dasharray="4 3"
						marker-end="url(#arrow-light)"
					/>
					<text x="625" y="500" font-size="11" fill="#6b7280" font-style="italic">discutido en</text>
				</g>

				<!-- statement → debate : contenido en -->
				<g>
					<line x1="725" y1="700" x2="725" y2="604" stroke="#9ca3af" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#arrow-light)" />
					<text x="735" y="658" font-size="11" fill="#6b7280" font-style="italic">contenido en</text>
				</g>

				<!-- communication → bill : transmite
				     up from communication, over the top of amendment, then onto bill's left -->
				<g>
					<path
						d="M 215 380 L 215 330 L 465 330"
						fill="none"
						stroke="#9ca3af"
						stroke-width="1.5"
						stroke-dasharray="4 3"
						marker-end="url(#arrow-light)"
					/>
					<text x="270" y="322" font-size="11" fill="#6b7280" font-style="italic">transmite</text>
				</g>

				<!-- question → communication : respondida por -->
				<g>
					<line x1="165" y1="540" x2="165" y2="444" stroke="#9ca3af" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#arrow-light)" />
					<text x="175" y="498" font-size="11" fill="#6b7280" font-style="italic">respondida por</text>
				</g>

				<!-- doc → document_collection : miembro de -->
				<g>
					<line x1="250" y1="852" x2="430" y2="852" stroke="#9ca3af" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#arrow-light)" />
					<text x="340" y="844" text-anchor="middle" font-size="11" fill="#6b7280" font-style="italic">miembro de</text>
				</g>
			</svg>
		</div>

		<div class="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-600">
			<div class="flex items-center gap-2">
				<svg width="36" height="10"
					><line x1="2" y1="5" x2="34" y2="5" stroke="#374151" stroke-width="2" /></svg
				>
				<span>relación del modelo (FK directa o invertida para legibilidad)</span>
			</div>
			<div class="flex items-center gap-2">
				<svg width="36" height="10"
					><line
						x1="2"
						y1="5"
						x2="34"
						y2="5"
						stroke="#9ca3af"
						stroke-width="1.5"
						stroke-dasharray="4 3"
					/></svg
				>
				<span
					>inferida del XML, de <code class="rounded bg-gray-100 px-1">diff_document_links</code>
					o por convención</span
				>
			</div>
		</div>

		<div class="mt-6 rounded border-l-4 border-blue-400 bg-blue-50 p-4 text-sm">
			<p class="mb-2 font-bold text-blue-900">Notas para leer el diagrama</p>
			<ol class="list-decimal space-y-1 pl-5 text-blue-950">
				<li>
					Tipos nativos de AKN: <code class="rounded bg-blue-100 px-1 text-xs">act</code>,
					<code class="rounded bg-blue-100 px-1 text-xs">bill</code>,
					<code class="rounded bg-blue-100 px-1 text-xs">amendment</code>,
					<code class="rounded bg-blue-100 px-1 text-xs">debate</code>,
					<code class="rounded bg-blue-100 px-1 text-xs">judgment</code>,
					<code class="rounded bg-blue-100 px-1 text-xs">officialGazette</code>,
					<code class="rounded bg-blue-100 px-1 text-xs">documentCollection</code>,
					<code class="rounded bg-blue-100 px-1 text-xs">portion</code>,
					<code class="rounded bg-blue-100 px-1 text-xs">statement</code>,
					<code class="rounded bg-blue-100 px-1 text-xs">doc</code>.
				</li>
				<li>
					En esta app, <code class="rounded bg-blue-100 px-1 text-xs">journal</code> mapea al
					<code class="rounded bg-blue-100 px-1 text-xs">officialGazette</code> de AKN.
				</li>
				<li>
					<code class="rounded bg-blue-100 px-1 text-xs">citation</code>,
					<code class="rounded bg-blue-100 px-1 text-xs">question</code> y
					<code class="rounded bg-blue-100 px-1 text-xs">communication</code> los promovimos a
					tipos de documento de primera clase, aunque en AKN puedan aparecer como elementos
					dentro de otras estructuras.
				</li>
				<li>
					<code class="rounded bg-blue-100 px-1 text-xs">change_set</code> es una extensión de
					AKN-Diff, no un tipo nativo de AKN.
				</li>
				<li>
					<code class="rounded bg-blue-100 px-1 text-xs">change_set</code> apunta a versiones
					de documento (<code class="rounded bg-blue-100 px-1 text-xs">document_version</code
					>), no estrictamente a un bill o act.
				</li>
				<li>
					El XML de AKN es la fuente de verdad; las columnas SQL son proyecciones / índices
					para consultas frecuentes.
				</li>
			</ol>
		</div>
	</section>

	<!-- ─────────────────────────── 2. La lista -->
	<section class="mb-14">
		<h2 class="mb-4 text-xl font-bold">2. Los 14 tipos</h2>
		<p class="mb-6 text-sm text-gray-600">
			Ordenados por centralidad en el rito: primero los del corazón legislativo (bill, act,
			amendment, change_set), después la sala (debate, citation), publicación y revisión
			(journal, judgment), comunicación (question, communication), y finalmente los tipos
			estructurales y los escapes.
		</p>

		<div class="space-y-3">
			{#each types as t (t.key)}
				<article
					class="rounded-lg border-l-4 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] {colorClasses[
						t.color
					]}"
				>
					<header class="mb-2 flex items-baseline gap-3">
						<span
							class="rounded px-2 py-0.5 font-mono text-xs font-bold {badgeClasses[t.color]}"
						>
							{t.name}
						</span>
					</header>
					<p class="mb-3 text-sm text-gray-800">{t.blurb}</p>
					{#if t.links.length > 0}
						<div>
							<p class="mb-1 text-xs font-bold tracking-wider text-gray-500 uppercase">
								Se relaciona con
							</p>
							<ul class="list-disc space-y-0.5 pl-5 text-sm text-gray-700">
								{#each t.links as link (link)}
									<li>{link}</li>
								{/each}
							</ul>
						</div>
					{/if}
				</article>
			{/each}
		</div>
	</section>
	<!-- ─────────────────────────── 3. Notas y aclaraciones -->
	<section class="mb-14">
		<h2 class="mb-3 text-xl font-bold">3. Aclaraciones útiles</h2>

		<div class="space-y-4">
			<div class="rounded border-l-4 border-amber-400 bg-amber-50 p-4 text-sm">
				<p class="mb-2 font-bold text-amber-900">¿Una indicación puede pegarse a un act?</p>
				<p class="text-amber-950">
					En nuestro esquema, no. <code class="rounded bg-amber-100 px-1 text-xs">amendment</code>
					tiene un único <code class="rounded bg-amber-100 px-1 text-xs">targetBillId</code>:
					modifica el texto del proyecto antes de que sea ley. Una vez promulgado el act, las
					modificaciones posteriores se hacen vía un <em>nuevo</em> bill que apunta al act con
					<code class="rounded bg-amber-100 px-1 text-xs">amendsActId</code>. Es la
					separación clásica de AKN: el amendment es un acto del trámite legislativo, no una
					modificación a la ley vigente.
				</p>
			</div>

			<div class="rounded border-l-4 border-rose-400 bg-rose-50 p-4 text-sm">
				<p class="mb-2 font-bold text-rose-900">change_set vs amendment</p>
				<p class="text-rose-950">
					El <code class="rounded bg-rose-100 px-1 text-xs">amendment</code> es el "mensaje de
					commit": prosa libre que dice "reemplázase la frase X por Y". El
					<code class="rounded bg-rose-100 px-1 text-xs">change_set</code> es el diff
					computado, con punteros a las dos versiones XML (antes/después) y una fila por
					artículo cambiado. Un amendment <em>puede</em> generar un change_set; un change_set
					puede existir sin amendment (p.ej. el redline de la consolidación final de un act).
				</p>
			</div>

			<div class="rounded border-l-4 border-blue-400 bg-blue-50 p-4 text-sm">
				<p class="mb-2 font-bold text-blue-900">Las relaciones débiles viven en links</p>
				<p class="text-blue-950">
					El diagrama solo muestra las relaciones fuertes. Cualquier <code
						class="rounded bg-blue-100 px-1 text-xs">&lt;ref href="..."&gt;</code
					>
					dentro del XML genera una fila en
					<code class="rounded bg-blue-100 px-1 text-xs">diff_document_links</code> con su
					<code class="rounded bg-blue-100 px-1 text-xs">relation</code> (mentions, cites,
					refers_to, responds_to, etc.). Eso significa que <em>cualquier</em> tipo puede
					mencionar a cualquier otro — el grafo real es mucho más denso de lo que muestra el
					diagrama.
				</p>
			</div>

			<div class="rounded border-l-4 border-gray-400 bg-gray-50 p-4 text-sm">
				<p class="mb-2 font-bold text-gray-900">Tipos no nativos de AKN</p>
				<p class="text-gray-700">
					<code class="rounded bg-gray-100 px-1 text-xs">citation</code>,
					<code class="rounded bg-gray-100 px-1 text-xs">question</code> y
					<code class="rounded bg-gray-100 px-1 text-xs">communication</code> los agregamos
					nosotros para cubrir el lado operativo del rito. AKN core no los modela porque no
					son "jurídicamente relevantes" en sentido estricto. Más detalle en el changelog del
					03/02 y 04/02 del README.
				</p>
			</div>
		</div>
	</section>

	<footer class="mt-16 border-t border-gray-200 pt-6 text-sm text-gray-500">
		<p>
			Definidos en
			<a
				href="https://github.com/Parlamento-ai/diff.parlamento.ai/blob/main/research/schema/v3-schema.ts"
				class="text-blue-600 hover:underline"
				target="_blank"
				rel="noopener">research/schema/v3-schema.ts</a
			>
			como el union <code class="rounded bg-gray-100 px-1 text-xs">DocumentType</code>.
		</p>
	</footer>
</div>
