# Metadata (the `<meta>` block)

The `<meta>` element is the only required section in every AKN document. It contains everything *about* the document: identity, history, relationships, and analysis.

## Overview

```xml
<meta>
  <identification>     <!-- REQUIRED: FRBR identifiers -->
  <publication>        <!-- optional: publication details -->
  <classification>     <!-- optional: keywords, subject tags -->
  <lifecycle>          <!-- optional: events history -->
  <workflow>           <!-- optional: processing steps -->
  <analysis>           <!-- optional: modification tracking -->
  <temporalData>       <!-- optional: time-based applicability -->
  <references>         <!-- optional: people, organizations, concepts -->
  <notes>              <!-- optional: footnotes, endnotes -->
  <proprietary>        <!-- optional: vendor-specific metadata -->
  <presentation>       <!-- optional: rendering hints -->
</meta>
```

## `<identification>` — FRBR identity

The only required metadata element. Contains the FRBR triplet:

```xml
<identification source="#source">
  <FRBRWork>
    <FRBRthis value="/akn/cl/act/2024-01-01/1"/>
    <FRBRuri value="/akn/cl/act/2024-01-01/1"/>
    <FRBRdate date="2024-01-01" name="enactment"/>
    <FRBRauthor href="/akn/ontology/person/cl.congress"/>
    <FRBRcountry value="cl"/>
  </FRBRWork>
  <FRBRExpression>
    <FRBRthis value="/akn/cl/act/2024-01-01/1/esp@"/>
    <FRBRuri value="/akn/cl/act/2024-01-01/1/esp@"/>
    <FRBRdate date="2024-01-01" name="enactment"/>
    <FRBRlanguage language="spa"/>
  </FRBRExpression>
  <FRBRManifestation>
    <FRBRthis value="/akn/cl/act/2024-01-01/1/esp@/main.xml"/>
    <FRBRformat value="application/akn+xml"/>
  </FRBRManifestation>
</identification>
```

See [The FRBR model](/docs/akn/frbr) for details on each level.

## `<lifecycle>` — Event history

Records every significant event in the document's life:

```xml
<lifecycle source="#source">
  <eventRef eId="e1" date="2023-03-18" type="generation" source="#author"/>
  <eventRef eId="e2" date="2024-05-10" type="amendment" source="/akn/bill/pae-2024-01"/>
  <eventRef eId="e3" date="2024-09-01" type="generation" source="#congress"/>
</lifecycle>
```

### eventRef attributes

| Attribute | Description |
|---|---|
| `eId` | Unique identifier for this event |
| `date` | When it happened (ISO 8601) |
| `type` | Event type: `generation`, `amendment`, `repeal` |
| `source` | Who/what caused it (href to a reference or document) |

## `<references>` — External entities

Defines all external entities mentioned in the document. These are the "TLC" (Top Level Class) elements from the Akoma Ntoso ontology:

```xml
<references source="#source">
  <TLCPerson eId="author" href="/akn/ontology/person/es.yayo-pepe" showAs="Yayo Pepe"/>
  <TLCOrganization eId="congress" href="/akn/ontology/organization/es.congress" showAs="Congress"/>
  <TLCEvent eId="enactment" href="/akn/ontology/event/enactment" showAs="Enactment"/>
  <TLCRole eId="speaker" href="/akn/ontology/role/es.speaker" showAs="Speaker"/>
  <TLCConcept eId="agriculture" href="/akn/ontology/concept/agriculture" showAs="Agriculture"/>
  <TLCLocation eId="madrid" href="/akn/ontology/location/es.madrid" showAs="Madrid"/>
  <TLCTerm eId="majority" href="/akn/ontology/term/majority-vote" showAs="majority vote"/>
</references>
```

### TLC element types

| Element | Represents |
|---|---|
| `TLCPerson` | A natural person (legislator, judge, author) |
| `TLCOrganization` | An organization (parliament, committee, ministry) |
| `TLCConcept` | An abstract concept |
| `TLCObject` | A physical or abstract object |
| `TLCEvent` | An event (enactment, amendment, hearing) |
| `TLCLocation` | A geographic location |
| `TLCProcess` | A legislative or judicial process |
| `TLCRole` | A role (speaker, president, rapporteur) |
| `TLCTerm` | A term from a controlled vocabulary |
| `TLCReference` | A generic reference to another document |

