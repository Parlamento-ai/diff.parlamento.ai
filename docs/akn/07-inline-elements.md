# Inline Elements

AKN provides a rich set of inline markup elements for annotating text within structural elements. These fall into several categories.

## References

### `<ref>` — Cross-reference

A reference to another document or a specific part of a document:

```xml
<p>As established in <ref href="/akn/es/act/2024-01-01/3#art_5">Article 5
of Act 3</ref>.</p>
```

| Attribute | Description |
|---|---|
| `href` | The target IRI (can be absolute, relative, or fragment `#...`) |

### `<rref>` — Range reference

A reference to a range of provisions:

```xml
<p>Articles <rref from="#art_3" upTo="#art_7">3 through 7</rref> are hereby amended.</p>
```

| Attribute | Description |
|---|---|
| `from` | Start of the range |
| `upTo` | End of the range |

## Modifications

### `<mod>` — Textual modification

Marks the quoted text of a modification (the new text being inserted or substituted):

```xml
<p>Article 1 is replaced by: <mod>"The new text of article 1."</mod></p>
```

### `<mref>` — Modification reference

A reference within a modification context:

```xml
<p><mref href="#art_5">Article 5</mref> is hereby repealed.</p>
```

### `<ins>` — Insertion

Marks text that is newly inserted:

```xml
<p>After article 5, insert: <ins>"Article 5 bis. The new article."</ins></p>
```

### `<del>` — Deletion

Marks text that has been deleted:

```xml
<p>The words <del>"and all its successors"</del> are repealed.</p>
```

### `<omissis>` — Omitted text

Represents text deliberately omitted (e.g., "..."):

```xml
<p>Article 3 shall read: "The government <omissis/> shall take measures..."</p>
```

### `<quotedText>` — Quoted text in modifications

Text quoted as part of an amendment instruction:

```xml
<p>In article 3(2), for <quotedText eId="qtext_1">"the Minister"</quotedText>
substitute <quotedText eId="qtext_2">"the Secretary of State"</quotedText>.</p>
```

### `<quotedStructure>` — Quoted structure in modifications

When a modification quotes an entire structural element:

```xml
<mod>
  <quotedStructure eId="qstr_1">
    <article wId="art_5bis" eId="qstr_1__art_5bis">
      <heading>Article 5 bis</heading>
      <content><p>The new article text.</p></content>
    </article>
  </quotedStructure>
</mod>
```

## Semantic annotations

### `<date>` — Date

```xml
<p>Enacted on <date date="2024-01-15" refersTo="#enactmentDate">15 January 2024</date>.</p>
```

### `<entity>` — Named entity (generic)

```xml
<p>The <entity refersTo="#ministry">Ministry of Agriculture</entity> shall oversee...</p>
```

### `<person>` — Person reference

```xml
<p><person refersTo="#senator-x">Senator García</person> moved to table the motion.</p>
```

### `<organization>` — Organization reference

```xml
<p>The <organization refersTo="#un">United Nations</organization> shall coordinate...</p>
```

### `<location>` — Place reference

```xml
<p>Applicable in the territory of <location refersTo="#valencia">Valencia</location>.</p>
```

### `<quantity>` — Numeric quantity

```xml
<p>A fine not exceeding <quantity normalized="50000">fifty thousand</quantity> euros.</p>
```

### `<concept>` — Concept reference

```xml
<p>The concept of <concept refersTo="#publicOrder">public order</concept> shall be
interpreted broadly.</p>
```

## Definitions and terms

### `<def>` — Definition

Marks a term being defined:

```xml
<p><def refersTo="#socarrat">"Socarrat"</def> means the crispy layer of rice
formed at the bottom of the paellera.</p>
```

### `<term>` — Term usage

Marks usage of a defined term elsewhere in the document:

```xml
<p>The <term refersTo="#socarrat">socarrat</term> shall be formed in the final
2 minutes of cooking.</p>
```

## Typographic elements

| Element | Description | Example |
|---|---|---|
| `<b>` | Bold | `<b>important</b>` |
| `<i>` | Italic | `<i>per se</i>` |
| `<u>` | Underline | `<u>emphasis</u>` |
| `<sub>` | Subscript | `H<sub>2</sub>O` |
| `<sup>` | Superscript | `m<sup>2</sup>` |
| `<span>` | Generic inline | `<span class="highlight">text</span>` |

## Notes

### `<authorialNote>` — Author's note

An inline footnote or marginal note:

```xml
<p>This provision<authorialNote marker="1" placement="bottom">
  <p>See Regulation 2019/1234 for definitions.</p>
</authorialNote> shall apply from January 2025.</p>
```

| Attribute | Description |
|---|---|
| `marker` | The footnote number/symbol |
| `placement` | Where it appears: `bottom`, `side`, `inline` |

### `<noteRef>` — Reference to a note

When notes are defined in `<meta><notes>`, inline references point to them:

```xml
<p>This provision<noteRef href="#note_1" marker="1"/> shall apply.</p>
```

## Line breaks and page breaks

| Element | Description |
|---|---|
| `<br/>` | Line break |
| `<eol/>` | End of line (structural) |
| `<eop/>` | End of page (structural) |

## Images and embedded content

```xml
<img src="/images/coat-of-arms.png" alt="Coat of Arms"/>
```

## The `<a>` element

The only element that uses standard HTML-style linking (not AKN IRIs):

```xml
<a href="https://www.example.org">external link</a>
```

All other cross-references should use `<ref>` with AKN IRIs.

