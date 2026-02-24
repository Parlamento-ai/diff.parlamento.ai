# Spain AKN Pipeline — Guia de Implementacion

Pipeline para convertir legislacion espanola en AKN 3.0 XML con diffs, siguiendo la misma arquitectura de `pipeline/cl/` y `pipeline/eu/`.

## Viabilidad confirmada

| Aspecto | Chile (`pipeline/cl/`) | EU (`pipeline/eu/`) | Espana (`pipeline/es/`) |
|---|---|---|---|
| Fases | 6 (discover->generate) | 6 (discover->enrich) | 6 (discover->enrich) |
| Fuente datos | APIs Camara/Senado + LeyChile | CELLAR SPARQL + EUR-Lex Formex | BOE API REST + Congreso/Senado OpenData |
| Conversion | PDF -> texto -> AKN | Formex XML -> AKN | BOE XML (`<bloque>`) -> AKN |
| Diffs | `changeSet` con article changes | `changeSet` con article changes | `changeSet` con article changes |
| Votos | Votantes individuales por API | Votos EP por OpenData | Votaciones nominales Congreso (XML/JSON) |
| Versionado | LeyChile (reconstruido) | Reconstruido desde Formex | BOE lo da nativo (todas las versiones por articulo) |
| Identificadores | Numero de boletin | CELEX + procedure code | ELI URIs (90,000+ leyes) |
| Tipos compartidos | `src/lib/types.ts` | Mismo sistema de tipos | Mismo sistema de tipos |
| Dificultad estimada | Alta (PDFs) | Media (SPARQL + Formex) | Media-Baja (API REST + XML limpio) |

**Conclusion**: Espana es el pipeline mas favorable de los tres. El BOE ya entrega versionado por articulo que Chile y EU tienen que reconstruir.

---

## Fuentes de datos

### 1. BOE API de Legislacion Consolidada (fuente principal)

**Base URL**: `https://www.boe.es/datosabiertos/api/legislacion-consolidada`

**Header requerido**: `Accept: application/xml` (no soporta JSON)

**Documentacion oficial**: https://www.boe.es/datosabiertos/api/api.php

**Documentacion PDF**: https://www.boe.es/datosabiertos/documentos/APIconsolidada.pdf

| Endpoint | Que devuelve |
|---|---|
| `/id/{id}` | Metadata completa + analisis + ELI de una ley |
| `/id/{id}/metadatos` | Solo metadatos |
| `/id/{id}/metadata-eli` | Metadatos ELI (RDF) |
| `/id/{id}/analisis` | Referencias cruzadas (que leyes modifica/la modifican) |
| `/id/{id}/texto` | Texto completo con TODAS las versiones historicas |
| `/id/{id}/texto/indice` | Indice de bloques (lista ligera de ids y titulos) |
| `/id/{id}/texto/bloque/{id_bloque}` | Un articulo especifico con todas sus versiones |

**Ejemplo real**:
```bash
curl -s -H "Accept: application/xml" \
  "https://www.boe.es/datosabiertos/api/legislacion-consolidada/id/BOE-A-2018-16673/texto/bloque/a2"
```

### 2. Congreso de los Diputados Open Data

**URL**: https://www.congreso.es/datos-abiertos

Datasets en XML, JSON y CSV:
- **Votaciones**: `https://www.congreso.es/opendata/votaciones` — votaciones nominales por sesion plenaria
- **Iniciativas**: `https://www.congreso.es/opendata/iniciativas` — metadatos (NO textos completos)
- **Diputados**: informacion de diputados por legislatura
- **Intervenciones**: discursos parlamentarios

**Limitacion**: Solo metadatos de iniciativas, no textos. Los textos estan en PDFs del BOCG.

### 3. Senado Open Data

**URL**: https://www.senado.es/web/relacionesciudadanos/datosabiertos/catalogodatos/

- **Enmiendas y vetos**: https://www.senado.es/web/relacionesciudadanos/datosabiertos/catalogodatos/enmiendasvetos/ — XML estructurado por iniciativa
- **Votaciones**: por iniciativa
- **Publicaciones BOCG Senado**: XML desde 1977

**Ventaja**: El Senado SI ofrece enmiendas estructuradas en XML.

### 4. ELI (European Legislation Identifier)

- **90,000+ leyes** identificadas con URIs ELI
- Portal: https://www.boe.es/eli/
- Sitemap mensual: https://boe.es/eli/sitemap.xml
- Feed ATOM diario: https://boe.es/eli/eli-update-feed.atom
- Documentacion tecnica: https://www.elidata.es/

