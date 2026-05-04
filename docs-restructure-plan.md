# Docs restructure plan — per-type pages with narrative + spec

A plan for the engineer/AI restructuring `/docs` so that each AKN type page ties together narrative, real XML examples, and the formal XSD spec. Read fully before coding.

## Why this exists

The current docs split into two disconnected halves:

- **Narrative prose** lives in [docs/akn/*.md](docs/akn/) — well-written explanations with real XML examples (FRBR, metadata, hierarchy, document types, debates, etc.).
- **Formal schema** lives in per-type pages rendered by [SchemaTypePage.svelte](src/lib/components/akn-schema/SchemaTypePage.svelte) from the generated JSON in [src/lib/akn-schema/generated/](src/lib/akn-schema/generated/).

A reader landing on the schema page for `<bill>` sees a tree of XSD-derived nodes with no prose context. A reader on the FRBR markdown sees prose but no link to the formal grammar. The tooltips on the new bill page (built per [bill-page-plan.md](bill-page-plan.md)) deep-link to "more info," but right now there is no good landing place — the narrative page covers a whole topic, the schema page is too raw.

This plan stitches the two halves together at the **per-type page level**, so every AKN element has one canonical destination that:

1. teaches it (definition + real example, reused from the existing markdown),
2. shows where it fits (relationship to parents/children/siblings),
3. gives the formal spec (XSD-derived tree, available but collapsed),
4. is the deep-link target for tooltips elsewhere in the app.

This is restructure, not greenfield. Reuse aggressively.

## The 3-tier per-type page

Every per-type page (`/docs/explorer/schema/<typeName>`, currently powered by `SchemaTypePage.svelte`) gets restructured into three vertically-stacked sections, each with its own purpose and density level.

### Tier 1 — Definition (top, always visible)

The "what is this?" tier. Short, scannable, no XML.

- **Header**: `<typeName>` in monospace, with a colored category chip (see "Color system" below).
- **One-paragraph definition**: same wording as the tooltip's first sentence, expanded to 2–3 sentences. Plain language, no jargon-on-jargon.
- **"Where it fits" line**: a single-sentence relationship summary. Examples:
  - For `<eventRef>`: "Lives inside `<lifecycle>`. Points at a `TLCEvent` in `<references>`. Shares its event with a `<step>` in `<workflow>` and modifications in `<analysis>`."
  - For `<body>`: "The required content section of hierarchical document types (act, bill). Contains exactly one top-level container (article, chapter, section…)."
- **Sibling chips**: small clickable pills for closely related types (max 5). Each carries its own category color. Clicking jumps to that type's page. For `<eventRef>`: chips for `<step>`, `<lifecycle>`, `<workflow>`, `<analysis>`, `TLCEvent`.

This tier is what tooltips deep-link into. The deep link anchor is `#definition` and is the page top, so a click from a tooltip lands here naturally.

Source: most of this copy already exists somewhere — in the existing `docs/akn/*.md` files, in tooltip definitions on the bill page, or as the `doc` field on the schema JSON. Pull it together; don't re-author.

### Tier 2 — Real example (middle, always visible)

The "show me" tier. The XML examples already exist in [docs/akn/*.md](docs/akn/). This tier surfaces the right one for the type.

- **One real XML example**, syntax-highlighted, drawn from the existing markdown docs. For `<lifecycle>`, this is the example currently in [docs/akn/05-metadata.md:55](docs/akn/05-metadata.md). For `<bill>`, the act-level example in [docs/akn/03-document-types.md:18](docs/akn/03-document-types.md).
- **Inline annotations**: small numbered call-outs (1, 2, 3…) on specific lines of the example, each with a one-sentence explanation below. The pattern already used in `02-frbr.md` and `05-metadata.md` works — just lift the example *plus* a few lines of accompanying prose verbatim.
- **"Read more" link** to the full markdown doc the example came from, for readers who want the deep narrative.

Implementation note: don't try to auto-extract examples from the corpus. The hand-authored markdown examples are already good. Build a small lookup table: `typeName → { exampleSource: 'docs/akn/05-metadata.md', exampleAnchor: 'lifecycle' }`. If a type has no markdown example yet, show a subtle "no curated example yet — see the spec below" affordance and move on. We'll backfill examples for the highest-traffic types first; the long tail can show spec-only.

### Tier 3 — Formal spec (bottom, collapsed by default)

The current schema tree page becomes this tier. Wrap the existing `SchemaTree` component, don't rewrite it.

- A `<details>`-style disclosure: "View formal schema (XSD-derived)". Closed by default.
- When opened: the existing tree from `SchemaTree.svelte`, exactly as it works today, with one enhancement — every cross-reference (`→ ref` link to another type) gets the same colored category chip used elsewhere on the page.
- Below the tree: the existing legend (cardinality colors), unchanged.
- Below the legend: a "View source XSD on OASIS" link, also unchanged from current.

Goal: a curious reader who wants the exhaustive truth gets it in one click. A reader learning concepts is not slowed down by it.

## The color system — 5 categories

A category chip on every type page header, every cross-reference pill, every sibling chip in Tier 1, every `→ ref` link in Tier 3. Five categories total, no more.

| Category | Used for | Vibe |
|---|---|---|
| **Document type** | `act`, `bill`, `amendment`, `judgment`, `debate`, `statement`, `portion`, `doc`, `documentCollection`, `officialGazette`, `amendmentList`, `debateReport` | Distinct, "this is a top-level thing" |
| **Structural container** | `body`, `coverPage`, `preface`, `preamble`, `conclusions`, `attachments`, `mainBody`, `amendmentBody`, `debateBody`, plus all hierarchy types (`article`, `chapter`, `section`, `part`, `title`, `book`, `paragraph`, `clause`, `list`, `point`, `hcontainer`, etc.) | Neutral, "this is structural" |
| **Metadata container** | `meta`, `identification`, `publication`, `classification`, `temporalData`, `references`, `notes`, `proprietary`, `presentation` | Quiet color, "context, not content" |
| **Event/change machinery** | `lifecycle`, `eventRef`, `workflow`, `step`, `analysis`, `activeModifications`, `passiveModifications`, `parliamentary`, `judicial`, `restrictions`, `mappings` | Same accent family as the bill timeline, so the reader recognizes "this is the event family I clicked on the timeline" |
| **Identifier / reference** | `eId`, `wId`, `GUID`, `refersTo`, `source`, FRBR types (`FRBRWork`, `FRBRExpression`, `FRBRManifestation`, `FRBRthis`, `FRBRuri`, etc.), TLC types (`TLCEvent`, `TLCPerson`, `TLCOrganization`, `TLCConcept`, `TLCRole`, `TLCLocation`, `TLCObject`, `TLCProcess`) | A small distinct treatment — these are *glue*, not content |

Rules:

- **Pick palette by reusing what the bill timeline already uses.** The event-machinery color family must be the same one the timeline uses for "generates new version" / "substantive amendment." Cross-page consistency is the whole point.
- **Don't color-code by document type (act/bill/amendment) at the chip level.** Those are themselves *one* category (Document type). Color-coding by *role within a document* is what carries meaning across the format.
- **Hierarchy types are deliberately one category, not many.** All ~25 hierarchical containers (`article`, `chapter`, `section`, `subsection`, `part`, `subpart`, etc.) share the structural color. They differ in name, not role.
- **Keep the palette quiet.** This is reference docs, not a dashboard. Tints, not saturated colors.

Categorization should live in one map:

```ts
// src/lib/docs/type-categories.ts
export type Category = 'document' | 'structural' | 'metadata' | 'event' | 'identifier';
export const TYPE_CATEGORY: Record<string, Category> = {
  bill: 'document',
  body: 'structural',
  lifecycle: 'event',
  // ...
};
```

One file, one source of truth. The `<CategoryChip>` component reads from it. If a type isn't in the map, fall back to a 6th "uncategorized" gray chip — that's the cue to come back and categorize it.

## Tooltip → docs deep-link contract

The tooltips on the bill page (and any future view) link to the right per-type page. The contract:

- **URL**: `/docs/explorer/schema/<typeName>`. This is already the route; don't change it.
- **Anchors**: `#definition` (Tier 1, default), `#example` (Tier 2), `#spec` (Tier 3). Tooltips link to `#definition` by default. A "see the formal spec" link inside the tooltip can deep-link to `#spec`.
- **Tooltip copy and Tier 1 copy must stay in sync.** The first sentence of the tooltip = the first sentence of the Tier 1 definition. To enforce this: keep all definitions in one file (e.g. `src/lib/docs/term-definitions.ts`), and have both the tooltip component and Tier 1 read from there. No copy-paste drift.

## Cross-references between type pages

The "where it fits" line in Tier 1 names other types. Every named type becomes a clickable chip with its category color. This is how readers traverse the format: open `<bill>`, see `<body>` mentioned, click through, see `<article>` and `<hcontainer>` mentioned, click through. Each hop is one click and the category color tells the reader what kind of thing they're about to see.

Concretely: every per-type page should have, at minimum, three pages reachable in one click — its parent, its most important children, and its closest siblings. For `<eventRef>`: parent is `<lifecycle>`, sibling is `<step>` (in `<workflow>`), the thing it points at is `TLCEvent`. Three clickable chips at the top. That's enough.

## What to remove from current per-type pages

Audit and prune:

- The "Generated from akomantoso30.xsd" boilerplate paragraph — move to a small footer link at the bottom of Tier 3.
- The big "Types" navigation strip across the top — keep, but make it read from the same category map so each type pill shows its color. This itself becomes a learning surface ("I can see at a glance which types are document types vs. structural vs. metadata").
- The legend — keep, but only render it when Tier 3 is open. It's noise when only Tiers 1 and 2 are visible.

What to NOT remove:

- The `SchemaTree` rendering itself. It works. The plan is to wrap it, not replace it.
- The `→ ref` link mechanism. Just add the category chip to it.

## What gets longer, what gets shorter

Per-type pages get longer overall — that's the explicit tradeoff confirmed. The compensating moves:

- **Tooltips stay short** (one sentence). They handle the glance case.
- **Tier 3 is collapsed by default**, so the page feels short until you ask for depth.
- **No new top-level docs pages.** The existing `docs/akn/*.md` pages stay and get linked into Tier 2 by reference. We are not duplicating them.

## Where to wire this in the codebase

- **The per-type page component** — modify [src/lib/components/akn-schema/SchemaTypePage.svelte](src/lib/components/akn-schema/SchemaTypePage.svelte). Add Tier 1 (definition + sibling chips) above the existing tree, Tier 2 (example) between, wrap the tree as Tier 3 with a `<details>`. Keep the tree component itself untouched.
- **Category chip component** — new, `src/lib/components/akn-schema/CategoryChip.svelte`. Takes a type name, looks up its category, renders the chip.
- **Definition + category data** — two new files in `src/lib/docs/`:
  - `term-definitions.ts` (typeName → { short, paragraph, fits, siblings[], exampleSource? })
  - `type-categories.ts` (typeName → Category)
- **Example resolver** — a small loader that, given an `exampleSource` like `docs/akn/05-metadata.md#lifecycle`, returns the relevant XML block for inline rendering. The simplest path: a build step that pre-extracts examples into JSON keyed by anchor, like the existing schema-build script does.
- **Existing markdown** — untouched. Tier 2 references it; no edits needed in the markdown files themselves.
- **Bill-page tooltips** — point them at `/docs/explorer/schema/<typeName>#definition` (most likely already the case; verify).

## Definition of done

The restructure is done when:

1. Opening any per-type page (start with `/docs/explorer/schema/bill`) shows definition + example + collapsed spec, in that order.
2. The category chip appears on the page header, on every cross-reference, and on the top-row navigation.
3. Clicking a tooltip on the bill page lands at `#definition` of the right type page, and the tooltip's first sentence matches Tier 1's first sentence.
4. The five categories are consistently applied — no type renders without a chip, and the bill timeline's color family is recognizably the same as the event-machinery chip on docs.
5. At least 5 of the 12 top-level types have a hand-curated Tier 2 example (lifted from existing markdown, not authored fresh). The rest can show "no curated example yet" — that's a follow-up, not a blocker.
6. The existing schema tree (Tier 3) renders identically to today when expanded. No regression in the formal spec view.

The litmus test: a reader who has used the bill page for 5 minutes can click any tooltip, land on a type page, read three sentences, see one example, and decide whether they need to dig into the spec. If that loop feels good, the restructure worked.
