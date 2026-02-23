# debate — Reporte de Factibilidad EE.UU.

> Congressional Record: transcripción oficial de debates, declaraciones y procedimientos del piso del Senado y la House. Publicado diariamente por el GPO. Equivalente al Diario de Sesiones de Chile.

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | GovInfo — CREC collection | [api.govinfo.gov/collections/CREC](https://api.govinfo.gov/docs/) | XML + HTML + PDF | Texto de debates, declaraciones, extensiones | Mecánica compleja |
| 2 | GovInfo Bulk Data — CREC | [govinfo.gov/bulkdata/CREC](https://www.govinfo.gov/bulkdata) | XML | Descarga masiva por fecha | Mecánica compleja |
| 3 | Congress.gov API — congressional-record | [api.congress.gov/v3/congressional-record](https://api.congress.gov/) | JSON | Metadatos: issues, articles, links | Mecánica simple |
| 4 | GovInfo — Bound Congressional Record | [api.govinfo.gov/collections/CRECB](https://api.govinfo.gov/docs/) | XML + PDF | Versión final revisada | Mecánica compleja |

**Escala de dificultad**: 0 (Ya AKN) · Mecánica simple · Mecánica compleja · AI simple · AI + Humano · No disponible

## Métricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---------------|--------------|-------------|----------------|
| Texto completo debates piso | Sí | Parcial | CREC XML (granules por sección) |
| Identificación de speakers | Parcial | Parcial | XML tags parciales |
| Tema/bill bajo discusión | Parcial | Parcial | Header del granule |
| Fecha y cámara | Sí | Sí | XML metadata |
| Secciones (Senate, House, Extensions of Remarks, Daily Digest) | Sí | Sí | CREC structure |
| Votaciones dentro del debate | Parcial | No | Referencias textuales |

- **Datos disponibles pero no aprovechados**: Identificación precisa de speakers, vinculación con bills específicos
- **Cobertura**: ~50%

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|-----------|--------------|--------|
| `<debate>` type | Sí | CREC metadata |
| FRBR URIs | Sí | CREC date + section |
| `<debateBody>` | Parcial | CREC granule text |
| `<speech>` by speaker | Parcial | Speaker tags inconsistentes en CREC |
| `<question>` / `<answer>` | No | No estructurado |
| `<scene>` (procedural actions) | No | Texto plano |

- **Completitud**: ~40%

## Estructura del Congressional Record

El CREC se divide en 4 secciones diarias:
1. **Senate**: Procedimientos del Senado
2. **House**: Procedimientos de la House
3. **Extensions of Remarks**: Declaraciones escritas no pronunciadas en piso
4. **Daily Digest**: Resumen del día

Cada sección se subdivide en **granules** (artículos individuales), disponibles como XML separados via GovInfo API.

### Ejemplo de granule CREC (simplificado)

```xml
<CREC>
  <header>
    <congress>119</congress>
    <session>1</session>
    <date>2025-02-15</date>
    <chamber>Senate</chamber>
  </header>
  <body>
    <speaking>
      <speaker>Mr. SMITH</speaker>
      <text>Mr. President, I rise today to speak about...</text>
    </speaking>
    <speaking>
      <speaker>The PRESIDING OFFICER</speaker>
      <text>The Senator from Ohio is recognized.</text>
    </speaking>
  </body>
</CREC>
```

## Observaciones

- **El Congressional Record es la fuente de datos más rica pero menos estructurada**. Tiene el texto completo de todo lo dicho en el piso, pero la identificación de speakers y la vinculación con bills específicos es inconsistente en el XML.
- **Volumen masivo**: ~200+ páginas diarias cuando el Congreso está en sesión. ~160 días de sesión/año = ~32,000 páginas/año.
- **Prioridad baja para AKN Diff**: El valor principal de AKN Diff es el tracking de cambios en artículos con votos nominales. Los debates proveen contexto pero no son esenciales para el MVP.
- **Oportunidad futura**: Vincular fragmentos del debate con artículos específicos del bill que se está discutiendo. Esto requeriría NLP o AI para identificar qué sección del bill se está debatiendo.
- **Similar a Chile**: Los diarios de sesión de Chile también están en PDF sin estructura, así que el desafío es comparable. La ventaja de EE.UU. es que al menos hay XML parcial.
- Disponible desde el **104th Congress (1995)** en formato electrónico.
