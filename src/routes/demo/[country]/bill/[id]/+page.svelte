<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import PlusIcon from '~icons/lucide/plus';
	import AknTerm from '$lib/bill/AknTerm.svelte';
	import BodyView from '$lib/bill/BodyView.svelte';
	import type { TimelineRow, Modification } from '$lib/bill/parse';

	let { data } = $props();
	const doc = $derived(data.doc);
	const parsed = $derived(data.parsed);
	const amendments = $derived(data.amendments);
	const linkedDocs = $derived(data.linkedDocs);
	const lint = $derived(data.lint);

	type XmlSource = { key: string; type: string; nativeId: string; title: string; xml: string };
	const xmlSources = $derived<XmlSource[]>([
		{ key: 'bill', type: 'bill', nativeId: doc.nativeId, title: doc.title, xml: doc.xml },
		...linkedDocs.map((d) => ({
			key: `${d.type}:${d.nativeId}`,
			type: d.type,
			nativeId: d.nativeId,
			title: d.title,
			xml: d.xml
		}))
	]);
	function searchParam(name: string) {
		return browser ? page.url.searchParams.get(name) : null;
	}

	const activeXmlKey = $derived<string>(
		(() => {
			const requested = searchParam('doc');
			if (!requested) return 'bill';
			return xmlSources.some((s) => s.key === requested) ? requested : 'bill';
		})()
	);
	const activeXmlSource = $derived(
		xmlSources.find((s) => s.key === activeXmlKey) ?? xmlSources[0]
	);

	function setXmlSource(key: string) {
		const url = new URL(page.url);
		url.searchParams.set('tab', 'xml');
		if (key === 'bill') url.searchParams.delete('doc');
		else url.searchParams.set('doc', key);
		goto(url, { replaceState: false, keepFocus: true, noScroll: true });
	}

	type Tab = 'document' | 'lint' | 'xml';
	const TABS: Tab[] = ['document', 'lint', 'xml'];
	const activeTab = $derived<Tab>(
		((tab) => (TABS.includes(tab as Tab) ? (tab as Tab) : 'document'))(searchParam('tab'))
	);
	function setTab(tab: Tab) {
		const url = new URL(page.url);
		if (tab === 'document') url.searchParams.delete('tab');
		else url.searchParams.set('tab', tab);
		goto(url, { replaceState: false, keepFocus: true, noScroll: true });
	}
	let xmlCopied = $state(false);
	let titleExpanded = $state(false);
	let titleEl = $state<HTMLElement | null>(null);
	let titleTruncated = $state(false);

	$effect(() => {
		void doc.title;
		if (!titleEl || titleExpanded) return;
		titleTruncated = titleEl.scrollWidth > titleEl.clientWidth + 1;
	});

	function copyXml() {
		navigator.clipboard.writeText(activeXmlSource.xml).then(() => {
			xmlCopied = true;
			setTimeout(() => (xmlCopied = false), 1500);
		});
	}

	function highlightXml(xml: string): string {
		const escaped = xml
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
		return escaped
			.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="xml-comment">$1</span>')
			.replace(
				/(&lt;\/?)([a-zA-Z_][\w:-]*)([^&]*?)(\/?&gt;)/g,
				(_match, open, tag, attrs, close) => {
					const attrsHl = attrs.replace(
						/([a-zA-Z_][\w:-]*)(=)(&quot;[^&]*?&quot;|"[^"]*?")/g,
						'<span class="xml-attr">$1</span>$2<span class="xml-val">$3</span>'
					);
					return `<span class="xml-bracket">${open}</span><span class="xml-tag">${tag}</span>${attrsHl}<span class="xml-bracket">${close}</span>`;
				}
			);
	}

	const xmlLineCount = $derived(activeXmlSource.xml.split('\n').length);
	const xmlGutter = $derived(
		Array.from({ length: xmlLineCount }, (_, i) => i + 1).join('\n')
	);
	const xmlGutterWidth = $derived(`${String(xmlLineCount).length}ch`);

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
				.filter((m) => m.targetIsLocal)
				.map((m) => m.targetEid)
				.filter((x): x is string => Boolean(x))
		)
	);

	function selectEvent(id: string) {
		selectedId = id;
	}

	function scrollToSpan(eId: string) {
		const target = document.querySelector<HTMLElement>(`[data-eid="${eId}"]`);
		if (!target) return;
		target.scrollIntoView({ behavior: 'smooth', block: 'center' });
		target.classList.add('flash-highlight');
		setTimeout(() => target.classList.remove('flash-highlight'), 1200);
	}

	function rowTooltip(row: TimelineRow): string {
		const parts: string[] = [];
		if (row.origin?.type === 'amendment') {
			parts.push(`This event comes from linked amendment document ${row.origin.nativeId}.`);
		} else if (row.origin?.type === 'debate') {
			parts.push(`This event comes from linked debate document ${row.origin.nativeId}.`);
		} else if (row.origin?.type === 'citation') {
			parts.push(`This event comes from linked citation document ${row.origin.nativeId}.`);
		}
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

	function kindLabel(k: TimelineRow['kind']): string {
		return k;
	}

	function splitDate(iso: string): { day: string; time: string | null } {
		if (!iso) return { day: '—', time: null };
		const m = iso.match(/^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}))/);
		if (m) return { day: m[1], time: m[2] };
		return { day: iso, time: null };
	}

	function wordCount(s: string | undefined): number {
		if (!s) return 0;
		return s.trim().split(/\s+/).filter(Boolean).length;
	}

	function changeDelta(mods: Modification[]): { added: number; removed: number } {
		let added = 0;
		let removed = 0;
		for (const m of mods) {
			if (m.kind === 'insertion') {
				added += wordCount(m.new);
			} else if (m.kind === 'repeal') {
				removed += wordCount(m.old);
			} else if (m.kind === 'substitution') {
				added += wordCount(m.new);
				removed += wordCount(m.old);
			}
		}
		return { added, removed };
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

	type Seg =
		| { t: 'openTag'; tag: string; indent: number } // <tag (no closing bracket; attrs follow)
		| { t: 'attr'; name: string; value: string; indent: number }
		| { t: 'closeOpenTag'; selfClose: boolean; indent: number } // /> or >
		| { t: 'tagLine'; tag: string; indent: number } // <tag>
		| { t: 'closeLine'; tag: string; indent: number } // </tag>
		| { t: 'comment'; text: string; indent: number }
		| { t: 'ellipsis'; text: string; indent: number };

	function buildProvenanceSnippet(row: TimelineRow): Seg[] {
		const lines: Seg[] = [];
		const scope = row.origin?.type ?? 'bill';
		const scopeRows = parsed.timeline.filter(
			(r) => (r.origin?.type ?? 'bill') === scope &&
				(r.origin?.nativeId ?? null) === (row.origin?.nativeId ?? null)
		);
		const eventRefSiblings = scopeRows.filter((r) => r.lifecycle && r.id !== row.id).length;
		const stepSiblings = scopeRows.filter((r) => r.step && r.id !== row.id).length;
		const modSiblings = scopeRows.reduce(
			(n, r) => n + (r.id === row.id ? 0 : r.modifications.length),
			0
		);

		if (row.origin) {
			lines.push({
				t: 'comment',
				indent: 0,
				text: `linked from ${row.origin.type} ${row.origin.nativeId}`
			});
		}

		// <lifecycle>
		lines.push({ t: 'tagLine', tag: 'lifecycle', indent: 0 });
		if (row.lifecycle) {
			lines.push({ t: 'openTag', tag: 'eventRef', indent: 1 });
			pushAttr(lines, 'date', row.lifecycle.date, 2);
			pushAttr(lines, 'refersTo', row.lifecycle.source, 2);
			pushAttr(lines, 'source', row.lifecycle.tlcEventId, 2);
			pushAttr(lines, 'eId', row.lifecycle.eId, 2);
			pushAttr(lines, 'showAs', row.lifecycle.showAs, 2);
			pushAttr(lines, 'chamber', row.lifecycle.chamber, 2);
			lines.push({ t: 'closeOpenTag', selfClose: true, indent: 1 });
			if (eventRefSiblings > 0) {
				lines.push({
					t: 'ellipsis',
					indent: 1,
					text: `... ${eventRefSiblings} other eventRef${eventRefSiblings === 1 ? '' : 's'}`
				});
			}
		} else {
			lines.push({
				t: 'comment',
				indent: 1,
				text: 'no eventRef referencing this event'
			});
		}
		lines.push({ t: 'closeLine', tag: 'lifecycle', indent: 0 });

		// <workflow>
		lines.push({ t: 'tagLine', tag: 'workflow', indent: 0 });
		if (row.step) {
			lines.push({ t: 'openTag', tag: 'step', indent: 1 });
			pushAttr(lines, 'date', row.step.date, 2);
			pushAttr(lines, 'refersTo', row.step.refersTo, 2);
			pushAttr(lines, 'source', row.step.source, 2);
			pushAttr(lines, 'by', row.step.agent, 2);
			pushAttr(lines, 'as', row.step.role, 2);
			pushAttr(lines, 'outcome', row.step.outcome, 2);
			pushAttr(lines, 'showAs', row.step.showAs, 2);
			lines.push({ t: 'closeOpenTag', selfClose: true, indent: 1 });
			if (stepSiblings > 0) {
				lines.push({
					t: 'ellipsis',
					indent: 1,
					text: `... ${stepSiblings} other step${stepSiblings === 1 ? '' : 's'}`
				});
			}
		} else {
			lines.push({
				t: 'comment',
				indent: 1,
				text: 'no step referencing this event'
			});
		}
		lines.push({ t: 'closeLine', tag: 'workflow', indent: 0 });

		// <analysis>
		lines.push({ t: 'tagLine', tag: 'analysis', indent: 0 });
		if (row.modifications.length) {
			lines.push({ t: 'tagLine', tag: 'activeModifications', indent: 1 });
			lines.push({
				t: 'comment',
				indent: 2,
				text: `${row.modifications.length} change${row.modifications.length === 1 ? '' : 's'} for this event — shown above`
			});
			if (modSiblings > 0) {
				lines.push({
					t: 'ellipsis',
					indent: 2,
					text: `... ${modSiblings} other change${modSiblings === 1 ? '' : 's'} on other events`
				});
			}
			lines.push({ t: 'closeLine', tag: 'activeModifications', indent: 1 });
		} else {
			lines.push({
				t: 'comment',
				indent: 1,
				text: 'no activeModifications referencing this event'
			});
		}
		lines.push({ t: 'closeLine', tag: 'analysis', indent: 0 });

		return lines;
	}

	function pushAttr(lines: Seg[], name: string, value: string | undefined, indent: number) {
		if (value === undefined || value === '') {
			lines.push({ t: 'comment', indent, text: `${name}: not set` });
		} else {
			lines.push({ t: 'attr', name, value, indent });
		}
	}

	function indentStr(n: number): string {
		return '  '.repeat(n);
	}

	const provenanceSnippet = $derived(selectedRow ? buildProvenanceSnippet(selectedRow) : []);
</script>

<svelte:head>
	<title>{doc.nativeId} — bill — research demo</title>
</svelte:head>

<div class="head-band">
	<header class="head">
		<div class="head-row" class:head-row-expanded={titleExpanded}>
			<h1
				class="head-title"
				class:head-title-expanded={titleExpanded}
				title={doc.title}
				bind:this={titleEl}
			><span class="head-id">{doc.nativeId}</span>{doc.title}</h1>
			{#if !titleExpanded && titleTruncated}
				<button
					type="button"
					class="head-title-toggle"
					onclick={() => (titleExpanded = true)}
					aria-expanded={false}
					aria-label="show more"
				><PlusIcon class="h-3 w-3" /></button>
			{/if}
		</div>
		{#if titleExpanded}
			<button
				type="button"
				class="head-title-collapse"
				onclick={() => (titleExpanded = false)}
				aria-expanded={true}
			>show less</button>
		{/if}

		{#if parsed.warnings.length}
			<div class="warnings">
				{#each parsed.warnings as w (w)}
					<div class="warn-card">⚠ {w}</div>
				{/each}
			</div>
		{/if}
	</header>

	<!-- ─── TAB STRIP ─── -->
	<nav class="bill-subnav" aria-label="Document views">
		<button
			type="button"
			class="subtab"
			class:subtab-active={activeTab === 'document'}
			onclick={() => setTab('document')}
		>
			Document
		</button>
		<button
			type="button"
			class="subtab"
			class:subtab-active={activeTab === 'lint'}
			onclick={() => setTab('lint')}
		>
			AKN lint
			<span class="tab-score {scoreClass(completenessPct)}">{completenessPct}%</span>
			{#if errorCount}<span class="tab-pip pip-err">{errorCount}</span>{/if}
			{#if warnCount}<span class="tab-pip pip-warn">{warnCount}</span>{/if}
		</button>
		<button
			type="button"
			class="subtab"
			class:subtab-active={activeTab === 'xml'}
			onclick={() => setTab('xml')}
		>
			XML
		</button>
	</nav>
</div>

<div class="page">

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
	{:else if activeTab === 'xml'}
		<section class="xml-view">
			{#if xmlSources.length > 1}
				<nav class="xml-subtabs" aria-label="XML source">
					{#each xmlSources as src (src.key)}
						<button
							type="button"
							class="xml-subtab"
							class:xml-subtab-active={src.key === activeXmlKey}
							onclick={() => setXmlSource(src.key)}
							title={src.title}
						>
							<span class="xml-subtab-type">{src.type}</span>
							<span class="xml-subtab-id mono">{src.nativeId}</span>
						</button>
					{/each}
				</nav>
			{/if}
			<header class="xml-toolbar">
				<div class="xml-meta">
					<span class="xml-meta-label">raw XML</span>
					<span class="xml-meta-sep">·</span>
					<span class="mono">{(activeXmlSource.xml.length / 1024).toFixed(1)} KB</span>
					<span class="xml-meta-sep">·</span>
					<span class="mono">{activeXmlSource.xml.split('\n').length.toLocaleString()} lines</span>
				</div>
				<button type="button" class="xml-copy" onclick={copyXml}>
					{xmlCopied ? '✓ copied' : 'copy'}
				</button>
			</header>
			<pre class="xml-pre" style="--gutter-w: {xmlGutterWidth};"><span class="xml-gutter" aria-hidden="true">{xmlGutter}</span><code class="xml-code">{@html highlightXml(activeXmlSource.xml)}</code></pre>
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
						{@const d = splitDate(row.date)}
						{@const delta = changeDelta(row.modifications)}
						<li class="row k-{row.kind}" class:selected>
							<button
								type="button"
								onclick={() => selectEvent(row.id)}
								title={`${row.label}${row.chamber ? ` · ${row.chamber}` : ''}\n\n${rowTooltip(row)}`}
							>
								<span class="content">
									<span class="row-head">
										<span class="date mono">{d.day}</span>
										{#if d.time}<span class="time mono">{d.time}</span>{/if}
										<span class="kind-tag">{kindLabel(row.kind)}</span>
									</span>
									<span class="label">{row.label}</span>
									{#if row.chamber || row.origin || row.modifications.length || row.warnings.length}
										<span class="meta">
											{#if row.chamber}<span class="meta-item chamber">{row.chamber}</span>{/if}
											{#if row.origin?.type && row.origin.type !== 'bill'}
												<span class="meta-item from">from {row.origin.type}</span>
											{/if}
											{#if row.modifications.length}
												<span class="meta-item delta" title="{row.modifications.length} change{row.modifications.length === 1 ? '' : 's'} · +{delta.added} / −{delta.removed} words">
													{#if delta.added || delta.removed}
														{#if delta.added}<span class="d-add">+{delta.added}</span>{/if}
														{#if delta.removed}<span class="d-rem">−{delta.removed}</span>{/if}
														<span class="d-unit">words</span>
													{:else}
														<span class="d-unit">{row.modifications.length} change{row.modifications.length === 1 ? '' : 's'}</span>
													{/if}
												</span>
											{/if}
											{#if row.warnings.length}
												<span class="meta-item warn" title={row.warnings.join('\n')}>⚠</span>
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

				{@const showAmendments =
					amendments.length &&
					(selectedRow.kind === 'amendment' ||
						selectedRow.lifecycle?.type === 'committee_report' ||
						selectedRow.lifecycle?.type === 'ponencia_report')}

				<div class="event">
					<div class="event-head">
						<span class="mono ink">{selectedRow.date || '—'}</span>
						{#if selectedRow.chamber}
							<span class="event-head-sep">·</span>
							<span class="muted">{selectedRow.chamber}</span>
						{/if}
						<span class="event-head-spacer"></span>
						{#if selectedRow.origin}
							<a
								class="src-badge src-linked"
								href="/demo/{doc.countryCode}/{selectedRow.origin.type}/{selectedRow.origin.nativeId}"
								title={selectedRow.origin.title ?? ''}
							>
								linked → <span class="mono">{selectedRow.origin.nativeId}</span>
							</a>
						{:else}
							<span class="src-badge src-internal">internal</span>
						{/if}
					</div>
					<div class="event-label">{selectedRow.label}</div>

						{#if selectedRow.modifications.length}
							<ul class="mods">
								{#each selectedRow.modifications as m, i (i)}
									<li class="mod-row {modKindClass(m.kind)}">
										<span class="mod-glyph" aria-hidden="true">{modKindGlyph(m.kind)}</span>
										<span class="mod-kind">{m.kind}</span>
										{#if m.targetEid}
											{@const external = !!m.targetHref && !m.targetHref.startsWith('#') && !m.targetIsLocal}
											<button
												type="button"
												class="eid-pill"
												class:eid-pill-external={external}
												disabled={!m.targetIsLocal}
												onclick={() => m.targetEid && m.targetIsLocal && scrollToSpan(m.targetEid)}
												title={m.targetIsLocal
													? 'scroll to span in body view'
													: (m.targetHref ?? 'target is in another document')}
											>
												{#if external}<span class="ext-glyph" aria-hidden="true">↗</span>{/if}
												<span class="ink">{m.targetEid}</span>
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
						{/if}

						{#if showAmendments}
							<div class="linked-inline">
								<div class="linked-inline-head">
									linked <AknTerm term="amendment" /> documents
								</div>
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
						{/if}

						{#if selectedRow.warnings.length}
							<div class="row-warnings">
								{#each selectedRow.warnings as w (w)}
									<div class="warn-card">⚠ {w}</div>
								{/each}
							</div>
						{/if}

						<details class="provenance">
							<summary>
								<span class="prov-caret" aria-hidden="true">▸</span>
								<span class="prov-label">source</span>
							</summary>

							<pre class="prov-xml"><code>{#each provenanceSnippet as seg, i (i)}{#if seg.t === 'tagLine'}{indentStr(seg.indent)}<span class="xml-bracket">{'<'}</span><span class="xml-tag">{seg.tag}</span><span class="xml-bracket">{'>'}</span>
{:else if seg.t === 'closeLine'}{indentStr(seg.indent)}<span class="xml-bracket">{'</'}</span><span class="xml-tag">{seg.tag}</span><span class="xml-bracket">{'>'}</span>
{:else if seg.t === 'openTag'}{indentStr(seg.indent)}<span class="xml-bracket">{'<'}</span><span class="xml-tag">{seg.tag}</span>
{:else if seg.t === 'closeOpenTag'}{indentStr(seg.indent)}<span class="xml-bracket">{seg.selfClose ? '/>' : '>'}</span>
{:else if seg.t === 'attr'}{indentStr(seg.indent)}<span class="xml-attr">{seg.name}</span><span class="xml-bracket">=</span><span class="xml-val">{'"' + seg.value + '"'}</span>
{:else if seg.t === 'comment'}{indentStr(seg.indent)}<span class="prov-comment">{'<!-- ' + seg.text + ' -->'}</span>
{:else if seg.t === 'ellipsis'}{indentStr(seg.indent)}<span class="prov-ellipsis">{seg.text}</span>
{/if}{/each}</code></pre>
					</details>
				</div>
			{:else}
				<p class="empty">Select an event from the timeline.</p>
			{/if}

			{#if parsed.body.length}
				<div class="body-tree">
					<BodyView nodes={parsed.body} {highlightedEids} />
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
		max-width: 72rem;
		margin: 0 auto;
		padding: 24px 16px 96px;
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

	/* ─── Header band (full-width) ─── */
	.head-band {
		background: #ffffff;
		border-bottom: 1px solid #e5e7eb;
	}
	.head {
		max-width: 72rem;
		margin: 0 auto;
		padding: 18px 16px 14px;
	}
	.head-tag {
		display: flex;
		gap: 6px;
		align-items: baseline;
		flex-wrap: wrap;
		font-family: var(--font-mono);
		font-size: 11px;
		color: #6b7280;
		margin-bottom: 8px;
	}
	.tag-mono :global(.text) {
		font-family: var(--font-mono);
	}
	.tag-sep {
		color: #d1d5db;
	}
	.tag-sub {
		color: #4b5563;
	}
	.head-row {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
	}
	.head-id {
		display: inline-block;
		font-family: var(--font-mono);
		font-size: 13px;
		font-weight: 500;
		line-height: 1;
		color: #4b5563;
		background: #f3f4f6;
		border: 1px solid #e5e7eb;
		border-radius: 4px;
		padding: 3px 7px;
		margin-right: 8px;
		letter-spacing: 0;
		vertical-align: 1px;
		white-space: nowrap;
	}
	.head-title {
		margin: 0;
		min-width: 0;
		flex: 1 1 auto;
		font-family: var(--font-heading);
		font-size: 14px;
		font-weight: 400;
		line-height: 1.4;
		color: #111827;
		letter-spacing: -0.005em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: clip;
	}
	.head-title-expanded {
		white-space: normal;
		overflow: visible;
	}
	.head-title-toggle {
		flex: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		background: transparent;
		border: none;
		padding: 0;
		color: #6b7280;
		cursor: pointer;
		line-height: 1;
		transition: color 0.1s ease;
	}
	.head-title-toggle :global(svg) {
		fill: #6b7280;
		transition: fill 0.1s ease;
	}
	.head-title-toggle:hover :global(svg) {
		fill: #111827;
	}
	.head-title-collapse {
		display: inline-block;
		margin: 6px 0 0 -6px;
		padding: 2px 6px;
		background: transparent;
		border: none;
		border-radius: 3px;
		font-family: var(--font-heading);
		font-size: 11px;
		font-weight: 500;
		color: #6b7280;
		cursor: pointer;
		line-height: 1;
		transition: background-color 0.1s ease, color 0.1s ease;
	}
	.head-title-collapse:hover {
		background: #f3f4f6;
		color: #111827;
	}
	.warnings {
		margin-top: 14px;
	}
	.warn-card {
		background: #fffbeb;
		border: 1px solid #fcd34d;
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
	}
	.row + .row {
		margin-top: 0;
	}
	.row button {
		display: block;
		width: 100%;
		text-align: left;
		background: none;
		border: none;
		padding: 8px 8px 10px 8px;
		cursor: pointer;
		font-family: inherit;
		font-size: inherit;
		color: inherit;
		position: relative;
		transition: background-color 0.1s ease;
	}
	.row button:hover {
		background: #f9fafb;
	}
	.row button:focus-visible {
		outline: 2px solid var(--color-brand);
		outline-offset: -2px;
		border-radius: 2px;
	}
	.row.selected button {
		background: #f1f5f9;
	}

	.content {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}
	.row-head {
		display: flex;
		gap: 8px;
		align-items: baseline;
		font-size: 10.5px;
		color: #64748b;
		flex-wrap: wrap;
	}
	.date {
		color: #475569;
		font-size: 10.5px;
		letter-spacing: 0;
		line-height: 1.4;
	}
	.time {
		color: #94a3b8;
		font-size: 10px;
	}
	.kind-tag {
		margin-left: auto;
		font-family: var(--font-mono);
		font-size: 10px;
		font-weight: 400;
		text-transform: lowercase;
		letter-spacing: 0;
		color: #cbd5e1;
	}
	.row.selected .kind-tag {
		color: #94a3b8;
	}
	.label {
		font-family: var(--font-heading);
		font-size: 12px;
		line-height: 1.4;
		color: #1f2937;
		word-break: normal;
		overflow-wrap: anywhere;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.row.selected .label {
		color: #0a0f1c;
	}
	.meta {
		display: flex;
		gap: 4px 8px;
		align-items: center;
		flex-wrap: wrap;
		font-family: var(--font-heading);
		font-size: 9px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #94a3b8;
	}
	.meta-item {
		display: inline-flex;
		align-items: center;
	}
	.meta-item + .meta-item::before {
		content: '·';
		margin-right: 8px;
		color: #cbd5e1;
		font-weight: 400;
	}
	.meta-item.warn {
		color: var(--color-deletion-800);
		font-size: 11px;
		text-transform: none;
	}
	.meta-item.delta {
		gap: 3px;
		white-space: nowrap;
	}
	.d-add,
	.d-rem,
	.d-unit {
		font-family: inherit;
		font-size: inherit;
		font-weight: inherit;
		letter-spacing: inherit;
		text-transform: inherit;
	}
	.d-add { color: var(--color-addition-800, #166534); }
	.d-rem { color: var(--color-deletion-800, #991b1b); }
	.d-unit { color: inherit; }
	.row.selected .meta {
		color: #64748b;
	}

	/* ─── Event detail (no card chrome) ─── */
	.event {
		margin-bottom: 16px;
	}
	.event-head {
		display: flex;
		gap: 8px;
		align-items: center;
		font-size: 11px;
		color: #4b5563;
		margin-bottom: 10px;
	}
	.event-head-sep {
		color: #d1d5db;
	}
	.event-head-spacer {
		flex: 1;
	}

	/* ─── Source badge (internal vs linked) ─── */
	.src-badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-family: var(--font-heading);
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		padding: 3px 8px;
		border-radius: 3px;
		border: 1px solid transparent;
		text-decoration: none;
	}
	.src-internal {
		background: #f3f4f6;
		color: #4b5563;
		border-color: #e5e7eb;
	}
	.src-linked {
		background: #fef3c7;
		color: #92400e;
		border-color: #fde68a;
		cursor: pointer;
	}
	.src-linked:hover {
		background: #fde68a;
	}
	.src-linked .mono {
		text-transform: none;
		letter-spacing: 0;
		font-weight: 500;
	}

	/* ─── AKN provenance disclosure ─── */
	.provenance {
		margin-top: 18px;
		border-top: 1px dotted #e5e7eb;
		padding-top: 12px;
	}
	.provenance > summary {
		list-style: none;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-family: var(--font-mono);
		font-size: 11px;
		color: #9ca3af;
		user-select: none;
	}
	.provenance > summary::-webkit-details-marker { display: none; }
	.provenance > summary:hover { color: #4b5563; }
	.prov-caret {
		display: inline-block;
		transition: transform 0.12s ease;
		font-size: 10px;
	}
	.provenance[open] > summary .prov-caret {
		transform: rotate(90deg);
	}
	/* ─── Provenance XML snippet ─── */
	.prov-xml {
		margin: 12px 0 0;
		padding: 12px 14px;
		background: #f8fafc;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		font-family: var(--font-mono);
		font-size: 11.5px;
		line-height: 1.6;
		color: #1f2937;
		white-space: pre-wrap;
		word-break: break-word;
		overflow-wrap: anywhere;
	}
	.prov-xml :global(.xml-bracket) { color: #94a3b8; }
	.prov-xml :global(.xml-tag) { color: #1e40af; }
	.prov-xml :global(.xml-attr) { color: #7c2d92; }
	.prov-xml :global(.xml-val) { color: #166534; }
	.prov-xml :global(.prov-comment) { color: #94a3b8; font-style: italic; }
	.prov-xml :global(.prov-ellipsis) { color: #94a3b8; }

	/* ─── Linked-inline (linked documents in event card) ─── */
	.linked-inline {
		margin-top: 16px;
		padding-top: 12px;
		border-top: 1px dotted #e5e7eb;
	}
	.linked-inline-head {
		font-family: var(--font-heading);
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #6b7280;
		margin-bottom: 8px;
	}
	.event-label {
		font-family: var(--font-mono);
		font-size: 14px;
		font-weight: 500;
		color: #0a0f1c;
		margin-bottom: 16px;
		line-height: 1.4;
	}

	/* ─── Modifications ─── */
	.mods {
		list-style: none;
		padding: 0;
		margin: 0 0 4px;
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
		border: 1px solid #e5e7eb;
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
	.eid-pill:disabled {
		cursor: default;
		border-style: dashed;
		opacity: 0.85;
	}
	.eid-pill:disabled:hover {
		background: #f3f4f6;
		border-color: #d1d5db;
		color: #4b5563;
	}
	.eid-pill .ink {
		color: #0a0f1c;
	}
	.eid-pill-external {
		background: #fff7ed;
		border-color: #fed7aa;
		border-style: dashed;
	}
	.eid-pill-external .ext-glyph {
		color: #c2410c;
		font-weight: 700;
		margin-right: 2px;
	}
	.eid-pill-external:disabled:hover {
		background: #fff7ed;
		border-color: #fed7aa;
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
		border-bottom: 1px dotted #e5e7eb;
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
		color: #d1d5db;
	}

	/* ─── Body tree wrapper ─── */
	.body-tree {
		margin-top: 28px;
		padding-top: 24px;
		border-top: 1px solid #e5e7eb;
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

	/* ─── Bill sub-nav (icon + nativeId + tabs) ─── */
	.bill-subnav {
		display: flex;
		align-items: center;
		gap: 4px;
		max-width: 72rem;
		margin: 0 auto;
		padding: 0 16px;
		overflow-x: auto;
	}
	.subtab {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: transparent;
		border: none;
		border-bottom: 2px solid transparent;
		padding: 8px 12px;
		font-family: var(--font-sans, inherit);
		font-size: 14px;
		font-weight: 500;
		color: #6b7280;
		cursor: pointer;
		transition: color 0.1s ease, border-color 0.1s ease;
		margin-bottom: -1px;
		white-space: nowrap;
	}
	.bill-subnav .subtab:first-of-type {
		margin-left: -12px;
	}
	.subtab:hover {
		color: #374151;
		border-bottom-color: #d1d5db;
	}
	.subtab-active {
		color: #111827;
		border-bottom-color: #111827;
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
		background: #f3f4f6;
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
		border-bottom: 1px solid #e5e7eb;
		background: #f9fafb;
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
		border-bottom: 1px solid #e5e7eb;
	}
	.exp-table td {
		padding: 5px 8px;
		border-bottom: 1px dotted #e5e7eb;
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
		background: #f3f4f6;
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
		border: 1px solid #e5e7eb;
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
		background: #f9fafb;
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
		background: #f3f4f6;
		padding: 1px 5px;
		border-radius: 3px;
	}

	/* ─── XML view ─── */
	.xml-view {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.xml-subtabs {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
		padding: 0 0 4px;
	}
	.xml-subtab {
		display: inline-flex;
		align-items: baseline;
		gap: 6px;
		background: transparent;
		border: 1px solid #e5e7eb;
		border-radius: 999px;
		padding: 3px 10px;
		font-family: var(--font-heading);
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #6b7280;
		cursor: pointer;
		transition: background-color 0.1s ease, border-color 0.1s ease, color 0.1s ease;
	}
	.xml-subtab:hover {
		background: #f3f4f6;
		border-color: #d1d5db;
		color: #1f2937;
	}
	.xml-subtab-active {
		background: #1f2937;
		border-color: #1f2937;
		color: #ffffff;
	}
	.xml-subtab-active:hover {
		background: #1f2937;
		border-color: #1f2937;
		color: #ffffff;
	}
	.xml-subtab-id {
		font-family: var(--font-mono);
		font-size: 10px;
		font-weight: 500;
		letter-spacing: 0;
		text-transform: none;
		color: inherit;
		opacity: 0.85;
	}
	.xml-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 6px 2px 2px;
	}
	.xml-meta {
		display: flex;
		gap: 8px;
		align-items: baseline;
		font-size: 11px;
		color: #6b7280;
	}
	.xml-meta-label {
		font-family: var(--font-heading);
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}
	.xml-meta-sep {
		color: #d1d5db;
	}
	.xml-copy {
		font-family: var(--font-heading);
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #6b7280;
		background: transparent;
		border: 1px solid #e5e7eb;
		border-radius: 4px;
		padding: 4px 10px;
		cursor: pointer;
		transition: background-color 0.1s ease, border-color 0.1s ease, color 0.1s ease;
	}
	.xml-copy:hover {
		background: #f3f4f6;
		border-color: #d1d5db;
		color: #1f2937;
	}
	.xml-pre {
		margin: 0;
		padding: 16px 0;
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		font-family: var(--font-mono);
		font-size: 11.5px;
		line-height: 1.65;
		color: #334155;
		overflow: auto;
		tab-size: 2;
		display: grid;
		grid-template-columns: calc(var(--gutter-w, 4ch) + 28px) 1fr;
	}
	.xml-gutter {
		white-space: pre;
		text-align: right;
		padding: 0 12px 0 14px;
		color: #cbd5e1;
		user-select: none;
		border-right: 1px solid #e5e7eb;
	}
	.xml-code {
		white-space: pre;
		padding: 0 18px 0 14px;
		min-width: 0;
	}
	.xml-pre :global(.xml-bracket) { color: #94a3b8; }
	.xml-pre :global(.xml-tag) { color: #1e40af; }
	.xml-pre :global(.xml-attr) { color: #7c2d92; }
	.xml-pre :global(.xml-val) { color: #166534; }
	.xml-pre :global(.xml-comment) { color: #94a3b8; font-style: italic; }

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
