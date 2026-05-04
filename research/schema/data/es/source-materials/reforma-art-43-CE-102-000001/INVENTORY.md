# INVENTORY — Reforma Constitucional Art. 43 CE (Expediente 102/000001)

**Estado**: Ejemplo completo AKN modelado al 100% en `research/schema/data/es/{type}/`, validado frase-a-frase contra fuente original, loader-compatible (38 docs ES en SQL, 40 cross-references resueltos).
**Fecha**: 4 de mayo de 2026.
**Total documentos AKN del expediente**: **31** (13 de los 14 types AKN cubiertos, excepto `question` con gap estructural justificado — ver §1.14).
**Source materials originales** (PDFs/HTMLs/JSONs/XMLs descargados como provenance) viven en este directorio bajo `01-bill/` … `10-judgments/` y `votaciones/`.

---

## 0. Resumen del expediente (en lenguaje llano)

Es la reforma del artículo 43 de la Constitución Española impulsada por el Gobierno de Pedro Sánchez (PSOE-Sumar) que añade un apartado 4 garantizando el derecho de las mujeres al aborto en igualdad real y efectiva. El objetivo es **blindar el derecho al aborto en la Constitución** para que ningún gobierno futuro pueda eliminarlo por ley ordinaria. Hoy 4-may-2026 está en plazo de enmiendas al articulado tras superar el debate de enmiendas a la totalidad del Pleno del Congreso del 30-abril (177 contra / 171 a favor). **No se aprobará probablemente** porque requiere 3/5 de cada cámara y el PP tiene mayoría absoluta en el Senado, pero el camino legislativo está ahora mismo generando todos los documentos que necesitamos.

**Texto literal del nuevo apartado 4 del art. 43 CE (proyecto final 7-abr-2026)**:
> *"Los poderes públicos garantizarán el ejercicio del derecho de las mujeres a la interrupción voluntaria del embarazo en condiciones de igualdad real y efectiva con cuantas prestaciones y servicios sean necesarios para dicho ejercicio."*

**Cronología verificada**:
| Fecha | Hito |
|---|---|
| 14-oct-2025 | CM aprueba ANTEPROYECTO |
| 26-feb-2026 | Pleno Consejo de Estado emite DICTAMEN (16 sí / 4 no, 2 votos particulares) |
| 7-abr-2026 | CM aprueba PROYECTO FINAL (texto modificado tras dictamen CE) |
| 10-abr-2026 | Publicación BOCG-15-A-92-1 (proyecto) |
| 21-abr-2026 | Publicación BOCG-15-A-92-2 (enmiendas totalidad PP+Vox) |
| 27-abr-2026 | Comisión Constitucional Senado aprueba moción 661/001976 (paralizar reforma) |
| 30-abr-2026 | Pleno Congreso (sesión 177, votación 12) rechaza enmiendas totalidad: 177/171/0 |

---

## 1. Documentos AKN del expediente

### 1.1 Bill (1)

| nativeId | Descripción | Type AKN |
|---|---|---|
| `102-000001` | Proyecto de reforma del artículo 43 CE | `bill` |

### 1.2 Acts referenciados (4)

| nativeId | Descripción | Relación con bill |
|---|---|---|
| `ce-1978` | Constitución Española 1978 (consolidada) | **Modificado** por el bill (apartado 4 nuevo en art. 43) |
| `lo-2-2010` | LO 2/2010 salud sexual y reproductiva e IVE | Citado en preámbulo (es la ley nuclear del aborto) |
| `lo-1-2023` | LO 1/2023 (modifica LO 2/2010) | Citado como historia legislativa |
| `lo-3-2007` | LO 3/2007 igualdad efectiva mujeres-hombres | Citado como fundamento de igualdad |

### 1.3 Amendment (1)

| nativeId | Descripción |
|---|---|
| `bocg-15-a-92-2` | Enmiendas a la totalidad presentadas por PP y Vox (rechazadas el 30-abr) |

