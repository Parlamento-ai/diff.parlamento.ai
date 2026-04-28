<script lang="ts">
	// All examples on this page are synthetic — they illustrate the schema,
	// they don't read from research.db. We'll wire it to real data once the
	// build script seeds enough of the supporting cast (amendments, journals,
	// judgments). For now, prose + diagrams.
</script>

<svelte:head>
	<title>How the schema works — research demo</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-6 py-10 font-sans text-base leading-relaxed text-gray-800">
	<a href="/demo" class="text-sm text-blue-600 hover:underline">← back to demo</a>

	<header class="mt-6 mb-10">
		<h1 class="mb-3 text-3xl font-bold tracking-tight">How the schema works</h1>
		<p class="text-gray-600">
			We follow one Chilean bill — <strong>boletín 12345-07</strong> — from someone proposing it
			to it becoming a law printed in the <em>Diario Oficial</em>. Every concept in the schema
			gets introduced as it shows up in the story. No SQL.
		</p>
	</header>

	<!-- ─────────────────────────────── 1. The big idea -->
	<section class="mb-14">
		<h2 class="mb-3 text-xl font-bold">1. The big idea</h2>
		<p class="mb-4">
			A parliament produces <strong>documents</strong>. Documents <strong>point at each other</strong>.
			Documents have <strong>versions</strong>. That's the whole schema. Everything below is
			variations on those three ideas.
		</p>

		<div class="my-6 rounded border border-gray-200 bg-gray-50 p-6">
			<svg viewBox="0 0 700 220" class="w-full" xmlns="http://www.w3.org/2000/svg">
				<defs>
					<marker
						id="arrowhead"
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

				<!-- Document A with version stack -->
				<g>
					<rect
						x="80"
						y="80"
						width="180"
						height="80"
						rx="6"
						fill="#fff"
						stroke="#374151"
						stroke-width="2"
					/>
					<text x="170" y="115" text-anchor="middle" font-weight="bold" font-size="16"
						>A document</text
					>
					<text x="170" y="138" text-anchor="middle" font-size="12" fill="#6b7280"
						>(a bill, an act, a journal…)</text
					>
					<!-- Version stack lines behind -->
					<rect
						x="86"
						y="74"
						width="180"
						height="80"
						rx="6"
						fill="none"
						stroke="#9ca3af"
						stroke-dasharray="2 2"
					/>
					<rect
						x="92"
						y="68"
						width="180"
						height="80"
						rx="6"
						fill="none"
						stroke="#d1d5db"
						stroke-dasharray="2 2"
					/>
					<text x="290" y="78" font-size="11" fill="#6b7280">v1, v2, v3 …</text>
				</g>

				<!-- Arrow to Document B -->
				<line
					x1="270"
					y1="120"
					x2="430"
					y2="120"
					stroke="#374151"
					stroke-width="2"
					marker-end="url(#arrowhead)"
				/>
				<text x="350" y="110" text-anchor="middle" font-size="12" fill="#374151" font-weight="500"
					>points at</text
				>

				<!-- Document B -->
				<g>
					<rect
						x="440"
						y="80"
						width="180"
						height="80"
						rx="6"
						fill="#fff"
						stroke="#374151"
						stroke-width="2"
					/>
					<text x="530" y="115" text-anchor="middle" font-weight="bold" font-size="16"
						>Another document</text
					>
					<text x="530" y="138" text-anchor="middle" font-size="12" fill="#6b7280"
						>(of any other type)</text
					>
				</g>
			</svg>
		</div>

		<p class="text-sm text-gray-500">
			A document is the unit. A pointer between documents is the connective tissue. A new version
			is what we save when a document's text changes — we never overwrite. That's it.
		</p>
	</section>

	<!-- ─────────────────────────────── 2. Meet the cast -->
	<section class="mb-14">
		<h2 class="mb-3 text-xl font-bold">2. Meet the cast</h2>
		<p class="mb-6 text-gray-600">
			Each box below is one type of document the schema knows about. They're introduced in the
			order they show up in our running story.
		</p>

		<!-- The Bill -->
		<article class="mb-6 rounded border border-gray-200 bg-white p-5">
			<header class="mb-3">
				<h3 class="text-lg font-bold">The Bill — <em>someone proposes a change</em></h3>
				<p class="text-sm text-gray-500">
					A proposal to create a new law or modify an existing one.
				</p>
			</header>
			<div class="rounded bg-amber-50 p-3 text-sm">
				<p class="mb-1 font-bold text-amber-900">Example</p>
				<p class="text-amber-950">
					<strong>Boletín 12345-07</strong> — "Modifica la ley N° 21.000 para fortalecer la
					protección de datos personales", proposed by Diputada Pérez and Diputado Soto in
					August 2025.
				</p>
			</div>
			<p class="mt-3 mb-1 text-sm font-bold text-gray-700">What we track about it</p>
			<ul class="list-disc space-y-1 pl-5 text-sm">
				<li>Who proposed it (name, party, chamber).</li>
				<li>When it was submitted, and what stage it's at right now.</li>
				<li>Whether it modifies an existing law, and which one.</li>
				<li>Its urgency tier (in Chile: simple, suma, discusión inmediata).</li>
			</ul>
		</article>

		<!-- Bill events -->
		<article class="mb-6 rounded border border-gray-200 bg-white p-5">
			<header class="mb-3">
				<h3 class="text-lg font-bold">The Bill's trámite — <em>each step on the way</em></h3>
				<p class="text-sm text-gray-500">
					A timeline of every observed step the bill goes through.
				</p>
			</header>
			<div class="rounded bg-amber-50 p-3 text-sm">
				<p class="mb-1 font-bold text-amber-900">Example — boletín 12345-07's trámite</p>
				<ol class="list-decimal space-y-1 pl-5 text-amber-950">
					<li>Aug 12, 2025 — Ingreso del proyecto (Cámara).</li>
					<li>Oct 3, 2025 — Primer informe de la Comisión de Futuro.</li>
					<li>Dec 18, 2025 — Aprobado en general y particular (Senado).</li>
					<li>Jan 15, 2026 — Promulgada como Ley 21.567.</li>
				</ol>
			</div>
			<p class="mt-3 text-sm">
				It's append-only — we never go back and edit a step, we just add the next one. Sub-products
				of a step (a comisión report, a vote record, a batch of indicaciones) become their own
				documents and link back to the event.
			</p>
		</article>

		<!-- The Act -->
		<article class="mb-6 rounded border border-gray-200 bg-white p-5">
			<header class="mb-3">
				<h3 class="text-lg font-bold">The Act — <em>the existing law being modified</em></h3>
				<p class="text-sm text-gray-500">A law that has been promulgated and is in force.</p>
			</header>
			<div class="rounded bg-amber-50 p-3 text-sm">
				<p class="mb-1 font-bold text-amber-900">Example</p>
				<p class="text-amber-950">
					<strong>Ley 21.000</strong> — "Sobre protección de la vida privada y datos personales",
					promulgated in March 2018, in force since April 2018. This is the law that boletín
					12345-07 wants to amend.
				</p>
			</div>
			<p class="mt-3 mb-1 text-sm font-bold text-gray-700">What we track about it</p>
			<ul class="list-disc space-y-1 pl-5 text-sm">
				<li>When it was promulgated, when it took effect, when (if ever) it was repealed.</li>
				<li>Who issued it (Congreso, Presidente, an EU institution…).</li>
				<li>Whether it's still in force, partially repealed, or superseded.</li>
				<li>Where it was officially published — i.e. which Journal entry.</li>
			</ul>
		</article>

		<!-- The Amendment -->
		<article class="mb-6 rounded border border-gray-200 bg-white p-5">
			<header class="mb-3">
				<h3 class="text-lg font-bold">The Amendment — <em>a tweak proposed mid-flight</em></h3>
				<p class="text-sm text-gray-500">
					A modification to a bill while it's still being debated. In Chile: an
					<em>indicación</em>.
				</p>
			</header>
			<div class="rounded bg-amber-50 p-3 text-sm">
				<p class="mb-1 font-bold text-amber-900">Example — synthetic</p>
				<p class="text-amber-950">
					During the debate on boletín 12345-07, Senadora Núñez proposes:
				</p>
				<p class="mt-2 text-amber-950">
					<em>"In article 3, replace 'sanción de UF 100' with 'sanción de UF 500'."</em>
				</p>
				<p class="mt-2 text-amber-950">
					Justification: the original fine is too low to deter large companies. The amendment
					targets boletín 12345-07, was voted on Dec 5, 2025, and was approved.
				</p>
			</div>
			<p class="mt-3 mb-1 text-sm font-bold text-gray-700">What we track about it</p>
			<ul class="list-disc space-y-1 pl-5 text-sm">
				<li>What bill it targets, and which article inside that bill.</li>
				<li>The old text, the new text, and the proposer's justification.</li>
				<li>Who proposed it, when it was submitted.</li>
				<li>How the vote went — for, against, abstain — and the final outcome.</li>
			</ul>
		</article>

		<!-- The Journal -->
		<article class="mb-6 rounded border border-gray-200 bg-white p-5">
			<header class="mb-3">
				<h3 class="text-lg font-bold">
					The Journal — <em>the official gazette where laws get published</em>
				</h3>
				<p class="text-sm text-gray-500">
					An issue of the official publication of record. The legal moment a law becomes real.
				</p>
			</header>
			<div class="rounded bg-amber-50 p-3 text-sm">
				<p class="mb-1 font-bold text-amber-900">Example</p>
				<p class="text-amber-950">
					<strong>DO-2026-01-15</strong> — issue 43.521 of the Diario Oficial de la República
					de Chile. This issue contains, among other things, the promulgated text of Ley 21.567
					(the new law that boletín 12345-07 became).
				</p>
			</div>
			<p class="mt-3 text-sm">
				A journal issue is itself a document, and its contents are <em>other</em> documents
				linked to it. One issue might publish a dozen acts, decrees, and notices in a specific
				order — that ordering matters legally, and we preserve it.
			</p>
		</article>

		<!-- Supporting cast -->
		<h3 class="mt-10 mb-2 text-base font-bold">Supporting cast</h3>
		<p class="mb-4 text-sm text-gray-600">
			These show up less often in our running story but are part of the same cast.
		</p>
		<dl class="space-y-3 rounded border border-gray-200 bg-white p-5 text-sm">
			<div>
				<dt class="font-bold">Question</dt>
				<dd class="text-gray-700">
					A formal query a parliamentarian asks an executive body — "Minister, what's the
					status of program X?" — usually with a statutory deadline for the response.
				</dd>
			</div>
			<div>
				<dt class="font-bold">Communication</dt>
				<dd class="text-gray-700">
					An official letter between institutions: chamber to senate, executive to
					legislature, etc. Mostly a transmission of, or reference to, another document.
				</dd>
			</div>
			<div>
				<dt class="font-bold">Judgment</dt>
				<dd class="text-gray-700">
					A court decision — useful when courts strike down or interpret a law. Linked back
					to the act it interprets.
				</dd>
			</div>
			<div>
				<dt class="font-bold">Debate</dt>
				<dd class="text-gray-700">
					The transcript of a legislative session. We keep a thin pointer here; the actual
					transcript content lives in the main parlamento.ai app.
				</dd>
			</div>
			<div>
				<dt class="font-bold">Citation</dt>
				<dd class="text-gray-700">
					The agenda of a session — when, where, and what's on the docket. Like the debate, a
					thin pointer.
				</dd>
			</div>
			<div>
				<dt class="font-bold">Document collection</dt>
				<dd class="text-gray-700">
					A folder. Groups related documents into a navigable package — e.g. "everything
					connected to boletín 12345-07": the bill, its informes, its indicaciones, the
					debate, the final law, the journal entry.
				</dd>
			</div>
		</dl>
	</section>

	<!-- ─────────────────────────────── 3. How they connect -->
	<section class="mb-14">
		<h2 class="mb-3 text-xl font-bold">3. How they connect</h2>
		<p class="mb-4">
			Anything in the schema can point at anything else. Each pointer has a <strong>type</strong>
			— a verb that says what kind of relationship it is. The pointers, taken together, form a
			graph that you can navigate like the web.
		</p>

		<p class="mb-3 text-sm text-gray-600">
			Reading our running story as sentences:
		</p>
		<ul class="mb-6 list-disc space-y-2 pl-5 text-sm">
			<li>
				<em>Boletín 12345-07</em>
				<span class="mx-1 rounded bg-blue-100 px-2 py-0.5 font-mono text-xs text-blue-900"
					>amends</span
				>
				<em>Ley 21.000</em>
			</li>
			<li>
				<em>Indicación de la Senadora Núñez</em>
				<span class="mx-1 rounded bg-blue-100 px-2 py-0.5 font-mono text-xs text-blue-900"
					>modifies</span
				>
				<em>boletín 12345-07</em>
			</li>
			<li>
				<em>Diario Oficial DO-2026-01-15</em>
				<span class="mx-1 rounded bg-blue-100 px-2 py-0.5 font-mono text-xs text-blue-900"
					>promulgates</span
				>
				<em>Ley 21.567 (the new act)</em>
			</li>
			<li>
				<em>Boletín 12345-07</em>
				<span class="mx-1 rounded bg-blue-100 px-2 py-0.5 font-mono text-xs text-blue-900"
					>cites</span
				>
				<em>Sentencia Rol 8421-2024</em>
			</li>
			<li>
				<em>Oficio N° 234 de la Cámara</em>
				<span class="mx-1 rounded bg-blue-100 px-2 py-0.5 font-mono text-xs text-blue-900"
					>transmits</span
				>
				<em>boletín 12345-07 al Senado</em>
			</li>
		</ul>

		<!-- Graph diagram -->
		<div class="my-6 rounded border border-gray-200 bg-gray-50 p-6">
			<p class="mb-3 text-xs text-gray-500">
				The same story as a graph — five documents, five typed pointers between them.
			</p>
			<svg viewBox="0 0 720 360" class="w-full" xmlns="http://www.w3.org/2000/svg">
				<defs>
					<marker
						id="arrow3"
						viewBox="0 0 10 10"
						refX="9"
						refY="5"
						markerWidth="6"
						markerHeight="6"
						orient="auto-start-reverse"
					>
						<path d="M0,0 L10,5 L0,10 z" fill="#1e40af" />
					</marker>
				</defs>

				<!-- Boletín 12345-07 (center-left) -->
				<g>
					<rect
						x="40"
						y="140"
						width="160"
						height="60"
						rx="6"
						fill="#fff"
						stroke="#374151"
						stroke-width="2"
					/>
					<text x="120" y="165" text-anchor="middle" font-weight="bold" font-size="13"
						>Boletín 12345-07</text
					>
					<text x="120" y="183" text-anchor="middle" font-size="11" fill="#6b7280">bill</text>
				</g>

				<!-- Ley 21.000 (right) -->
				<g>
					<rect
						x="500"
						y="140"
						width="160"
						height="60"
						rx="6"
						fill="#fff"
						stroke="#374151"
						stroke-width="2"
					/>
					<text x="580" y="165" text-anchor="middle" font-weight="bold" font-size="13"
						>Ley 21.000</text
					>
					<text x="580" y="183" text-anchor="middle" font-size="11" fill="#6b7280">act</text>
				</g>

				<!-- Indicación (above-left) -->
				<g>
					<rect
						x="40"
						y="20"
						width="160"
						height="60"
						rx="6"
						fill="#fff"
						stroke="#374151"
						stroke-width="2"
					/>
					<text x="120" y="45" text-anchor="middle" font-weight="bold" font-size="13"
						>Indicación Núñez</text
					>
					<text x="120" y="63" text-anchor="middle" font-size="11" fill="#6b7280"
						>amendment</text
					>
				</g>

				<!-- Diario Oficial (right) -->
				<g>
					<rect
						x="500"
						y="20"
						width="160"
						height="60"
						rx="6"
						fill="#fff"
						stroke="#374151"
						stroke-width="2"
					/>
					<text x="580" y="45" text-anchor="middle" font-weight="bold" font-size="13"
						>DO-2026-01-15</text
					>
					<text x="580" y="63" text-anchor="middle" font-size="11" fill="#6b7280">journal</text>
				</g>

				<!-- Sentencia (bottom) -->
				<g>
					<rect
						x="270"
						y="280"
						width="180"
						height="60"
						rx="6"
						fill="#fff"
						stroke="#374151"
						stroke-width="2"
					/>
					<text x="360" y="305" text-anchor="middle" font-weight="bold" font-size="13"
						>Rol 8421-2024</text
					>
					<text x="360" y="323" text-anchor="middle" font-size="11" fill="#6b7280">judgment</text
					>
				</g>

				<!-- Indicación → boletín  (modifies) -->
				<line
					x1="120"
					y1="80"
					x2="120"
					y2="138"
					stroke="#1e40af"
					stroke-width="1.5"
					marker-end="url(#arrow3)"
				/>
				<text x="125" y="115" font-size="11" fill="#1e40af">modifies</text>

				<!-- Boletín → ley (amends) -->
				<line
					x1="200"
					y1="170"
					x2="498"
					y2="170"
					stroke="#1e40af"
					stroke-width="1.5"
					marker-end="url(#arrow3)"
				/>
				<text x="349" y="160" text-anchor="middle" font-size="11" fill="#1e40af">amends</text>

				<!-- Diario → ley (promulgates) -->
				<line
					x1="580"
					y1="80"
					x2="580"
					y2="138"
					stroke="#1e40af"
					stroke-width="1.5"
					marker-end="url(#arrow3)"
				/>
				<text x="585" y="115" font-size="11" fill="#1e40af">promulgates</text>

				<!-- Boletín → sentencia (cites) -->
				<line
					x1="180"
					y1="200"
					x2="290"
					y2="280"
					stroke="#1e40af"
					stroke-width="1.5"
					marker-end="url(#arrow3)"
				/>
				<text x="200" y="250" font-size="11" fill="#1e40af">cites</text>
			</svg>
		</div>

		<h3 class="mt-8 mb-2 text-base font-bold">All the relationship verbs we use</h3>
		<p class="mb-3 text-sm text-gray-600">
			Twelve verbs cover everything we've seen so far. They're directional — "A
			<code class="rounded bg-gray-100 px-1 text-xs">amends</code> B" is different from "B
			<code class="rounded bg-gray-100 px-1 text-xs">amends</code> A".
		</p>
		<dl class="grid grid-cols-1 gap-x-6 gap-y-2 rounded border border-gray-200 bg-white p-5 text-sm sm:grid-cols-2">
			<div>
				<dt class="font-mono text-xs font-bold text-blue-900">amends</dt>
				<dd class="text-gray-700">a bill that proposes to change an act</dd>
			</div>
			<div>
				<dt class="font-mono text-xs font-bold text-blue-900">modifies</dt>
				<dd class="text-gray-700">an indicación changing a bill</dd>
			</div>
			<div>
				<dt class="font-mono text-xs font-bold text-blue-900">promulgates</dt>
				<dd class="text-gray-700">a journal issue making a law official</dd>
			</div>
			<div>
				<dt class="font-mono text-xs font-bold text-blue-900">contains</dt>
				<dd class="text-gray-700">a journal or dossier holding other docs</dd>
			</div>
			<div>
				<dt class="font-mono text-xs font-bold text-blue-900">refers_to</dt>
				<dd class="text-gray-700">a generic "this is about that"</dd>
			</div>
			<div>
				<dt class="font-mono text-xs font-bold text-blue-900">cites</dt>
				<dd class="text-gray-700">an explicit citation in the text</dd>
			</div>
			<div>
				<dt class="font-mono text-xs font-bold text-blue-900">mentions</dt>
				<dd class="text-gray-700">a softer, in-passing reference</dd>
			</div>
			<div>
				<dt class="font-mono text-xs font-bold text-blue-900">replaces</dt>
				<dd class="text-gray-700">a new act fully superseding an old one</dd>
			</div>
			<div>
				<dt class="font-mono text-xs font-bold text-blue-900">consolidates</dt>
				<dd class="text-gray-700">a "clean" version merging an act + its amendments</dd>
			</div>
			<div>
				<dt class="font-mono text-xs font-bold text-blue-900">derives_from</dt>
				<dd class="text-gray-700">one document came out of another</dd>
			</div>
			<div>
				<dt class="font-mono text-xs font-bold text-blue-900">interprets</dt>
				<dd class="text-gray-700">a court ruling on what a law means</dd>
			</div>
			<div>
				<dt class="font-mono text-xs font-bold text-blue-900">responds_to</dt>
				<dd class="text-gray-700">an answer to a parliamentary question</dd>
			</div>
			<div>
				<dt class="font-mono text-xs font-bold text-blue-900">transmits</dt>
				<dd class="text-gray-700">a communication carrying another document</dd>
			</div>
		</dl>
	</section>

	<!-- ─────────────────────────────── 4. Versions and changes -->
	<section class="mb-14">
		<h2 class="mb-3 text-xl font-bold">4. Versions and changes</h2>
		<p class="mb-4">
			The novelty in this project is the part where we track <em>what actually changed</em>.
			Akoma Ntoso (the standard we're inspired by) doesn't have a computable diff between two
			versions of a law — that's the gap we filled with what we called <em>AKN Diff</em>.
		</p>

		<p class="mb-4">
			The idea is simple. A document like an act has multiple <strong>versions</strong> over
			time: version 1 is the original 2018 text, version 2 is what it looks like after our
			boletín passes. Between two versions, we store a <strong>change set</strong> — a list of
			"this article used to say X, now it says Y."
		</p>

		<div class="my-6 rounded border border-gray-200 bg-gray-50 p-6">
			<svg viewBox="0 0 720 200" class="w-full" xmlns="http://www.w3.org/2000/svg">
				<defs>
					<marker
						id="arrow4"
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

				<!-- Act v1 -->
				<g>
					<rect
						x="40"
						y="60"
						width="200"
						height="80"
						rx="6"
						fill="#fff"
						stroke="#374151"
						stroke-width="2"
					/>
					<text x="140" y="90" text-anchor="middle" font-weight="bold" font-size="14"
						>Ley 21.000 — v1</text
					>
					<text x="140" y="110" text-anchor="middle" font-size="11" fill="#6b7280"
						>(2018, original)</text
					>
					<text x="140" y="125" text-anchor="middle" font-size="10" fill="#9ca3af"
						>art. 3: "sanción de UF 100"</text
					>
				</g>

				<!-- Change set arrow -->
				<g>
					<line
						x1="240"
						y1="100"
						x2="480"
						y2="100"
						stroke="#374151"
						stroke-width="2"
						marker-end="url(#arrow4)"
					/>
					<rect
						x="280"
						y="60"
						width="160"
						height="60"
						rx="6"
						fill="#fef3c7"
						stroke="#b45309"
						stroke-width="1.5"
					/>
					<text x="360" y="85" text-anchor="middle" font-weight="bold" font-size="13"
						>change set</text
					>
					<text x="360" y="105" text-anchor="middle" font-size="11" fill="#92400e"
						>art. 3: UF 100 → 500</text
					>
				</g>

				<!-- Act v2 -->
				<g>
					<rect
						x="480"
						y="60"
						width="200"
						height="80"
						rx="6"
						fill="#fff"
						stroke="#374151"
						stroke-width="2"
					/>
					<text x="580" y="90" text-anchor="middle" font-weight="bold" font-size="14"
						>Ley 21.000 — v2</text
					>
					<text x="580" y="110" text-anchor="middle" font-size="11" fill="#6b7280"
						>(2026, after boletín)</text
					>
					<text x="580" y="125" text-anchor="middle" font-size="10" fill="#9ca3af"
						>art. 3: "sanción de UF 500"</text
					>
				</g>
			</svg>
		</div>

		<p class="mb-4 text-sm">
			A change set has one row per modified article. Each row is one of: <em>modify</em>,
			<em>insert</em>, <em>repeal</em>, <em>renumber</em>, <em>renumber + modify</em>, or
			<em>replace block</em>. With those building blocks we can reconstruct any state of the law
			from any earlier state, by replaying the change sets in order.
		</p>

		<p class="text-sm text-gray-600">
			One quirk: an amendment that's <em>still being debated</em> has a change set with no
			"result" version yet — we know what's <em>proposed</em>, not what'll be consolidated. So
			the result version is optional; the base version is required.
		</p>
	</section>

	<!-- ─────────────────────────────── 5. What we left out -->
	<section class="mb-14">
		<h2 class="mb-3 text-xl font-bold">5. What we deliberately left out</h2>
		<p class="mb-4 text-gray-600">
			The schema is research-grade. A few things we could have modeled more rigorously, on
			purpose didn't:
		</p>
		<ul class="list-disc space-y-3 pl-5 text-sm">
			<li>
				<strong>No persons table.</strong> Sponsors, amendment proposers, and questioners are
				stored as JSON blobs on each document. The day a customer asks "all bills by Diputada
				Pérez across countries", we'll lift this into a real table.
			</li>
			<li>
				<strong>No cross-country ontology.</strong> Chile's "Cámara de Diputados" and Spain's
				"Congreso de los Diputados" are separate strings, not linked concepts. AKN gives us the
				framework to do this; we haven't built the mapping.
			</li>
			<li>
				<strong>No process model.</strong> The trámite log captures what happened, not what
				<em>should</em> happen. A full BPMN model of each country's ritual is out of scope for
				now (we explored it on Feb 10 and parked it).
			</li>
			<li>
				<strong>No status translations.</strong> The UI translates from a fixed set of
				statuses; the country's own phrasing is preserved alongside, never normalized away.
			</li>
			<li>
				<strong>A "country specific" dumping ground.</strong> When a country tracks something
				we don't have a home for, it goes into a free-form blob on the document. Watching what
				accumulates there is how we'll discover new shared fields. Once the same shape shows up
				in 2+ countries, we promote it to a real column.
			</li>
		</ul>
	</section>

	<footer class="mt-16 border-t border-gray-200 pt-6 text-sm text-gray-500">
		<p>
			The actual schema lives in
			<a
				href="https://github.com/Parlamento-ai/diff.parlamento.ai/blob/main/research/schema/v1-schema.ts"
				class="text-blue-600 hover:underline"
				target="_blank"
				rel="noopener">research/schema/v1-schema.ts</a
			>. If something on this page disagrees with it, the page is wrong.
		</p>
	</footer>
</div>