All TLC elements share the same attributes:

| Attribute | Required | Description |
|---|---|---|
| `eId` | Yes | Internal identifier used by `refersTo` and `href` attributes in the document |
| `href` | Yes | IRI to the external ontology/resource |
| `showAs` | Yes | Human-readable display name |

### Document references

The `<references>` section can also contain document-level references:

| Element | Description |
|---|---|
| `<original>` | Reference to the first Expression of this document |
| `<passiveRef>` | Reference to a document that modifies this one |
| `<activeRef>` | Reference to a document modified by this one |
| `<jurisprudence>` | Reference to case law interpreting this document |
| `<hasAttachment>` | Reference to an attachment |
| `<attachmentOf>` | Reference to the parent document (from the attachment's perspective) |

## `<classification>` — Subject keywords

```xml
<classification source="#source">
  <keyword eId="kw_1" value="agriculture" showAs="Agriculture"
           dictionary="https://example.org/thesaurus"/>
  <keyword eId="kw_2" value="food-safety" showAs="Food safety"
           dictionary="https://example.org/thesaurus"/>
</classification>
```

## `<workflow>` — Processing steps

Tracks the legislative/judicial workflow:

```xml
<workflow source="#source">
  <step eId="step_1" date="2024-01-01" outcome="#introduced"
        as="#sponsor" by="#senator-x"/>
  <step eId="step_2" date="2024-02-15" outcome="#committeeApproval"
        as="#committee" by="#judiciary-committee"/>
</workflow>
```

## `<analysis>` — Modification tracking

Records textual and meaning modifications, both active (changes this document makes to others) and passive (changes made to this document by others):

```xml
<analysis source="#source">
  <activeModifications>
    <textualMod eId="textualMod_1" type="insertion">
      <source eId="textualMod_1__source_1" href="#mod_1"/>
      <destination eId="textualMod_1__dest_1"
                   href="/akn/act/2000-07-28/23#sec_11__subsec_2A"/>
    </textualMod>
  </activeModifications>
  <passiveModifications>
    <textualMod eId="textualMod_2" type="substitution">
      <source eId="textualMod_2__source_1"
              href="/akn/act/2024-01-01/1#art_3"/>
      <destination eId="textualMod_2__dest_1" href="#art_5"/>
      <old eId="textualMod_2__old_1" href="#art_5"/>
      <new eId="textualMod_2__new_1" href="#art_5"/>
    </textualMod>
  </passiveModifications>
</analysis>
```

### Modification types

`textualMod` types: `insertion`, `substitution`, `repeal`, `renumbering`.

`meaningMod` types: `variation` (semantic change without text change).

The `<parliamentary>` subsection of `<analysis>` contains voting records:

```xml
<parliamentary>
  <voting eId="v_1" outcome="#approved" href="#vote-section">
    <count eId="v_1__c_1" value="86" refersTo="#inFavor"/>
    <count eId="v_1__c_2" value="0" refersTo="#against"/>
    <count eId="v_1__c_3" value="2" refersTo="#abstention"/>
  </voting>
</parliamentary>
```

## `<temporalData>` — Time-based applicability

Defines temporal groups and intervals for provisions that take effect at different times:

```xml
<temporalData source="#source">
  <temporalGroup eId="tmpg_1">
    <timeInterval eId="tmpg_1__ti_1"
                  start="#e1" end="#e2"
                  refersTo="#inForce"/>
  </temporalGroup>
</temporalData>
```

The `start` and `end` attributes reference `eventRef` elements in `<lifecycle>`.

## `<publication>` — Publication details

```xml
<publication date="2024-01-15"
             name="Official Gazette"
             showAs="Official Gazette, Vol. 45, No. 12"
             number="12"/>
```

## `<notes>` and `<proprietary>`

- `<notes>` — contains `<note>` elements for footnotes and endnotes
- `<proprietary>` — a container for any vendor/implementation-specific metadata (elements from other namespaces)

