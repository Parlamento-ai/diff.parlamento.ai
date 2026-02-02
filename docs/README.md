# diff-law Documentation

This documentation covers two topics: **AKN Diff**, our extension to Akoma Ntoso for computable change tracking and voting records, and a **beginner's guide to Akoma Ntoso** (AKN) itself.

## AKN Diff — Computable Diffs for Legislative Documents

AKN Diff extends the Akoma Ntoso standard with `changeSet` and `vote` elements that make amendment tracking and voting records machine-readable.

1. [Overview](/docs/akndiff/overview) — What AKN Diff adds and why
2. [The changeSet element](/docs/akndiff/changeset) — `base`/`result`, `articleChange`, version chaining
3. [The vote element](/docs/akndiff/voting) — `for`/`against`/`abstain`, voter records
4. [Examples walkthrough](/docs/akndiff/examples) — The Paella Valenciana recipe lifecycle

**Namespace:** `http://parlamento.ai/ns/akndiff/1.0`

## Akoma Ntoso — Beginner's Guide

A friendly reference to the OASIS Standard for legal document markup.

1. [What is Akoma Ntoso?](/docs/akn/what-is-akn) — Origin, purpose, who uses it
2. [The FRBR model](/docs/akn/frbr) — Work, Expression, Manifestation, Item
3. [Document types](/docs/akn/document-types) — The 13 document types (act, bill, amendment, debate, ...)
4. [Common structure](/docs/akn/structure) — meta, preface, preamble, body, conclusions
5. [Metadata](/docs/akn/metadata) — identification, lifecycle, references, classification, analysis
6. [Legislative hierarchy](/docs/akn/hierarchy) — book, title, chapter, article, paragraph, ...
7. [Inline elements](/docs/akn/inline-elements) — ref, mod, ins, del, date, person, def, term, ...
8. [Debates](/docs/akn/debates) — Speech-based documents, voting sections
9. [Naming convention](/docs/akn/naming-convention) — URI construction, eId, wId, GUID
10. [National profiles](/docs/akn/national-profiles) — CLML (UK), USLM (US), LegalDocML.de, ...

## Official resources

- [OASIS LegalDocML TC](https://www.oasis-open.org/committees/legaldocml/) — the standards body
- [AKN Part 1: Vocabulary](http://docs.oasis-open.org/legaldocml/akn-core/v1.0/os/part1-vocabulary/akn-core-v1.0-os-part1-vocabulary.html)
- [AKN Part 2: Specifications](http://docs.oasis-open.org/legaldocml/akn-core/v1.0/os/part2-specs/akn-core-v1.0-os-part2-specs.html)
- [AKN Naming Convention](http://docs.oasis-open.org/legaldocml/akn-nc/v1.0/akn-nc-v1.0.html)
- [XML Schema (akomantoso30.xsd)](http://docs.oasis-open.org/legaldocml/ns/akn/3.0)
