# dictamen — Reporte de Factibilidad Perú

> Documento emitido por una comisión ordinaria del Congreso que analiza un proyecto de ley y recomienda su aprobación (con o sin modificaciones), su rechazo, o su archivamiento. Equivalente funcional al "informe de comisión" chileno, pero con peso reglamentario propio en Perú: solo los proyectos con dictamen favorable pueden pasar al Pleno. Un proyecto puede acumular múltiples dictámenes si es derivado a más de una comisión. **No implementado** — evaluación basada en exploración de fuentes públicas.

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | Expediente Virtual (Lotus Notes) | [Expvirt_2021.nsf](https://www2.congreso.gob.pe/Sicr/TraDocEstProc/Expvirt_2021.nsf/) | HTML + PDF links | Comisión, fecha, sentido (favorable/desfavorable), link PDF | Mecánica compleja |
| 2 | spley-portal (2021+) | [wb2server.congreso.gob.pe/spley-portal](https://wb2server.congreso.gob.pe/spley-portal/) | SPA + PDF | Comisión, sentido, link a PDF dictamen | Mecánica compleja |
| 3 | PDF del dictamen (Alfresco) | Descarga via [spley-portal-service](https://wb2server.congreso.gob.pe/spley-portal-service/archivo/) o Alfresco | PDF (10-100 pág.) | Análisis, texto sustitutorio, votación comisión | AI + Humano |

**Escala de dificultad**: 0 (Ya AKN) · Mecánica simple · Mecánica compleja · AI simple · AI + Humano · No disponible

## Métricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---------------|--------------|-------------|----------------|
| Comisión emisora | Sí | Sí | Expediente Virtual / spley-portal |
| Fecha del dictamen | Sí | Sí | Expediente Virtual / spley-portal |
| Sentido (favorable/desfavorable/archivamiento) | Sí | Sí | Expediente Virtual / spley-portal |
| Texto sustitutorio (articulado propuesto) | Sí (PDF) | Parcial | PDF dictamen (fuente 3) |
| Análisis de la comisión | Sí (PDF) | No | PDF dictamen (fuente 3) |
| Votación en comisión | Parcial (PDF) | No | PDF dictamen, no sistematizado |
| Proyectos acumulados | Sí | Sí | Expediente Virtual |

- **Datos disponibles pero no aprovechados**: Análisis de la comisión (texto libre en PDF), votación en comisión (incluida en PDF pero sin formato estándar)
- **Cobertura**: ~20%

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|-----------|--------------|--------|
| Tipo documento (dictamen) | Sí | Hardcoded (extensión AKN Diff) |
| FRBR URIs | Sí | Número PL + comisión + fecha |
| `<preface>` (comisión, fecha, sentido) | Sí | Expediente Virtual metadatos |
| `<body>` texto sustitutorio | Parcial | PDF con AI parsing |
| Votación comisión | No | No sistematizada |
| Proyectos acumulados (referencias) | Sí | Expediente Virtual |

- **Completitud**: ~10%

## Observaciones

- En Perú, el **dictamen** tiene peso reglamentario: sin dictamen favorable de comisión, un proyecto no puede ser debatido en Pleno (salvo dispensa de trámite). Esto lo diferencia del informe de comisión chileno, que es más informativo.
- Un proyecto puede tener **múltiples dictámenes** de distintas comisiones. Si las comisiones discrepan (uno favorable, otro desfavorable), el Pleno decide. Los proyectos acumulados (sobre el mismo tema) se dictaminan juntos.
- El **texto sustitutorio** es la parte más valiosa del dictamen para AKN Diff: es el articulado que la comisión propone como versión modificada del proyecto original. Extraerlo requiere AI parsing del PDF para separarlo del análisis, antecedentes, opiniones técnicas, etc.
- La **votación en comisión** aparece en el PDF pero sin formato estándar — a veces como lista de miembros y su voto, a veces solo como "aprobado por unanimidad" o con conteo.
- El Expediente Virtual y spley-portal proveen metadatos confiables (comisión, fecha, sentido) pero el contenido sustantivo solo está en PDF. Los PDFs se descargan via el servicio Alfresco: `wb2server.congreso.gob.pe/service-alfresco/alfresko/detalle/preview/file?idDocument={uuid}`.
- Este es un tipo **Perú-específico** sin equivalente directo en Akoma Ntoso estándar. En AKN Diff se modelaría como extensión o como subtipo de `<doc>`.
- **Ejemplo**: Ley 32138 (Crimen Organizado) — dictámenes de Comisión de Justicia y Comisión de Defensa Nacional sobre 5 PLs acumulados. Ley 31814 (IA) — dictámenes favorables de 2 comisiones (Descentralización y Ciencia/Tecnología), aprobado 18-0-2 en comisión.