**Estructura URI ELI**:
```
https://www.boe.es/eli/es/lo/2018/12/05/3        -> Ley Organica 3/2018 (HTML)
https://www.boe.es/eli/es/lo/2018/12/05/3/dof     -> Version original (date of first publication)
https://www.boe.es/eli/es/lo/2018/12/05/3/con      -> Version consolidada actual
```

---

## Estructura XML del BOE (lo que recibimos)

### Envelope

```xml
<?xml version="1.0" encoding="utf-8"?>
<response>
  <status>
    <code>200</code>
    <text>ok</text>
  </status>
  <data>
    <!-- contenido aqui -->
  </data>
</response>
```

### Metadatos (`/id/{id}`)

```xml
<data>
  <metadatos>
    <identificador>BOE-A-2018-16673</identificador>
    <ambito codigo="1">Estatal</ambito>
    <departamento codigo="7723">Jefatura del Estado</departamento>
    <rango codigo="1290">Ley Organica</rango>
    <fecha_disposicion>20181205</fecha_disposicion>
    <numero_oficial>3/2018</numero_oficial>
    <titulo>Ley Organica 3/2018, de 5 de diciembre, de Proteccion de Datos...</titulo>
    <fecha_publicacion>20181206</fecha_publicacion>
    <fecha_vigencia>20181207</fecha_vigencia>
    <estatus_derogacion>N</estatus_derogacion>
    <estado_consolidacion codigo="3">Finalizado</estado_consolidacion>
    <url_eli>https://www.boe.es/eli/es/lo/2018/12/05/3</url_eli>
  </metadatos>
  <analisis>
    <materias>
      <materia codigo="7854">Proteccion de datos personales</materia>
    </materias>
    <referencias>
      <anteriores>  <!-- Leyes que ESTA ley modifica -->
        <anterior>
          <id_norma>BOE-A-2015-11719</id_norma>
          <relacion codigo="270">MODIFICA</relacion>
          <texto>el art. 14 de la Ley del Estatuto Basico...</texto>
        </anterior>
      </anteriores>
      <posteriores>  <!-- Leyes que modifican ESTA ley -->
        <posterior>
          <id_norma>BOE-A-2021-8806</id_norma>
          <relacion codigo="270">MODIFICA</relacion>
          <texto>el art. 2 y la disposicion adicional 5...</texto>
        </posterior>
      </posteriores>
    </referencias>
  </analisis>
</data>
```

**Codigos de relacion**:
- `210` = DEROGA
- `230` = SE DEJA SIN EFECTO
- `270` = MODIFICA
- `407` = ANADE
- `440` = SE DICTA DE CONFORMIDAD

### Texto con versiones (`/id/{id}/texto`)

La ley se representa como lista plana de `<bloque>` (sin nesting):

```xml
<data>
  <texto>
    <bloque id="pr" tipo="preambulo" titulo="[preambulo]">
      <version id_norma="BOE-A-2018-16673" fecha_publicacion="20181206" fecha_vigencia="20181207">
        <p class="centro_redonda">FELIPE VI</p>
        <p class="centro_redonda">REY DE ESPANA</p>
        <p class="parrafo">Sabed: Que las Cortes Generales han aprobado...</p>
      </version>
    </bloque>

    <bloque id="ti" tipo="encabezado" titulo="TITULO I">
      <version id_norma="BOE-A-2018-16673" fecha_publicacion="20181206" fecha_vigencia="20181207">
        <p class="titulo_num">TITULO I</p>
        <p class="titulo_tit">Disposiciones generales</p>
      </version>
    </bloque>

    <bloque id="a1" tipo="precepto" titulo="Articulo 1">
      <version ...>
        <p class="articulo">Articulo 1. Objeto de la ley.</p>
        <p class="parrafo">La presente ley organica tiene por objeto:</p>
        <p class="parrafo_2">a) Adaptar el ordenamiento juridico espanol...</p>
      </version>
    </bloque>
  </texto>
</data>
```

### El elemento `<bloque>`

| Atributo | Descripcion | Ejemplos |
|---|---|---|
| `id` | Identificador unico dentro de la ley | `pr`, `ti`, `ci`, `a1`, `a2`, `da1`, `dt1`, `df1` |
| `tipo` | Tipo de bloque | `preambulo`, `encabezado`, `precepto`, `firma`, `parte_dispositiva` |
| `titulo` | Titulo legible | `[preambulo]`, `TITULO I`, `CAPITULO I`, `Articulo 1` |
| `fecha_caducidad` | (opcional) Fecha de derogacion | `20210603` |

