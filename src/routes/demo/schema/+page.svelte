<script lang="ts">
	let { data } = $props();

	const countryNames: Record<string, string> = {
		cl: 'Chile',
		es: 'Spain',
		eu: 'European Union',
		pe: 'Peru',
		us: 'United States'
	};
</script>

<svelte:head>
	<title>The schema, explained — research demo</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-6 py-12 font-sans text-base leading-relaxed text-gray-800">
	<a href="/demo" class="text-sm text-blue-600 hover:underline">← back to demo</a>

	<header class="mt-6 mb-12">
		<h1 class="mb-3 text-3xl font-bold tracking-tight">The schema, explained</h1>
		<p class="text-gray-600">
			This page is the philosophy behind the database we're building — not a field reference.
			It explains the bet we're making, how we're tackling complexity, and where we are right
			now. If you want field-level detail, read
			<a
				href="https://github.com/Parlamento-ai/diff.parlamento.ai/blob/main/research/schema/v3-schema.ts"
				class="text-blue-600 hover:underline"
				target="_blank"
				rel="noopener">v3-schema.ts</a
			>
			directly.
		</p>
	</header>

	<!-- ─────────────────────────────── 1. The problem -->
	<section class="mb-14">
		<h2 class="mb-3 text-xl font-bold">1. The problem</h2>
		<p class="mb-4">
			Every parliament names the same things differently. A Chilean
			<em>boletín</em> is a Spanish <em>proyecto de ley</em> is a US
			<em>bill</em> is an EU <em>proposal</em>. The shapes look similar, but each country also
			has its own quirks — urgencias in Chile, conference reports in the US, ordinary vs.
			organic laws in Spain.
		</p>
		<p class="mb-4">
			An international standard exists — <strong>Akoma Ntoso</strong> (AKN) — designed to
			model parliamentary documents universally. It's serious work, well-maintained, and
			almost nobody implemented it. Most parliaments rolled their own XML, then drifted.
		</p>
		<p>
			What we want is one schema that holds Chile, Spain, the EU, Peru, and the US side by
			side, queryable as if they were one parliament. Same shape, different data. No
			per-country branches.
		</p>
	</section>

	<!-- ─────────────────────────────── 2. The bet -->
	<section class="mb-14">
		<h2 class="mb-3 text-xl font-bold">2. The bet</h2>
		<p class="mb-4">
			Roughly 90% of the parliamentary ritual is genuinely shared across countries. The
			remaining 10% is real difference, but principled — handled by a small set of escape
			hatches, not by forking the schema.
		</p>
		<p class="mb-4">
			This experiment exists to falsify or confirm that bet. It's not "we believe AKN will
			work" — it's "we'll load five countries into one schema and see what breaks."
		</p>

		<div class="my-6 rounded border-l-4 border-amber-400 bg-amber-50 p-4 text-sm">
			<p class="mb-2 font-bold text-amber-900">What "broken" looks like</p>
			<ul class="list-disc space-y-1 pl-5 text-amber-950">
				<li>
					A field is full in one country and empty in four → we wrongly generalized a
					country-specific concept.
				</li>
				<li>
					A field is empty in every country → dead schema; remove it.
				</li>
				<li>
					Real data has nowhere to go and gets dumped into a "country specific" blob → we
					missed a concept that may belong as a real column.
				</li>
			</ul>
		</div>
	</section>

	<!-- ─────────────────────────────── 3. How we tackle the complexity -->
	<section class="mb-14">
		<h2 class="mb-3 text-xl font-bold">3. How we tackle the complexity</h2>
		<p class="mb-6 text-gray-600">
			Three architectural moves, each with a reason behind it.
		</p>

		<!-- Move A: XML as source of truth -->
		<article class="mb-8 rounded border border-gray-200 bg-white p-5">
			<header class="mb-3">
				<p class="text-xs font-bold tracking-wider text-gray-500 uppercase">Move A</p>
				<h3 class="text-lg font-bold">XML files are the source of truth. SQL is a projection.</h3>
			</header>
			<p class="mb-4 text-sm">
				Every document we model lives as a standalone <code
					class="rounded bg-gray-100 px-1 text-xs">.xml</code
				>
				file in <code class="rounded bg-gray-100 px-1 text-xs">research/schema/data/</code>,
				shaped after AKN. The SQLite database is rebuilt from scratch on every run by
				walking those files and extracting columns. Nobody edits the database directly.
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

					<!-- XML files (left) -->
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
							>committed, reviewable</text
						>
						<text x="140" y="118" text-anchor="middle" font-size="11" fill="#6b7280"
							>diffable in PRs</text
						>
						<text x="140" y="140" text-anchor="middle" font-size="11" fill="#374151"
							font-weight="600">source of truth</text
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
							>extract + insert</text
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
							>rebuilt every run</text
						>
						<text x="560" y="140" text-anchor="middle" font-size="11" fill="#374151"
							font-weight="600">projection / index</text
						>
					</g>
				</svg>
			</div>

			<p class="mb-2 text-sm font-bold text-gray-700">Why</p>
			<ul class="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
				<li>
					A binary <code class="rounded bg-gray-100 px-1 text-xs">.db</code> can't be reviewed
					in a PR or merged across contributors. Text files can.
				</li>
				<li>
					A schema change becomes a code change <em>plus</em> a sweep across the corpus. If
					the sweep is painful, the schema change is wrong — that's the feedback loop we
					want.
				</li>
				<li>
					Anyone clones the repo and runs one command to rebuild the full experiment. No
					hidden state.
				</li>
			</ul>
		</article>

		<!-- Move B: Three buckets per field -->
		<article class="mb-8 rounded border border-gray-200 bg-white p-5">
			<header class="mb-3">
				<p class="text-xs font-bold tracking-wider text-gray-500 uppercase">Move B</p>
				<h3 class="text-lg font-bold">
					Every field falls into one of three buckets.
				</h3>
			</header>
			<p class="mb-4 text-sm">
				Once XML is the source of truth, the question becomes: which fields also need to be
				SQL columns? We answered it with a three-way split — and the placement of every
				field is recorded in the schema file itself.
			</p>

			<div class="my-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
				<div class="rounded border border-gray-300 bg-gray-50 p-4">
					<p class="mb-1 text-xs font-bold tracking-wider text-gray-500 uppercase">
						SQL only
					</p>
					<p class="mb-2 text-sm font-bold">Plumbing</p>
					<p class="text-xs text-gray-600">
						IDs, fingerprints, timestamps, scraping metadata. Never appears in the XML.
						Overwritten in place. No history.
					</p>
				</div>
				<div class="rounded border border-gray-300 bg-gray-50 p-4">
					<p class="mb-1 text-xs font-bold tracking-wider text-gray-500 uppercase">
						XML only
					</p>
					<p class="mb-2 text-sm font-bold">Deep content</p>
					<p class="text-xs text-gray-600">
						Articles, paragraphs, justifications, internal cross-references. Anything
						nested, recursive, or country-specific the demo doesn't query in aggregate.
					</p>
				</div>
				<div class="rounded border border-blue-300 bg-blue-50 p-4">
					<p class="mb-1 text-xs font-bold tracking-wider text-blue-700 uppercase">Both</p>
					<p class="mb-2 text-sm font-bold">Queryable index</p>
					<p class="text-xs text-blue-900">
						A small, hand-picked set of fields the demo needs in joins and filters.
						Stored as columns <em>and</em> present in the XML. <strong>XML wins</strong>
						 if they disagree — the column is regenerated.
					</p>
				</div>
			</div>

			<p class="mb-2 text-sm font-bold text-gray-700">Why</p>
			<ul class="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
				<li>
					The previous version of the schema had a generic <code
						class="rounded bg-gray-100 px-1 text-xs">body</code
					>
					JSON column that absorbed everything we couldn't model. It was the schema
					admitting it had hit a wall. Buckets force the question to be answered explicitly.
				</li>
				<li>
					Adding a field to the "both" bucket is cheap: write an extractor, add a column,
					rebuild. So we can start small and promote a field the day a query needs it.
				</li>
				<li>
					Versioning is now trivial — we just store the whole XML per version. No JSON
					snapshot dance, no per-column history tables.
				</li>
			</ul>
		</article>

		<!-- Move C: Escape hatches with feedback loops -->
		<article class="mb-2 rounded border border-gray-200 bg-white p-5">
			<header class="mb-3">
				<p class="text-xs font-bold tracking-wider text-gray-500 uppercase">Move C</p>
				<h3 class="text-lg font-bold">
					Escape hatches are visible, not hidden.
				</h3>
			</header>
			<p class="mb-4 text-sm">
				The 10% that doesn't fit the shared shape goes into named escape hatches. The
				point isn't to make the misfit disappear — it's to make it
				<em>countable</em>, so the schema can evolve toward what the data actually is.
			</p>

			<div class="my-5 space-y-3">
				<div class="rounded border border-gray-200 p-3 text-sm">
					<p class="mb-1 font-bold text-gray-800">
						<code class="rounded bg-gray-100 px-1 text-xs">countrySpecific</code> blob
					</p>
					<p class="text-gray-700">
						A free-form JSON field on every document. When a country tracks something we
						don't have a column for, it goes here. We watch what accumulates: once the
						same shape shows up in 2+ countries, we promote it to a real column.
					</p>
				</div>
				<div class="rounded border border-gray-200 p-3 text-sm">
					<p class="mb-1 font-bold text-gray-800">
						<code class="rounded bg-gray-100 px-1 text-xs">statusLocal</code> alongside
						<code class="rounded bg-gray-100 px-1 text-xs">status</code>
					</p>
					<p class="text-gray-700">
						The country's own wording for a stage ("Tramitación terminada — pendiente de
						promulgación") is preserved alongside our normalized status ("passed"). We
						never throw the country's voice away.
					</p>
				</div>
				<div class="rounded border border-gray-200 p-3 text-sm">
					<p class="mb-1 font-bold text-gray-800">Append-only timelines</p>
					<p class="text-gray-700">
						We don't model the rules of each country's procedure (BPMN-style). We just
						log every observed step with a normalized <code
							class="rounded bg-gray-100 px-1 text-xs">actionType</code
						>
						and the country's local label. The shape of the procedure emerges from the
						log, not from a model we authored.
					</p>
				</div>
			</div>

			<p class="mb-2 text-sm font-bold text-gray-700">Why</p>
			<ul class="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
				<li>
					An escape hatch is a confession — naming it explicitly is what makes the
					confession useful. Hiding the misfit inside a generic JSON column would be the
					same mistake we made with the old <code
						class="rounded bg-gray-100 px-1 text-xs">body</code
					> field.
				</li>
				<li>
					Schema evolution gets steered by what's in the hatches, not by guesses. The
					schema tightens over time as patterns surface.
				</li>
			</ul>
		</article>
	</section>

	<!-- ─────────────────────────────── 4. The two metrics -->
	<section class="mb-14">
		<h2 class="mb-3 text-xl font-bold">4. The two metrics that steer everything</h2>
		<p class="mb-6 text-gray-600">
			Both metrics fall out of the work for free, as long as we keep the corpus honest.
		</p>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<div class="rounded border border-gray-200 bg-white p-5">
				<p class="mb-2 text-sm font-bold tracking-wider text-gray-500 uppercase">
					Coverage
				</p>
				<p class="mb-3 text-lg font-bold">
					What % of a country's public legislative data fits the schema?
				</p>
				<p class="text-sm text-gray-700">
					Low coverage means data exists but our schema can't hold it. Tells us where the
					schema is too narrow.
				</p>
			</div>
			<div class="rounded border border-gray-200 bg-white p-5">
				<p class="mb-2 text-sm font-bold tracking-wider text-gray-500 uppercase">
					Completeness
				</p>
				<p class="mb-3 text-lg font-bold">
					What % of the schema's fields end up populated, per country?
				</p>
				<p class="text-sm text-gray-700">
					Low completeness means our schema asks for things this country doesn't track.
					Tells us where the schema is too wide.
				</p>
			</div>
		</div>

		<p class="mt-6 text-sm text-gray-600">
			Together they triangulate the right shape: high coverage and high completeness across
			five countries means the bet held. Anything else is a signal pointing at a specific
			fix.
		</p>
	</section>

	<!-- ─────────────────────────────── 5. Where we are right now -->
	<section class="mb-14">
		<h2 class="mb-3 text-xl font-bold">5. Where we are right now</h2>
		<p class="mb-4 text-gray-600">
			This section reads from the live <code class="rounded bg-gray-100 px-1 text-xs"
				>research.db</code
			>. If it looks empty, the build hasn't been run.
		</p>

		<div class="mb-6 rounded border border-gray-200 bg-white p-5">
			<p class="mb-3 text-sm font-bold text-gray-700">
				Phase 1 — one bill end-to-end, per country
			</p>
			<p class="mb-4 text-sm text-gray-600">
				For each of the five target countries, we model one bill that became law: the bill
				itself, the act it amended, a few trámite events, an amendment, the journal entry
				that promulgated it. Five countries × ~7 documents = ~35 files. Small enough to keep
				in your head, big enough to surface real friction.
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
							{total === 0 ? 'not loaded yet' : `${total} doc${total === 1 ? '' : 's'}`}
						</p>
					</div>
				{/each}
			</div>
		</div>

		{#if data.total > 0}
			<div class="mb-6 rounded border border-gray-200 bg-white p-5">
				<p class="mb-3 text-sm font-bold text-gray-700">What's loaded</p>
				<table class="w-full text-sm">
					<thead class="border-b border-gray-200 text-left text-xs text-gray-500 uppercase">
						<tr>
							<th class="py-2 pr-4 font-bold">country</th>
							<th class="py-2 pr-4 font-bold">type</th>
							<th class="py-2 font-bold">count</th>
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
			<p class="mb-2 font-bold text-blue-900">What we expect Phase 1 to surface</p>
			<ul class="list-disc space-y-1 pl-5 text-blue-950">
				<li>
					Concepts we generalized too eagerly — fields full in Chile and empty everywhere
					else.
				</li>
				<li>
					Concepts we missed — country data getting dumped into <code
						class="rounded bg-blue-100 px-1 text-xs">countrySpecific</code
					> for the same reason in two or more countries.
				</li>
				<li>
					Queries that should be one join and turn out to be five — those are the schema
					telling us its shape is wrong, even if every file loads.
				</li>
			</ul>
		</div>
	</section>

	<!-- ─────────────────────────────── 6. What we deliberately didn't model -->
	<section class="mb-14">
		<h2 class="mb-3 text-xl font-bold">6. What we deliberately didn't model</h2>
		<p class="mb-4 text-gray-600">
			Boundaries matter. A few things we could have built and chose not to:
		</p>
		<ul class="list-disc space-y-3 pl-5 text-sm">
			<li>
				<strong>No persons table.</strong> Sponsors and proposers are JSON blobs on each
				document. The day someone asks "all bills by Diputada Pérez across countries" we'll
				lift this into a real table — not before.
			</li>
			<li>
				<strong>No cross-country ontology.</strong> Chile's "Cámara de Diputados" and
				Spain's "Congreso de los Diputados" are separate strings. AKN gives the framework
				for linking them; we haven't built the mapping and won't until a query needs it.
			</li>
			<li>
				<strong>No process model.</strong> We log what happened, not what
				<em>should</em> happen. A full BPMN model of each country's procedure was explored
				and parked.
			</li>
			<li>
				<strong>No silent normalization.</strong> Every country-specific label is preserved
				alongside our normalized one. We never throw the country's voice away.
			</li>
		</ul>
	</section>

	<footer class="mt-16 border-t border-gray-200 pt-6 text-sm text-gray-500">
		<p>
			Active schema:
			<a
				href="https://github.com/Parlamento-ai/diff.parlamento.ai/blob/main/research/schema/v3-schema.ts"
				class="text-blue-600 hover:underline"
				target="_blank"
				rel="noopener">research/schema/v3-schema.ts</a
			>. Research plan:
			<a
				href="https://github.com/Parlamento-ai/diff.parlamento.ai/blob/main/research/schema/schema-research-plan.md"
				class="text-blue-600 hover:underline"
				target="_blank"
				rel="noopener">schema-research-plan.md</a
			>.
		</p>
	</footer>
</div>
