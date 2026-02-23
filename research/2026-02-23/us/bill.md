# bill — Reporte de Factibilidad EE.UU.

> Un bill introducido en el Congreso en cualquiera de sus versiones: Introduced (IH/IS), Reported (RH/RS), Engrossed (EH/ES), Enrolled (ENR). Cada versión es un **documento XML completo e independiente**. Equivalente al `bill` de Chile (proyecto de ley), pero con múltiples versiones XML descargables en vez de un solo PDF.

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | GovInfo — BILLS collection | [api.govinfo.gov/collections/BILLS](https://api.govinfo.gov/docs/) | Bill DTD XML (IH-ES) + USLM XML (ENR) | Texto completo, estructura, sponsor | Mecánica simple |
| 2 | GovInfo Bulk Data — BILLS | [govinfo.gov/bulkdata/BILLS](https://www.govinfo.gov/bulkdata) | XML | Descarga masiva por Congress/tipo/versión | Mecánica simple |
| 3 | Congress.gov API — bill endpoint | [api.congress.gov/v3/bill/](https://api.congress.gov/) | JSON | Metadatos: sponsor, cosponsors, status, subjects, textVersions | Mecánica simple |
| 4 | Congress.gov API — text versions | [api.congress.gov/v3/bill/.../text](https://github.com/LibraryOfCongress/api.congress.gov/blob/main/Documentation/BillEndpoint.md) | JSON (links a XML/HTML/PDF) | URLs de todas las versiones de texto | Mecánica simple |
| 5 | GovInfo — BILLSTATUS | [govinfo.gov/bulkdata/BILLSTATUS](https://github.com/usgpo/bill-status) | XML | Status completo: actions, amendments, committees, related bills | Mecánica simple |
| 6 | unitedstates/congress (scraper) | [github.com/unitedstates/congress](https://github.com/unitedstates/congress) | JSON + XML | Bill status + texto (todas las versiones) | Mecánica simple |

**Escala de dificultad**: 0 (Ya AKN) · Mecánica simple · Mecánica compleja · AI simple · AI + Humano · No disponible

## Métricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---------------|--------------|-------------|----------------|
| Texto completo (todas las versiones) | Sí | Sí | Bill DTD XML + USLM XML |
| Articulado estructurado | Sí | Sí | XML `<section>` hierarchy |
| Sponsor / cosponsors | Sí | Sí | Congress.gov API |
| Subjects / policy areas | Sí | Parcial | Congress.gov API |
| Actions timeline | Sí | Sí | BILLSTATUS XML |
| Committee referrals | Sí | Sí | BILLSTATUS XML |
| Related bills | Sí | Parcial | Congress.gov API |
| CBO cost estimates | Sí | No | Congress.gov API |
| Summaries (CRS) | Sí | No | Congress.gov API |

- **Datos disponibles pero no aprovechados**: CBO cost estimates, CRS summaries, policy area tags
- **Cobertura**: ~85%

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|-----------|--------------|--------|
| `<bill>` type | Sí | Bill DTD / USLM root element |
| FRBR URIs | Sí | Congress + type + number + version |
| FRBRauthor | Sí | Congress.gov API (sponsor) |
| `<preface>` docTitle | Sí | Bill DTD `<official-title>` / USLM `<officialTitle>` |
| `<references>` TLCPerson | Sí | Congress.gov API (sponsor + cosponsors) |
| `<body>` sections (eId, heading, content) | Sí | XML hierarchy directo |
| `<body>` articles | Sí | `<section>` → `<article>` mapping |
| `<preamble>` (findings, purposes) | Parcial | XML si el bill los incluye |

- **Completitud**: ~80%

## Estructura XML: Bill DTD vs USLM

### Bill DTD (versiones IH, IS, RH, RS, EH, ES)

```xml
<bill bill-stage="Introduced-in-House" bill-type="olc"
      dms-id="..." congress="119" session="1">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dublinCore>
      <dc:title>119 HR 1 IH: ...</dc:title>
    </dublinCore>
  </metadata>
  <form>
    <distribution-code>I</distribution-code>
    <congress>119th CONGRESS</congress>
    <session>1st Session</session>
    <legis-num>H. R. 1</legis-num>
    <current-chamber>IN THE HOUSE OF REPRESENTATIVES</current-chamber>
    <action>
      <action-date date="20250103">January 3, 2025</action-date>
    </action>
    <legis-type>A BILL</legis-type>
    <official-title>To authorize appropriations...</official-title>
  </form>
  <legis-body>
    <section id="..." section-type="section-one">
      <enum>1.</enum>
      <header>Short title; table of contents</header>
      <subsection id="...">
        <enum>(a)</enum>
        <header>Short title</header>
        <text>This Act may be cited as...</text>
      </subsection>
    </section>
  </legis-body>
</bill>
```

### USLM (versiones ENR, PLAW)

```xml
<bill xmlns="http://schemas.gpo.gov/xml/uslm">
  <meta>
    <dc:title>An Act</dc:title>
  </meta>
  <preface>
    <longTitle>
      <docTitle>An Act</docTitle>
      <officialTitle>To authorize appropriations...</officialTitle>
    </longTitle>
    <enactingFormula>Be it enacted...</enactingFormula>
  </preface>
  <main>
    <section identifier="/us/bill/119/hr/1/s1">
      <num value="1">SECTION 1.</num>
      <heading>Short title; table of contents.</heading>
      <subsection identifier="/us/bill/119/hr/1/s1/a">
        <num>(a)</num>
        <heading>Short title</heading>
        <content><p>This Act may be cited as...</p></content>
      </subsection>
    </section>
  </main>
</bill>
```

### Mapeo a AKN Diff

| Bill DTD | USLM | AKN Diff |
|----------|------|----------|
| `<legis-body>` | `<main>` | `<body>` |
| `<section>` | `<section>` | `<article>` |
| `<header>` | `<heading>` | `<heading>` |
| `<enum>` | `<num>` | `<num>` |
| `<text>` | `<content><p>` | `<content><p>` |
| `<subsection>` | `<subsection>` | `<paragraph>` |
| `<official-title>` | `<officialTitle>` | `<docTitle>` |

## Observaciones

- **La mayor ventaja sobre Chile**: Cada versión del bill es un XML completo y descargable. No hay que extraer texto de PDFs ni usar AI para parsear artículos. El diff se hace directamente entre XMLs estructurados.
- **El desafío de los dos schemas**: El pipeline debe normalizar Bill DTD y USLM a un formato común antes de generar AKN Diff. No es difícil — los elementos tienen correspondencia directa — pero es trabajo de mapeo mecánico.
- **Cobertura histórica**: XML disponible desde el 103rd Congress (1993) — 30+ años de datos.
- **Volumen**: ~10,000+ bills por Congress. Solo ~300-600 se convierten en ley. Estrategia: procesar primero los que pasan, luego expandir.
- **60+ códigos de versión** — pero los principales son 6-8. El resto son variantes (EAH, EAS, CPH, CPS, RFS, etc.).
- Los bills sin versiones XML (pre-1993) solo están disponibles en PDF/imagen.
- **unitedstates/congress** puede descargar automáticamente todas las versiones de texto — reduce significativamente el trabajo de pipeline.
