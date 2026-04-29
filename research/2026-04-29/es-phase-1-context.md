# Phase 1 España — Memoria detallada del experimento

> Fecha del trabajo: 2026-04-29.
> Caso modelado: Ley 1/2026 de Economía Social (España).
> Schema validado: v3 (`research/schema/v3-schema.ts`).

---

## ÍNDICE

1. Contexto y objetivo del experimento
2. Por qué España y por qué este caso
3. Por qué a mano y no con el pipeline
4. Estructura de archivos creada
5. Metodología paso a paso
6. URLs y comandos exactos usados
7. Cada documento modelado en detalle
8. El grafo de cross-references entre los 7 docs
9. Las 5 fricciones grandes — análisis completo
10. Las fricciones menores anotadas
11. Build process y gotchas
12. Demo del resultado
13. Errores cometidos durante el modelado y cómo se arreglaron
14. Lecciones aprendidas / reglas para los próximos países
15. Checklist replicable para EU y US
16. Estado actual y archivos generados
17. Bitácora — dónde subir cada cosa

---

## 1. Contexto y objetivo del experimento

El proyecto **Diff by Parlamento.ai** entró en Abril 2026 a una fase nueva del research: validar si el schema v3 (recién diseñado por Antoine, basado en Akoma Ntoso, vive en `research/schema/v3-schema.ts`) es capaz de representar el rito legislativo de cualquier país sin perder información significativa. El plan completo está en `research/schema/schema-research-plan.md`.

El plan define **3 phases**:

- **Phase 1 — Horizontal**: modelar el ciclo legislativo completo de UN bill por país (5 países objetivo: CL, ES, EU, US, PE), con ~7 documentos por país cubriendo todos los tipos del rito (bill, act, amendment, journal, debate, citation, plus las relaciones entre ellos). Phase 1 termina cuando los 5 países cargan limpios y tenemos lista de fricciones por país.
- **Phase 2 — Vertical**: profundizar dentro de cada país agregando 10-20 docs adicionales para cubrir edge cases.
- **Phase 3 — Síntesis**: producir reportes de Cobertura y Completitud por país, identificar fricciones cross-país, decidir cambios al schema (v4).

Antes del trabajo de hoy, **Phase 1 estaba al 1/5**: solo CL tenía datos en `data/cl/` y eran ejemplos ficticios (la "receta de azúcar" del POC original de enero 2026, no leyes reales chilenas). Hoy se agregó España con datos reales.

**La métrica del experimento NO es "cuántos docs cargué"** sino "cuántas fricciones reales encontré entre el schema y la realidad documentadas en `<akndiff:researchNotes>`". Es un experimento científico: el éxito es generar evidencia, no producir software.

---

## 2. Por qué España y por qué este caso

### Por qué España como segundo país

España fue elegida por accesibilidad y diferencia con CL:

- **Datos públicos accesibles**: BOE tiene API XML estructurada (`https://www.boe.es/diario_boe/xml.php?id=...`), Congreso publica fichas HTML estructuradas y Diario de Sesiones. Todo público y verificable.
- **Sistema bicameral con trámite formal**: distinto de CL que también lo tiene pero más simple. Permite estresar el modelo de bicameralismo del schema.
- **Producción legislativa abundante de leyes modificadoras**: la mayoría de las leyes españolas modifican otras leyes ("ley de medidas X que modifica las leyes Y, Z, W"). Permite validar el patrón "modifying law" del schema.
- **Distinción legal Ley vs Ley Orgánica vs Real Decreto-ley**: España distingue legalmente tres tipos de "act" con procedimientos distintos. Permite evaluar si el schema captura esta distinción.
- **Idiomas regionales co-oficiales**: BOE publica versiones consolidadas en catalán, gallego. Permite probar multilingüismo.

### Por qué este caso específico

**Ley 1/2026, de 8 de abril, integral de impulso de la economía social** (BOE-A-2026-7967):

- **Recién promulgada**: 8 de abril de 2026, ciclo legislativo completo cerrado este mes
- **Trámite largo y rico**: presentada como Proyecto de Ley el 11-oct-2024 por el Gobierno, tramitada en Congreso y Senado, con vuelta del Senado y voto bloque-por-bloque en el Pleno (343 vs 0 vs 0 en algunos bloques, mucho más reñido en otros)
- **Modifica 8 leyes anteriores** (4 en cuerpo principal + 4 en disposiciones finales), de las cuales modelamos UNA en detalle (Ley 27/1999 de Cooperativas, la principal). Las otras 7 quedan referenciadas con URLs externos pero no modeladas.
- **Tiene los 7 estadios legislativos** que pide Phase 1: bill, act-it-amends, events, amendment (Informe Ponencia), journal (BOE), debate (Pleno), citation (Comisión).

El expediente parlamentario es **121/000036 (XV Legislatura)** — un Proyecto de Ley del Gobierno, no una Proposición de Ley de un Grupo. Esa distinción genera fricciones reales que no aparecerían modelando una Proposición.

---

## 3. Por qué a mano y no con el pipeline

El proyecto ya tiene un pipeline ES (`pipeline/es/`) que scrapea automáticamente bills y leyes del BOE/BOCG y los convierte a AKN. Tu instinto natural sería usarlo.

**Razón para NO usarlo en este experimento:**

Si automatizaba con el pipeline, las fricciones que iban a aparecer eran entre dos sistemas internos nuestros (output del pipeline vs schema v3), no entre el schema y los datos reales del BOE/Congreso. El experimento perdía sentido porque:

1. El pipeline tiene sus propios bugs e interpretaciones, que confunden la señal del experimento
2. El pipeline emite AKN con un namespace viejo (`http://parlamento.ai/ns/akndiff/1.0`), no el del schema v3 (`https://akndiff.io/ns/akndiff`)
3. El pipeline no emite los campos `<akndiff:nativeId>`, `<akndiff:sourceUrl>`, `<akndiff:billStatus>`, `<akndiff:sponsor>`, `<akndiff:priorVersion>` que el loader v3 requiere
4. El pipeline modela solo bill + amendment + act-final (3 docs por bill), no el grafo completo de 7 que pide Phase 1
5. El pipeline no tiene `<lifecycle>` con los 19 events del trámite
6. El pipeline no anota fricciones (eso es trabajo humano)

Modelando consciente, las fricciones que aparecen son las del schema vs realidad, que es lo que el experimento busca documentar.

**El pipeline es útil más adelante**: cuando se valide el schema (v4 o no) se puede actualizar el pipeline para que emita el nuevo formato. Pero eso es un proyecto distinto al de Phase 1.

---

## 4. Estructura de archivos creada

```
research/schema/
│
├── data/es/                            ← CORPUS, tracked en git, lo que el loader procesa
│   ├── acts/
│   │   ├── ley-27-1999.xml             (~330 líneas, BOE-A-1999-15681, Cooperativas)
│   │   └── ley-1-2026.xml              (~290 líneas, BOE-A-2026-7967, Economía Social)
│   ├── bills/
│   │   └── 121-000036.xml              (~210 líneas, 19 events del trámite)
│   ├── amendments/
│   │   └── 121-000036-am-ponencia.xml  (~130 líneas, Informe Ponencia BOCG-15-A-36-4)
│   ├── journals/
│   │   └── BOE-2026-087.xml            (~115 líneas, BOE núm. 87 9-abr-2026)
│   ├── citations/
│   │   └── cit-com-trabajo-2025-12-09.xml  (~95 líneas, sesión Comisión)
│   └── debates/
│       └── dscd-15-pl-26-mar-2026.xml  (~210 líneas, Pleno con 9 vote tallies)
│
└── _sources/es/                        ← FUENTES BAJADAS, gitignored, NO procesadas por loader
    ├── ley-27-1999-cooperativas.xml    (334 KB, XML BOE consolidado)
    ├── ley-1-2026-economia-social.xml  (223 KB, XML BOE)
    ├── correcion-errores-2026-7967.xml (15 KB, BOE-A-2026-8021 corrección de errores)
    ├── ficha-121-000036.html           (128 KB, ficha del expediente Congreso)
    ├── ficha-121-000036.txt            (texto plano sed-stripped)
    ├── DSCD-15-PL-175.html             (449 KB, Diario de Sesiones del Pleno)
    └── DSCD-15-PL-175.txt              (8141 líneas texto plano sed-stripped)
```

