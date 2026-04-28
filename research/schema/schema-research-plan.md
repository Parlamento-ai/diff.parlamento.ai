# Schema research plan

## What we're trying to learn

Can a single SQL schema, inspired by Akoma Ntoso, represent the **entire parliamentary ritual** of multiple countries — Chile, Spain, EU, Peru, US — without collapsing into per-country branches?

Two metrics, lifted from the 20/02 feasibility framework, drive everything:

1. **Coverage** — what fraction of each country's public legislative data fits cleanly into our shared types?
2. **Completeness** — what fraction of our schema's fields end up populated, per country?

Cells that stay empty across every country signal dead schema. Cells full in one country and empty in four signal a country-specific concept we wrongly generalized. Data we have to dump into `countrySpecific` JSON signals a concept we missed.

The bet is that ~90% of the ritual is genuinely shared and the rest can live in well-defined escape hatches. This experiment tests whether that bet holds.

## Why text files, not a database, are the source of truth

The natural instinct is to load everything into SQLite directly. We're rejecting that.

The work happens in iterations, across multiple contributors, across multiple countries — and the schema itself is what we're stress-testing. Storing data inside a binary `.db` file would mean:

- Merge conflicts on the binary are unresolvable.
- Schema changes orphan data with no way to see the diff.
- A contributor working on Spain can't review what someone did for Chile without booting a tool.
- The "experiment" can't be reproduced — there's no clean line between "the schema" and "the data we shaped to fit the schema."

So: **text files (YAML) are the source of truth. The SQLite database is a build artifact, regenerated from scratch on every run.**

This forces three good things:

1. Every data point is reviewable in a PR like code.
2. A schema change is a code change *plus* a sweep across the YAML files. If the sweep is painful, the schema change is wrong.
3. Anyone can clone the repo and rebuild the full experiment with one command.

## Folder layout

```
research/schema/
  schema-research-plan.md       ← this file
  v1-schema.ts                  ← the draft we already have, frozen
  v2-schema.ts                  ← created when v1 needs a breaking change
  ...
  current.ts                    ← re-exports the latest version. The build
                                  script and the demo app import from here
                                  ONLY. No file ever imports v1/v2 directly.

  data/
    cl/
      bills/
        12345-07.yaml
        12346-08.yaml
      acts/
        ley-21000.yaml
      amendments/
        ...
      journals/
      ...
    es/
      bills/
      ...
    eu/
    pe/
    us/

  research.db                   ← gitignored. Build artifact. Never edited.
```

Rules:

- One YAML file per document. Filename = `nativeId` of the doc.
- Country folders are independent. A Chilean contributor never touches `data/es/`.
- Document links live inside the YAML of the *originating* document, as a list of `{ relation, toCountry, toType, toNativeId }` references — resolved by the build script into real foreign keys.

## Schema versioning

- `v1-schema.ts` is the file we already have. It stays frozen for reference.
- When we hit a change the existing YAML can't accommodate, we copy it to `v2-schema.ts` and edit there.
- `current.ts` re-exports the active version. **Only `current.ts` is imported elsewhere** — by the build script and by the demo app. This makes the version bump a single-line edit.
- Old versions stay in the repo as historical record of how our thinking evolved. The Changelog at the root README references them.

A schema bump is always paired with a data sweep across `data/`. If the build script can't load a YAML against the new schema, the build fails loudly with the file path, and the contributor migrates that file. No silent "best effort" loading.

## The build script

A single command — let's call it `build-research-db` — does the round trip:

1. Delete `research.db` if it exists.
2. Apply the current schema (drizzle migrate).
3. Walk `data/<country>/<type>/*.yaml` in dependency order (countries → documents → links → versions → events → ...).
4. For each file: parse, validate against the type's schema, insert, log.
5. Resolve cross-document links as a second pass (so forward references don't fail).
6. Print a summary: counts per country, per type, plus warnings.

Logging matters. Every loaded record gets a one-line log:

```
[cl/bills] ✓ 12345-07.yaml — "Modifica la ley 21.000..." (4 events, 12 amendments linked)
[es/bills] ✓ 121-000123.yaml — "Proyecto de ley orgánica..." (2 events)
[cl/acts]  ✗ ley-21000.yaml — schema mismatch: field 'effectiveAt' missing
                              expected by v2-schema.ActTable
                              path: data/cl/acts/ley-21000.yaml:7
```

When the build fails, the message must point at the exact file and the exact field. No stack traces, no "validation error at index 47" — that's what makes contributors give up.

## The demo app

A new route at `src/routes/demo/`, modeled after the existing `src/routes/fake/` as a starting point. It reads from `research.db` (or directly from the Drizzle schema bound to it) and renders the parliamentary ritual visually:

- A document detail page (the canonical query: bill + events + versions + amendments + linked act + journal entry).
- A country overview (counts, coverage gaps).
- A cross-country view (the same query shape rendered for every country side by side — the real test of generalization).

The demo is what proves the schema is *useful*, not just structurally valid. If a query that should be one JOIN takes five, the schema is wrong even if every YAML loads.

## Phases

### Phase 1 — Horizontal: one ritual, five countries

Goal: prove the schema can represent the same canonical legislative path across every country in scope.

For each country, pick **one bill that became law**, ideally one that amended an existing act, and model:

- the bill itself,
- the act it amends,
- a couple of trámite events,
- at least one amendment,
- the journal/gazette entry that promulgated it,
- one debate reference,
- one citation (agenda) reference.

Five countries × ~7 documents = ~35 YAML files. Small enough to keep in everyone's head. Big enough to surface real friction.

Phase 1 ends when:

- The build runs clean for all five countries.
- The demo's "document detail" page renders correctly for one bill in each country.
- We have a written list of the **gaps and surprises** per country: fields we couldn't fill, concepts we had to bend, things we shoved into `countrySpecific`.

### Phase 2 — Vertical: depth in each country

Now we go deep. For each country independently:

- Add 10–20 more documents covering edge cases the country actually has (urgencias in Chile, regional gazettes in Spain, EU procedure types, Peruvian decretos de urgencia, US conference reports).
- Track for each addition: did it fit? what broke? what got pushed into `countrySpecific`?

Phase 2 surfaces the long tail. This is where we'll likely cut a v2 schema.

### Phase 3 — The two reports

For each country, produce the feasibility report shape from the 20/02 entry:

- **Coverage** — what % of the public legislative data made it into the schema vs. what we left on the floor.
- **Completeness** — what % of the schema's fields ended up populated.

Plus a cross-country synthesis: which fields are universal, which are country-specific in disguise, which concepts are missing entirely.

That synthesis is the experiment's actual output. The database and the demo are how we get there.

## What we're watching for

From the 28/04 entry, restated:

1. **Underused fields**: columns that are populated in one country and empty in four. Either they belong on a per-type detail table, or they're not as universal as we thought.
2. **Misrepresented data**: information that exists in a country but has nowhere to go in our schema except a `countrySpecific` blob. These are the candidates for new shared columns — once we see the same shape in 2+ countries.

Both signals come for free if we keep the YAML honest. Don't omit a field just because the schema doesn't have a home for it — drop it into `countrySpecific` and let the synthesis surface it later.

## Definition of done

The experiment is done when we can answer, with evidence:

1. Does one schema represent five countries' parliamentary rituals without per-country branching?
2. What's the smallest, sharpest set of escape hatches that makes that work?
3. Where does AKN's model hold, and where does it leak?
