# Bill page UI plan

A plan for the AI/engineer building the new bill detail page under `/demo`. Read this end to end before writing code.

## Why this page exists

Two goals, equally weighted:

1. **Validate that our data is well-formed AKN.** If the page can't render something, the underlying XML is wrong, not the UI. The page is also a debugging surface — gaps and awkwardness expose data problems.
2. **Teach AKN to a human reading it.** AKN is an archival format; almost no public UI treats it as a navigable structure. This page should be the one that does — and it should explain itself as the user navigates, via tooltips on every AKN-native term and structure.

A reader who has never seen AKN before should leave this page understanding what `lifecycle`, `workflow`, `analysis`, `eventRef`, `step`, `eId`, `FRBR expression`, and `activeModifications` mean — without ever leaving the page.

The previous attempt (`/pro/...`) optimized for showing computed text changes. This page optimizes for **fidelity to the format**. Computed diffs are still shown, but as one slice of a richer structure.

## What a `bill` actually is (reference)

A `bill` is one of AKN's hierarchical document types. Top-level shape:

```
<bill name="..." contains="originalVersion">
  <meta>      ← all metadata
  <coverPage> ← optional
  <preface>   ← optional
  <body>      ← required: the legislative text
</bill>
```

`<meta>` contains, among other things, three event-related sections that this page leans on heavily:

- **`<lifecycle>/<eventRef>`** — versioning events. "A new expression of the document came into being." Carries `date`, `type`, `source`, `refersTo`.
- **`<workflow>/<step>`** — procedural events. "Someone did something in the legislative process." Carries `date`, `agent`, `role`, `outcome`, `refersTo`. This is where parliamentary trajectory lives (committee referrals, readings, votes, commission approvals).
- **`<analysis>`** (`activeModifications`, `passiveModifications`, `parliamentary`, etc.) — textual consequences. "This event substituted Article 3 paragraph 2 with this new wording." Each modification points at the event that caused it.

These three are not three event streams. They are **one event stream with three different things attached to each event**, stitched together by shared TLCEvent IDs in `<meta>/<references>`. The UI should present them that way.

Reference docs in the repo:

- Schema source: [static/akn-xsd/akomantoso30.xsd](static/akn-xsd/akomantoso30.xsd)
- Generated bill schema (consumed by the docs UI): [src/lib/akn-schema/generated/bill.json](src/lib/akn-schema/generated/bill.json)
- Amendment schema (separate AKN doc type, linked from bill events): [src/lib/akn-schema/generated/amendment.json](src/lib/akn-schema/generated/amendment.json)
- Existing schema browser components, reuse where you can: [src/lib/components/akn-schema/](src/lib/components/akn-schema/)

## Layout — two columns

```
┌────────────────────────┬──────────────────────────────────────────┐
│                        │                                          │
│   EVENT TIMELINE       │   EVENT DETAIL  +  BODY (linked)         │
│   (left, narrow)       │   (right, wide, scrollable)              │
│                        │                                          │
│   one row per event,   │   [event metadata card]                  │
│   chronological        │   [linked amendment doc, if any]         │
│                        │   [list of body spans this event         │
│   selected: highlighted│    touched, with diff inline]            │
│                        │                                          │
│                        │   ─── separator ───                      │
│                        │                                          │
│                        │   [bill <body> rendered as the AKN       │
│                        │    hierarchy, with the touched spans     │
│                        │    of the selected event highlighted]    │
│                        │                                          │
└────────────────────────┴──────────────────────────────────────────┘
```

Above both columns: a thin header strip with the bill's identification (`<meta>/<identification>` — FRBR work/expression URIs, name, jurisdiction, current expression date). Tooltip on "FRBR expression" explaining what an expression is.

The left column is the navigation spine. The right column is what changes when you click.

## The timeline (left column)

### Data model

Build the timeline by walking the union of:

- every `<step>` in every `<workflow>`
- every `<eventRef>` in every `<lifecycle>`

Group by the TLCEvent reference they share (via `refersTo` / `source` resolved through `<meta>/<references>`). One TLCEvent = one timeline row, even when it appears in multiple sections.

Some rows will have only a `<step>` (procedural-only, e.g. rejected vote). Some will have only an `<eventRef>` (e.g. automatic consolidation). Most substantive rows will have both, plus one or more `<analysis>` modification entries pointing at them.

Sort chronologically by event date. If two events share a date, fall back to document order.

### What each row shows

Compact, scannable. Per row:

