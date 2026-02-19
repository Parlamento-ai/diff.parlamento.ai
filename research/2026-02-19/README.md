# 19/02/2026 — API LeyChile + Primer boletín real completo

Dos líneas de trabajo: investigación de la **API JSON de LeyChile** como fuente de datos automatizable, y construcción del **boletín real con tramitación legislativa completa** (Ley 21.670 — Porte de Armas Aspirantes Policiales).

---

## API JSON de LeyChile

Investigamos a fondo la API como fuente para reconstruir la historia de cualquier norma chilena.

### Descubrimientos clave

- **Endpoint con versionamiento**: `nuevo.leychile.cl/servicios/Navegar/get_norma_json?idNorma=X&idVersion=YYYY-MM-DD` permite obtener el texto completo de una norma tal como estaba vigente en cualquier fecha.
- **Catálogo de versiones**: El campo `vigencias` del JSON lista todas las versiones históricas con sus rangos de fecha, permitiendo descubrir automáticamente cuántas modificaciones ha tenido una ley.
- **Anotaciones de modificación**: Cada artículo incluye anotaciones inline (`LEY XXXX`, `Art...`, `D.O...`) que referencian qué ley produjo cada cambio, lo que permite identificar la autoría de cada modificación.
- **Limitaciones**: La API solo cubre normas publicadas (leyes, DL, DFL). No rastrea boletines en trámite, indicaciones, comparados ni votaciones. Para el proceso legislativo pre-publicación se necesitan otras fuentes (Senado API, Cámara, BCN).
- **Bloqueo de acceso directo**: CloudFront bloquea requests de curl/fetch — se requiere Playwright (browser headless) para acceder.

### idNormas descubiertos

| Norma | idNorma | Versiones disponibles |
|-------|---------|----------------------|
| DL 3.500 | 7147 | Múltiples (vigencias) |
| Ley 17.798 (Control de Armas) | 29291 | Única (consolidada) |
| Ley 18.045 (Mercado de Valores) | 29472 | 32 versiones |
| Ley 21.735 (Reforma Pensiones) | 1212060 | Post-publicación |

---

## Ley 21.670 — Primer boletín real completo

Objetivo: encontrar un boletín real chileno que pudiera representarse con la misma estructura de los ejemplos ficticios (recetas), para **probar la herramienta y ver cuáles son los elementos indispensables** del formato AKN Diff.

### Por qué este boletín

Se evaluaron ~10 boletines recientes del Senado. El Boletín 15.995-02 (Ley 21.670) ganó porque:

- **Tiene 3er trámite**: el Senado modificó el texto de la Cámara, lo que genera un diff inter-cámara real
- **Es simple**: modifica un solo artículo de una sola ley (Art. 6 de Ley 17.798)
- **Tiene votación nominal**: 31-0-2 en el Senado, con los 33 nombres
- **Tramitación completa**: moción → 1er trámite → 2do trámite → 3er trámite → ley publicada

### Paso a paso

**1. Descargar metadata de tramitación**

Desde la API pública del Senado, obtuvimos la tramitación completa y votaciones.

- API tramitación: `tramitacion.senado.cl/wspublico/tramitacion.php?boletin=15995`
- API votaciones: `tramitacion.senado.cl/wspublico/votaciones.php?boletin=15995`

**2. Descargar documentos legislativos del Senado**

8 documentos del expediente, descargados con Playwright (los URLs del Senado devuelven archivos binarios, no HTML).

- Script de descarga: ([download-pdfs-v2.mjs](../../scripts/ley-21670/download-pdfs-v2.mjs))
- Documentos descargados: ([ley-21670/docs/](ley-21670/docs/))

| # | Documento | Formato | Archivo |
|---|-----------|---------|---------|
| 1 | Moción original | DOCX | [01-mocion.docx](ley-21670/docs/01-mocion.docx) |
| 2 | Indicaciones Ejecutivo | PDF | [02-indicaciones-ejecutivo.pdf](ley-21670/docs/02-indicaciones-ejecutivo.pdf) |
| 3 | Informe Comisión Cámara | DOCX | [03-informe-comision-camara.docx](ley-21670/docs/03-informe-comision-camara.docx) |
| 4 | Oficio 1er Trámite (19265) | DOCX | [04-oficio-1er-tramite.docx](ley-21670/docs/04-oficio-1er-tramite.docx) |
| 5 | Informe Comisión Senado | PDF | [05-informe-comision-senado.pdf](ley-21670/docs/05-informe-comision-senado.pdf) |
| 6 | Comparado 2do Trámite | PDF | [06-comparado-2do-tramite.pdf](ley-21670/docs/06-comparado-2do-tramite.pdf) |
| 7 | Oficio Modificaciones Senado | DOC | [07-oficio-modificaciones-senado.doc](ley-21670/docs/07-oficio-modificaciones-senado.doc) |
| 8 | Oficio Ley al Ejecutivo (19465) | DOCX | [08-oficio-ley-ejecutivo.docx](ley-21670/docs/08-oficio-ley-ejecutivo.docx) |

