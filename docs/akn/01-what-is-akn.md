# What is Akoma Ntoso?

**Akoma Ntoso** (pronounced *ah-KOH-mah n-TOH-soh*) means "linked hearts" in the Akan language of Ghana. It is an XML standard for representing legal and legislative documents in a machine-readable format.

## At a glance

| | |
|---|---|
| **Full name** | Akoma Ntoso (Architecture for Knowledge-Oriented Management of African Normative Texts using Open Standards and Ontologies) |
| **Standard body** | [OASIS](https://www.oasis-open.org/) (Organization for the Advancement of Structured Information Standards) |
| **Version** | v1.0 OASIS Standard (August 2018) |
| **Schema version** | XML Schema 3.0 (`akomantoso30.xsd`) |
| **Namespace** | `http://docs.oasis-open.org/legaldocml/ns/akn/3.0` |

## The versioning confusion

You will encounter two version numbers:

- **Standard version 1.0** — the OASIS Standard, ratified in 2018. This is the document specification.
- **Schema version 3.0** — the XML Schema (`akomantoso30.xsd`). The schema went through versions 1.0, 2.0, and 3.0 during the standardization process before the OASIS Standard was finalized.

When someone says "Akoma Ntoso 3.0," they usually mean the XML schema. The actual standard is v1.0. Both refer to the same thing.

## What it does

AKN provides a common vocabulary for marking up:

- **Legislation**: acts, bills, amendments, consolidated laws
- **Parliamentary proceedings**: debates, speeches, voting records
- **Judicial documents**: judgments, court opinions
- **Official publications**: gazettes, document collections

The key idea is that all these document types share common structural patterns — metadata, front matter, body, back matter — and AKN gives them all a uniform representation.

## Who uses it

AKN is used by parliaments, courts, and official publishers worldwide:

- **European Union** — AKN4EU profile for EU legislation
- **United Kingdom** — legislation.gov.uk converts CLML to AKN
- **Italy** — Senate (one of the early adopters)
- **Germany** — LegalDocML.de, mandatory for federal legislation from 2027
- **United States** — USLM (United States Legislative Markup), derived from AKN
- **France** — Senate's Monalisa project uses AKN since 2019
- **Brazil** — LexML-BR, a Portuguese-language derivative
- **Chile** — National Library of Congress (Biblioteca del Congreso Nacional)
- **South Africa, Kenya, Uruguay** — among the early implementors

See [National profiles](10-national-profiles.md) for details.

## The three-part specification

The OASIS Standard consists of:

1. **Part 1: Vocabulary** — Defines the elements, attributes, and document model
2. **Part 2: Specifications** — Detailed rules for structure, metadata, and usage
3. **Naming Convention** — How to construct URIs, eId attributes, and references

## Official resources

- OASIS TC page: https://www.oasis-open.org/committees/legaldocml/
- Schema: http://docs.oasis-open.org/legaldocml/ns/akn/3.0
- GitHub (examples): https://github.com/oasis-tcs/legaldocml-akomantoso