**Tipos de bloque y mapeo a AKN**:
- `preambulo` -> AKN `<preamble>`
- `encabezado` con titulo_num TITULO -> AKN `<title>`
- `encabezado` con capitulo_num CAPITULO -> AKN `<chapter>`
- `precepto` -> AKN `<article>`
- `firma` -> AKN `<conclusions>`

**IMPORTANTE**: Los ids NO son consistentes entre leyes. Puede ser `a1`, `art1`, `art_1`. Hay que parsear el `titulo` o el primer `<p class="articulo">`.

### El elemento `<version>`

Cada `<bloque>` contiene una o mas `<version>` ordenadas cronologicamente:

| Atributo | Descripcion | Formato |
|---|---|---|
| `id_norma` | BOE ID de la ley que introdujo esta version | `BOE-A-YYYY-NNNNN` |
| `fecha_publicacion` | Fecha de publicacion en el BOE | `YYYYMMDD` |
| `fecha_vigencia` | Fecha de entrada en vigor | `YYYYMMDD` |

- La **primera** `<version>` es siempre el texto original
- Las siguientes son modificaciones, cada una identificada por la ley modificadora
- La **ultima** es el texto vigente actualmente

### Ejemplo real: Articulo con 2 versiones

Articulo 2 de la Ley Organica 3/2018 (Proteccion de Datos):

```xml
<bloque id="a2" tipo="precepto" titulo="Articulo 2">

  <!-- VERSION 1: Original (2018) — 4 apartados -->
  <version id_norma="BOE-A-2018-16673" fecha_publicacion="20181206" fecha_vigencia="20181207">
    <p class="articulo">Articulo 2. Ambito de aplicacion...</p>
    <p class="parrafo">1. Lo dispuesto en los Titulos I a IX...</p>
    <p class="parrafo">2. Esta ley organica no sera de aplicacion:</p>
    <p class="parrafo_2">a) A los tratamientos excluidos...</p>
    <p class="parrafo">b) A los tratamientos de datos de personas fallecidas...</p>
    <p class="parrafo">c) A los tratamientos sometidos...</p>
    <p class="parrafo_2">3. Los tratamientos a los que no sea directamente aplicable...</p>
    <p class="parrafo">4. El tratamiento de datos por los organos judiciales...</p>
  </version>

  <!-- VERSION 2: Modificada por Ley Organica 7/2021 — se anade apartado 5 -->
  <version id_norma="BOE-A-2021-8806" fecha_publicacion="20210527" fecha_vigencia="20210616">
    <p class="articulo">Articulo 2. Ambito de aplicacion...</p>
    <p class="parrafo">1. Lo dispuesto en los Titulos I a IX...</p>
    <p class="parrafo">2. Esta ley organica no sera de aplicacion:</p>
    <p class="parrafo_2">a) A los tratamientos excluidos...</p>
    <p class="parrafo">b) A los tratamientos de datos de personas fallecidas...</p>
    <p class="parrafo">c) A los tratamientos sometidos...</p>
    <p class="parrafo_2">3. Los tratamientos a los que no sea directamente aplicable...</p>
    <p class="parrafo">4. El tratamiento de datos por los organos judiciales...</p>
    <p class="parrafo">5. El tratamiento de datos por el Ministerio Fiscal...</p>
    <blockquote>
      <p class="nota_pie">Se anade el apartado 5 por la disposicion final 4.1
         de la Ley Organica 7/2021, de 26 de mayo.
         <a class="refPost">Ref. BOE-A-2021-8806#df-4</a></p>
    </blockquote>
  </version>

</bloque>
```

### Clases CSS de `<p>` y mapeo a AKN

| Clase | Significado | AKN equivalente |
|---|---|---|
| `articulo` | Encabezado del articulo | `<num>` + `<heading>` |
| `parrafo` | Parrafo normal | `<content><p>` |
| `parrafo_2` | Parrafo con indentacion (inicio de lista) | `<intro><p>` o `<content><p>` |
| `titulo_num` | Numero de titulo ("TITULO I") | `<num>` en `<title>` |
| `titulo_tit` | Texto de titulo ("Disposiciones generales") | `<heading>` en `<title>` |
| `capitulo_num` | Numero de capitulo | `<num>` en `<chapter>` |
| `capitulo_tit` | Texto de capitulo | `<heading>` en `<chapter>` |
| `centro_redonda` | Texto centrado (preambulos) | `<p>` |
| `firma_rey` | Firma del monarca | `<signature>` |
| `firma_ministro` | Firma del ministro | `<signature>` |
| `nota_pie` | Nota editorial sobre modificaciones | `<authorialNote>` |

