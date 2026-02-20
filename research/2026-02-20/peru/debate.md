# debate — Reporte de Factibilidad Perú

> Transcripción de los debates en el Pleno del Congreso (Diario de los Debates). Registra las intervenciones de los congresistas durante la discusión de proyectos de ley, mociones, cuestiones de orden, etc. **No implementado** — evaluación basada en exploración de fuentes públicas.

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | Diario de los Debates (Congreso) | [www2.congreso.gob.pe/sicr/diariodebates](https://www2.congreso.gob.pe/Sicr/DiarioDebates/Publicad.nsf) | PDF | Intervenciones, congresistas, fecha, tema | AI + Humano |

**Escala de dificultad**: 0 (Ya AKN) · Mecánica simple · Mecánica compleja · AI simple · AI + Humano · No disponible

## Métricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---------------|--------------|-------------|----------------|
| Texto transcripción sesión | Sí (PDF) | No | PDF Diario Debates |
| Identificación congresista por intervención | Sí (PDF) | No | PDF Diario Debates |
| Fecha y número de sesión | Sí | No | Índice Lotus Notes (fuente 1) |
| Proyecto(s) debatido(s) | Sí (PDF) | No | PDF Diario Debates |
| Orden del día | Sí (PDF) | No | PDF Diario Debates |

- **Datos disponibles pero no aprovechados**: Todos — la fuente existe pero requiere procesamiento complejo de PDFs sin estructura
- **Cobertura**: 0%

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|-----------|--------------|--------|
| `<debate>` type | No | — |
| FRBR URIs | No | — |
| `<debateBody>` | No | — |
| `<debateSection>` por tema | No | — |
| `<speech>` por intervención | No | — |
| `<from>` (congresista) | No | — |

- **Completitud**: 0%

## Observaciones

- El Diario de los Debates es publicado como **PDFs extensos** (100-500+ páginas por sesión) sin estructura legible por máquina. El formato es texto corrido con convenciones tipográficas (nombre del congresista en mayúsculas, guiones para separar intervenciones).
- El índice de debates está en **Lotus Notes** con URLs al estilo `Publicad.nsf/{hash}`, que permite navegar por período y sesión, pero el contenido siempre es PDF.
- Parsear debates requeriría **AI + heurísticas** para: (1) segmentar intervenciones por congresista, (2) identificar qué proyecto se está debatiendo, (3) distinguir entre debate sustantivo, cuestiones de orden, y procedimiento.
- **Baja prioridad** para AKN Diff: el debate no modifica el texto del proyecto (eso lo hace la votación/amendment). Sin embargo, tiene valor para transparencia y análisis político.
- Hay transmisión en vivo del Pleno via el canal del Congreso (TV Congreso), pero no se genera transcripción automática ni subtítulos reutilizables.
- También existe la **Agenda Documentada del Pleno** (`wb2server.congreso.gob.pe/adp-portal/`) que contiene los documentos previos a cada sesión — más estructurada que el Diario de los Debates pero sin transcripción.
