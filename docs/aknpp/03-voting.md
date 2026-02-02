# The vote Element

The `vote` element records the parliamentary vote on a `changeSet`. It lives inside `changeSet` and captures the outcome, date, individual voters, and a link to the full debate record.

## Structure

```xml
<aknpp:vote date="2024-05-10"
            result="approved"
            source="/poc/debate/pae-2024-01-pleno">
  <aknpp:for>
    <aknpp:voter href="/poc/persona/diputada-madrilena" showAs="Dip. Madrileña"/>
    <aknpp:voter href="/poc/persona/diputado-catalan" showAs="Dip. Catalán"/>
  </aknpp:for>
  <aknpp:against>
    <aknpp:voter href="/poc/persona/diputado-valenciano" showAs="Dip. Valenciano"/>
  </aknpp:against>
  <aknpp:abstain/>
</aknpp:vote>
```

## Attributes

| Attribute | Required | Description |
|---|---|---|
| `date` | Yes | Date of the vote (ISO 8601) |
| `result` | Yes | Outcome of the vote (see values below) |
| `source` | No | FRBR URI of the `debate` document containing the full session record |

### Result values

| Value | Meaning |
|---|---|
| `approved` | The amendment was approved. The `changeSet` produces a new document version (`result` differs from `base`). |
| `rejected` | The amendment was voted down. The `changeSet` has `base == result`. |
| `withdrawn` | The author withdrew the amendment before or during the vote. The `changeSet` has `base == result`. |
| `inadmissible` | The amendment was ruled out of order (e.g., procedural reasons). The `changeSet` has `base == result`. |
| `pending` | The amendment has not yet been voted on. |

## Voter containers

The vote is broken into three containers, each holding zero or more `voter` elements:

| Container | Description |
|---|---|
| `<aknpp:for>` | Voters who voted in favor |
| `<aknpp:against>` | Voters who voted against |
| `<aknpp:abstain>` | Voters who abstained |

Empty containers are still included for clarity:

```xml
<!-- Unanimous rejection: nobody voted for -->
<aknpp:for/>
<aknpp:against>
  <aknpp:voter href="..." showAs="..."/>
  <!-- ... all 8 voters ... -->
</aknpp:against>
<aknpp:abstain/>
```

```xml
<!-- Withdrawn before vote: all containers empty -->
<aknpp:for/>
<aknpp:against/>
<aknpp:abstain/>
```

## The voter element

```xml
<aknpp:voter href="/poc/persona/diputada-madrilena" showAs="Dip. Madrileña"/>
```

| Attribute | Required | Description |
|---|---|---|
| `href` | Yes | FRBR URI identifying the person (typically matches a `TLCPerson` in the document's `<references>`) |
| `showAs` | Yes | Human-readable display name |

## Why vote lives at changeSet level

In parliamentary procedure, amendments are typically voted on as a whole — all the article changes in an amendment are approved or rejected together. That's why `vote` is a child of `changeSet`, not of individual `articleChange` elements.

This matches real-world practice: a legislator votes for or against "Amendment 2" (the complete package of changes), not for individual article modifications within it.

## Relationship to AKN debate documents

The `source` attribute on `vote` links to a standard AKN `debate` document where the full session transcript lives — speeches, arguments, procedural notes. AKN++ voting data complements but doesn't replace the debate record; it provides the structured, computable summary.

