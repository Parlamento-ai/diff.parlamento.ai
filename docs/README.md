# diff-law Documentation

This documentation covers two topics: **AKN++**, our extension to Akoma Ntoso for computable change tracking and voting records, and a **beginner's guide to Akoma Ntoso** (AKN) itself.

## AKN++ — Computable Diffs for Legislative Documents

AKN++ extends the Akoma Ntoso standard with `changeSet` and `vote` elements that make amendment tracking and voting records machine-readable.

1. [Overview](aknpp/01-overview.md) — What AKN++ adds and why
2. [The changeSet element](aknpp/02-changeset.md) — `base`/`result`, `articleChange`, version chaining
3. [The vote element](aknpp/03-voting.md) — `for`/`against`/`abstain`, voter records
4. [Examples walkthrough](aknpp/04-examples.md) — The Paella Valenciana recipe lifecycle

**Namespace:** `http://parlamento.ai/ns/aknpp/1.0`

## Akoma Ntoso — Beginner's Guide

A friendly reference to the OASIS Standard for legal document markup.

1. [What is Akoma Ntoso?](akn/01-what-is-akn.md) — Origin, purpose, who uses it
2. [The FRBR model](akn/02-frbr.md) — Work, Expression, Manifestation, Item
3. [Document types](akn/03-document-types.md) — The 13 document types (act, bill, amendment, debate, ...)
4. [Common structure](akn/04-structure.md) — meta, preface, preamble, body, conclusions
5. [Metadata](akn/05-metadata.md) — identification, lifecycle, references, classification, analysis
6. [Legislative hierarchy](akn/06-hierarchy.md) — book, title, chapter, article, paragraph, ...
7. [Inline elements](akn/07-inline-elements.md) — ref, mod, ins, del, date, person, def, term, ...
8. [Debates](akn/08-debates.md) — Speech-based documents, voting sections
9. [Naming convention](akn/09-naming-convention.md) — URI construction, eId, wId, GUID
10. [National profiles](akn/10-national-profiles.md) — CLML (UK), USLM (US), LegalDocML.de, ...

## Official resources

- [OASIS LegalDocML TC](https://www.oasis-open.org/committees/legaldocml/) — the standards body
- [AKN Part 1: Vocabulary](http://docs.oasis-open.org/legaldocml/akn-core/v1.0/os/part1-vocabulary/akn-core-v1.0-os-part1-vocabulary.html)
- [AKN Part 2: Specifications](http://docs.oasis-open.org/legaldocml/akn-core/v1.0/os/part2-specs/akn-core-v1.0-os-part2-specs.html)
- [AKN Naming Convention](http://docs.oasis-open.org/legaldocml/akn-nc/v1.0/akn-nc-v1.0.html)
- [XML Schema (akomantoso30.xsd)](http://docs.oasis-open.org/legaldocml/ns/akn/3.0)
