# observación — Reporte de Factibilidad Perú

> Observaciones formuladas por el Presidente de la República a una autógrafa de ley aprobada por el Congreso. El Ejecutivo tiene 15 días hábiles para observar total o parcialmente una ley. Si observa, el Congreso puede allanarse (aceptar las observaciones), insistir (con 2/3 de votos), o archivar. Equivalente funcional al "veto presidencial" en otros sistemas. **No implementado** — evaluación basada en exploración de fuentes públicas.

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | Expediente Virtual (Lotus Notes) | [Expvirt_2021.nsf](https://www2.congreso.gob.pe/Sicr/TraDocEstProc/Expvirt_2021.nsf/) | HTML + PDF links | Fecha observación, link PDF | Mecánica compleja |
| 2 | spley-portal (2021+) | [wb2server.congreso.gob.pe/spley-portal](https://wb2server.congreso.gob.pe/spley-portal/) | SPA + PDF | Estado "Observado por el PE", link PDF | Mecánica compleja |
| 3 | PDF de observaciones | Descarga via fuente 1 o 2 | PDF | Artículos observados, fundamentos, texto alternativo | AI + Humano |

**Escala de dificultad**: 0 (Ya AKN) · Mecánica simple · Mecánica compleja · AI simple · AI + Humano · No disponible

## Métricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---------------|--------------|-------------|----------------|
| Fecha de observación | Sí | Sí | Expediente Virtual / spley-portal |
| Tipo (total/parcial) | Parcial (PDF) | No | PDF observaciones |
| Artículos observados | Sí (PDF) | No | PDF observaciones (fuente 3) |
| Fundamentos del Ejecutivo | Sí (PDF) | No | PDF observaciones (fuente 3) |
| Texto alternativo propuesto | Parcial (PDF) | No | PDF observaciones (fuente 3) |
| Respuesta del Congreso (allanamiento/insistencia) | Sí | Sí | Expediente Virtual |

- **Datos disponibles pero no aprovechados**: Fundamentos del Ejecutivo, texto alternativo propuesto (en PDF no estructurado)
- **Cobertura**: ~15%

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|-----------|--------------|--------|
| Tipo documento (observación) | Sí | Hardcoded (extensión AKN Diff) |
| FRBR URIs | Sí | Número PL + fecha observación |
| `<preface>` (fecha, PL observado) | Sí | Expediente Virtual metadatos |
| `<body>` artículos observados | No | Solo en PDF |
| Texto alternativo propuesto | No | Solo en PDF |
| Resultado (allanamiento/insistencia/archivo) | Sí | Expediente Virtual |

- **Completitud**: ~10%

## Observaciones

- Las observaciones presidenciales son relativamente **infrecuentes**: ~5-10% de las leyes aprobadas son observadas. Cuando ocurren, son políticamente significativas y generan un trámite adicional completo.
- La **observación parcial** es la más interesante para AKN Diff: el Ejecutivo identifica artículos específicos que objeta y a veces propone texto alternativo. Esto mapea directamente a un `akndiff:changeSet` si se puede parsear el PDF.
- El tracking de observaciones está en el Expediente Virtual / spley-portal como un estado del proyecto ("Observado por el Poder Ejecutivo"), pero el contenido sustantivo solo existe en PDF.
- Para modelar en AKN Diff, una observación genera potencialmente 2 amendments adicionales: (1) la observación del Ejecutivo (cambios propuestos al texto) y (2) la respuesta del Congreso (allanamiento = acepta cambios, insistencia = rechaza y mantiene texto original).
- Este es un tipo **Perú-específico** sin equivalente directo en Akoma Ntoso estándar. Se modelaría como extensión de `<doc>` con referencia al `<bill>` observado.
- El procedimiento post-observación tiene 3 salidas posibles: allanamiento (Congreso acepta), insistencia (requiere 2/3 del número legal de congresistas = 87 votos), o archivo.
- **Ejemplo**: Ley 32195 (Cáñamo Industrial) — observada por el Ejecutivo en agosto 2024 citando riesgos de narcotráfico e impacto fiscal; Congreso aprobó por insistencia 82-4-6 en diciembre 2024; promulgada por el Congreso (no el Ejecutivo). Ley 32179 (Personal EsSalud) — observada; primera votación de insistencia **falló**; se pidió reconsideración; segunda votación de insistencia aprobó 87-1-11. Este es el caso más complejo procedimentalmente.
