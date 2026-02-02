# AKN++ Examples: The Paella Valenciana Lifecycle

This walkthrough uses a fictional legislative process — the regulation of the Paella Valenciana recipe — to demonstrate every feature of AKN++. The story follows a traditional recipe through a bill, five amendments, and a final enacted version.

> All example files are in [`research/2026-02-01/aknpp-poc/receta-paella/`](../../research/2026-02-01/aknpp-poc/receta-paella/).

## The cast

| Character | Role |
|---|---|
| Yayo Pepe | Author of the original recipe |
| Dip. Madrileña | Proposes the bill to "democratize" the recipe |
| Dip. Valenciano | Leads the Valencian delegation defending tradition |
| Dip. Albufera | Valencian delegation |
| Dip. Denominación de Origen | Valencian delegation |
| Dip. Catalán | Proposes the seafood compromise |
| Dip. Andaluza | Proposes the onion amendment (withdrawn) |
| Dip. Turismo | Proposes the chorizo amendment |
| Dip. Consumo | Proposes the socarrat amendment |

## Stage 1: The original act

**File**: `01-act-original.xml` — A standard AKN `<act>` with no AKN++ extensions.

The recipe has 11 articles across 4 titles, with strict rules: bomba rice only, no seafood, real saffron only, wood fire only.

```xml
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0">
  <act name="receta-paella-valenciana">
    <!-- Standard AKN: meta + preface + body -->
    <!-- No aknpp namespace needed yet -->
  </act>
</akomaNtoso>
```

Key articles that will be contested:

| Article | Subject | Rule |
|---|---|---|
| art_1 | Rice type | Bomba rice only, no alternatives |
| art_5 | Seafood | Explicitly prohibited |
| art_7 | Saffron | Real La Mancha saffron only |
| art_10 | Heat source | Wood fire only |
| art_11 | Socarrat | Mandatory, newspaper cover for resting |

## Stage 2: The bill — "Democratizing" the recipe

**File**: `02-bill.xml` — An AKN `<bill>` with an AKN++ `changeSet`.

The Diputada Madrileña proposes 5 changes to make the recipe more accessible. The bill is voted on and **approved 5-3** (the entire Valencian delegation votes against).

### The changeSet

```xml
<aknpp:changeSet
  base="/poc/receta/paella-valenciana/esp@2023-03-18"
  result="/poc/receta/paella-valenciana/esp@2024-05-10">
```

This tells us: applying these changes to the 2023-03-18 original produces a new version dated 2024-05-10.

### The changes

| articleChange | type | What changes |
|---|---|---|
| `art_1` | substitute | Allows round rice as alternative to bomba |
| `art_5` | substitute | Removes seafood prohibition, makes it optional |
| `art_5bis` | insert (after art_5) | Creates "paella mixta" category for seafood versions |
| `art_7` | substitute | Allows food coloring as alternative to saffron |
| `art_10` | substitute | Allows gas as alternative to wood fire |

### The vote

```xml
<aknpp:vote date="2024-05-10" result="approved"
            source="/poc/debate/pae-2024-01-pleno">
  <aknpp:for>   <!-- 5 votes --> </aknpp:for>
  <aknpp:against> <!-- 3 votes (Valencian delegation) --> </aknpp:against>
  <aknpp:abstain/>
</aknpp:vote>
```

## Stage 3: Amendment 1 — "The chorizo amendment"

**File**: `03-amendment-1.xml` — **REJECTED** unanimously (0-8).

The Dip. Turismo proposes adding chorizo for international markets. Even the bill's own author votes against. This is the first unanimous vote in the commission's history.

### Key pattern: rejected amendment

```xml
<aknpp:changeSet
  base="/poc/receta/paella-valenciana/esp@2024-05-10"
  result="/poc/receta/paella-valenciana/esp@2024-05-10">
```

Note: `base` and `result` are **identical**. The amendment proposed changes but they were not applied.

```xml
<aknpp:vote date="2024-06-01" result="rejected" ...>
  <aknpp:for/>  <!-- empty: zero votes in favor -->
  <aknpp:against>
    <!-- all 8 members, including the proposer himself -->
  </aknpp:against>
</aknpp:vote>
```

The `articleChange` still records what was proposed (insert art_5ter for chorizo), preserving the full legislative record.

## Stage 4: Amendment 2 — "The Valencian shield"

**File**: `04-amendment-2.xml` — **APPROVED** 6-2.

