# AKN++ Overview

AKN++ is a lightweight XML extension to the [Akoma Ntoso](../akn/01-what-is-akn.md) standard that adds **computable change tracking** and **voting records** to legislative documents.

## The gap in Akoma Ntoso

Akoma Ntoso (AKN) provides excellent tools for structuring legal documents — acts, bills, amendments, debates — but it lacks a machine-readable way to answer two critical questions:

1. **What exactly changed** between two versions of a document?
2. **Who voted for or against** each change?

AKN's `<mod>` and `<mref>` elements describe modifications in human-readable prose ("Article 5 is hereby replaced by..."), but they are not structured enough for automated diff computation. A software system reading an AKN amendment cannot reliably extract the old text, the new text, and the type of change without natural language processing.

AKN++ fills this gap with two elements: `changeSet` and `vote`.

## Namespace

AKN++ uses its own XML namespace so that standard AKN processors can safely ignore it:

| Standard | Namespace URI |
|---|---|
| Akoma Ntoso 3.0 | `http://docs.oasis-open.org/legaldocml/ns/akn/3.0` |
| **AKN++** | `http://parlamento.ai/ns/aknpp/1.0` |

In practice, documents declare both namespaces:

```xml
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:aknpp="http://parlamento.ai/ns/aknpp/1.0">
```

## Design principles

- **Non-invasive**: AKN++ elements live alongside standard AKN elements. An AKN processor that doesn't know about the `aknpp` namespace will simply skip them. The document remains valid AKN.
- **Computable**: Every `articleChange` contains the exact old and new text, enabling automated diff generation without NLP.
- **Auditable**: Every `changeSet` can carry a `vote` element that records who voted, how they voted, and the outcome.
- **Chainable**: Multiple amendments to the same document form a chain through their `base` and `result` URIs, creating a complete version history.

## What AKN++ enables

| Capability | How |
|---|---|
| Automated diff generation | `articleChange` elements provide exact old/new text pairs |
| Version chain reconstruction | `base`→`result` URIs link document versions in sequence |
| Voting analytics | `vote` elements record individual votes per amendment |
| Audit trails | The full lifecycle — who proposed what, who voted how, what was approved — is machine-readable |
| Rejected/withdrawn tracking | Even amendments that didn't pass are recorded with their proposed changes |

## Elements at a glance

AKN++ introduces two top-level elements:

- **[`changeSet`](02-changeset.md)** — Describes the computable changes between two document versions. Contains `articleChange` elements for each modified article and an optional `vote`.
- **[`vote`](03-voting.md)** — Records the parliamentary vote on a `changeSet`, including individual voter records.

For a complete walkthrough using a real example, see the [Paella Valenciana lifecycle](04-examples.md).

