# Chile — Reporte de Factibilidad AKN Diff

> Chile tiene un proceso legislativo bicameral (Senado + Cámara de Diputados) con datos públicos accesibles vía APIs del Senado y LeyChile (BCN). Se evaluó la viabilidad de convertir estos datos a AKN Diff, procesando 5 boletines reales que cubren los 3 flujos principales del rito: moción simple, reforma a ley existente, y proceso con Comisión Mixta.

## Tipos AKN objetivo

| Tipo AKN | Uso en Chile | Estado | Reporte |
|----------|-------------|--------|---------|
| `act` | Ley vigente o versión histórica (LeyChile) | Implementado | [act.md](act.md) |
| `bill` | Proyecto de ley original (moción o mensaje) | Implementado | [bill.md](bill.md) |
| `amendment` | Trámite que modifica el texto + `changeSet` + `vote` | Implementado | [amendment.md](amendment.md) |
| `informe` | Informe de comisión (indicaciones votadas, articulado propuesto) | Parcial | [informe.md](informe.md) |
| `indicación` | Propuesta individual de modificación a un artículo | No implementado | [indicacion.md](indicacion.md) |
| `comparado` | Documento multi-columna con versiones lado a lado | No implementado | [comparado.md](comparado.md) |
| `debate` | Diario de Sesiones (transcripción de debates en Sala) | No implementado | [debate.md](debate.md) |
| `judgment` | Fallo del Tribunal Constitucional | No implementado | [judgment.md](judgment.md) |

## Fuentes de datos

| # | Fuente | Formato | Autenticación | Tipos que alimenta |
|---|--------|---------|---------------|-------------------|
| 1 | API Tramitación Senado | XML | Pública | amendment, act |
| 2 | API Votaciones Senado | XML | Pública | amendment |
| 3 | API Votaciones Cámara | XML | Pública | amendment |
| 4 | Documentos Senado (PDFs/DOCs) | PDF/DOC | Playwright (Cloudflare) | bill, amendment, informe, indicación, comparado |
| 5 | LeyChile JSON API (versionada) | JSON | Playwright (Cloudflare) | act, amendment |
| 6 | BCN datos.bcn.cl | AKN 2.0 XML | Pública | act (alternativa) |

## Métricas agregadas

### Cobertura del rito legislativo

| Tipo | Cobertura | Nota |
|------|-----------|------|
| act | ~80% | Texto + versiones + D.O. |
| bill | ~70% | Texto + articulado + autores |
| amendment | ~80% | Trámites + votos + changeSet |
| informe | ~20% | Solo articulado final (sin indicaciones individuales) |
| indicación | 0% | Datos disponibles, no implementado |
| comparado | 0% | Datos disponibles, extracción tabular difícil |
| debate | 0% | Datos disponibles, PDF sin estructura |
| judgment | 0% | Datos disponibles, sin API |

### Completitud AKN

| Tipo | Completitud | Nota |
|------|-------------|------|
| act | ~75% | Falta conclusions, attachments |
| bill | ~80% | Falta sections en algunos |
| amendment | ~90% | Casi completo |
| informe | ~15% | Solo articulado, sin indicaciones |
| indicación | 0% | — |
| comparado | N/A | No tiene equivalente AKN (lo reemplaza changeSet) |
| debate | 0% | — |
| judgment | 0% | — |

## Evidencia empírica

5 boletines reales procesados:

| Boletín | Tipo | Docs AKN | Particularidad |
|---------|------|----------|----------------|
| 15.480-13 (Ley 21.735) | Reforma | 6 + 5×7 = 41 | Reforma masiva, 5 leyes modificadas |
| 18.045 (historia) | Historia | 32 versiones | 44 años vía LeyChile API versionada |
| 15.995-02 (Ley 21.670) | Reforma | 5 | Reforma simple a Ley 17.798 |
| 17.370-17 | Moción | 2 | Rechazado en Sala (21-24) |
| 8924-07 (Ley 21.120) | Moción | 5 | Comisión Mixta |

## Pipeline CL — Capacidades y limitaciones

> Pipeline implementado en `pipeline/cl/`. Uso: `npx tsx pipeline/cl/process.ts <boletín> [--phase=N] [--out=DIR]`

### Lo que SÍ puede hacer

