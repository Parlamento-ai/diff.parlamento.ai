# 19/02/2026 — API LeyChile + Boletines reales completos

Cuatro líneas de trabajo: investigación de la **API JSON de LeyChile** como fuente de datos automatizable, construcción del **primer boletín real con tramitación completa** (Ley 21.670), construcción del **primer boletín con voto de rechazo** (Boletín 17.370-17), y construcción del **primer boletín con Comisión Mixta** (Ley 21.120).

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

## Boletín 17.370-17 — Primer boletín con voto RECHAZADO

Objetivo: testear el elemento `result="rejected"` en AKN Diff, que hasta ahora solo existía en los ejemplos ficticios (recetas), nunca con legislación real.

### Por qué este boletín

Se buscó un boletín real chileno que hubiera sido **rechazado en votación nominal** en el Senado. El Boletín 17.370-17 cumple porque:

- **Voto nominal de rechazo**: 21 a favor / 24 en contra (45 senadores con nombre)
- **Tiene texto legislativo real**: 4 artículos sobre cumplimiento alternativo de penas
- **Tiene modificaciones de comisión**: la Comisión de DDHH reestructuró los artículos antes de la Sala
- **Es compacto**: 4 artículos, ideal para verificar el formato sin sobrecarga

### Contexto legislativo

El proyecto regulaba la suspensión y cumplimiento alternativo de penas privativas de libertad para condenados ancianos, enfermos terminales o discapacitados graves. Fue presentado por senadores de Chile Vamos (Chahuán, Ebensperger, Cruz-Coke, Kusanovic, Kuschel) y generó fuerte debate por su aplicabilidad a condenados por causas de DDHH del período militar.

La Comisión de DDHH aprobó el proyecto con modificaciones (eliminó la suspensión de pena, agregó definición de reclusión domiciliaria, incluyó protección a víctimas), pero la Sala del Senado lo rechazó en votación general el 21/01/2026.

### Paso a paso

**1. Descubrir documentos en el Senado**

Usando Playwright para navegar la página de tramitación del Senado, se extrajeron los IDs de los 4 documentos del expediente.

- URL: `tramitacion.senado.cl/appsenado/templates/tramitacion/index.php?boletin_ini=17370-17`
- IDs descubiertos: 18004 (moción), 34548 (oficio CS consulta), 34824 (oficio CS respuesta), 27646 (informe comisión DDHH)

**2. Descargar documentos**

- Script: ([download-docs.mjs](../../scripts/ley-17370/download-docs.mjs))
- Documentos descargados: ([ley-17370/docs/](ley-17370/docs/))

| # | Documento | Formato | Archivo | Tamaño |
|---|-----------|---------|---------|--------|
| 1 | Moción (texto del proyecto) | PDF | [01-mocion.pdf](ley-17370/docs/01-mocion.pdf) | 21 págs |
| 2 | Oficio consulta Corte Suprema | DOC | [02-oficio-consulta-cs.doc](ley-17370/docs/02-oficio-consulta-cs.doc) | 1.2K chars |
| 3 | Oficio respuesta Corte Suprema | PDF | [03-oficio-respuesta-cs.pdf](ley-17370/docs/03-oficio-respuesta-cs.pdf) | Escaneado (sin texto) |
| 4 | Informe Comisión DDHH | PDF | [04-informe-comision-ddhh.pdf](ley-17370/docs/04-informe-comision-ddhh.pdf) | 193 págs, 519K chars |

**3. Extraer texto**

- Script: ([extract-text.mjs](../../scripts/ley-17370/extract-text.mjs))
- Usó `pdf-parse` v2 (API nueva: `PDFParse` class, `getText()` retorna `{ pages, text, total }`)
- Usó `word-extractor` para archivos .doc
- El oficio de la Corte Suprema (03) es un PDF escaneado sin texto extraíble

**4. Analizar cambios entre etapas**

Se compararon los textos del proyecto en la moción original y en el informe de la comisión:

| Artículo | Moción original | Comisión DDHH | Tipo de cambio |
|----------|-----------------|---------------|----------------|
| Art. 1 (Principios) | 5 letras a)-e) minúscula | 5 letras A)-E) mayúscula | substitute (capitalización) |
| Art. 2 | "Suspensión de la pena" (3 causales) | "Reclusión domiciliaria total" (definición + protección víctimas) | substitute (reescritura completa) |
| Art. 3 | Sin nombre, cumplimiento alternativo | "Cumplimiento alternativo de la pena" (ajuste redacción) | substitute |
| Art. 4 | Sin nombre, procedimiento | "Procedimiento" (elimina ref. a suspensión, ajusta refs internas) | substitute |

