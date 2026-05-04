<script lang="ts">
	import AknTerm from '$lib/bill/AknTerm.svelte';
	import BodyView from '$lib/bill/BodyView.svelte';
	import type { TimelineRow, Modification } from '$lib/bill/parse';

	let { data } = $props();
	const doc = $derived(data.doc);
	const parsed = $derived(data.parsed);
	const amendments = $derived(data.amendments);
	const lint = $derived(data.lint);

	type Tab = 'document' | 'lint';
	let activeTab = $state<Tab>('document');

	const completenessPct = $derived(Math.round(lint.completeness * 100));
	const errorCount = $derived(lint.findings.filter((f) => f.severity === 'error').length);
	const warnCount = $derived(lint.findings.filter((f) => f.severity === 'warn').length);
	const infoCount = $derived(lint.findings.filter((f) => f.severity === 'info').length);

	function scoreClass(pct: number) {
		if (pct >= 90) return 'score-good';
		if (pct >= 70) return 'score-mid';
		return 'score-low';
	}

	function statusGlyph(status: string) {
		if (status === 'ok') return '✓';
		if (status === 'optional-missing') return '◦';
		if (status === 'invalid') return '✗';
		return '·';
	}

	let selectedId = $state<string | null>(null);
	let spanFocusEid = $state<string | null>(null);

	$effect(() => {
		if (!selectedId && parsed.timeline.length) {
			selectedId = parsed.timeline[0].id;
		}
	});

	const selectedRow = $derived<TimelineRow | undefined>(
		parsed.timeline.find((r) => r.id === selectedId)
	);

	const highlightedEids = $derived(
		new Set(
			(selectedRow?.modifications ?? [])
				.map((m) => m.targetEid)
				.filter((x): x is string => Boolean(x))
		)
	);

	function selectEvent(id: string) {
		selectedId = id;
		spanFocusEid = null;
	}

	function focusSpan(eId: string) {
		spanFocusEid = spanFocusEid === eId ? null : eId;
	}

	function rowKindLabel(kind: TimelineRow['kind']) {
		switch (kind) {
			case 'procedural':
				return 'procedural';
			case 'version':
				return 'new version';
			case 'amendment':
				return 'amendment';
			case 'terminal':
				return 'terminal';
		}
	}

	function rowTooltip(row: TimelineRow): string {
		const parts: string[] = [];
		if (row.lifecycle && row.step) {
			parts.push(
				`This event appears as both a <workflow>/<step> (the procedural fact: who did what) and a <lifecycle>/<eventRef> (the resulting new version of the bill).`
			);
		} else if (row.lifecycle) {
			parts.push(
				`This event comes from <lifecycle>/<eventRef>. It marks a new expression of the bill coming into being.`
			);
		} else if (row.step) {
			parts.push(
				`This is a procedural event from <workflow>/<step>. It records what happened, but did not produce a new version of the bill text.`
			);
		}
		if (row.modifications.length) {
			parts.push(
				`It is referenced by ${row.modifications.length} entrie(s) in <analysis>/<activeModifications> describing the textual changes it produced.`
			);
		}
		return parts.join(' ');
	}

	function modKindGlyph(k: Modification['kind']) {
		switch (k) {
			case 'substitution':
				return '⇄';
			case 'insertion':
				return '+';
			case 'repeal':
				return '−';
			default:
				return '?';
		}
	}

	function modKindClass(k: Modification['kind']) {
		switch (k) {
			case 'substitution':
				return 'mod-sub';
			case 'insertion':
				return 'mod-ins';
			case 'repeal':
				return 'mod-rep';
			default:
				return 'mod-unk';
		}
	}

	function eventsThatTouched(eId: string): TimelineRow[] {
		const ids = new Set(parsed.spanToEvents[eId] ?? []);
		return parsed.timeline.filter((r) => ids.has(r.id));
	}
</script>

<svelte:head>
	<title>{doc.nativeId} — bill — research demo</title>
</svelte:head>

