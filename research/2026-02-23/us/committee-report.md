# committee-report — Reporte de Factibilidad EE.UU.

> Informes de comisión que acompañan bills reportados al piso. Contienen la recomendación de la comisión, análisis sección por sección, votos en comisión (cuando los hay), y minority views. Equivalente funcional al `informe` de comisión de Chile.

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | GovInfo — CRPT collection | [api.govinfo.gov/collections/CRPT](https://www.govinfo.gov/app/collection/crpt) | XML + HTML + PDF | Texto del informe, análisis sección por sección | Mecánica compleja |
| 2 | Congress.gov API — committee-report | [api.congress.gov/v3/committee-report/](https://api.congress.gov/) | JSON | Metadatos: número, fecha, comisión, bill asociado | Mecánica simple |
| 3 | Congress.gov API — committee | [api.congress.gov/v3/committee](https://api.congress.gov/) | JSON | Lista de comisiones, membresía | Mecánica simple |
| 4 | GovInfo — CHRG (hearings) | [api.govinfo.gov/collections/CHRG](https://www.govinfo.gov/app/collection/chrg) | XML + PDF | Audiencias de comisión | AI simple |
| 5 | Congress.gov API — committee-meeting | [api.congress.gov/v3/committee-meeting](https://api.congress.gov/) | JSON | Reuniones y markups programados | Mecánica simple |

**Escala de dificultad**: 0 (Ya AKN) · Mecánica simple · Mecánica compleja · AI simple · AI + Humano · No disponible

## Métricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---------------|--------------|-------------|----------------|
| Texto del informe de comisión | Sí | Parcial | CRPT XML/HTML |
| Análisis sección por sección | Sí | No | Texto dentro del informe |
| Votos en comisión (roll call) | Parcial | No | Texto dentro del informe (no estructurado) |
| Minority views | Sí | No | Sección del informe |
| Comisión responsable | Sí | Sí | Congress.gov API |
| Miembros de la comisión | Sí | Sí | Congress.gov API |
| Bill asociado | Sí | Sí | Congress.gov API |
| CBO cost estimate | Sí | No | Enlace desde el informe |
| Conference reports | Sí | Parcial | CRPT type "conference" |

- **Datos disponibles pero no aprovechados**: Análisis sección por sección, minority views, CBO estimates
- **Cobertura**: ~60%

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|-----------|--------------|--------|
| `<doc>` type (informe) | Sí | CRPT metadata |
| FRBR URIs | Sí | Report number + Congress |
| Comisión (TLCOrganization) | Sí | Congress.gov API |
| Bill referenciado | Sí | Congress.gov API |
| Texto del informe | Parcial | CRPT XML (no completamente estructurado) |
| Votos en comisión | No (estructurado) | Solo en texto del informe |
| Recomendación | Parcial | Header del informe |

- **Completitud**: ~50%

## Tipos de Committee Reports

| Tipo | Código | Descripción |
|------|--------|-------------|
| House Report | H.Rpt. | Informe de comisión de la House |
| Senate Report | S.Rpt. | Informe de comisión del Senado |
| Conference Report | H.Rpt. (conference) | Informe de la conference committee |
| Executive Report | S.Exec.Rpt. | Informe sobre nominaciones o tratados |

## Observaciones

- **Los committee reports son documentos de texto largo** sin estructura semántica fina en XML. Similar a los informes de comisión en Chile (PDFs), pero con la ventaja de que al menos están en XML/HTML.
- **Votos en comisión NO están en formato estructurado**: Aparecen como texto dentro del informe ("The Committee on X voted 15-10 to report favorably..."). Esto es el mismo gap que en Chile.
- **Conference reports son cruciales**: Cuando House y Senate pasan versiones diferentes de un bill, la conference committee produce un informe con el texto de compromiso. Este es el equivalente a la Comisión Mixta de Chile.
- **Prioridad media**: Los committee reports proveen contexto valioso (por qué se hicieron ciertos cambios) pero el changeset core se puede construir solo con las versiones del bill (IH→RH→EH→ENR) + roll call votes.
- **Oportunidad AI**: Extraer votos de comisión y análisis sección por sección usando AI sobre el texto del informe. Similar al approach "AI simple" que usamos en Chile para parsear PDFs.
- Disponibles en GovInfo desde el **104th Congress (1995)**.
