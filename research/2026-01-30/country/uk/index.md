# UK legislative comparison documents: a technical deep dive

**The UK has the world's most sophisticated publicly accessible system for legislative comparison and versioning**, built around legislation.gov.uk's CLML XML format and point-in-time API—but critical gaps remain in bills during passage. For a legislative tracking startup, the core finding is this: enacted legislation is exceptionally well-served with machine-readable formats and robust APIs, while bills in progress remain largely PDF-bound despite modern internal tooling.

The UK uses several terms for comparison documents, with **"Keeling schedules"** being the most distinctive. These show existing law marked up with proposed amendments and are named after Sir Edward Keeling, the Conservative MP whose 1938 memorandum convinced Prime Minister Chamberlain to instruct Parliamentary Counsel to "proceed experimentally" with such documents. Other terms include **"bill as amended"** (reprints after committee/report stage), **"revised legislation"** (legislation.gov.uk's consolidated text), and **"tracked changes"** (internal Lawmaker terminology).

---

## How Keeling schedules work in parliamentary practice

A Keeling schedule presents existing law with proposed changes visually marked—insertions underlined in blue, deletions struck through in red, with footnotes referencing the amending provision. These documents serve a specific purpose: when a bill proposes to amend an existing Act by saying "in section 12, for 'thirty days' substitute 'fourteen days'", understanding the effect requires having the original Act open alongside. A Keeling schedule eliminates this burden by showing the affected text inline with changes marked.

**Formal Keeling schedules** embedded within bills themselves are rare—Erskine May cites examples including the Rating and Valuation (Amendment) (Scotland) Bill 1983 and Charities Bill 1991. **Explanatory Keeling schedules** published separately are more common for complex amending legislation. Recent examples include schedules for the Mental Health Bill (2024), Investigatory Powers (Amendment) Bill (2023-24), and Data (Use & Access) Bill. The government publishes these voluntarily to aid understanding—they are **not procedurally required**.

Who produces them has changed significantly. Traditionally, the sponsoring government department prepared them manually. Now, **The National Archives' Lawmaker system** includes AI-powered Keeling schedule generation that analyzes amending provisions and applies them to existing Acts automatically. This feature, documented at help.lawmaker.legislation.gov.uk, represents a major modernization—though the output remains primarily internal, with PDFs published for public consumption.

---

## The legislative process and where comparison documents appear

Understanding where comparison documents fit requires mapping the bill's journey through Parliament:

**First Reading** is purely formal—the bill's title is read, it may not even be printed yet, and it receives a bill number (e.g., HC Bill [1] for Commons, HL Bill 1 for Lords). **Second Reading** debates the bill's general principles without textual amendments. After passing, most government bills receive a programme motion setting their timetable.

**Committee Stage** is where line-by-line scrutiny occurs. In the Commons, most bills go to a Public Bill Committee; constitutional or controversial bills may be taken in Committee of the Whole House. The Lords typically uses Committee of the Whole House or Grand Committee. **If the bill is amended during committee, it is reprinted before Report Stage**—this reprint, labeled something like "HC Bill [2] (as amended in Public Bill Committee)," is the primary comparison document, though it does not mark what changed from the original.

**Report Stage** allows the whole House to consider further amendments. **If amended, the bill is reprinted again.** Third Reading in the Commons allows no amendments; the Lords permits "tidying" amendments. The bill then transfers to the other House, potentially going through **"ping-pong"** if both Houses make conflicting amendments, before finally receiving **Royal Assent**.

The key limitation for developers: **no automatic "diff" between versions is published**. The reprints show clean text—you must manually compare consecutive versions to identify changes. Amendment papers show what was proposed, and proceedings documents record what was agreed, negatived, or withdrawn, but combining these into a clear comparison requires significant processing.

---

## Amendment papers and marshalled lists explained

**Amendment papers** specify the exact textual change proposed: the page/line reference, the action (leave out, insert, substitute), exact wording, and sponsor's name. These are published on bills.parliament.uk as PDFs. **Marshalled lists** are consolidated, sequenced lists of all amendments for a stage, published **two working days before consideration begins**. New or altered amendments are marked with asterisks.

The **Chair's selection** determines which amendments actually get debated—Standing Order No. 32 gives the Chair power to select and group amendments. **Grouping lists** show which amendments will be debated together. In the Commons, not all tabled amendments are selected; in the Lords, every amendment can be debated though groupings apply.

Amendment papers reference page and line numbers from **the PDF version** of the bill. This creates a significant barrier to machine processing: there is no public API returning amendment text in structured format—only PDF downloads.

---

## Formats and structure of published documents

For **enacted legislation on legislation.gov.uk**, format availability is exceptional:

| Format | Access | Status |
|--------|--------|--------|
| CLML XML | `/data.xml` suffix | ✅ Primary canonical format |
| Akoma Ntoso | `/data.akn` suffix | ✅ Dynamically converted from CLML |
| HTML5 | `/data.html` suffix | ✅ AKN serialization with RDFa |
| RDF/XML | `/data.rdf` suffix | ✅ FRBR-based metadata |
| PDF | `/data.pdf` suffix | ✅ Dynamically generated |
| XHTML | `/data.xht` suffix | ✅ Legacy web format |

**CLML (Crown Legislation Markup Language)** is the native format—all others derive from it. The schema is publicly available at github.com/legislation/clml-schema, currently version 2.6. CLML uses a "true paragraph model" where all content associated with a provision is nested within it. It incorporates Dublin Core for metadata, XHTML for tables, and MathML for formulae.

For **bills in progress on bills.parliament.uk**, the picture is bleaker:

| Format | Status |
|--------|--------|
| PDF | ✅ Primary public format |
| HTML | ✅ Website viewing only |
| XML | ❌ **Not publicly available** (internal to Lawmaker) |

This asymmetry is critical: the sophisticated Lawmaker system generates XML internally using LegalDocML/Akoma Ntoso, but **does not expose it publicly**. The Bills API at bills-api.parliament.uk returns JSON metadata (bill titles, stages, sponsors) but **not bill text in any structured format**.

---

## legislation.gov.uk: architecture and capabilities

The National Archives operates legislation.gov.uk, launched July 2010 by merging the OPSI website with the UK Statute Law Database. The architecture combines:

- **MarkLogic** (native XML database) as the primary document store
- **GraphDB and Virtuoso** (RDF triple stores) for linked data
- **Amazon Web Services** for hosting, with content on S3 for bulk downloads
- **Orbeon** (XForms processor) and **Apache Tomcat** for the application layer
- **XQuery, SPARQL, and XSLT** for application logic

**Point-in-time versioning** allows accessing legislation as it stood on any date, with URLs like `/ukpga/1985/67/2003-04-01`. The system uses the **FRBR model** (Functional Requirements for Bibliographic Records) distinguishing Works (abstract legislation), Expressions (specific versions), and Manifestations (format representations).

Critical limitations exist. **Base dates** constrain historical access:
- UK Primary Legislation: **1 February 1991**
- Northern Ireland: **1 January 2006**

No version history exists before these dates. Legislation fully repealed before 1991 is not included. **Secondary legislation is NOT revised**—amendments are not incorporated into Statutory Instruments, only the original "as made" text is available. A significant backlog of unapplied effects exists for primary legislation; the system tracks these in `<ukm:UnappliedEffects>` XML elements but editorial resources cannot keep pace with the volume of amendments.

---

## The API in practice

The REST API requires **no authentication** and supports content negotiation. Rate limits are **3,000 requests per 5 minutes per IP**; exceeding this returns 403 Forbidden. A User-Agent header is mandatory.

**URL patterns for programmatic access:**
```
# Current version
https://www.legislation.gov.uk/ukpga/2021/1/data.xml

# As enacted
https://www.legislation.gov.uk/ukpga/2021/1/enacted/data.xml

# Point-in-time (1 April 2003)
https://www.legislation.gov.uk/ukpga/1985/67/2003-04-01/data.xml

# Specific section
https://www.legislation.gov.uk/ukpga/2021/1/section/5/data.xml

# Prospective version (showing future amendments)
https://www.legislation.gov.uk/ukpga/2017/30/prospective/data.xml
```

Search results return as **Atom feeds** with pagination. The **SPARQL endpoint** at legislation.gov.uk/sparql supports HTTP GET and POST, querying linked data including a near-complete list of UK law. **Bulk downloads** are available from an S3 bucket at leggovuk-ldn.s3-website.eu-west-2.amazonaws.com in CLML, AKN, HTML5, PDF, and plaintext formats.

The "changes to legislation" feature tracks which Act amended which, with effects data including type (inserted, text amended, repealed, commenced), affecting and affected legislation URIs, and specific provision references. This uses the **MetaLex ontology** in RDF.

---

## The Lawmaker drafting system

Lawmaker is a **browser-based, cloud-hosted XML editor** operated by The National Archives as a shared service. Development began in 2017, with the system becoming fully operational around 2019-2020. Current users include the Office of the Parliamentary Counsel, UK Parliament staff, Scottish Parliament, and (as of April 2025) the Northern Ireland Assembly—approximately **2,500 users** for secondary legislation alone.

Internally, Lawmaker uses **LegalDocML/Akoma Ntoso** as its XML standard. Users can create amendments by making inline changes to bill text; the system converts these into traditionally-formatted amendment papers. The "apply amendments" feature allows selecting amendments and generating new bill versions with **tracked changes visible**—insertions and deletions marked distinctly. An "accept all" function produces clean versions.

The traditional "blue paper" reference relates to parliamentary printing conventions (amendments reprinted on blue paper the day after initial white paper publication), not a digital marking system. Within Lawmaker, equivalent functionality includes asterisks for new amendments and visual highlighting for overlapping amendments.

**Critical for developers:** Lawmaker's outputs to the public remain **PDF and HTML only**. The sophisticated XML and tracked-change capabilities are not exposed. This represents the largest gap between internal capability and public access in the UK legislative data ecosystem.

---

## Technical standards: what's actually implemented

**CLML** is unambiguously implemented and working. The schema (version 2.6) is documented at github.com/legislation/clml-schema with comprehensive reference material at legislation.github.io/clml-schema. CLML's complexity reflects covering **800+ years of legislative history** with varying structures.

**Akoma Ntoso** is genuinely available—appending `/data.akn` to any legislation URL returns dynamically converted AKN 3.0 XML. This is not aspirational; it works today and covers all documents with CLML source. The UK's 2014 bulk conversion to AKN pushed it to #1 in the Global Open Data Index for legislation.

**RDF and Linked Data** are implemented using Dublin Core Terms, FOAF, FRBR, and MetaLex vocabularies. The SPARQL endpoint is live and queryable. However, RDF is document-derived rather than a rich semantic model—it provides FRBR-structured metadata, not deep legal ontology.

**ELI (European Legislation Identifier)** continues post-Brexit. The UK was an ELI Task Force member and implementer; legislation.gov.uk's URI scheme follows ELI principles with persistent HTTP URIs. This has not been discontinued.

**What's NOT implemented:** OAI-PMH harvesting protocol (discussed but never built), digital signatures on documents, real-time webhooks for changes, and a comprehensive legislation-specific ontology beyond basic metadata.

---

## Reality versus aspiration: an honest assessment

**Working today with no caveats:**
- legislation.gov.uk CLML XML API for enacted legislation
- Akoma Ntoso conversion for all CLML documents
- Point-in-time versioning (within base date constraints)
- SPARQL endpoint for linked data queries
- Bulk downloads in multiple formats
- Parliament APIs for bills metadata (JSON)
- TheyWorkForYou API for debates and enriched MP data

**Working but with significant limitations:**
- Revised legislation (amendments incorporated)—backlog means not all effects applied
- Effects/changes tracking—data exists but applying it programmatically requires significant work
- Bills API—metadata only, no bill text in structured format

**Genuinely missing or aspirational:**
- Public XML for bills in progress—Lawmaker generates it internally but doesn't expose it
- Machine-readable amendment papers—PDF only
- Automated comparison between bill versions—must be computed externally
- Secondary legislation consolidation—original text only, amendments never incorporated
- Real-time update notifications—must poll Atom feeds

---

## Programmatic access: practical guidance

A developer today **can** programmatically access enacted UK legislation in all versions through legislation.gov.uk. The API is mature, well-documented (github.com/legislation/data-documentation), requires no authentication, and provides multiple formats.

For **bills in progress**, capabilities are limited to:
- Bills API (bills-api.parliament.uk): JSON metadata, stages, sponsors
- RSS feeds: Subscribe to bill updates
- PDF scraping: Required for bill text and amendments

**Key portals and their offerings:**

| Portal | What it offers | API | Formats |
|--------|---------------|-----|---------|
| legislation.gov.uk | Enacted legislation | REST + SPARQL | XML, AKN, RDF, HTML, PDF |
| developer.parliament.uk | Parliament data hub | Multiple REST APIs | JSON, XML |
| bills.parliament.uk | Bills in progress | Limited (via Bills API) | PDF, HTML |
| hansard.parliament.uk | Debates | Limited | HTML |
| theyworkforyou.com | Enriched parliamentary data | REST API | JSON, XML |

**Licensing** is permissive: legislation.gov.uk uses Open Government Licence v3.0; Parliament data uses Open Parliament Licence v3.0. Both permit commercial use with attribution.

---

## Ecosystem actors and civic tech

**mySociety** dominates the civic tech space with TheyWorkForYou (theyworkforyou.com/api), which provides programmatic access to debates from 1918, written answers, MPs/Lords data, and voting records. API pricing starts at £20/month for 1,000 calls, with free access for charitable/non-profit use. **ParlParse** (parser.theyworkforyou.com) is their open-source Hansard parser producing XML.

**PublicWhip** (publicwhip.org.uk) provides voting analysis with raw data downloads including vote matrices and MySQL dumps. **EveryPolitician** offers structured politician data in Popolo JSON format.

**The National Archives** maintains open-source tools at github.com/legislation, including CLML schemas, XSLT transforms, and GATE NLP pipelines for machine-assisted amendment identification.

No significant commercial actors focus specifically on UK legislative comparison—this represents a market opportunity, though the public infrastructure is already quite comprehensive for enacted legislation.

---

## Conclusion: implications for open format proposals

The UK system reveals a clear bifurcation: **enacted legislation has world-class machine-readable infrastructure**; **bills in progress do not**. Any proposal for open comparison formats should address this gap—the internal capability exists (Lawmaker's LegalDocML/AKN), but public exposure does not.

Key technical decisions for a proposed format:
- **Akoma Ntoso is the obvious candidate**—already used internally by Lawmaker and exposed by legislation.gov.uk, it's an OASIS international standard
- **Change tracking** could leverage Lawmaker's internal model or MetaLex ontology already used in RDF
- **ELI-compatible URIs** should be maintained for international interoperability

The most valuable contribution would be advocating for **public XML exposure from Lawmaker during bill passage**, which would close the critical gap between internal capability and public access. The technical standards exist; the policy decision to publish does not.