**3. Extraer texto y buscar norma en LeyChile**

- Script de extracción: ([extract-text.mjs](../../scripts/ley-21670/extract-text.mjs))
- Textos extraídos: ([01-mocion.txt](ley-21670/docs/01-mocion.txt)), ([04-oficio-1er-tramite.txt](ley-21670/docs/04-oficio-1er-tramite.txt)), ([08-oficio-ley-ejecutivo.txt](ley-21670/docs/08-oficio-ley-ejecutivo.txt))
- Script de búsqueda LeyChile: ([download-docs-v2.mjs](../../scripts/ley-21670/download-docs-v2.mjs)) — encontró idNorma=29291 para Ley 17.798
- JSON LeyChile: ([ley-17798-current.json](ley-21670/json/ley-17798-current.json)) — solo versión "Única" disponible

**4. Analizar cambios entre etapas**

Comparando los oficios, se identificaron 4 versiones distintas del texto:

| Etapa | Cambio respecto a la anterior |
|-------|-------------------------------|
| **Ley vigente** (Art. 6 Ley 17.798) | Estado base: 4 incisos |
| **Moción** (Jun 2023) | 1 cambio: "tercer" → "primer" en inciso 3 |
| **1er Trámite** (Mar 2024) | 3 cambios: reescribe inc. 3 (separa Carabineros de PDI), inserta inc. 4 (aspirantes Carabineros + alumnos) e inc. 5 (calidad de funcionarios) |
| **2do Trámite** (Abr 2024) | 2 cambios: redacción inc. 4 ("que estén cursando" → "que cursen", "durante la realización de" → "mientras realicen") e inc. 5 ("en las actuaciones que realicen" → "en cualquier actuación en la que participen") |
| **Ley publicada** (Jun 2024) | Sin cambios (Cámara aceptó modificaciones del Senado) |

**5. Generar AKN Diff XMLs**

- Script: ([generate-akn.mjs](../../scripts/ley-21670/generate-akn.mjs))
- AKN generados: ([ley-21670/akn/](ley-21670/akn/))

| # | Archivo | Tipo AKN | Etapa | ChangeSet | Voto |
|---|---------|----------|-------|-----------|------|
| 1 | [01-act-original.xml](ley-21670/akn/01-act-original.xml) | `act` | Ley 17.798 pre-reforma | — | — |
| 2 | [02-bill.xml](ley-21670/akn/02-bill.xml) | `bill` | Moción (2023-06-05) | 1 substitute | — |
| 3 | [03-amendment-1.xml](ley-21670/akn/03-amendment-1.xml) | `amendment` | 1er Trámite Cámara | 1 substitute + 2 inserts | 109-0 (quórum calificado) |
| 4 | [04-amendment-2.xml](ley-21670/akn/04-amendment-2.xml) | `amendment` | 2do Trámite Senado | 2 substitutes | 31-0-2 (nominal, 33 senadores) |
| 5 | [05-act-final.xml](ley-21670/akn/05-act-final.xml) | `act` | Ley 21.670 publicada | — | — |

---

## Comparativo: Paella (ejemplo ficticio) vs Ley 21.670 (legislación real)

Para evaluar qué tan completo es el boletín real respecto a los ejemplos ficticios, comparamos la Paella Valenciana (el ejemplo más rico) con la Ley 21.670.

### Estructura del timeline

