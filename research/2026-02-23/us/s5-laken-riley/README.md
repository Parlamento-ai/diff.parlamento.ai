# S.5 — Laken Riley Act (Public Law 119-1) — PoC Pipeline

> Primer bill convertido en ley del 119th Congress. Elegido como proof-of-concept por tener roll call votes en ambas cámaras y cambios detectables entre versiones.

## Datos del bill

| Campo | Valor |
|-------|-------|
| Bill | S. 5 |
| Title | Laken Riley Act |
| Public Law | 119-1 |
| Sponsor | Sen. Katie Britt (R-AL) |
| Introduced | 2025-01-07 |
| Signed | 2025-01-29 |
| Tema | Detención de inmigrantes acusados de robo/asalto |

## Versiones descargadas

| # | Archivo | Versión | Formato | Fecha | Fuente |
|---|---------|---------|---------|-------|--------|
| 1 | `01-pcs-placed-calendar.xml` | Placed on Calendar Senate (PCS) | Bill DTD | 2025-01-07 | congress.gov |
| 2 | `02-es-engrossed.xml` | Engrossed in Senate (ES) | Bill DTD | 2025-01-20 | congress.gov |
| 3 | `03-enr-enrolled.xml` | Enrolled (ENR) | Bill DTD | 2025-01-29 | congress.gov |
| 4 | `04-plaw-uslm.xml` | Public Law 119-1 | USLM | 2025-01-29 | congress.gov |

## Votos descargados

| Archivo | Cámara | Vote # | Resultado | Yea | Nay | Fecha |
|---------|--------|--------|-----------|-----|-----|-------|
| `vote-senate-007.xml` | Senate | 7 | Passed | 64 | 35 | 2025-01-20 |
| `vote-house-023.xml` | House | 23 | Passed | 263 | 156 | 2025-01-22 |

### Desglose por partido

**Senate (64-35)**:
- Republican: 52 Yea, 0 Nay
- Democrat: 12 Yea, 33 Nay
- Independent: 0 Yea, 2 Nay

**House (263-156)**:
- Republican: 217 Yea, 0 Nay, 1 Not Voting
- Democratic: 46 Yea, 156 Nay, 13 Not Voting

## Diff entre versiones

### PCS → ES (Enmienda del Senado)
- **3 secciones** en ambas versiones (Short title, Detention, Enforcement)
- Cambio principal: Se agregó **"assault"** a la lista de delitos
  - PCS: `"theft, larceny, or shoplifting offense"`
  - ES: `"theft, larceny, shoplifting, or assault of a law enforcement officer"`
- Body text: 7,127 → 7,308 chars (+181 chars)
- Word count: 1,186 → 1,217 (+31 words)

### ES → ENR (Sin cambios sustantivos)
- Body text idéntico (7,308 chars)
- Solo diferencias en metadata/form (session, attestation)

### Bill DTD vs USLM (ENR vs PLAW)
- ENR usa Bill DTD: `<legis-body>`, `<section>`, `<enum>`, `<header>`, `<text>`
- PLAW usa USLM: `<main>`, `<section identifier="...">`, `<num>`, `<heading>`, `<content>`
- USLM incluye `<amendingAction type="amend/delete/insert">` tags
- USLM incluye `<ref href="/us/usc/t8/s1226/c">` references
- USLM incluye `<legislativeHistory>` con timeline

## Observaciones

1. **Pipeline completo verificado**: bill text + votes de ambas cámaras, todo descargable sin Playwright
2. **El diff entre PCS→ES es real y detectable**: la enmienda del Senado agregó "assault" — exactamente el tipo de cambio que AKN Diff visualizaría
3. **El formato USLM incluye acciones amendatorias estructuradas** (`<amendingAction>`) — esto es información que no existe en el Bill DTD
4. **Los 99 senadores y 433 representantes están en el XML de votos** con nombre, partido y estado
5. S.5 fue un bill relativamente simple (3 secciones). Para probar el pipeline con algo más complejo, usar H.R. 1 (reconciliation bill) o la NDAA
