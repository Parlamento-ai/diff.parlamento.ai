/**
 * Parse a `<bill>` AKN document into a shape the page can render.
 *
 * The plan asks the page to unify three event-bearing sections —
 * `<lifecycle>/<eventRef>`, `<workflow>/<step>`,
 * `<analysis>/<activeModifications>` — into a single timeline keyed by
 * shared TLCEvent ids. We do that here, so the component layer never
 * touches XML.
 *
 * Today's corpus only carries `<lifecycle>`, no `<workflow>` or
 * `<analysis>`. The parser still walks all three so the page lights up
 * automatically when those sections start landing in the data.
 */

import { XMLParser } from 'fast-xml-parser';

export type Reference = {
	eId: string;
	tag: string; // TLCEvent | TLCPerson | TLCOrganization | TLCRole
	href?: string;
	showAs?: string;
};

export type LifecycleEvent = {
	date: string;
	type: string; // resolved from refersTo (#submitted -> submitted)
	source?: string; // raw refersTo on the eventRef (e.g. #submitted)
	tlcEventId?: string; // raw `source` attr (e.g. #evt-01)
	showAs?: string;
	chamber?: string;
};

export type WorkflowStep = {
	date: string;
	outcome?: string;
	agent?: string;
	role?: string;
	source?: string;
	refersTo?: string;
	showAs?: string;
};

export type Modification = {
	kind: 'substitution' | 'insertion' | 'repeal' | 'unknown';
	targetEid?: string;
	targetHref?: string;
	targetIsLocal?: boolean;
	source?: string; // e.g. #evt-09
	old?: string;
	new?: string;
	period?: string;
};

export type TimelineRow = {
	id: string; // tlcEvent id, or fallback synthetic id
	date: string;
	label: string;
	chamber?: string;
	agent?: string;
	lifecycle?: LifecycleEvent;
	step?: WorkflowStep;
	modifications: Modification[];
	kind: 'procedural' | 'version' | 'amendment' | 'terminal';
	warnings: string[];
};

export type BodyNode = {
	tag: string; // 'article', 'chapter', 'paragraph', 'p', 'content', ...
	eId?: string;
	num?: string;
	heading?: string;
	text?: string; // collapsed text content for leaf-ish nodes
	children: BodyNode[];
};

export type Identification = {
	frbrWork?: string;
	frbrExpression?: string;
	frbrManifestation?: string;
	expressionDate?: string;
	language?: string;
	country?: string;
	subtype?: string;
	publication?: string;
};

export type ParsedBill = {
	identification: Identification;
	references: Reference[];
	timeline: TimelineRow[];
	body: BodyNode[];
	warnings: string[];
	/** Map from eId in body → list of timeline row ids that touched it. */
	spanToEvents: Record<string, string[]>;
};

const TERMINAL_REFS = new Set([
	'enacted',
	'promulgated',
	'withdrawn',
	'lapsed',
	'rejected',
	'becomes_law'
]);

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '@_',
	removeNSPrefix: true,
	isArray: (name) =>
		new Set([
			'eventRef',
			'step',
			'eventInfo',
			'TLCEvent',
			'TLCPerson',
			'TLCOrganization',
			'TLCRole',
			'TLCConcept',
			'activeModifications',
			'passiveModifications',
			'parliamentary',
			'substitution',
			'insertion',
			'repeal',
			'mod',
			'textualMod',
			'article',
			'chapter',
			'section',
			'paragraph',
			'subparagraph',
			'list',
			'item',
			'point',
			'p',
			'block',
			'ref',
			'mref',
			'componentRef',
			'keyword'
		]).has(name)
});

type N = Record<string, unknown>;
function asObj(v: unknown): N | undefined {
	return v && typeof v === 'object' && !Array.isArray(v) ? (v as N) : undefined;
}
function asArray(v: unknown): N[] {
	if (!v) return [];
	if (Array.isArray(v)) return v.filter((x) => x && typeof x === 'object') as N[];
	if (typeof v === 'object') return [v as N];
	return [];
}
function attr(n: N | undefined, name: string): string | undefined {
	if (!n) return undefined;
	const v = n[`@_${name}`];
	return v === undefined || v === null ? undefined : String(v);
}
function textOf(v: unknown): string {
	if (v == null) return '';
	if (typeof v === 'string') return v;
	if (typeof v === 'number' || typeof v === 'boolean') return String(v);
	if (Array.isArray(v)) return v.map(textOf).join(' ');
	if (typeof v === 'object') {
		const n = v as N;
		const parts: string[] = [];
		for (const [k, val] of Object.entries(n)) {
			if (k === '#text') parts.push(textOf(val));
			else if (!k.startsWith('@_')) parts.push(textOf(val));
		}
		return parts.join(' ').replace(/\s+/g, ' ').trim();
	}
	return '';
}