| Elemento | Paella (8 docs) | Ley 21.670 (5 docs) | Estado |
|----------|-----------------|----------------------|--------|
| `act` original (ley vigente) | Receta de Yayo Pepe | Ley 17.798 Art. 6 | Presente |
| `bill` (proyecto de ley) | Dip. Madrileña: 5 cambios | Moción Castro: 1 cambio | Presente |
| `amendment` aprobada | 2 aprobadas (#2, #4) | 2 aprobadas (1er y 2do trámite) | Presente |
| `amendment` rechazada | 2 rechazadas (#1, #5) | — | **Ausente** |
| `amendment` retirada | 1 retirada (#3 cebolla) | — | **Ausente** |
| `act` final (ley promulgada) | Receta actualizada | Ley 21.670 | Presente |

### Componentes AKN Diff

| Componente | Paella | Ley 21.670 | Estado |
|------------|--------|------------|--------|
| FRBR URIs (work/expression/manifestation) | Completo | Completo | OK |
| `akndiff:changeSet` con base/result | En bill + 5 amendments | En bill + 2 amendments | OK |
| `akndiff:articleChange` type=substitute | 8 sustituciones | 4 sustituciones | OK |
| `akndiff:articleChange` type=insert | 2 inserciones (art_5bis, art_5ter) | 2 inserciones (inc4, inc5) | OK |
| `akndiff:articleChange` type=repeal | — | — | N/A |
| `akndiff:vote` result=approved | 3 votaciones | 2 votaciones | OK |
| `akndiff:vote` result=rejected | 2 votaciones | — | **No testeado** |
| `akndiff:vote` result=withdrawn | 1 votación | — | **No testeado** |
| Votantes nominales (`akndiff:voter`) | 8 diputados ficticios | 33 senadores reales + 109 diputados (agregado) | OK |
| `akndiff:old` + `akndiff:new` (word diff) | En cada substitute | En cada substitute | OK |
| `<section>` con heading | 4 títulos (Arroz, Proteínas, etc.) | — (artículo directo en body) | **Ausente** |
| Múltiples artículos en body | 11 artículos + art_5bis | 1 artículo + inc4, inc5 | Simplificado |
| Lifecycle events (eventRef) | En act-final | — | **Ausente** |
| TLCPerson / TLCOrganization | 8 personas ficticias | 1 persona + 2 organizaciones | Simplificado |

### Lo que falta para igualar a los ejemplos

1. **Amendments rechazados/retirados**: La Ley 21.670 no tuvo indicaciones rechazadas. Para testear `result=rejected` y `result=withdrawn` necesitamos un boletín con indicaciones que hayan sido votadas y rechazadas.

2. **Secciones (`<section>`)**: Los ejemplos agrupan artículos en secciones con headings. La Ley 21.670 solo modifica un artículo, por lo que no tiene secciones. Un boletín con más artículos (como la Ley 21.735) cubriría esto.

3. **Lifecycle events**: Los act-final de los ejemplos incluyen `<lifecycle><eventRef>` que traza la historia completa de enmiendas. No lo implementamos en la Ley 21.670 por simplificar.

4. **Escala de artículos**: El ejemplo tiene 11 artículos, la ley real tiene 1. No es un problema del formato, sino de la complejidad del caso elegido. La Ley 21.735 (350→129 artículos) ya cubre escala.

### Conclusión

Los **elementos indispensables** del formato están todos presentes y funcionando con legislación real:
- `changeSet` encadenados con base/result
- `articleChange` con substitute e insert
- `vote` con votantes nominales
- Word diff (`old`/`new`)
- FRBR URIs reales

Lo que queda por testear son los **edge cases** (rejected, withdrawn, repeal, lifecycle events), que no dependen del formato sino de encontrar boletines con esas características.

---

## Estructura de archivos

```
  research/2026-02-19/
  └── ley-21670/
      ├── docs/           ← 8 documentos legislativos (DOCX/PDF/DOC) + textos extraídos
      │   ├── 01-mocion.docx / .txt
      │   ├── 02-indicaciones-ejecutivo.pdf
      │   ├── 03-informe-comision-camara.docx / .txt
      │   ├── 04-oficio-1er-tramite.docx / .txt
      │   ├── 05-informe-comision-senado.pdf
      │   ├── 06-comparado-2do-tramite.pdf
      │   ├── 07-oficio-modificaciones-senado.doc / .txt
      │   └── 08-oficio-ley-ejecutivo.docx / .txt
      ├── json/           ← Datos de LeyChile
      │   ├── _idnorma-17798.txt
      │   ├── ley-17798-current.json
      │   ├── ley-17798-pre-reform.json
      │   └── ley-17798-post-reform.json
      └── akn/            ← XMLs AKN generados (5 archivos)
          ├── 01-act-original.xml
          ├── 02-bill.xml
          ├── 03-amendment-1.xml
          ├── 04-amendment-2.xml
          └── 05-act-final.xml
```

### Scripts

| Script | Función |
|--------|---------|
| [download-pdfs-v2.mjs](../../scripts/ley-21670/download-pdfs-v2.mjs) | Descarga 8 documentos del Senado con Playwright |
| [download-docs-v2.mjs](../../scripts/ley-21670/download-docs-v2.mjs) | Busca idNorma y descarga JSON de LeyChile |
| [extract-text.mjs](../../scripts/ley-21670/extract-text.mjs) | Extrae texto de DOCX/PDF/DOC |
| [generate-akn.mjs](../../scripts/ley-21670/generate-akn.mjs) | Genera los 5 XMLs AKN Diff |