### Por qué `_sources/` vive FUERA de `data/`

El walker del build (en `research/schema/build.ts` función `walkCorpus()`) recorre `data/<country>/<type>/*.xml` y procesa CADA archivo `.xml` que encuentra. Si pones los XMLs originales del BOE dentro de `data/es/_sources/` el walker los toma como docs a cargar y revienta porque su root es `<documento>` (formato BOE), no `<akomaNtoso>` (formato AKN que el loader espera).

**Aprendizaje del experimento**: por eso `_sources/` se mueve a `research/schema/_sources/` (mismo nivel que `data/`, no dentro). El `.gitignore` está actualizado con `research/schema/_sources/` para que no se suban al repo.

Esto fue una **fricción detectada del build** que vale la pena llevar a Antoine: el walker debería saltar subdirectorios que empiezan con `_` por convención (es estándar en muchos sistemas), o el plan debería documentar esto explícitamente.

---

## 5. Metodología paso a paso

### 5.1. Workflow general

```
1. Leer plan del research (research/schema/schema-research-plan.md)
2. Leer schema v3 actual (research/schema/v3-schema.ts) para entender qué fields espera cada type
3. Leer los CL examples como template (data/cl/acts/ley-21000.xml, bills/15234-11.xml, etc.)
4. Elegir caso real con trámite cerrado y data accesible
5. Por cada doc del ciclo:
   a. Identificar fuente primaria (URL del BOE, Congreso, etc.)
   b. Bajar con curl la fuente completa a research/schema/_sources/<país>/
   c. Leer la fuente localmente (no truncamiento)
   d. Mapear los campos de la fuente a campos AKN/v3
   e. Escribir el XML en research/schema/data/<país>/<type>/
   f. Anotar fricciones encontradas en <akndiff:researchNotes>
6. Correr npm run research:build, ver errores, iterar
7. Entrar al demo y ver el grafo formado
8. Hacer pasada de limpieza de researchNotes (sacar las que no son fricciones reales)
9. Escribir bitácora corta (research/<fecha>/<país>-phase-1.md)
10. Escribir memoria detallada (research/<fecha>/<país>-phase-1-context.md)
```

### 5.2. Reglas de oro descubiertas

1. **Siempre curl + lectura local del archivo completo.** Nunca confiar en WebFetch para datos críticos (votos, fechas exactas, IDs) porque WebFetch devuelve resúmenes generados por IA que pueden conflar campos o equivocarse.
2. **Toda fricción detectada se anota en el doc donde apareció.** No se acumula en un archivo aparte. Para que en Phase 3 se puedan greppear cross-corpus.
3. **Fechas de publicación BOCG/BOE != fechas de sesión real.** El BOCG publica resultados días después de la sesión. La fecha que va en eventRef es la de la sesión, no la del BOCG.
4. **Los hrefs internos al corpus se forman con `/akn/<país>/<type>/<fecha>/<nativeId>`.** Si dos docs se referencian con esa estructura el grafo se conecta automáticamente al ingest.
5. **Los hrefs externos van como URLs `https://...` completas.** El loader los marca como "external/skipped" y no rompe el build.

### 5.3. Conversión de fuentes a XML AKN/v3 — patrón general

Cada doc se construye con esta plantilla:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!--
  Comentario explicando qué es este doc, de dónde viene, etc.
-->
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="https://akndiff.io/ns/akndiff">
  <{type} name="{type}">      <!-- type: bill, act, amendment, journal, debate, citation, etc -->
    <meta>
      <identification source="#...">
        <FRBRWork>
          <FRBRthis value="/akn/es/{type}/{fecha}/{nativeId}/!main"/>
          <FRBRuri value="/akn/es/{type}/{fecha}/{nativeId}"/>
          <FRBRdate date="{fecha}" name="generation|promulgation"/>
          <FRBRauthor href="#..."/>
          <FRBRcountry value="es"/>
          <FRBRsubtype value="..."/>      <!-- opcional, si aplica -->
        </FRBRWork>
        <FRBRExpression>...</FRBRExpression>
        <FRBRManifestation>...</FRBRManifestation>
      </identification>
      <publication date="..." showAs="..." href="/akn/es/officialGazette/..."/>
      <classification source="#boe|#congreso">
        <keyword value="..." showAs="..." dictionary="#..."/>
      </classification>
      <lifecycle source="#...">
        <eventRef date="..." refersTo="#submitted|#admitted|#published|..."
                  source="#evt-N"
                  showAs="..."
                  chamber="congreso|senado|ambos|ejecutivo"/>
      </lifecycle>
      <references source="#...">
        <TLCOrganization eId="..." href="..." showAs="..."/>
        <TLCPerson eId="..." href="..." showAs="..."/>
        <TLCRole eId="..." href="..." showAs="..."/>
      </references>
      <proprietary source="#...">
        <akndiff:nativeId>{nativeId}</akndiff:nativeId>     <!-- REQUERIDO -->
        <akndiff:sourceUrl>{url}</akndiff:sourceUrl>         <!-- REQUERIDO -->
        <akndiff:{type}Status normalized="...">{texto local}</akndiff:{type}Status>
        <akndiff:issuingBody>...</akndiff:issuingBody>      <!-- act -->
        <akndiff:billStatus normalized="enacted">...</akndiff:billStatus>  <!-- bill -->
        <akndiff:sponsor refersTo="#..." role="#..."/>       <!-- bill -->
        <akndiff:priorVersion href="..." version="..." date="..."/>  <!-- act -->
        <akndiff:researchNotes>
          1. ...
          2. ...
        </akndiff:researchNotes>
      </proprietary>
    </meta>
    <preface>
      <longTitle>
        <p>...</p>
      </longTitle>
    </preface>
    <preamble>
      <p>... ej. Exposición de Motivos para acts ...</p>
    </preamble>
    <body>
      <!-- Contenido específico del type -->
      <article eId="art_1">
        <num>...</num>
        <heading>...</heading>
        <content>
          <p>... <ref href="/akn/es/act/.../...">...</ref> ...</p>
        </content>
      </article>
    </body>
    <conclusions>
      <signature>
        <person refersTo="#...">...</person>
      </signature>
    </conclusions>
  </{type}>
</akomaNtoso>
```

---

## 6. URLs y comandos exactos usados

### 6.1. Acts (XMLs estructurados del BOE)

```bash
mkdir -p research/schema/_sources/es

# Ley 27/1999 de Cooperativas (act base modificada)
curl -s -o research/schema/_sources/es/ley-27-1999-cooperativas.xml \
  "https://www.boe.es/diario_boe/xml.php?id=BOE-A-1999-15681"

# Ley 1/2026 Integral de Impulso de la Economía Social (act nueva)
curl -s -o research/schema/_sources/es/ley-1-2026-economia-social.xml \
  "https://www.boe.es/diario_boe/xml.php?id=BOE-A-2026-7967"

# Corrección de errores de Ley 1/2026 (publicada 1 día después)
curl -s -o research/schema/_sources/es/correcion-errores-2026-7967.xml \
  "https://www.boe.es/diario_boe/xml.php?id=BOE-A-2026-8021"