**5. Obtener datos de votación**

- API: `tramitacion.senado.cl/wspublico/votaciones.php?boletin=17370`
- Fecha: 21/01/2026
- Resultado: **RECHAZADO** (21-24-0)
- 21 a favor (oposición): De Urresti, Insulza, Ordenes, Flores, Núñez A., Pascual, Saavedra, Walker, Araya, Quintana, Campillai, Vodanovic, Espinoza, Provoste, Lagos W., Rincón, Latorre, Castro J.L., Sepúlveda, Velásquez, De Rementería
- 24 en contra (oficialismo + independientes): Moreira, Ossandón, Durana, Edwards, Gatica, Keitel, Kusanovic, Macaya, Coloma, García, Kuschel, Chahuán, Ebensperger, Prohens, Sandoval, Núñez P., Sanhueza, Cruz-Coke, Pugh, Castro J.E., Galilea, Aravena, Kast, Van Rysselberghe

**6. Generar AKN Diff XMLs**

- Script: ([generate-akn.mjs](../../scripts/ley-17370/generate-akn.mjs))
- AKN generados: ([ley-17370/akn/](ley-17370/akn/))

| # | Archivo | Tipo AKN | Etapa | ChangeSet | Voto |
|---|---------|----------|-------|-----------|------|
| 1 | [01-bill.xml](ley-17370/akn/01-bill.xml) | `bill` | Moción (2025-03-04) | — | — |
| 2 | [02-amendment-1.xml](ley-17370/akn/02-amendment-1.xml) | `amendment` | Informe Comisión + Sala | 4 substitutes | **RECHAZADO 21-24** (45 senadores nominales) |

### Novedades técnicas

Este boletín introdujo varios **firsts** en el proyecto:

1. **`result="rejected"`**: Primera votación de rechazo con datos reales (45 senadores nominales)
2. **Boletín sin `act` original**: El primer documento es un `bill`, no un `act`. Requirió:
   - Modificar `xml-parser.ts` para parsear el `<body>` de documentos `bill` (antes solo parseaba `act`)
   - Modificar `[version]/+page.server.ts` para buscar el documento base por `body` en vez de `type === 'act'`
   - Agregar prop `firstVersion` a `BoletinCard.svelte` para que el link apunte a `/bill` en vez de `/original`
3. **pdf-parse v2**: Primera vez usando la nueva API (clase `PDFParse`, método `getText()` que retorna objeto)

### Actualización del comparativo

Con este boletín, el estado de cobertura de elementos AKN Diff queda:

| Componente | Paella (ficción) | Ley 21.670 | Bol. 17.370-17 | Estado |
|------------|-----------------|------------|----------------|--------|
| `vote` result=approved | 3 | 2 | — | OK |
| **`vote` result=rejected** | 2 | — | **1 (21-24)** | **OK** |
| `vote` result=withdrawn | 1 | — | — | Solo ficción |
| `articleChange` type=substitute | 8 | 4 | 4 | OK |
| `articleChange` type=insert | 2 | 2 | — | OK |
| `articleChange` type=repeal | — | — | — | No testeado |
| Votantes nominales reales | — | 33 | **45** | OK |
| Bill como primer documento | — | — | **Sí** | OK |

---

## Ley 21.120 — Primer boletín con Comisión Mixta

Objetivo: testear el mecanismo de **Comisión Mixta** en AKN Diff — cuando la cámara revisora rechaza las modificaciones de la cámara de origen, se activa una comisión bicameral que produce un texto de consenso.

### Por qué este boletín

Se evaluaron ~8 boletines chilenos con tramitación compleja. El Boletín 8924-07 (Ley 21.120 — Identidad de Género) ganó porque:

- **Tiene Comisión Mixta**: la Cámara rechazó las modificaciones del Senado en el 2do trámite, activando la comisión bicameral
- **6 votaciones de rechazo**: múltiples momentos donde se rechazaron propuestas durante el proceso
- **Votación más estrecha del sistema**: 22-18 en Comisión Mixta (el margen más ajustado entre todos los boletines)
- **28 votaciones totales**: el proceso legislativo más largo y complejo implementado hasta ahora
- **Escala manejable**: 29 artículos permanentes + 3 transitorios en la ley final

