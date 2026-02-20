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

## Observaciones

- Chile tiene una infraestructura de datos legislativos públicos excepcionalmente buena para AKN Diff. La API versionada de LeyChile y las APIs de votaciones nominales del Senado son las fuentes más valiosas.
- El mayor desafío es la extracción de texto desde PDFs del Senado (mociones, informes, oficios). Requiere regex o AI para identificar artículos.
- Los 3 tipos implementados (act, bill, amendment) cubren el flujo core: texto original → modificaciones con diff → ley promulgada + votos nominales.
- Los 3 tipos chilenos propios (informe, indicación, comparado) representan la mayor oportunidad de mejora: permiten responder quién propuso cada cambio y por qué.
- **Veredicto: FACTIBLE** — los tipos core funcionan al ~80% de cobertura y ~85% de completitud AKN.
