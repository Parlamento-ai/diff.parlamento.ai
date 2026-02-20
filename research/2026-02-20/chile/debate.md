# debate — Reporte de Factibilidad Chile

> Registro textual de los debates en Sala (Senado y Cámara). Contiene las intervenciones de cada parlamentario sobre un proyecto de ley. Se publica como "Diario de Sesiones". **No implementado** — PDFs disponibles para todas las sesiones.

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | Diario de Sesiones Senado | [diario.senado.cl](https://www.senado.cl/appsenado/index.php?mo=sesionessala&ac=getDetalleSesiones) | PDF | Intervenciones textuales, speakers, votaciones | AI + Humano |
| 2 | TV Senado (transcripciones) | [tv.senado.cl](https://tv.senado.cl) | Video/HTML | Audio/video de sesiones | No disponible |

**Escala de dificultad**: 0 (Ya AKN) · Mecánica simple · Mecánica compleja · AI simple · **AI + Humano** · No disponible

## Métricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---------------|--------------|-------------|----------------|
| Transcripción completa del debate | Sí | No | PDF (Diario de Sesiones) |
| Identificación del speaker | Sí | No | PDF (formato "El señor X.-") |
| Contexto de la intervención | Sí | No | PDF |
| Votaciones fundamentadas | Sí | No | PDF |

- **Datos disponibles pero no aprovechados**: Transcripciones completas, identificación de speakers, contexto de intervenciones, fundamentación de votos
- **Cobertura**: 0% utilizado (100% disponible)

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|-----------|--------------|--------|
| `<debate>` type | No | — |
| `<debateBody>` | No | — |
| `<debateSection>` por tema | No | PDF sections |
| `<speech>` por intervención | No | PDF speaker blocks |
| `<from>` speaker | No | PDF names |

- **Completitud**: 0%

## Observaciones

- El Diario de Sesiones es un PDF semi-estructurado. Las intervenciones se identifican por el patrón "El señor/La señora APELLIDO.-" seguido del texto.
- La conversión sería "AI + Humano" porque los PDFs tienen formato inconsistente: interrupciones, notas al margen, votaciones intercaladas, puntos de orden, y texto no segmentado por tema.
- No es parte directa del flujo bill → amendment → act. Agrega contexto sobre qué dijo cada parlamentario y sus fundamentos de voto.
- TV Senado tiene video de sesiones, pero no transcripciones estructuradas.
