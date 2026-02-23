# act — Reporte de Factibilidad EE.UU.

> Public Law o sección del US Code. Resultado final del proceso legislativo: un bill firmado por el Presidente se convierte en Public Law y luego se codifica en el US Code. Equivalente al `act` de Chile (ley vigente vía LeyChile).

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | GovInfo — PLAW collection | [api.govinfo.gov/collections/PLAW](https://www.govinfo.gov/app/collection/plaw) | USLM XML | Texto completo, estructura jerárquica, preámbulo | Mecánica simple |
| 2 | GovInfo — Slip Laws (USLM) | [govinfo.gov/bulkdata/PLAW/uslm](https://www.govinfo.gov/bulkdata) | USLM XML | Texto completo Public Law | Mecánica simple |
| 3 | GovInfo — US Code | [api.govinfo.gov/collections/USCODE](https://www.govinfo.gov/app/collection/uscode) | XML | Texto codificado por título/sección | Mecánica simple |
| 4 | Congress.gov API — law endpoint | [api.congress.gov/v3/law/{congress}](https://api.congress.gov/) | JSON | Metadatos: número, fecha, bill de origen | Mecánica simple |
| 5 | GovInfo — Statutes at Large | [govinfo.gov/bulkdata/STATUTE](https://www.govinfo.gov/app/collection/statute) | USLM XML (108th+) | Texto histórico pre-codificación | Mecánica simple |

**Escala de dificultad**: 0 (Ya AKN) · Mecánica simple · Mecánica compleja · AI simple · AI + Humano · No disponible

## Métricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---------------|--------------|-------------|----------------|
| Texto completo Public Law | Sí | Sí | USLM XML (113th Congress+) |
| Estructura jerárquica (title/section/subsection) | Sí | Sí | USLM `<main>` hierarchy |
| Versiones históricas US Code | Sí | Sí | USCODE XML por año |
| Preámbulo / enacting formula | Sí | Sí | USLM `<preface>` + `<enactingFormula>` |
| Fecha de promulgación | Sí | Sí | Congress.gov API / USLM metadata |
| Número de Public Law | Sí | Sí | Congress.gov API |
| Bill de origen | Sí | Sí | Congress.gov API |
| Short title | Sí | Sí | USLM `<shortTitle>` |

- **Datos disponibles pero no aprovechados**: Statutes at Large históricos (pre-2003), signing statements
- **Cobertura**: ~90%

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|-----------|--------------|--------|
| `<act>` type | Sí | USLM `<lawDoc>` → mapeo directo |
| FRBR URIs | Sí | Public Law number + date |
| FRBRauthor | Sí | Congress.gov (bill sponsor) |
| `<preface>` docTitle | Sí | USLM `<longTitle>` / `<shortTitle>` |
| `<preface>` enactingFormula | Sí | USLM `<enactingFormula>` |
| `<body>` sections (eId, heading, content) | Sí | USLM hierarchy directo |
| `<body>` articles | Sí | USLM `<section>` con `identifier` |
| `<conclusions>` | Parcial | USLM `<signatures>` (si existe) |
| `<attachments>` | No | Schedules/appendices (raro en US) |

- **Completitud**: ~85%

## Observaciones

- **USLM es quasi-AKN**: La conversión es casi directa. `<main>` → `<body>`, `<section>` → `<article>`, `<heading>` → `<heading>`, `<content>` → `<content>`. Los `identifier` de USLM usan paths (`/us/usc/t5/s101`) que mapean limpiamente a `eId` de AKN.
- Public Laws en USLM disponibles desde el **113th Congress (2013-2014)** — 12+ años de cobertura.
- Statutes at Large en USLM desde el **108th Congress (2003-2004)** — 22+ años.
- El US Code se publica en XML con actualizaciones anuales, permitiendo reconstruir el historial de cualquier sección (equivalente a la API versionada de LeyChile, pero por año en vez de por fecha exacta).
- **No requiere Playwright ni bypass de CloudFront**: API keys gratuitas, XML directo.
- Volumen: ~300-600 Public Laws por Congress (2 años). Manejable.
- Esta es la fuente más directa y de menor fricción para AKN Diff de todas las jurisdicciones evaluadas.