The Valencian delegation fights back. They accept gas as a heat source but demand reverting two changes from the bill:
- **art_1**: Back to mandatory bomba rice (reverting the bill's change)
- **art_7**: Back to mandatory real saffron (reverting the bill's change)

### Key pattern: reverting previous changes

The `<old>` text matches the bill's `<new>` text, and the `<new>` text matches the original act:

```xml
<aknpp:articleChange article="art_1" type="substitute">
  <aknpp:old>Se utilizarán 400 gramos de arroz bomba o, alternativamente,
  arroz redondo de grano medio. Se recomienda preferentemente el arroz
  bomba cuando esté disponible.</aknpp:old>
  <aknpp:new>Se utilizarán 400 gramos de arroz bomba de denominación de
  origen Valencia. Queda prohibido el uso de cualquier otra variedad
  de arroz.</aknpp:new>
</aknpp:articleChange>
```

The `base`→`result` chain advances:

```xml
<aknpp:changeSet
  base="/poc/receta/paella-valenciana/esp@2024-05-10"
  result="/poc/receta/paella-valenciana/esp@2024-06-15">
```

## Stage 5: Amendment 3 — "The onion amendment"

**File**: `05-amendment-3.xml` — **WITHDRAWN** before the vote.

The Dip. Andaluza proposes allowing onion in the sofrito. Social media backlash and a letter from 200 Valencian chefs force her to withdraw.

### Key pattern: withdrawn amendment

```xml
<aknpp:changeSet
  base="/poc/receta/paella-valenciana/esp@2024-06-15"
  result="/poc/receta/paella-valenciana/esp@2024-06-15">
```

Again `base == result` (no new version produced). But the vote record is different from a rejection:

```xml
<aknpp:vote date="2024-06-20" result="withdrawn" ...>
  <aknpp:for/>
  <aknpp:against/>
  <aknpp:abstain/>
</aknpp:vote>
```

All voter containers are empty — the vote never took place.

## Stage 6: Amendment 4 — "The seafood compromise"

**File**: `06-amendment-4.xml` — **APPROVED** 7-1.

The Dip. Catalán proposes a compromise: instead of allowing seafood in paella, create a separate "arroz de marisco" (seafood rice) category with its own rules.

Changes:
- **art_5**: Restores the seafood prohibition but references art_5bis
- **art_5bis**: Replaces "paella mixta" with a proper "arroz de marisco" definition

```xml
<aknpp:changeSet
  base="/poc/receta/paella-valenciana/esp@2024-06-15"
  result="/poc/receta/paella-valenciana/esp@2024-07-01">
```

## Stage 7: Amendment 5 — "The socarrat express"

**File**: `07-amendment-5.xml` — **REJECTED** 2-6.

The Dip. Consumo proposes making socarrat optional and replacing newspaper with a kitchen towel. The commission rejects it decisively.

```xml
<aknpp:changeSet
  base="/poc/receta/paella-valenciana/esp@2024-07-01"
  result="/poc/receta/paella-valenciana/esp@2024-07-01">

<aknpp:vote date="2024-07-10" result="rejected" ...>
  <aknpp:for>   <!-- 2 votes --> </aknpp:for>
  <aknpp:against> <!-- 6 votes --> </aknpp:against>
</aknpp:vote>
```

## Stage 8: The final act

**File**: `08-act-final.xml` — Standard AKN `<act>`, the enacted result.

The final act reflects only the **approved** amendments (bill + amendments 2 and 4). It has no AKN++ extensions itself — it's the resulting document.

### Net changes from original to final

| Article | Change | Source |
|---|---|---|
| art_1 | **Unchanged** | Bill changed it, Amendment 2 reverted it |
| art_5 | **Modified** | Prohibition remains but now references art_5bis |
| art_5bis | **New** | "Arroz de marisco" as separate category (Amendment 4) |
| art_7 | **Unchanged** | Bill changed it, Amendment 2 reverted it |
| art_10 | **Modified** | Gas now allowed as alternative to wood fire |
| art_2-4, 6, 8-9, 11 | **Unchanged** | Never modified by an approved amendment |

### The version chain

```
esp@2023-03-18  ──bill──→  esp@2024-05-10  ──amd2──→  esp@2024-06-15  ──amd4──→  esp@2024-07-01
                                 │                          │                          │
                           amd1 (rejected)            amd3 (withdrawn)           amd5 (rejected)
                           base==result               base==result               base==result
```

The `lifecycle` element in the final act records all events:

```xml
<lifecycle source="#congreso">
  <eventRef eId="e1" date="2023-03-18" type="generation" source="#autor"/>
  <eventRef eId="e2" date="2024-05-10" type="amendment" source="/poc/bill/pae-2024-01"/>
  <eventRef eId="e3" date="2024-06-01" type="amendment" source="/poc/amendment/pae-2024-01-ind1"/>
  <eventRef eId="e4" date="2024-06-15" type="amendment" source="/poc/amendment/pae-2024-01-ind2"/>
  <eventRef eId="e5" date="2024-06-20" type="amendment" source="/poc/amendment/pae-2024-01-ind3"/>
  <eventRef eId="e6" date="2024-07-01" type="amendment" source="/poc/amendment/pae-2024-01-ind4"/>
  <eventRef eId="e7" date="2024-07-10" type="amendment" source="/poc/amendment/pae-2024-01-ind5"/>
  <eventRef eId="e8" date="2024-09-01" type="generation" source="#congreso"/>
</lifecycle>
```

## Summary of AKN++ patterns demonstrated

| Pattern | Example |
|---|---|
| Approved amendment (`base ≠ result`) | Bill, Amendment 2, Amendment 4 |
| Rejected amendment (`base == result`, `result="rejected"`) | Amendment 1, Amendment 5 |
| Withdrawn amendment (`base == result`, `result="withdrawn"`, empty voters) | Amendment 3 |
| Reverting a previous change | Amendment 2 reverting the bill's changes to art_1 and art_7 |
| Inserting a new article (`type="insert"`, `after` attribute) | Bill inserting art_5bis |
| Substituting an article (`type="substitute"`) | Most changes across all documents |
| Unanimous vote | Amendment 1 (0-8) |
| Version chain reconstruction | Following `base`→`result` across all documents |

