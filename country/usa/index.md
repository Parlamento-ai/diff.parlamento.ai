# US Legislative Comparative Documents: A Technical Deep Dive

**The United States maintains a sophisticated but fragmented system for tracking legislative changes**, centered on two chamber rules dating to 1929 (Ramseyer) and the 1940s (Cordon) that require showing how bills modify existing law. The House has modernized this with an internal XML-powered Comparative Print Suite launched in 2022, while public developers must work with the Congress.gov API (5,000 requests/hour), GovInfo bulk data, and a transitional XML landscape where the legacy Bill DTD coexists with the emerging USLM standard.

---

## Terminology and formal definitions

The official term in both chambers is **"comparative print"**—a document showing proposed changes to existing law using typographical conventions. The informal shorthand **"Ramseyer"** (House) and **"Cordon"** (Senate) derives from the rules' sponsors: Representative Christian W. Ramseyer (R-IA), who established House Rule XIII, clause 3(e) on January 28, 1929, and Senator Guy Cordon (R-OR), whose equivalent Senate Rule XXVI, paragraph 12 followed in the 1940s.

The terms "redlines" and "tracked changes" are **not official Congressional terminology**—these are borrowed from legal practice and word processing software. GPO, CRS, and the Offices of Legislative Counsel all use "comparative print" formally, though staff commonly say "the Ramseyer" when referring to the changes-in-existing-law section of committee reports.

**The House Rule XIII, clause 3(e) text specifies**: "Whenever a committee reports a bill or a joint resolution repealing or amending any statute or part thereof it shall include in its report or in an accompanying document: (1) The text of the statute or part thereof which is proposed to be repealed; and (2) A comparative print of that part of the bill or joint resolution making the amendment and of the statute or part thereof proposed to be amended, showing by **stricken-through type and italics, parallel columns, or other appropriate typographical devices** the omissions and insertions proposed to be made."

### Who produces these documents

| Entity | Role |
|--------|------|
| **Office of Legislative Counsel (House)** | Primary drafter of Ramseyer submissions for committee reports |
| **Office of Legislative Counsel (Senate)** | Equivalent role for Cordon submissions |
| **Committee Staff** | Coordinate with Legislative Counsel, may draft initial versions |
| **Office of the Clerk (House)** | Operates the Comparative Print Suite (compare.house.gov) |
| **Government Publishing Office (GPO)** | Publishes final committee reports containing comparative prints |
| **Congressional Research Service** | Does NOT produce official comparative prints—provides educational analyses |

---

## The legislative process and where comparisons appear

A bill follows this path: **Introduction → Referral → Committee Consideration → Markup → Committee Report → Floor Consideration → Passage → Other Chamber → Conference → Enrollment → Presidential Action**. Each stage produces distinct document versions identified by standardized codes.

### Bill version codes at each stage

| Stage | House Code | Senate Code | Description |
|-------|-----------|-------------|-------------|
| Introduction | IH | IS | Bill as first introduced |
| Reported from Committee | RH | RS | With committee recommendations |
| Engrossed | EH | ES | Passed one chamber, certified |
| Received in Other Chamber | RHS | RDS | Bill received |
| Enrolled | ENR | ENR | Final identical text from both chambers |

### Where comparative documents are produced

**At committee report stage (mandatory)**: When a House or Senate committee reports legislation that amends existing law, the Ramseyer/Cordon rules require the committee report include a comparative print. This is enforceable via **point of order** in the House—if raised before the Committee of the Whole begins, the bill is recommitted. The Senate's Cordon Rule lacks this floor enforcement mechanism, operating primarily at the committee level.

**Amendment in the nature of a substitute**: When a committee rewrites an entire bill, the 1961 amendment to the Ramseyer Rule requires showing how the **substitute** (not the original bill) changes existing law. Manager's amendments—packaged changes offered by the bill's floor manager—have no special comparative print requirement beyond normal amendment documentation.

**Conference process**: Joint Explanatory Statements (Statements of Managers) must show: (1) the House position, (2) the Senate position, and (3) the conference resolution for each provision in disagreement. This is required by House Rule XXII, clause 7(e) and Senate Rule XXVIII, paragraph 6.

### Mandatory versus discretionary

- **Mandatory**: Ramseyer/Cordon comparative prints in committee reports (point of order enforceable in House)
- **Mandatory**: Joint explanatory statements accompanying conference reports
- **Discretionary**: Electronic comparative prints via the Comparative Print Suite (House removed Rule XXI clause 12 in the 117th Congress, though production continues voluntarily)
- **Waivable**: Special rules from the Rules Committee frequently waive comparative print requirements

---

## Document format and typographical conventions

