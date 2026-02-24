# debate — Reporte de Factibilidad Spain

> Registro textual de los debates parlamentarios en el Congreso y Senado. Intervenciones de cada diputado/senador sobre un proyecto de ley.

**Estado**: No implementado

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | Congreso - Diario de Sesiones | `congreso.es/public_oficiales/L{leg}/CONG/DS/PL/` | PDF | Transcripciones completas de plenos | AI simple |
| 2 | Congreso Open Data - Intervenciones | `congreso.es/opendata/intervenciones` | XML/JSON/CSV | Metadatos de intervenciones por iniciativa | Mecanica simple |
| 3 | Senado - Diario de Sesiones | `senado.es/web/actividadparlamentaria/diariodesesionesencomision/` | PDF/HTML | Transcripciones de plenos y comisiones | Mecanica compleja |

**Escala de dificultad**: Mecanica simple (metadatos) · **AI simple** (PDFs Diario de Sesiones)

### Ejemplo real

**Congreso Open Data — Intervenciones**:
Descargable como dataset con campos: legislatura, fecha, sesion, diputado, grupo parlamentario, iniciativa vinculada, texto parcial.

**Diario de Sesiones — PDF**:
```
https://www.congreso.es/public_oficiales/L15/CONG/DS/PL/DSCD-15-PL-{num}.PDF
```

Estructura tipica del PDF:
```
DIARIO DE SESIONES DEL CONGRESO DE LOS DIPUTADOS
PLENO Y DIPUTACIÓN PERMANENTE
Año 2023                    Núm. 123

ORDEN DEL DÍA:
  Proyecto de Ley de Vivienda (...)

El señor PRESIDENTE: Se abre la sesión...
La señora MINISTRA DE TRANSPORTES (Raquel Sánchez): Señorías...
El señor GARCÍA (Grupo Popular): En nombre de mi grupo...
```

### Verificado con

| Fuente | Dato | Status |
|--------|------|--------|
| Congreso Open Data Intervenciones | Datasets descargables por legislatura | Descarga OK |
| Diario de Sesiones PDFs | URLs predecibles | PDFs accesibles |

## Metricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---|---|---|---|
| Transcripcion completa del debate | Si | No | Diario de Sesiones PDF |
| Speaker identification | Si | No | PDF / Congreso OpenData |
| Grupo politico del speaker | Si | No | Congreso OpenData |
| Iniciativa vinculada | Si | No | Congreso OpenData |
| Debates en Comision | Si | No | Diario de Sesiones PDF |

- **Cobertura**: 0% utilizado (100% disponible)

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|---|---|---|
| `<debate>` type | No | — |
| `<debateBody>` | No | — |
| `<debateSection>` por tema | No | Diario de Sesiones PDF |
| `<speech>` por intervencion | No | PDF / Congreso OpenData |
| `<from>` speaker | No | Congreso OpenData |

- **Completitud**: 0%

## Observaciones

- El Congreso Open Data tiene metadatos de intervenciones (quien hablo, cuando, sobre que iniciativa) pero NO el texto completo. El texto esta en los PDFs del Diario de Sesiones.
- Los PDFs son texto seleccionable con estructura reconocible (speaker en negrita, grupo entre parentesis).
- El Senado publica Diarios de Sesiones en formato similar.
- No es parte directa del flujo bill -> amendment -> act. Agrega contexto sobre que dijo cada diputado/senador.
- Diarios de Sesiones disponibles digitalmente desde la I Legislatura (1979).
