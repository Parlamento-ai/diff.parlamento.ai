# USLM (United States Legislative Markup) Research

## 1. USLM Schema and Specification

### Overview
- **USLM** is an XML information model designed to represent legislation of the United States Congress
- Maintained by the **Government Publishing Office (GPO)** in support of the **Legislative Branch XML Working Group**
- Official repo: https://github.com/usgpo/uslm
- Schema namespace: `http://schemas.gpo.gov/xml/uslm` (v2), `http://xml.house.gov/schemas/uslm/1.0` (v1)

### Schema Versions
- Current approved: **2.0.14, 2.0.15, 2.0.16, 2.0.17** and **2.1.0**
- Proposed (draft): **2.1.1** (adds committee/conference reports)
- Versioning: `major.minor.point` — point = non-breaking, minor = breaking
- Schema files: `USLM.xsd`, `uslm-components-2.1.0.xsd`, plus table modules, MathML 3, Dublin Core, XHTML 1.0

### Design Principles
- Data modeling priority: text appears in order it is published
- Attributes reserved for metadata (never appear in rendered output)
- Minimal generated content (avoids auto-generating text)
- Two-tier: **Abstract model** (generic, any legislation) + **Concrete model** (US Code specific)
- Supports inheritance via XML Schema derivation and `@role` attribute polymorphism

### External Standards Incorporated
- **XHTML** for tables and generic text markup
- **Dublin Core** for metadata
- **MathML** (optional) for equations
- **SVG** (optional) for vector graphics

---

## 2. USLM Document Structure

### Root Elements
- **`<bill>`** — For bills and resolutions (enrolled, introduced, etc.)
- **`<lawDoc>`** — For legislative documents (U.S. Code titles, public laws)
- **`<document>`** — For loosely-structured non-legislative documents

### Six-Part Document Model
1. Root document element
2. Metadata block (`<meta>`)
3. Main body (`<main>`) — TOC, statements, preamble/enacting clause, hierarchical levels
4. References structure
5. Amendments structure
6. Appendices

### Enrolled Bill Structure (from H.R. 1, 119th Congress)
```xml
<bill xmlns="http://schemas.gpo.gov/xml/uslm"
      xmlns:dc="http://purl.org/dc/elements/1.1/"
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <meta>
    <!-- Dublin Core metadata, congress, session, docStage -->
  </meta>
  <preface>
    <!-- Congress session info, bill number, enrolled dateline -->
  </preface>
  <main>
    <longTitle>
      <docTitle>An Act</docTitle>
      <officialTitle>To authorize...</officialTitle>
    </longTitle>
    <enactingFormula>Be it enacted...</enactingFormula>
    <title identifier="/us/bill/119/hr/1/tI">
      <num value="I">TITLE I</num>
      <heading>Agriculture</heading>
      <subtitle identifier="/us/bill/119/hr/1/tI/stA">
        <num value="A">Subtitle A</num>
        <heading>...</heading>
        <section identifier="/us/bill/119/hr/1/tI/stA/s10101">
          <num value="10101">SEC. 10101.</num>
          <heading>Short Title</heading>
          <subsection>
            <num>(a)</num>
            <heading>...</heading>
            <content>
              <p>Text here...</p>
            </content>
          </subsection>
        </section>
      </subtitle>
    </title>
  </main>
</bill>
```

### Hierarchical Levels (US Code terminology)
```
Title > Subtitle > Part > Subpart > Chapter > Subchapter >
Section > Subsection > Paragraph > Subparagraph > Clause > Subclause
```

### Key Attributes
- `id` — GUID-based unique identifier (prefixed with "id")
- `identifier` — Full path reference (e.g., `/us/bill/119/hr/1/tI/stA/s10101`)
- `style` — Formatting classes
- `value` — Numeric designation
- `@role` — Semantic subclass (e.g., `<level role="section">`)

### Content Elements
| Element | Purpose |
|---------|---------|
| `<num>` | Numbering/designation |
| `<heading>` | Section/level headings |
| `<p>` | Paragraphs (from XHTML) |
| `<content>` | Mixed content container |
| `<table>` | Tables (XHTML-based) |
| `<toc>` | Table of contents |
| `<note>` | Annotations |
| `<ref>` | Cross-references to USC codes |
| `<chapeau>` | Introductory language before lists |

