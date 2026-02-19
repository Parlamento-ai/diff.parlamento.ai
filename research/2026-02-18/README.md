# 18/02/2026 — AKN Diff con legislación real chilena

Primera aplicación de AKN Diff a legislación real: la **Ley 21.735 — Reforma de Pensiones** (Boletín 15.480-13) y la **historia completa de versiones de la Ley 18.045** (Ley de Mercado de Valores).

---

## Ley 21.735 — Reforma de Pensiones

Probablemente la ley más compleja tramitada en Chile en la última década. 350 artículos en el mensaje original, 5 normas modificadas, votación nominal del Senado (40-7).

### Paso a paso

**1. Identificar normas modificadas**

La reforma modifica explícitamente 13 normas existentes a través de sus artículos 67 a 79. Para cada una, descargamos la versión pre-reforma y post-reforma desde la API JSON de LeyChile.

- Script de descarga: ([extract-json-api.mjs](../../scripts/ley-21735/extract-json-api.mjs))
- Endpoint utilizado: `nuevo.leychile.cl/servicios/Navegar/get_norma_json?idNorma=X&idVersion=YYYY-MM-DD`
- JSONs descargados: ([ley-21735/json/](ley-21735/json/)) — 22 archivos pre/post para las 11 normas

**2. Comparar artículo por artículo**

Solo 5 de las 11 normas descargadas mostraron diferencias de texto detectables entre la versión pre y post reforma:

```
  ┌──────────────────┬──────────────────────────────────────────┬───────────────────┐
  │ Art. Ley 21.735  │ Norma modificada                         │ Cambios detectados│
  ├──────────────────┼──────────────────────────────────────────┼───────────────────┤
  │ Art. 67          │ DL 3.500 (Sistema de Pensiones)           │ 18 artículos      │
  │ Art. 68          │ Ley 17.322 (Cobranza judicial)            │ 0 — no detectados │
  │ Art. 69          │ Ley 21.419                                │ 0 — no detectados │
  │ Art. 70          │ Ley 20.255                                │ 0 — no detectados │
  │ Art. 71          │ Ley 19.728 (Seguro de cesantía)           │ 0 — no detectados │
  │ Art. 72          │ DFL 5/2003 (Cooperativas)                 │ 2 artículos       │
  │ Art. 73          │ Ley 18.045 (Mercado de Valores)           │ 1 artículo        │
  │ Art. 74          │ DFL 28/1981 (Superintendencia AFP)        │ 2 artículos       │
  │ Art. 75          │ Ley 20.880 (Probidad pública)             │ 1 artículo        │
  │ Art. 76          │ Ley 20.712                                │ 0 — no detectados │
  │ Art. 77          │ Ley 18.833                                │ 0 — no detectados │
  │ Art. 78-79       │ Otras normas                              │ No descargadas    │
  └──────────────────┴──────────────────────────────────────────┴───────────────────┘
```

- Diffs computados: ([ley-21735/diff/](ley-21735/diff/)) — incluyendo ([changes-summary.json](ley-21735/diff/changes-summary.json))

**3. Descargar documentos legislativos del Senado**

Los documentos del expediente legislativo se descargaron desde la API del Senado (`senado.cl/appsenado/`). Se requirió Playwright (browser no-headless) para bypassear Cloudflare.

- Oficios del proyecto: ([ley-21735/oficios/](ley-21735/oficios/))
  - ([mensaje.txt](ley-21735/oficios/mensaje.txt)) — 813K chars, 350 artículos permanentes + 73 transitorios
  - ([2do-tramite-oficio.txt](ley-21735/oficios/2do-tramite-oficio.txt)) — 79 permanentes + 50 transitorios
- Informes de comisión: ([ley-21735/informes/](ley-21735/informes/))
  - ([02-informe-trabajo-camara-cert.txt](ley-21735/informes/02-informe-trabajo-camara-cert.txt)) — Certificado Cámara, ~151 artículos
- Votaciones del Senado y Cámara: ([ley-21735/votes/](ley-21735/votes/))
  - ([senado-votes.xml](ley-21735/votes/senado-votes.xml)) — Votación nominal 40-7
  - ([camara-votes.xml](ley-21735/votes/camara-votes.xml)) — Votación 84-64-3

**4. Generar AKN Diff XMLs**

Para cada una de las 5 normas con cambios, se generó un timeline de 7 documentos (ley original → mensaje → 1er trámite → 2do trámite → 3er trámite → TC → ley promulgada), con changeSets computados y votaciones nominales embebidas.

- Script per-norma: ([generate-akn.mjs](../../scripts/ley-21735/generate-akn.mjs))
- Script boletín: ([generate-boletin-akn.mjs](../../scripts/ley-21735/generate-boletin-akn.mjs))
- AKN generados: ([ley-21735/akn/](ley-21735/akn/))
  - ([akn/boletin/](ley-21735/akn/boletin/)) — 6 XMLs: timeline del proyecto de ley
  - ([akn/dl-3500/](ley-21735/akn/dl-3500/)) — 7 XMLs: 18 cambios, 251→252 artículos
  - ([akn/dfl-5-2003/](ley-21735/akn/dfl-5-2003/)) — 7 XMLs: 2 cambios
  - ([akn/ley-18045/](ley-21735/akn/ley-18045/)) — 7 XMLs: 1 cambio
  - ([akn/dfl-28/](ley-21735/akn/dfl-28/)) — 7 XMLs: 2 cambios
  - ([akn/ley-20880/](ley-21735/akn/ley-20880/)) — 7 XMLs: 1 cambio

