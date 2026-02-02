# Naming Convention

The Akoma Ntoso Naming Convention defines how to construct URIs for documents, IDs for elements, and references between documents. It is specified in a separate OASIS Standard document: *Akoma Ntoso Naming Convention Version 1.0*.

## Document IRIs

AKN uses IRIs (Internationalized Resource Identifiers) that are **meaningful**, **permanent**, and **derivable from invariant properties**.

### Work-level IRI

```
/akn/{country}/{docType}[/{subtype}][/{author}]/{date}/{number}
```

| Component | Required | Example |
|---|---|---|
| `/akn` | Yes | Fixed prefix |
| `{country}` | Yes | ISO 3166-1 alpha-2: `es`, `cl`, `gb`. Subdivisions: `it-45` |
| `{docType}` | Yes | AKN document type: `act`, `bill`, `amendment`, `debate`, `doc`, etc. |
| `{subtype}` | No | Further specification: `decree`, `legge`, `DIR` |
| `{author}` | No | Emanating authority (when not implicit): `MinistryForeignAffairs` |
| `{date}` | Yes | `YYYY-MM-DD` (or `YYYY` if sufficient) |
| `{number}` | When needed | Number, name, or disambiguator. Use `nn` if none exists |

**Examples:**

```
/akn/sl/act/2004-02-13/2                          Sierra Leone Act no. 2
/akn/ke/act/decree/MinistryForeignAffairs/2005-07-12/3   Kenya decree
/akn/it-45/act/legge/consiglio/2004-05-24/11      Emilia-Romagna regional law
/akn/cl/debate/recurso/2006/1076048               Chile debate record
/akn/eu/act/2003-11-13/87                          EU Directive
```

### Expression-level IRI

Adds language and version to the Work IRI:

```
{Work IRI}/{language}[@{version}]
```

| Component | Description |
|---|---|
| `{language}` | ISO 639-2 alpha-3: `eng`, `fra`, `spa`, `deu`. `mul` = multilingual |
| `@` | Separator before version info |
| `{version}` | Date (`YYYY-MM-DD`) or label (`first`, `final`) |

**Version semantics:**

| Syntax | Meaning |
|---|---|
| `/eng` | Current version (as of today) |
| `/eng@` | Original/first version |
| `/eng@2024-07-21` | Version as amended on that date |
| `/eng@first` | Named version |

**Examples:**

```
/akn/sl/act/2004-02-13/2/eng                      English, current
/akn/sl/act/2004-02-13/2/eng@                      English, original
/akn/sl/act/2004-02-13/2/eng@2004-07-21           English, amended version
/akn/cl/debate/recurso/2006/1076048/spa@2012-05-05  Spanish, specific version
```

### Manifestation-level IRI

Adds file format:

```
{Expression IRI}[/{markup author}][/{date}].{extension}
```

**Examples:**

```
/akn/sl/act/2004-02-13/2/eng@2004-07-21/main.xml
/akn/sl/act/2004-02-13/2/eng.pdf
/akn/cl/debate/recurso/2006/1076048/spa@2012-05-05/!main.xml
```

## Components and portions

### Components (`!`)

Components represent subdocuments (main body, schedules, annexes):

```
/akn/eu/act/2003-11-13/87/eng@/!main          Main component
/akn/eu/act/2003-11-13/87/eng@/!schedule_1    Schedule 1
/akn/eu/act/2003-11-13/87/eng@/!annex_1       Annex 1
```

When the component is `!main`, it can be omitted.

### Portions (`~`)

Portions reference specific structural parts:

```
/akn/eu/act/2003-11-13/87/~art_3              Article 3
/akn/eu/act/2003-11-13/87/~art_3->art_5       Articles 3 through 5
```

### Fragments (`#`)

Fragments are local (same document), like HTML anchors:

```
#art_5                     Scroll to article 5 in current document
```

## The eId attribute

