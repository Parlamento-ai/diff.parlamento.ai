# UI Concept

How the Diff by Parlamento.ai demo app is meant to look, behave, and grow. Read this before changing the UI.

## Who it's for

Two audiences, on the same page, at the same time:

- **Political scientists, lawyers, sociologists** — domain experts who don't want to read XML but need to navigate legislative documents, see what changed, and reason about the parliamentary process.
- **Developers implementing AKN** — the people writing parsers, debugging schemas, checking that an `eId` resolves and that a `<workflow>/<step>` lines up with a `<lifecycle>/<eventRef>`.

The UI must serve both without forking into two products. One surface, two depths.

## Why this is hard

We're rendering legislative documents, which are dense. We're rendering them through Akoma Ntoso, which is a featureful XML standard with deep nesting and many edge cases. The documents themselves don't read like prose. The XML doesn't read like a casual schema. And we're doing it across five countries that each model the ritual differently.

The default reaction to that complexity is to hide it behind abstractions. We're rejecting that. (See "Stay close to the metal" below.)

## What we're testing

We are in the middle of the schema research plan: stress-testing whether one AKN-shaped schema can represent the parliamentary ritual of CL, ES, EU, PE, US without per-country branches. The UI is the instrument we use to read the results. It needs to make it obvious where the schema fits, where it bends, and where it leaks — for both the engineers debugging it and the political scientists reviewing it.

If a query that should be one JOIN takes five, the UI should make that visible. If a country pushes data into `countrySpecific`, the UI should show that. The demo isn't a polished product — it's the lens we look through to evaluate the experiment.

## The core pattern: view-of-view

The default view reads like a legislative document. Everything technical is one click away — never gone, never primary.

Concretely, every page has two layers:

1. **The reading layer** — what a domain expert sees first. Bill ID, title, timeline of events, body text. Terminology can lean on AKN naming (we don't translate `bill` to "proyecto de ley" unless the source uses that), but the layout reads as a document, not as a database row.

2. **The technical layer** — tucked behind small toggles, hovers, badges. Click `FRBR` in the header to see the full FRBR identification panel. Click `AKN` next to a body span to see its tag and `eId`. Click a tab to see the raw XML with sub-tabs for every linked document. Nothing is hidden permanently; everything is hidden by default.

The toggle pattern is uniform across the page. Once you've seen one (FRBR badge, body `AKN ▸` toggle), you know how the rest of the page works.

## Stay close to the metal

We are deliberately not building a friendly abstraction over AKN. Two reasons:

- The whole point of the research is to test AKN. If we paper over its rough edges, the research stops working.
- Domain experts who use this tool need to learn the AKN vocabulary anyway. We help them get there by exposing the terminology with on-demand definitions (the `AknTerm` tooltip pattern), not by inventing our own.

Simplifying ≠ hiding the hard parts. Simplifying = removing visual chrome, lowering the volume on technical detail until requested, and letting the legislative content lead. The XML is still right there, one click away, in a tab dedicated to it. The schema names are still there, in tooltips and panels. We are not building a different vocabulary on top of AKN. We are revealing AKN through a calmer surface.

## Design language (Phase 1: text first)

We are in the bare-bones phase. The current rules:

- **Text first.** Almost no icons. No illustration. The hierarchy is carried by typography, weight, color contrast, and whitespace.
- **Two fonts.** A heading font for prose and structure; a mono font for identifiers, XML, and any string the user might want to copy or reference exactly.
- **Neutral palette.** Slate / gray-blue scale. Semantic color (red, green, amber) is reserved for things that *mean* something — additions, deletions, warnings — not for decoration. No warm pastels. No brutalist black borders.
- **Soft chrome.** Hairline borders (`#e5e7eb`), occasional whisper-shadows. No heavy frames. Cards exist where they earn their weight; dividers replace cards when a card was just there to group, not to elevate.
- **Density is intentional.** This is a research tool surfacing a forest of data. Pages are dense by design. We use whitespace to separate concerns, not to look airy.

Color and icons will arrive later, when we know which signals deserve them. Adding visual weight is easy; removing it once it's there is not. So we start light.

## What "simple" means here

It's the opposite of what it usually means in product design.

- It does **not** mean fewer features. The page surfaces FRBR, lifecycle, workflow, analysis, body, lint, and raw XML — all of them. None of them got cut.
- It does **not** mean explanatory text everywhere. The UI doesn't narrate itself. It assumes the reader will hover or click when curious.
- It **does** mean: only one way to do each thing, that one way is the obvious one, and the visual weight of any element matches its importance to the task at hand.

## What this is not (yet)

- It is not a product for the general public. Citizens reading laws are not the audience for this version.
- It is not a polished editor or authoring tool. It's a viewer over data we generate offline.
- It is not multilingual UI. The chrome is in English; the legislative content stays in the source language.
- It is not responsive-mobile-first. Desktop-first; mobile is a fallback we'll improve later if the audience asks for it.

## What success looks like in Phase 1

A political scientist opens a bill page and reads it like a document. They see the title, the timeline, the body. They notice that everything technical is reachable but never in their face. They don't bounce.

A developer opens the same page, hits the XML tab, sees the source, sees the linked documents as sub-tabs, sees line numbers, copies what they need, and goes back to the document tab to verify their interpretation against the rendered view. They don't bounce either.

Neither of them ever feels the page is making decisions on their behalf about what AKN "really means." The metal is still right there.

## Open questions / next directions

- **Cross-document navigation.** Right now linked documents (amendments, debates, citations) appear in the timeline and in the XML sub-tabs. Whether they deserve their own dedicated page (vs. opening inline) is unresolved.
- **Schema coverage signal.** The lint tab shows expectation status per facet. Whether the bill page itself should surface a top-level "this country populates 84% of the schema" signal — or whether that lives only in the cross-country synthesis page — is unresolved.
- **When does color enter.** We will likely need it for the cross-country comparison views, where coverage gaps need to be scannable at a glance. We'll cross that bridge when we build that view.
