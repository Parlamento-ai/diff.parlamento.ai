# EU Regulation Pipeline

Pipeline automatizado para convertir cualquier regulación de la UE a formato AKN Diff, compatible con el viewer de diff.parlamento.ai.

## Por qué

Los documentos legislativos de la UE están dispersos en múltiples APIs y formatos (Formex XML, XHTML, HTML). No existe una forma unificada de ver qué cambió entre la propuesta de la Comisión y la regulación final. Este pipeline descarga, convierte y genera los archivos necesarios para visualizar el proceso legislativo completo.

## Qué hace

```
1. Descarga                    2. Convierte                   3. Genera viewer XMLs
─────────────                  ────────────                   ─────────────────────
CELLAR (Formex) ──────────→    poc-formex-to-akn.ts    ──→   04-act-final.xml
CELLAR (XHTML)  ──────────→    poc-cellar-to-bill.ts   ──→   01-act-original.xml
AKN bill + act  ──────────→    poc-akn-diff.ts          ──→   03-amendment-2.xml
EUR-Lex HTML    ──────────→    poc-eurlex-ep-amendments ──→   02-amendment-1.xml
                               generate-viewer-xmls.ts  ──→   (orquesta 01, 03, 04)
```

## Cómo agregar una nueva regulación

### 1. Crear directorio

```
akn-eu/
└── mi-regulacion/
    ├── sources/          ← archivos descargados
    ├── akn/              ← viewer XMLs generados
    ├── viewer-config.json
    └── ep-amendments-metadata.json
```

### 2. Descargar fuentes

```bash
# Propuesta COM (XHTML → AKN bill)
node --experimental-strip-types tools/poc-cellar-to-bill.ts <CELEX_PROPUESTA>
cp samples/bill/<CELEX>-bill-akn.xml mi-regulacion/sources/

# Regulación final (Formex → AKN act)
node --experimental-strip-types tools/poc-cellar-download-formex.ts <CELEX_FINAL> --output-dir mi-regulacion/sources
node --experimental-strip-types tools/poc-formex-to-akn.ts mi-regulacion/sources/<CELEX>-formex.xml

# Enmiendas EP (HTML de EUR-Lex)
curl -o mi-regulacion/sources/ta-9-XXXX-XXXX.html "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:<TA_CELEX>"
```

### 3. Generar diff

```bash
node --experimental-strip-types tools/poc-akn-diff.ts \
  mi-regulacion/sources/<BILL>.xml \
  mi-regulacion/sources/<FINAL>.xml \
  changeset-mi-regulacion.xml
```

### 4. Parsear enmiendas EP

Crear `ep-amendments-metadata.json`:
```json
{
  "name": "ep-amendments-mi-regulacion",
  "workUri": "/akn/eu/amendment/ep/YYYY-MM-DD/P9_TA(YYYY)XXXX",
  "expressionUri": "/akn/eu/amendment/ep/YYYY-MM-DD/P9_TA(YYYY)XXXX/eng@YYYY-MM-DD",
  "date": "YYYY-MM-DD",
  "dateName": "EP First Reading",
  "voteFor": 0, "voteAgainst": 0, "voteAbstain": 0,
  "prefaceTitle": "EP Amendments to COM(YYYY) NNN — Mi Regulación"
}
```

```bash
node --experimental-strip-types tools/poc-eurlex-ep-amendments.ts \
  mi-regulacion/sources/ta-9-XXXX-XXXX.html \
  mi-regulacion/sources/ep-amendments.xml \
  mi-regulacion/ep-amendments-metadata.json
```

### 5. Generar viewer XMLs

Crear `viewer-config.json`:
```json
{
  "slug": "mi-regulacion",
  "sourcesDir": "sources",
  "outputDir": "akn",
  "billFile": "<CELEX>-bill-akn.xml",
  "finalFile": "<CELEX>-akn.xml",
  "changesetFile": "changeset-mi-regulacion.xml",
  "epAmendmentsFile": "ep-amendments.xml",
  "proposal": { "celex": "...", "comYear": 2021, "comNum": 206, "date": "...", "title": "..." },
  "final": { "celex": "...", "regYear": 2024, "regNum": 1689, "date": "...", "pubDate": "...", "title": "..." },
  "legislativeProcedure": { "procedure": "2021/0106(COD)", "voteDate": "...", "voteFor": 0, "voteAgainst": 0, "voteAbstain": 0 }
}
```

```bash
node --experimental-strip-types tools/generate-viewer-xmls.ts mi-regulacion/viewer-config.json
```

### 6. Registrar en el viewer

En `src/lib/server/boletin-loader.ts`:
- Agregar entrada en `BOLETIN_DIRS`
- Agregar labels en `slugToLabel`

En `src/routes/boletines/+page.svelte`:
- Agregar al `flagMap`

## Regulaciones procesadas

| Regulación | CELEX Propuesta | CELEX Final | Artículos | EP Amendments |
|-----------|-----------------|-------------|-----------|---------------|
| Digital Services Act | 52020PC0825 | 32022R2065 | 74 → 93 | 456 (76 article-level) |
| AI Act | 52021PC0206 | 32024R1689 | 85 → 113 | 770 (93 article-level) |

## Herramientas (tools/)

### Core (5 scripts para el diff)

| Script | Función |
|--------|---------|
| `poc-cellar-to-bill.ts` | CELLAR XHTML → AKN bill (propuestas COM) |
| `poc-cellar-download-formex.ts` | Descarga Formex XML desde CELLAR |
| `poc-formex-to-akn.ts` | Formex 4 → AKN 3.0 (regulaciones finales) |
| `poc-akn-diff.ts` | Genera changeset entre 2 AKN docs |
| `poc-eurlex-ep-amendments.ts` | EUR-Lex HTML → AKN amendment (enmiendas EP) |
| `generate-viewer-xmls.ts` | Orquesta generación de 4 viewer XMLs |

### Enrichment (5 scripts adicionales)

| Script | Función |
|--------|---------|
| `poc-epdata-to-vote.ts` | Votaciones nominales con nombres de MEPs |
| `poc-epdata-to-amendment.ts` | Enmiendas individuales desde EP Open Data |
| `poc-epdata-to-communication.ts` | Comunicaciones del procedimiento legislativo |
| `poc-epdata-to-citation.ts` | Citaciones de sesiones plenarias |
| `poc-epdata-to-question.ts` | Preguntas parlamentarias escritas |
| `poc-formex-toc-to-gazette.ts` | Tabla de contenidos del Diario Oficial |

## Análisis previos (docs/)

- `01-formex-estructura.md` — Estructura del formato Formex 4 XML
- `02-akn4eu-estructura.md` — Estándar AKN4EU y su relación con AKN 3.0
- `03-viabilidad-akn-diff-eu.md` — Estudio de viabilidad de AKN Diff para la UE