```

El XML que devuelve el BOE tiene esta estructura:

```xml
<documento fecha_actualizacion="...">
  <metadatos>
    <identificador>BOE-A-...</identificador>
    <titulo>...</titulo>
    <fecha_disposicion>...</fecha_disposicion>     <!-- promulgación -->
    <fecha_publicacion>...</fecha_publicacion>     <!-- en BOE -->
    <fecha_vigencia>...</fecha_vigencia>           <!-- entrada en vigor -->
    <rango>Ley | Ley Orgánica | Real Decreto-ley | ...</rango>
    <departamento>...</departamento>
    <numero_oficial>X/YYYY</numero_oficial>
    <url_eli>https://www.boe.es/eli/es/l/YYYY/MM/DD/N</url_eli>
    ...
  </metadatos>
  <metadata-eli>
    <!-- ELI URI estándar europea + lista de versiones consolidadas -->
  </metadata-eli>
  <analisis>
    <!-- Cross-references estructurados con verbo MODIFICA/DEROGA/AÑADE/SUPRIME -->
    <referencias>
      <anteriores>
        <anterior referencia="BOE-A-...">
          <palabra codigo="270">MODIFICA</palabra>
          <texto>los arts. X, Y, Z de la Ley ...</texto>
        </anterior>
      </anteriores>
      <posteriores>
        <posterior referencia="BOE-A-...">
          <palabra>CORRECCIÓN de errores</palabra>
          <texto>...</texto>
        </posterior>
      </posteriores>
    </referencias>
  </analisis>
  <texto>
    <p class="centro_redonda">FELIPE VI</p>
    <p class="centro_redonda">REY DE ESPAÑA</p>
    <p class="parrafo">A todos los que la presente vieren ...</p>
    <p class="centro_redonda">PREÁMBULO</p>
    <p class="parrafo">...</p>
    <p class="titulo_num">TÍTULO I</p>
    <p class="titulo_tit">De ...</p>
    <p class="capitulo_num">CAPÍTULO I</p>
    <p class="capitulo_tit">...</p>
    <p class="articulo">Artículo 1. ...</p>
    <p class="parrafo">1. ...</p>
    <p class="parrafo">2. ...</p>
    <p class="articulo">Disposición adicional primera. ...</p>
    <p class="parrafo">...</p>
    <p class="firma_rey">FELIPE R.</p>
    <p class="firma_ministro">El Presidente del Gobierno,</p>
    <p class="firma_ministro">PEDRO SÁNCHEZ PÉREZ-CASTEJÓN</p>
  </texto>
</documento>
```

### 6.2. Bill (HTML de la ficha del expediente Congreso)

```bash
curl -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
  -o research/schema/_sources/es/ficha-121-000036.html \
  "https://www.congreso.es/es/iniciativas-organo?p_p_id=iniciativas&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view&_iniciativas_mode=mostrarDetalle&_iniciativas_legislatura=XV&_iniciativas_id=121/000036"
```

**El User-Agent es obligatorio** porque el sitio del Congreso está detrás de un CDN (Akamai) que bloquea curl plano con "Access Denied".

Convertir a texto plano para grep:

```bash
sed 's/<br\/>/\n/g; s/<br>/\n/g; s/<[^>]*>/ /g; s/&nbsp;/ /g; s/&aacute;/á/g; s/&eacute;/é/g; s/&iacute;/í/g; s/&oacute;/ó/g; s/&uacute;/ú/g; s/&ntilde;/ñ/g; s/  */ /g' \
  research/schema/_sources/es/ficha-121-000036.html > research/schema/_sources/es/ficha-121-000036.txt
```

La ficha incluye:
- Tipo de tramitación
- Comisión competente
- Lista de plazos de enmiendas con todas las ampliaciones
- Lista de fases del trámite con sus fechas
- Lista de TODOS los BOCGs publicados (Congreso + Senado) con URLs y fechas
- Vote tallies inline para algunas votaciones (ej: 33/175/137 totalidad)

### 6.3. Debate (HTML del Diario de Sesiones del Pleno)

```bash
curl -s -A "Mozilla/5.0 ..." \
  -o research/schema/_sources/es/DSCD-15-PL-175.html \
  "https://www.congreso.es/es/busqueda-de-publicaciones?p_p_id=publicaciones&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view&_publicaciones_mode=mostrarTextoIntegro&_publicaciones_legislatura=XV&_publicaciones_id_texto=(DSCD-15-PL-175.CODI.)"
```

**Importante**: el PDF del mismo Diario de Sesiones (`https://www.congreso.es/public_oficiales/L15/CONG/DS/PL/DSCD-15-PL-175.PDF`) está bloqueado por el CDN para curl. Devuelve un error HTML "Access Denied". La versión HTML del mismo contenido (URL `mostrarTextoIntegro`) está libre.

Stripping del HTML:

```bash
sed 's/<br\/>/\n/g; s/<br>/\n/g; s/<[^>]*>/ /g; s/&nbsp;/ /g; ...' \
  research/schema/_sources/es/DSCD-15-PL-175.html \
  > research/schema/_sources/es/DSCD-15-PL-175.txt
```

Resultado: 8141 líneas de texto plano. Grepeable para encontrar:
- Por número de expediente: `grep -n "121/000036"` → 3 ocurrencias (agenda, header de discusión, header de votaciones)
- Vote tallies: `grep -o "Efectuada la votación[^<]*"` → ~50 votaciones (todas las del orden del día)
- Por bloque dentro de votaciones de UN bill: leer el texto entre la introducción del bill y el siguiente bill

### 6.4. Citación (verificación cruzada)

Para verificar la fecha exacta de la sesión que aprobó el dictamen (la citación), usé WebFetch contra `controlcongreso.com` (sitio civil de tracking parlamentario):

```
URL: https://controlcongreso.com/iniciativas/proyecto-ley-impulsar-economia-social-121000036/
Resultado: sesión 9-dic-2025, DSCD-15-CO-482, voto 19 sí / 18 no
```

El `cit-com-trabajo-2025-12-09.xml` lleva esta info verificada.

---

## 7. Cada documento modelado en detalle

### 7.1. `acts/ley-27-1999.xml` — Ley anterior modificada

- **nativeId**: `ley-27-1999`
- **Fuente**: `_sources/es/ley-27-1999-cooperativas.xml` (XML BOE consolidado, 334 KB)
- **Fechas**: promulgación 1999-07-16, publicación 1999-07-17 (BOE núm. 170), vigencia 1999-08-06
- **Autoridad**: Jefatura del Estado, firmada por JUAN CARLOS R. + JOSÉ MARÍA AZNAR LÓPEZ
- **ELI URI**: `https://www.boe.es/eli/es/l/1999/07/16/27`
- **Estado**: `in_force` (vigente, no derogada)
- **Status legal**: 14 versiones consolidadas históricas (modificaciones a lo largo de los años) — modelamos solo la última (post Ley 1/2026)
- **Cuerpo**: 3 títulos, 11 capítulos en Title I, 120 artículos catalogados, 13 disposiciones adicionales con texto íntegro, 4 transitorias, 3 derogatorias, 6 finales, firma
- **Decisión de modelado**: artículos 1-7 con texto íntegro de muestra, artículos 8-120 con `num` + `heading` + nota "estructura preservada, texto en BOE-A-1999-15681"

