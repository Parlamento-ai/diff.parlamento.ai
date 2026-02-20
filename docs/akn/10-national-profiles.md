# National Profiles

Akoma Ntoso is designed to be adapted by each jurisdiction. Rather than mandating a single structure, AKN provides the vocabulary and jurisdictions create **profiles** — subsets or extensions that match their legal traditions. Here are the most significant implementations.

## CLML — United Kingdom

**Crown Legislation Markup Language** is the XML format used by [legislation.gov.uk](https://www.legislation.gov.uk/) since 2010.

- CLML predates AKN but has been progressively aligned with it
- legislation.gov.uk provides AKN exports alongside native CLML
- Covers: Acts of Parliament, Statutory Instruments, Scottish/Welsh/NI legislation
- Notable: one of the most comprehensive online legislative databases, with full amendment history and "point in time" versioning
- Uses its own URI scheme (`http://www.legislation.gov.uk/id/...`) alongside AKN IRIs

## USLM — United States

**United States Legislative Markup** is described as a "second generation" XML format derived from AKN.

- Developed by the Office of the Law Revision Counsel (US House of Representatives)
- Used for the United States Code (USC)
- Based on AKN principles but with a separate schema tailored to US legislative structure
- Supports the US hierarchy: Title → Subtitle → Chapter → Subchapter → Section
- Available at [uscode.house.gov](https://uscode.house.gov/)

## LegalDocML.de — Germany

Germany's federal implementation, officially mandated:

- Based on AKN 3.0 with a **restrictive subschema** (fewer elements, stricter rules)
- Mandatory for all federal legislation from **2027**
- Developed by the Federal Ministry of Justice
- Covers: federal laws, regulations, administrative rules
- Published specification: [LegalDocML.de 1.7](https://www.xrepository.de/)
- Key difference: much more prescriptive than the flexible AKN standard — where AKN says "you may," LegalDocML.de often says "you must"

## LexML-BR — Brazil

Brazil's **LexML** is a Portuguese-language derivative of AKN:

- Covers: federal, state, and municipal legislation
- Portal: [lexml.gov.br](https://www.lexml.gov.br/)
- Provides URN-based identifiers (`urn:lex:br:...`)
- One of the early and large-scale implementations of AKN principles in Latin America

## AKN4EU — European Union

**AKN4EU** is the EU's official AKN profile, developed by the Interinstitutional Metadata and Formats Committee (IMFC). Current version: **4.2** (published October 2024).

- **Namespace:** `xmlns:akn4eu="http://imfc.europa.eu/akn4eu"`
- **Scope:** Ordinary Legislative Procedure acts, Council acts, legislative proposals
- **Document types covered:** `<act name="REG|DIR|DEC|DEC_IMPL">` for adopted legislation, `<bill>` for proposals
- **Not covered:** debates, votes, agendas, questions, amendments as standalone documents, changeSets
- Supports multilingual legislation (all 24 official EU languages)
- Uses **ELI** (European Legislation Identifier) URIs and **EU Authority Lists** for organizations, roles, and places
- **LEOS** (Legislation Editing Open Software) produces AKN natively — available under EUPL 1.2 at [code.europa.eu/leos](https://code.europa.eu/leos/core)

**Key distinction from other profiles:** AKN4EU covers the *products* of the legislative process (final acts and proposals) but not the *process* itself (who voted, what was debated, which amendments were tabled). EUR-Lex publishes documents in **Formex 4** (a proprietary XML format), not AKN. The conversion FMX2AK exists internally but is not public. `application/akn+xml` returns HTTP 400 from CELLAR.

**Verified in PoCs (Feb 2026):** We built 10 converters that transform EU data to AKN 3.0 from two real APIs — CELLAR (Formex XML, no auth) and EP Open Data v2 (JSON-LD, no auth). Formex→AKN mapping is ~1:1 for structural elements. Bills (COM proposals) don't have Formex but have XHTML parseable via CSS classes. EU is the easiest jurisdiction for AKN conversion because it already publishes structured XML. See [research/2026-02-19/akn-eu/](../../research/2026-02-19/akn-eu/) for full results.

## Monalisa — France (Senate)

The French Senate adopted AKN directly:

- **Monalisa** project, in production since **2019**
- Direct AKN adoption (not a derivative standard)
- Covers: Senate bills, amendments, committee reports
- Notable for being a direct adoption without creating a national subschema

## Other implementations

| Country/Region | System | Notes |
|---|---|---|
| **Italy** | Senate, Chamber of Deputies | One of the earliest adopters; several Italian scholars co-authored the standard |
| **Chile** | Biblioteca del Congreso Nacional (BCN) | Official debate records in AKN (see `cl_Sesion56_2.xml` example) |
| **South Africa** | Parliament | Early piloting of AKN for bills and debates |
| **Kenya** | National Assembly | Used for bills and debates |
| **Uruguay** | Parliament | Bills and legislative documents |
| **Switzerland** | Federal Chancellery | Exploring AKN for multilingual legislation (German, French, Italian, Romansh) |
| **Japan** | Government | Evaluating AKN for legal informatics |

## Comparison of approaches

| Approach | Examples | Description |
|---|---|---|
| **Direct adoption** | France (Monalisa), Italy, Chile | Use AKN as-is, possibly with proprietary extensions in the `<proprietary>` element |
| **Restrictive profile** | Germany (LegalDocML.de), EU (AKN4EU) | Create a subschema that restricts AKN to a mandatory subset |
| **Derived standard** | US (USLM), Brazil (LexML-BR) | Create a separate schema inspired by AKN but not schema-compatible |
| **Conversion layer** | UK (CLML) | Maintain a legacy format and provide AKN exports |

## The `<proprietary>` extension point

AKN accommodates national variations through the `<proprietary>` element in `<meta>`, which can contain any elements from other namespaces:

```xml
<meta>
  <proprietary source="#bcn">
    <bcn:MetadataBCN xmlns:bcn="http://chile/proprietary.xsd">
      <bcn:Materia refParteDocumento="#ds1" rdfLabelMateria="Cultura"/>
    </bcn:MetadataBCN>
  </proprietary>
</meta>
```

This is similar in spirit to how [AKN Diff](/docs/akndiff/overview) extends AKN with the `akndiff` namespace — though AKN Diff adds elements to the document body rather than just metadata.

---

Previous: [Naming convention](/docs/akn/naming-convention)
