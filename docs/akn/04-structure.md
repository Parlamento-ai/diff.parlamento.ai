# Common Document Structure

Every Akoma Ntoso document follows the same high-level pattern, regardless of its type.

## The root element

Every AKN document starts with `<akomaNtoso>` as the root:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0">
  <!-- exactly one document type element -->
</akomaNtoso>
```

Inside `<akomaNtoso>`, there is exactly **one** document type element (e.g., `<act>`, `<bill>`, `<debate>`).

## The common pattern

Every document type follows this structure:

```
<akomaNtoso>
  <act|bill|debate|...>
    <meta>              ← REQUIRED: metadata (FRBR, lifecycle, references)
    <coverPage>         ← optional: cover page
    <preface>           ← optional: front matter (title, author info)
    <preamble>          ← optional: recitals, considerations, "whereas" clauses
    <body|...>          ← REQUIRED: the main content
    <conclusions>       ← optional: signatures, dates, closing formulas
    <attachments>       ← optional: schedules, annexes
    <components>        ← optional: embedded subdocuments
  </act|bill|debate|...>
</akomaNtoso>
```

Only `<meta>` and the body element are required. Everything else is optional.

## Section by section

### `<meta>` — Metadata

The metadata block contains everything *about* the document:

```xml
<meta>
  <identification source="#source"><!-- FRBR identifiers --></identification>
  <lifecycle source="#source"><!-- events: creation, amendments --></lifecycle>
  <references source="#source"><!-- people, orgs, concepts --></references>
  <classification source="#source"><!-- keywords --></classification>
  <analysis source="#source"><!-- modifications analysis --></analysis>
  <temporalData source="#source"><!-- time-based applicability --></temporalData>
  <notes source="#source"><!-- footnotes, endnotes --></notes>
  <proprietary source="#source"><!-- custom/vendor metadata --></proprietary>
</meta>
```

Only `<identification>` is required. See [Metadata](05-metadata.md) for details.

### `<coverPage>` — Cover page

The optional cover page for formal publications:

```xml
<coverPage>
  <p>OFFICIAL GAZETTE</p>
  <p>Republic of Exampleland</p>
  <p>Volume 45, Number 12</p>
</coverPage>
```

### `<preface>` — Front matter

Contains the document's title, authorship, and introductory information:

```xml
<preface>
  <longTitle>
    <p>An Act to <docTitle>regulate the preparation of traditional dishes</docTitle></p>
  </longTitle>
  <p>Presented by <docProponent>the Minister of Culture</docProponent></p>
  <docDate date="2024-01-15">15 January 2024</docDate>
</preface>
```

Key elements within `<preface>`:
- `<longTitle>` — the official long title
- `<docTitle>` — the short title
- `<docProponent>` — who proposed the document
- `<docDate>` — official date

### `<preamble>` — Recitals and considerations

For legislation, the preamble contains the "whereas" clauses, recitals, or considerations:

```xml
<preamble>
  <formula name="enactingFormula">
    <p>BE IT ENACTED by the Parliament as follows:</p>
  </formula>
  <recitals>
    <intro><p>Having regard to:</p></intro>
    <recital eId="rec_1">
      <p>The Treaty on European Union, and in particular Article 114 thereof,</p>
    </recital>
    <recital eId="rec_2">
      <p>The proposal from the European Commission,</p>
    </recital>
  </recitals>
</preamble>
```

### `<body>` — The main content

The body contains the substantive content. Its internal structure depends on the document type:

- For hierarchical documents (`act`, `bill`): sections, articles, paragraphs — see [Hierarchy](06-hierarchy.md)
- For debates: speech sections — see [Debates](08-debates.md)
- For generic documents (`doc`): the body is `<mainBody>` with free-form content

### `<conclusions>` — Closing formulas

Signatures, dates, and closing statements:

```xml
<conclusions>
  <formula name="signatures">
    <p>Done at Brussels, 15 January 2024.</p>
    <signature refersTo="#president">
      <person refersTo="#president">The President</person>
      <role refersTo="#presidentRole">President of Parliament</role>
    </signature>
  </formula>
</conclusions>
```

### `<attachments>` — Schedules and annexes

Documents often have appendices, schedules, or annexes. Each attachment wraps a full document:

```xml
<attachments>
  <attachment eId="att_1">
    <heading>Schedule 1</heading>
    <doc name="schedule">
      <meta><!-- FRBR for the schedule --></meta>
      <mainBody>
        <p>Content of the schedule.</p>
      </mainBody>
    </doc>
  </attachment>
</attachments>
```

## Real-world example structure

A UK Public General Act (simplified from `uk_pga-2014-27-enacted-data.xml`):

```xml
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0">
  <act name="UnitedKingdomPublicGeneralAct">
    <meta>
      <identification source="#source">
        <!-- FRBRWork, FRBRExpression, FRBRManifestation -->
      </identification>
      <lifecycle source="#source">
        <eventRef date="2014-07-17" type="generation" eId="eRef_1" .../>
      </lifecycle>
      <analysis source="#palmirani">
        <activeModifications>
          <textualMod eId="textualMod_1" type="insertion" .../>
        </activeModifications>
      </analysis>
      <references source="#source">
        <TLCOrganization eId="source" href="..." showAs="..."/>
      </references>
    </meta>
    <preface>
      <longTitle eId="longTitle">
        <p>An Act to amend section 11 ...</p>
      </longTitle>
    </preface>
    <preamble>
      <formula name="EnactingText">
        <p>BE IT ENACTED ...</p>
      </formula>
    </preamble>
    <body>
      <section eId="sec_1">
        <num>1</num>
        <heading>Offence of recording...</heading>
        <subsection eId="sec_1__subsec_1">
          <!-- content -->
        </subsection>
      </section>
    </body>
  </act>
</akomaNtoso>
```

---

Previous: [Document types](03-document-types.md) | Next: [Metadata](05-metadata.md)