### Bill-Specific Elements (vs. Code documents)
- `<preface>` — Bill ID, congress, session, enrolled dateline
- `<attestation>` — Signature verification
- `<signatures>` — Document signatures
- `<notes>`, `<backmatter>`, `<endMarker>`
- `<longTitle>` with `<docTitle>` and `<officialTitle>`
- `<enactingFormula>`

### Metadata (`<meta>`) Properties
```
docStage, docPart, publicPrivate, congress, session, citableAs,
enrolledDateline, starPrint, processedBy, organization, volume,
issue, startingPage, endingPage, startingProvision, endingProvision,
provisionRange, affected, subject, coverTitle, coverText,
currentThroughPublicLaw, containsShortTitle, createdDate,
currentChamber, distributionCode, relatedDocument, relatedDocuments
```

---

## 3. Change Tracking and Diff in USLM

### How Amendments Work in US Law
- **Amendments are NOT versions** — they are prose instructions like "strike", "insert", "remove", "repeal"
- Each amendment is a single sentence with textual language that must be interpreted
- A single Act can change "a whole bunch of repositories in an unlimited way"
- Standard software diffs don't work — matching requires "semantic judgement"

### USLM Amendment Elements
- **`<amendingAction>`** — Atomic-level amendment instruction (renamed from `<action>` in USLM 2.0)
  - Types: `amend`, `delete`, `insert`, `add`, `redesignate`, `conform`, `unknown`
- **`<quotedContent>`** — Structured text from/for another document (used in amendments)
- **`<action>`** — Document-level legislative actions (separate from amending actions)
- **`<actionDescription>`** — Describes the action taken
- **`<actionInstruction>`** — Instructions related to the action

### Amendment XML Example (from enrolled bills)
```xml
<subsection>
  <num>(a)</num>
  <heading>Modification</heading>
  <content>
    <amendingAction type="amend">
      Section 2(a) of the Act is amended by inserting
      <quotedContent>"or water"</quotedContent>
      after <quotedContent>"fire retardant"</quotedContent>.
    </amendingAction>
  </content>
</subsection>
```

### Versioning Model
- Versions can be handled hierarchically from document root down to individual provisions
- Best practice: version at the lowest possible level of the hierarchy
- `@id` values use GUIDs for document management in the amending cycle
- `@temporalId` — Lowercase with underscore separators for temporal tracking

### Comparative Print Suite (House of Representatives)
- **Released Housewide**: October 2022
- Built by **Xcential Legislative Technologies** (contract awarded August 2018)
- Uses USLM + NLP for machine-readable amendments and citations
- **Basic Edition** (all House staff): Bill-to-Bill Differences, Bill Viewer
- **Advanced Edition**: "How an Amendment Changes a Bill", "How a Bill Changes Current Law"
- Supports three comparison types:
  1. Two versions of a bill/resolution/amendment (document-to-document)
  2. Current law vs. proposed changes in a bill (codified and non-codified)
  3. A bill vs. the bill as modified by amendments
- **Not publicly available** — internal House tool only

### Xcential's Three Solutions for Version Control
1. **Machine-readable amendments** — NLP parses hundreds of thousands of amendatory phrases
2. **Machine-readable legal citations** — Query language for precise addresses in law
3. **Legally-relevant diff** — Combines the above to create machine-executable instructions

---

## 4. Relationship Between USLM and Akoma Ntoso (AKN)

### Official Position
> "USLM is not defined to be either a derivative or subset of Akoma Ntoso."
> — USLM User Guide

However, in practice:
- USLM is described as a "2nd generation XML schema" and a "derivative of the international LegalDocML (Akoma Ntoso) standard"
- Many element and attribute names **intentionally match** AKN equivalents
- "It should be possible to produce an Akoma Ntoso XML rendition of a USLM document through a simple transformation"

### Key Differences