function stripHash(s: string | undefined): string | undefined {
	if (!s) return s;
	return s.startsWith('#') ? s.slice(1) : s;
}

function findFirstByKey(node: unknown, key: string): N | undefined {
	if (!node || typeof node !== 'object') return undefined;
	if (Array.isArray(node)) {
		for (const c of node) {
			const r = findFirstByKey(c, key);
			if (r) return r;
		}
		return undefined;
	}
	const obj = node as N;
	if (key in obj) {
		const v = obj[key];
		if (v && typeof v === 'object' && !Array.isArray(v)) return v as N;
		if (Array.isArray(v)) {
			for (const c of v) if (c && typeof c === 'object' && !Array.isArray(c)) return c as N;
		}
	}
	for (const v of Object.values(obj)) {
		const r = findFirstByKey(v, key);
		if (r) return r;
	}
	return undefined;
}

export function parseBill(xml: string): ParsedBill {
	let doc: N;
	try {
		doc = parser.parse(xml) as N;
	} catch (err) {
		return {
			identification: {},
			references: [],
			timeline: [],
			body: [],
			spanToEvents: {},
			warnings: [`failed to parse XML: ${(err as Error).message}`]
		};
	}

	const akn = asObj(doc['akomaNtoso']) ?? doc;
	const bill = asObj(akn['bill']);
	if (!bill) {
		return {
			identification: {},
			references: [],
			timeline: [],
			body: [],
			spanToEvents: {},
			warnings: ['no <bill> element found']
		};
	}

	const meta = asObj(bill['meta']);
	const warnings: string[] = [];

	const identification = parseIdentification(asObj(meta?.['identification']));
	const publication = asObj(meta?.['publication']);
	if (publication) {
		identification.publication =
			attr(publication, 'showAs') ?? attr(publication, 'date') ?? undefined;
	}
	if (!identification.frbrExpression) {
		warnings.push('Missing <FRBRExpression> — bill identification is incomplete.');
	}

	const references = parseReferences(asObj(meta?.['references']));
	const refIndex = new Map(references.map((r) => [r.eId, r]));

	const lifecycleEvents = parseLifecycle(asObj(meta?.['lifecycle']));
	const workflowSteps = parseWorkflow(asObj(meta?.['workflow']));
	const analysis = asObj(meta?.['analysis']);
	const modifications = parseAnalysis(analysis);

	// Group by TLCEvent id (the `source` attr on eventRef/step). Missing
	// id → synthetic per-row id so the timeline still renders.
	type Bucket = {
		id: string;
		lifecycle?: LifecycleEvent;
		step?: WorkflowStep;
		modifications: Modification[];
	};
	const buckets = new Map<string, Bucket>();
	let synthetic = 0;
	const bucketFor = (key: string | undefined): Bucket => {
		const id = key ?? `__syn_${synthetic++}`;
		let b = buckets.get(id);
		if (!b) {
			b = { id, modifications: [] };
			buckets.set(id, b);
		}
		return b;
	};

	for (const ev of lifecycleEvents) {
		const b = bucketFor(stripHash(ev.tlcEventId));
		b.lifecycle = ev;
	}
	for (const s of workflowSteps) {
		const key = stripHash(s.source) ?? stripHash(s.refersTo);
		const b = bucketFor(key);
		b.step = s;
	}
	for (const m of modifications) {
		const key = stripHash(m.source);
		// If we don't know which event caused this modification, drop it
		// into a dedicated bucket so it still surfaces.
		const b = bucketFor(key);
		b.modifications.push(m);
	}

	const timeline: TimelineRow[] = [];
	for (const b of buckets.values()) {
		const ev = b.lifecycle;
		const st = b.step;
		const date = ev?.date ?? st?.date ?? '';
		const refType = stripHash(ev?.source);
		const isTerminal = refType ? TERMINAL_REFS.has(refType) : false;
		const hasMods = b.modifications.length > 0;
		const kind: TimelineRow['kind'] = isTerminal
			? 'terminal'
			: hasMods
				? 'amendment'
				: ev
					? 'version'
					: 'procedural';

		const rowWarnings: string[] = [];

		// Dangling event link on a step
		if ((st?.source || st?.refersTo) && !ev) {
			const key = stripHash(st.source) ?? stripHash(st.refersTo)!;
			if (!references.find((r) => r.eId === key) && !buckets.has(key)) {
				rowWarnings.push(
					`<step> event link "${st.source ?? st.refersTo}" does not resolve to any TLCEvent or lifecycle event.`
				);
			}
		}

		const label =
			ev?.showAs ??
			st?.outcome ??
			st?.showAs ??
			(refType ? humanize(refType) : 'event') ??
			'event';

		timeline.push({
			id: b.id,
			date,
			label,
			chamber: ev?.chamber,
			agent: st?.agent ? refIndex.get(stripHash(st.agent) ?? '')?.showAs ?? st.agent : undefined,
			lifecycle: ev,
			step: st,
			modifications: b.modifications,
			kind,
			warnings: rowWarnings
		});
	}
	timeline.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

	let bodyNode = asObj(bill['body']);
	if (!bodyNode) {
		// XML malformedness can cause <body> to nest under <meta> instead
		// of <bill>. Walk and pick the first <body> we find, but flag it.
		const found = findFirstByKey(bill, 'body');
		if (found) {
			bodyNode = found;
			warnings.push(
				'<body> was not found at the expected position — it appears nested elsewhere, often a sign of unescaped angle brackets in <akndiff:researchNotes> or another text field.'
			);
		}
	}
	const body = parseBody(bodyNode);
	const eIdSet = collectEids(body);

	const spanToEvents: Record<string, string[]> = {};
	for (const row of timeline) {
		for (const m of row.modifications) {
			m.targetIsLocal = isLocalTarget(m.targetHref, identification);
			if (!m.targetIsLocal) continue;
			if (!m.targetEid) continue;
			if (!eIdSet.has(m.targetEid)) {
				row.warnings.push(
					`Modification targets eId "${m.targetEid}" which does not exist in <body>.`
				);
				continue;
			}
			(spanToEvents[m.targetEid] ??= []).push(row.id);
		}
	}

	return {
		identification,
		references,
		timeline,
		body,
		spanToEvents,
		warnings
	};
}

