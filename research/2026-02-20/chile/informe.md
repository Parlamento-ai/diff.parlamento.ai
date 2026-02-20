# informe — Reporte de Factibilidad Chile

> Informe de comisión: documento central del rito legislativo chileno. Producido por una comisión parlamentaria, contiene el articulado modificado tras discusión de indicaciones, las constancias de la votación en comisión, y la recomendación a Sala. **Parcialmente implementado** — se usa como fuente de artículos para amendment, pero no como tipo AKN independiente.

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | Documentos Senado | [getDocto&iddocto=27646&tipodoc=info](https://tramitacion.senado.cl/appsenado/index.php?mo=tramitacion&ac=getDocto&iddocto=27646&tipodoc=info) | PDF | Articulado propuesto, indicaciones votadas, constancias | AI simple |

**Escala de dificultad**: 0 (Ya AKN) · Mecánica simple · Mecánica compleja · AI simple · AI + Humano · No disponible

## Métricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---------------|--------------|-------------|----------------|
| Articulado aprobado por comisión | Sí | Sí (como input para amendment) | PDF (sección "Texto aprobado") |
| Indicaciones con resultado | Sí | No | PDF (sección "Indicaciones") |
| Votación en comisión | Sí | No | PDF (dentro de cada indicación) |
| Discusión/debate en comisión | Sí | No | PDF (sección "Discusión") |
| Constancias (quiénes asistieron, quórum) | Sí | No | PDF (encabezado) |

- **Datos disponibles pero no aprovechados**: Indicaciones individuales, votación en comisión, discusión, constancias
- **Cobertura**: ~20% (solo el articulado final, no el detalle del proceso en comisión)

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|-----------|--------------|--------|
| `<doc name="informe">` type | No (se absorbe en amendment) | — |
| FRBR URIs | No | iddocto + boletín |
| Articulado aprobado | Sí (via amendment) | PDF |
| Lista de indicaciones | No | PDF |
| Resultado por indicación | No | PDF |
| Votación en comisión | No | PDF |

- **Completitud**: ~15% como tipo independiente (el articulado se captura, el resto no)

## Observaciones

- El informe de comisión es **el documento más importante del rito chileno que no tiene tipo AKN propio**. Contiene toda la información del trabajo en comisión: qué se propuso, qué se aprobó, con qué votos.
- Actualmente se usa como "fuente muda": se extrae el articulado final para construir el amendment, pero se pierde todo el detalle de indicaciones, votaciones en comisión, y discusión.
- La estructura de los informes es consistente (encabezado, antecedentes, discusión, indicaciones, discusión en particular, texto aprobado), lo que hace factible el parsing con regex + AI.
- Implementar este tipo permitiría rastrear no solo QUÉ cambió, sino POR QUÉ cambió y QUIÉN lo propuso — a nivel de comisión, no solo de Sala.
- Verificado con 4 informes: 17.370-17 (4 indicaciones), 15.480-13 (108 indicaciones), 15.995-02, 8924-07.