### Physical formats available on GovInfo

Committee reports are published in **PDF** (primary, digitally signed), **HTML**, **ASCII text**, and **XML** (limited for committee reports; fuller coverage for bill text). PDFs are **text-selectable** and authenticated using GPO's digital signature system with Adobe CDS certificates. Documents are **not** specifically PDF/A format but include Long-Term Validation (LTV) for signature persistence.

### Typographical conventions

The standard convention appears at the start of every "Changes in Existing Law" section:

> "In compliance with clause 3(e) of rule XIII of the Rules of the House of Representatives, changes in existing law made by the bill, as reported, are shown as follows:
> - **Existing law proposed to be omitted** is enclosed in black brackets [ø...¿]
> - **New matter** is printed in *italics*
> - **Existing law in which no change is proposed** is shown in roman"

**No colors are used**—the conventions rely entirely on typography (roman, italic, brackets) for black-and-white printing compatibility. The **ø** and **¿** characters serve as visible bracket markers for deleted text.

### Concrete examples with URLs

**H. Rept. 119-341** (119th Congress, 2025) - H.R. 5242, Repealing Second Chance Amendment Act
- PDF: https://www.govinfo.gov/content/pkg/CRPT-119hrpt341/pdf/CRPT-119hrpt341.pdf
- Contains 21 pages of "Changes in Existing Law" demonstrating the bracket/italic conventions

**URL pattern for committee reports**:
```
https://www.govinfo.gov/content/pkg/CRPT-{Congress}{hrpt/srpt}{Number}/pdf/CRPT-{Congress}{hrpt/srpt}{Number}.pdf
```

### Embedded metadata

Documents include **MODS** (Metadata Object Description Schema) and **PREMIS** preservation metadata accessible at:
- MODS: `https://www.govinfo.gov/metadata/pkg/{PackageID}/mods.xml`
- PREMIS: via API

Metadata fields include: Congress number/session, chamber, report type, committee name, associated bill numbers, US Code citations, and document classification numbers.

---

## The Comparative Print Suite: House internal system

The **Comparative Print Suite** is a web-based application at **compare.house.gov** that enables House staff to generate tracked-changes-style legislative comparisons. **This system is accessible only to House staff behind the House firewall**—it is not publicly available.

### Timeline and development

| Date | Milestone |
|------|-----------|
| 2009 | Rep. Bill Posey introduces resolution for public comparative prints |
| 2017 | 115th Congress establishes Comparative Print Project via House Rules |
| August 2018 | Contract awarded to **Xcential Legislative Technologies** |
| October 2020 | Beta testing begins with 13 members, 15 Legislative Counsel staff |
| April 2021 | Expanded to 100+ committee staff |
| **October 2022** | **Full Housewide launch** |
| February 2024 | "How an Amendment Changes a Bill" feature added |

### Three types of comparison supported

1. **Bill to Bill Differences** - Compare two versions of a bill, resolution, or amendment
2. **How a Bill Changes Current Law** - Current law vs. law as proposed to be amended
3. **How an Amendment Changes a Bill** - Bill text vs. bill modified by proposed amendments

### Technical architecture

The system is **XML-based using USLM** (United States Legislative Markup), with natural language processing and machine learning to parse amendatory language. Xcential developed **AMPL** (Amendment Modeling and Processing Language) to interpret hundreds of thousands of amendatory phrases. The system accepts PDF or XML input and outputs interactive web views or downloadable PDFs.

**Listed in House AI Use Case Inventory** (USHouse-Clerk-1): Uses NLP and ML on agency-generated training data. Development began April 2017; implemented June 2020.

### Access restrictions and expansion

- **Basic Edition**: Available to all House staff (Bill to Bill Differences)
- **Advanced Edition**: Requires Congressional Staff Academy training (law comparison features)
- **External users** (via vendor cloud): CBO (~35 users), Library of Congress (~94 users), Joint Committee on Taxation (~3 users)
- **Senate pilot**: Technical requirements completed; ~150 participants in pilot as of 2024-2025

### Public availability status

**NOT PUBLIC and no announced timeline**. Per Congressional Data Task Force meeting recaps: "Clerk was unable to definitively answer about making the API or data or methods behind the comparative print project publicly available" (December 2022). POPVOX Foundation has GIFs/screenshots at https://www.popvox.org/legitech/comparative-print-suite.

---

## Portals and publication systems

### Portal inventory

