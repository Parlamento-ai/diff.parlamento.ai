<script lang="ts">
	import type { TableSummary } from './+page.server';
	import type { ConceptNote } from './concept-notes';

	let { data } = $props();
	const { groups, tables, notes, whereDoesItGo } = $derived(data);

	const tableByName = $derived(
		new Map<string, TableSummary>(tables.map((t) => [t.exportName, t]))
	);

	function shortType(sql: string): string {
		return sql.replace(/^integer$/i, 'int').replace(/^text$/i, 'text');
	}

	function exampleValue(v: unknown): string {
		if (v === null || v === undefined) return '—';
		if (typeof v === 'string') {
			if (v.length > 80) return v.slice(0, 77) + '…';
			return v;
		}
		if (typeof v === 'object') {
			const j = JSON.stringify(v);
			return j.length > 80 ? j.slice(0, 77) + '…' : j;
		}
		return String(v);
	}

	type Segment = { kind: 'text' | 'bold' | 'code'; text: string };
	type Block = { kind: 'paragraph'; segments: Segment[] } | { kind: 'list'; items: Segment[][] };

	/**
	 * Parse our concept-note prose into blocks of segments. Tiny grammar:
	 *   - Lines starting with "- " are list items (continuation lines extend
	 *     the previous item).
	 *   - Blank lines separate blocks.
	 *   - **bold** and `code` are inline.
	 *
	 * Output is rendered with normal Svelte tags — no {@html}, no XSS surface.
	 */
	function parseInline(s: string): Segment[] {
		const segs: Segment[] = [];
		const re = /(\*\*([^*]+)\*\*)|(`([^`]+)`)/g;
		let last = 0;
		let m: RegExpExecArray | null;
		while ((m = re.exec(s)) !== null) {
			if (m.index > last) segs.push({ kind: 'text', text: s.slice(last, m.index) });
			if (m[1]) segs.push({ kind: 'bold', text: m[2] });
			else if (m[3]) segs.push({ kind: 'code', text: m[4] });
			last = m.index + m[0].length;
		}
		if (last < s.length) segs.push({ kind: 'text', text: s.slice(last) });
		return segs;
	}

	function parseProse(s: string): Block[] {
		const blocks: Block[] = [];
		const lines = s.trim().split('\n');
		let para: string[] = [];
		let list: string[][] | null = null;

		const flushPara = () => {
			if (para.length) {
				const text = para.join(' ').trim();
				if (text) blocks.push({ kind: 'paragraph', segments: parseInline(text) });
				para = [];
			}
		};
		const flushList = () => {
			if (list) {
				blocks.push({ kind: 'list', items: list.map((parts) => parseInline(parts.join(' '))) });
				list = null;
			}
		};

		for (const raw of lines) {
			const line = raw.trim();
			if (line.startsWith('- ')) {
				flushPara();
				if (!list) list = [];
				list.push([line.slice(2)]);
			} else if (line === '') {
				flushPara();
				flushList();
			} else if (list) {
				// Continuation of the previous bullet
				list[list.length - 1].push(line);
			} else {
				para.push(line);
			}
		}
		flushPara();
		flushList();
		return blocks;
	}

	function note(name: string): ConceptNote | undefined {
		return notes[name];
	}
</script>

<svelte:head>
	<title>Schema reference — research demo</title>
</svelte:head>

<!-- A small reusable renderer for our parsed prose. -->
{#snippet inline(segments: Segment[])}
	{#each segments as seg, i (i)}
		{#if seg.kind === 'bold'}
			<strong>{seg.text}</strong>
		{:else if seg.kind === 'code'}
			<code class="rounded bg-gray-100 px-1 text-xs">{seg.text}</code>
		{:else}
			{seg.text}
		{/if}
	{/each}
{/snippet}

{#snippet prose(blocks: Block[])}
	{#each blocks as block, i (i)}
		{#if block.kind === 'paragraph'}
			<p class="mb-3">{@render inline(block.segments)}</p>
		{:else}
			<ul class="mb-3 list-disc space-y-1 pl-5">
				{#each block.items as item, j (j)}
					<li>{@render inline(item)}</li>
				{/each}
			</ul>
		{/if}
	{/each}
{/snippet}

<div class="mx-auto max-w-4xl p-8 font-mono text-sm">
	<a href="/demo" class="text-blue-600 hover:underline">← back to docs</a>

	<header class="mt-4 mb-8">
		<h1 class="text-2xl font-bold">Schema, in concepts</h1>
		<p class="mt-2 text-gray-600">
			What each concept represents and what facts hang off it. Written for someone about to model
			a parliament — not for someone writing a query. The technical details (column names, SQL
			types, foreign keys) are still here, just folded underneath each section.
		</p>
	</header>

	<!-- ── 3-concept sketch ── -->
	<section class="mb-12 rounded border border-gray-200 bg-gray-50 p-6">
		<h2 class="mb-4 font-bold uppercase">The whole schema in one picture</h2>
		<svg viewBox="0 0 760 250" class="w-full" xmlns="http://www.w3.org/2000/svg">
			<defs>
				<marker
					id="arrow2"
					viewBox="0 0 10 10"
					refX="9"
					refY="5"
					markerWidth="6"
					markerHeight="6"
					orient="auto-start-reverse"
				>
					<path d="M0,0 L10,5 L0,10 z" fill="#6b7280" />
				</marker>
			</defs>

			<g>
				<rect x="280" y="100" width="200" height="60" rx="8" fill="#fff" stroke="#374151" stroke-width="2" />
				<text x="380" y="125" text-anchor="middle" font-weight="bold" font-size="14">A document</text>
				<text x="380" y="145" text-anchor="middle" font-size="11" fill="#6b7280">
					(bill, act, journal, …)
				</text>
			</g>

			<g>
				<rect x="540" y="20" width="200" height="50" rx="8" fill="#fff" stroke="#9ca3af" />
				<text x="640" y="42" text-anchor="middle" font-size="12">…has versions over time</text>
				<text x="640" y="58" text-anchor="middle" font-size="10" fill="#6b7280">
					(snapshots: v1, v2, v3 …)
				</text>
			</g>
			<line x1="480" y1="115" x2="540" y2="55" stroke="#6b7280" stroke-width="1.5" marker-end="url(#arrow2)" />

			<g>
				<rect x="540" y="120" width="200" height="50" rx="8" fill="#fef3c7" stroke="#b45309" stroke-width="2" />
				<text x="640" y="142" text-anchor="middle" font-weight="bold" font-size="12">…points at other documents</text>
				<text x="640" y="158" text-anchor="middle" font-size="10" fill="#92400e">
					(amends, contains, refers to …)
				</text>
			</g>
			<line x1="480" y1="135" x2="540" y2="140" stroke="#b45309" stroke-width="1.5" marker-end="url(#arrow2)" />

			<g>
				<rect x="540" y="195" width="200" height="50" rx="8" fill="#eff6ff" stroke="#1e40af" />
				<text x="640" y="217" text-anchor="middle" font-size="12">…has type-specific facts</text>
				<text x="640" y="233" text-anchor="middle" font-size="10" fill="#1e3a8a">
					(a bill's sponsors, an act's effective date)
				</text>
			</g>
			<line x1="480" y1="150" x2="540" y2="215" stroke="#1e40af" stroke-width="1.5" marker-end="url(#arrow2)" />

			<g>
				<rect x="20" y="115" width="200" height="50" rx="8" fill="#fff" stroke="#9ca3af" />
				<text x="120" y="137" text-anchor="middle" font-size="12">…belongs to a country</text>
				<text x="120" y="153" text-anchor="middle" font-size="10" fill="#6b7280">
					(cl, es, eu, pe, us)
				</text>
			</g>
			<line x1="220" y1="140" x2="280" y2="130" stroke="#6b7280" stroke-width="1.5" marker-end="url(#arrow2)" />
		</svg>
		<p class="mt-2 text-xs text-gray-500">
			That's it. Everything else is variations on those four ideas: what kind of document, what
			facts go with that kind, what relations between them.
		</p>
	</section>

	<!-- ── Where does X go? ── -->
	<section class="mb-12">
		<h2 class="mb-2 font-bold uppercase">Where does this fact go?</h2>
		<p class="mb-4 text-gray-600">
			Quick reference — when you're staring at gov data and don't know which concept it belongs
			to.
		</p>
		<dl class="divide-y divide-gray-200 rounded border border-gray-200 bg-white">
			{#each whereDoesItGo as item, i (i)}
				<div class="grid grid-cols-1 gap-2 p-3 sm:grid-cols-3">
					<dt class="font-bold sm:col-span-1">{item.fact}</dt>
					<dd class="text-gray-700 sm:col-span-2">
						{@render inline(parseInline(item.answer))}
					</dd>
				</div>
			{/each}
		</dl>
	</section>

	<!-- ── A few concepts that recur everywhere ── -->
	<section class="mb-12">
		<h2 class="mb-2 font-bold uppercase">A few ideas that recur</h2>
		<p class="mb-4 text-gray-600">These show up across many concepts. Worth knowing once.</p>
		<dl class="space-y-4">
			<div>
				<dt class="font-bold">A document's identity</dt>
				<dd class="text-gray-700">
					Two ways to identify a document: a UUID we generate (machine-friendly, stable forever),
					and a <code class="rounded bg-gray-100 px-1 text-xs">(country, type, native id)</code>
					trio (human-readable: a Chilean boletín number, an EU procedure ref). The same string
					can appear in two countries — the country tag separates them.
				</dd>
			</div>
			<div>
				<dt class="font-bold">Country-specific dumping ground</dt>
				<dd class="text-gray-700">
					When a country tracks something we don't have a home for, it goes into a country-specific
					blob on the document. Watching what accumulates there is how we discover new shared
					fields. Once the same shape shows up in 2+ countries, we promote it to a real field.
				</dd>
			</div>
			<div>
				<dt class="font-bold">Normalized status + original phrasing</dt>
				<dd class="text-gray-700">
					Many concepts have both a normalized status (a fixed set like
					<code class="rounded bg-gray-100 px-1 text-xs">passed</code>,
					<code class="rounded bg-gray-100 px-1 text-xs">in_committee</code>) and a free-text local
					string in the country's language. The normalized one drives queries; the local one
					preserves the nuance the gov site published, in case our normalization is wrong.
				</dd>
			</div>
			<div>
				<dt class="font-bold">Body, shaped per type</dt>
				<dd class="text-gray-700">
					Every document has a "body" with the actual content — but the shape depends on the type.
					A bill's body has summary + fundamentos + articles. An act's has preamble + articles +
					annexes. A journal's has issue metadata. The schema doesn't enforce these shapes; the
					application layer does.
				</dd>
			</div>
			<div>
				<dt class="font-bold">Versions, not edits</dt>
				<dd class="text-gray-700">
					When a document's text changes — an act being amended, a bill being revised between
					stages — we add a new version. Old versions stay forever. We never overwrite.
				</dd>
			</div>
		</dl>
	</section>

	<!-- ── Concept sections ── -->
	{#each groups as group (group.title)}
		<section class="mb-10">
			<h2 class="mb-1 text-lg font-bold uppercase">{group.title}</h2>
			<p class="mb-4 text-gray-600">{group.intent}</p>

			<div class="space-y-4">
				{#each group.tables as exportName (exportName)}
					{@const table = tableByName.get(exportName)}
					{@const conceptNote = note(exportName)}
					{#if table && conceptNote}
						<article class="rounded border border-gray-200 bg-white p-5">
							<header class="mb-3">
								<h3 class="text-base font-bold">{conceptNote.displayName}</h3>
								<p class="text-xs text-gray-500">{conceptNote.tagline}</p>
							</header>

							<div class="text-gray-800">
								{@render prose(parseProse(conceptNote.body))}
							</div>

							{#if conceptNote.notModeled}
								<div class="mt-3 rounded bg-yellow-50 p-3 text-xs text-yellow-900">
									<strong>Not modeled:</strong>
									{@render prose(parseProse(conceptNote.notModeled))}
								</div>
							{/if}

							{#if table.example}
								<details class="mt-4">
									<summary class="cursor-pointer text-xs text-gray-500 hover:text-gray-800">
										Example row from <code>research.db</code> ({table.rowCount}
										{table.rowCount === 1 ? 'row' : 'rows'} in this table)
									</summary>
									<table class="mt-2 w-full text-xs">
										<tbody>
											{#each Object.entries(table.example) as [k, v] (k)}
												<tr class="border-b border-gray-100">
													<td class="w-1/3 py-1 pr-3 align-top text-gray-500">{k}</td>
													<td class="py-1 break-all">
														{#if v === null || v === undefined}
															<span class="text-gray-300">—</span>
														{:else}
															{exampleValue(v)}
														{/if}
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</details>
							{:else}
								<p class="mt-4 text-xs text-gray-400">
									No rows in <code>research.db</code> for this concept yet. Add a YAML and rebuild.
								</p>
							{/if}

							<details class="mt-2">
								<summary class="cursor-pointer text-xs text-gray-500 hover:text-gray-800">
									Schema details ({table.exportName} · {table.dbName} · {table.columns.length} columns)
								</summary>
								<div class="mt-3 border-t border-gray-100 pt-3">
									{#if table.jsDoc}
										<p class="mb-3 text-xs whitespace-pre-line text-gray-600">{table.jsDoc}</p>
									{/if}
									<table class="w-full text-xs">
										<thead class="border-b border-gray-200 text-left text-gray-500">
											<tr>
												<th class="py-1 pr-3">column</th>
												<th class="py-1 pr-3">type</th>
												<th class="py-1">notes</th>
											</tr>
										</thead>
										<tbody>
											{#each table.columns as col (col.dbName)}
												<tr class="border-b border-gray-100 align-top">
													<td class="py-1 pr-3 font-bold">
														{col.dbName}
														{#if col.dbName !== col.tsName}
															<div class="text-[10px] text-gray-400">{col.tsName}</div>
														{/if}
													</td>
													<td class="py-1 pr-3 text-gray-600">{shortType(col.sqlType)}</td>
													<td class="py-1 whitespace-pre-line text-gray-700">
														{col.jsDoc ?? ''}
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							</details>
						</article>
					{:else if table}
						<article class="rounded border border-yellow-200 bg-yellow-50 p-4 text-xs text-yellow-900">
							<strong>{exportName}</strong> — schema table exists but no concept note yet.
							Add one in <code>concept-notes.ts</code>.
						</article>
					{/if}
				{/each}
			</div>
		</section>
	{/each}

	<footer class="mt-12 border-t border-gray-200 pt-6 text-xs text-gray-500">
		Concept descriptions live in <code>src/routes/demo/schema/concept-notes.ts</code>. Schema
		details and example rows come from <code>research/schema/v1-schema.ts</code> and
		<code>research/schema/research.db</code>. If the concept and schema disagree, the concept note
		is wrong, or the schema needs to change.
	</footer>
</div>