**ResearchNotes** (6 fricciones limpias):
1. BOE serializa flat con `<p class="X">`, AKN espera nested. Mapping reconstructivo, lossy si no se cuida.
2. ELI URI europea coexiste con AKN URI — dos identificadores paralelos para el mismo recurso.
3. Bloque `<analisis>` del BOE tiene grafo cross-ref estructurado que el loader ignora (solo extrae `<ref>` de body).
4. AKN `<preamble>` está pensado para preámbulos cortos; Spanish Exposición de Motivos tiene 38+ párrafos. Stretch.
5. Falta `rango` en ActTable (Ley vs Ley Orgánica vs Real Decreto-ley).
6. Multilingüe (BOE publica en catalán y gallego) → schema mono-language.

### 7.2. `acts/ley-1-2026.xml` — Ley nueva promulgada

- **nativeId**: `ley-1-2026`
- **Fuente**: `_sources/es/ley-1-2026-economia-social.xml` (XML BOE, 223 KB)
- **Fechas**: promulgación 2026-04-08, publicación 2026-04-09 (BOE núm. 87), vigencia 2026-04-10
- **Autoridad**: Jefatura del Estado, firmada por FELIPE R. + PEDRO SÁNCHEZ PÉREZ-CASTEJÓN
- **ELI URI**: `https://www.boe.es/eli/es/l/2026/04/08/1`
- **Estado**: `in_force`
- **Patrón especial**: ley modificadora, su cuerpo entero son cambios a otras 8 leyes
- **Modifica**: Ley 27/1999 (Cooperativas, modelada aparte), Ley 44/2007 (Empresas de Inserción), Ley 5/2011 (Economía Social), Ley 20/1990 (Régimen Fiscal Cooperativas), Ley 31/1995 (PRL), Ley 9/2017 (Contratos Sector Público), Ley 19/2021 (Ingreso Mínimo Vital), RDL 1/2023 (incentivos contratación)
- **Cuerpo**: 4 artículos primero/segundo/tercero/cuarto + 4 disposiciones transitorias + 1 derogatoria + 5 finales (la final 5 es entrada en vigor)
- **Corrección de errores**: BOE-A-2026-8021 publicada 1 día después (10-abr-2026), modelada como evento `#correction` en lifecycle pero no como priorVersion separada para esta iteración

**ResearchNotes** (5 fricciones limpias):
1. **Modifying-law subtype** — schema asume act con contenido propio.
2. BOE `<analisis>/<referencias>/<anteriores>` con grafo estructurado — ignorado por loader.
3. Falta `rango` (Ley vs Ley Orgánica).
4. Corrección de errores como otra versión publicada inmediatamente después.
5. **Entrada en vigor diferida por provisión** — final 5.2 difiere 1 año un artículo concreto, schema tiene timestamp único.

### 7.3. `bills/121-000036.xml` — Proyecto de Ley

- **nativeId**: `121-000036`
- **Subtype**: `proyecto-de-ley` (Government bill, no Proposición de Ley)
- **Fuente**: `_sources/es/ficha-121-000036.html` (128 KB)
- **Autor**: Gobierno de España (entidad, no persona)
- **Comisión competente**: Comisión de Trabajo, Economía Social, Inclusión, Seguridad Social y Migraciones
- **Tipo de tramitación**: Competencia legislativa plena de la Comisión
- **Estado**: `enacted` (Concluido — aprobado con modificaciones, convertido en Ley 1/2026)
- **Lifecycle: 19 events** (todos verificados):

| # | Fecha | refersTo | Descripción |
|---|---|---|---|
| 1 | 2024-10-11 | #submitted | Presentación por el Gobierno |
| 2 | 2024-10-18 | #published | BOCG-15-A-36-1 (Iniciativa) |
| 3 | 2024-10-18 | #amendments_period_opened | Apertura plazo enmiendas (cierre inicial 06/11/2024) |
| 4 | 2025-02-27 | #admitted | Calificación por la Mesa de la Comisión |
| 5 | 2025-03-06 | #totality_amendments_published | BOCG-15-A-36-2 (Enmiendas a la totalidad) |
| 6 | 2025-03-13 | #totality_debate | Debate de totalidad rechazado (33/175/137) |
| 7 | 2025-06-05 | #amendments_period_closed | Cierre plazo enmiendas tras 23 ampliaciones |
| 8 | 2025-06-16 | #article_amendments_published | BOCG-15-A-36-3 (Enmiendas e índice) |
| 9 | 2025-12-09 | #passed_chamber | Aprobación Comisión c.l.p. (DSCD-15-CO-482, 19/18) |
| 10 | 2025-12-15 | #committee_report_published | BOCG-15-A-36-4 (Informe Ponencia) |
| 11 | 2025-12-22 | #dictamen_published | BOCG-15-A-36-5 (Aprobación Comisión publicación) |
| 12 | 2025-12-23 | #sent_to_senate | BOCG Senado 357_3127 |
| 13 | 2026-02-16 | #senate_amendments_published | BOCG Senado 368_3180 |
| 14 | 2026-02-18 | #senate_amendments_index | BOCG Senado 369_3199 |
| 15 | 2026-03-09 | #senate_committee_report | BOCG Senado 380_3272/3277 |
| 16 | 2026-03-18 | #senate_pleno_vote | DS_P_15_118 (Pleno Senado) |
| 17 | 2026-03-26 | #passed_second_chamber | DSCD-15-PL-175 (9 bloques: 2 aprobados, 7 rechazados) |
| 18 | 2026-03-27 | #senate_amendments_back | BOCG-15-A-36-6 + BOCG Senado 391_3353 |
| 19 | 2026-04-08 | #enacted | BOCG-15-A-36-7 + Sanción real (Ley 1/2026) |

**ResearchNotes** (8 fricciones limpias, incluye la fricción cross-país de chamber):
1. Sponsor no es persona — Gobierno como organización.
2. Proyecto vs Proposición de Ley sin campo dedicado.
3. Loader dropea `chamber` de eventRef — fricción reproducida cross-país (también CL).
4. 9-block vote no representable en eventRef único.
5. Status normalization lossy — pierde "with modifications".
6. Urgencia no comparable cross-país (España: ordinaria/urgencia/lectura única vs CL: simple/suma urgencia/discusión inmediata).
7. No hay LinkRelation `enacted_as` para "bill became act".
8. 23 ampliaciones del plazo de enmiendas se pierden.

### 7.4. `amendments/121-000036-am-ponencia.xml` — Informe de Ponencia

- **nativeId**: `121-000036-am-ponencia`
- **Fuente**: BOCG-15-A-36-4 de 15-dic-2025
- **Autor**: Ponencia de la Comisión de Trabajo (sub-órgano)
- **Outcome**: `approved` (Informe aprobado y elevado a la Comisión)
- **TargetBill**: `/akn/es/bill/2024-10-11/121-000036`
- **Patrón especial**: este "amendment" en realidad es un INFORME que consolida la disposición de ~50 enmiendas individuales. Cada enmienda individual NO es modelada como AmendmentTable row separada.

**ResearchNotes** (3 fricciones limpias):
1. **Consolidated vs individual amendment** — schema asume one-amendment-one-doc, España consolida 50 en 1.
2. Submitter es Grupo Parlamentario, no persona individual.
3. `targetBillId` único pero las enmiendas evolucionan: algunas contra texto original, otras contra consolidaciones intermedias post-totalidad.

### 7.5. `journals/BOE-2026-087.xml` — Boletín Oficial del Estado

- **nativeId**: `BOE-2026-087`
- **Fuente**: BOE núm. 87, 9-abr-2026 (mismo XML que Ley 1/2026)
- **Publisher**: Agencia Estatal Boletín Oficial del Estado
- **Scope**: `national`
- **Contiene**: 1 disposición modelada (Ley 1/2026), pero el BOE núm. 87 real publicó decenas de dispositions más

