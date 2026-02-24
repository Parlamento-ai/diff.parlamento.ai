# Estados Unidos — Reporte de Factibilidad AKN Diff

> EE.UU. tiene un Congreso bicameral (Senado + House of Representatives) con una infraestructura de datos abiertos excepcionalmente madura. Se evaluó la viabilidad de convertir estos datos a AKN Diff, analizando las APIs oficiales (Congress.gov, GovInfo), formatos XML disponibles (USLM, Bill DTD), y el ecosistema de herramientas open-source existentes.

## Hallazgo principal

**USLM (United States Legislative Markup) es un derivado directo de Akoma Ntoso / LegalDocML.** Esto hace que la conversión a AKN Diff sea significativamente más directa que en Chile o la UE, donde los datos originales están en formatos propietarios (JSON, HTML, PDF).

## Tipos AKN objetivo

| Tipo AKN | Uso en EE.UU. | Estado | Factibilidad | Reporte |
|----------|--------------|--------|-------------|---------|
| `act` | Public Law / US Code (ley vigente) | No implementado | Alta | [act.md](act.md) |
| `bill` | Bill en cualquier versión (IH→RS→EH→ENR) | No implementado | Alta | [bill.md](bill.md) |
| `amendment` | Enmiendas de piso o comisión + roll call votes | No implementado | Media-Alta | [amendment.md](amendment.md) |
| `committee-report` | Informes de comisión (CRPT) | No implementado | Media | [committee-report.md](committee-report.md) |
| `debate` | Congressional Record (transcripción de debates) | No implementado | Media | [debate.md](debate.md) |
| `judgment` | Opiniones de la Corte Suprema | No implementado | Baja (fuera de scope legislativo) | [judgment.md](judgment.md) |

## Fuentes de datos