function parseIdentification(id: N | undefined): Identification {
	if (!id) return {};
	const work = asObj(id['FRBRWork']);
	const expr = asObj(id['FRBRExpression']);
	const manif = asObj(id['FRBRManifestation']);
	const out: Identification = {
		frbrWork: attr(asObj(work?.['FRBRuri']), 'value'),
		frbrExpression: attr(asObj(expr?.['FRBRuri']), 'value'),
		frbrManifestation: attr(asObj(manif?.['FRBRuri']), 'value'),
		expressionDate: attr(asObj(expr?.['FRBRdate']), 'date'),
		language: attr(asObj(expr?.['FRBRlanguage']), 'language'),
		country: attr(asObj(work?.['FRBRcountry']), 'value'),
		subtype: attr(asObj(work?.['FRBRsubtype']), 'value')
	};
	return out;
}

function parseReferences(refs: N | undefined): Reference[] {
	if (!refs) return [];
	const out: Reference[] = [];
	for (const tag of [
		'TLCEvent',
		'TLCPerson',
		'TLCOrganization',
		'TLCRole',
		'TLCConcept',
		'TLCProcess'
	]) {
		for (const n of asArray(refs[tag])) {
			const eId = attr(n, 'eId');
			if (!eId) continue;
			out.push({ eId, tag, href: attr(n, 'href'), showAs: attr(n, 'showAs') });
		}
	}
	return out;
}

function parseLifecycle(lc: N | undefined): LifecycleEvent[] {
	if (!lc) return [];
	return asArray(lc['eventRef']).map((n) => ({
		date: attr(n, 'date') ?? '',
		type: stripHash(attr(n, 'refersTo')) ?? '',
		source: attr(n, 'refersTo'),
		tlcEventId: attr(n, 'source'),
		showAs: attr(n, 'showAs'),
		chamber: attr(n, 'chamber')
	}));
}

function parseWorkflow(wf: N | undefined): WorkflowStep[] {
	if (!wf) return [];
	return asArray(wf['step']).map((n) => ({
		date: attr(n, 'date') ?? '',
		outcome: attr(n, 'outcome'),
		agent: attr(n, 'as') ?? attr(n, 'by') ?? attr(n, 'agent'),
		role: attr(n, 'role'),
		source: attr(n, 'source'),
		refersTo: attr(n, 'refersTo'),
		showAs: attr(n, 'showAs')
	}));
}

function parseAnalysis(an: N | undefined): Modification[] {
	if (!an) return [];
	const out: Modification[] = [];
	const sections = ['activeModifications', 'passiveModifications'] as const;
	for (const sec of sections) {
		for (const block of asArray(an[sec])) {
			pushMods(block, out);
		}
	}
	return out;
}