| Portal | What It Offers | Comparison Features |
|--------|---------------|---------------------|
| **Congress.gov** | Bill versions (IH, RH, ES, ENR, etc.), summaries, actions, votes | None built-in |
| **GovInfo.gov** | 39+ collections: bills, reports, CFR, Congressional Record | None built-in |
| **docs.house.gov** | Real-time floor/committee documents, weekly XML feeds | Hosts comparative print PDFs |
| **xml.house.gov** | Bill DTDs, USLM schemas, documentation | Schema repository only |
| **compare.house.gov** | Full comparison suite | Yes (House staff only) |
| **Senate.gov** | Member data XML, document ordering | No comparison tools |

### Congress.gov API (v3)

**Base URL**: https://api.congress.gov/v3/

| Parameter | Value |
|-----------|-------|
| **Authentication** | API key required (free signup at api.congress.gov/sign-up/) |
| **Rate limit** | **5,000 requests/hour** |
| **Results per request** | 20 default, 250 maximum |
| **Response formats** | JSON (default), XML |

**Key endpoints**:
- `/bill/{congress}/{type}/{number}` - Bill details
- `/bill/{congress}/{type}/{number}/text` - All text versions
- `/bill/{congress}/{type}/{number}/amendments` - Related amendments
- `/amendment`, `/member`, `/committee`, `/committee-report`, `/crs-report`

**Coverage**: Bills from 1973-present; comprehensive XML text from 113th Congress (2013).

### GovInfo API

**Base URL**: https://api.govinfo.gov/

**Key endpoints**:
- `/collections` - List all 39+ document collections
- `/collections/{code}/{startDate}` - Packages modified since date
- `/packages/{packageId}/pdf`, `/xml`, `/mods` - Document retrieval
- `/related/{accessId}` - Find related documents (laws, reports, etc.)

**MCP Server**: GPO recently released a Model Context Protocol server for LLM integration (public preview).

### Bulk data availability

