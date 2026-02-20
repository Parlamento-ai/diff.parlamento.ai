# indicación — Reporte de Factibilidad Chile

> Propuesta formal de modificación a un artículo específico de un proyecto de ley, presentada por el Ejecutivo o por parlamentarios durante la tramitación en comisión. Las indicaciones se votan individualmente y su resultado se registra en el informe. Es el nivel más granular de cambio en el rito chileno. **No implementado** — datos disponibles dentro de informes de comisión.

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | Informe de comisión (dentro del PDF) | [getDocto&iddocto=27646&tipodoc=info](https://tramitacion.senado.cl/appsenado/index.php?mo=tramitacion&ac=getDocto&iddocto=27646&tipodoc=info) | PDF | Texto de cada indicación, autor, resultado | AI simple |
| 2 | Boletín de indicaciones del Ejecutivo | [getDocto&iddocto=34548&tipodoc=ofic](https://tramitacion.senado.cl/appsenado/index.php?mo=tramitacion&ac=getDocto&iddocto=34548&tipodoc=ofic) | PDF | Indicaciones del Ejecutivo (documento separado) | AI simple |

**Escala de dificultad**: 0 (Ya AKN) · Mecánica simple · Mecánica compleja · AI simple · AI + Humano · No disponible

## Métricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---------------|--------------|-------------|----------------|
| Texto de cada indicación | Sí | No | PDF informe / PDF indicaciones |
| Autor de la indicación | Sí | No | PDF informe |
| Artículo afectado | Sí | No | PDF informe |
| Resultado (aprobada/rechazada) | Sí | No | PDF informe |
| Votación en comisión por indicación | Sí | No | PDF informe |

- **Datos disponibles pero no aprovechados**: Todos (texto, autor, artículo afectado, resultado, votación en comisión)
- **Cobertura**: 0% (datos disponibles, no implementados)

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|-----------|--------------|--------|
| `<amendment>` o `<doc name="indicacion">` | No | — |
| Autor | No | PDF |
| Artículo target | No | PDF |
| Texto propuesto | No | PDF |
| Resultado votación comisión | No | PDF |

- **Completitud**: 0%

## Observaciones

- Las indicaciones son **el nivel más granular de cambio** en el rito chileno. Mientras que el `amendment` captura el resultado neto de un trámite (todos los cambios juntos), la indicación captura quién propuso cada cambio individual y si fue aceptado.
- La estructura es consistente: "N° X (del Y): Para [acción] el artículo Z... - Resultado". Parsing con regex es factible para ~80% de los casos.
- Para reformas grandes (Ley 21.735: 108 indicaciones), el Ejecutivo presenta las indicaciones como documento separado, lo que facilita la extracción.
- Implementar indicaciones como tipo permitiría responder: "¿Quién propuso este cambio?" y "¿Qué indicaciones fueron rechazadas?" — preguntas que hoy no se pueden responder con el pipeline.
- En AKN estándar, cada indicación podría representarse como un `<amendment>` individual. En AKN Diff, podría extenderse el `changeSet` para incluir `source="indicacion-N"` en cada `articleChange`.
