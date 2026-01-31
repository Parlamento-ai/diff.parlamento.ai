# Deep Research: Legislative comparative documents in the United States

## Prompt

I know nothing about the system of legislative comparative documents in the United States. I need you to explain everything from scratch, with the maximum level of detail possible.

### Context

I'm a software developer at a legislative tracking startup (parlamento.ai). We're researching how legislative comparison documents work across different countries. The goal is to document the state of the art, identify common patterns across jurisdictions, and eventually propose open, machine-readable formats for publishing the evolution of bills.

I come from the software world. For me, the natural way to see changes between versions is a `git diff`. I find it hard to understand why legislation is published in opaque formats. I want to understand exactly how the US works today.

### What I need to know

#### 1. Concept and terminology
- What are these documents called in the US? "Comparative prints", "redlines", "tracked changes"? What other terms exist?
- Is there a formal definition in House/Senate rules or statutes?
- Who produces them? Committee staff, CRS, Office of the Clerk, GPO?

#### 2. The legislative process and where comparisons appear
- Describe the full flow of a bill (introduction → committee → floor → other chamber → conference → enrollment → signing).
- At which exact stages are comparative documents produced?
- What are "comparative prints" formally? How do "Ramseyer Rule" (House) and "Cordon Rule" (Senate) work?
- How do amendment documents work? (amendment in the nature of a substitute, manager's amendments, etc.)
- Is producing comparative documents mandatory or discretionary?

#### 3. Format and structure of documents
- What is the physical format? (PDF, TXT, XML, HTML, other)
- Do they have a standardized structure?
- How are differences marked? (strikethrough, italics, colors, brackets)
- Explain the specific typographical conventions (existing law in roman, new matter in italic, deleted matter in strikethrough, etc.)
- If PDF: What kind? PDF/A? Digitally signed? Text-selectable?
- Are there metadata in the documents?
- Show concrete examples with URLs if possible.

#### 4. The Comparative Print Suite
- What exactly is it? When was it launched? Who built it (Xcential)?
- What are the three types of comparison it supports?
- Is it really only accessible behind the House firewall? Has there been any movement to make it public?
- What technology does it use? (XML-based? What format internally?)
- Are there screenshots or documentation publicly available?

#### 5. Portals and publication systems
- Where are things published? List all relevant portals:
  - Congress.gov
  - GPO GovInfo (govinfo.gov)
  - House.gov / Senate.gov
  - compare.house.gov (internal)
  - Any other
- What does each portal offer in terms of bill versions and comparisons?
- What APIs exist? (Congress.gov API v3, GovInfo API, bulk data)
- What formats are available? (USLM XML, PDF, TXT, HTML)
- What are the rate limits and access restrictions?

#### 6. Standards and technical formats
- **USLM (United States Legislative Markup)**: What is it exactly? How does it relate to Akoma Ntoso? What's the current adoption status? Is it actually used in production or still beta?
- What XML schemas does GPO use for bills?
- How does the enrolled bill process work technically?
- What is the relationship between USLM, Akoma Ntoso, and the various GPO XML schemas?

#### 7. Reality vs. aspiration
- Legislatures are great at proposing modernization and never implementing it. I need you to clearly distinguish between:
  - What **actually works today** and is in daily use
  - What **is in the process** of being implemented (with concrete evidence of progress)
  - What **was announced but never implemented** or was abandoned
  - What **is just a proposal** with no real implementation

#### 8. Programmatic access
- Can a developer today programmatically access bill texts in their different versions?
- What can be scraped? What has an API? What is blocked?
- Are there public bulk datasets available?
- How does the GovInfo bulk data work?

#### 9. Ecosystem actors
- Are there civil society organizations, academic groups, or companies working on legislative transparency?
- Relevant civic tech projects? (GovTrack, OpenStates, LegiScan, ProPublica Congress API, etc.)
- What commercial tools exist for bill comparison? (CQ, State Net, FastDemocracy, BillTrack50)

### Response format

Respond in English. Be exhaustive. I prefer a long, detailed document over a superficial one. Include concrete URLs when possible. When you're not sure about something, say so explicitly rather than making it up.
