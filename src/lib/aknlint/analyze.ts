/**
 * AKN linter — runs an expectation Profile against an AKN XML document
 * and returns per-facet completeness scores plus a list of findings.
 *
 * The "XPath" supported is a deliberate subset (see profiles/types.ts):
 *   a/b/c
 *   a//b
 *   a/@x
 *   a[@x='v'] | a[@x='v' or @x='w'] | a[not(@x)]
 *   ns:foo
 *
 * No real XPath engine; we walk the fast-xml-parser tree directly. The
 * profile expectations are scoped enough that a 200-line evaluator covers
 * what we need.
 */

import { XMLParser } from 'fast-xml-parser';
import type { Expectation, Facet, Profile, Severity } from '../../../research/schema/profiles/types';

const ATTR_PREFIX = '@_';

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: ATTR_PREFIX,
	removeNSPrefix: false, // keep `akndiff:` prefixes
	parseAttributeValue: false,
	parseTagValue: false,
	trimValues: true,
	allowBooleanAttributes: true
});

type AnyNode = Record<string, unknown>;

export type Finding = {
	facet: string;
	expectation: string;
	severity: Severity;
	message: string;
	rationale: string;
	hint?: string;
	xpath: string;
};

export type FacetReport = {
	id: string;
	label: string;
	rationale: string;
	score: number; // 0..1, weighted
	earned: number;
	total: number;
	findings: Finding[];
	expectations: ExpectationReport[];
};

export type ExpectationReport = {
	id: string;
	xpath: string;
	kind: string;
	status: 'ok' | 'missing' | 'optional-missing' | 'invalid';
	weight: number;
	matchCount: number;
	value?: string; // for enum / attribute paths, the resolved value
	severity: Severity;
};

export type LintReport = {
	docType: string;
	rootFound: boolean;
	completeness: number; // overall 0..1, weighted across facets
	facets: FacetReport[];
	findings: Finding[]; // flat list across facets, errors first
};

// ─── path tokenizer ──────────────────────────────────────────────────

type Step = {
	name: string; // element name (with optional ns prefix), or '*' for any
	axis: 'child' | 'descendant';
	predicates: Predicate[];
	attrTerminal?: string; // if this step ends in /@x, the attribute name
};

type Predicate =
	| { kind: 'attr-eq'; alternatives: { attr: string; value: string }[] }
	| { kind: 'attr-not-present'; attr: string }
	| { kind: 'has-attr'; attr: string };

function tokenize(xpath: string): Step[] {
	// First: split on / (but not on //). We mark // as a separator with a flag.
	const steps: Step[] = [];
	let i = 0;
	let axis: 'child' | 'descendant' = 'child';
	while (i < xpath.length) {
		// skip leading slashes
		if (xpath[i] === '/') {
			if (xpath[i + 1] === '/') {
				axis = 'descendant';
				i += 2;
			} else {
				i += 1;
			}
			continue;
		}
		// read step
		let start = i;
		let depth = 0;
		while (i < xpath.length) {
			const c = xpath[i];
			if (c === '[') depth++;
			else if (c === ']') depth--;
			else if (c === '/' && depth === 0) break;
			i++;
		}
		const raw = xpath.slice(start, i);
		steps.push(parseStep(raw, axis));
		axis = 'child';
	}
	return steps;
}

function parseStep(raw: string, axis: 'child' | 'descendant'): Step {
	// Trailing /@attr is handled by the caller — but if a single step is
	// just `@x` we also accept it.
	if (raw.startsWith('@')) {
		return { name: '__self__', axis, predicates: [], attrTerminal: raw.slice(1) };
	}

	// peel predicates [ ... ]
	const predicates: Predicate[] = [];
	let bracket = raw.indexOf('[');
	let name = bracket === -1 ? raw : raw.slice(0, bracket);
	while (bracket !== -1) {
		const end = raw.indexOf(']', bracket);
		if (end === -1) break;
		const body = raw.slice(bracket + 1, end);
		predicates.push(parsePredicate(body));
		bracket = raw.indexOf('[', end);
	}

	// Detect terminal /@x written as `name/@x` — we already split on /, so
	// the attribute would be its own step. This branch handles the rare
	// case where a step itself contains `@`.
	const atIdx = name.indexOf('@');
	let attrTerminal: string | undefined;
	if (atIdx >= 0) {
		attrTerminal = name.slice(atIdx + 1);
		name = name.slice(0, atIdx).replace(/\/$/, '');
	}

	return { name, axis, predicates, attrTerminal };
}