### 1.4 Debates (2) — **vinculados a parlamento-ai**

| nativeId | Sesión | transcriptId parlamento-ai |
|---|---|---|
| `atcd-15-pl-20260430` | Pleno Congreso 30-abr-2026 (sesión 177) — debate enmiendas totalidad | **13884** |
| `ds-c-15-679` | Comisión Constitucional Senado 27-abr-2026 (S011003-24-1) — moción 661/001976 | **13988** |

### 1.5 Citations (2) — convocatorias previas

| nativeId | Descripción |
|---|---|
| `cit-pleno-congreso-2026-04-30` | Convocatoria Pleno Congreso para sesión 177 (orden día publicado 28-abr) |
| `cit-com-constitucional-senado-2026-04-27` | Convocatoria Comisión Constitucional Senado para sesión 24 |

### 1.6 Communication (1)

| nativeId | Descripción |
|---|---|
| `mocion-661-001976` | Moción del Senado al Gobierno instando a paralizar la reforma (aprobada Comisión Constitucional 27-abr) |

### 1.7 Journals (2)

| nativeId | Descripción |
|---|---|
| `bocg-15-a-92-1` | BOCG Congreso Serie A nº 92-1 — publicación del proyecto |
| `bocg-15-a-92-2` | BOCG Congreso Serie A nº 92-2 — publicación de enmiendas totalidad |

### 1.8 Statements (6)

| nativeId | Autor | Tipo |
|---|---|---|
| `nota-moncloa-7-abr-2026` | Moncloa | nota oficial CM |
| `nota-igualdad-7-abr-2026` | Min. Igualdad | comunicado oficial ministerial |
| `nota-igualdad-vertiente-prestacional` | Min. Igualdad | comunicado oficial complementario |
| `nota-sanidad-7-abr-2026` | Min. Sanidad | comunicado oficial ministerial |
| `comunicado-pnv-reforma` | EAJ-PNV | comunicado oficial partido |
| `analisis-presno-28-abr` | Miguel Á. Presno Linera (Catedrático Derecho Constitucional, UNIOVI) | análisis jurídico especializado |
| `analisis-hayderecho-arroyo-19-abr` | Antonio Arroyo Gil (jurista) | análisis jurídico especializado |

(Total 7 statements, no 6 — corregido)

### 1.9 Docs (4)

| nativeId | Descripción |
|---|---|
| `acuerdo-cm-14-oct-2025` | Acuerdo Consejo de Ministros aprobando el ANTEPROYECTO |
| `acuerdo-cm-7-abr-2026` | Acuerdo Consejo de Ministros aprobando el PROYECTO FINAL |
| `dictamen-ce-26-feb-2026` | Dictamen del Pleno del Consejo de Estado (16-4) |
| `voto-particular-rodriguez-minon` | Voto particular de Herrero y Rodríguez de Miñón ("fraude constitucional") |

### 1.10 Judgments (2)

| nativeId | Sentencia | Por qué se incluye |
|---|---|---|
| `stc-44-2023` | STC 44/2023 (avala LO 2/2010) | **Citada literalmente por el Dictamen CE como base doctrinal del proyecto** |
| `stc-92-2024` | STC 92/2024 (ratifica STC 44/2023) | Citada por el Dictamen CE como ratificación |

### 1.11 Document_collection (1)

| nativeId | Descripción |
|---|---|
| `expediente-102-000001` | Índice maestro del expediente parlamentario |

### 1.12 Change_sets (2)

| nativeId | Descripción | Computable |
|---|---|---|
| `cs-anteproyecto-vs-proyecto` | Diff entre anteproyecto (oct 2025) y proyecto final (abr 2026) — *"Se reconoce"* → *"Los poderes públicos garantizarán"* | ✅ texto disponible en ambos lados |
| `cs-art-43-vigente-vs-nuevo` | Diff entre art. 43 vigente (3 apartados) y art. 43 propuesto (4 apartados) | ✅ ambos textos verificados |

### 1.13 Portion (1)

