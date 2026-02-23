# bill — Reporte de Factibilidad Spain

> Proyecto de ley (origen Gobierno) o proposicion de ley (origen grupos parlamentarios/ciudadanos). Texto inicial que inicia el procedimiento legislativo.

**Estado**: No implementado. Viabilidad media.

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | BOCG Congreso | `congreso.es/public_oficiales/L{leg}/CONG/BOCG/A/BOCG-{leg}-A-{num}-1.PDF` | PDF | Texto articulado del proyecto de ley | AI simple |
| 2 | Congreso Open Data Iniciativas | `congreso.es/opendata/iniciativas` | XML/JSON/CSV | Metadatos: titulo, fecha, tipo, comision, estado | Mecanica simple |
| 3 | BOE API (version original) | `boe.es/datosabiertos/api/legislacion-consolidada/id/{id}/texto` | XML | Primera `<version>` de cada `<bloque>` = texto original publicado | Mecanica simple |

**Escala de dificultad**: Mecanica simple (BOE version original) · **AI simple** (PDF BOCG) · No disponible (API estructurada de textos)

### Fuente 1: BOCG PDF (texto del proyecto en tramitacion)

El texto inicial del proyecto se publica en el BOCG con sufijo `-1`:

```
https://www.congreso.es/public_oficiales/L15/CONG/BOCG/A/BOCG-15-A-4-1.PDF
```

Es PDF con texto seleccionable, estructura tipica:
- Exposicion de motivos
- Texto articulado (articulos agrupados en titulos/capitulos)
- Disposiciones adicionales, transitorias, derogatorias, finales

Requiere PDF parsing + regex para extraer articulos. Misma dificultad que Chile pipeline.

### Fuente 3: BOE API (ley ya publicada — version original)

Alternativa para Track A: la primera `<version>` de cada `<bloque>` en la API del BOE ES el texto original de la ley tal como se publico. No necesita PDF.

```xml
<bloque id="a1" tipo="precepto" titulo="Articulo 1">
  <!-- Esta primera version ES el bill/act original -->
  <version id_norma="BOE-A-2018-16673" fecha_publicacion="20181206" fecha_vigencia="20181207">
    <p class="articulo">Articulo 1. Objeto de la ley.</p>
    <p class="parrafo">La presente ley organica tiene por objeto:</p>
  </version>
</bloque>
```

### Verificado con

| Ley | Fuente | Status |
|-----|--------|--------|
| LO 3/2018 Proteccion de Datos | BOE API (version original) | API OK — primera version disponible |
| Codigo Civil (1889) | BOE API (version original) | API OK — version 1889 disponible |
| Ley 28/2022 Startups | BOE API (version original) | API OK |

### Diferencia clave: bill vs act original

- **Track A**: El "bill" es la primera `<version>` del BOE — texto publicado oficialmente. No es el proyecto en tramitacion, es la ley ya aprobada en su version original. Esto es suficiente para el diff de versiones consolidadas.
- **Track B**: El bill real es el PDF del BOCG (proyecto antes de aprobacion). Diferente del texto final porque el Congreso/Senado pueden modificarlo durante tramitacion.

## Metricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---|---|---|---|
| Texto original publicado (Track A) | Si | Si | BOE XML primera `<version>` |
| Texto del proyecto en tramitacion (Track B) | Si | No (pendiente) | BOCG PDF |
| Exposicion de motivos (Track B) | Si | No | BOCG PDF |
| Metadatos de la iniciativa | Si | No (pendiente) | Congreso OpenData |
| Comision asignada | Si | No | Congreso OpenData |
| Autor (Gobierno / grupo parlamentario) | Si | Parcial | BOE `<departamento>` |

- **Track A cobertura**: ~80% (texto original completo del BOE)
- **Track B cobertura**: ~20% (solo metadatos; texto requiere PDF parsing)

### Completitud AKN

| Campo AKN | ¿Completado? (Track A) | ¿Completado? (Track B) | Fuente |
|---|---|---|---|
| `<act>` como version original | Si | N/A | BOE primera version |
| `<bill>` como proyecto | N/A | No | BOCG PDF |
| FRBR URIs | Si | Parcial | ELI URI |
| `<preface>` docTitle | Si | Parcial | BOE `<titulo>` / PDF |
| `<preamble>` | Si | No | BOE `<bloque tipo="preambulo">` |
| `<body>` articles | Si | No | BOE / PDF parsing |

- **Track A completitud**: ~80%
- **Track B completitud**: ~15%

## Observaciones

- Para Track A, el "bill" no es un documento separado sino la primera version del act en el BOE. Esto simplifica enormemente: no hay que buscar ni descargar documentos adicionales.
- Para Track B, el proyecto de ley del BOCG puede diferir significativamente del texto final publicado en el BOE (el Congreso/Senado modifican durante tramitacion).
- Los PDFs del BOCG son texto seleccionable (no OCR), lo que facilita el parsing.
- Congreso Open Data da metadatos de iniciativas pero NO el texto. Para textos hay que ir al BOCG PDF.
- Recomendacion: Track A usa el BOE directamente (mecanica simple). Track B requiere PDF pipeline como Chile.