function parsePredicate(body: string): Predicate {
	const trimmed = body.trim();
	// not(@x)
	const notMatch = trimmed.match(/^not\(\s*@([\w:]+)\s*\)$/);
	if (notMatch) return { kind: 'attr-not-present', attr: notMatch[1] };
	// @x='v' [or @y='w']*
	if (trimmed.startsWith('@')) {
		const alternatives: { attr: string; value: string }[] = [];
		const parts = trimmed.split(/\s+or\s+/);
		for (const p of parts) {
			const m = p.match(/^@([\w:]+)\s*=\s*['"](.*)['"]$/);
			if (m) alternatives.push({ attr: m[1], value: m[2] });
			else {
				const justAttr = p.match(/^@([\w:]+)$/);
				if (justAttr) return { kind: 'has-attr', attr: justAttr[1] };
			}
		}
		if (alternatives.length) return { kind: 'attr-eq', alternatives };
	}
	// fall through: unsupported predicate becomes a no-op
	return { kind: 'has-attr', attr: '__never__' };
}

// ─── evaluator ───────────────────────────────────────────────────────

type Match = { node: AnyNode; value?: string };

function asArray<T>(x: T | T[] | undefined): T[] {
	if (x === undefined || x === null) return [];
	return Array.isArray(x) ? x : [x];
}

function getAttr(node: AnyNode, attr: string): string | undefined {
	const v = node[ATTR_PREFIX + attr];
	if (v === undefined || v === null) return undefined;
	return String(v);
}

function isElementKey(k: string): boolean {
	return !k.startsWith(ATTR_PREFIX) && k !== '#text';
}

function toElementNode(c: unknown): AnyNode | null {
	if (c === null || c === undefined) return null;
	if (typeof c === 'object') return c as AnyNode;
	// fast-xml-parser collapses text-only elements to a primitive — wrap it.
	return { '#text': String(c) };
}

function children(node: AnyNode, name: string): AnyNode[] {
	if (name === '*') {
		const out: AnyNode[] = [];
		for (const k of Object.keys(node)) {
			if (!isElementKey(k)) continue;
			for (const c of asArray<unknown>(node[k] as unknown)) {
				const el = toElementNode(c);
				if (el) out.push(el);
			}
		}
		return out;
	}
	return asArray<unknown>(node[name] as unknown)
		.map(toElementNode)
		.filter((c): c is AnyNode => c !== null);
}

function descendants(node: AnyNode, name: string): AnyNode[] {
	const out: AnyNode[] = [];
	const stack: AnyNode[] = [node];
	while (stack.length) {
		const n = stack.pop()!;
		for (const k of Object.keys(n)) {
			if (!isElementKey(k)) continue;
			for (const c of asArray<unknown>(n[k] as unknown)) {
				const el = toElementNode(c);
				if (!el) continue;
				if (k === name || name === '*') out.push(el);
				if (typeof c === 'object') stack.push(el);
			}
		}
	}
	return out;
}

function predicateOk(node: AnyNode, p: Predicate): boolean {
	switch (p.kind) {
		case 'attr-eq':
			return p.alternatives.some(({ attr, value }) => getAttr(node, attr) === value);
		case 'attr-not-present':
			return getAttr(node, p.attr) === undefined;
		case 'has-attr':
			return getAttr(node, p.attr) !== undefined;
	}
}

function evaluate(root: AnyNode, steps: Step[]): Match[] {
	let current: AnyNode[] = [root];
	for (let s = 0; s < steps.length; s++) {
		const step = steps[s];
		// Pure attribute step (`@x` on its own as the terminal selector — the
		// path was `.../parent/@x`). Apply to current context, not as a child
		// lookup.
		if (step.name === '__self__' && step.attrTerminal) {
			const matches: Match[] = [];
			for (const n of current) {
				const v = getAttr(n, step.attrTerminal);
				if (v !== undefined) matches.push({ node: n, value: v });
			}
			return matches;
		}

		const next: AnyNode[] = [];
		for (const ctx of current) {
			const candidates = step.axis === 'descendant' ? descendants(ctx, step.name) : children(ctx, step.name);
			for (const c of candidates) {
				if (step.predicates.every((p) => predicateOk(c, p))) {
					next.push(c);
				}
			}
		}
		current = next;
		if (step.attrTerminal) {
			const matches: Match[] = [];
			for (const n of current) {
				const v = getAttr(n, step.attrTerminal);
				if (v !== undefined) matches.push({ node: n, value: v });
			}
			return matches;
		}
	}
	return current.map((n) => ({ node: n, value: textOf(n) }));
}

function textOf(node: AnyNode): string | undefined {
	if (typeof node === 'string') return node;
	const t = (node['#text'] ?? node['#cdata']) as unknown;
	if (typeof t === 'string') return t;
	if (typeof t === 'number') return String(t);
	return undefined;
}

// ─── public API ──────────────────────────────────────────────────────

export function analyzeAknDocument(xml: string, profile: Profile): LintReport {
	const parsed = parser.parse(xml) as AnyNode;
	const akoma = (parsed['akomaNtoso'] as AnyNode) || parsed;
	const root = (akoma[profile.rootElement] as AnyNode | undefined) ?? null;

	if (!root) {
		return {
			docType: profile.docType,
			rootFound: false,
			completeness: 0,
			facets: [],
			findings: [
				{
					facet: '__root__',
					expectation: 'root-element',
					severity: 'error',
					message: `Expected root element <${profile.rootElement}> not found.`,
					rationale: 'A profile cannot evaluate a document of the wrong type.',
					xpath: profile.rootElement
				}
			]
		};
	}

	const facetReports: FacetReport[] = profile.facets.map((facet) =>
		evaluateFacet(root, facet)
	);

	let earnedTotal = 0;
	let possibleTotal = 0;
	for (const f of facetReports) {
		earnedTotal += f.earned;
		possibleTotal += f.total;
	}
	const completeness = possibleTotal > 0 ? earnedTotal / possibleTotal : 0;

	const findings = facetReports
		.flatMap((f) => f.findings)
		.sort((a, b) => severityRank(a.severity) - severityRank(b.severity));

	return {
		docType: profile.docType,
		rootFound: true,
		completeness,
		facets: facetReports,
		findings
	};
}

function severityRank(s: Severity): number {
	return s === 'error' ? 0 : s === 'warn' ? 1 : 2;
}

function evaluateFacet(root: AnyNode, facet: Facet): FacetReport {
	const reports: ExpectationReport[] = [];
	const findings: Finding[] = [];
	let earned = 0;
	let total = 0;

	for (const exp of facet.expectations) {
		const r = evaluateExpectation(root, exp);
		reports.push(r);

		if (!exp.optional) {
			total += exp.weight;
			if (r.status === 'ok') earned += exp.weight;
		}

		if (r.status === 'missing' || r.status === 'invalid') {
			findings.push({
				facet: facet.id,
				expectation: exp.id,
				severity: r.severity,
				message: messageFor(exp, r),
				rationale: exp.rationale,
				hint: exp.hint,
				xpath: exp.xpath
			});
		} else if (r.status === 'optional-missing') {
			findings.push({
				facet: facet.id,
				expectation: exp.id,
				severity: 'info',
				message: messageFor(exp, r),
				rationale: exp.rationale,
				hint: exp.hint,
				xpath: exp.xpath
			});
		}
	}

	return {
		id: facet.id,
		label: facet.label,
		rationale: facet.rationale,
		earned,
		total,
		score: total > 0 ? earned / total : 1,
		findings,
		expectations: reports
	};
}

function evaluateExpectation(root: AnyNode, exp: Expectation): ExpectationReport {
	const steps = tokenize(exp.xpath);
	const matches = evaluate(root, steps);
	const kind = exp.kind ?? 'presence';
	const baseSeverity: Severity = exp.severity ?? (exp.optional ? 'info' : 'warn');

	const baseReport: Omit<ExpectationReport, 'status' | 'severity'> = {
		id: exp.id,
		xpath: exp.xpath,
		kind,
		weight: exp.weight,
		matchCount: matches.length,
		value: matches[0]?.value
	};

	if (kind === 'absence') {
		// Pass when there are NO matches.
		if (matches.length === 0) {
			return { ...baseReport, status: 'ok', severity: baseSeverity };
		}
		return { ...baseReport, status: 'invalid', severity: baseSeverity };
	}

	if (kind === 'count') {
		const min = exp.min ?? 1;
		const max = exp.max ?? Infinity;
		const ok = matches.length >= min && matches.length <= max;
		if (ok) return { ...baseReport, status: 'ok', severity: baseSeverity };
		return {
			...baseReport,
			status: exp.optional ? 'optional-missing' : 'missing',
			severity: baseSeverity
		};
	}

	if (kind === 'enum') {
		if (matches.length === 0) {
			return {
				...baseReport,
				status: exp.optional ? 'optional-missing' : 'missing',
				severity: baseSeverity
			};
		}
		const v = matches[0].value;
		const allowed = exp.allowed ?? [];
		if (v !== undefined && allowed.includes(v)) {
			return { ...baseReport, status: 'ok', severity: baseSeverity };
		}
		return { ...baseReport, status: 'invalid', severity: baseSeverity };
	}

	// presence
	if (matches.length > 0) {
		return { ...baseReport, status: 'ok', severity: baseSeverity };
	}
	return {
		...baseReport,
		status: exp.optional ? 'optional-missing' : 'missing',
		severity: baseSeverity
	};
}

function messageFor(exp: Expectation, r: ExpectationReport): string {
	if (r.status === 'invalid' && exp.kind === 'absence') {
		return `Found ${r.matchCount} node(s) where none should exist.`;
	}
	if (r.status === 'invalid' && exp.kind === 'enum') {
		return `Value "${r.value ?? '?'}" is not in the allowed set: ${(exp.allowed ?? []).join(', ')}.`;
	}
	if (r.status === 'missing' && exp.kind === 'count') {
		return `Expected at least ${exp.min ?? 1} node(s), found ${r.matchCount}.`;
	}
	if (r.status === 'optional-missing') {
		return `Optional field is empty.`;
	}
	return `Field is missing.`;
}