**ResearchNotes** (3 fricciones limpias):
1. Muchas dispositions por issue, modelar todas explota el corpus.
2. Sin componentRef linking — perdemos data que sí existe.
3. Scope enum (national/regional/eu/municipal) muy grueso para España (BORME, autonómicos, IBERLEX).

### 7.6. `citations/cit-com-trabajo-2025-12-09.xml` — Sesión Comisión

- **nativeId**: `cit-com-trabajo-2025-12-09`
- **Fuente**: DSCD-15-CO-482 (Diario de Sesiones de Comisiones)
- **Convened body**: Comisión de Trabajo, Economía Social, Inclusión, Seguridad Social y Migraciones
- **scheduledFor**: 2025-12-09
- **Outcome de la sesión**: aprobación dictamen 121/000036 con 19 sí / 18 no
- **Fecha de modelado inicial: 22-dic-2025 (ERROR — esa era la fecha de publicación del BOCG, no la de la sesión real). Reescrito al 9-dic-2025 verificado.**

**ResearchNotes** (4 fricciones limpias):
1. Citation no es AKN nativo — extensión akndiff, interop con tools AKN-nativos rompería.
2. No incluí hora ni ubicación porque están solo en el PDF DSCD-15-CO-482.
3. Sin campo para vote outcome de la sesión.
4. Committee code (interno del Congreso) no preservado.

### 7.7. `debates/dscd-15-pl-26-mar-2026.xml` — Pleno con votaciones

- **nativeId**: `dscd-15-pl-175`
- **Fuente**: `_sources/es/DSCD-15-PL-175.html` (449 KB)
- **Sesión**: nº 169 del Pleno (XV Legislatura)
- **Publicación**: DSCD-15-PL-175 (publicación nº 175 del DSCD)
- **Fecha**: 26 marzo 2026, 09:02 a 14:29 (literal: "Eran las dos y veintinueve minutos de la tarde")
- **Presidió**: Francina Armengol Socias
- **8 oradores** (en orden, todos con sus grupos):
  1. Sra. Santana Perera (G.P. Mixto)
  2. Sr. Cervera Pinart (G.P. Junts per Catalunya)
  3. Sr. Salvador i Duch (G.P. Republicano)
  4. Sr./Sra. Ogou i Corbi (G.P. Plurinacional SUMAR)
  5. Sr. Aizcorbe Torra (G.P. VOX)
  6. Sr. Trenzano Rubio (G.P. Socialista)
  7. Sr. Tomás Olivares (G.P. Popular en el Congreso)
  8. Sra. Yolanda Díaz Pérez (Vicepresidenta Segunda y Ministra de Trabajo y Economía Social) — cierre
- **9 votaciones por bloque** (todas verificadas literales del DSCD):

| # | Bloque (resumido) | Emitidos | Sí | No | Abst | Resultado |
|---|---|---|---|---|---|---|
| 1 | Preámbulo + art. 2.3 LRREI + art. 3.4 LES + supresión art. cuarto + nuevas disposiciones | 350 | 137 | 180 | 33 | RECHAZADAS |
| 2 | Art. 1.5 (12 bis Coop) + 1.10 (19) + 1.20 (44 bis) + 1.27 (83 bis) + 2.3 + 3.1 + 3.1 bis | 349 | 137 | 212 | — | RECHAZADAS |
| 3 | Art. 1.14 (art. 27.2 Ley Cooperativas) | 350 | 346 | 4 | — | **APROBADAS** |
| 4 | Art. 2.2 (2.3.e LRREI) + 3.2 (5 bis 1 LES) | 350 | 313 | 4 | 33 | **APROBADAS** |
| 5 | Art. 2.3 (supresión art. 2.1.ñ bis LRREI) | 349 | 169 | 180 | — | RECHAZADAS |
| 6 | Art. 2.7 (segundo párrafo art. 6 LRREI) | 349 | 136 | 180 | 33 | RECHAZADAS |
| 7 | Art. 2.7 (nuevo párrafo cuarto art. 6 LRREI) | 349 | 3 | 313 | 33 | RECHAZADAS |
| 8 | Adición disp. final (actividad innovadora entidades sin fines lucrativos) | 350 | 138 | 179 | 33 | RECHAZADAS |
| 9 | Resto de las enmiendas | 349 | 170 | 179 | — | RECHAZADAS |

**Cita literal del cierre**: "Las enmiendas del Senado que hemos aprobado serán incorporadas al texto inicial aprobado por el Congreso de los Diputados. Se levanta la sesión. Eran las dos y veintinueve minutos de la tarde."

**ResearchNotes** (4 fricciones limpias):
1. Publication number (DSCD-15-PL-175) ≠ session number (169) — schema solo tiene un campo.
2. Schema no tiene `sessionNumber` field — agregamos como akndiff: extension.
3. **9 block votes, no per-debate vote model** — vote tallies viven como narrative en `<decision>`, no queryables.
4. Order of amendment blocks ≠ order of amendment numbers — bloques agrupan por contenido, no por número.

---

## 8. El grafo de cross-references entre los 7 docs

Al ingest, el loader extrae los `<ref href="...">` y `<componentRef src="...">` de cada XML y emite filas en `diff_document_links`. Para el corpus ES esto produce **19 links resueltos cross-doc + 7 externos skip**.

Diagrama:

```
                 ┌─────────────────────┐
                 │    Ley 27/1999      │
                 │  (act base, 1999)   │
                 └──────────▲──────────┘
                            │
              ┌─────────────┴───────┬────────────┬──────────┬──────────┐
              │ amends              │ amends     │ amends   │ amends   │
              │                     │            │          │          │
   ┌──────────┴──────────┐  ┌───────┴────┐  ┌────┴────┐  ┌──┴──────┐ │
   │   Ley 1/2026        │  │ Bill       │  │ Amend   │  │ Debate  │ │
   │   (act nueva)       │  │ 121/036    │  │ Ponencia│  │ Pleno   │ │
   └──────────▲──────────┘  └───────▲────┘  └────▲────┘  └─────────┘ │
              │                     │             │                   │
              │ contains            │ subject of  │ subject of        │
              │                     │             │                   │
   ┌──────────┴──────────┐    ┌─────┴────────┐    │                   │
   │ Journal BOE-87      │    │  Citation    │────┘                   │
   │  (9 abril 2026)     │    │  Comisión    │                        │
   │                     │    │  9-dic-2025  │                        │
   └─────────────────────┘    └──────────────┘                        │
                                                                       │
                                                                       │
   Ley 27/1999 ◄──────────────────────────────────────────────────────┘
   (debate referencia tanto a Ley 1/2026 como a Ley 27/1999)
```

**Refs externos (a leyes que no modelamos, los 7 que el loader marca como external/skip):**
- Ley 44/2007 (`https://www.boe.es/eli/es/l/2007/12/13/44`)
- Ley 5/2011 (`https://www.boe.es/eli/es/l/2011/03/29/5`)
- Ley 20/1990 (`https://www.boe.es/eli/es/l/1990/12/19/20`)
- Ley 31/1995 (`https://www.boe.es/eli/es/l/1995/11/08/31`)
- Ley 9/2017 (`https://www.boe.es/eli/es/l/2017/11/08/9`)
- Ley 19/2021 (`https://www.boe.es/eli/es/l/2021/12/20/19`)
- RDL 1/2023 (`https://www.boe.es/eli/es/rdl/2023/01/10/1`)

---

## 9. Las 5 fricciones grandes — análisis completo

### 9.1. Sponsor/submitter polimórfico

**Tipo afectado**: bill (sponsor), amendment (submitter)

**Schema actual** (`v3-schema.ts` línea 799):
```typescript
sponsors: text('sponsors', { mode: 'json' })
  .$type<Array<{
    name: string;
    role?: string;
    party?: string;
    chamber?: string;
    externalId?: string;
  }>>()
```

