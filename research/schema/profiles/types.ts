/**
 * Expectation profiles for the AKN linter.
 *
 * A profile encodes "what a well-formed document of this type should
 * contain" — the parts the XSD can't express because most AKN fields
 * are technically optional. Each expectation is a small probe over the
 * parsed XML, with a weight, a kind, and a rationale.
 *
 * The rationale field is required on purpose: this profile IS an
 * artefact of the research, not just config. A future contributor adding
 * a country needs to know WHY a field matters, not just THAT it does.
 */

export type ExpectationKind =
	| 'presence' // path resolves to ≥ 1 node
	| 'count' // path resolves to ≥ min (and ≤ max) nodes
	| 'absence' // path resolves to 0 nodes (used to flag bad shapes)
	| 'enum'; // value of (single) node is in `allowed`

export type Severity = 'error' | 'warn' | 'info';

export type Expectation = {
	id: string;
	/**
	 * A simplified XPath. Supported syntax:
	 *  - `a/b/c` — descend by element name
	 *  - `a//b`  — descendant-or-self
	 *  - `a/@x`  — attribute access (terminal)
	 *  - `a[@x='v']` — attribute equality predicate
	 *  - `ns:foo` — namespace-prefixed names (we treat the prefix as part of the name)
	 *
	 * Paths are evaluated relative to the document's root element
	 * (e.g. `<bill>` inside `<akomaNtoso>`).
	 */
	xpath: string;
	weight: number;
	kind?: ExpectationKind; // default 'presence'
	min?: number; // for 'count'
	max?: number; // for 'count'
	allowed?: string[]; // for 'enum'
	optional?: boolean; // missing = info finding, no score penalty
	severity?: Severity; // override default severity (warn for non-optional miss)
	rationale: string;
	hint?: string; // shown in the finding card to help the contributor
};

export type Facet = {
	id: string;
	label: string;
	rationale: string;
	expectations: Expectation[];
};

export type Profile = {
	docType: string; // 'bill' | 'act' | 'amendment' | ...
	schemaVersion: string;
	rootElement: string; // e.g. 'bill' (under <akomaNtoso>)
	facets: Facet[];
};