| Aspect | USLM | Akoma Ntoso |
|--------|------|-------------|
| **Scope** | US Congress legislation only | International, any jurisdiction |
| **Hierarchy** | Open hierarchy | Fixed hierarchy by document type |
| **Versioning** | Version number after `@` | Version date after `@` |
| **References** | Open hierarchy URLs | Fixed hierarchy with `~` for portions |
| **Namespace** | `http://schemas.gpo.gov/xml/uslm` | `http://docs.oasis-open.org/legaldocml/ns/akn/3.0` |
| **Root elements** | `<bill>`, `<lawDoc>` | `<act>`, `<bill>`, `<amendment>` |
| **Amendment model** | `<amendingAction>` with types | Separate `<amendment>` documents |
| **Metadata** | Dublin Core in `<meta>` | FRBR-based in `<meta>` |
| **Body** | `<main>` | `<body>` |
| **Preface** | `<preface>` | `<preface>` (same) |
| **Organization** | USGPO + House XML WG | OASIS LegalDocML TC |

### Historical Context
- Library of Congress created the "Markup of US Legislation in Akoma Ntoso" challenge (July 2013)
- "Legislative XML Data Mapping" challenge (September 2013) — data map from US bill XML to AKN
- OASIS LegalDocML TC maintains the international standard

### Interoperability Assessment
- **USLM -> AKN**: Feasible via XSLT transformation (element names align)
- **AKN -> USLM**: More complex (USLM has US-specific extensions)
- Both share: `<preface>`, `<num>`, `<heading>`, `<p>`, `<ref>` concepts
- Key mapping: USLM `<main>` = AKN `<body>`, USLM `<content>` ~ AKN `<content>`

---

## 5. GovInfo Bulk Data in USLM Format

### Available Data
| Collection | Coverage | Format |
|-----------|----------|--------|
| Enrolled bills | 113th Congress (2013) forward | Beta USLM XML |
| Public laws | 113th Congress (2013) forward | Beta USLM XML |
| Private laws | 113th Congress forward | Beta USLM XML |
| Statutes at Large | 108th Congress (2003) forward | Beta USLM XML |
| Statute Compilations | Available | USLM XML |
| Slip Laws | September 2025 forward | Beta USLM XML |

### IMPORTANT: USLM is only for enrolled bills (ENR)
- Non-enrolled versions (IH, IS, RH, RS, EH, ES, etc.) use the **older Bill DTD XML** format
- Only the final enrolled version gets USLM XML treatment
- Earlier bill versions are in a different, older XML format from xml.house.gov

### Bulk Data URLs
- Bills in USLM: `https://www.govinfo.gov/bulkdata/BILLS/uslm`
- 119th Congress Senate enrolled: `https://www.govinfo.gov/bulkdata/BILLS/uslm/119/1/s/`
- 119th Congress House enrolled: `https://www.govinfo.gov/bulkdata/BILLS/uslm/119/1/hr/`
- All bills (including non-USLM): `https://www.govinfo.gov/bulkdata/BILLS`

### File Naming Convention
```
BILLS-{congress}{type}{number}{version}.xml
Examples:
  BILLS-119s160enr.xml    (S. 160, 119th Congress, Enrolled)
  BILLS-119hr1enr.xml     (H.R. 1, 119th Congress, Enrolled)
  BILLS-119s3761is.xml    (S. 3761, 119th Congress, Introduced in Senate)
```

### API Access
- **GovInfo API**: `https://api.govinfo.gov/` (requires API key)
- **GovInfo MCP Server** (public preview, early 2026): `https://api.govinfo.gov/mcp`
  - Enables LLM integration with GovInfo content
  - Initial release: basic search and retrieval
- **Congress.gov API**: Additional access to bill data

### 119th Congress Enrolled Bills in USLM (as of Feb 2026)
18 Senate enrolled bills available, including:
- S. 5 (21.7 KB)
- S. 146 (54.2 KB)
- S. 1071 (11.5 MB — largest)
- S. 1582 (335.7 KB)

---

## 6. Tools That Work with USLM

### Official / Government
| Tool | Provider | Purpose |
|------|----------|---------|
| **Comparative Print Suite** | House Clerk + Xcential | Bill-to-bill diffs, bill-to-law comparisons (internal House tool) |
| **GovInfo API** | GPO | Programmatic access to USLM documents |
| **GovInfo MCP Server** | GPO | LLM integration for USLM content |
| **USLM GitHub repo** | GPO | Schema, samples, documentation |