### Timeline del boletín

El boletín completo muestra cómo el texto del proyecto evolucionó entre etapas:

| # | Etapa | Fuente | Genera | Artículos |
|---|-------|--------|--------|-----------|
| 1 | Mensaje Presidencial (2022) | [mensaje.txt](ley-21735/oficios/mensaje.txt) | [01-act-original.xml](ley-21735/akn/boletin/01-act-original.xml) | 423 |
| 2 | 1er Trámite — Cámara (2024) | [02-informe-trabajo-camara-cert.txt](ley-21735/informes/02-informe-trabajo-camara-cert.txt) | [02-bill.xml](ley-21735/akn/boletin/02-bill.xml) | 151 |
| 3 | 2do Trámite — Senado (2025) | [2do-tramite-oficio.txt](ley-21735/oficios/2do-tramite-oficio.txt) | [03-amendment-1.xml](ley-21735/akn/boletin/03-amendment-1.xml) | 129 |
| 4 | Ley 21.735 publicada | [ley-21735-post.json](ley-21735/json/ley-21735-post.json) | [06-act-final.xml](ley-21735/akn/boletin/06-act-final.xml) | 129 |

### Mapa de documentos de referencia

Documentos descargados que no generan XMLs directamente, pero son parte del expediente:

| Archivo | Contenido |
|---------|-----------|
| [mensaje.docx](ley-21735/oficios/mensaje.docx) | Binario original del mensaje |
| [1er-tramite-oficio.doc](ley-21735/oficios/1er-tramite-oficio.doc) | Oficio 1er trámite (no se usa, ver certificado) |
| [2do-tramite-oficio.doc](ley-21735/oficios/2do-tramite-oficio.doc) | Binario original 2do trámite |
| [comparado-trabajo.doc](ley-21735/oficios/comparado-trabajo.doc) | Comparado tabular — no parseado |
| [comparado-hacienda.doc](ley-21735/oficios/comparado-hacienda.doc) | Comparado tabular — no parseado |
| [01-mensaje-presidencial.pdf](ley-21735/informes/01-mensaje-presidencial.pdf) | PDF del mensaje presidencial |
| [03-informe-trabajo-camara.docx](ley-21735/informes/03-informe-trabajo-camara.docx) | Informe discursivo (1.4M chars) |
| [04-informe-hacienda-camara.pdf](ley-21735/informes/04-informe-hacienda-camara.pdf) | PDF informe Hacienda Cámara |
| [05-informe-trabajo-senado.doc](ley-21735/informes/05-informe-trabajo-senado.doc) | Informe discursivo (1.6M chars) |
| [06-informe-hacienda-senado.doc](ley-21735/informes/06-informe-hacienda-senado.doc) | Informe discursivo (1.1M chars) |

---

## Ley 18.045 — Ley de Mercado de Valores (1981-2025)

Segundo caso de uso: aplicar AKN Diff a la **historia completa de versiones** de una ley chilena. A diferencia de la Ley 21.735 (donde rastreamos un proyecto de ley a través de sus trámites), aquí rastreamos una ley vigente a través de sus **32 versiones históricas** en 44 años.

### Paso a paso

**1. Descubrir el versionamiento de LeyChile**

La API JSON soporta versionamiento: `get_norma_json?idNorma=29472&idVersion=YYYY-MM-DD`. El campo `vigencias` en los metadatos lista todas las fechas de cada versión.

- Índice de versiones: ([versions-index.json](ley-18045/json/versions-index.json))

**2. Descargar las 32 versiones**

Script automatizado que descarga cada versión con Playwright (CloudFront bloquea curl).

- Script: ([extract-versions.mjs](../../scripts/ley-18045/extract-versions.mjs))
- JSONs descargados: ([ley-18045/json/](ley-18045/json/)) — desde ([v01-1981-10-22.json](ley-18045/json/v01-1981-10-22.json)) hasta ([v32-2025-03-26.json](ley-18045/json/v32-2025-03-26.json))

**3. Comparar versiones consecutivas**

Análisis de diffs entre cada par de versiones consecutivas:

- Script de análisis: ([analyze-diffs.mjs](../../scripts/ley-18045/analyze-diffs.mjs))

**4. Generar 33 AKN XMLs**

- Script: ([generate-akn.mjs](../../scripts/ley-18045/generate-akn.mjs))
- AKN generados: ([ley-18045/akn/](ley-18045/akn/)) — desde ([01-original.xml](ley-18045/akn/01-original.xml)) hasta ([33-final.xml](ley-18045/akn/33-final.xml))