### Elementos inline dentro de `<p>`

- `<em>` -> italica
- `<strong>` -> negrita (tambien marca texto inconstitucional)
- `<a class="refPost">Ref. BOE-A-XXXX-XXXXX</a>` -> referencia cruzada a ley modificadora

### Articulos derogados

```xml
<bloque id="art316" tipo="precepto" fecha_caducidad="20210603">
  <version ...>
    <p class="parrafo"><strong>(Derogado)</strong></p>
    <blockquote>
      <p class="nota_pie">Se deroga por la disposicion derogatoria unica.2
         de la Ley 15/2015. Ref. BOE-A-2015-7391</p>
    </blockquote>
  </version>
</bloque>
```

### Notas especiales en `<blockquote>`

| Atributo/Clase | Significado |
|---|---|
| (sin atributos) | Nota editorial normal sobre modificacion |
| `caduca="YYYYMMDD"` | Nota con vigencia temporal (ej: provision transitoria) |
| `class="soloTexto"` | Solo informativa, no es footnote |
| `class="noDesde99999999"` | Declaracion de inconstitucionalidad |

---

## Conversion mecanica BOE XML -> AKN

### Por que funciona sin IA

| Paso | Chile (lo que hace hoy) | EU (lo que hace hoy) | Espana (lo que haria) |
|---|---|---|---|
| Identificar articulos | Regex sobre texto plano | XML traversal: `<ARTICLE>` | XML parser: `<bloque tipo="precepto">` |
| Extraer texto | Slice entre posiciones de regex | Recursion sobre nodos Formex | Leer `<p>` children de `<version>` |
| Detectar versiones | Comparar dos PDFs completos | Comparar bill XML vs final XML | Ya vienen como `<version>` siblings |
| Saber que ley modifico | No lo tiene (deduccion) | No lo tiene directamente | `id_norma` + `<blockquote>` con nota |
| Computar changeset | `normalizeText(old) !== normalizeText(new)` | Igual | Igual, pero old/new ya separados |
| Fragilidad | Alta (PDF mal extraido = falla) | Media (XML malformado = falla) | Muy baja (XML estructurado, siempre igual) |

### Algoritmo de conversion

```
1. Parsear response XML del BOE
2. Para cada <bloque tipo="precepto">:
   a. Extraer id del titulo o <p class="articulo">
   b. Mapear a eId AKN (art_1, art_2, etc.)
   c. Para cada <version>:
      - Extraer texto de <p> children (ignorar <blockquote>)
      - Registrar fecha y ley modificadora
3. Para cada <bloque tipo="encabezado">:
   a. Detectar si es titulo, capitulo o seccion por clase CSS
   b. Reconstruir jerarquia (flat -> nested)
4. Para pares de versiones consecutivas:
   a. Si texto normalizado difiere -> articleChange type="substitute"
   b. Si version N tiene articulo que N-1 no -> type="insert"
   c. Si <strong>(Derogado)</strong> -> type="repeal"
5. Generar AKN XMLs con changeSet + metadata
```

### Output esperado

```
pipeline/data/es/{ley-slug}/
  sources/
    boe-{id}-metadata.xml       # Metadatos del BOE
    boe-{id}-texto.xml          # Texto completo con versiones
    congreso-votaciones-*.json  # Votos del Congreso (si disponible)
    senado-enmiendas-*.xml      # Enmiendas del Senado (si disponible)
  akn/
    00-metadata.json            # Metadata para el viewer
    01-act-original.xml         # Version original de la ley
    02-amendment-1.xml          # Primera modificacion con changeSet
    02-amendment-2.xml          # Segunda modificacion con changeSet
    ...
    0N-act-final.xml            # Version consolidada vigente
  discovered-config.json        # Config del discovery
  pipeline-report.txt           # Reporte de ejecucion
```

---

## Arquitectura del pipeline

