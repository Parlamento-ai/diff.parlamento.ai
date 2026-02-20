# comparado — Reporte de Factibilidad Chile

> Documento multi-columna que muestra lado a lado las distintas versiones de un proyecto de ley a través de sus trámites. Típicamente 3-5 columnas: texto vigente, moción/mensaje, comisión, Senado, Cámara. Es el principal instrumento de trabajo para legisladores y asesores, y el equivalente funcional del "diff" que AKN Diff busca computar automáticamente. **No implementado** — el pipeline genera comparados computados, pero no parsea los comparados oficiales.

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | Documentos Senado (comparados) | [getDocto&iddocto=34824&tipodoc=compa](https://tramitacion.senado.cl/appsenado/index.php?mo=tramitacion&ac=getDocto&iddocto=34824&tipodoc=compa) | PDF | Columnas con versiones por trámite | AI + Humano |

**Escala de dificultad**: 0 (Ya AKN) · Mecánica simple · Mecánica compleja · AI simple · **AI + Humano** · No disponible

## Métricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---------------|--------------|-------------|----------------|
| Versiones lado a lado por trámite | Sí | No | PDF multi-columna |
| Diferencias entre versiones | Sí (implícito) | No | PDF (comparación visual) |
| Texto vigente pre-reforma | Sí | No (se usa LeyChile) | PDF primera columna |

- **Datos disponibles pero no aprovechados**: Todas las columnas del comparado oficial (se usa LeyChile + PDFs individuales en su lugar)
- **Cobertura**: 0% del comparado oficial utilizado

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|-----------|--------------|--------|
| N/A — no existe tipo AKN para comparado | — | — |

- **Completitud**: N/A

## Observaciones

- El comparado es **el documento que AKN Diff hace innecesario**. Hoy se produce manualmente (o semi-manualmente) como PDF tabular. El pipeline lo reemplaza por changeSets computados automáticamente.
- La ironía es que el comparado contiene exactamente los datos que necesitamos (versiones lado a lado), pero en el formato menos accesible posible (tablas en PDF).
- Para los 5 boletines procesados, el pipeline generó los comparados computados sin necesidad de parsear los PDFs oficiales — usando las fuentes directas (LeyChile JSON + PDFs de oficios individuales) en lugar del comparado consolidado.
- Si se logra parsear comparados oficiales de forma confiable, servirían como fuente de verdad para validar los changeSets computados. Pero la extracción tabular es el cuello de botella (dificultad "AI + Humano").
- No todos los boletines tienen comparado disponible. Se generan principalmente para proyectos grandes o en etapas avanzadas de tramitación.