### Las 32 versiones

```
  ┌─────┬────────────┬────────────────────────────────────┬─────────┬──────────────────────┐
  │  #  │ Fecha      │ Ley modificatoria                  │ Cambios │ Artículos resultantes│
  ├─────┼────────────┼────────────────────────────────────┼─────────┼──────────────────────┤
  │  1  │ 1981-10-22 │ Texto Original                     │    —    │  73                  │
  │  2  │ 1981-10-23 │ DL 3.538                           │    5    │  68                  │
  │  3  │ 1981-10-31 │ DFL 251                            │    7    │  61                  │
  │  4  │ 1981-12-31 │ DFL 3                              │    1    │  60                  │
  │  5  │ 1985-12-28 │ Ley 18.482                         │    1    │  59                  │
  │  6  │ 1987-10-20 │ Ley 18.660                         │    7    │  66                  │
  │  7  │ 1989-12-21 │ Ley 18.876                         │    1    │  65                  │
  │  8  │ 1989-12-30 │ Ley 18.899                         │    0    │  65                  │
  │  9  │ 1993-06-01 │ Ley 19.221                         │    1    │  64                  │
  │ 10  │ 1994-03-19 │ Ley 19.301 (gran reforma)          │   99    │ 139                  │
  │ 11  │ 1995-05-18 │ Ley 19.389                         │   13    │ 148                  │
  │ 12  │ 1997-07-30 │ Ley 19.506                         │    1    │ 148                  │
  │ 13  │ 1999-01-18 │ Ley 19.601 (OPA)                   │   16    │ 164                  │
  │ 14  │ 1999-08-26 │ Ley 19.623                         │    8    │ 170                  │
  │ 15  │ 2000-12-20 │ Ley 19.705 (OPA y gob. corporativo)│   47    │ 197                  │
  │ 16  │ 2001-11-07 │ Ley 19.768 (MK1)                   │   23    │ 216                  │
  │ 17  │ 2002-05-31 │ Ley 19.806                         │    0    │ 216                  │
  │ 18  │ 2007-06-05 │ Ley 20.190 (MK2)                   │   21    │ 216                  │
  │ 19  │ 2009-04-28 │ Ley 20.343                         │    1    │ 216                  │
  │ 20  │ 2010-01-01 │ Ley 20.382 (gob. corporativo)      │   49    │ 236                  │
  │ 21  │ 2010-09-06 │ Ley 20.345                         │    7    │ 236                  │
  │ 22  │ 2010-10-01 │ Ley 20.448 (MK3)                   │   13    │ 238                  │
  │ 23  │ 2012-02-01 │ Ley 20.552                         │    1    │ 238                  │
  │ 24  │ 2014-05-01 │ Ley 20.712                         │   22    │ 238                  │
  │ 25  │ 2014-10-10 │ Ley 20.720                         │    7    │ 238                  │
  │ 26  │ 2020-10-19 │ Ley 21.276                         │    1    │ 239                  │
  │ 27  │ 2021-04-13 │ Ley 21.314 (transparencia)         │   65    │ 239                  │
  │ 28  │ 2022-02-01 │ Ley 21.398                         │    1    │ 239                  │
  │ 29  │ 2022-06-13 │ Ley 21.455                         │    1    │ 239                  │
  │ 30  │ 2023-08-17 │ Ley 21.595 (delitos económicos)    │   10    │ 241                  │
  │ 31  │ 2023-12-30 │ Ley 21.641                         │    1    │ 241                  │
  │ 32  │ 2025-03-26 │ Ley 21.735 (reforma pensiones)     │    1    │ 241                  │
  ├─────┼────────────┼────────────────────────────────────┼─────────┼──────────────────────┤
  │     │            │ TOTAL                              │   431   │  73 → 241            │
  └─────┴────────────┴────────────────────────────────────┴─────────┴──────────────────────┘
```

A diferencia de la reforma de pensiones, este caso no requirió recopilación manual de documentos: todo se obtiene automáticamente de la API de LeyChile. Esto hace que el proceso sea replicable para cualquier norma chilena con historial de versiones.

---

## Estructura de archivos

```
  research/2026-02-18/
  ├── ley-21735/
  │   ├── oficios/      ← Textos del proyecto (.txt/.doc/.docx)
  │   ├── informes/     ← Informes de comisión y certificados
  │   ├── json/         ← Datos LeyChile pre/post (22 JSONs)
  │   ├── diff/         ← Diffs computados (5 changes + summary)
  │   ├── votes/        ← Votaciones XML (senado + cámara)
  │   └── akn/          ← XMLs AKN generados (lo que consume la app)
  │       ├── boletin/  ← 6 XMLs: timeline del proyecto de ley
  │       ├── dl-3500/  ← 7 XMLs: timeline DL 3.500
  │       ├── dfl-5-2003/
  │       ├── ley-18045/
  │       ├── dfl-28/
  │       └── ley-20880/
  └── ley-18045/
      ├── json/         ← 32 versiones + índice
      └── akn/          ← 33 XMLs AKN (original + 31 amendments + final)
```