### Contexto legislativo

El proyecto reconoce y da protección al derecho a la identidad de género. Fue presentado como moción de 11 artículos en 2013 y tardó 5 años en convertirse en ley. El proceso incluyó:

- **1er Trámite (Senado)**: aprobación en general (29-0-3) pero con controversia sobre los derechos de menores de edad
- **2do Trámite (Cámara)**: la Cámara amplió significativamente el proyecto (de 13 a ~29 artículos), agregando disposiciones sobre menores y no discriminación
- **Rechazo del Senado**: el Senado rechazó las modificaciones de la Cámara, lo que activó la Comisión Mixta
- **Comisión Mixta**: produjo un texto de consenso con 32 artículos, aprobado con margen estrecho (22-18)
- **Publicación**: Ley 21.120 promulgada el 10/12/2018

### Paso a paso

**1. Descargar metadata y documentos del Senado**

- API votaciones: `tramitacion.senado.cl/wspublico/votaciones.php?boletin=8924` → 28 votaciones
- API tramitación: `tramitacion.senado.cl/wspublico/tramitacion.php?boletin=8924` → 146 trámites
- Script de descarga: ([download-docs.mjs](../../scripts/ley-21120/download-docs.mjs))
- 11 documentos descargados del expediente (todos en formato .doc)
- Documentos clave: moción, informe comisión DDHH, oficio ley Cámara, oficio modificaciones Senado, informe Comisión Mixta, comparado Sala

**2. Extraer texto**

- Script: ([extract-text.mjs](../../scripts/ley-21120/extract-text.mjs))
- Usó `word-extractor` para los 11 archivos .doc
- Textos clave extraídos:
  - `01-mocion.txt` (13,254 chars): 11 artículos permanentes + 1 transitorio
  - `04-oficio-ley-camara.txt` (20,635 chars): 13 artículos permanentes + 2 transitorios (texto post-Senado 1er trámite)
  - `08-informe-comision-mixta.txt` (769,091 chars): informe completo de la Comisión Mixta

**3. Obtener ley publicada de LeyChile**

- idNorma: 1126480
- JSON API: `nuevo.leychile.cl/servicios/Navegar/get_norma_json?idNorma=1126480`
- Resultado: 29 artículos permanentes + 3 transitorios

**4. Analizar cambios entre etapas**

| Etapa | Artículos | Cambios respecto a anterior |
|-------|-----------|----------------------------|
| **Moción** (2013-05-07) | 12 (11 perm + 1 trans) | Estado base |
| **1er Trámite: Senado** (2017-09-14) | 15 (13 perm + 2 trans) | 15 cambios (12 substitutes + 3 inserts) |
| **2do Trámite: Cámara** (2018-06-12) | — | **RECHAZADO** por el Senado (6 cambios clave propuestos) |
| **Comisión Mixta** (2018-08-28) | 32 (29 perm + 3 trans) | 32 cambios (15 substitutes + 17 inserts) |
| **Ley publicada** (2018-12-10) | 32 (29 perm + 3 trans) | Sin cambios respecto a C. Mixta |

**5. Generar AKN Diff XMLs**

- Script: ([generate-akn.mjs](../../scripts/ley-21120/generate-akn.mjs))
- AKN generados: ([ley-21120/akn/](ley-21120/akn/))

| # | Archivo | Tipo AKN | Etapa | ChangeSet | Voto |
|---|---------|----------|-------|-----------|------|
| 1 | [01-bill.xml](ley-21120/akn/01-bill.xml) | `bill` | Moción (2013-05-07) | — | — |
| 2 | [02-amendment-1.xml](ley-21120/akn/02-amendment-1.xml) | `amendment` | 1er Trámite Senado | 15 cambios | 29-0-3 |
| 3 | [03-amendment-2.xml](ley-21120/akn/03-amendment-2.xml) | `amendment` | 2do Trámite Cámara | 6 cambios | **RECHAZADO** |
| 4 | [04-amendment-3.xml](ley-21120/akn/04-amendment-3.xml) | `amendment` | Comisión Mixta | 32 cambios | **22-18** |
| 5 | [05-act-final.xml](ley-21120/akn/05-act-final.xml) | `act` | Ley 21.120 publicada | — | — |

