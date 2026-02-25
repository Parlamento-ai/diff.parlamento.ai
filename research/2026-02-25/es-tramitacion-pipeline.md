# ES Tramitacion Pipeline — Documentacion

Pipeline para visualizar la evolucion de proyectos de ley durante su tramitacion parlamentaria en el Congreso de los Diputados de Espana.

## Diferencias con el pipeline BOE (consolidacion)

| | Pipeline BOE (Consolidacion) | Pipeline Tramitacion (Congreso) |
|---|---|---|
| **Que muestra** | Ley publicada + reformas a lo largo de años | Ley en debate parlamentario, fase por fase |
| **Fuente de datos** | API REST del BOE (HTML/XML estructurado) | Congreso Open Data JSON + PDFs del BOCG |
| **Extraccion de texto** | HTML parseado directo (limpio) | PDF -> `pdftotext` (Poppler) -> parseo regex |
| **Identificador** | BOE-A-YYYY-NNNNN (ELI oficial) | 121/000NNN (expediente Congreso) |
| **Timeline** | Años (2000, 2003, 2009...) | Meses (ene->mar->jun->dic) |
| **Fases del pipeline** | 6 (discover->enrich con votos) | 4 (discover->generate, sin votos aun) |
| **Votos** | Si, via `congreso-api.ts` + `vote-matcher.ts` (matching por keywords) | No implementado (pero viable via expediente directo) |
| **Documentos generados** | `act` original + `amendment` por cada reforma BOE | `bill` original + `amendment` por cada fase BOCG |
| **Riesgo de parseo** | Bajo (HTML estructurado) | Medio (depende del formato PDF) |
| **Cobertura** | Cualquier ley del BOE con ELI (~90k leyes) | 84 proyectos de ley de legislatura XV |

---

## Fases legislativas del BOCG

Cada proyecto de ley en el Congreso puede tener hasta 9 fases, publicadas como PDFs del BOCG (Boletin Oficial de las Cortes Generales):

| Fase | Nombre | Pipeline descarga? | Formato | Notas |
|---|---|---|---|---|
| 1 | Texto Original | **SI** | Texto completo de articulos | Siempre presente |
| 2 | Enmiendas | No | Tabla de enmiendas individuales | Propuestas sueltas de cada partido, no es version completa |
| 3 | Indice de Enmiendas | No | Lista/indice | Solo referencia de quien presento que |
| 4 | Informe de Ponencia | **SI** | Texto completo (ANEXO) | Texto tras revision de ponencia, buscar marcador ANEXO |
| 5 | Dictamen de Comision | **SI** | Texto completo | Texto tras aprobacion en comision |
| 6 | Aprobacion por el Pleno | **SI** | Texto completo | Texto tras votacion en pleno |
| 7 | Enmiendas del Senado | No | Notas procedimentales | Disconformidad del gobierno, notas breves |
| 8 | Texto aprobado Senado | **No** | Dos columnas (comparacion) | `pdftotext` mezcla ambas columnas, no parseable. Ver seccion "Limitaciones" |
| 9 | Aprobacion Definitiva | **SI** | Texto completo | Texto final aprobado |

**TEXT_PHASES = [1, 4, 5, 6, 9]** — solo fases con texto completo parseable.

### Por que no parseamos fase 2 (enmiendas)?

La fase 2 contiene enmiendas individuales en formato tabla: "Al articulo 5, parrafo 2, sustituir X por Y". No es una version completa de la ley. Para hacer diff necesitamos versiones completas con todos los articulos.

### Por que no parseamos fase 8 (Senado)?

El PDF de fase 8 usa formato de dos columnas (texto original a la izquierda, version Senado a la derecha). `pdftotext` extrae ambas columnas intercaladas en una sola linea, produciendo texto ilegible. El contenido final del Senado se captura en fase 9 (Aprobacion Definitiva), que ya incluye los cambios del Senado.

---

## Arquitectura del pipeline

```
pipeline/es/
  process-tramitacion.ts          # CLI entry point
  types-tramitacion.ts            # Interfaces
  lib/
    congreso-opendata.ts          # Fetch JSON de iniciativas del Congreso
    bocg-downloader.ts            # Descargar PDFs + pdftotext + encoding
    bocg-parser.ts                # Parsear texto PDF -> ParsedArticle[]
```

### Fase 1: DISCOVER
- Scrapea `congreso.es/opendata/iniciativas` para URL del JSON
- Descarga JSON con ~84 proyectos de ley (legislatura XV)
- Busca por expediente (ej: `121/000036`)
- Extrae metadata: titulo, situacion, comision, BOCGs, tramitacion
- Parsea ENLACESBOCG (URLs con numero de fase)
- Guarda `discovery.json`