function pushMods(block: N, out: Modification[]) {
	for (const kindTag of ['substitution', 'insertion', 'repeal'] as const) {
		for (const m of asArray(block[kindTag])) {
			const source = attr(m, 'source');
			const period = attr(m, 'period');
			const oldNode = asObj(m['old']);
			const newNode = asObj(m['new']);
			const target =
				attr(oldNode, 'href') ?? attr(asObj(m['destination']), 'href') ?? attr(m, 'eId');
			out.push({
				kind: kindTag,
				targetHref: target,
				targetEid: targetEidFromHref(target),
				source,
				period,
				old: oldNode ? textOf(oldNode) : undefined,
				new: newNode ? textOf(newNode) : undefined
			});
		}
	}
	// Generic <textualMod type="..."> form too.
	for (const m of asArray(block['textualMod'])) {
		const t = (attr(m, 'type') ?? 'unknown').toLowerCase();
		const kind: Modification['kind'] =
			t === 'substitution' || t === 'insertion' || t === 'repeal' ? t : 'unknown';
		const source = attr(asObj(m['source']), 'href') ?? attr(m, 'source');
		const target =
			attr(asObj(m['destination']), 'href') ?? attr(asObj(m['old']), 'href') ?? attr(m, 'eId');
		const oldNode = asObj(m['old']);
		const newNode = asObj(m['new']);
		out.push({
			kind,
			targetHref: target,
			targetEid: targetEidFromHref(target),
			source,
			period: attr(m, 'period'),
			old: oldNode ? textOf(oldNode) : undefined,
			new: newNode ? textOf(newNode) : undefined
		});
	}
}

function targetEidFromHref(href: string | undefined): string | undefined {
	if (!href) return undefined;
	const hashIndex = href.indexOf('#');
	if (hashIndex >= 0) return href.slice(hashIndex + 1) || undefined;
	const lastPathPart = href.split('/').pop();
	return stripHash(lastPathPart);
}

function isLocalTarget(href: string | undefined, identification: Identification): boolean {
	if (!href) return true;
	if (href.startsWith('#')) return true;

	const targetBase = href.split('#')[0];
	return [
		identification.frbrWork,
		identification.frbrExpression,
		identification.frbrManifestation
	].some((localUri) => localUri && targetBase.startsWith(localUri));
}

const HIERARCHY_TAGS = new Set([
	'article',
	'chapter',
	'section',
	'subsection',
	'part',
	'subpart',
	'title',
	'subtitle',
	'book',
	'tome',
	'division',
	'paragraph',
	'subparagraph',
	'list',
	'item',
	'point',
	'clause',
	'subclause'
]);

function parseBody(body: N | undefined): BodyNode[] {
	if (!body) return [];
	const out: BodyNode[] = [];
	for (const [k, v] of Object.entries(body)) {
		if (k.startsWith('@_') || k === '#text') continue;
		for (const child of asArray(v)) {
			out.push(parseBodyNode(k, child));
		}
	}
	return out;
}

function parseBodyNode(tag: string, n: N): BodyNode {
	const eId = attr(n, 'eId');
	const num = textOf(n['num']);
	const heading = textOf(n['heading']);
	const children: BodyNode[] = [];
	let textParts = '';

	for (const [k, v] of Object.entries(n)) {
		if (k.startsWith('@_') || k === 'num' || k === 'heading') continue;
		if (k === '#text') {
			textParts += ' ' + (typeof v === 'string' ? v : '');
			continue;
		}
		if (HIERARCHY_TAGS.has(k)) {
			for (const child of asArray(v)) children.push(parseBodyNode(k, child));
			continue;
		}
		// content / intro / wrap-up — recurse one level but flatten
		if (k === 'content' || k === 'intro' || k === 'wrapUp' || k === 'block') {
			for (const child of asArray(v)) {
				const sub = parseBodyNode(k, child);
				if (sub.children.length) children.push(...sub.children);
				if (sub.text) textParts += ' ' + sub.text;
			}
			continue;
		}
		if (k === 'p') {
			for (const child of asArray(v)) {
				children.push({ tag: 'p', text: textOf(child).trim(), children: [] });
			}
			continue;
		}
		// Fallback: treat as inline text for the leaf summary.
		textParts += ' ' + textOf(v);
	}

	return {
		tag,
		eId,
		num: num || undefined,
		heading: heading || undefined,
		text: textParts.replace(/\s+/g, ' ').trim() || undefined,
		children
	};
}

function collectEids(nodes: BodyNode[]): Set<string> {
	const out = new Set<string>();
	const walk = (n: BodyNode) => {
		if (n.eId) out.add(n.eId);
		for (const c of n.children) walk(c);
	};
	for (const n of nodes) walk(n);
	return out;
}

function humanize(s: string): string {
	return s.replace(/_/g, ' ');
}
