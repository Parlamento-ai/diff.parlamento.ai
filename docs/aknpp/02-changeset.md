# The changeSet Element

The `changeSet` is the core of AKN++. It lives as a direct child of the document element (`bill`, `amendment`, or `act`) and describes the computable difference between two versions of a document.

## Structure

```xml
<aknpp:changeSet base="..." result="...">
  <aknpp:vote .../>             <!-- optional: voting record -->
  <aknpp:articleChange .../>    <!-- one per modified article -->
  <aknpp:articleChange .../>
</aknpp:changeSet>
```

## Attributes

| Attribute | Required | Description |
|---|---|---|
| `base` | Yes | FRBR Expression URI of the document **before** the changes |
| `result` | Yes | FRBR Expression URI of the document **after** the changes |

### Example

```xml
<aknpp:changeSet
  base="/poc/receta/paella-valenciana/esp@2023-03-18"
  result="/poc/receta/paella-valenciana/esp@2024-05-10">
```

This says: "applying the changes in this changeSet to the 2023-03-18 version produces the 2024-05-10 version."

## The articleChange element

Each `articleChange` describes a single article-level modification.

```xml
<aknpp:articleChange article="art_5" type="substitute">
  <aknpp:old>Previous text of the article.</aknpp:old>
  <aknpp:new>New text of the article.</aknpp:new>
</aknpp:articleChange>
```

### Attributes

| Attribute | Required | Description |
|---|---|---|
| `article` | Yes | The `eId` of the affected article |
| `type` | Yes | One of: `substitute`, `insert`, `repeal`, `renumber` |
| `after` | Only for `insert` | The `eId` of the article after which the new one is inserted |

### Change types

#### `substitute` — Replace an article's text

The most common change type. Both `<old>` and `<new>` contain text.

```xml
<aknpp:articleChange article="art_1" type="substitute">
  <aknpp:old>Se utilizarán 400 gramos de arroz bomba de denominación
  de origen Valencia. Queda prohibido el uso de cualquier otra
  variedad de arroz.</aknpp:old>
  <aknpp:new>Se utilizarán 400 gramos de arroz bomba o, alternativamente,
  arroz redondo de grano medio. Se recomienda preferentemente el arroz
  bomba cuando esté disponible.</aknpp:new>
</aknpp:articleChange>
```

#### `insert` — Add a new article

The `after` attribute specifies where the new article goes. `<old>` is empty or absent.

```xml
<aknpp:articleChange article="art_5bis" type="insert" after="art_5">
  <aknpp:new>Cuando se utilicen mariscos según el artículo 5, el plato
  deberá denominarse 'paella mixta' y no 'paella valenciana'.</aknpp:new>
</aknpp:articleChange>
```

#### `repeal` — Remove an article

`<new>` is empty or absent. The article is deleted.

```xml
<aknpp:articleChange article="art_12" type="repeal">
  <aknpp:old>Text of the repealed article.</aknpp:old>
</aknpp:articleChange>
```

#### `renumber` — Change an article's number/position

Used when articles are renumbered without changing their content.

## Version chaining

The `base` and `result` attributes create a chain across multiple amendments. Each amendment's `result` becomes the next amendment's `base`:

```
Original act         : esp@2023-03-18
                         ↓ base
Bill (approved)      : esp@2023-03-18 → esp@2024-05-10
                                           ↓ base
Amendment 2 (approved): esp@2024-05-10 → esp@2024-06-15
                                            ↓ base
Amendment 4 (approved): esp@2024-06-15 → esp@2024-07-01
                                            ↓
Final act            : esp@2024-09-01
```

Only approved amendments advance the chain. Rejected and withdrawn amendments have `base == result` (see below).

## When base equals result

For rejected, withdrawn, or inadmissible amendments, the `base` and `result` URIs are identical. This signals that the amendment **did not produce a new version**:

```xml
<!-- Amendment 1: unanimously rejected -->
<aknpp:changeSet
  base="/poc/receta/paella-valenciana/esp@2024-05-10"
  result="/poc/receta/paella-valenciana/esp@2024-05-10">
```

The `articleChange` elements still describe what *would have* changed, preserving the full legislative record. The `vote` element's `result` attribute clarifies why the change didn't happen.