- date (left-aligned, monospace)
- a small icon indicating event *kind* (see color rules below)
- one-line label (use the step's outcome / event type, falling back to the TLCEvent label)
- the agent if there is one ("Justice Commission", "Plenary", "Office of the President")
- a small badge if the event produced a new expression (i.e. has an `<eventRef>`)
- a small badge with a count if the event has `<analysis>` modifications attached ("3 changes")

Do NOT label rows by their XML section ("workflow", "lifecycle"). The user does not care which section produced the row; that's an implementation detail. The page is teaching the format, but the timeline teaches it by *unifying* the sections, then explaining the unification via tooltips.

### Color and iconography

Color/icon by what the event **did**, not which section it came from:

- **procedural-only** (vote, referral, reading, no text change) — neutral
- **generates new version** (text-changing event with an `<eventRef>`) — accent
- **substantive amendment** (with diffable spans in `<analysis>`) — accent + a small "diff" glyph
- **terminal** (promulgation, withdrawal, lapse, becomes-law) — distinct color

Pick a palette that's distinguishable but quiet. The right column is where the eye should land; the timeline is the index.

### Tooltips on the timeline

On hover of a row, a tooltip explains the row's AKN provenance plainly:

> *This event appears as both a `<workflow>/<step>` (the procedural fact: who did what) and a `<lifecycle>/<eventRef>` (the resulting new version of the bill). It is referenced by 2 entries in `<analysis>/<activeModifications>` describing the textual changes it produced.*

The tooltip should adapt to which sections actually contributed to the row. If a row is procedural-only, say so:

> *This is a procedural event from `<workflow>/<step>`. It records what happened, but did not produce a new version of the bill text.*

These tooltips are the spine of the "teach the format" goal. Treat their copy as part of the deliverable, not an afterthought.

## The detail pane (right column, top half)

When a timeline row is selected, render a stack:

### 1. Event card

A small card with the joined facts from the three sections, each labeled with its AKN origin. Example:

```
March 15, 2024 — Justice Commission approved amendment-42

  From <workflow>/<step>:
    agent:    Justice Commission
    role:     rapporteur
    outcome:  approved
    refersTo: #ev-jc-approval-2024-03-15

  From <lifecycle>/<eventRef>:
    type:     amendment
    produced: bill expression v2 (2024-03-15)

  From <analysis>/<activeModifications>:
    1 substitution targeting /bill/body/article[3]/paragraph[2]
```

Each AKN field name (`agent`, `role`, `outcome`, `refersTo`, `eventRef`, `activeModifications`) gets a tooltip with a one-sentence definition and an example. Do not assume the reader knows any of these terms.

### 2. Linked amendment document (if any)

`amendment` is its own AKN document type ([amendment.json](src/lib/akn-schema/generated/amendment.json)) — it is not a sub-element of the bill. When an event references an amendment doc, render an inline summary card:

- the amendment's identification (FRBR URI, sponsor, date)
- the proposed change (its own body)
- a link/expand to the full amendment page (separate route, out of scope here, but leave the affordance)

A tooltip on the card header explains:

> *An amendment is a standalone AKN document with its own metadata and body. The bill's `<analysis>` records which spans this amendment modified; the amendment itself describes what change it proposed and why.*

### 3. Touched body spans

For each modification in `<analysis>` attributed to this event, render a small "what changed" block:

- the target `eId` resolved to a human path ("Article 3, paragraph 2")
- the modification type (substitution, insertion, repeal)
- an inline old → new diff for substitutions
- a "scroll to in body" link that highlights the span in the body view below

Tooltip on `eId`:

> *An `eId` is AKN's stable identifier for a piece of text inside a document — like an anchor. Every section, article, paragraph has one, so events and modifications can point at exact spans without relying on text matching.*

## The body view (right column, bottom half)

Render `<bill>/<body>` as the AKN hierarchy: the chosen top-level container (article, chapter, section…) and everything beneath it. Reuse [src/lib/components/akn-schema/SchemaTree.svelte](src/lib/components/akn-schema/SchemaTree.svelte) ergonomics if appropriate — but this is real document content, not a schema viewer, so probably a new component.

Behavior:

- Show the **current expression's** text by default (the latest version per `<lifecycle>`).
- When a timeline row is selected, **highlight the spans** that event's `<analysis>` modifications target. Auto-scroll to the first one.
- Each container (`article`, `section`, etc.) shows a small chip with its tag name and `eId`. Hovering reveals a tooltip:

  > *`<article>` is one of AKN's hierarchical containers. `eId="art_3"` is its stable anchor — events and modifications elsewhere in the document point at it via this id.*

- Clicking on a body span opens a **reverse view**: which events touched this span? List them, each clickable to jump back into the timeline. This is the bidirectional navigation that makes the format feel alive.

Bidirectional navigation is a hard requirement. Event → spans must work, and span → events must work. If only one direction works, the page is incomplete.

## Tooltips: scope and tone

Every AKN-native term that appears as visible text should have a tooltip on first appearance per pane. Terms to cover, at minimum:

- `bill`, `act`, `amendment` (document types)
- `<meta>`, `<body>`, `<coverPage>`, `<preface>` (top-level structure)
- `<lifecycle>`, `<eventRef>`, `<workflow>`, `<step>`, `<analysis>`, `<activeModifications>`, `<passiveModifications>` (event/change machinery)
- `eId`, `wId`, `GUID` (identifiers)
- `FRBR expression`, `FRBR work`, `FRBR manifestation` (versioning model)
- `TLCEvent`, `TLCPerson`, `TLCOrganization` (the ontology references inside `<meta>/<references>`)
- `agent`, `role`, `outcome`, `refersTo`, `source` (recurring attributes)

Tone: one short sentence defining the term, optionally one short sentence with a concrete example from *this* document. No jargon-on-jargon. Imagine the reader has never opened the AKN spec.

Tooltips should feel like a friendly margin gloss, not documentation popups. A consistent pattern: small dotted underline on the term, hover to reveal.

## The "is this data well-formed?" surface

Because this page doubles as a data validity check, surface problems inline rather than hiding them:

- If a `<step>` has a `refersTo` that resolves to no TLCEvent in `<references>`: render the row but mark it with a small warning chip and tooltip explaining the dangling ref.
- If a modification in `<analysis>` targets an `eId` that doesn't exist in `<body>`: render the modification card with a warning, and in the body view show the missing eId as a placeholder.
- If `<lifecycle>` and `<workflow>` agree on a date but disagree on what happened: surface that.
- If `<meta>/<identification>` is missing required FRBR levels: warn at the page header.

These warnings are the page's value as a debugging surface. Keep them visible but quiet — yellow, not red. The reader should understand they're seeing the *data*, not a bug in the UI.

## What's out of scope for v1

- Editing. This is a read view.
- Multi-expression comparison (showing two versions of the bill side by side). Powerful, but a separate page.
- The full `amendment` detail page. Link to it; don't render it inline beyond a summary card.
- Cross-document navigation beyond the bill's own references. The bill might cite the act it amends; render that as a link, not an embedded view.
- Country-specific decoration. Use the AKN structure as it is; country flavor lives in `<meta>/<proprietary>` under our `akndiff:` namespace and can be surfaced later.

## Where to wire this into the codebase

- New route: `src/routes/demo/[country]/bill/[id]/+page.svelte` (mirroring the existing `[country]/act/[id]` pattern under `src/routes/demo/`).
- Server load: read the AKN XML for the bill, parse into a JS structure, resolve `<references>` so every `refersTo` is a hydrated object before reaching the component layer. The component layer should not know about XML.
- Reuse `src/lib/akn-schema/types.ts` shapes where possible. If you need new shared types for "rendered bill state" (the joined event view, the resolved modifications), put them in a new `src/lib/bill/` module — don't pollute the schema types.
- Tooltips: build one `<AknTerm>` component that takes a term key and renders the term + its tooltip. Centralize the term → definition map so we can review the copy in one place. This is also where future i18n hooks.

## Definition of done

The page is done when:

1. A reader who has never seen AKN can open the page and, by hovering tooltips, explain what `<lifecycle>`, `<workflow>`, and `<analysis>` are and how they relate.
2. Every event from the underlying XML appears exactly once in the timeline, with all of its `<step>` / `<eventRef>` / `<analysis>` slices visible in the detail pane.
3. Clicking an event highlights its targeted spans in the body. Clicking a span lists the events that touched it. Both directions work.
4. Data problems (dangling refs, missing eIds, incomplete identification) are visible on the page, not hidden in console errors.
5. The page renders correctly for at least one Chilean bill in the research corpus and one bill from a second country, without per-country branching in the component code.

The last criterion is the real test. If country-specific rendering creeps in, the AKN abstraction has leaked, and either the data is wrong or the schema is wrong. Either way, that's a finding worth surfacing to the schema research, not a UI bug.