**Problema**: el shape `{name, party, chamber}` asume que cada sponsor es una persona individual con afiliación partidaria y cámara de pertenencia.

**En España**:
- Los **Proyectos de Ley** los firma "el Gobierno" como entidad colegiada. No tiene party ni chamber.
- Las **Proposiciones de Ley** las firman Grupos Parlamentarios. Tampoco son personas individuales.
- Las **enmiendas** las firman Grupos Parlamentarios, no diputados individuales.

**En EU**:
- Las **COM proposals** (bills) tienen como autor "la Comisión Europea". Misma fricción.

**Solución propuesta para v4**: shape polimórfico:
```typescript
sponsors: Array<
  | { kind: 'person', name, role?, party?, chamber?, externalId? }
  | { kind: 'organization', name, role?, externalId? }
>
```

### 9.2. Subtype para "modifying law"

**Tipo afectado**: act

**Schema actual**: ActTable tiene `status`, `promulgatedAt`, `effectiveAt`, `repealedAt`, `issuingBody`, `publicationJournalId`. No hay campo para distinguir "act auto-contenido" de "act modificador".

**Problema**: una ley auto-contenida (ej. Ley 27/1999) tiene su propio articulado sustantivo. Una ley modificadora (ej. Ley 1/2026) NO tiene contenido propio — su cuerpo entero son cambios a otras leyes ("Artículo primero. Modificación de la Ley X — uno. Se modifica el artículo Y para que quede redactado: ...").

Para el reader, navegar a una ley modificadora le interesa MENOS el texto modificador y MÁS los diffs con las leyes target.

**En España**: ~50% de la producción legislativa son leyes modificadoras (toda "ley de medidas fiscales", "ley ómnibus", "real decreto-ley de medidas urgentes" cae acá).

**En EU**: similar — muchos Reglamentos modifican Reglamentos anteriores.

**Solución propuesta para v4**: campo `actSubtype` en ActTable con valores `'self_contained' | 'modifying' | 'consolidated'`. Para los modificadores, una tabla side `act_modifications` con (modifyingActId, targetActId, modificationType, articleScope).

### 9.3. Falta `rango` en ActTable

**Tipo afectado**: act

**Schema actual**: solo `type='act'` para todos los actos.

**Problema**: España (y otros países) distingue legalmente:
- **Ley** — aprobación por mayoría simple del Congreso
- **Ley Orgánica** — aprobación por mayoría absoluta, modifica derechos fundamentales
- **Real Decreto-ley** — emitido por el Gobierno por urgencia, requiere convalidación posterior
- **Real Decreto** — reglamentario, sin necesidad de aprobación parlamentaria
- **Orden ministerial** — desarrollo administrativo

Cada una tiene procedimiento, jerarquía y efectos distintos. El BOE lo registra explícitamente en `<rango codigo="...">`.

**Solución propuesta para v4**: campo `rango` (text) en ActTable, con vocabulario por país:
- ES: ley, ley_organica, real_decreto_ley, real_decreto, orden_ministerial
- US: public_law, executive_order, federal_regulation
- EU: regulation, directive, decision, recommendation
- CL: ley, decreto_ley, decreto_supremo, decreto_con_fuerza_de_ley

### 9.4. Loader dropea `chamber` de eventRef

**Tipo afectado**: bill, debate

**Schema actual**: `BillEventTable` tiene columna `chamber` (text, nullable), pero el loader (`research/schema/loader.ts`) en `extractEvents()` no lo extrae del XML.

```typescript
// loader.ts línea ~430
function extractEvents(xmlRoot: XmlNode): ExtractedEvent[] {
  const out: ExtractedEvent[] = [];
  const events = findAll(xmlRoot, 'eventRef');
  let seq = 0;
  for (const e of events) {
    const date = attr(e, 'date');
    const refersTo = attr(e, 'refersTo') ?? '';
    const showAs = attr(e, 'showAs') ?? '';
    if (!date) continue;
    seq++;
    out.push({
      sequence: seq,
      occurredAt: date,
      actionType: refersTo.replace(/^#/, ''),
      actionTypeLocal: showAs
      // ← FALTA: chamber: attr(e, 'chamber')
    });
  }
  return out;
}
```

Y en `build.ts` línea ~336:
```typescript
db.insert(schema.BillEventTable).values({
  billId: documentId,
  sequence: e.sequence,
  occurredAt: ...,
  actionType: e.actionType,
  actionTypeLocal: e.actionTypeLocal,
  chamber: e.chamber ?? null,  // ← Existe pero e.chamber siempre es undefined
  details: {}
}).run();
```

**Problema**: el bicameralismo se pierde en la DB. No se puede saber si un evento sucedió en Congreso, Senado, o ambos.

**Fricción CROSS-PAÍS**: ya marcada también en `data/cl/bills/15234-11.xml` (note del azúcar). Reproducida en ES.

**Solución para v4**: 1 línea de código, agregar `chamber: attr(e, 'chamber')` al extractor de eventos. Trivial.

### 9.5. Per-block vote model en debates

**Tipo afectado**: debate

**Schema actual**: DebateTable tiene `chamber`, `sessionStartedAt`, `sessionEndedAt`, `externalRef`. Eso es todo. Las votaciones quedan dentro del XML del debate como `<decision>` narrativos.

**Problema**: las votaciones son DATA estructurada con counts (sí/no/abstención por bloque). Cualquier query útil sobre legislación las requiere:
- "Todas las enmiendas aprobadas en el Pleno del 26-mar-2026"
- "Todos los bills donde el Grupo X votó a favor"
- "Tasa de aprobación de enmiendas del Senado en la XV Legislatura"

Ninguna de estas queries funciona hoy porque las votaciones son texto plano.

**Solución para v4**: tabla side `debate_votes`:
```typescript
debate_votes: {
  debateId: text (FK to DebateTable.documentId),
  blockNumber: integer,
  blockDescription: text,
  totalCast: integer,
  forCount: integer,
  againstCount: integer,
  abstainCount: integer,
  result: 'approved' | 'rejected' | 'tied',
  targetDocumentId: text (FK to DocumentTable, nullable — ej. amendment ID si vota una enmienda específica)
}
```

---

## 10. Las fricciones menores anotadas

Son fricciones reales pero menos urgentes para v4. Anotadas en cada XML para Phase 3:

1. **BOE serializa plano vs AKN nested** — `<p class="X">` con clases que llevan estructura, vs nested `<title>/<chapter>/<article>` de AKN. Mapping reconstructivo, lossy si no se cuida.

2. **ELI URI europea coexiste con AKN URI** — cada doc del BOE tiene URI ELI estándar (`https://www.boe.es/eli/es/l/YYYY/MM/DD/N`) Y nuestra URI AKN (`/akn/es/act/.../...`). Dos identificadores paralelos para el mismo recurso.

3. **Bloque `<analisis>/<referencias>/<anteriores>` del BOE** — grafo cross-ref estructurado con verbo (MODIFICA / DEROGA / AÑADE / SUPRIME) y artículos afectados. El loader v3 lo IGNORA porque solo extrae `<ref>` de body. Major data loss.

4. **Multilingüe** — BOE publica versiones consolidadas en catalán y gallego como PDFs separados. Schema mono-language.

5. **Entrada en vigor diferida por provisión** — disposición final 5.2 de Ley 1/2026 difiere 1 año un artículo concreto. ActTable.effectiveAt es timestamp único.

6. **Informe de Ponencia consolida 50 enmiendas** — schema asume one-amendment-one-doc.

7. **No hay LinkRelation `enacted_as`** — para "el bill se convirtió en este act". Solo existe `'amends'` (otra dirección).

