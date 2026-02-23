# judgment — Reporte de Factibilidad EE.UU.

> Opiniones de la Corte Suprema y decisiones judiciales que afectan la interpretación o validez de leyes. Fuera del scope legislativo directo pero relevante para el ciclo de vida completo de una norma. Equivalente al fallo del Tribunal Constitucional en Chile.

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | Supreme Court — Opinions | [supremecourt.gov/opinions/](https://www.supremecourt.gov/opinions/opinions.aspx) | PDF + HTML | Texto de opiniones, dissents, concurrences | AI simple |
| 2 | CourtListener (Free Law Project) | [courtlistener.com/api/rest/v4/](https://www.courtlistener.com/api/rest/v4/) | JSON + PDF | Opiniones de todas las cortes federales | Mecánica compleja |
| 3 | GovInfo — USCOURTS collection | [api.govinfo.gov/collections/USCOURTS](https://api.govinfo.gov/docs/) | PDF | Opiniones de cortes federales | AI + Humano |
| 4 | Congress.gov API — law | [api.congress.gov/v3/law](https://api.congress.gov/) | JSON | Leyes que han sido invalidadas | Mecánica simple |

**Escala de dificultad**: 0 (Ya AKN) · Mecánica simple · Mecánica compleja · AI simple · AI + Humano · No disponible

## Métricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---------------|--------------|-------------|----------------|
| Texto de la opinión | Sí | No | PDF / HTML |
| Resultado (affirm/reverse/vacate) | Sí | No | Metadata |
| Votos de los justices | Sí | No | Texto / Metadata |
| Ley cuestionada | Parcial | No | Requiere NLP/manual |
| Dissenting opinions | Sí | No | PDF / HTML |
| Concurring opinions | Sí | No | PDF / HTML |

- **Datos disponibles pero no aprovechados**: Todo — este tipo no está implementado
- **Cobertura**: ~30%

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|-----------|--------------|--------|
| `<judgment>` type | No | — |
| FRBR URIs | No | — |
| Partes (petitioner/respondent) | No | — |
| Opinión (majority) | No | — |
| Dissent | No | — |
| Dispositivo | No | — |

- **Completitud**: ~20%

## Observaciones

- **Fuera del scope del MVP de AKN Diff**. El producto core es tracking de cambios legislativos con votos nominales. Las decisiones judiciales son un complemento a largo plazo.
- **CourtListener** (Free Law Project) es la mejor fuente: API REST, 5M+ opiniones, datos abiertos. Pero requiere mapear opiniones a leyes afectadas, lo cual es un problema de NLP no trivial.
- **La Corte Suprema publica ~60-80 opiniones por term** (octubre-junio). Solo una fracción invalida o reinterpreta legislación federal.
- **Prioridad: Baja**. Invertir en act, bill y amendment primero. Judgment es un nice-to-have para una segunda fase avanzada.
- En Chile tampoco implementamos judgment (fallos TC), así que esto es consistente con la estrategia actual.
