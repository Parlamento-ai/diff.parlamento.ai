# Spain — Reportes de Factibilidad AKN

Reportes de factibilidad para implementar el pipeline de Espana (`pipeline/es/`), siguiendo la misma estructura que los reportes de EU en `research/2026-02-20/eu/`.

## Resumen

| Tipo AKN | Dificultad Track A | Dificultad Track B | Estado |
|---|---|---|---|
| [act](act.md) | Mecanica simple | N/A | No implementado |
| [amendment](amendment.md) | Mecanica simple | AI simple (PDFs) | No implementado |
| [bill](bill.md) | Mecanica simple (1ra version BOE) | AI simple (PDFs BOCG) | No implementado |
| [communication](communication.md) | Mecanica simple | Mecanica compleja | No implementado |
| [debate](debate.md) | N/A | AI simple (PDFs Diario Sesiones) | No implementado |
| [doc](doc.md) (vote, informes) | Mecanica simple (votaciones) | AI simple (informes PDF) | No implementado |
| [documentCollection](documentCollection.md) | Mecanica simple | Mecanica simple | No implementado |
| [judgment](judgment.md) | Mecanica simple (deteccion via BOE) | Mecanica compleja (texto completo) | No implementado |
| [officialGazette](officialGazette.md) | Mecanica simple (BOE sumario API) | N/A | No implementado |
| [question](question.md) | Mecanica simple (metadatos) | Mecanica compleja (texto completo) | No implementado |

## Track A vs Track B

**Track A — Diffs de versiones consolidadas**:
- Fuente unica: BOE API
- Dificultad: Mecanica simple para todos los tipos
- Cubre: como una ley cambio a lo largo del tiempo via reformas sucesivas

**Track B — Journey parlamentario completo**:
- Fuentes multiples: BOE + Congreso + Senado + BOCG PDFs
- Dificultad: Mecanica simple a AI simple segun el tipo
- Cubre: texto original -> enmiendas -> votaciones -> ley final

## Verificacion de fuentes (2026-02-23)

| Fuente | Metodo | Status |
|---|---|---|
| BOE API legislacion-consolidada (6 endpoints) | curl + `Accept: application/xml` | **200 OK** — todos funcionales |
| BOE API sumario diario | curl + `Accept: application/xml` | **200 OK** |
| BOCG PDFs (Serie D) | curl + user-agent navegador | **200 OK** (`application/pdf`) |
| Congreso Open Data | curl + user-agent navegador | **200 OK** (403 sin UA) |
| Senado Open Data | curl + user-agent | **403** — solo accesible via navegador |
| BOE art92 Codigo Civil (5 versiones + sentencia TC) | curl | **200 OK** — `<blockquote class="noDesde99999999">` verificado |

**Nota**: BOE API solo soporta `Accept: application/xml`. JSON retorna 400.

## Recomendacion

Implementar Track A primero. Es el mas favorable de las tres jurisdicciones (Chile, EU, Espana) porque el BOE ya entrega versionado nativo por articulo.

## Documento de implementacion

Ver [spain-pipeline-implementation.md](../spain-pipeline-implementation.md) para la guia completa de implementacion incluyendo arquitectura, estructura XML del BOE, mapeo a AKN, y leyes candidatas.