The `eId` (Expression-level identifier) is the primary identifier for elements within a document. Its syntax uses hierarchical notation:

```
[prefix__]element_number
```

### Separators

- `__` (double underscore) — separates context prefix from element
- `_` (single underscore) — separates element abbreviation from its number

### Building eIds

```
art_1                           Article 1
art_1__para_2                   Paragraph 2 of Article 1
sec_3__art_1__para_2            Paragraph 2 of Article 1 of Section 3
art_15__cl_3__mod_1__qstr_1     Quoted structure 1 of mod 1 of clause 3 of article 15
```

### Element abbreviations

Common elements use abbreviated names in eIds:

| Element | eId abbreviation |
|---|---|
| `<article>` | `art` |
| `<section>` | `sec` |
| `<chapter>` | `chp` |
| `<paragraph>` | `para` |
| `<subparagraph>` | `subpara` |
| `<clause>` | `cl` |
| `<subclause>` | `subcl` |
| `<alinea>` | `al` |
| `<division>` | `dvs` |
| `<subdivision>` | `subdvs` |
| `<attachment>` | `att` |
| `<component>` | `cmp` |
| `<debateSection>` | `dbsect` |
| `<recital>` | `rec` |
| `<recitals>` | `recs` |
| `<citation>` | `cit` |
| `<citations>` | `cits` |
| `<quotedStructure>` | `qstr` |
| `<quotedText>` | `qtext` |
| `<documentRef>` | `dref` |
| `<eventRef>` | `eref` |
| `<temporalGroup>` | `tmpg` |

All other elements use their full name as the abbreviation.

### Numbering rules

1. **Unique elements** (e.g., `<body>`) — no number needed: `body`
2. **Explicitly numbered** (has `<num>`) — use the cleaned number: `art_11-2bis` for `<num>Art. 11.2 bis</num>`
3. **Implicitly numbered** (no `<num>`) — counted by position: `p_3` for the 3rd `<p>` in context

### Shared abbreviations

Some elements share the same abbreviation because they are functionally equivalent:

- `<body>`, `<mainBody>`, `<amendmentBody>`, `<debateBody>`, `<judgmentBody>` all use `body`
- `<list>` and `<blockList>` both use `list`
- `<intro>` and `<listIntroduction>` both use `intro`
- `<wrapUp>` and `<listWrapUp>` both use `wrapup`

## The wId attribute

The `wId` (Work-level identifier) stays **stable across versions**:

- When `wId == eId` (the common case): only `eId` is present, no `wId` attribute
- When they differ (after renumbering): both are present

```xml
<!-- Original: article 2 -->
<article eId="art_2">...</article>

<!-- After renumbering: article 2 is now article 3 -->
<article wId="art_2" eId="art_3">
  <num>3</num>
  <content><p>Originally article 2</p></content>
</article>
```

The `wId` never changes once assigned. The `eId` updates to reflect the current Expression.

**Navigation rule:** When following a reference across versions:
- If the source date is *before* the destination's version date → use `wId` for navigation
- Otherwise → use `eId`

## The GUID attribute

An optional application-specific identifier with no prescribed format. Used for compatibility with legacy systems. Does not affect AKN conformance.

## Non-document entity IRIs

Entities in the ontology (people, organizations, etc.) use:

```
/akn/ontology/{TLC}/{unique_id}
```

Examples:
- `/akn/ontology/person/es.yayo-pepe.1950-03-15`
- `/akn/ontology/organization/cl.congress`
- `/akn/ontology/concept/wikipedia.public-order`

## Conformance levels

- **Level 1**: Valid against the XML schema. eId/wId are optional.
- **Level 2**: Level 1 + eId/wId values follow the naming convention + FRBRuri/FRBRthis follow the IRI rules + href/src values follow the convention.

## Official reference

Full specification: [OASIS Akoma Ntoso Naming Convention v1.0](http://docs.oasis-open.org/legaldocml/akn-nc/v1.0/akn-nc-v1.0.html)