### Fase 2: DOWNLOAD
- Descarga PDFs de fases en TEXT_PHASES [1, 4, 5, 6, 9]
- `pdftotext -layout -enc UTF-8` (fallback `-enc Latin1`)
- Cache: skip si PDF ya existe
- Guarda `sources/bocg-{num}-{fase}.pdf` y `.txt`

### Fase 3: CONVERT
- Strip headers/footers del BOCG
- Parseo articulos: `/^Articulo (primero|segundo|...)\./i`
- Disposiciones: `/^Disposicion (transitoria|final|derogatoria|adicional)\./i`
- Fase 4 (Ponencia): buscar marcador `ANEXO` para texto modificado
- Genera snapshots con ParsedArticle[]

### Fase 4: GENERATE
- Reutiliza `buildActXml()` y `buildAmendmentXml()` de `pipeline/es/lib/akn-builder.ts`
- Reutiliza `computeChangeSet()` de `pipeline/shared/changeset.ts`
- FRBR: `/es/congreso/proyecto/{expediente-slug}`
- Output: `01-bill-original.xml`, `02-amendment-{fase}.xml`, etc.

### Uso

```bash
npx tsx pipeline/es/process-tramitacion.ts 121/000036
npx tsx pipeline/es/process-tramitacion.ts 121/000004 --phase=3
```

---

## Leyes procesadas (2026-02-25)

| Expediente | Ley | Situacion | Fases descargadas | Docs AKN |
|---|---|---|---|---|
| 121/000004 | Prevencion perdidas y desperdicio alimentario | Cerrado (aprobado) | [1,4,5,6,9] | 5 |
| 121/000036 | Impulso de la economia social | Senado | [1,4,5] | 3 |
| 121/000052 | Proteccion menores en entornos digitales | Comision (Justicia) | [1,4] | 2 |
| 121/000058 | Reduccion jornada laboral 37.5h | Rechazado | [1] | 1 |

### Validacion (10 expedientes diversos)

Se valido el pipeline con 10 expedientes en diferentes estados legislativos: 9 PASS, 1 WARN, 0 FAIL. El WARN fue 121/000009 (Movilidad Sostenible) que tiene fases 10 y 11 desconocidas (probablemente correcciones). URLs verificadas por HTTP HEAD devuelven 200 OK.

---

## Limitaciones conocidas

1. **Fase 8 no parseable**: formato dos columnas del Senado. Se pierde ver que cambio especificamente el Senado como paso intermedio, pero el resultado final se captura en fase 9.

2. **Dependencia de `pdftotext`**: si el Congreso cambia el formato de los PDFs, el parser podria fallar. Actualmente todos los BOCG de legislatura XV usan el mismo formato.

3. **Sin votos**: el pipeline no integra votaciones del Pleno. Es viable implementarlo reutilizando `congreso-api.ts` con match por expediente (mas fiable que el keyword matching del pipeline BOE). Solo aplica a leyes con fase 6+ (pleno).

4. **84 proyectos**: cobertura limitada a legislatura XV (desde agosto 2023). Legislaturas anteriores requeririan buscar JSONs historicos.

5. **Parseo de Ponencia (fase 4)**: busca marcador ANEXO. Si el PDF no tiene ANEXO, parsea el texto completo como fallback, lo que puede incluir texto introductorio no deseado.

---

## Mejoras futuras (todas viables)

| Mejora | Solucion | Dificultad | Impacto |
|---|---|---|---|
| **Votos** | `findVoteForExpediente()` reutilizando `congreso-api.ts` con match directo por expediente | Baja | Alto — muestra aprobacion/rechazo con votos nominales |
| **Fase 8** (Senado dos columnas) | Mistral OCR o vision model para leer columnas por separado (pdftotext no entiende layout) | Media | Alto — captura que cambio el Senado como paso intermedio |
| **Fase 2** (enmiendas individuales) | Mistral OCR para extraer tablas estructuradas del PDF | Media | Alto — muestra que partido propuso que cambio |
| **Automatizacion** | Re-ejecutar pipeline periodicamente para leyes en tramitacion activa (detectar nuevas fases) | Baja | Medio — mantiene datos actualizados |

Nota: `pdftotext` (Poppler) es una herramienta de extraccion de texto plano que no entiende layout visual. Para documentos con formato complejo (dos columnas, tablas), un modelo de vision como Mistral OCR es mas adecuado porque "ve" la estructura del documento.
