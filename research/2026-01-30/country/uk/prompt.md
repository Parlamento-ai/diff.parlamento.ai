# Deep Research: Legislative comparative documents in the United Kingdom

## Prompt

I know nothing about the system of legislative comparative documents in the United Kingdom. I need you to explain everything from scratch, with the maximum level of detail possible.

### Context

I'm a software developer at a legislative tracking startup (parlamento.ai). We're researching how legislative comparison documents work across different countries. The goal is to document the state of the art, identify common patterns across jurisdictions, and eventually propose open, machine-readable formats for publishing the evolution of bills.

I come from the software world. For me, the natural way to see changes between versions is a `git diff`. I find it hard to understand why legislation is published in opaque formats. I want to understand exactly how the UK works today.

### What I need to know

#### 1. Concept and terminology
- What are these documents called in the UK? "Keeling schedules", "as amended versions", "tracked changes"? What other terms?
- Is there a formal definition in Standing Orders or parliamentary procedure?
- Who produces them? Parliamentary Counsel, clerks, The National Archives?

#### 2. The legislative process and where comparisons appear
- Describe the full flow of a bill (First Reading → Second Reading → Committee → Report → Third Reading → Lords → Royal Assent).
- At which exact stages are comparative/"as amended" documents produced?
- What are Keeling Schedules exactly? When and how are they used?
- How do amendment papers and marshalled lists work?
- What is the "as amended" version produced after committee stage?

#### 3. Format and structure of documents
- What is the physical format? (PDF, XML, HTML, other)
- Do they have a standardized structure?
- How are differences marked? (Keeling Schedule conventions, blue/red marking in Lawmaker, etc.)
- If PDF: What kind? Digitally signed? Text-selectable?
- What about the XML versions? CLML format details?
- Show concrete examples with URLs if possible.

#### 4. legislation.gov.uk — the gold standard
- How does it work exactly? Architecture, technology, data model.
- "Point-in-time" legislation: how is versioning implemented technically?
- What formats are available? (CLML XML, Akoma Ntoso, RDF/XML, HTML5, PDF)
- How does the API work? (REST, adding /data.xml, /data.akn to URLs)
- SPARQL endpoint: what can you query?
- "Changes to legislation" feature: how does it track which act amended which?
- What are the limitations? (e.g., is everything up to date? Are there gaps?)

#### 5. bills.parliament.uk and the bills process
- What does this portal offer vs. legislation.gov.uk?
- How are bill versions published during passage?
- Amendment papers format and access
- XML availability for bills in progress

#### 6. The Lawmaker system
- What is it exactly? Who uses it?
- How does it handle comparison and amendment tracking internally?
- Blue/red marking system: how does it work?
- Is any of this exposed to the public?

#### 7. Portals and publication systems
- List all relevant portals:
  - legislation.gov.uk (The National Archives)
  - bills.parliament.uk
  - parliament.uk
  - data.parliament.uk
  - hansard.parliament.uk
  - Any other
- What does each offer? APIs? Bulk data? Formats?

#### 8. Standards and technical formats
- **CLML (Crown Legislation Markup Language)**: What is it? Schema details? How does it relate to Akoma Ntoso?
- Akoma Ntoso adoption in the UK: what's the real status?
- RDF and Linked Data: how are they used?
- ELI (European Legislation Identifier): does the UK still use it post-Brexit?

#### 9. Reality vs. aspiration
- Legislatures are great at proposing modernization and never implementing it. I need you to clearly distinguish between:
  - What **actually works today** and is in daily use
  - What **is in the process** of being implemented (with concrete evidence of progress)
  - What **was announced but never implemented** or was abandoned
  - What **is just a proposal** with no real implementation

#### 10. Programmatic access
- Can a developer today programmatically access legislation in all its versions?
- What APIs exist and how mature are they?
- Bulk data downloads?
- Rate limits and restrictions?

#### 11. Ecosystem actors
- Civil society, academic, or commercial actors working on legislative data?
- Civic tech projects? (TheyWorkForYou, MySociety, etc.)

### Response format

Respond in English. Be exhaustive. I prefer a long, detailed document over a superficial one. Include concrete URLs when possible. When you're not sure about something, say so explicitly rather than making it up.
