# EU AKN Pipeline

Automated pipeline that converts EU legislative procedures (Ordinary Legislative Procedure / COD) into AKN 3.0 XML files for the parlamento.ai diff viewer.

## What it does

Given a EU procedure code (e.g. `2020/0374(COD)`), the pipeline:

1. **Discovers** all metadata from EP Open Data + CELLAR SPARQL
2. **Downloads** the COM proposal (bill) and final regulation (Formex)
3. **Converts** both to AKN 3.0 XML
4. **Extracts EP amendments** from the European Parliament position HTML
5. **Fetches** votes (with MEP names), communication events, citations, gazette
6. **Produces 3 viewer-ready XMLs** for `/pro`

## Usage

```bash
cd pipeline/eu
node --experimental-strip-types run-pipeline.ts "YYYY/NNNN(COD)"
```

Examples:
```bash
# Digital Markets Act
node --experimental-strip-types run-pipeline.ts "2020/0374(COD)"

# Digital Services Act
node --experimental-strip-types run-pipeline.ts "2020/0361(COD)"

# AI Act
node --experimental-strip-types run-pipeline.ts "2021/0106(COD)"
```

## Pipeline steps (9)

| # | Step | Script | Output |
|---|------|--------|--------|
| 1 | Download bill | `poc-cellar-to-bill.ts` | COM proposal XHTML → AKN `<bill>` |
| 2 | Download formex | `poc-cellar-download-formex.ts` | Final regulation Formex XML |
| 3 | Formex → AKN | `poc-formex-to-akn.ts` | Formex → AKN `<act>` |
| 4 | EP amendments | `poc-eurlex-ep-amendments.ts` | EP position HTML → AKN `<amendment>` with changeSet |
| 5 | Viewer XMLs | `generate-viewer-xmls.ts` | 3 viewer-ready files in `akn/` |
| 6 | Communication | `poc-epdata-to-communication.ts` | Legislative events timeline (`<doc>`) |
| 7 | Votes | `poc-epdata-to-vote.ts` | Roll-call votes with MEP names (`<doc>`) |
| 8 | Citation | `poc-epdata-to-citation.ts` | Plenary agenda items (`<doc>`) |
| 9 | Gazette | `poc-formex-toc-to-gazette.ts` | Official Journal TOC (often unavailable) |

## AKN types generated

**Viewer files (core diff functionality):**

| File | AKN root | changeSet? | Description |
|------|----------|------------|-------------|
| `01-act-original.xml` | `<act>` | No | COM proposal text |
| `02-amendment-1.xml` | `<amendment>` | Yes | EP first reading amendments |
| `03-act-final.xml` | `<act>` | No | Final regulation text |

**Supplementary files (sources/):**

| File | AKN root | Description |
|------|----------|-------------|
| `eu-communication-*.xml` | `<doc>` | Procedure events timeline |
| `eu-votes-*.xml` | `<doc>` | Per-MEP roll-call votes |
| `eu-citation-*.xml` | `<doc>` | Plenary session agenda |

## Auto-discovery

The pipeline auto-discovers everything from two EU APIs:

**EP Open Data** (`data.europarl.europa.eu`):
- Procedure title, events, key dates
- Vote date, committee report reference
- Vote counts per decision (matched by report ref)

**CELLAR SPARQL** (`publications.europa.eu`):
- Bill CELEX (e.g. `52020PC0842`)
- Final CELEX (e.g. `32022R1925`)
- EP position CELEX (e.g. `52021AP0499`)
- COM proposal date (used as fallback when EP API lacks it)

## Output structure

```
pipeline/eu/data/<slug>/
  sources/                        # Downloaded + intermediate files (cached)
    <celex>-raw.xhtml             # COM proposal XHTML from CELLAR
    <celex>-bill-akn.xml          # Bill converted to AKN
    <celex>-formex.xml            # Final regulation Formex from CELLAR
    <celex>-akn.xml               # Final regulation AKN
    ep-amendments-<slug>.xml      # EP amendments AKN
    <celex>-ep-amendments.html    # EP position HTML from CELLAR
    _ep-meta-<slug>.json          # EP amendment metadata
    eu-communication-*.xml        # Legislative events
    eu-votes-*.xml                # Roll-call votes
    eu-citation-*.xml             # Plenary agenda
  akn/                            # Viewer-ready files
    01-act-original.xml           # COM proposal
    02-amendment-1.xml            # EP amendments + changeSet + vote
    03-act-final.xml              # Final regulation
  viewer-config.json              # Config used by generate-viewer-xmls.ts
  discovered-config.json          # Full auto-discovery data
  pipeline-report.txt             # Execution report (pass/fail/warn)
```

## Viewer integration

Add to `src/lib/server/boletin-loader.ts`:

1. Directory constant + entry in `BOLETIN_DIRS`
2. Labels in `slugToLabel()` (COM Proposal, EP First Reading, etc.)
3. Source URLs in `slugToSource()` (EUR-Lex links)
4. Source documents in `getSourceDocuments()` (source files for "Ver fuentes" panel)
5. Slug + flag in `src/routes/pro/+page.server.ts` and `+page.svelte`

## changeSet format

The custom `akndiff:changeSet` extension describes article-level diffs:

```xml
<akndiff:changeSet
  base="http://data.europa.eu/eli/comProposal/2020/842/en"
  result="http://data.europa.eu/eli/reg/2022/1925/oj/en">
  <akndiff:vote date="2022-07-05" result="approved"
    source="https://www.europarl.europa.eu">
    <akndiff:for count="588"/>
    <akndiff:against count="11"/>
    <akndiff:abstain count="31"/>
  </akndiff:vote>
  <akndiff:articleChange article="art_1" type="substitute">
    <akndiff:old>original text...</akndiff:old>
    <akndiff:new>amended text...</akndiff:new>
  </akndiff:articleChange>
  <akndiff:articleChange article="art_7" type="insert" after="art_6">
    <akndiff:new>new article text...</akndiff:new>
  </akndiff:articleChange>
</akndiff:changeSet>
```

- `base`/`result`: Full ELI URIs (not fragment refs)
- `type`: `substitute` | `insert` | `repeal`
- `old`/`new`: Plain text without `<p>` wrappers

## Cross-checks

After execution, the pipeline validates:
- Bill and final CELEX numbers match discovery
- Article count growth is consistent (bill → final)
- Vote date matches the auto-discovered plenary meeting

## Vote matching

Votes are matched from EP Open Data using 3 strategies:

1. **Report reference** (most reliable): committee report ref (A-9-YYYY-NNNN)
2. **Title keywords**: regulation title words against decision labels
3. **Fallback**: adopted decision with highest favor count

## TLS note

The EP Open Data API (`data.europarl.europa.eu`) has a TLS certificate that doesn't cover the bare domain. The pipeline includes a custom `checkServerIdentity` override for this host only.

## Caching

All downloaded files are cached in `sources/`. Re-running skips existing files. Delete a file to force re-download.
