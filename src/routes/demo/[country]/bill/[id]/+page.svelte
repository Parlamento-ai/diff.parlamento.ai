<script lang="ts">
	import AknTerm from '$lib/bill/AknTerm.svelte';
	import BodyView from '$lib/bill/BodyView.svelte';
	import type { TimelineRow, Modification } from '$lib/bill/parse';

	let { data } = $props();
	const doc = $derived(data.doc);
	const parsed = $derived(data.parsed);
	const amendments = $derived(data.amendments);

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

	function eventsThatTouched(eId: string): TimelineRow[] {
		const ids = new Set(parsed.spanToEvents[eId] ?? []);
		return parsed.timeline.filter((r) => ids.has(r.id));
	}
</script>

<svelte:head>
	<title>{doc.nativeId} — bill — research demo</title>
</svelte:head>

<div class="page">
	<header class="head">
		<a href="/demo/{doc.countryCode}/bill" class="back">← bills</a>
		<div class="ident">
			<div class="row">
				<span class="muted"><AknTerm term="bill" /></span>
				<span class="muted">·</span>
				<span class="muted">{doc.countryCode}</span>
				<span class="muted">·</span>
				<span class="mono">{doc.nativeId}</span>
				{#if parsed.identification.subtype}
					<span class="muted">·</span>
					<span>{parsed.identification.subtype}</span>
				{/if}
			</div>
			<h1>{doc.title}</h1>
			<div class="frbr">
				{#if parsed.identification.frbrExpression}
					<span class="muted">
						<AknTerm term="FRBR expression" />:
					</span>
					<span class="mono">{parsed.identification.frbrExpression}</span>
				{/if}
				{#if parsed.identification.expressionDate}
					<span class="muted">expression date</span>
					<span class="mono">{parsed.identification.expressionDate}</span>
				{/if}
				{#if parsed.identification.language}
					<span class="muted">lang</span>
					<span class="mono">{parsed.identification.language}</span>
				{/if}
			</div>
			{#if parsed.warnings.length}
				<div class="warnings">
					{#each parsed.warnings as w (w)}
						<div class="warn">⚠ {w}</div>
					{/each}
				</div>
			{/if}
		</div>
	</header>

	<div class="cols">
		<aside class="timeline">
			<h2>Timeline</h2>
			<p class="hint">
				One row per event, joined across <AknTerm term="lifecycle" />,
				<AknTerm term="workflow" /> and <AknTerm term="analysis" /> via shared
				<AknTerm term="TLCEvent" /> ids.
			</p>
			<ol>
				{#each parsed.timeline as row (row.id)}
					{@const selected = row.id === selectedId}
					<li class="row k-{row.kind}" class:selected>
						<button
							type="button"
							onclick={() => selectEvent(row.id)}
							title={rowTooltip(row)}
						>
							<span class="date mono">{row.date || '—'}</span>
							<span class="dot" aria-hidden="true">●</span>
							<span class="label">{row.label}</span>
							<span class="meta">
								{#if row.chamber}<span class="chamber">{row.chamber}</span>{/if}
								{#if row.lifecycle}<span class="badge">version</span>{/if}
								{#if row.modifications.length}
									<span class="badge mod">{row.modifications.length} change(s)</span>
								{/if}
								{#if row.warnings.length}
									<span class="badge warn-badge" title={row.warnings.join('\n')}>⚠</span>
								{/if}
							</span>
							<span class="kind">{rowKindLabel(row.kind)}</span>
						</button>
					</li>
				{/each}
			</ol>
			{#if !parsed.timeline.length}
				<p class="empty">No events found in this bill.</p>
			{/if}
		</aside>

		<section class="detail">
			{#if selectedRow}
				<h2>Event detail</h2>

				<div class="card">
					<div class="card-head">
						<span class="mono">{selectedRow.date || '—'}</span>
						{#if selectedRow.chamber}
							<span class="muted">· <AknTerm term="chamber" />: {selectedRow.chamber}</span>
						{/if}
					</div>
					<div class="card-body">
						<div class="label">{selectedRow.label}</div>

						{#if selectedRow.lifecycle}
							<div class="origin">
								<div class="origin-head">
									From <AknTerm term="lifecycle" />/<AknTerm term="eventRef" />:
								</div>
								<dl>
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
									From <AknTerm term="workflow" />/<AknTerm term="step" />:
								</div>
								<dl>
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

						{#if selectedRow.modifications.length}
							<div class="origin">
								<div class="origin-head">
									From <AknTerm term="analysis" />/<AknTerm term="activeModifications" />:
								</div>
								<ul class="mods">
									{#each selectedRow.modifications as m, i (i)}
										<li class="mod-row">
											<span class="mod-glyph">{modKindGlyph(m.kind)}</span>
											<span class="mod-kind">{m.kind}</span>
											{#if m.targetEid}
												<button
													type="button"
													class="mod-target"
													onclick={() => m.targetEid && focusSpan(m.targetEid)}
													title="scroll to span in body view"
												>
													<AknTerm term="eId" />={m.targetEid}
												</button>
											{/if}
											{#if m.old || m.new}
												<div class="diff">
													{#if m.old}<div class="old">– {m.old}</div>{/if}
													{#if m.new}<div class="new">+ {m.new}</div>{/if}
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
									<div class="warn">⚠ {w}</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				{#if amendments.length && (selectedRow.kind === 'amendment' || selectedRow.lifecycle?.type === 'committee_report' || selectedRow.lifecycle?.type === 'ponencia_report')}
					<div class="card subtle">
						<div class="card-head">Linked <AknTerm term="amendment" /> documents</div>
						<div class="card-body">
							<ul class="amend-list">
								{#each amendments as a (a.nativeId)}
									<li>
										<a href="/demo/{a.country}/{a.type}/{a.nativeId}">
											<span class="mono">{a.nativeId}</span> — {a.title}
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

			<h2 class="body-head">Body</h2>
			<p class="hint">
				The bill's &lt;<AknTerm term="body" />&gt;. When an event is selected, spans it
				touched are highlighted. Click an <AknTerm term="eId" /> to see which events touched
				that span.
			</p>

			{#if spanFocusEid}
				{@const events = eventsThatTouched(spanFocusEid)}
				<div class="card span-focus">
					<div class="card-head">
						Events that touched <span class="mono">eId={spanFocusEid}</span>
					</div>
					<div class="card-body">
						{#if events.length}
							<ul class="amend-list">
								{#each events as e (e.id)}
									<li>
										<button type="button" onclick={() => selectEvent(e.id)}>
											<span class="mono">{e.date}</span> — {e.label}
										</button>
									</li>
								{/each}
							</ul>
						{:else}
							<p class="empty">No events recorded as touching this span.</p>
						{/if}
						<button type="button" class="dismiss" onclick={() => (spanFocusEid = null)}>
							dismiss
						</button>
					</div>
				</div>
			{/if}

			{#if parsed.body.length}
				<div class="body-tree">
					<BodyView
						nodes={parsed.body}
						{highlightedEids}
						spanToEvents={parsed.spanToEvents}
						onSpanClick={focusSpan}
					/>
				</div>
			{:else}
				<p class="empty">This bill has no &lt;body&gt; content recorded.</p>
			{/if}
		</section>
	</div>
</div>

<style>
	.page {
		max-width: 1280px;
		margin: 0 auto;
		padding: 24px 16px 80px;
		font-family: ui-sans-serif, system-ui, sans-serif;
		font-size: 13px;
		color: #1f2937;
	}
	.head {
		border-bottom: 1px solid #e5e7eb;
		padding-bottom: 16px;
		margin-bottom: 16px;
	}
	.back {
		font-size: 12px;
		color: #2563eb;
		text-decoration: none;
	}
	.back:hover {
		text-decoration: underline;
	}
	.ident {
		margin-top: 8px;
	}
	.row {
		display: flex;
		gap: 6px;
		align-items: baseline;
		font-size: 12px;
	}
	h1 {
		font-size: 18px;
		margin: 6px 0 6px;
		font-weight: 700;
	}
	h2 {
		font-size: 13px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #374151;
		margin: 0 0 8px;
	}
	.frbr {
		font-size: 11px;
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		align-items: baseline;
	}
	.muted {
		color: #6b7280;
	}
	.mono {
		font-family: ui-monospace, monospace;
	}
	.warnings {
		margin-top: 8px;
	}
	.warn {
		color: #92400e;
		background: #fffbeb;
		border-left: 2px solid #d97706;
		padding: 4px 8px;
		font-size: 11px;
		margin-top: 2px;
	}
	.cols {
		display: grid;
		grid-template-columns: 320px 1fr;
		gap: 24px;
	}
	.timeline ol {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.hint {
		font-size: 11px;
		color: #6b7280;
		margin: 0 0 12px;
		line-height: 1.5;
	}
	.row.k-procedural .dot {
		color: #6b7280;
	}
	.row.k-version .dot {
		color: #2563eb;
	}
	.row.k-amendment .dot {
		color: #d97706;
	}
	.row.k-terminal .dot {
		color: #15803d;
	}
	.timeline button {
		display: grid;
		grid-template-columns: 80px 14px 1fr;
		gap: 6px;
		align-items: baseline;
		width: 100%;
		text-align: left;
		background: none;
		border: none;
		border-bottom: 1px solid #f3f4f6;
		padding: 6px 4px;
		cursor: pointer;
		font-family: inherit;
		font-size: inherit;
		color: inherit;
	}
	.timeline button:hover {
		background: #f9fafb;
	}
	.row.selected button {
		background: #fef3c7;
	}
	.date {
		font-size: 11px;
		color: #6b7280;
	}
	.dot {
		font-size: 10px;
	}
	.label {
		font-size: 12px;
		line-height: 1.3;
	}
	.meta {
		grid-column: 3;
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
		margin-top: 4px;
	}
	.kind {
		grid-column: 3;
		font-size: 10px;
		color: #9ca3af;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.chamber {
		font-size: 10px;
		color: #4b5563;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.badge {
		font-size: 10px;
		padding: 0 4px;
		background: #e5e7eb;
		color: #374151;
	}
	.badge.mod {
		background: #fed7aa;
		color: #9a3412;
	}
	.badge.warn-badge {
		background: #fde68a;
		color: #92400e;
	}
	.detail .card {
		border: 1px solid #e5e7eb;
		margin: 0 0 12px;
	}
	.detail .card.subtle {
		border-color: #f3f4f6;
	}
	.card-head {
		padding: 6px 10px;
		border-bottom: 1px solid #f3f4f6;
		font-size: 11px;
		color: #4b5563;
		display: flex;
		gap: 8px;
		align-items: baseline;
	}
	.card-body {
		padding: 10px;
	}
	.label {
		font-weight: 600;
		margin-bottom: 8px;
	}
	.origin {
		margin-top: 12px;
	}
	.origin-head {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #6b7280;
		margin-bottom: 4px;
	}
	dl {
		display: grid;
		grid-template-columns: 100px 1fr;
		gap: 2px 12px;
		margin: 0;
		font-size: 12px;
	}
	dt {
		color: #6b7280;
	}
	dd {
		margin: 0;
	}
	.mods {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.mod-row {
		padding: 6px 0;
		border-bottom: 1px dotted #e5e7eb;
		font-size: 12px;
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		align-items: baseline;
	}
	.mod-glyph {
		font-family: ui-monospace, monospace;
		color: #d97706;
	}
	.mod-kind {
		font-weight: 600;
	}
	.mod-target {
		background: none;
		border: none;
		color: #2563eb;
		text-decoration: underline dotted;
		cursor: pointer;
		padding: 0;
		font-family: ui-monospace, monospace;
		font-size: 12px;
	}
	.diff {
		flex-basis: 100%;
		padding: 4px 8px;
		background: #f9fafb;
		font-family: ui-monospace, monospace;
		font-size: 11px;
		line-height: 1.5;
	}
	.old {
		color: #991b1b;
	}
	.new {
		color: #166534;
	}
	.amend-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.amend-list li {
		padding: 4px 0;
		border-bottom: 1px dotted #e5e7eb;
		font-size: 12px;
	}
	.amend-list a,
	.amend-list button {
		color: #2563eb;
		text-decoration: none;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		font-family: inherit;
		font-size: inherit;
	}
	.amend-list a:hover,
	.amend-list button:hover {
		text-decoration: underline;
	}
	.empty {
		font-size: 12px;
		color: #9ca3af;
	}
	.body-head {
		margin-top: 24px;
	}
	.span-focus {
		border-color: #d97706;
	}
	.dismiss {
		margin-top: 8px;
		font-size: 11px;
		background: none;
		border: 1px solid #e5e7eb;
		padding: 2px 8px;
		cursor: pointer;
	}
	.row-warnings {
		margin-top: 12px;
	}
	.body-tree {
		border-top: 1px solid #f3f4f6;
		padding-top: 8px;
	}
</style>