| # | Fuente | URL | Formato | Auth | Rate Limit | Tipos que alimenta |
|---|--------|-----|---------|------|-----------|-------------------|
| 1 | Congress.gov API (LOC) | [api.congress.gov/v3/](https://api.congress.gov/) | JSON/XML | API key (gratis) | 5,000/hr | bill, amendment, act |
| 2 | GovInfo API (GPO) | [api.govinfo.gov/](https://api.govinfo.gov/docs/) | JSON + XML/HTML/PDF | API key (gratis) | 36,000/hr | bill (texto), act, committee-report |
| 3 | GovInfo Bulk Data | [govinfo.gov/bulkdata/](https://www.govinfo.gov/bulkdata) | XML (USLM + Bill DTD) | Pública | Sin límite | bill, act |
| 4 | Senate.gov XML | [senate.gov/legislative/LIS/](https://www.senate.gov/general/common/generic/XML_Availability.htm) | XML | Pública (sin auth) | Sin límite | amendment (votos Senate) |
| 5 | House Clerk XML | [clerk.house.gov/evs/](https://clerk.house.gov/Votes) | XML | Pública (sin auth) | Sin límite | amendment (votos House) |
| 6 | unitedstates/congress (GitHub) | [github.com/unitedstates/congress](https://github.com/unitedstates/congress) | JSON/XML (scraper) | Pública (CC0) | N/A | bill, amendment (bulk) |

### Comparación con Chile

| Aspecto | Chile | EE.UU. |
|---------|-------|--------|
| Auth requerida | Playwright (CloudFront) | API key gratuita |
| Formato nativo | JSON/PDF/DOC | XML (USLM / Bill DTD) |
| Compatibilidad AKN | Baja (conversión manual) | Alta (USLM ≈ AKN) |
| Versionado de textos | API versionada LeyChile | Versiones como docs separados (IH, RH, EH, ENR) |
| Votos nominales | APIs Senado/Cámara (XML) | XML directo (sin auth) |
| Rate limits | Sin API formal | 5K-36K req/hr |
| Herramientas open-source | Ninguna | unitedstates/congress, GovTrack |
| Volumen | ~3,000 leyes/año | ~10,000+ bills/Congress |

## Proceso legislativo de EE.UU. (simplificado)

```
Bill Introduced (IH/IS)
    ↓
Committee Referral → Markup → Committee Report (RH/RS)
    ↓
Floor Debate → Amendments → Roll Call Vote → Engrossed (EH/ES)
    ↓
Other Chamber (same process) → Conference Committee (if needed)
    ↓
Enrolled Bill (ENR) → President Signs → Public Law (PLAW)
    ↓
Codified in US Code (USCODE)
```

### Versiones de un bill (60+ códigos)

| Código | Significado | Cámara | XML disponible |
|--------|------------|--------|----------------|
| IH | Introduced in House | House | Bill DTD |
| IS | Introduced in Senate | Senate | Bill DTD |
| RH | Reported in House | House | Bill DTD |
| RS | Reported to Senate | Senate | Bill DTD |
| EH | Engrossed in House | House | Bill DTD |
| ES | Engrossed in Senate | Senate | Bill DTD |
| ENR | Enrolled | Bicameral | **USLM** |
| PLAW | Public Law | — | **USLM** |

**Nota**: Solo las versiones ENR y PLAW están en USLM. Todas las versiones intermedias usan el formato Bill DTD (más antiguo, diferente schema).

## Métricas agregadas

### Cobertura del rito legislativo

| Tipo | Cobertura estimada | Nota |
|------|-------------------|------|
| act | ~90% | USLM + versiones históricas de US Code |
| bill | ~85% | Todas las versiones en XML (Bill DTD + USLM) desde 103rd Congress (1993) |
| amendment | ~75% | Votos nominales completos; texto de enmiendas parcial |
| committee-report | ~60% | XML disponible pero no todos los markups |
| debate | ~50% | Congressional Record en XML, pero sin estructura semántica fina |
| judgment | ~30% | Opiniones disponibles pero fuera del scope legislativo |

### Completitud AKN estimada

| Tipo | Completitud | Nota |
|------|-------------|------|
| act | ~85% | USLM → AKN casi directo |
| bill | ~80% | Bill DTD requiere mapeo, USLM directo |
| amendment | ~70% | Votos bien, texto de enmiendas como instrucciones prose-based |
| committee-report | ~50% | Texto disponible, estructura parcial |
| debate | ~40% | Texto plano del Congressional Record |
| judgment | ~20% | Fuera de scope |

## Desafíos técnicos

### 1. Dos formatos XML incompatibles
- **USLM** (enrolled bills, public laws): `<main>`, `<heading>`, `<num>`, `<content>`
- **Bill DTD** (todas las demás versiones): `<legis-body>`, `<header>`, `<enum>`, `<text>`
- El pipeline necesita parsear **ambos** formatos y normalizar a AKN Diff

### 2. Enmiendas son instrucciones en prosa
- US: _"Section 2(a) is amended by striking 'fire retardant' and inserting 'fire retardant or water'"_
- Chile: el texto final del artículo se incluye completo en cada versión
- **Implicación**: Para generar un diff semántico, se necesita NLP para parsear las instrucciones amendatorias (lo que hace internamente el Comparative Print Suite del House)
- **Alternativa**: Comparar textos completos entre versiones (IH vs RH vs EH vs ENR) sin procesar las instrucciones

### 3. Volumen masivo
- ~10,000+ bills por Congress (2 años)
- 103rd-119th Congress = ~16 Congresses = ~160,000+ bills
- Cada bill puede tener 2-8 versiones
- Requiere estrategia de procesamiento selectivo o incremental

### 4. No hay equivalente a la API versionada de LeyChile
- En Chile: `idVersion=YYYY-MM-DD` permite ver cualquier ley en cualquier fecha
- En EE.UU.: Cada versión es un **documento separado** (IH, RH, EH, ENR)
- El diff se hace entre documentos, no entre versiones de un mismo recurso

## Herramientas existentes (ventaja competitiva)

### unitedstates/congress (GitHub)
- Python 3, CC0, 1000+ stars
- Scrapers para: bill status, bill text, roll call votes, committee meetings
- Output estructurado en JSON/XML
- Actualizado 2x diario por GovTrack
- **Puede servir como base del pipeline de datos**

### GovInfo MCP Server (GPO)
- Public preview (2026)
- Acceso programático a documentos legislativos via MCP protocol
- Podría integrarse directamente con nuestro tooling

### Comparative Print Suite (House Clerk + Xcential)
- Herramienta interna del House que genera diffs bill-to-bill y bill-to-law
- **No es pública**, pero demuestra que el problema es resoluble
- Usa NLP para parsear instrucciones amendatorias

## Oportunidades únicas

1. **USLM → AKN Diff casi directo**: La compatibilidad de schemas reduce significativamente el esfuerzo de conversión
2. **Votos nominales sin scraping**: XML directo de Senate.gov y House Clerk, sin autenticación
3. **Comunidad activa**: unitedstates/congress provee infraestructura de datos lista para usar
4. **Cobertura histórica profunda**: Datos desde 1993 (103rd Congress) en XML, votos desde aún antes
5. **Caso de uso masivo**: EE.UU. tiene la mayor audiencia potencial de cualquier jurisdicción

## Estrategia recomendada

### Fase 1: Proof of Concept ✅

- [x] S.5 (Laken Riley Act) y S.269 (Improper Payments) como bills de prueba
- [x] Descarga de versiones desde congress.gov (Bill DTD XML)
- [x] Parseo de Bill DTD → `bill-dtd-parser.ts`
- [x] Roll call votes de Senate.gov + House Clerk → `vote-parser.ts`
- [x] Generación de AKN Diff XMLs con changeSets y votes (4 XMLs por bill)

### Fase 2: Pipeline automatizado ✅

- [x] Congress.gov API v3 como fuente de metadata
- [x] Diff automático entre versiones con `computeChangeSet()` (reutilizado de CL)
- [x] Passage actions → amendments con votos nominales
- [x] Probado con S.5, S.269, S.331 del 119th Congress

```bash
npx tsx pipeline/us/process.ts s331-119
# Output: pipeline/data/us/s331-119/akn/ (4 XMLs)
```

### Fase 3: Histórico (pendiente)
1. Procesar bills emblemáticos (ACA, Tax Cuts and Jobs Act, Infrastructure Investment)
2. Construir historial de leyes modificadas (equivalente a Ley 18.045 con 32 versiones)
3. Integrar Congressional Record para contexto de debate
4. Soportar bills con `<title>` / `<division>` (ej: NDAA, reconciliación)

## Pipeline US — Capacidades y limitaciones

> Pipeline implementado en `pipeline/us/`. Uso: `npx tsx pipeline/us/process.ts <bill-id> [--phase=N] [--api-key=KEY]`

### Lo que SÍ puede hacer

| Capacidad | Detalle |
|-----------|---------|
| **Descubrir metadata** | Consulta automática a Congress.gov API v3: título, sponsor, status, public law, versiones de texto, acciones, votos |
| **Descargar fuentes** | Bill DTD XMLs desde congress.gov + vote XMLs desde Senate.gov y House Clerk, con cache local |
| **Parsear Bill DTD XML** | Extrae secciones (`<section>`) con heading, subsections, paragraphs, quoted-blocks y after-quoted-block |
| **Parsear votos nominales** | Senate XML (100 senadores) y House XML (435+ representantes) con nombre, partido, estado y voto |
| **Detectar cambios entre versiones** | Diff sección-a-sección usando LCS (substitute, insert, repeal) entre cualquier par de versiones |
| **Generar AKN Diff completo** | `<bill>`, `<amendment>` con `<akndiff:changeSet>` + `<akndiff:vote>`, y `<act>` final |
| **Bills del Senado** | Probado con S.5, S.269, S.331 — con y sin roll call votes |
| **Voice votes** | Genera amendments sin `<akndiff:vote>` cuando no hay roll call (ej: S.269) |
| **Bills enacted** | Timeline completa: Introduced → Senate Passage → House Passage → Public Law |
| **Ejecución parcial** | `--phase=N` permite reiniciar desde cualquier fase (útil si se agota el rate limit de la API) |
| **FRBR URIs correctas** | `/us/bill/{congress}/{type}/{number}/{code}` y `/us/pl/{congress}/{law}` |

### Lo que NO puede hacer (aún)

| Limitación | Por qué | Workaround |
|------------|---------|------------|
| **House bills (HR)** | No probado aún, pero la lógica soporta `hr` en teoría | Crear discovery.json manual y correr desde `--phase=2` |
| **Bills no-enacted** | Solo genera `act` final si `status === 'enacted'` | Funciona parcial: genera bill + amendments, sin act final |
| **Conference committees** | No modela el trámite de comisión de conferencia (cuando ambas cámaras aprueban versiones distintas) | — |
| **Enmiendas de piso individuales** | Solo compara versiones completas (IS→ES→ENR), no parsea enmiendas individuales | El diff detecta cambios pero los atribuye a la passage action, no a cada enmienda |
| **Parsear USLM XML** | Solo parsea Bill DTD (`<legis-body>`, `<section>`), no USLM (`<main>`, `<level>`) | Las versiones ENR/PLAW están disponibles también en Bill DTD |
| **Committee reports (CRPT)** | No descarga ni parsea informes de comisión | Se podría agregar como fase futura |
| **Congressional Record (debates)** | No integra transcripciones de debate | Fuera de scope actual |
| **Bills con títulos/divisiones** | Solo extrae `<section>` directas bajo `<legis-body>`, no secciones dentro de `<title>` o `<division>` | Bills grandes (ej: NDAA, reconciliación) necesitarían parseo recursivo |
| **Múltiples `legis-body`** | Algunos bills tienen múltiples bodies (ej: enmiendas complejas) | Solo parsea el primero |
| **DEMO_KEY rate limit** | 30 req/hora con DEMO_KEY — insuficiente para fase 1 (3 calls) si ya se consumieron | Obtener API key gratuita en [api.data.gov/signup](https://api.data.gov/signup/) o crear discovery.json manual |
| **Registro automático en viewer** | Después de generar, hay que agregar manualmente la entrada en `boletin-loader.ts` | El pipeline imprime la instrucción exacta al final |

### Bills probados

| Bill | Título | PL | Secciones | Changes | Votos |
|------|--------|----|-----------|---------|-------|
| S.5-119 | Laken Riley Act | 119-1 | 3 | 1 (IS→ES) | Senate 64-35 + House 263-156 |
| S.269-119 | Ending Improper Payments to Deceased People Act | 119-77 | 2 | 1 (IS→ES) | Voice votes (ambas cámaras) |
| S.331-119 | HALT Fentanyl Act | 119-26 | 7 | 4 (IS→ES) | Senate 84-16 + House 321-104 |
| S.1582-119 | GENIUS Act (Stablecoins) | 119-27 | 19→20 | 16 (PCS→ES) | Senate 68-30 + House 308-122 |

## Observaciones finales

- **EE.UU. es la jurisdicción más favorable para AKN Diff** gracias a USLM (derivado de AKN), APIs abiertas sin autenticación pesada, XML nativo, votos estructurados, y herramientas open-source existentes.
- El mayor desafío técnico es la dualidad Bill DTD / USLM y el carácter prose-based de las enmiendas.
- La alternativa más pragmática para diffs es comparar textos completos entre versiones (IH→RH→EH→ENR) en vez de intentar parsear instrucciones amendatorias.
- **Veredicto: MUY FACTIBLE** — infraestructura de datos superior a Chile/EU, con compatibilidad AKN nativa.

## Referencias y enlaces directos

### APIs oficiales

| Recurso | URL | Notas |
|---------|-----|-------|
| Congress.gov API (docs) | https://api.congress.gov/ | Documentación interactiva |
| Congress.gov API (GitHub) | https://github.com/LibraryOfCongress/api.congress.gov | Ejemplos, issues, changelog |
| Congress.gov API (Postman) | https://documenter.getpostman.com/view/6803158/VV56LCkZ | Colección Postman con todos los endpoints |
| GovInfo API (docs) | https://api.govinfo.gov/docs/ | Swagger/OpenAPI interactivo |
| GovInfo API (GitHub) | https://github.com/usgpo/api | Documentación técnica del API |
| GovInfo Developer Hub | https://www.govinfo.gov/developers | Portal para desarrolladores |
| Obtener API key | https://api.data.gov/signup/ | API key gratuita (funciona para Congress.gov y GovInfo) |

### Bulk Data y colecciones

| Recurso | URL | Notas |
|---------|-----|-------|
| GovInfo Bulk Data (índice) | https://www.govinfo.gov/bulkdata | Índice de todas las colecciones bulk |
| Bills en USLM (enrolled) | https://www.govinfo.gov/bulkdata/BILLS/uslm | Solo ENR/PLAW, 113th Congress+ |
| Bills en Bill DTD | https://www.govinfo.gov/bulkdata/BILLS | Todas las versiones, 103rd Congress+ |
| Bill Status XML | https://www.govinfo.gov/bulkdata/BILLSTATUS | Status/actions/amendments por bill |
| Congressional Record | https://www.govinfo.gov/bulkdata/CREC | Transcripciones diarias |
| Public Laws | https://www.govinfo.gov/app/collection/plaw | Colección de leyes públicas |
| US Code | https://www.govinfo.gov/app/collection/uscode | Código de EE.UU. compilado |
| Statutes at Large | https://www.govinfo.gov/app/collection/statute | Leyes por sesión del Congress |
| Committee Reports | https://www.govinfo.gov/app/collection/crpt | Informes de comisiones |
| Hearings | https://www.govinfo.gov/app/collection/chrg | Audiencias de comisiones |

### Votos nominales (XML directo, sin auth)

| Recurso | URL | Notas |
|---------|-----|-------|
| Senate roll call votes (índice) | https://www.senate.gov/legislative/LIS/roll_call_lists/vote_menu_119_1.htm | 119th Congress, 1st session |
| Senate vote XML (ejemplo) | https://www.senate.gov/legislative/LIS/roll_call_votes/vote1191/vote_119_1_00001.xml | Vote #1, 119th Congress |
| Senate XML availability | https://www.senate.gov/general/common/generic/XML_Availability.htm | Lista de todos los feeds XML |
| House roll call votes (índice) | https://clerk.house.gov/Votes | Portal de votos de la House |
| House vote XML (ejemplo) | https://clerk.house.gov/evs/2025/roll001.xml | Roll call #1, 2025 |
| House XML standards | https://xml.house.gov/ | Documentación de formatos XML |
| House document repository | https://docs.house.gov/ | Documentos de comisiones |

### Schemas XML

| Recurso | URL | Notas |
|---------|-----|-------|
| USLM schema (GitHub) | https://github.com/usgpo/uslm | Schema XSD + User Guide |
| USLM User Guide | https://github.com/usgpo/uslm/blob/main/USLM-User-Guide.md | Guía completa del formato |
| USLM Review Guide | https://github.com/usgpo/uslm/blob/main/USLM-2_0-Review-Guide-v2_0_12.md | Guía de revisión v2.0 |
| Bill DTD schema (GitHub) | https://github.com/usgpo/bill-dtd | DTD para versiones no-enrolled |
| Bill Status schema (GitHub) | https://github.com/usgpo/bill-status | Schema del BILLSTATUS XML |
| GovInfo Bulk Data guide (GitHub) | https://github.com/usgpo/bulk-data | Documentación de bulk data |
| Beta USLM XML info | https://www.govinfo.gov/features/beta-uslm-xml | Estado actual de USLM en GovInfo |

### Herramientas open-source

| Recurso | URL | Notas |
|---------|-----|-------|
| unitedstates/congress | https://github.com/unitedstates/congress | Scrapers Python (CC0) — bills, votes, text |
| unitedstates/congress wiki | https://github.com/unitedstates/congress/wiki | Documentación de los scrapers |
| congress-legislators | https://github.com/unitedstates/congress-legislators | YAML/JSON de todos los miembros 1789-presente |
| congress-data (ProPublica mirror) | https://github.com/unitedstates/congress-data | Datos pre-descargados |
| BillMap | https://github.com/unitedstates/BillMap | Relaciones entre bills |
| GovTrack.us | https://www.govtrack.us/ | Frontend + API sobre unitedstates/congress |
| GovTrack bulk data | https://www.govtrack.us/about-our-data | Información sobre datos disponibles |
| CourtListener API | https://www.courtlistener.com/api/rest/v4/ | API de opiniones judiciales (Free Law Project) |

### Documentación de referencia

| Recurso | URL | Notas |
|---------|-----|-------|
| Bill text version codes | https://www.congress.gov/help/field-values/bill-text-versions | Los 60+ códigos de versión explicados |
| Senate key to versions | https://www.senate.gov/legislative/KeytoVersionsofPrintedLegislation.htm | Explicación visual de versiones |
| GovInfo Congressional Bills help | https://www.govinfo.gov/help/bills | Guía de la colección BILLS |
| Congress.gov about legislation text | https://www.congress.gov/help/legislation-text | Cómo funciona el texto legislativo |
| GovInfo MCP Server (preview) | https://www.govinfo.gov/features/mcp-public-preview | MCP server para LLMs (2026) |
| Slip Laws in USLM (LOC blog) | https://blogs.loc.gov/law/2025/09/congress-gov-slip-laws-in-beta-uslm-are-now-available/ | Anuncio de slip laws en USLM |
| House roll call votes in API (LOC blog) | https://blogs.loc.gov/law/2025/05/introducing-house-roll-call-votes-in-the-congress-gov-api/ | Anuncio de votos House en API |

### Artículos y análisis

| Recurso | URL | Notas |
|---------|-----|-------|
| Xcential: Version Control for Law | https://xcential.com/resources/version-control-for-law-tracking-changes-in-the-u-s-congress | Sobre el Comparative Print Suite |
| POPVOX: Comparative Print Suite | https://www.popvox.org/futureproofing-congress-accomplishments/comparative-print-suite | Historia y logros del CPS |
| Data Foundation: Version Control | https://datafoundation.org/news/blogs/335/335-Version-Control-for-Law-Tracking-Changes-in-the-US-Congress | Análisis del tracking de cambios |
| LegiScan API | https://legiscan.com/legiscan | API alternativa (federal + estatal, freemium) |
| Akoma Ntoso (Wikipedia) | https://en.wikipedia.org/wiki/Akoma_Ntoso | Contexto del estándar internacional |
| OASIS LegalDocML TC | https://www.oasis-open.org/committees/tc_home.php?wg_abbrev=legaldocml | Comité técnico del estándar |

### Endpoints de ejemplo (listos para probar)

```bash
# Congress.gov API — buscar bills del 119th Congress
curl "https://api.congress.gov/v3/bill/119?api_key=YOUR_KEY&limit=5"

# Congress.gov API — detalle de un bill específico
curl "https://api.congress.gov/v3/bill/119/hr/1?api_key=YOUR_KEY"

# Congress.gov API — versiones de texto de un bill
curl "https://api.congress.gov/v3/bill/119/hr/1/text?api_key=YOUR_KEY"

# GovInfo API — buscar bills enrolled
curl "https://api.govinfo.gov/collections/BILLS/2025-01-01T00:00:00Z?offset=0&pageSize=10&congress=119&billVersion=enr&api_key=YOUR_KEY"

# GovInfo API — descargar XML de un bill específico
curl "https://api.govinfo.gov/packages/BILLS-119hr1enr/granules?api_key=YOUR_KEY"

# Senate vote XML (sin API key)
curl "https://www.senate.gov/legislative/LIS/roll_call_votes/vote1191/vote_119_1_00001.xml"

# House vote XML (sin API key)
curl "https://clerk.house.gov/evs/2025/roll001.xml"

# Congress-legislators (sin API key)
curl "https://theunitedstates.io/congress-legislators/legislators-current.json"
```
