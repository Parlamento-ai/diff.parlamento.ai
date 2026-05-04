# Phase 2 España — Reforma constitucional art. 43 CE

> Fecha del trabajo: 2026-05-04.
> Caso modelado: Reforma del artículo 43 CE — expediente 102/000001 (2025-2026).
> Schema validado: v3 (`research/schema/v3-schema.ts`).
> Estado al 4-may-2026: en plazo de enmiendas al articulado en la Comisión Constitucional, tras superar el debate de enmiendas a la totalidad en el Pleno del Congreso del 30-abr (votación nº 12: 177 contra el rechazo / 171 a favor del rechazo / 0 abstenciones / 2 no votan, sobre 348 presentes).

---

## 1. Caso

Se eligió la reforma constitucional del artículo 43 CE (que añade un nuevo apartado 4 garantizando el ejercicio del derecho de las mujeres a la interrupción voluntaria del embarazo en igualdad real y efectiva) porque es el único expediente vivo de España que toca **13 de los 14 DocumentTypes** de AKN con UN solo caso real, sin ejemplos ficticios:

- bill (1) · act (4: CE 1978 + 3 LOs) · amendment (1) · journal (2 BOCG) · debate (2) · citation (2) · communication (1) · statement (8) · doc (4) · judgment (2) · document_collection (1) · change_set (2) · portion (1).
- `question` queda como gap estructural justificado: el OpenData del Congreso tiene retraso de ~10 días y no hay preguntas parlamentarias publicadas todavía sobre 102/000001.

Total: **31 docs ES** modelados, todos al 100% de contenido real (verificación frase-a-frase contra fuente original del BOE/BOCG/HTML/PDF).

---

## 2. Bill page — comportamiento observado en `/demo/[country]/bill/[id]/`

Esta es la primera vez que un bill modelado en el proyecto llega a la UI con `<lifecycle>` + `<workflow>` + `<analysis>` poblados (los anteriores solo tenían `<lifecycle>`). Al abrir el bill 102/000001 en la página, se observan tres comportamientos del renderer que son útiles documentar:

### 2.1 Timeline duplica cada evento

**Lo que se ve**: cada fecha aparece como dos filas — una con la descripción larga del lifecycle (`showAs` del `<eventRef>`) y otra con el outcome corto del workflow (`outcome` del `<step>`: "publicado", "anteproyecto-aprobado", "dictamen-favorable-con-reservas", etc.).

**Lo que tiene el ejemplo**: cada `<step>` y cada `<eventRef>` lleva los dos atributos `refersTo` y `source` apuntando a las mismas TLCEvents. La estructura está preparada para la unificación.

**Lo que el parser hace hoy**: bucketea `<lifecycle><eventRef>` por `attr(n, 'source')` y `<workflow><step>` por `attr(n, 'refersTo')`. Como las claves son distintas, los eventos no se mergean en una sola fila.

**Lo que daría una sola fila por evento**: si el parser usara también `attr(n, 'source')` para `<step>` (como ya hace para `<eventRef>`), las dos filas se unirían en una con toda la información combinada (label largo del lifecycle + outcome del workflow + agente + cualquier modificación asociada).

### 2.2 `<p>` con `<ref>` mid-text

**Lo que se ve**: el párrafo "El artículo 43 de la **Constitución Española** queda redactado en los siguientes términos:" se muestra como "**Constitución Española** El artículo 43 de la queda redactado en los siguientes términos:" — el contenido del `<ref>` aparece antes del texto que lo precede en el XML.

**Lo que tiene el ejemplo**: mixed content válido per AKN spec: `<p>El artículo 43 de la <ref href="/akn/es/act/1978-12-27/constitucion-espanola">Constitución Española</ref> queda redactado en los siguientes términos:</p>`.

**Lo que se necesita en el parser**: que XMLParser preserve el orden documental del mixed content (`preserveOrder: true`), o que `parseBodyNode` recorra hijos de `<p>` en orden y serialice texto + elementos en la secuencia original.