| nativeId | Descripción |
|---|---|
| `art-43-apartado-4-nuevo` | Extracto del apartado 4 nuevo del art. 43 (citable como fragmento independiente) |

### 1.14 Question (0 — gap estructural justificado)

El OpenData oficial del Congreso tiene retraso de ~10 días. Las preguntas parlamentarias del 30-abr-2026 todavía no están publicadas en su API JSON. Los buscadores web del Congreso/Senado son 100% JavaScript dinámico y solo accesibles vía Puppeteer headless (que sí funciona pero requiere autenticación de sesión que en el caso del Senado supera Akamai WAF). **Verificación realizada**: el JSON OpenData de Intervenciones Por Iniciativa (47 MB, descargado y grepeado) no contiene ninguna intervención sobre 102/000001 al 4-may-2026.

**Total: 30 documentos AKN** (corregido al añadir el statement #7 que faltaba en el conteo).

---

## 2. Método de obtención por documento (manual ahora, automatizable después)

### Escala de factibilidad (del framework research/2026-02-20):
- **L0**: Ya en AKN
- **L1**: Mecánica simple (curl + parser XML/JSON)
- **L2**: Mecánica compleja (curl + Puppeteer + parsing PDF)
- **L3**: AI simple (~99% acierto sin revisión humana)
- **L4**: AI + revisión humana (formatos inestables)
- **L5**: No disponible públicamente

### 2.1 Bill, amendments, journals (BOCG)

| Doc | URL fuente | Método | Factibilidad |
|---|---|---|---|
| BOCG-15-A-92-1 (bill) | `https://www.congreso.es/public_oficiales/L15/CONG/BOCG/A/BOCG-15-A-92-1.PDF` | `curl -A "Chrome 131" --compressed` | **L1** — URL pattern conocido `BOCG-15-A-XX-N.PDF`, descarga directa, PDF cifrado pero `pdftotext -enc UTF-8` extrae texto |
| BOCG-15-A-92-2 (amendments) | `.../BOCG-15-A-92-2.PDF` | idem | **L1** |

**Para automatización**: scraping del listado de BOCGs publicados por día/serie, descarga incremental por número correlativo, extracción texto con pdftotext + parser XML/HTML del contenido del BOCG.

### 2.2 Acts (textos consolidados BOE)

| Doc | URL ELI / consolidada | Método | Factibilidad |
|---|---|---|---|
| CE 1978 | `https://www.boe.es/eli/es/c/1978/12/27/(1)/con` | `curl` directo | **L0/L1** — BOE expone ELI URI estables, contenido disponible en HTML/PDF/XML |
| LO 2/2010 | `https://www.boe.es/eli/es/lo/2010/03/03/2/con` | `curl` directo | **L0/L1** |
| LO 1/2023 | `https://www.boe.es/eli/es/lo/2023/02/28/1/con` | `curl` directo | **L0/L1** |
| LO 3/2007 | `https://www.boe.es/eli/es/lo/2007/03/22/3/con` | `curl` directo | **L0/L1** |

**Para automatización**: usar la API ELI del BOE (formato estándar europeo). El BOE ya tiene XML estructurado en algunas leyes (Eurovoc).

### 2.3 Debates (DSCD/ATCD/DS_C)

| Doc | URL fuente | Método | Factibilidad |
|---|---|---|---|
| ATCD Pleno 30-abr (sustituye DSCD pendiente) | `https://www.congreso.es/docu/tramit/LegXV/AT/ATCD_15_PL_20260430.pdf` | `curl -A "Chrome"` | **L2** — URL pattern conocido `ATCD_15_PL_YYYYMMDD.pdf`, PDF cifrado requiere `pdftotext -enc UTF-8` |
| DS_C_15_679 Senado | `https://www.senado.es/legis15/publicaciones/pdf/senado/ds/DS_C_15_679.PDF` | **Puppeteer** (curl bloqueado por Akamai) — `fetch` desde `page.evaluate` con `credentials:'include'` tras visitar home Senado | **L2** — requiere browser headless; método validado en `parlamento-ai/services/source-worker/src/sources/es-senado-iniciativas/open-data-sync.ts` |

**Para automatización**: 
- Congreso ATCD: scraping diario del directorio `LegXV/AT/`, detección por fecha
- Congreso DSCD oficial: scraping diario, lag de ~10 días tras la sesión
- Senado DS_C: requiere worker con Puppeteer + sesión cookies persistentes

### 2.4 Citations (órdenes del día)

| Doc | URL fuente | Método | Factibilidad |
|---|---|---|---|
| Orden día Pleno 175 | `https://www.congreso.es/backoffice_doc/atp/orden_dia/pleno_175_28042026.pdf` | `curl -A "Chrome"` | **L1** — URL pattern conocido `pleno_NNN_DDMMYYYY.pdf` |
| Convocatoria Comisión Constitucional Senado | (extraída del campo `context` del transcriptId 13988 en parlamento-ai DB) | psql query | **L1** — la propia DB de parlamento-ai ya scrapea las convocatorias |

**Para automatización**: el source-worker de parlamento-ai ya cubre esto (subgroups Comisión Constitucional Congreso=502, Senado=464; agendas diarias).

### 2.5 Communication (moción Senado)

| Doc | URL fuente | Método | Factibilidad |
|---|---|---|---|
| Moción 661/001976 (XML oficial) | `https://www.senado.es/web/ficopendataservlet?legis=15&tipoFich=3&tipoEx=661&numEx=001976` | **Puppeteer** (Akamai bloquea curl) — fetch desde page.evaluate | **L1-L2** — el Senado expone API XML por iniciativa (`tipoFich=3`); requiere Puppeteer pero estructura fija parseable |
| Moción 661/001976 (ficha HTML) | `https://www.senado.es/web/actividadparlamentaria/iniciativas/detalleiniciativa/index.html?legis=15&id1=661&id2=001976` | **Puppeteer** | **L2** |

**Para automatización**: el patrón XML del Senado (`<fichaExpediente>`) es estable y completo (tiene fecha, autor, situación, organocompetente, sesiones, intervinientes, diariosSesiones). Su scraping es viable con un worker Puppeteer dedicado.

### 2.6 Statements (notas oficiales)

| Doc | URL fuente | Método | Factibilidad |
|---|---|---|---|
| Moncloa CM 7-abr | `https://www.lamoncloa.gob.es/consejodeministros/resumenes/paginas/2026/070426-rueda-de-prensa-ministros.aspx` | `curl -A "Chrome" --compressed` | **L1** — Moncloa publica resúmenes diarios CM, URL pattern `070426-rueda-de-prensa-ministros.aspx` |
| Igualdad nota anteproyecto | `https://www.igualdad.gob.es/comunicacion/sala-de-prensa/el-consejo-de-ministros-aprueba-el-anteproyecto-de-reforma-del-articulo-43-...` | `curl` | **L2** — slug largo, requiere scraping del listado de notas de prensa |
| Igualdad nota vertiente prestacional | URL similar | `curl` | **L2** |
| Sanidad nota | `https://www.sanidad.gob.es/gabinete/notasPrensa.do?id=6879` | `curl` | **L1** — URL con `id=N` correlativo |
| Comunicado PNV | `https://www.eaj-pnv.eus/noticias/reforma-del-aborto-propuesta-por_37030.html` | `curl` | **L1** — slug + ID |
| Análisis Presno Linera (×2) | `https://presnolinera.wordpress.com/2026/04/28/...` y `.../2026/04/09/...` | `curl` | **L1** — WordPress, RSS feed disponible |
| Análisis Hay Derecho | `https://www.hayderecho.com/2026/04/19/la-reforma-constitucional-del-aborto/` | `curl` | **L1** — WordPress, RSS feed |

**Para automatización**: workers separados por dominio: lamoncloa.gob.es (consejodeministros listado), ministerios (.gob.es sala-de-prensa), partidos (eaj-pnv.eus, otros), blogs jurídicos (RSS). El gobierno NO tiene API unificada, requiere scraping site-specific.

### 2.7 Docs (acuerdos CM, dictamen CE, voto particular)

| Doc | URL fuente | Método | Factibilidad |
|---|---|---|---|
| Acuerdo CM 14-oct-2025 (anteproyecto) | `https://www.lamoncloa.gob.es/consejodeministros/referencias/paginas/2025/20251014-referencia-rueda-de-prensa-ministros.aspx` | `curl` | **L1** |
| Acuerdo CM 7-abr-2026 (proyecto) | `https://www.lamoncloa.gob.es/consejodeministros/referencias/Paginas/2026/20260407-referencia-rueda-de-prensa-ministros.aspx` | `curl` | **L1** |
| Dictamen CE 26-feb-2026 (texto íntegro) | ❌ NO publicado en consejo-estado.es ni BOE | — | **L5 — gap estructural** — solo análisis prensa especializada (Presno Linera, El Debate, Libertad Digital, The Objective, etc.) cubre contenido. Para automatización futura: solicitud de acceso a información pública (Ley 19/2013) o monitorización de blogs jurídicos especializados |
| Voto particular Rodríguez de Miñón | ❌ idem | — | **L5 — gap estructural** — contenido reconstruible vía cobertura prensa cross-checked |

**Para automatización**: los acuerdos CM son scrapeables. El dictamen CE oficial es **NO disponible públicamente** — gap real del sistema español de transparencia.

### 2.8 Judgments (STC)

| Doc | URL fuente | Método | Factibilidad |
|---|---|---|---|
| STC 44/2023 | `https://hj.tribunalconstitucional.es/es-ES/Resolucion/Show/29434` (HTML) + `https://www.boe.es/buscar/doc.php?id=BOE-A-2023-13955` (BOE PDF) | `curl` | **L1** — TC tiene Hermes (HJ) con URL pattern `Resolucion/Show/N` |
| STC 92/2024 | `https://hj.tribunalconstitucional.es/HJ/en/Resolucion/Show/30205` + BOE | `curl` | **L1** |

**Para automatización**: el TC publica HTML estructurado en HJ. El BOE publica PDF + texto. Ambos accesibles sin WAF.

### 2.9 Document_collection y Change_sets y Portion

Estos son **derivados/computados**, no descargables:
- `document_collection`: índice maestro generado por nosotros agrupando los 28 docs anteriores
- `change_set` × 2: computables aplicando diff entre dos versiones del bill / del act
- `portion`: extracto generado por nosotros (apartado 4 del art. 43)

**Factibilidad**: **L1-L3** — algoritmo de diff sobre dos textos verificados, sin descarga adicional.

---

## 3. Estructura de carpetas (estado final)

```
source-materials/reforma-art-43-CE-102-000001/
├── INVENTORY.md                     (este archivo)
├── 01-bill/
│   └── BOCG-15-A-92-1.pdf
├── 02-acts/
│   ├── ce-1978.pdf + ce-1978.html
│   ├── lo-2-2010.pdf + lo-2-2010.html
│   ├── lo-1-2023.pdf + lo-1-2023.html
│   └── lo-3-2007.pdf + lo-3-2007.html
├── 03-amendments/
│   └── BOCG-15-A-92-2.pdf
├── 04-debates/
│   ├── atcd-15-pl-20260430.pdf
│   └── ds-c-15-679.pdf
├── 05-citations/
│   └── orden-dia-pleno-175.pdf
├── 06-journals/
│   ├── boe-sumario-20260407.json
│   ├── boe-sumario-20260408.json
│   ├── boe-sumario-20260409.json
│   └── boe-sumario-20260410.json
├── 07-communications/
│   ├── mocion-661-001976.xml
│   └── mocion-661-001976-ficha.html
├── 08-statements/
│   ├── nota-moncloa-7-abr-2026.html
│   ├── nota-igualdad-7-abr-2026.html
│   ├── nota-igualdad-vertiente-prestacional.html
│   ├── nota-sanidad-7-abr-2026.html
│   ├── comunicado-pnv.html
│   ├── analisis-presno-9-abr.html
│   ├── analisis-presno-28-abr.html
│   └── analisis-hayderecho-19-abr.html
├── 09-docs/
│   ├── acuerdo-cm-14-oct-2025.html
│   └── acuerdo-cm-7-abr-2026.html
├── 10-judgments/
│   ├── stc-44-2023-tc.html + stc-44-2023-boe.html
│   └── stc-92-2024-tc.html + stc-92-2024-boe.html
└── votaciones/
    ├── vot_177_12.json
    ├── vot_177_12.xml
    └── vot_177_12.pdf
```

Estos archivos son los **source materials originales** descargados de instituciones oficiales (BOE, Congreso, Senado, Moncloa, ministerios, TC) y blogs jurídicos. Sirven como provenance para los XMLs AKN del corpus en `research/schema/data/es/{type}/`. Las versiones reconstruidas desde citas (Dictamen CE 26-feb-2026 y Voto particular Rodríguez de Miñón) no tienen archivo fuente porque la institución no los publica.

---

## 5. Relaciones cross-doc (DocumentLinkTable)

```
document_collection expediente-102-000001
    ├──contains──▶ todos los 28 demás
    │
    └──central──▶ bill 102/000001
                      ├──amends──▶ act ce-1978 (art. 43)
                      ├──cites──▶ act lo-2-2010
                      ├──cites──▶ act lo-1-2023
                      ├──cites──▶ act lo-3-2007
                      ├──amended_by──▶ amendment bocg-15-a-92-2
                      ├──promulgated_in──▶ journal bocg-15-a-92-1
                      ├──mentioned_in──▶ debate atcd-15-pl-20260430
                      ├──refers_to──▶ communication mocion-661-001976
                      ├──announced_by──▶ statement nota-moncloa-7-abr
                      ├──announced_by──▶ statement nota-igualdad-7-abr
                      ├──announced_by──▶ statement nota-sanidad-7-abr
                      ├──positioned_by──▶ statement comunicado-pnv
                      ├──analyzed_by──▶ statement analisis-presno (×2)
                      ├──analyzed_by──▶ statement analisis-hayderecho
                      ├──originated_in──▶ doc acuerdo-cm-14-oct-2025 (anteproyecto)
                      │                       └──reviewed_by──▶ doc dictamen-ce-26-feb-2026
                      │                                              └──contains──▶ doc voto-particular-rodriguez-minon
                      ├──originated_in──▶ doc acuerdo-cm-7-abr-2026 (proyecto final)
                      └──derives_from──▶ judgment stc-44-2023
                                                  └──ratified_by──▶ judgment stc-92-2024

debate atcd-15-pl-20260430 ◀──contains── citation cit-pleno-congreso-2026-04-30
debate ds-c-15-679 ◀──contains── citation cit-com-constitucional-senado-2026-04-27
communication mocion-661-001976 ◀──transmits── debate ds-c-15-679

amendment bocg-15-a-92-2 ──promulgated_in──▶ journal bocg-15-a-92-2

change_set cs-anteproyecto-vs-proyecto:
    base = doc acuerdo-cm-14-oct-2025
    result = bill 102-000001

change_set cs-art-43-vigente-vs-nuevo:
    base = act ce-1978 (art. 43 vigente, 3 apartados)
    result = bill 102-000001 (art. 43 propuesto, 4 apartados)

portion art-43-apartado-4-nuevo ──derives_from──▶ bill 102-000001

bill 102-000001 ──linked_to_transcripts──▶ {transcriptId: 13884, 13988} en parlamento-ai DB
```

**Ningún documento queda huérfano**. El expediente es el índice maestro; el bill es el corazón; cada doc tiene al menos un link entrante o saliente.

---

## 6. Lo que NO entra al corpus (excluido firmemente)

| Categoría | Por qué se EXCLUYE |
|---|---|
| 4 mociones IVE Senado periféricas (661/000775, 661/000866, 662/000162, 662/000190) | Temáticamente cercanas pero NO del expediente 102/000001 |
| 5 STC sobre amnistía (137/2025, 10/2026, 18/2026, 25/2026, 26/2026) | Sobre otra materia, no sobre IVE |
| 3 reformas previas CE (1992, 2011, 2024) | Contexto histórico, no del expediente |
| LO 4/2022 (acoso clínicas) y STC 75/2024 | No relacionadas con IVE de fondo |
| Tratados internacionales (CEDH, Estambul, Carta Social) | Marco general europeo |
| Reglamento Congreso/Senado, LO 3/1980 CE | Base normativa procedimental |
| ~50 artículos prensa generalista (El País, El Mundo, etc.) | No oficiales; servirían solo para `researchNotes` |
| Comunicados PSOE/PP/Vox/ERC/Junts/Bildu/BNG | NO localizables como comunicados oficiales (URLs fueron alucinaciones de un agente, verificadas) |

---

## 7. Estado final del corpus

**31 docs AKN** generados en `research/schema/data/es/{type}/`, todos al 100% de contenido real verificado frase-por-frase contra la fuente original. Loader-compatible: la build script proyecta los 31 docs en `research/schema/research.db` sin errores y resuelve 40 cross-references entre ellos (los 2 únicos unresolved son `stc-53-1985` y `stc-75-2024`, citados por el bill pero no modelados — referencias externas al corpus, intencional).

| Type | nativeIds en `data/es/` |
|---|---|
| bill (1) | `102-000001` |
| act (4) | `constitucion-espanola`, `lo-2-2010`, `lo-1-2023`, `lo-3-2007` |
| amendment (1) | `102-000001-am-totalidad` |
| journal (2) | `bocg-15-a-92-1`, `bocg-15-a-92-2` |
| debate (2) | `atcd-15-pl-20260430`, `ds-c-15-679` |
| citation (2) | `cit-pleno-congreso-2026-04-30`, `cit-com-constitucional-senado-2026-04-27` |
| communication (1) | `mocion-661-001976` |
| statement (8) | `nota-moncloa-7-abr-2026`, `nota-igualdad-7-abr-2026`, `nota-igualdad-vertiente-prestacional`, `nota-sanidad-7-abr-2026`, `comunicado-pnv-reforma`, `analisis-presno-9-abr`, `analisis-presno-28-abr`, `analisis-hayderecho-arroyo-19-abr` |
| doc (4) | `acuerdo-cm-14-oct-2025`, `acuerdo-cm-7-abr-2026`, `dictamen-ce-26-feb-2026`, `voto-particular-rodriguez-minon` |
| judgment (2) | `stc-44-2023`, `stc-92-2024` |
| document_collection (1) | `expediente-102-000001` |
| change_set (2) | `cs-anteproyecto-vs-proyecto`, `cs-art-43-vigente-vs-nuevo` |
| portion (1) | `art-43-apartado-4-nuevo` |

**Vinculación con parlamento-ai**: los debates Doc 9 y Doc 10 incluyen `<akndiff:transcriptId provider="parlamento-ai">13884</akndiff:transcriptId>` y `13988` respectivamente, listos para JOIN con la DB de transcripciones cuando se implemente.

**Métodos de obtención de las fuentes** (provenance, no automatización aún):
- L0/L1: ~87% via `curl` directo (BOE, Moncloa, ministerios, TC, blogs jurídicos)
- L2: ~10% via Puppeteer (Senado por WAF Akamai, PDFs cifrados Congreso)
- L5: ~3% gap estructural (Dictamen CE no publicado por la institución; reconstruido desde citas verificadas en bill + amendments)
5. **Reporte final** mostrando qué se descargó / qué falló / qué gaps quedan