8. **23 ampliaciones del plazo de enmiendas se pierden** — schema modela apertura/cierre, no extensiones.

9. **`<citation>` no es AKN nativo** — extensión akndiff. Interop con tools AKN-nativos rompería.

10. **DSCD tiene dos numeraciones**: número de publicación (DSCD-15-PL-175) y número de sesión (169). Schema solo tiene un campo.

---

## 11. Build process y gotchas

### 11.1. Comandos

```bash
# Limpiar e instalar (primera vez)
yarn install                       # o pnpm install (ambos lockfiles existen)

# Si better-sqlite3 falla por bindings, recompilar
pnpm rebuild better-sqlite3        # Windows + Node 20 funciona

# Build del corpus a SQLite
npm run research:build             # tsx research/schema/build.ts

# Levantar demo (necesita research.db hecho)
npm run dev                        # vite dev
# → http://localhost:5173/demo
```

### 11.2. Flujo del build

`research/schema/build.ts`:

1. **Wipe**: borra `research.db` si existe
2. **Create tables**: las 20 tablas del schema v3 con CREATE TABLE generados desde Drizzle metadata (no migrations)
3. **walkCorpus**: `readdirSync(data/<country>)` → para cada subdir → `readdirSync()` filter `.xml` → parsea cada uno
4. **seedCountries**: insert en `diff_countries`
5. **Insertion loop** ordenada por `TYPE_ORDER` (act, journal, bill, amendment, ...):
   - `insertDocument` → row en `diff_documents`
   - `insertDetail` → row en `diff_bills` / `diff_acts` / `diff_journals` (otros types no tienen extractor todavía)
   - `insertVersions` → rows en `diff_document_versions` (priorVersions)
   - `insertEvents` → rows en `diff_bill_events` (solo bills)
6. **Pass 2 — link resolution**: para cada link extraído, busca `(country, type, nativeId)` en index, inserta en `diff_document_links`
7. **Summary**

### 11.3. Gotchas conocidos

1. **`research.db` lockeado**: si tienes `npm run dev` corriendo en otra terminal, mantiene el DB abierto y `wipeAndOpen` falla con EBUSY. Solución: parar el dev server.

2. **CL pre-existing bug**: `data/cl/acts/ley-20500-azucar.xml` tiene un `<ref>` literal sin escapar dentro de `<akndiff:researchNotes>`. Parser XML lo toma como ref real, intenta resolver, falla. **Build sale con código 1 al final pero los inserts ya pasaron**. Para España no afecta.

3. **`_sources/` dentro de `data/`**: el walker lo procesa como type. Solución: mover `_sources/` a nivel `research/schema/_sources/` (no dentro de data/).

4. **Refs a docs no modelados**: si pones `<ref href="/akn/es/act/2026-04-08/ley-1-2026">` antes de modelar Ley 1/2026, el resolver falla con "unresolved link". Solución: modelar primero los targets, después los sources. O usar URLs externos `https://...` que el resolver salta.

5. **XML mal formado**: el parser revienta. Specifically si tienes `<ref>` literal en text content sin escapar (`&lt;` `&gt;`).

6. **CRLF warnings en Windows**: `git add` muestra `LF will be replaced by CRLF`. No es problema, es solo aviso de auto-conversion de line endings.

---

## 12. Demo del resultado

`npm run dev` → http://localhost:5173/demo

Rutas que funcionan:

- `/demo` → lista de países cargados (CL + ES)
- `/demo/es` → docs ES agrupados por tipo (acts: 2, bills: 1, amendments: 1, journals: 1, citations: 1, debates: 1)
- `/demo/es/act/ley-27-1999` → detalle ley anterior con incoming links
- `/demo/es/act/ley-1-2026` → detalle ley nueva
- `/demo/es/bill/121-000036` → bill con timeline de 19 events + outgoing links
- `/demo/es/amendment/121-000036-am-ponencia` → informe de ponencia
- `/demo/es/journal/BOE-2026-087` → BOE núm. 87
- `/demo/es/citation/cit-com-trabajo-2025-12-09` → sesión Comisión
- `/demo/es/debate/dscd-15-pl-175` → debate del Pleno

Las páginas muestran el detalle del doc, las versiones (si aplica), los outgoing links y los incoming links. Las votaciones del debate aparecen como narrative en el body XML (no estructuradas en UI hoy — fricción anotada).

---

## 13. Errores cometidos durante el modelado y cómo se arreglaron

Durante el modelado original (sesión del 29-abr-2026) cometí 3 errores reales que detecté y corregí después con verificación primaria. Los documento acá para que no se repitan:

### Error 1: Voto inventado de 343/0/0 en el bill

**Qué pasó**: en la primera versión del bill XML, el event `#passed_second_chamber` decía "Vuelta del Senado, votación de enmiendas en Pleno (343 sí / 0 no / 0 abst)".

**Causa raíz**: confié en un resumen de WebFetch que tenía datos de OTRO bill (probablemente la 122/000097, donantes vivos, que sí votó 343/0/0 en otra sesión). El resumen confundió bills.

**Detección**: cuando bajé el DSCD-15-PL-175 con curl y leí localmente, vi que en realidad fueron **9 votaciones por bloque**, con resultados muy distintos (de 137/180/33 a 346/4/0).

**Corrección**: reescribí el event con la cifra correcta y agregué el debate XML con las 9 votaciones literales.

### Error 2: Fecha equivocada de la citación (22-dic vs 9-dic)

**Qué pasó**: la primera versión de la citación se llamó `cit-com-trabajo-2025-12-22.xml` con fecha 22-dic-2025.

**Causa raíz**: confundí la fecha de PUBLICACIÓN del BOCG-15-A-36-5 (que sí es 22-dic, cuando se publica el dictamen aprobado) con la fecha de la SESIÓN REAL de la Comisión (que fue el 9-dic-2025, según DSCD-15-CO-482).

**Detección**: WebFetch a `controlcongreso.com` (sitio civil de tracking) confirmó la fecha real y el voto (19 sí / 18 no).

**Corrección**: borré `cit-com-trabajo-2025-12-22.xml` y creé `cit-com-trabajo-2025-12-09.xml` con la fecha correcta.

### Error 3: Placeholders de horario en el debate

**Qué pasó**: la primera versión del debate XML tenía `09:00-19:00` como horario.

**Causa raíz**: usé valores por defecto razonables sin verificar.

**Detección**: cuando leí el HTML del DSCD localmente, la cifra real era 09:02 (apertura) a 14:29 (cierre, literal: "Eran las dos y veintinueve minutos de la tarde").

**Corrección**: reescribí el debate XML con horario verificado.

### Patrón común de los 3 errores

Los 3 errores tienen la misma raíz: **confiar en WebFetch (que devuelve resúmenes de IA) en vez de bajar la fuente con curl y leer localmente**. Para los acts NO cometí estos errores porque ahí desde el inicio usé curl directo del XML del BOE.

**Regla aprendida**: para datos críticos (votos, fechas exactas, IDs, números de referencia) → SIEMPRE curl + lectura primaria local. WebFetch es útil para investigación general, no para datos que van a entrar a un schema.

---

## 14. Lecciones aprendidas / reglas para los próximos países

1. **Curl + lectura local SIEMPRE para datos críticos.** No confiar en WebFetch para votos, fechas exactas, IDs.

2. **`_sources/` vive fuera de `data/`.** Ej: `research/schema/_sources/<país>/`. Gitignored.

3. **`<ref>` literales en `<akndiff:researchNotes>` rompen el link extractor.** Si querés mostrar un ejemplo, escapá: `&lt;ref ...&gt;`.

4. **Fechas de publicación BOCG/BOE ≠ fechas de la sesión real.** Para citaciones y debates usar fecha de sesión.

