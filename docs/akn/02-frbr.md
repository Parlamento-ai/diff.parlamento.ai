# The FRBR Model

Every Akoma Ntoso document is identified using the **FRBR model** (Functional Requirements for Bibliographic Records). FRBR distinguishes four abstraction levels for any document, which is essential for legal texts because laws evolve through versions, translations, and formats.

## The four levels

```
Work            "The Constitution of Country X"           (the abstract concept)
  └─ Expression    "...as amended on 2024-01-15, in English"  (a specific version + language)
       └─ Manifestation  "...in XML format"                        (a specific file format)
            └─ Item          "...stored at this URL"                    (a specific copy)
```

### Work

The **Work** is the abstract intellectual creation. It is the law itself — not any particular text of it, but the concept.

- "The Civil Code of France" is a Work
- "Act 3 of 2015" is a Work
- A Work has no text — it's an identifier for the thing that all versions refer to

In AKN XML: `<FRBRWork>` inside `<identification>`.

### Expression

An **Expression** is a specific realization of a Work: a particular version, in a particular language, at a particular point in time.

- "The Civil Code of France, as consolidated on 2024-01-01, in French" is an Expression
- "Act 3 of 2015, as originally enacted, in English" is an Expression
- Every time a law is amended, a new Expression is created

In AKN XML: `<FRBRExpression>` inside `<identification>`.

### Manifestation

A **Manifestation** is the physical or digital embodiment of an Expression.

- The XML file of that version is a Manifestation
- The PDF published in the official gazette is a Manifestation
- The HTML rendering on the parliament's website is a Manifestation
- All Manifestations of the same Expression have the same textual content, just in different formats

In AKN XML: `<FRBRManifestation>` inside `<identification>`.

### Item

An **Item** is a specific physical copy of a Manifestation. This level is rarely relevant for digital documents but exists for completeness (e.g., "the copy of the official gazette in this library").

AKN does not require Item-level identification.

## How it maps in XML

Every AKN document has an `<identification>` block in its `<meta>` section with all three levels:

```xml
<meta>
  <identification source="#author">
    <FRBRWork>
      <FRBRthis value="/akn/sl/act/2004-02-13/2"/>
      <FRBRuri value="/akn/sl/act/2004-02-13/2"/>
      <FRBRdate date="2004-02-13" name="enactment"/>
      <FRBRauthor href="/akn/ontology/person/sl.parliament"/>
      <FRBRcountry value="sl"/>
    </FRBRWork>
    <FRBRExpression>
      <FRBRthis value="/akn/sl/act/2004-02-13/2/eng@2004-07-21"/>
      <FRBRuri value="/akn/sl/act/2004-02-13/2/eng@2004-07-21"/>
      <FRBRdate date="2004-07-21" name="amendment"/>
      <FRBRlanguage language="eng"/>
    </FRBRExpression>
    <FRBRManifestation>
      <FRBRthis value="/akn/sl/act/2004-02-13/2/eng@2004-07-21/main.xml"/>
      <FRBRformat value="application/akn+xml"/>
    </FRBRManifestation>
  </identification>
</meta>
```

## Key elements

| Element | Level | Required | Description |
|---|---|---|---|
| `FRBRthis` | All | Yes | URI of **this specific** resource at this FRBR level |
| `FRBRuri` | All | Yes | URI of the **collection** this resource belongs to |
| `FRBRdate` | All | Yes | Key date at this level (enactment, amendment, etc.) |
| `FRBRauthor` | Work, Expression | Yes | Who created this Work/Expression |
| `FRBRcountry` | Work | Yes | ISO country code |
| `FRBRlanguage` | Expression | Yes | ISO 639 language code |
| `FRBRformat` | Manifestation | No | MIME type of the file |
| `FRBRnumber` | Work | No | Official number |
| `FRBRname` | Work | No | Official name/title |

## URI construction basics

The FRBR levels build upon each other in the URI:

```
Work:           /akn/sl/act/2004-02-13/2
Expression:     /akn/sl/act/2004-02-13/2/eng@2004-07-21
Manifestation:  /akn/sl/act/2004-02-13/2/eng@2004-07-21/main.xml
```

For full URI construction rules, see [Naming convention](09-naming-convention.md).

## Why this matters

The FRBR model solves a real problem: when a legislator says "Article 5 of Act 3," they might mean:

- Article 5 as it exists today
- Article 5 as it was when first enacted
- Article 5 as it was on a specific date
- Article 5 in French vs. English

FRBR gives each of these a distinct, unambiguous identity. This is essential for cross-references, amendment tracking, and consolidated law databases.

---

Previous: [What is AKN?](01-what-is-akn.md) | Next: [Document types](03-document-types.md)
