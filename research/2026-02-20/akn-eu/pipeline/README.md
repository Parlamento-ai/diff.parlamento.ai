# EU AKN Pipeline

Automated pipeline that converts EU legislative procedures into AKN 3.0 XML files for the parlamento.ai diff viewer.

## What it does

Given a EU legislative procedure code (e.g. `2020/0361(COD)`), the pipeline:

1. **Discovers** all metadata automatically from EU open data sources
2. **Downloads** the Commission proposal (bill) and final regulation text
3. **Converts** both to AKN 3.0 XML format
4. **Generates a diff** (changeset) between proposal and final text
5. **Extracts EP amendments** from the European Parliament position
6. **Fetches vote counts**, communication events, citations, and gazette data
7. **Produces viewer-ready XMLs** for the parlamento.ai `/pro` viewer

## Usage

```bash
node --experimental-strip-types research/2026-02-20/akn-eu/pipeline/run-pipeline.ts "YYYY/NNNN(COD)"
```

Examples:
```bash
# Digital Services Act
node --experimental-strip-types research/2026-02-20/akn-eu/pipeline/run-pipeline.ts "2020/0361(COD)"

# AI Act
node --experimental-strip-types research/2026-02-20/akn-eu/pipeline/run-pipeline.ts "2021/0106(COD)"
```

## Pipeline steps

| Step | Script | Description |
|------|--------|-------------|
| 1. Download bill | `poc-cellar-to-bill.ts` | Downloads COM proposal XHTML from CELLAR and converts to AKN bill |
| 2. Download formex | `poc-cellar-download-formex.ts` | Downloads final regulation in Formex XML from CELLAR |
| 3. Formex to AKN | `poc-formex-to-akn.ts` | Converts Formex XML to AKN 3.0 format |
| 4. AKN diff | `poc-akn-diff.ts` | Generates article-level changeset between bill and final AKN |
| 5. EP amendments | `poc-eurlex-ep-amendments.ts` | Extracts EP amendment text from the EP position HTML |
| 6. Viewer XMLs | `generate-viewer-xmls.ts` | Produces the 4 viewer-ready AKN files |
| 7. Communication | `poc-epdata-to-communication.ts` | Fetches legislative procedure events timeline |
| 8. Votes | `poc-epdata-to-vote.ts` | Fetches all roll-call vote records for the plenary session |
| 9. Citation | `poc-epdata-to-citation.ts` | Fetches agenda items and debate references |
| 10. Gazette | `poc-formex-toc-to-gazette.ts` | Fetches Official Journal table of contents |

## Auto-discovery

The pipeline auto-discovers all required data from two EU APIs:

### EP Open Data (`data.europarl.europa.eu`)
- Procedure title, events, and key dates
- Vote date and committee report reference (A9-NNNN/YYYY)
- Vote counts per decision (matched by report reference)
- TA (Text Adopted) reference

### CELLAR SPARQL (`publications.europa.eu`)
- Bill CELEX number (e.g. `52020PC0825`)
- Final regulation CELEX (e.g. `32022R2065`)
- EP position CELEX (e.g. `52022AP0014`)

## Output structure

For each regulation, the pipeline creates:

```
research/2026-02-20/akn-eu/<slug>/
  sources/                    # Downloaded raw files (cached)
    <celex>-raw.xhtml         # COM proposal XHTML
    <celex>-bill-akn.xml      # Converted bill AKN
    <celex>-formex.xml        # Final regulation Formex
    <celex>-akn.xml           # Final regulation AKN
    changeset-<slug>.xml      # Article diff
    ep-amendments-<slug>.xml  # EP amendment text
  akn/                        # Viewer-ready files
    01-act-original.xml       # Proposal text (displayed in "Cambios" view)
    02-amendment-1.xml        # EP text amendments (article changes)
    03-amendment-2.xml        # Legislative procedure (vote, dates)
    04-act-result.xml         # Final regulation text (displayed in "Resultado" view)
  viewer-config.json          # Config for boletin-loader.ts
  discovered-config.json      # Full discovery data
  pipeline-report.txt         # Execution report
```

## Viewer integration

The viewer XMLs follow the same AKN structure used by the Chilean/Spanish boletines:

- `01-act-original.xml` — original proposal text
- `02-amendment-1.xml` — EP amendments with article-level diffs
- `03-amendment-2.xml` — legislative procedure metadata + vote counts
- `04-act-result.xml` — final adopted text

These are loaded by `src/lib/server/boletin-loader.ts` and displayed in the `/pro/[boletin]/[version]` viewer.

## Caching

All downloaded files are cached in the `sources/` directory. Re-running the pipeline skips already-downloaded files. Delete a cached file to force re-download.

## Vote matching

Votes are matched from EP Open Data using a 3-strategy approach:

1. **Report reference** (most reliable): extracts the committee report ref (A-9-YYYY-NNNN) from procedure events, matches against decision labels
2. **Title keywords**: matches regulation title words against decision labels
3. **Fallback**: picks the adopted decision with highest favor count

## Cross-checks

After execution, the pipeline validates:
- Bill and final CELEX numbers match discovery
- Article count growth is consistent (bill + new = final)
- Changeset arithmetic is correct
- Vote date matches the auto-discovered meeting