### Novedades técnicas

1. **Comisión Mixta como `amendment`**: La Comisión Mixta se representa como un `amendment` más en la cadena, con su propio `changeSet` que aplica cambios sobre el estado post-1er trámite (ya que el 2do trámite fue rechazado y no modifica el estado)
2. **`result="rejected"` que NO aplica cambios**: El amendment del 2do trámite tiene `result="rejected"`, lo que significa que el `state-reconstructor` no aplica esos cambios al reconstruir el estado acumulado
3. **Votación más estrecha**: 22-18 con 40 senadores nominales, el margen más ajustado del sistema

### Actualización del comparativo

Con este boletín, el estado de cobertura de elementos AKN Diff queda:

| Componente | Paella (ficción) | Ley 21.670 | Bol. 17.370 | **Ley 21.120** | Estado |
|------------|-----------------|------------|-------------|----------------|--------|
| `vote` result=approved | 3 | 2 | — | **2 (29-0-3, 22-18)** | OK |
| `vote` result=rejected | 2 | — | 1 (21-24) | **1 (Cámara)** | OK |
| `vote` result=withdrawn | 1 | — | — | — | Solo ficción |
| `articleChange` type=substitute | 8 | 4 | 4 | **27** | OK |
| `articleChange` type=insert | 2 | 2 | — | **20** | OK |
| `articleChange` type=repeal | — | — | — | — | No testeado |
| Votantes nominales reales | — | 33 | 45 | **40** | OK |
| Bill como primer documento | — | — | Sí | **Sí** | OK |
| **Comisión Mixta** | — | — | — | **Sí** | **Nuevo** |
| **Múltiples rejected** | — | — | — | **6 votaciones** | **Nuevo** |

---

## Estructura de archivos

```
  research/2026-02-19/
  ├── ley-21670/
  │   ├── docs/           ← 8 documentos legislativos (DOCX/PDF/DOC) + textos extraídos
  │   ├── json/           ← Datos de LeyChile (Ley 17.798)
  │   └── akn/            ← XMLs AKN generados (5 archivos)
  ├── ley-17370/
  │   ├── docs/           ← 4 documentos legislativos (PDF/DOC) + textos extraídos
  │   └── akn/            ← XMLs AKN generados (2 archivos: bill + amendment rechazado)
  ├── ley-21120-docs/     ← 11 documentos legislativos (.doc) + textos extraídos
  └── ley-21120/
      ├── json/           ← Datos de LeyChile (Ley 21.120, idNorma 1126480)
      └── akn/            ← XMLs AKN generados (5 archivos: bill + 3 amendments + act-final)
```

### Scripts

**Ley 21.670**

| Script | Función |
|--------|---------|
| [download-pdfs-v2.mjs](../../scripts/ley-21670/download-pdfs-v2.mjs) | Descarga 8 documentos del Senado con Playwright |
| [download-docs-v2.mjs](../../scripts/ley-21670/download-docs-v2.mjs) | Busca idNorma y descarga JSON de LeyChile |
| [extract-text.mjs](../../scripts/ley-21670/extract-text.mjs) | Extrae texto de DOCX/PDF/DOC |
| [generate-akn.mjs](../../scripts/ley-21670/generate-akn.mjs) | Genera los 5 XMLs AKN Diff |

**Boletín 17.370-17**

| Script | Función |
|--------|---------|
| [download-docs.mjs](../../scripts/ley-17370/download-docs.mjs) | Descarga 4 documentos del Senado con Playwright |
| [extract-text.mjs](../../scripts/ley-17370/extract-text.mjs) | Extrae texto de PDF/DOC |
| [generate-akn.mjs](../../scripts/ley-17370/generate-akn.mjs) | Genera los 2 XMLs AKN Diff (bill + amendment rechazado) |

**Ley 21.120**

| Script | Función |
|--------|---------|
| [download-docs.mjs](../../scripts/ley-21120/download-docs.mjs) | Descarga 11 documentos del Senado con Playwright |
| [extract-text.mjs](../../scripts/ley-21120/extract-text.mjs) | Extrae texto de .doc |
| [generate-akn.mjs](../../scripts/ley-21120/generate-akn.mjs) | Genera los 5 XMLs AKN Diff (bill + 3 amendments + act-final) |