### Commercial
| Tool | Provider | Purpose |
|------|----------|---------|
| **LegisPro** | Xcential | Legislative drafting + amending in USLM/AKN |
| **LegisWeb** | Xcential | Municipal law drafting |

### Open Source / Community
| Tool | Provider | Purpose |
|------|----------|---------|
| **unitedstates/congress** | Community (GovTrack.us + Sunlight Foundation) | Bill data scraping, including bill text downloads |
| **usgpo/bill-status** | GPO | Bill status XML bulk data |

### Parsing USLM
- No dedicated USLM parser library exists (as of Feb 2026)
- Standard XML parsers work (lxml, fast-xml-parser, etc.)
- Schema validation with `USLM.xsd`
- CSS file (`uslm-2.33.css`) provided for rendering

---

## 7. Bill Versions

### Version Abbreviations (Common)

**House versions:**
| Code | Full Name | Stage |
|------|-----------|-------|
| IH | Introduced in House | Introduction |
| RFH | Referred in House | Committee referral |
| RH | Reported in House | Committee report |
| EH | Engrossed in House | Passed House |
| EAH | Engrossed Amendment House | House amendment to Senate bill |

**Senate versions:**
| Code | Full Name | Stage |
|------|-----------|-------|
| IS | Introduced in Senate | Introduction |
| RFS | Referred in Senate | Committee referral |
| PCS | Placed on Calendar Senate | Calendar placement |
| RS | Reported to Senate | Committee report |
| ES | Engrossed in Senate | Passed Senate |
| EAS | Engrossed Amendment Senate | Senate amendment to House bill |
| RDS | Received in Senate | From House |
| CPS | Considered and Passed Senate | Floor passage |

**Final versions:**
| Code | Full Name | Stage |
|------|-----------|-------|
| ENR | Enrolled | Passed both chambers, certified |

### XML Format by Version
- **ENR (Enrolled)**: Available in USLM XML (113th Congress forward)
- **All other versions (IH, IS, RH, RS, EH, ES, etc.)**: Available in **Bill DTD XML** (older format, since ~111th Congress)
- **Pre-111th Congress**: HTML/text only (no XML)
- Version codes "do not reliably have an order" — use issued dates for sequencing

### Introduced Bill Structure (Bill DTD XML, NOT USLM)
```xml
<bill bill-stage="Introduced-in-Senate" bill-type="olc" ...>
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>119 S3761 IS: Student Loan Bond Expansion Act of 2026</dc:title>
    <dc:publisher>U.S. Senate</dc:publisher>
    <dc:date>2026-02-03</dc:date>
  </metadata>
  <form>
    <congress>119th CONGRESS</congress>
    <session>2d Session</session>
    <legis-num>S. 3761</legis-num>
    <current-chamber>IN THE SENATE OF THE UNITED STATES</current-chamber>
    <action>
      <action-date date="20260203">February 3, 2026</action-date>
      <action-desc>Mr. Grassley introduced...</action-desc>
    </action>
    <legis-type>A BILL</legis-type>
    <official-title>To amend the Internal Revenue Code...</official-title>
  </form>
  <legis-body>
    <section id="..." section-type="section-one">
      <enum>1.</enum>
      <header>Short title</header>
      <text>This Act may be cited as...</text>
    </section>
    <section id="...">
      <enum>2.</enum>
      <header>Exemption from volume cap</header>
      <subsection id="...">
        <enum>(a)</enum>
        <header>...</header>
        <text>...</text>
      </subsection>
    </section>
  </legis-body>
</bill>
```

**Key difference from USLM**: Uses `<legis-body>` instead of `<main>`, `<header>` instead of `<heading>`, `<enum>` instead of `<num>`, `<text>` instead of `<content>`

---

## 8. The unitedstates/congress GitHub Project

### Overview
- **Repo**: https://github.com/unitedstates/congress
- **Language**: Python 3
- **License**: CC0-1.0 (public domain)
- **Stats**: 1,000+ stars, 216 forks, 36 contributors, 783 commits
- **Maintained by**: GovTrack.us + community contributors
- **Origin**: Originally developed by GovTrack.us + Sunlight Foundation (2013)

