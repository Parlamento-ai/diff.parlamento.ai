# Document Types

Akoma Ntoso defines 13 document types, each represented by a specific XML element that sits directly under the `<akomaNtoso>` root. The types fall into three categories based on their body structure.

## Hierarchical documents (legislative body)

These use `<body>` and contain a hierarchy of parts, sections, articles, etc.

| Element | Description | Typical use |
|---|---|---|
| `<act>` | An enacted law | Statutes, codes, regulations, decrees |
| `<bill>` | A proposed law not yet enacted | Parliamentary bills, draft legislation |
| `<amendment>` | A proposed change to a bill | Individual amendments during legislative process |
| `<amendmentList>` | A collection of amendments | Omnibus amendment packages |

### Minimal act example

```xml
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0">
  <act name="example-act">
    <meta>
      <identification source="#source">
        <FRBRWork>
          <FRBRthis value="/akn/us/act/2024-01-01/1"/>
          <FRBRuri value="/akn/us/act/2024-01-01/1"/>
          <FRBRdate date="2024-01-01" name="enactment"/>
          <FRBRauthor href="#congress"/>
          <FRBRcountry value="us"/>
        </FRBRWork>
        <FRBRExpression>
          <FRBRthis value="/akn/us/act/2024-01-01/1/eng@"/>
          <FRBRuri value="/akn/us/act/2024-01-01/1/eng@"/>
          <FRBRdate date="2024-01-01" name="enactment"/>
          <FRBRlanguage language="eng"/>
        </FRBRExpression>
        <FRBRManifestation>
          <FRBRthis value="/akn/us/act/2024-01-01/1/eng@/main.xml"/>
          <FRBRformat value="application/akn+xml"/>
        </FRBRManifestation>
      </identification>
    </meta>
    <body>
      <article eId="art_1">
        <heading>Article 1</heading>
        <content><p>The text of the article.</p></content>
      </article>
    </body>
  </act>
</akomaNtoso>
```

### Amendment structure

Amendments use a special body element `<amendmentBody>` instead of `<body>`:

```xml
<amendment name="amendment-1">
  <meta><!-- ... --></meta>
  <preface>
    <p>Amendment by <docProponent>Senator X</docProponent> to
    <affectedDocument href="/akn/us/bill/2024-01-01/1">Bill 1</affectedDocument>.</p>
  </preface>
  <amendmentBody>
    <amendmentContent>
      <p>Replace article 3 with the following: ...</p>
    </amendmentContent>
    <amendmentJustification>
      <p>Reason for the amendment.</p>
    </amendmentJustification>
  </amendmentBody>
</amendment>
```

## Debate documents

These use `<debateBody>` and contain speeches, questions, and voting sections.

| Element | Description | Typical use |
|---|---|---|
| `<debate>` | A full parliamentary debate transcript | Plenary session records, committee hearings |
| `<debateReport>` | A report/summary of a debate | Official reports, Hansard-style records |

See [Debates](/docs/akn/debates) for details.

## Other structured documents

These use `<mainBody>` (a generic body for non-hierarchical content) or specialized structures.

| Element | Description | Typical use |
|---|---|---|
| `<doc>` | A generic legal document | Memoranda, reports, any document that doesn't fit other types |
| `<statement>` | An official statement | Government statements, press releases |
| `<judgment>` | A court decision | Court judgments, opinions, orders |
| `<officialGazette>` | An official gazette publication | National gazette issues |
| `<documentCollection>` | A collection of documents | Bill packages (bill + explanatory memo + annexes) |
| `<portion>` | A fragment of a larger document | When only part of a document is available |
| `<components>` | Container for component documents | Subdocuments attached to a main document |

### When to use `<doc>`

`<doc>` is the catch-all. If your document doesn't fit any other type, use `<doc>`. It uses `<mainBody>` instead of `<body>`:

```xml
<doc name="memorandum">
  <meta><!-- ... --></meta>
  <mainBody>
    <p>Content of the memorandum.</p>
  </mainBody>
</doc>
```

### Document collections

A `<documentCollection>` groups related documents, such as a bill package containing the bill itself plus a memorandum. It uses `<collectionBody>` with `<component>` children:

```xml
<documentCollection name="billPackage">
  <meta><!-- ... --></meta>
  <collectionBody>
    <component eId="cmp_1">
      <documentRef eId="cmp_1__dref_1" href="#bill" showAs="BILL"/>
    </component>
    <component eId="cmp_2">
      <documentRef eId="cmp_2__dref_1" href="#memorandum" showAs="MEMORANDUM"/>
    </component>
  </collectionBody>
</documentCollection>
```

## Body element summary

| Document type(s) | Body element |
|---|---|
| `act`, `bill` | `<body>` |
| `amendment` | `<amendmentBody>` |
| `debate`, `debateReport` | `<debateBody>` |
| `doc`, `statement`, `judgment` | `<mainBody>` |
| `officialGazette`, `documentCollection` | `<collectionBody>` |