5. **El walker del build no salta subdirectorios `_`.** Conviene moverlos fuera de data/.

6. **Modelar primero los targets, después los sources.** Si A linkea a B, modelar B primero para que el resolver no falle.

7. **Refs internos (`/akn/<país>/...`) = grafo conectado. Refs externos (`https://...`) = skip seguro.** No mezclar.

8. **`<akndiff:researchNotes>` SOLO para fricciones schema-vs-realidad.** No para decisiones de modelado, no para self-corrections, no para cosas positivas.

9. **Cada doc se valida con su build correspondiente.** Iterar: write → build → ver error → fix → write.

10. **Verificación de votos: buscar `Efectuada la votación`** en el HTML del Diario de Sesiones. Las cifras vienen formateadas como "votos emitidos, X; a favor, Y; en contra, Z; abstenciones, W."

---

## 15. Checklist replicable para EU y US

### Pasos genéricos (aplica a cualquier país)

1. [ ] Leer `research/schema/schema-research-plan.md` (re-fresca el objetivo)
2. [ ] Leer `research/schema/v3-schema.ts` (refrescá los fields que cada type espera)
3. [ ] Leer un CL example y un ES example como template para tu type-X
4. [ ] Elegir UN caso real reciente (act + bill + amendments + journal + debate + citation conectados)
5. [ ] Crear `research/schema/_sources/<país>/`
6. [ ] Bajar fuentes primarias con curl (acts XML, bill HTML, debate HTML, etc.)
7. [ ] Crear estructura `research/schema/data/<país>/{acts,bills,amendments,journals,citations,debates}/`
8. [ ] Modelar XMLs uno por uno, conectándolos con hrefs `/akn/<país>/...`
9. [ ] Anotar fricciones nuevas en `<akndiff:researchNotes>` solo si son schema-vs-realidad
10. [ ] Correr `npm run research:build` y validar
11. [ ] Iterar hasta que el build cargue limpio
12. [ ] Hacer pasada de limpieza de researchNotes (sacar lo que no son fricciones puras)
13. [ ] Comparar fricciones nuevas contra las 5 grandes de ES + las de CL
14. [ ] Las que se repiten cross-país suben prioridad para v4
15. [ ] Escribir bitácora corta en `research/<fecha>/<país>-phase-1.md`
16. [ ] Escribir memoria detallada en `research/<fecha>/<país>-phase-1-context.md`
17. [ ] Agregar entrada al `README.md` raíz con estilo de Antoine

### Específico para EU

- **Fuentes**: Formex (XML propietario EU), CELLAR SPARQL (publications.europa.eu), EP Open Data (data.europarl.europa.eu)
- **Procedimientos**: COD (Ordinary Legislative Procedure), SPP (Special), Delegated Acts, Implementing Acts
- **Caso candidato**: Digital Markets Act (Reg. 2022/1925, COD 2020/0374) o AI Act (COD 2021/0106) — ambos ya tienen pipelines existentes que sirven de referencia
- **Fricción esperada**: "rapporteur" no mapea limpio a sponsor (ya marcado en plan original). MEPs por nombre en votaciones. EP positions vs Council positions. Procedimientos multi-stage con shuttling entre instituciones.
- **El pipeline EU produce 3 XMLs viewer-ready** (`01-act-original.xml`, `02-amendment-1.xml`, `03-act-final.xml`) — útiles como REFERENCIA, no como input directo

### Específico para US

- **Fuentes**: Congress.gov API (LOC, 5K req/hr), GovInfo API (GPO, 36K req/hr), Senate XML, House XML — todo público sin auth
- **USLM ya es derivado de AKN** — conversión más directa que ES o EU
- **Versiones de bills**: IH (Introduced House), IS (Introduced Senate), RH (Reported House), RS (Reported Senate), EH (Engrossed House), ES (Engrossed Senate), ENR (Enrolled), PLAW (Public Law). 60+ códigos en total.
- **Caso candidato**: bill que se convirtió en Public Law en 119º Congreso, ej. S.5 (Laken Riley Act, ya enrolled)
- **Fricción esperada**: Committee reports (CRPT) parsing complejo. Conference reports cuando Senate y House votan diferente. Congressional Record (debates) requiere OCR o IA.

### Específico para Perú

- **NO HACER en Phase 1.** Bloqueado por WAF Radware que bloquea 403 todo `api.congreso.gob.pe`. Sin acceso programático.
- Documentado en `research/2026-02-24/peru-31814/README.md`. Requiere decisión institucional o monitoreo periódico del WAF.

---

## 16. Estado actual y archivos generados

### Archivos en repo (tracked, listos para commit)

- `research/schema/data/es/acts/ley-27-1999.xml`
- `research/schema/data/es/acts/ley-1-2026.xml`
- `research/schema/data/es/bills/121-000036.xml`
- `research/schema/data/es/amendments/121-000036-am-ponencia.xml`
- `research/schema/data/es/journals/BOE-2026-087.xml`
- `research/schema/data/es/citations/cit-com-trabajo-2025-12-09.xml`
- `research/schema/data/es/debates/dscd-15-pl-26-mar-2026.xml`
- `research/2026-04-29/es-phase-1.md` (bitácora corta para Antoine)
- `research/2026-04-29/es-phase-1-context.md` (este documento, memoria detallada)

### Archivos gitignored (no se suben)

- `research/schema/_sources/es/*` (fuentes originales bajadas con curl)
- `research/schema/research.db` y `.db-shm`/`.db-wal` (SQLite generado por build)

### Comandos de verificación

```bash
# Ver estado de git
git status --short

# Validar que el corpus carga
npm run research:build

# Validar que el demo funciona
npm run dev
# Abrir http://localhost:5173/demo

# Greppar fricciones cross-corpus
grep -r "researchNotes" research/schema/data/ -A 30
```

---

## 17. Bitácora — dónde subir cada cosa

### `README.md` raíz del repo (changelog público de Antoine)

Antoine mantiene ahí entradas por fecha en formato narrado, una por cada hito del research. Para esta iteración correspondería agregar una entrada nueva con fecha `29/04/26` que diga algo como:

> Hicimos phase 1 con España, modelando a mano los 7 tipos del rito legislativo (acts, bill, journal, amendment, debate, citation) con datos reales de la Ley 1/2026 de Economía Social. España carga estructuralmente al 100% en v3 pero aparecieron 5 fricciones grandes que valen para discutir una v4: sponsor/submitter polimórfico (Gobierno y Grupos Parlamentarios no son personas), subtype de leyes modificadoras, campo rango (Ley vs Ley Orgánica vs RDL), chamber dropeado por el loader (mismo gap que ya estaba en CL), y per-block vote model en debates. Detalle completo en `research/2026-04-29/`.

Estilo: una sola entrada narrada en español, sin headers ni bullets, fecha en formato `DD/MM/AA`.

### `research/2026-04-29/es-phase-1.md` (bitácora corta interna)

Resumen de 4-5 párrafos. Para retomar el research después o pasárselo a otra persona sin abrumarla con detalle. Ya está escrito.

### `research/2026-04-29/es-phase-1-context.md` (este documento, memoria detallada)

Para que el research sea reproducible. Cualquier persona que vaya a hacer EU/US debería leerlo antes de empezar para no re-descubrir la metodología. Debería actualizarse cuando se sume EU y US, agregando lo que se aprenda específico de esos países.

### Nada en producción

Este experimento NO toca código de producción (no toca el viewer en `/pro` ni los pipelines existentes). Vive solo en `research/`. Si algún día las conclusiones de Phase 3 deciden cambiar el schema, recién entonces se actualiza el código.

---

## Fin del documento

Última actualización: 2026-04-29.