### Data Collectors (Scrapers)
1. **Bill Status Data**: Downloads official bulk bill status from Congress.gov, converts to JSON
2. **Vote Scrapers**: House and Senate roll call votes
3. **GovInfo Document Fetcher**: Bill text, bill status, official documents (only newly updated)
4. **Nominations Scraper**: Presidential nomination data (currently inactive)

### Usage
```bash
# Install
pip install .

# Run scrapers
usc-run bills           # Download bill status data
usc-run votes           # Download vote data
usc-run govinfo --collections=BILLS --congress=119 --store=pdf,mods,xml,text
```

### Output Structure
```
data/
  [congress]/
    bills/
      [type]/
        [type][number]/
          data.json          # Bill metadata
          data.xml           # Bill metadata (XML)
          text-versions/
            [status_code]/   # ih, is, rh, rs, eh, enr, etc.
              document.txt   # UTF-8 plain text
              document.xml   # XML version (Bill DTD or USLM)
              mods.xml       # MODS metadata
              data.json      # Version metadata with URLs
```

### Bill Data JSON Schema (key fields)
```json
{
  "bill_id": "hr1-119",
  "bill_type": "hr",
  "number": 1,
  "congress": 119,
  "introduced_at": "2025-01-03",
  "official_title": "...",
  "short_title": "...",
  "status": "ENACTED:SIGNED",
  "sponsor": { "bioguide_id": "...", "name": "..." },
  "cosponsors": [...],
  "committees": [...],
  "actions": [...],
  "amendments": [...],
  "history": {
    "active": true,
    "house_passage_result": "pass",
    "senate_passage_result": "pass",
    "enacted": true
  },
  "enacted_as": { "law_type": "public", "number": 1 }
}
```

### Status Codes
`INTRODUCED`, `REFERRED`, `REPORTED`, `PASS_OVER:HOUSE`, `PASS_OVER:SENATE`,
`PASSED:BILL`, `PASSED:SIMPLERES`, `ENACTED:SIGNED`, `ENACTED:VETO_OVERRIDE`,
`VETOED:POCKET`, `VETOED:OVERRIDE_FAIL_ORIGINATING`, etc.

### @unitedstates Organization (Other Repos)
| Repo | Purpose |
|------|---------|
| **congress-legislators** | Members of Congress 1789-Present (YAML/JSON/CSV), committees, presidents |
| **images** | Public domain photos of Congress members |
| **districts** | GeoJSON/shapefiles for federal legislative districts |
| **contact-congress** | Reverse-engineered contact forms for Congress members |
| **BillMap** | Utilities for the FlatGov project by Demand Progress |

---

## Key Takeaways for AKN Diff Project

### Opportunities
1. **USLM enrolled bills** provide machine-readable XML for all bills signed into law since 2013
2. **Amendment instructions** in USLM (`<amendingAction>`) are semantically rich — type attributes specify strike/insert/add/redesignate
3. **GovInfo bulk data + API** provide programmatic access to all USLM documents
4. **unitedstates/congress** provides a ready-made scraper for bill data including all text versions

### Challenges
1. **Only enrolled bills in USLM** — introduced/reported/engrossed versions use older Bill DTD format
2. **Two different XML schemas** — Bill DTD (pre-enrollment) vs USLM (enrolled) require separate parsers
3. **No native diff/changeset in USLM** — amendments are text instructions, not structured changesets
4. **Comparative Print Suite is not public** — the best diff tool is locked to House staff

### Comparison with AKN Diff Approach
| Feature | AKN Diff (our project) | USLM |
|---------|----------------------|------|
| Change tracking | `<changeSet>` with explicit ins/del | `<amendingAction>` with type attributes |
| Version model | Sequential numbered XMLs (01, 02, ...) | Single enrolled version per bill |
| Diff approach | Structured XML changesets | Prose-based amendment instructions |
| Multi-version | All tramitación versions captured | Only enrolled (final) in USLM |
| Scope | Chile, EU | US Congress |
| Format | Custom AKN extension | Separate standard (USLM) |

### Potential Integration Points
1. Could parse `<amendingAction>` to generate AKN Diff-style changesets
2. Could diff Bill DTD XML (introduced) vs USLM XML (enrolled) with schema mapping
3. unitedstates/congress scraper could feed an AKN Diff pipeline for US bills
4. GovInfo MCP server (2026) could provide LLM-assisted parsing
