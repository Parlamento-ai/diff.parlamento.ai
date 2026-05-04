/**
 * Tooltip copy for AKN-native terms surfaced on the bill page.
 *
 * This module is now a thin shim over the canonical definitions in
 * [src/lib/docs/term-definitions.ts]. Tooltip copy and the Tier 1 docs page
 * read from the same source so the first sentence stays in sync.
 */

import { TERM_DEFINITIONS } from '$lib/docs/term-definitions';

export type AknTermDef = {
	short: string;
	example?: string;
};

const PAGE_EXAMPLES: Record<string, string> = {
	// Page-specific overrides for the optional example shown in the tooltip.
};

export const AKN_TERMS: Record<string, AknTermDef> = Object.fromEntries(
	Object.entries(TERM_DEFINITIONS).map(([k, v]) => [
		k,
		{ short: v.short, example: PAGE_EXAMPLES[k] }
	])
);

/**
 * The tooltip should deep-link to the docs page for this term, when one exists.
 * Today every entry in TERM_DEFINITIONS has a corresponding /docs/explorer/schema/<name>
 * page (the schema tree is generated for the type), so we just construct the URL.
 */
export function termDocsUrl(term: string): string | undefined {
	if (!(term in TERM_DEFINITIONS)) return undefined;
	return `/docs/explorer/schema/${term}#definition`;
}