**GovInfo Bulk Data** (https://www.govinfo.gov/bulkdata):
- **BILLS**: Congressional bill text XML, 113th Congress (2013)+
- **BILLSTATUS**: Bill status/metadata XML, 108th Congress (2003)+, **updated every 4 hours**
- **BILLSUM**: Bill summaries, 113th Congress+

**Access methods**: Direct HTTP download, XML/JSON index files, sitemaps, RSS feeds for batch completion.

---

## Technical standards: USLM, Akoma Ntoso, and GPO schemas

### USLM (United States Legislative Markup)

**USLM is a "Second Generation" XML schema** capturing presentation, structure, AND semantics—unlike the first-generation Bill DTD which captures presentation only. Developed by the Office of Law Revision Counsel with GPO, Clerk of the House, and Secretary of the Senate under the Legislative Branch XML Working Group.

**Current versions**: USLM 2.1.0 in main branch; USLM 2.1.1 in proposed branch (for committee/conference reports).

**Relationship to Akoma Ntoso**: USLM is **a derivative/extension** of the international LegalDocML (Akoma Ntoso) standard, sharing many element/attribute names while adding US-specific constructs. Per GovInfo: "USLM is a 2nd generation XML schema and is a derivative of the international LegalDocML (Akoma Ntoso) standard."

### What's actually in production today

| Format | Status | Coverage |
|--------|--------|----------|
| **Bill DTD** | PRODUCTION | Bills/resolutions/amendments, 111th Congress+ |
| **USLM** | PRODUCTION for US Code | All titles since 2013 |
| **USLM** | BETA for enrolled bills/laws | 113th Congress (2013)+ |
| **Bill Status XML** | PRODUCTION | 108th Congress (2003)+ |

**Key distinction**: Enrolled bills currently have **BOTH** Bill DTD XML and Beta USLM XML available—this is the transitional state.

**Official resources**:
- USLM Schema: https://github.com/usgpo/uslm
- Bill DTD: https://github.com/usgpo/bill-dtd
- Bill Status: https://github.com/usgpo/bill-status
- House XML documentation: https://xml.house.gov

### Developer recommendation

**Use Bill DTD XML for current legislative processing**—it's the production format for bills during the legislative process. Use USLM for US Code parsing. Monitor USLM 2.x development for future-proofing.

---

## Reality versus aspiration: what actually works

### ✅ What actually works today

| Capability | Source | Access |
|------------|--------|--------|
| Federal bill text in XML | GovInfo bulk data | Free, no auth |
| Bill status/tracking | Congress.gov API | Free API key, 5,000/hr |
| All bill versions (IH, RH, ES, ENR) | GovInfo | Free download |
| State legislative data | Open States API | Free API key |
| Federal + all states | LegiScan | Free tier (30K queries/mo) |
| Legislator data 1789-present | unitedstates/congress-legislators | Public domain |

### 🔄 What's in transition

| System | Status | Evidence |
|--------|--------|----------|
| USLM for enrolled bills | Beta, available since 2013 | Dual format with Bill DTD |
| USLM for CFR/FR | Pilot (titles 5, 12, 27, 40 from 2016) | Listed on GovInfo |
| Senate Comparative Print Suite access | Pilot with ~150 users | CDTF meeting notes 2024-2025 |

### ⚠️ Announced but not public

| Initiative | Status | Notes |
|------------|--------|-------|
| Public Comparative Print Suite | Not implemented | Original intent from 2009 Posey resolution; no announced timeline |
| Underlying comparison API/data | Not available | Clerk unable to commit (December 2022 CDTF) |

### ❌ Deprecated or abandoned

- **House Rule XXI clause 12** (electronic comparative prints before floor): Removed in 117th Congress (2021)
- **ProPublica Congress API**: Discontinued ~2024
- **GovTrack API/bulk data**: Terminated 2017
- **Sunlight Foundation APIs**: Defunct 2016
- **THOMAS.loc.gov**: Shut down July 2016

---

## Programmatic access for developers

### Free official sources

1. **Congress.gov API** (https://api.congress.gov/v3/)
   - Sign up: https://api.congress.gov/sign-up/
   - 5,000 requests/hour
   - Bills, amendments, votes, members, committees, CRS reports

2. **GovInfo Bulk Data** (https://www.govinfo.gov/bulkdata)
   - No authentication required
   - BILLS: Full text XML, 113th Congress+
   - BILLSTATUS: Updated every 4 hours, 108th Congress+

3. **unitedstates/congress** (https://github.com/unitedstates/congress)
   - Community-maintained Python scrapers
   - Public domain output

### Commercial options with APIs

| Service | API | Pricing |
|---------|-----|---------|
| **LegiScan** | Yes (30K/mo free, paid tiers) | Per-state annual |
| **BillTrack50** | Yes (subscribers) | ~$3K/state/year |
| **Quorum** | Yes (REST + SFTP) | Enterprise |
| **FiscalNote** | Enterprise only | Custom |

### Bill comparison tools with programmatic features

**No free programmatic comparison API exists**. Options:
- DIY with bill text XML from GovInfo + diff libraries
- LegiScan provides versioned text you can diff
- Commercial tools (FiscalNote, Quorum) offer comparison features with enterprise APIs

---

## Ecosystem actors

### Active civic tech projects

| Project | Coverage | Status |
|---------|----------|--------|
| **Open States** (Plural Policy) | 50 states + DC + PR (NOT federal) | Active, v3 API |
| **LegiScan** | 50 states + Congress | Active, free tier |
| **unitedstates/congress** | Federal | Active, community maintained |
| **GovTrack.us** | Federal | Website active; API/bulk DEPRECATED |

### Commercial legislative tracking

| Company | Key Features |
|---------|--------------|
| **FiscalNote/StateNet** | AI summaries, bill prediction, 50 states + federal + 40 countries |
| **Quorum** | AI scoring, similar bills detection, CRM, 3,000+ localities |
| **BillTrack50** | State comparison, AI summaries, API for subscribers |
| **FastDemocracy** | Side-by-side comparison (paid), hearing transcripts |
| **CQ (FiscalNote)** | Bill Compare feature, comprehensive Hill coverage |
| **Bloomberg Government** | Enterprise federal coverage |

### Academic resources

- **Congressional Bills Project** (congressionalbills.org): 400,000+ bills 1947-2008
- **Voteview** (UCLA): Roll call votes 1789-present, DW-NOMINATE scores
- **Policy Agendas Project**: Bill topic coding since WWII
- **ICPSR/Harvard Dataverse**: Multiple political science datasets

---

## Conclusion

The US legislative comparison system rests on rules from 1929 (Ramseyer) and the 1940s (Cordon) that remain in effect, enforced primarily through House floor procedure. The **House has modernized internally** with the Comparative Print Suite (October 2022, Xcential-built, USLM-based)—but this remains behind the House firewall with no public release announced.

For developers today, the practical path is: **Congress.gov API** (5,000 requests/hour) for bill status and metadata, **GovInfo bulk data** for full text in Bill DTD XML, and DIY comparison using diff algorithms. The USLM standard is the clear future direction (available in beta for enrolled bills since 2013) but Bill DTD remains the production format for bills during the legislative process.

**Key gaps for a legislative tracking startup**: No public API for official comparative prints; no free programmatic bill comparison service; state-level real-time data requires commercial tools or custom scraping. The most cost-effective path is combining Congress.gov API (free) with LegiScan's free tier (30K queries/month) or Open States for state coverage, supplemented by GovInfo bulk downloads for historical depth.