# bill — Reporte de Factibilidad Perú

> Proyecto de Ley presentado al Congreso de la República. Puede ser de origen parlamentario (iniciativa legislativa de congresistas), del Ejecutivo (proyecto de ley del Presidente), o de instituciones como el Poder Judicial o Defensoría del Pueblo. El texto del proyecto incluye exposición de motivos, fórmula legal (articulado) y análisis costo-beneficio. **No implementado** — evaluación basada en exploración de fuentes públicas.

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | spley-portal (tracking PLs, 2021+) | [wb2server.congreso.gob.pe/spley-portal](https://wb2server.congreso.gob.pe/spley-portal/) | SPA + JSON (no documentado) | Metadatos PL, estado, comisión, autores, PDF descarga | Mecánica compleja |
| 2 | Expediente Virtual (Lotus Notes) | [Expvirt_2021.nsf](https://www2.congreso.gob.pe/Sicr/TraDocEstProc/Expvirt_2021.nsf/) | HTML (Lotus Notes/Domino) | Tracking completo, links a documentos, historial | Mecánica compleja |
| 3 | Archivo Digital del Congreso | [leyes.congreso.gob.pe](https://leyes.congreso.gob.pe/ProyectosLey.aspx) | PDF | Texto del proyecto de ley (fórmula legal) | AI simple |

**Escala de dificultad**: 0 (Ya AKN) · Mecánica simple · Mecánica compleja · AI simple · AI + Humano · No disponible

## Métricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---------------|--------------|-------------|----------------|
| Número de proyecto de ley | Sí | Sí | spley-portal / Expediente Virtual |
| Autores (congresistas o institución) | Sí | Sí | spley-portal / Expediente Virtual |
| Fecha de presentación | Sí | Sí | spley-portal / Expediente Virtual |
| Comisión(es) asignada(s) | Sí | Sí | spley-portal / Expediente Virtual |
| Estado actual del PL | Sí | Sí | spley-portal / Expediente Virtual |
| Texto del articulado (fórmula legal) | Sí (PDF) | Sí | PDF (fuente 3) |
| Exposición de motivos | Sí (PDF) | No | PDF (fuente 3) |
| Análisis costo-beneficio | Sí (PDF) | No | PDF (fuente 3) |
| Efecto de la vigencia en legislación nacional | Sí (PDF) | No | PDF (fuente 3) |

- **Datos disponibles pero no aprovechados**: Exposición de motivos, análisis costo-beneficio, efecto de vigencia (incluidos en el PDF pero no parseados a AKN)
- **Cobertura**: ~30%

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|-----------|--------------|--------|
| `<bill>` type | Sí | Hardcoded |
| FRBR URIs | Sí | Número PL + fecha presentación |
| `<preface>` docTitle | Sí | spley-portal / Expediente Virtual |
| `<preamble>` (exposición de motivos) | No | Solo en PDF |
| `<body>` articles (eId, heading, content) | Parcial | PDF con AI parsing |
| `<conclusions>` | No | — |
| Autores / proponentes | Sí | spley-portal metadatos |

- **Completitud**: ~25%

## Observaciones

- El **spley-portal** (2021+) es una SPA Angular que carga datos via XHR. Su API backend no está documentada pero podría reverse-engineerarse via DevTools. El endpoint `/archivo/{base64}/pdf` permite descargar PDFs de proyectos. Si se descubre la API de metadatos, la cobertura mejoraría significativamente.
- El **Expediente Virtual** (Lotus Notes/Domino) tiene bases por período legislativo: `Expvirt_2021.nsf` (2021-2026), `Expvirt_2016.nsf` (2016-2021), etc. Lotus Notes/Domino soporta `?ReadViewEntries&outputformat=json` — si funciona, daría datos estructurados sin scraping HTML.
- El **articulado** del proyecto está embebido en PDFs de 10-200 páginas. Extraer la "fórmula legal" (sección con el texto del articulado) requiere AI parsing para separar de la exposición de motivos, análisis costo-beneficio, etc. El proyecto completo es un solo PDF que mezcla articulado con justificación.
- Los PDFs de proyectos se descargan via el servicio Alfresco del Congreso: `wb2server.congreso.gob.pe/spley-portal-service/archivo/{base64_id}/pdf` (también disponible en `api.congreso.gob.pe`).
- **Ejemplo**: PL 2775/2022-CR (Ley 31814, Inteligencia Artificial) — proyecto simple, 1 autor, 5 artículos. PL 9055/2024-CR + 4 PLs más (Ley 32138, Crimen Organizado) — 5 proyectos consolidados de múltiples bancadas, ejemplo de acumulación legislativa.
