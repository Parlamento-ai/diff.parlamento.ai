# judgment — Reporte de Factibilidad Perú

> Sentencia del Tribunal Constitucional (TC) que declara la inconstitucionalidad de una ley o parte de ella. En Perú, el TC puede expulsar normas del ordenamiento jurídico (efecto erga omnes). Cuando declara inconstitucional uno o más artículos de una ley, produce un efecto equivalente a una derogación — relevante para reconstruir la historia de una norma. **No implementado** — evaluación basada en exploración de fuentes públicas.

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | Tribunal Constitucional (jurisprudencia) | [tc.gob.pe/jurisprudencia](https://tc.gob.pe/jurisprudencia/) | PDF (URLs predecibles) | Norma impugnada, artículos declarados inconstitucionales, decisión | AI + Humano |
| 2 | Buscador de jurisprudencia TC | [tc.gob.pe/jurisprudencia/search](https://tc.gob.pe/jurisprudencia/) | HTML | Índice por tipo de proceso, año, expediente | Mecánica compleja |

**Escala de dificultad**: 0 (Ya AKN) · Mecánica simple · Mecánica compleja · AI simple · AI + Humano · No disponible

## Métricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---------------|--------------|-------------|----------------|
| Número de expediente | Sí | No | Buscador TC (fuente 2) |
| Fecha de sentencia | Sí | No | Buscador TC (fuente 2) |
| Norma impugnada | Sí (PDF) | No | PDF sentencia (fuente 1) |
| Artículos declarados inconstitucionales | Sí (PDF) | No | PDF sentencia (fuente 1) |
| Fundamentos del fallo | Sí (PDF) | No | PDF sentencia (fuente 1) |
| Decisión (fundada/infundada/improcedente) | Sí (PDF) | No | PDF sentencia (fuente 1) |
| Votos singulares (magistrados) | Sí (PDF) | No | PDF sentencia (fuente 1) |

- **Datos disponibles pero no aprovechados**: Todos — la fuente existe pero no ha sido procesada
- **Cobertura**: 0%

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|-----------|--------------|--------|
| `<judgment>` type | No | — |
| FRBR URIs | No | — |
| `<header>` (expediente, fecha) | No | — |
| `<judgmentBody>` | No | — |
| `<decision>` | No | — |
| Referencia a norma impugnada | No | — |

- **Completitud**: 0%

## Observaciones

- Las URLs de sentencias del TC son **predecibles**: `tc.gob.pe/jurisprudencia/{year}/{expediente}.pdf`. Esto facilita la descarga masiva si se tiene el índice de expedientes.
- Las sentencias de **inconstitucionalidad** (procesos competenciales y acciones de inconstitucionalidad) son las relevantes para AKN Diff: cuando el TC declara inconstitucional un artículo, produce un efecto de derogación que modifica el estado vigente de la ley.
- El TC peruano publica todas sus sentencias como PDF. No hay API ni formato estructurado. El buscador web permite filtrar por tipo de proceso y año.
- Parsear sentencias del TC para extraer qué artículos de qué ley fueron declarados inconstitucionales requiere **AI + revisión humana**, ya que la redacción varía significativamente entre sentencias.
- Este tipo tiene **baja prioridad** para AKN Diff: las declaraciones de inconstitucionalidad son infrecuentes (~10-20 por año de leyes completas) y su efecto puede registrarse manualmente como un changeSet especial.
- El TC peruano actúa **post-promulgación** (control represivo/ex-post), no durante el trámite legislativo. Sus fallos no son parte del rito legislativo sino un control constitucional posterior.
- Existe un **buscador de jurisprudencia moderno** en `jurisprudencia.sedetc.gob.pe` (SPA Nuxt.js), más usable que el sitio principal pero igualmente sin API.
- **Ejemplo de URL**: `tc.gob.pe/jurisprudencia/2025/00008-2024-AI.pdf` — el formato es `{año_publicación}/{expediente}-{tipo}.pdf` donde tipos incluyen AI (Acción de Inconstitucionalidad), CC (Conflicto de Competencia), AA (Amparo), HC (Habeas Corpus).