<div class="page">
	<a href="/demo/{doc.countryCode}/bill" class="back">← bills</a>

	<!-- ─── HEADER CARD ─── -->
	<header class="head card">
		<div class="head-tag">
			<span class="tag-mono">
				<AknTerm term="bill" />
			</span>
			<span class="tag-sep">·</span>
			<span class="tag-mono">{doc.countryCode}</span>
			<span class="tag-sep">·</span>
			<span class="tag-mono ink">{doc.nativeId}</span>
			{#if parsed.identification.subtype}
				<span class="tag-sep">·</span>
				<span class="tag-sub">{parsed.identification.subtype}</span>
			{/if}
		</div>

		<h1>{doc.title}</h1>

		<dl class="head-frbr">
			{#if parsed.identification.frbrExpression}
				<dt><AknTerm term="FRBR expression" /></dt>
				<dd class="mono ink">{parsed.identification.frbrExpression}</dd>
			{/if}
			{#if parsed.identification.expressionDate}
				<dt>expression date</dt>
				<dd class="mono ink">{parsed.identification.expressionDate}</dd>
			{/if}
			{#if parsed.identification.language}
				<dt>language</dt>
				<dd class="mono ink">{parsed.identification.language}</dd>
			{/if}
		</dl>

		{#if parsed.warnings.length}
			<div class="warnings">
				{#each parsed.warnings as w (w)}
					<div class="warn-card">⚠ {w}</div>
				{/each}
			</div>
		{/if}
	</header>

	<!-- ─── TAB STRIP ─── -->
	<nav class="tabs" aria-label="Document views">
		<button
			type="button"
			class="tab"
			class:tab-active={activeTab === 'document'}
			onclick={() => (activeTab = 'document')}
		>
			Document
		</button>
		<button
			type="button"
			class="tab"
			class:tab-active={activeTab === 'lint'}
			onclick={() => (activeTab = 'lint')}
		>
			AKN lint
			<span class="tab-score {scoreClass(completenessPct)}">{completenessPct}%</span>
			{#if errorCount}<span class="tab-pip pip-err">{errorCount}</span>{/if}
			{#if warnCount}<span class="tab-pip pip-warn">{warnCount}</span>{/if}
		</button>
	</nav>

	{#if activeTab === 'lint'}
		<section class="lint-view">
			<header class="lint-summary card">
				<div class="lint-summary-main">
					<div class="lint-score-block">
						<span class="lint-score-num {scoreClass(completenessPct)}">{completenessPct}<span class="pct">%</span></span>
						<span class="lint-score-label">completeness</span>
					</div>
					<dl class="lint-counts">
						<div><dt>errors</dt><dd class="cnt-err">{errorCount}</dd></div>
						<div><dt>warnings</dt><dd class="cnt-warn">{warnCount}</dd></div>
						<div><dt>notes</dt><dd class="cnt-info">{infoCount}</dd></div>
					</dl>
				</div>
				<p class="hint lint-hint">
					Each facet is a slice of the document scored against an
					expectation profile (<code>research/schema/profiles/{lint.docType}.ts</code>).
					Optional fields show as notes; their absence does not lower the score.
				</p>
			</header>

			<div class="facets">
				{#each lint.facets as facet (facet.id)}
					{@const pct = Math.round(facet.score * 100)}
					<article class="facet card">
						<header class="facet-head">
							<div class="facet-title">
								<h3>{facet.label}</h3>
								<span class="facet-score {scoreClass(pct)}">{pct}%</span>
								<span class="facet-meta">{facet.earned}/{facet.total} weighted</span>
							</div>
							<p class="facet-rationale">{facet.rationale}</p>
						</header>

						<div class="facet-body">
							<table class="exp-table">
								<thead>
									<tr>
										<th class="th-status"></th>
										<th>Expectation</th>
										<th class="th-xpath">XPath</th>
										<th class="th-w">w</th>
										<th class="th-count">matches</th>
									</tr>
								</thead>
								<tbody>
									{#each facet.expectations as exp (exp.id)}
										<tr class="exp-row exp-{exp.status}">
											<td class="exp-status" title={exp.status}>
												<span class="status-glyph">{statusGlyph(exp.status)}</span>
											</td>
											<td class="exp-id">
												<span class="mono">{exp.id}</span>
												{#if exp.kind !== 'presence'}
													<span class="exp-kind">{exp.kind}</span>
												{/if}
											</td>
											<td class="exp-xpath mono">{exp.xpath}</td>
											<td class="exp-w mono">{exp.weight}</td>
											<td class="exp-count mono">
												{exp.matchCount}{#if exp.value && exp.kind === 'enum'} <span class="exp-val">→ {exp.value}</span>{/if}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>

							{#if facet.findings.length}
								<ul class="findings">
									{#each facet.findings as f, i (i)}
										<li class="finding sev-{f.severity}">
											<div class="finding-head">
												<span class="finding-sev">{f.severity}</span>
												<span class="finding-id mono">{f.expectation}</span>
											</div>
											<div class="finding-msg">{f.message}</div>
											<div class="finding-rationale">{f.rationale}</div>
											<code class="finding-xpath">{f.xpath}</code>
										</li>
									{/each}
								</ul>
							{/if}
						</div>
					</article>
				{/each}
			</div>
		</section>
	{:else}
	<div class="cols">
		<!-- ─── TIMELINE (LEFT) ─── -->
		<aside class="timeline">
			<h2 class="eyebrow">Timeline</h2>
			<p class="hint">
				One row per event, joined across <AknTerm term="lifecycle" />,
				<AknTerm term="workflow" /> and <AknTerm term="analysis" /> via shared
				<AknTerm term="TLCEvent" /> ids.
			</p>

			{#if parsed.timeline.length}
				<ol class="spine">
					{#each parsed.timeline as row (row.id)}
						{@const selected = row.id === selectedId}
						<li class="row k-{row.kind}" class:selected>
							<button
								type="button"
								onclick={() => selectEvent(row.id)}
								title={`${row.label}${row.chamber ? ` · ${row.chamber}` : ''}\n\n${rowTooltip(row)}`}
							>
								<span class="date mono">{row.date || '—'}</span>
								<span class="content">
									<span class="label">{row.label}</span>
									{#if row.chamber || row.modifications.length || row.warnings.length}
										<span class="meta">
											{#if row.chamber}<span class="chamber">{row.chamber}</span>{/if}
											{#if row.modifications.length}
												<span class="mod-count" title="{row.modifications.length} change{row.modifications.length === 1 ? '' : 's'}">
													{row.modifications.length}△
												</span>
											{/if}
											{#if row.warnings.length}
												<span class="warn-mark" title={row.warnings.join('\n')}>⚠</span>
											{/if}
										</span>
									{/if}
								</span>
							</button>
						</li>
					{/each}
				</ol>
			{:else}
				<p class="empty">No events found in this bill.</p>
			{/if}
		</aside>

		<!-- ─── DETAIL (RIGHT) ─── -->
		<section class="detail">
			{#if selectedRow}
				<h2 class="eyebrow">Event detail</h2>

				<div class="card event-card k-{selectedRow.kind}">
					<div class="card-head">
						<span class="mono ink">{selectedRow.date || '—'}</span>
						{#if selectedRow.chamber}
							<span class="card-head-sep">·</span>
							<span class="muted"><AknTerm term="chamber" />: {selectedRow.chamber}</span>
						{/if}
						<span class="card-head-spacer"></span>
						<span class="kind-tag">{rowKindLabel(selectedRow.kind)}</span>
					</div>
					<div class="card-body">
						<div class="event-label">{selectedRow.label}</div>

						<div class="origin-grid">
							{#if selectedRow.lifecycle}
								<div class="origin">
									<div class="origin-head">
										From <AknTerm term="lifecycle" />/<AknTerm term="eventRef" />
									</div>
									<dl class="kv">
										{#if selectedRow.lifecycle.type}
											<dt><AknTerm term="refersTo" /></dt>
											<dd class="mono">{selectedRow.lifecycle.source}</dd>
										{/if}
										{#if selectedRow.lifecycle.tlcEventId}
											<dt><AknTerm term="source" /></dt>
											<dd class="mono">{selectedRow.lifecycle.tlcEventId}</dd>
										{/if}
										{#if selectedRow.lifecycle.chamber}
											<dt><AknTerm term="chamber" /></dt>
											<dd>{selectedRow.lifecycle.chamber}</dd>
										{/if}
										{#if selectedRow.lifecycle.showAs}
											<dt>showAs</dt>
											<dd>{selectedRow.lifecycle.showAs}</dd>
										{/if}
									</dl>
								</div>
							{/if}

							{#if selectedRow.step}
								<div class="origin">
									<div class="origin-head">
										From <AknTerm term="workflow" />/<AknTerm term="step" />
									</div>
									<dl class="kv">
										{#if selectedRow.step.agent}
											<dt><AknTerm term="agent" /></dt>
											<dd>{selectedRow.step.agent}</dd>
										{/if}
										{#if selectedRow.step.role}
											<dt><AknTerm term="role" /></dt>
											<dd>{selectedRow.step.role}</dd>
										{/if}
										{#if selectedRow.step.outcome}
											<dt><AknTerm term="outcome" /></dt>
											<dd>{selectedRow.step.outcome}</dd>
										{/if}
										{#if selectedRow.step.refersTo}
											<dt><AknTerm term="refersTo" /></dt>
											<dd class="mono">{selectedRow.step.refersTo}</dd>
										{/if}
									</dl>
								</div>
							{/if}
						</div>

						{#if selectedRow.modifications.length}
							<div class="origin origin-full">
								<div class="origin-head">
									From <AknTerm term="analysis" />/<AknTerm term="activeModifications" />
								</div>
								<ul class="mods">
									{#each selectedRow.modifications as m, i (i)}
										<li class="mod-row {modKindClass(m.kind)}">
											<span class="mod-glyph" aria-hidden="true">{modKindGlyph(m.kind)}</span>
											<span class="mod-kind">{m.kind}</span>
											{#if m.targetEid}
												<button
													type="button"
													class="eid-pill"
													onclick={() => m.targetEid && focusSpan(m.targetEid)}
													title="scroll to span in body view"
												>
													<AknTerm term="eId" />=<span class="ink">{m.targetEid}</span>
												</button>
											{/if}
											{#if m.old || m.new}
												<div class="diff">
													{#if m.old}<div class="diff-old">{m.old}</div>{/if}
													{#if m.new}<div class="diff-new">{m.new}</div>{/if}
												</div>
											{/if}
										</li>
									{/each}
								</ul>
							</div>
						{/if}

						{#if selectedRow.warnings.length}
							<div class="row-warnings">
								{#each selectedRow.warnings as w (w)}
									<div class="warn-card">⚠ {w}</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				{#if amendments.length && (selectedRow.kind === 'amendment' || selectedRow.lifecycle?.type === 'committee_report' || selectedRow.lifecycle?.type === 'ponencia_report')}
					<div class="card subtle">
						<div class="card-head">
							<span class="muted">Linked <AknTerm term="amendment" /> documents</span>
						</div>
						<div class="card-body">
							<ul class="amend-list">
								{#each amendments as a (a.nativeId)}
									<li>
										<a href="/demo/{a.country}/{a.type}/{a.nativeId}">
											<span class="mono ink">{a.nativeId}</span>
											<span class="amend-sep">—</span>
											<span>{a.title}</span>
										</a>
									</li>
								{/each}
							</ul>
						</div>
					</div>
				{/if}
			{:else}
				<p class="empty">Select an event from the timeline.</p>
			{/if}

			<h2 class="eyebrow body-eyebrow">Body</h2>
			<p class="hint">
				The bill's &lt;<AknTerm term="body" />&gt;. When an event is selected, spans it
				touched are highlighted. Click an <AknTerm term="eId" /> to see which events touched
				that span.
			</p>

			{#if spanFocusEid}
				{@const events = eventsThatTouched(spanFocusEid)}
				<div class="card span-focus">
					<div class="card-head">
						<span class="muted">Events that touched</span>
						<span class="mono ink">eId={spanFocusEid}</span>
						<span class="card-head-spacer"></span>
						<button type="button" class="dismiss" onclick={() => (spanFocusEid = null)}>
							dismiss ✕
						</button>
					</div>
					<div class="card-body">
						{#if events.length}
							<ul class="amend-list">
								{#each events as e (e.id)}
									<li>
										<button type="button" class="event-link" onclick={() => selectEvent(e.id)}>
											<span class="mono ink">{e.date}</span>
											<span class="amend-sep">—</span>
											<span>{e.label}</span>
										</button>
									</li>
								{/each}
							</ul>
						{:else}
							<p class="empty">No events recorded as touching this span.</p>
						{/if}
					</div>
				</div>
			{/if}

			{#if parsed.body.length}
				<div class="body-tree card subtle">
					<div class="card-body">
						<BodyView
							nodes={parsed.body}
							{highlightedEids}
							spanToEvents={parsed.spanToEvents}
							onSpanClick={focusSpan}
						/>
					</div>
				</div>
			{:else}
				<p class="empty">This bill has no &lt;body&gt; content recorded.</p>
			{/if}
		</section>
	</div>
	{/if}
</div>

<style>
	/* ─── Page shell ─── */
	.page {
		max-width: 1280px;
		margin: 0 auto;
		padding: 24px 24px 96px;
		font-family: var(--font-mono);
		font-size: 12.5px;
		line-height: 1.55;
		color: #1f2937;
	}

	.back {
		display: inline-block;
		margin-bottom: 14px;
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--color-brand-dark);
		text-decoration: none;
		border-bottom: 1px dotted transparent;
		transition: border-color 0.1s ease;
	}
	.back:hover {
		border-bottom-color: var(--color-brand-dark);
	}

	/* ─── Header card ─── */
	.head {
		padding: 18px 22px 20px;
		margin-bottom: 28px;
		background-color: #ffffff;
	}
	.head-tag {
		display: flex;
		gap: 6px;
		align-items: baseline;
		font-family: var(--font-mono);
		font-size: 11px;
		color: #6b7280;
		margin-bottom: 10px;
	}
	.tag-mono :global(.text) {
		font-family: var(--font-mono);
	}
	.tag-sep {
		color: #d6d0c2;
	}
	.tag-sub {
		color: #4b5563;
	}
	.head h1 {
		font-family: var(--font-heading);
		font-size: 22px;
		line-height: 1.25;
		font-weight: 600;
		margin: 0 0 14px;
		color: #111827;
		max-width: 70ch;
	}
	.head-frbr {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 4px 16px;
		margin: 0;
		font-size: 11px;
		padding-top: 12px;
		border-top: 1px solid #e7e2d7;
	}
	.head-frbr dt {
		color: #6b7280;
		font-family: var(--font-heading);
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		align-self: center;
	}
	.head-frbr dd {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 11.5px;
		word-break: break-all;
	}

	.warnings {
		margin-top: 12px;
	}
	.warn-card {
		background: #fffbeb;
		border: 2px solid #111827;
		box-shadow: var(--shadow-sm);
		color: #78350f;
		padding: 6px 10px;
		font-family: var(--font-mono);
		font-size: 11px;
		border-radius: 4px;
		margin-top: 6px;
	}

	/* ─── Two columns ─── */
	.cols {
		display: grid;
		grid-template-columns: 260px 1fr;
		gap: 28px;
		align-items: start;
	}

	/* ─── Eyebrows ─── */
	.eyebrow {
		font-family: var(--font-heading);
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: #4b5563;
		margin: 0 0 8px;
	}
	.body-eyebrow {
		margin-top: 32px;
	}
	.hint {
		font-size: 11px;
		color: #6b7280;
		margin: 0 0 14px;
		line-height: 1.55;
		max-width: 60ch;
	}

	/* ─── Timeline (spine) ─── */
	.timeline {
		position: sticky;
		top: 96px;
	}
	.spine {
		list-style: none;
		padding: 0;
		margin: 0;
		border-left: 1px solid #e7e2d7;
	}
	.row button {
		display: grid;
		grid-template-columns: 58px 1fr;
		column-gap: 10px;
		width: 100%;
		text-align: left;
		background: none;
		border: none;
		border-left: 2px solid transparent;
		margin-left: -1px;
		padding: 6px 8px 6px 10px;
		cursor: pointer;
		font-family: inherit;
		font-size: inherit;
		color: inherit;
		transition: background-color 0.1s ease, border-color 0.1s ease;
	}
	.row button:hover {
		background: #fbfaf7;
	}
	.row.selected button {
		background: #f4fbe9;
	}
	.row.k-procedural button { border-left-color: #d1d5db; }
	.row.k-version button { border-left-color: var(--color-brand); }
	.row.k-amendment button { border-left-color: #fbbf24; }
	.row.k-terminal button { border-left-color: var(--color-deletion-500); }
	.row.selected button {
		border-left-width: 4px;
		padding-left: 8px;
	}
	.date {
		font-size: 10.5px;
		color: #6b7280;
		white-space: nowrap;
		line-height: 1.45;
		padding-top: 1px;
	}
	.content {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	.label {
		font-family: var(--font-mono);
		font-size: 11.5px;
		line-height: 1.4;
		color: #111827;
		word-break: break-word;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.row.selected .label {
		color: #0a0f1c;
	}
	.meta {
		display: flex;
		gap: 6px;
		align-items: center;
		font-size: 10px;
		color: #6b7280;
	}
	.chamber {
		font-family: var(--font-heading);
		font-size: 9px;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}
	.mod-count {
		font-family: var(--font-mono);
		font-size: 10px;
		color: #92400e;
	}
	.warn-mark {
		color: var(--color-deletion-800);
		font-size: 10px;
	}

	/* ─── Cards (override .card) ─── */
	.card {
		background-color: #ffffff;
		border: 2px solid #111827;
		border-radius: 8px;
		box-shadow: var(--shadow-sm);
	}
	.event-card {
		box-shadow: var(--shadow-md);
		position: relative;
		overflow: hidden;
		margin-bottom: 16px;
	}
	.event-card::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 4px;
		background: var(--color-brand);
	}
	.event-card.k-procedural::before { background: #9ca3af; }
	.event-card.k-version::before { background: var(--color-brand); }
	.event-card.k-amendment::before { background: #fbbf24; }
	.event-card.k-terminal::before { background: var(--color-deletion-500); }

	.card.subtle {
		border-color: #d6d0c2;
		box-shadow: none;
		background-color: #fbfaf7;
	}
	.card-head {
		padding: 9px 14px 9px 18px;
		border-bottom: 1px solid #e7e2d7;
		font-size: 11px;
		color: #4b5563;
		display: flex;
		gap: 8px;
		align-items: center;
	}
	.card-head-sep {
		color: #d6d0c2;
	}
	.card-head-spacer {
		flex: 1;
	}
	.kind-tag {
		font-family: var(--font-heading);
		font-size: 9px;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.12em;
	}
	.card-body {
		padding: 16px 18px;
	}
	.event-label {
		font-family: var(--font-mono);
		font-size: 14px;
		font-weight: 500;
		color: #0a0f1c;
		margin-bottom: 16px;
		line-height: 1.4;
	}

	/* ─── Origin sub-panels ─── */
	.origin-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 12px;
	}
	.origin {
		background: #fbfaf7;
		border: 1px solid #e7e2d7;
		border-radius: 6px;
		padding: 12px 14px;
	}
	.origin-full {
		grid-column: 1 / -1;
		margin-top: 12px;
	}
	.origin-head {
		font-family: var(--font-heading);
		font-size: 9.5px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #6b7280;
		margin-bottom: 10px;
		font-weight: 600;
	}
	.kv {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 4px 14px;
		margin: 0;
		font-size: 11.5px;
	}
	.kv dt {
		color: #6b7280;
	}
	.kv dd {
		margin: 0;
		color: #1f2937;
		word-break: break-word;
	}

	/* ─── Modifications ─── */
	.mods {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.mod-row {
		display: grid;
		grid-template-columns: 22px max-content 1fr;
		column-gap: 8px;
		row-gap: 6px;
		align-items: center;
		padding: 8px 10px 8px 8px;
		background: #ffffff;
		border: 1px solid #e7e2d7;
		border-left: 3px solid #9ca3af;
		border-radius: 4px;
		font-size: 11.5px;
	}
	.mod-row.mod-sub { border-left-color: #d97706; }
	.mod-row.mod-ins { border-left-color: var(--color-addition-500); }
	.mod-row.mod-rep { border-left-color: var(--color-deletion-500); }
	.mod-glyph {
		font-family: var(--font-mono);
		font-size: 14px;
		text-align: center;
		font-weight: 700;
		color: #4b5563;
	}
	.mod-row.mod-sub .mod-glyph { color: #d97706; }
	.mod-row.mod-ins .mod-glyph { color: var(--color-addition-500); }
	.mod-row.mod-rep .mod-glyph { color: var(--color-deletion-500); }
	.mod-kind {
		font-weight: 600;
		font-family: var(--font-heading);
		font-size: 11px;
		color: #1f2937;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.eid-pill {
		background: #f3f4f6;
		border: 1px solid #d1d5db;
		padding: 1px 6px;
		border-radius: 3px;
		font-family: var(--font-mono);
		font-size: 10.5px;
		color: #4b5563;
		cursor: pointer;
		transition: all 0.1s ease;
		justify-self: start;
	}
	.eid-pill:hover {
		background: var(--color-brand);
		border-color: var(--color-brand-dark);
		color: var(--color-brand-dark);
	}
	.eid-pill .ink {
		color: #0a0f1c;
	}
	.diff {
		grid-column: 1 / -1;
		font-family: var(--font-mono);
		font-size: 11px;
		line-height: 1.55;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.diff-old {
		color: var(--color-deletion-800);
		background: var(--color-deletion-50);
		border-left: 2px solid var(--color-deletion-500);
		padding: 4px 8px;
		border-radius: 0 3px 3px 0;
	}
	.diff-new {
		color: var(--color-addition-800);
		background: var(--color-addition-50);
		border-left: 2px solid var(--color-addition-500);
		padding: 4px 8px;
		border-radius: 0 3px 3px 0;
	}

	/* ─── Linked amendments / span-focus list ─── */
	.amend-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.amend-list li {
		padding: 6px 0;
		border-bottom: 1px dotted #e7e2d7;
		font-size: 11.5px;
	}
	.amend-list li:last-child {
		border-bottom: none;
	}
	.amend-list a,
	.event-link {
		color: var(--color-brand-dark);
		text-decoration: none;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		font-family: inherit;
		font-size: inherit;
		text-align: left;
		display: inline-flex;
		gap: 6px;
		align-items: baseline;
		flex-wrap: wrap;
	}
	.amend-list a:hover,
	.event-link:hover {
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.amend-sep {
		color: #d6d0c2;
	}

	/* ─── Span focus ─── */
	.span-focus {
		border-color: #d97706;
		box-shadow: var(--shadow-sm);
		margin-bottom: 16px;
	}
	.span-focus .card-head {
		background: #fffbeb;
	}
	.dismiss {
		font-family: var(--font-mono);
		font-size: 10.5px;
		background: #ffffff;
		border: 1px solid #d6d0c2;
		padding: 2px 8px;
		cursor: pointer;
		border-radius: 3px;
		color: #6b7280;
	}
	.dismiss:hover {
		border-color: #111827;
		color: #111827;
	}

	/* ─── Body tree wrapper ─── */
	.body-tree :global(.card-body) {
		padding: 14px 16px;
	}

	/* ─── Misc ─── */
	.muted { color: #6b7280; }
	.mono { font-family: var(--font-mono); }
	.ink { color: var(--color-brand-dark); }
	.empty {
		font-size: 12px;
		color: #9ca3af;
		font-style: italic;
		padding: 8px 0;
	}
	.row-warnings {
		margin-top: 14px;
	}

	/* ─── Tabs ─── */
	.tabs {
		display: flex;
		gap: 4px;
		margin: 0 0 18px;
		border-bottom: 2px solid #111827;
	}
	.tab {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		background: #f3f0e8;
		border: 2px solid #111827;
		border-bottom: none;
		border-radius: 6px 6px 0 0;
		padding: 7px 14px 8px;
		font-family: var(--font-heading);
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #4b5563;
		cursor: pointer;
		transform: translateY(2px);
	}
	.tab:hover {
		background: #ebe6d9;
	}
	.tab-active {
		background: #ffffff;
		color: #0a0f1c;
	}
	.tab-score {
		font-family: var(--font-mono);
		font-size: 10.5px;
		padding: 1px 6px;
		border-radius: 3px;
		font-weight: 500;
		letter-spacing: 0;
	}
	.score-good {
		background: #ecfdf5;
		color: #065f46;
		border: 1px solid #6ee7b7;
	}
	.score-mid {
		background: #fef3c7;
		color: #92400e;
		border: 1px solid #fcd34d;
	}
	.score-low {
		background: var(--color-deletion-50);
		color: var(--color-deletion-800);
		border: 1px solid var(--color-deletion-500);
	}
	.tab-pip {
		font-family: var(--font-mono);
		font-size: 10px;
		padding: 0 5px;
		border-radius: 8px;
		font-weight: 500;
		letter-spacing: 0;
	}
	.pip-err {
		background: var(--color-deletion-500);
		color: #ffffff;
	}
	.pip-warn {
		background: #fbbf24;
		color: #78350f;
	}

	/* ─── Lint view ─── */
	.lint-view {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.lint-summary {
		padding: 16px 22px 14px;
	}
	.lint-summary-main {
		display: flex;
		align-items: center;
		gap: 32px;
		flex-wrap: wrap;
	}
	.lint-score-block {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}
	.lint-score-num {
		font-family: var(--font-heading);
		font-size: 38px;
		font-weight: 700;
		line-height: 1;
		padding: 4px 10px;
		border-radius: 6px;
	}
	.lint-score-num .pct {
		font-size: 18px;
		opacity: 0.7;
		margin-left: 2px;
	}
	.lint-score-label {
		font-family: var(--font-heading);
		font-size: 9.5px;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: #6b7280;
		margin-top: 6px;
	}
	.lint-counts {
		display: flex;
		gap: 22px;
		margin: 0;
	}
	.lint-counts > div {
		display: flex;
		flex-direction: column;
	}
	.lint-counts dt {
		font-family: var(--font-heading);
		font-size: 9.5px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #6b7280;
	}
	.lint-counts dd {
		margin: 4px 0 0;
		font-family: var(--font-mono);
		font-size: 22px;
		font-weight: 600;
	}
	.cnt-err { color: var(--color-deletion-800); }
	.cnt-warn { color: #92400e; }
	.cnt-info { color: #4b5563; }
	.lint-hint {
		margin-top: 14px;
		max-width: 80ch;
	}
	.lint-hint code {
		background: #f3f0e8;
		padding: 1px 5px;
		border-radius: 3px;
		font-size: 10.5px;
	}

	.facets {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.facet {
		padding: 0;
		overflow: hidden;
	}
	.facet-head {
		padding: 14px 18px 12px;
		border-bottom: 1px solid #e7e2d7;
		background: #fbfaf7;
	}
	.facet-title {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}
	.facet-title h3 {
		margin: 0;
		font-family: var(--font-heading);
		font-size: 14px;
		font-weight: 600;
		color: #0a0f1c;
	}
	.facet-score {
		font-family: var(--font-mono);
		font-size: 11px;
		padding: 1px 7px;
		border-radius: 3px;
	}
	.facet-meta {
		font-family: var(--font-mono);
		font-size: 10.5px;
		color: #6b7280;
	}
	.facet-rationale {
		margin: 8px 0 0;
		font-size: 11.5px;
		color: #4b5563;
		line-height: 1.55;
		max-width: 80ch;
	}
	.facet-body {
		padding: 12px 16px 16px;
	}

	.exp-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 11px;
	}
	.exp-table th {
		text-align: left;
		font-family: var(--font-heading);
		font-size: 9.5px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #6b7280;
		font-weight: 600;
		padding: 4px 8px 6px;
		border-bottom: 1px solid #e7e2d7;
	}
	.exp-table td {
		padding: 5px 8px;
		border-bottom: 1px dotted #efeae0;
		vertical-align: top;
	}
	.th-status { width: 22px; }
	.th-w { width: 36px; text-align: right; }
	.th-count { width: 110px; }
	.th-xpath { width: 38%; }
	.exp-status {
		text-align: center;
		font-family: var(--font-mono);
		font-size: 13px;
		font-weight: 700;
	}
	.exp-ok .status-glyph { color: var(--color-addition-500); }
	.exp-missing .status-glyph { color: var(--color-deletion-500); }
	.exp-invalid .status-glyph { color: var(--color-deletion-500); }
	.exp-optional-missing .status-glyph { color: #9ca3af; }
	.exp-row.exp-missing { background: var(--color-deletion-50); }
	.exp-row.exp-invalid { background: var(--color-deletion-50); }
	.exp-row.exp-optional-missing { color: #6b7280; }
	.exp-id .mono {
		font-family: var(--font-mono);
		font-size: 11px;
		color: #1f2937;
	}
	.exp-kind {
		display: inline-block;
		font-family: var(--font-heading);
		font-size: 9px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #6b7280;
		padding: 0 4px;
		margin-left: 4px;
		background: #f3f0e8;
		border-radius: 2px;
	}
	.exp-xpath {
		font-size: 10.5px;
		color: #4b5563;
		word-break: break-all;
	}
	.exp-w {
		text-align: right;
		color: #6b7280;
	}
	.exp-count {
		font-size: 11px;
	}
	.exp-val {
		color: #4b5563;
	}

	.findings {
		list-style: none;
		padding: 0;
		margin: 14px 0 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.finding {
		padding: 10px 12px;
		border: 1px solid #e7e2d7;
		border-left-width: 3px;
		border-radius: 4px;
		background: #ffffff;
	}
	.finding.sev-error {
		border-left-color: var(--color-deletion-500);
		background: var(--color-deletion-50);
	}
	.finding.sev-warn {
		border-left-color: #fbbf24;
		background: #fffbeb;
	}
	.finding.sev-info {
		border-left-color: #9ca3af;
		background: #fbfaf7;
	}
	.finding-head {
		display: flex;
		gap: 8px;
		align-items: baseline;
		margin-bottom: 4px;
	}
	.finding-sev {
		font-family: var(--font-heading);
		font-size: 9px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #6b7280;
	}
	.finding.sev-error .finding-sev { color: var(--color-deletion-800); }
	.finding.sev-warn .finding-sev { color: #92400e; }
	.finding-id {
		font-size: 11px;
		color: #1f2937;
	}
	.finding-msg {
		font-size: 12px;
		color: #1f2937;
		margin-bottom: 4px;
	}
	.finding-rationale {
		font-size: 11px;
		color: #4b5563;
		line-height: 1.55;
		margin-bottom: 6px;
	}
	.finding-xpath {
		display: inline-block;
		font-family: var(--font-mono);
		font-size: 10.5px;
		color: #6b7280;
		background: #f3f0e8;
		padding: 1px 5px;
		border-radius: 3px;
	}

	/* ─── Responsive ─── */
	@media (max-width: 900px) {
		.cols {
			grid-template-columns: 1fr;
		}
		.timeline {
			position: static;
		}
		.page {
			padding: 16px 16px 64px;
		}
	}
</style>
