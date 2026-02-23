# US Congress APIs, Data Sources & Legislative Data Research

**Date**: 2026-02-23
**Purpose**: Research data sources for potential AKN Diff implementation for US legislation

---

## 1. Congress.gov API (Official - Library of Congress)

### Overview
The primary official API for US legislative data, maintained by the Library of Congress. Current version is **v3**.

### Technical Details
- **Base URL**: `https://api.congress.gov/v3/`
- **Documentation**: https://api.congress.gov/ and https://github.com/LibraryOfCongress/api.congress.gov
- **Postman Collection**: https://documenter.getpostman.com/view/6803158/VV56LCkZ
- **Authentication**: API key required (free, sign up at https://api.data.gov/signup/)
- **Rate Limit**: 5,000 requests per hour
- **Response Formats**: JSON and XML
- **Pagination**: Default 20 results, max 250 per request; offset parameter available

### Available Endpoints
1. **`/bill`** - Bills and resolutions (all types: hr, s, hjres, sjres, hconres, sconres, hres, sres)
   - Sub-endpoints: `/actions`, `/amendments`, `/committees`, `/cosponsors`, `/relatedbills`, `/subjects`, `/summaries`, `/text`, `/titles`
   - The `/text` sub-endpoint returns `textVersions` with links to full bill text in XML/HTML/PDF
2. **`/amendment`** - Amendments to bills
   - Sub-endpoints: `/actions`, `/amendments`, `/cosponsors`, `/text`
3. **`/member`** - Congressional members
   - Sub-endpoints: `/sponsoredLegislation`, `/cosponsoredLegislation`
4. **`/committee`** - Committees
   - Sub-endpoints: `/reports`, `/nominations`, `/bills`
5. **`/committee-report`** - Committee reports
   - Sub-endpoints: `/text`
6. **`/committee-print`** - Committee prints
7. **`/committee-meeting`** - Committee meetings
8. **`/hearing`** - Hearings
9. **`/congress`** - Congress sessions info
10. **`/nomination`** - Presidential nominations
    - Sub-endpoints: `/actions`, `/committees`, `/hearings`
11. **`/treaty`** - Treaties
    - Sub-endpoints: `/actions`, `/committees`
12. **`/summaries`** - Bill summaries (CRS)
13. **`/congressional-record`** - Congressional Record
14. **`/daily-congressional-record`** - Daily Congressional Record
15. **`/bound-congressional-record`** - Bound Congressional Record
16. **`/house-communication`** - House Communications
17. **`/senate-communication`** - Senate Communications
18. **`/house-requirement`** - House Requirements
19. **`/house-roll-call-vote`** - House Roll Call Votes (beta, 118th Congress / 2023 forward)

### Key Features for AKN Diff
- **Bill text versioning**: The `/bill/{congress}/{billType}/{billNumber}/text` endpoint returns all text versions with URLs to XML, HTML, and PDF formats
- **Amendment tracking**: Full amendment tree with actions and text
- **Vote data**: House roll call votes (new beta endpoint from May 2025)
- **Coverage**: Varies by endpoint; bills from 1st Congress (1789) for metadata, text from 103rd Congress (1993) forward

### Example Requests
```
GET https://api.congress.gov/v3/bill/117/hr/3076?api_key=YOUR_KEY
GET https://api.congress.gov/v3/bill/117/hr/3076/text?api_key=YOUR_KEY
GET https://api.congress.gov/v3/bill/117/hr/3076/amendments?api_key=YOUR_KEY
GET https://api.congress.gov/v3/member?api_key=YOUR_KEY
```

---

## 2. GovInfo API (Government Publishing Office / GPO)

### Overview
The Government Publishing Office's API for accessing official government publications, including congressional bills, laws, hearings, and the Congressional Record.

### Technical Details
- **Base URL**: `https://api.govinfo.gov/`
- **Documentation**: https://api.govinfo.gov/docs/ (OpenAPI/Swagger)
- **GitHub**: https://github.com/usgpo/api
- **Authentication**: API key required (same api.data.gov system, sign up at https://www.govinfo.gov/api-signup)
- **Rate Limits**:
  - 36,000 requests/hour
  - 1,200 requests/minute
  - 40 requests/second
- **Response Formats**: JSON (API responses), plus XML, HTML, PDF, MODS, PREMIS, ZIP for document content
- **Pagination**: Uses `offsetMark` parameter (start with `offsetMark=*`) for traversing beyond 10,000 records
- **MCP Server**: GPO has released a GovInfo MCP server for LLM integration (public preview)

### Core Endpoints

#### Discovery Endpoints
1. **`/collections`** - List all available collections
2. **`/collections/{collectionCode}`** - Browse documents within a collection (with date range filtering)
3. **`/published/{dateStr}`** - Find content by official publication date
4. **`/related/{accessId}`** - Find related documents (bill versions, associated laws, reports, etc.)
5. **`/search`** - Full-text search (POST request)

#### Retrieval Endpoints
1. **`/packages/{packageId}/summary`** - Package-level metadata (JSON)
2. **`/packages/{packageId}/granules`** - List subdivisions within a package
3. **`/packages/{packageId}/granules/{granuleId}/summary`** - Granule-level metadata
4. **Content downloads**: Direct links to XML, PDF, HTML, etc.

### Key Collections for Legislative Data
| Collection Code | Description | Content |
|---|---|---|
| **BILLS** | Congressional Bills | 260,000+ bill texts in all versions |
| **BILLSTATUS** | Bill Status | 147,000+ status records |
| **PLAW** | Public Laws | Enrolled/enacted legislation |
| **STATUTE** | Statutes at Large | Historical statutes |
| **CREC** | Congressional Record (Daily) | Floor proceedings |
| **CRECB** | Congressional Record (Bound) | Final bound edition |
| **CHRG** | Congressional Hearings | Committee hearings |
| **CPRT** | Committee Prints | Committee publications |
| **CRPT** | Congressional Reports | Committee reports |
| **HOB** | History of Bills | Bill history |
| **COMPS** | Statute Compilations | Compiled statutes |
| **USCODE** | US Code | United States Code |
| **CFR** | Code of Federal Regulations | Federal regulations |
| **FR** | Federal Register | Daily federal register |

### Bulk Data Repository
- **URL**: https://www.govinfo.gov/bulkdata
- Add `/xml` or `/json` to any bulkdata link for machine-readable listing
- Bills XML bulk: `https://www.govinfo.gov/bulkdata/BILLS/{congress}/{billType}`
- USLM XML bulk: `https://www.govinfo.gov/bulkdata/BILLS/uslm/{congress}`
- Bill Status XML bulk: `https://www.govinfo.gov/bulkdata/BILLSTATUS/{congress}/{billType}`
- Updated daily by ~6 AM EST

### Related Document Service
The `/related/{accessId}` endpoint is particularly valuable - it links:
- Bill versions to each other (IH -> RH -> EH -> ENR)
- Bills to associated public laws
- Bills to committee reports
- Bills to Congressional Record entries
- Bills to presidential signing statements

### Example Requests
```
GET https://api.govinfo.gov/collections?api_key=YOUR_KEY
GET https://api.govinfo.gov/collections/BILLS/2025-01-01T00:00:00Z?api_key=YOUR_KEY
GET https://api.govinfo.gov/packages/BILLS-119hr1ih/summary?api_key=YOUR_KEY
GET https://api.govinfo.gov/related/BILLS-119hr1ih?api_key=YOUR_KEY
GET https://api.govinfo.gov/search?api_key=YOUR_KEY (POST with query body)
```

---

## 3. ProPublica Congress API (DEPRECATED)

### Status: NO LONGER AVAILABLE
ProPublica's Congress API has been shut down. New API keys are not available. This documentation is for historical reference only.

### What It Provided (Historical)
- **Base URL**: `https://api.propublica.org/congress/v1/`
- **Authentication**: API key via `X-API-Key` header
- **Rate Limit**: 5,000 requests/day
- **Format**: JSON (with JSONP support)
- **Coverage**: Bills, votes, members, nominations, committee data
- **Update frequency**: Most data daily; votes every 30 minutes
- **Endpoints**: Members, votes, bills, nominations, committees, floor actions

### Replacement
Users should migrate to the Congress.gov API and GovInfo API.

---

## 4. US Senate Direct XML Data

### Overview
The US Senate provides direct XML feeds for various legislative data types. No API key required - open access.

### Available XML Sources (senate.gov)
**Reference page**: https://www.senate.gov/general/common/generic/XML_Availability.htm

| Data Type | URL Pattern | Format |
|---|---|---|
| **Roll Call Vote Lists** | `/legislative/LIS/roll_call_lists/vote_menu_{congress}_{session}.xml` | XML |
| **Individual Roll Call Votes** | `/legislative/LIS/roll_call_votes/vote{congress}{session}/vote_{congress}_{session}_{number}.xml` | XML |
| **Committee Hearings & Meetings** | `/general/committee_schedules/hearings.xml` | XML |
| **Committee Memberships** | `/general/committee_membership/committee_memberships_{code}.xml` | XML |
| **Senator Contact Info** | `/general/contact_information/senators_cfm.xml` | XML |
| **Senator Info + Committees** | `/legislative/LIS_MEMBER/cvc_member_data.xml` | XML |
| **Floor Schedule** | `/legislative/schedule/floor_schedule.xml` | XML |
| **Floor Summaries** | `/legislative/LIS/floor_activity/{date}_Senate_Floor.xml` | XML |
| **Tentative Schedule** | `/legislative/{year}_schedule.xml` | XML |
| **Nominations (multiple feeds)** | `/legislative/LIS/nominations/Nom*.xml` | XML |

### Roll Call Vote XML Structure
- **URL example**: `https://www.senate.gov/legislative/LIS/roll_call_votes/vote1192/vote_119_2_00001.xml`
- Contains: vote question, result, vote counts by party, individual senator votes (Yea/Nay/Not Voting/Present)
- Coverage: All roll call votes, searchable by Congress and session

### Authentication
- **None required** - all XML feeds are publicly accessible
- No rate limits documented (standard web scraping courtesy applies)

---

## 5. US House Direct XML Data

### Overview
The House provides XML data through the Office of the Clerk and xml.house.gov.

### Available Sources

#### Office of the Clerk - Roll Call Votes
- **URL pattern**: `https://clerk.house.gov/evs/{year}/roll{number}.xml`
- **Index**: `https://clerk.house.gov/evs/{year}/index.asp`
- **Format**: XML
- **No authentication required**

#### House XML Standards (xml.house.gov)
- **URL**: https://xml.house.gov/
- **Content**: DTDs, schemas, and documentation for legislative XML
- **Bill XML DTD**: Used for exchange between House, Senate, and GPO
- **Data dictionaries**: Available for bills, resolutions, and amendments

#### Committee Repository (docs.house.gov)
- **URL**: https://docs.house.gov/
- Committee schedules, meeting documents, and publications
- XML documents adhere to Legislative Branch Exchange DTDs

---

## 6. USLM (United States Legislative Markup)

### Overview
USLM is the 2nd-generation XML schema for US legislation, derived from the international **LegalDocML (Akoma Ntoso)** standard. It is being developed by the US Government Publishing Office (GPO) and the Legislative Branch XML Working Group.

### Relationship to Akoma Ntoso
- USLM is explicitly described as "a derivative of the international LegalDocML (Akoma Ntoso) standard"
- Many element and attribute names match Akoma Ntoso equivalents
- Extended specifically for US legislative and regulatory documents
- **Key difference from our AKN Diff**: USLM is a US-specific derivative, while we use a custom AKN 3.0 extension

### Schema Versions
- **Current approved**: 2.0.14, 2.0.15, 2.0.16, 2.0.17, and **2.1.0**
- **Proposed/draft**: 2.1.1 (adds committee and conference report support)
- **Versioning**: major.minor.point (point = non-breaking, minor = breaking change)
- **GitHub**: https://github.com/usgpo/uslm

### Schema Structure
Three layers of elements:
1. **Primitive set**: Fundamental building blocks
2. **Core set**: Basic document model with granular structuring elements
3. **Generic set**: XHTML imports (header, row, column, paragraph)

### Supported Document Types
- Bills and resolutions
- US Code titles
- Appendices to US Code titles
- Statutes at Large
- Statute compilations
- Committee reports and conference reports (proposed in 2.1.1)

### USLM XML Availability on GovInfo
| Document Type | Available From | Access |
|---|---|---|
| Enrolled bills | 113th Congress (2013) | GovInfo + Bulk Data Repository |
| Public laws | 113th Congress (2013) | GovInfo + Bulk Data Repository |
| Private laws | 113th Congress (2013) | GovInfo + Bulk Data Repository |
| Statutes at Large | 108th Congress (2003) | GovInfo + Bulk Data Repository |
| Statute compilations | Various | Bulk Data Repository |
| Slip laws (beta) | Congress.gov (2025) | Congress.gov |

### Bulk Access
- **URL**: `https://www.govinfo.gov/bulkdata/BILLS/uslm/{congress}`
- Same naming convention as Bill DTD XML but in `/uslm/` subfolder

### Resources
- User Guide: https://github.com/usgpo/uslm/blob/main/USLM-User-Guide.md
- Review Guide: https://github.com/usgpo/uslm/blob/main/USLM-2_0-Review-Guide-v2_0_12.md
- XML House schemas: https://xml.house.gov/schemas/uslm/1.0/USLM-User-Guide.pdf
- Bill DTD (legacy): https://github.com/usgpo/bill-dtd

---

## 7. Bulk Data Sources

### unitedstates/congress (GitHub)
- **URL**: https://github.com/unitedstates/congress
- **Maintained by**: GovTrack.us and community contributors (originally Sunlight Foundation + GovTrack)
- **License**: Public domain (CC0 1.0)
- **Language**: Python

#### Scrapers Available
| Command | Data Type | Source |
|---|---|---|
| `usc-run govinfo --bulkdata=BILLSTATUS` | Bill status data | GPO bulk data |
| `usc-run bills` | Bill metadata (post-processing) | Congress.gov |
| `usc-run votes` | Roll call votes (House + Senate) | clerk.house.gov + senate.gov |
| `usc-run amendments` | Amendment data | Congress.gov |
| `usc-run nominations` | Nominations (legacy) | Various |
| `usc-run committee_meetings` | Committee meetings | Various |
| `usc-run govinfo` | Bill text + documents | GovInfo |
| `usc-run statutes` | Statutes at Large | GovInfo |

#### Output Format
- **data.json** - JSON version
- **data.xml** - XML version (backward-compatible with GovTrack.us format)
- **Directory structure**: `data/{congress}/{bill_type}/{bill_number}/`

#### Pre-built Data Downloads
- **unitedstates/congress-data**: https://github.com/unitedstates/congress-data
- ZIP files hosted by ProPublica with JSON for every bill since 1973
- Current Congress data updated twice daily

### GPO Bulk Data Repository
- **URL**: https://www.govinfo.gov/bulkdata
- **GitHub docs**: https://github.com/usgpo/bulk-data
- **Bill Status docs**: https://github.com/usgpo/bill-status
- Machine-readable index: Add `/xml` or `/json` to any bulkdata URL
- **Available collections**: BILLS, BILLSTATUS, CREC, CFR, FR, USCODE, PLAW, STATUTE, and more

### GovTrack.us
- **URL**: https://www.govtrack.us/about-our-data
- First to make comprehensive US legislative data openly available (2005)
- Uses unitedstates/congress tools for data collection
- Provides bulk data downloads and an API

---

## 8. Bill Version Tracking

### How Bill Versions Work in the US Congress
A bill goes through multiple stages, and at each stage a new "version" is printed. All versions from the **103rd Congress (1993) forward** are available on GovInfo.

### Version Codes (Key Versions)
| Code | Full Name | Stage |
|---|---|---|
| **IH** | Introduced in House | Introduction |
| **IS** | Introduced in Senate | Introduction |
| **RH** | Reported in House | After committee markup |
| **RS** | Reported in Senate | After committee markup |
| **PCS** | Placed on Calendar Senate | Placed on calendar |
| **EH** | Engrossed in House | Passed by House |
| **ES** | Engrossed in Senate | Passed by Senate |
| **RFS** | Referred to Senate (from House) | Referral to second chamber |
| **RFH** | Referred to House (from Senate) | Referral to second chamber |
| **CPH** | Considered and Passed House | Passed without committee |
| **CPS** | Considered and Passed Senate | Passed without committee |
| **EAH** | Engrossed Amendment House | House amendments |
| **EAS** | Engrossed Amendment Senate | Senate amendments |
| **ENR** | Enrolled Bill | Final version passed by both chambers |
| **PAP** | Printed as Passed | Printed after passage |
| **PP** | Public Print | General availability |

There are approximately **60+ distinct version codes** covering every stage and procedural variant.

### Version Tracking via APIs
1. **Congress.gov API**: `GET /bill/{congress}/{type}/{number}/text` returns all `textVersions` with URLs
2. **GovInfo API**: `GET /related/{accessId}` links all versions of the same bill
3. **GovInfo Bulk Data**: Bill text in XML for all versions from 103rd Congress forward
4. **GovInfo package IDs**: Follow pattern `BILLS-{congress}{type}{number}{version}` (e.g., `BILLS-117hr3076ih`)

### Key Insight for AKN Diff
Each bill version is a **complete standalone document** - unlike Chile where we track modifications within a single evolving bill, in the US system we get the complete text at each stage. This means:
- We can diff any two versions directly (e.g., IH vs RH to see committee changes)
- The GovInfo Related Documents service links all versions of the same bill
- USLM XML (from 113th Congress forward for enrolled) provides structured markup

---

## 9. Committee Data

### Congress.gov API Committee Endpoints
- **`/committee`** - List committees with metadata
- **`/committee/{chamber}/{committeeCode}`** - Specific committee info
- **`/committee/{chamber}/{committeeCode}/reports`** - Committee reports
- **`/committee/{chamber}/{committeeCode}/nominations`** - Nominations referred
- **`/committee/{chamber}/{committeeCode}/bills`** - Bills referred
- **`/committee-report`** - Committee reports with text
- **`/committee-print`** - Committee prints
- **`/committee-meeting`** - Committee meetings/hearings
- **`/hearing`** - Hearing transcripts and information

### GovInfo Committee Collections
- **CHRG** - Congressional Hearings (full text, PDF/XML/HTML)
- **CPRT** - Committee Prints
- **CRPT** - Congressional Reports (House/Senate/Conference)

### Senate Committee XML
- `https://www.senate.gov/general/committee_schedules/hearings.xml` - Upcoming hearings
- `https://www.senate.gov/general/committee_membership/committee_memberships_{CODE}.xml` - Membership

### House Committee Repository
- **URL**: https://docs.house.gov/
- Committee meeting documents and schedules
- XML data for committee-reported bills

### Limitations
- **Committee votes/markups**: Generally NOT available in structured data format through APIs
- Committee votes are recorded in committee reports but not in a machine-readable API endpoint
- Markup text (amended versions) available as bill versions (RH/RS) but the markup process itself is not captured in structured data

---

## 10. Amendment Tracking

### Congress.gov API
- **`/amendment`** - List amendments
- **`/amendment/{congress}/{amendmentType}/{amendmentNumber}`** - Specific amendment
- **`/amendment/{congress}/{amendmentType}/{amendmentNumber}/actions`** - Amendment actions
- **`/amendment/{congress}/{amendmentType}/{amendmentNumber}/amendments`** - Amendments to amendments
- **`/amendment/{congress}/{amendmentType}/{amendmentNumber}/cosponsors`** - Cosponsors
- **`/amendment/{congress}/{amendmentType}/{amendmentNumber}/text`** - Amendment text
- **`/bill/{congress}/{type}/{number}/amendments`** - Amendments to a specific bill

### Amendment Types
- **HAMDT** - House Amendment
- **SAMDT** - Senate Amendment
- **SUAMDT** - Senate Unnumbered Amendment

### GovInfo
- Amendment text available in BILLS collection
- Bill DTD supports amendment XML: https://github.com/usgpo/bill-dtd

### unitedstates/congress
- `usc-run amendments` scraper collects amendment data
- Output in JSON/XML format

### Key Differences from Chile
- US amendments are **separate documents** with their own numbers and text
- Senate amendments can be amended (amendments to amendments)
- House amendments are typically offered and voted on individually on the floor
- Committee amendments are incorporated into the "reported" version (RH/RS)

---

## 11. Vote Data (Roll Call Votes)

### Senate Direct XML
- **Vote list**: `https://www.senate.gov/legislative/LIS/roll_call_lists/vote_menu_{congress}_{session}.xml`
- **Individual vote**: `https://www.senate.gov/legislative/LIS/roll_call_votes/vote{congress}{session}/vote_{congress}_{session}_{number}.xml`
- **No authentication required**
- Contains: question, result, yea/nay counts, party breakdown, individual senator votes

### House Direct XML (Office of the Clerk)
- **Individual vote**: `https://clerk.house.gov/evs/{year}/roll{number}.xml`
- **Vote index**: `https://clerk.house.gov/evs/{year}/index.asp`
- **No authentication required**
- Contains: legis-num, vote-question, vote-desc, amendment-author, individual member votes

### Congress.gov API
- **`/house-roll-call-vote`** - Beta endpoint (118th Congress / 2023 forward)
  - List-level and item-level endpoints
  - Member votes-level showing how each member voted
- **`/bill/{congress}/{type}/{number}/actions`** - Includes vote references in bill actions

### unitedstates/congress
- `usc-run votes` - Scrapes both House and Senate votes
- Output in JSON/XML, organized by Congress/session/chamber

### Coverage
- Senate XML: Available for all recorded votes, historical coverage extends back many congresses
- House XML: Available from at least the 101st Congress (1989) forward
- Congress.gov API: House roll calls from 118th Congress (2023) forward only

---

## 12. Additional/Alternative Sources

### LegiScan API
- **URL**: https://legiscan.com/legiscan
- **Authentication**: Free account + API key
- **Rate Limit (Free)**: 30,000 queries/month
- **Format**: JSON
- **Coverage**: All 50 states + US Congress
- **Endpoints**: `getBill`, `getPerson`, `getRollCall`, and more
- **Paid tiers**: 100K-250K queries/month (Pull), real-time push updates (Push)

### GovTrack.us
- **URL**: https://www.govtrack.us/
- **Data access**: https://www.govtrack.us/about-our-data
- Open data, uses unitedstates/congress tools
- Historical coverage back to 1789

### Sunlight Foundation APIs (DEPRECATED)
- Congress API and Real Time Congress API are no longer maintained
- Historical reference only

### Federal Register API
- **URL**: https://www.federalregister.gov/developers/documentation/api/v1
- **Format**: JSON
- **No authentication required**
- Useful for presidential actions, executive orders

---

## Summary: Recommended Data Sources for AKN Diff US Implementation

### Primary Sources (Official, Free, Reliable)
| Need | Best Source | Format | Auth |
|---|---|---|---|
| Bill metadata | Congress.gov API | JSON/XML | API key (free) |
| Bill text (all versions) | GovInfo API / Bulk Data | XML/PDF/HTML | API key (free) |
| Bill text (USLM/AKN-like) | GovInfo USLM Bulk | XML (USLM) | None (bulk) |
| Amendments | Congress.gov API | JSON/XML | API key (free) |
| Senate votes | Senate.gov XML | XML | None |
| House votes | Clerk.house.gov XML | XML | None |
| Committee reports | GovInfo API (CRPT) | XML/PDF | API key (free) |
| Congressional Record | GovInfo API (CREC) | XML/PDF | API key (free) |
| Related documents | GovInfo Related API | JSON | API key (free) |

### Key Advantages over Chile
1. **Open, well-documented APIs** - No CloudFront blocks, no need for Playwright
2. **Multiple version tracking** - Every bill stage produces a numbered version
3. **USLM is AKN-derived** - XML schema is compatible with our Akoma Ntoso approach
4. **Structured vote data** - Both chambers provide XML roll call data
5. **Bulk data available** - Can download entire congresses worth of data
6. **Community tools** - unitedstates/congress provides ready-made scrapers

### Key Challenges
1. **No official "diff" service** - We would need to compute diffs between bill versions ourselves
2. **Committee markups** - The detailed markup process (line-by-line amendments in committee) is not captured in structured data
3. **USLM only for enrolled bills** - Earlier versions (IH, RH, etc.) use the older Bill DTD XML, not USLM
4. **Amendment integration** - Amendments are separate documents; determining how they modify bill text requires analysis
5. **Volume** - A major bill like the Inflation Reduction Act may have hundreds of amendments and dozens of versions

### Architecture Recommendation
For a US AKN Diff pipeline:
1. Use **Congress.gov API** for bill metadata, actions, and amendment lists
2. Use **GovInfo API/Bulk** for bill text in XML (DTD format for all versions, USLM for enrolled)
3. Use **Senate.gov + Clerk.house.gov XML** for vote data (no auth needed, simple XML)
4. Use **GovInfo Related Documents** to link bill versions to each other
5. Convert Bill DTD XML to our AKN Diff format (similar to what we do for Chile)
6. Compute diffs between successive bill versions (IH -> RH -> EH -> ENR)