### 2.3 Aviso en eventos con `<textualMod>` cross-document

**Lo que se ve**: al hacer clic en el evento del 13-abr (Publicación BOCG-92-1), el panel de detalle muestra el aviso ⚠ "Modification targets eId '!main#art_43' which does not exist in <body>".

**Lo que tiene el ejemplo**: `<textualMod type="insertion" destination="/akn/es/act/1978-12-27/constitucion-espanola/!main#art_43">` apunta cross-document al artículo 43 del act CE 1978 (otro documento modelado, accesible vía su FRBR URI). El target NO está en el body del propio bill — el bill solo contiene un `<quotedStructure>` con el nuevo apartado dentro de `<article eId="art_unico">`.

**Lo que se necesita en el parser**: distinguir entre `destination` cross-document (con prefijo `/akn/...`, debería resolverse contra los demás documentos del proyecto) y `destination` intra-document (eId local). En el primer caso, el target vive en otro doc.

---

## 3. Páginas tipo-específicas — qué muestra hoy y qué se desaprovecha

La página actual de tipo (`src/routes/demo/[country]/[type]/[nativeId]/+page.svelte`) es genérica para todos los tipos excepto `bill`: muestra header (título, fechas), Events, Versions con toggle "show AKN XML", Outgoing/Incoming links y un bloque expandible "Raw database state" con las filas de la tabla compartida + tabla type-specific.

**Sí se renderiza para todos los tipos**: metadata (FRBR, fechas, país), eventos del lifecycle, links entrantes/salientes, blob XML completo.

**No se renderiza el contenido sustantivo** modelado dentro de cada tipo. Lo que esto significa para los 13 tipos del expediente 102/000001:

| Type | Lo que el ejemplo tiene en su body/contenido |
|---|---|
| **act** (CE 1978 + 3 LOs) | Cientos de artículos con jerarquía títulos > capítulos > secciones > apartados, preámbulo, disposiciones, firma |
| **debate** (atcd Pleno + ds-c Senado) | 45+ `<speech>` por orador con `<from>`, `<role>`, párrafos del interviniente, votación final |
| **judgment** (STC 44/2023, STC 92/2024) | `<introduction>` + `<background>` con antecedentes y fundamentos jurídicos completos |
| **statement** (8 docs) | `<mainBody><hcontainer>` con headings + párrafos sustantivos del análisis/comunicado |
| **change_set** (2 docs) | `<akndiff:changeSet>` con `<akndiff:from>` / `<akndiff:to>` / `<akndiff:explanation>` (la representación conceptual del proyecto akndiff) |
| **journal** (BOCG-92-1, BOCG-92-2) | El texto íntegro del bill / amendments embebido dentro del boletín oficial, con preface BOCG, preamble del acuerdo de la Mesa, body con quotedStructure |
| **amendment** | Texto íntegro de las dos enmiendas a la totalidad (PP nº 5 + VOX nº 6), justificación, `<akndiff:vote>` con detalle 348/171/177/0/2 |
| **citation** (2 órdenes del día) | Estructura jerárquica de los puntos del orden con num, heading, autor por punto |
| **communication** (mocion 661/001976) | Título + defensa del proponente + parte dispositiva + resultado de la votación |
| **document_collection** (expediente-102-000001) | 27 `<componentRef>` que indexan todo el expediente parlamentario (apto para ser un índice navegable) |
| **portion** (art-43-apartado-4-nuevo) | Extracto citable del nuevo apartado 4 con `includedIn` apuntando al bill |
| **doc** (acuerdos CM, dictamen, voto particular) | Contenido sustantivo de cada documento (acuerdos del Consejo de Ministros, dictamen reconstruido desde citas, voto particular reconstruido) |

Para que esa información sustantiva sea visible al usuario, hace falta un renderer tipo-específico por cada uno (siguiendo el mismo patrón de `parse.ts` + `+page.svelte` + sub-componentes que existe hoy para `bill`).