```
pipeline/es/
├── process.ts                  # Entry point CLI
├── types.ts                    # Tipos TypeScript compartidos
├── lib/
│   ├── boe-api.ts              # Cliente REST del BOE
│   ├── boe-to-akn.ts           # Converter <bloque> -> AKN XML
│   ├── congreso-api.ts         # Votaciones e iniciativas del Congreso
│   ├── senado-api.ts           # Enmiendas y vetos del Senado
│   ├── xml-builder.ts          # Builder de XML AKN (reutilizar de EU)
│   └── helpers.ts              # Utilidades (parseo de ids, slugify, etc.)
└── phases/
    ├── 1-discover.ts           # Buscar ley en BOE por ELI/ID
    ├── 2-configure.ts          # Configurar versiones a procesar
    ├── 3-download.ts           # Descargar XMLs del BOE + votos
    ├── 4-convert.ts            # BOE XML -> AKN
    ├── 5-generate.ts           # Generar viewer XMLs con changeSet
    └── 6-enrich.ts             # Votos del Congreso + metadata
```

### Uso esperado

```bash
cd pipeline/es

# Por BOE ID
node --experimental-strip-types process.ts "BOE-A-2018-16673"

# Por ELI URI
node --experimental-strip-types process.ts "es/lo/2018/12/05/3"

# Desde fase especifica
node --experimental-strip-types process.ts "BOE-A-2018-16673" --phase=4
```

### Fases

| Fase | Nombre | Que hace | Artefacto |
|---|---|---|---|
| 1 | Discover | BOE API metadata + analisis -> config | `discovered-config.json` |
| 2 | Configure | Generar config + crear directorios | `viewer-config.json` |
| 3 | Download | Descargar texto completo + votos + enmiendas | `sources/*.xml` |
| 4 | Convert | BOE XML -> AKN XML | `sources/*-akn.xml` |
| 5 | Generate | Producir viewer XMLs con changeSets | `akn/01-*.xml`, `akn/02-*.xml` |
| 6 | Enrich | Votos del Congreso, enmiendas Senado | `sources/es-*.xml` |

---

## Proceso legislativo espanol (para modelar timeline)

### Flujo bicameral

```
Gobierno/Grupos Parlamentarios
  -> Proyecto/Proposicion de Ley
    -> Congreso:
      -> Mesa del Congreso (admision)
      -> Comision (Ponencia -> Informe)
      -> Pleno Congreso (debate + votacion)
    -> Senado (2 meses / 20 dias urgente):
      -> Comision Senado
      -> Pleno Senado (aprobar / enmendar / vetar)
    -> Si enmiendas Senado:
      -> Congreso resuelve (mayoria simple acepta/rechaza)
    -> Si veto Senado:
      -> Congreso puede levantar veto (mayoria absoluta)
    -> Sancion Real (Rey)
    -> Publicacion en BOE
```

### Documentos clave para el timeline

| Etapa | Documento | Fuente | Formato |
|---|---|---|---|
| Texto original | Proyecto/Proposicion de Ley | BOCG | PDF |
| Enmiendas | Enmiendas al articulado | BOCG (Congreso) / XML (Senado) | PDF / XML |
| Comision | Informe de Ponencia | BOCG | PDF |
| Comision | Dictamen de Comision | BOCG | PDF |
| Congreso Pleno | Texto aprobado + votacion | Congreso OpenData | XML/JSON |
| Senado | Mensaje motivado (dos columnas) | BOCG | PDF |
| Ley final | Texto publicado | BOE API | XML |
| Consolidada | Todas las versiones | BOE API | XML |

### URLs predecibles del BOCG

```
https://www.congreso.es/public_oficiales/L{LEGISLATURA}/CONG/BOCG/{SERIE}/BOCG-{LEG}-{SERIE}-{NUM}-{FASE}.PDF
```

Series: A (proyectos), B (proposiciones), C (tratados), D (general)

Sufijos de fase: -1 (texto inicial), -2 a -n (enmiendas), -4 (informe ponencia), -5 (dictamen comision), -8 (enmiendas senado)

---

## Dos tracks de implementacion

### Track A: Diffs de versiones consolidadas (ALTA viabilidad)

Usar solo la API del BOE para mostrar como una ley cambio a lo largo del tiempo.

**Input**: BOE ID (ej: `BOE-A-2018-16673`)
**Output**: AKN XMLs con changeSet por cada modificacion

**Ventajas**:
- Solo necesita la API del BOE (una sola fuente)
- El versionado viene nativo (old/new ya separados)
- Metadata de ley modificadora incluida
- No requiere PDF parsing
- Implementacion rapida