| Capacidad | Detalle |
|-----------|---------|
| **Descubrir metadata** | Consulta automática a API Tramitación + Votaciones del Senado: título, estado, trámites, documentos, votos nominales |
| **3 tipos de iniciativa** | Moción (ej: Boletín 17.370), Mensaje presidencial, y Reforma a ley existente (ej: Ley 21.735 → DL 3.500) |
| **Descargar fuentes** | PDFs/DOCs del Senado vía Playwright + JSON de LeyChile con versiones pre/post-reforma |
| **Extraer texto** | PDF (`pdf-parse`), DOC (`word-extractor`), DOCX (`mammoth`), HTML (tag stripping) |
| **Parsear artículos** | Regex para "Artículo N°", con soporte para artículos transitorios (`trans_N`) y numeración ordinal (primero→vigésimo) |
| **Extraer proyecto de ley** | Detecta "PROYECTO DE LEY:" dentro de informes de comisión, aislando el articulado del debate |
| **Parsear LeyChile JSON** | Extrae artículos del JSON versionado, limpia anotaciones inline ("LEY XXXX", "D.O.") |
| **Computar changeSets** | Diff artículo-a-artículo usando LCS (substitute, insert, repeal) entre cualquier par de versiones |
| **Votos nominales** | API Senado: nombre, si/no/abstención, resultado. Pareo con trámites (fecha exacta o ±30 días) |
| **Timeline automático** | Construye bill → amendment-1 (1er trámite) → amendment-2 (2do trámite) → ... → act-final |
| **Comisión Mixta** | Soporta trámites con comisión mixta como step adicional (ej: Ley 21.120) |
| **Votos rechazados** | `result="rejected"` cuando no > sí (ej: Boletín 17.370-17, 21-24) |
| **Reformas multi-norma** | Para una reforma como Ley 21.735, genera timelines independientes por cada norma modificada |
| **Ejecución parcial** | `--phase=N` permite reiniciar desde cualquier fase. Cada fase cachea su output en JSON |
| **Scoring de confianza** | El parser de artículos reporta confianza (0-1) y marca `needsReview` si < 0.7 |

### Lo que NO puede hacer (aún)

| Limitación | Por qué | Workaround |
|------------|---------|------------|
| **PDFs escaneados** | `pdf-parse` no hace OCR; devuelve texto vacío para imágenes | Requiere OCR externo previo (Tesseract, etc.) |
| **Comparados** | Layout multi-columna (2-5 cols) rompe el parser de artículos | Se omiten explícitamente; el changeSet ya cumple esa función |
| **Indicaciones individuales** | No parsea quién propuso cada cambio ni su votación individual | Datos disponibles en informes, pero no estructurados |
| **Diario de Sesiones (debates)** | PDFs sin estructura semántica; solo texto corrido | Fuera de scope actual |
| **Fallos del TC** | No hay API; PDFs del Tribunal Constitucional sin estructura | Se podría agregar como fase futura |
| **Artículos > vigésimo** | Mapa ordinal solo cubre primero→vigésimo (20) | Usa fallback a numeración secuencial |
| **Bills con formato inusual** | Algunos informes no tienen "PROYECTO DE LEY:" como delimitador | Cae al texto completo del documento (puede incluir debate) |
| **Cloudflare en LeyChile** | Requiere Playwright para bypassear protección | Agrega ~3s por request; no funciona con curl/fetch |
| **Quorum legislativo** | Resultado del voto es `si > no`, sin considerar quorum calificado | Suficiente para la mayoría de los casos |
| **Fase 2 interactiva** | Para reformas, el usuario debe ingresar idNorma, fechas pre/post manualmente | Se podría automatizar con LeyChile API |
| **Registro automático en viewer** | Después de generar, hay que agregar manualmente la entrada en `boletin-loader.ts` | El pipeline imprime la instrucción exacta al final |

### Boletines probados

| Boletín | Tipo | XMLs | Artículos | Changes | Votos |
|---------|------|------|-----------|---------|-------|
| 15.995-02 (Ley 21.670) | Reforma | 6 | ~6 por versión | Sí | Senado (unánime) |
| 17.370-17 | Moción | 2 | 4 | Sí | RECHAZADO 21-24 |
| 8924-07 (Ley 21.120) | Moción + Mixta | 6 | ~32 | Sí | Senado 22-18 |

## Observaciones

- Chile tiene una infraestructura de datos legislativos públicos excepcionalmente buena para AKN Diff. La API versionada de LeyChile y las APIs de votaciones nominales del Senado son las fuentes más valiosas.
- El mayor desafío es la extracción de texto desde PDFs del Senado (mociones, informes, oficios). Requiere regex o AI para identificar artículos.
- Los 3 tipos implementados (act, bill, amendment) cubren el flujo core: texto original → modificaciones con diff → ley promulgada + votos nominales.
- Los 3 tipos chilenos propios (informe, indicación, comparado) representan la mayor oportunidad de mejora: permiten responder quién propuso cada cambio y por qué.
- **Veredicto: FACTIBLE** — los tipos core funcionan al ~80% de cobertura y ~85% de completitud AKN.
