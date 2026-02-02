# Legislative Hierarchy

Legislation is organized in a tree of nested structural elements. AKN provides a standard set of hierarchy levels that jurisdictions can pick from to model their own legislation.

## The hierarchy from top to bottom

```
book
  └─ part
       └─ title
            └─ subtitle
                 └─ chapter
                      └─ subchapter
                           └─ section
                                └─ subsection
                                     └─ article
                                          └─ paragraph
                                               └─ subparagraph
                                                    └─ clause
                                                         └─ subclause
                                                              └─ ...
```

Not all levels are used in every jurisdiction. The hierarchy is flexible:

- **France/Spain/Italy**: typically use `title → chapter → article → paragraph`
- **UK**: uses `part → chapter → section → subsection`
- **US**: uses `title → subtitle → chapter → subchapter → section`
- **EU**: uses `title → chapter → section → article → paragraph`

## Hierarchy element structure

Every hierarchy element follows the same internal pattern:

```xml
<article eId="art_1">
  <num>1</num>                           <!-- optional: the number -->
  <heading>Short title</heading>         <!-- optional: the heading -->
  <subheading>More detail</subheading>   <!-- optional: subtitle -->
  <content>                              <!-- for leaf elements: inline content -->
    <p>The text of this article.</p>
  </content>
</article>
```

Or, for non-leaf elements (those containing sub-elements):

```xml
<section eId="sec_1">
  <num>1</num>
  <heading>General provisions</heading>
  <intro><p>This section establishes:</p></intro>   <!-- optional preamble text -->
  <article eId="sec_1__art_1"><!-- ... --></article>
  <article eId="sec_1__art_2"><!-- ... --></article>
  <wrapUp><p>The above provisions apply jointly.</p></wrapUp>  <!-- optional closing text -->
</section>
```

### Key child elements

| Element | Description | When to use |
|---|---|---|
| `<num>` | The official number/letter | "Article 1", "Section 3(a)" |
| `<heading>` | The title/heading | "General provisions" |
| `<subheading>` | Secondary heading | Subtitles, annotations |
| `<content>` | Inline content wrapper | Leaf elements (no children) |
| `<intro>` | Introduction before sub-elements | "The following shall apply:" |
| `<wrapUp>` | Closing text after sub-elements | "The above provisions are subject to..." |

### Content rule

A hierarchy element must contain **either** `<content>` (if it's a leaf) **or** child hierarchy elements (if it's a branch). It cannot have both `<content>` and child hierarchy elements.

## The standard elements

### Hierarchy containers (from largest to smallest)

| Element | eId abbreviation | Typical usage |
|---|---|---|
| `<book>` | `book` | Large code divisions |
| `<part>` | `part` | Major divisions |
| `<title>` | `title` | — |
| `<subtitle>` | `subtitle` | — |
| `<chapter>` | `chp` | — |
| `<subchapter>` | `subchp` | — |
| `<section>` | `sec` | Key division in UK/US legislation |
| `<subsection>` | `subsec` | — |
| `<article>` | `art` | Key division in continental European legislation |
| `<paragraph>` | `para` | — |
| `<subparagraph>` | `subpara` | — |
| `<clause>` | `cl` | — |
| `<subclause>` | `subcl` | — |
| `<point>` | `point` | Lettered/numbered items |
| `<indent>` | `indent` | Indented sub-items |
| `<alinea>` | `al` | Used in French/EU tradition |
| `<rule>` | `rule` | Rules in regulations |
| `<subrule>` | `subrule` | Sub-rules |
| `<proviso>` | `proviso` | "Provided that..." clauses |
| `<division>` | `dvs` | Generic division |
| `<subdivision>` | `subdvs` | Generic subdivision |

### `<hcontainer>` — Custom hierarchy levels

When no standard element fits, `<hcontainer>` provides a custom hierarchy level:

```xml
<hcontainer name="disposicionTransitoria" eId="hcont_1">
  <heading>Transitional Provision 1</heading>
  <content><p>During the first year...</p></content>
</hcontainer>
```

## The eId and wId conventions

### eId (Expression-level identifier)

The `eId` uses hierarchical dot notation with double underscores (`__`) separating levels:

```
art_1                        → Article 1
art_1__para_2                → Paragraph 2 of Article 1
sec_3__art_1__para_2         → Paragraph 2 of Article 1 of Section 3
```

The prefix before the number is an abbreviation of the element name (see table above).

### wId (Work-level identifier)

The `wId` is present **only** when it differs from `eId` — typically after renumbering:

```xml
<!-- Article was originally number 2, now renumbered to 3 -->
<article wId="art_2" eId="art_3">
  <num>3</num>
  <content><p>Originally article 2</p></content>
</article>
```

When `wId` is absent, it is implicitly equal to `eId`.

See [Naming convention](/docs/akn/naming-convention) for complete rules.

## Lists within hierarchy

Legislation often uses numbered/lettered lists within articles. AKN provides `<list>` (inline) and `<blockList>` (block-level):

```xml
<article eId="art_6">
  <heading>Artículo 6. Verduras</heading>
  <content>
    <p>Se utilizarán las siguientes verduras:</p>
    <blockList eId="art_6__list_1">
      <item eId="art_6__list_1__item_a">
        <num>(a)</num>
        <p>200 gramos de judía verde ancha</p>
      </item>
      <item eId="art_6__list_1__item_b">
        <num>(b)</num>
        <p>100 gramos de garrofón</p>
      </item>
      <item eId="art_6__list_1__item_c">
        <num>(c)</num>
        <p>1 tomate maduro rallado</p>
      </item>
    </blockList>
  </content>
</article>
```

## Tables

For tabular content within legislation:

```xml
<table eId="art_3__table_1">
  <tr>
    <th><p>Category</p></th>
    <th><p>Maximum amount</p></th>
  </tr>
  <tr>
    <td><p>Rice</p></td>
    <td><p>400g</p></td>
  </tr>
</table>
```