**Ejemplo de output AKN**:
```xml
<akndiff:changeSet
  base="/es/lo/2018/3/art_2@2018-12-07"
  result="/es/lo/2018/3/art_2@2021-06-16">
  <akndiff:articleChange article="art_2" type="substitute">
    <akndiff:old><!-- apartados 1-4 --></akndiff:old>
    <akndiff:new><!-- apartados 1-5 (se anade apartado 5) --></akndiff:new>
  </akndiff:articleChange>
</akndiff:changeSet>
```

### Track B: Journey parlamentario (MEDIA viabilidad)

Seguir el texto desde proyecto de ley hasta ley publicada.

**Input**: Numero de expediente del Congreso
**Output**: Timeline completa con enmiendas y votaciones

**Requiere**:
- BOE API (texto final)
- Congreso OpenData (metadatos + votos)
- Senado OpenData (enmiendas XML)
- BOCG scraping (textos intermedios en PDF)
- PDF parsing (como Chile)

**Desafios**: PDFs del BOCG, bicameralismo, no hay API unica

---

## Integracion con el viewer

Agregar a `src/lib/server/boletin-loader.ts`:

1. Constante de directorio + entrada en `BOLETIN_DIRS`
2. Labels en `slugToLabel()` (Version Original, Modificacion 1, etc.)
3. URLs fuente en `slugToSource()` (links al BOE)
4. Documentos fuente en `getSourceDocuments()`
5. Slug + bandera en `src/routes/pro/+page.server.ts` y `+page.svelte`

---

## Leyes candidatas para primera prueba

### Track A (consolidadas con multiples versiones)

| Ley | BOE ID | Versiones | Interes |
|---|---|---|---|
| Codigo Civil (1889) | BOE-A-1889-4763 | Muchas (art 92 tiene 7) | Historico, muchas reformas |
| LO 3/2018 Proteccion de Datos | BOE-A-2018-16673 | Varias | Ya probado, API funciona |
| Ley 28/2022 Startups | BOE-A-2022-21739 | Pocas | Reciente, buena para test |
| LO 10/1995 Codigo Penal | BOE-A-1995-25444 | Muchas | Alto interes publico |
| Ley 39/2015 Proc. Administrativo | BOE-A-2015-10565 | Varias | Referencia administrativa |

### Track B (journey parlamentario completo)

| Ley | Legislatura | Interes |
|---|---|---|
| Ley de Vivienda (2023) | XV | Muy debatida, muchas enmiendas |
| Ley de Startups (2022) | XIV | Tech, relevante |
| Ley Trans (2023) | XV | Alta cobertura mediatica |

---

## Notas tecnicas

### Diferencias con EU pipeline

1. **No hay SPARQL**: El BOE es REST puro, no linked data
2. **No hay Formex**: El XML del BOE es mas simple que Formex
3. **Estructura plana**: Los `<bloque>` son siblings, hay que reconstruir jerarquia (titulo > capitulo > articulo)
4. **IDs inconsistentes**: `a1` vs `art1` vs `art_1` segun la ley. Parsear desde `titulo` o `<p class="articulo">`
5. **HTML dentro de XML**: Contenido usa `<p>` con clases CSS, `<em>`, `<strong>`, `<a>`
6. **Notas editoriales**: `<blockquote>` con `nota_pie` explica cada modificacion

### Diferencias con Chile pipeline

1. **No hay PDF parsing**: El BOE da XML directo
2. **No hay regex para articulos**: Los articulos son `<bloque tipo="precepto">`
3. **Versionado nativo**: No hay que comparar dos documentos, las versiones vienen en el mismo bloque
4. **Referencia cruzada**: `id_norma` en `<version>` te dice que ley hizo el cambio

### Reutilizable de los pipelines existentes

- `src/lib/types.ts` — AknDocument, ChangeSet, ArticleChange, Vote, Boletin, TimelineEntry
- `src/lib/server/state-reconstructor.ts` — Replay de changesets
- `src/lib/server/akn-diff-computer.ts` — Computar word diffs
- `src/lib/server/xml-parser.ts` — Parser AKN con fast-xml-parser
- Patron de 6 fases con --phase=N restart
- Formato de changeSet y vote en AKN Diff namespace

### Estandares

- **AKN**: Akoma Ntoso 3.0 (OASIS) — no adoptado por Espana, nosotros lo generamos
- **ELI**: European Legislation Identifier — adoptado por Espana desde 2018, 90,000+ leyes
- **AKN Diff**: `http://parlamento.ai/ns/akndiff/1.0` — nuestra extension
