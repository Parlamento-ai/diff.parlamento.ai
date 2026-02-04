# AKN Citation: A New Document Type for Parliamentary Agendas

**Fecha**: 03/02/2026
**Autor**: Parlamento.ai
**Estado**: Propuesta

---

## Contexto

En Parlamento.ai trabajamos todos los dias con tres cosas: citaciones, transmisiones y comisiones. Son el pan de cada dia. Son lo que mueve las cosas hacia adelante en el mundo legislativo.

Cuando empezamos a explorar Akoma Ntoso como formato base para englobar todo, nos dimos cuenta de que las transmisiones encajan perfectamente en el tipo `debate`, y las comisiones se representan bien con `TLCOrganization` en la metadata. Pero las citaciones — el documento que convoca a una sesion, que dice cuándo, dónde y qué se va a discutir — no tienen lugar en el formato.

AKN tiene 12 tipos de documentos. Ninguno es una citacion.

Este documento explica por qué creemos que falta, por qué decidimos crear un tipo nuevo, y cómo lo diseñamos para que sea consistente con el resto del formato y, de paso, compatible con estandares de calendario como iCalendar/CalDAV.

---

## Parte 1: Lo que falta en AKN

### El problema

Akoma Ntoso fue diseñado como un formato de **archivo**. Su foco es representar documentos legislativos una vez que existen: leyes promulgadas, debates transcritos, enmiendas registradas, sentencias publicadas. Es un formato que mira hacia atras.

Pero el trabajo legislativo del dia a dia mira hacia adelante. Antes de que exista un debate, alguien tiene que convocar la sesion. Antes de que se vote, alguien tiene que definir qué se va a discutir. Ese documento es la **citacion** (o *tabla*, *orden del dia*, *order paper*, *Tagesordnung*, *ordre du jour*, dependiendo del pais).

Cuando intentamos representar una citacion en AKN, la unica opcion es el tipo `doc` — un tipo generico para "todo lo que no encaja en los otros 11 tipos". `doc` no tiene estructura semantica propia. No tiene un campo para la fecha de la sesion, ni para la hora, ni para el lugar, ni para la lista ordenada de asuntos. Cualquier dato que pongas ahi es texto libre, no computable.

Esto significa que si tenemos una carpeta con 500 archivos AKN y queremos responder "¿qué sesiones hay esta semana?", no podemos. Tendriamos que abrir cada `doc`, leer el texto, y *adivinar* cuales son citaciones y cuales son informes, comunicados o cualquier otra cosa.

### Por qué esto importa para nuestra vision

En el README de este proyecto escribimos que tal vez los parlamentos deberian tener su informacion como archivos y carpetas en vez de bases de datos SQL, navegables por links como en la web. Que tal vez podria ser un repositorio Git, clonable por cualquiera.

Para que esa vision funcione, los archivos tienen que ser **auto-descriptivos**. Si busco "todas las citaciones de la Comision de Hacienda en enero 2026", deberia poder hacerlo con un simple filtro sobre los archivos, sin necesidad de una base de datos aparte, sin un indice externo, sin nada mas que los archivos mismos.

El tipo `doc` no permite eso. Es una bolsa donde todo cabe y nada se distingue.

### La opcion conservadora que descartamos

Antes de crear un tipo nuevo, consideramos dos alternativas:

**Alternativa A: Usar `doc` con convenciones estrictas de URI.** Guardar las citaciones en paths como `/akn/cl/doc/citacion/senado/2026-02-05/` y depender del path para filtrar. Funciona, pero es fragil: la identidad del documento depende de una convencion de nombres que no esta en el estandar, no se valida, y cada implementacion puede hacer lo que quiera.

**Alternativa B: Usar `doc` con una extension `akndiff:session`.** Agregar un elemento custom al `doc` para la metadata de sesion, similar a como agregamos `changeSet` a los amendments. Esto es mejor, pero sigue teniendo el problema de que el tipo base es `doc` — un lector AKN que no conozca nuestra extension lo trataria como un documento generico sin estructura.

Ambas opciones son parches. Si la citacion es un documento lo suficientemente importante como para justificar una estructura propia, deberia tener un tipo propio.

---

## Parte 2: No es la caja de Pandora

La pregunta mas importante antes de crear un tipo nuevo es: **¿estamos abriendo la caja de Pandora?** Si las citaciones son un gap, ¿cuantos otros gaps hay? ¿Vamos a terminar rediseñando todo el formato?

Para responder esto, investigamos como funcionan los parlamentos del mundo occidental — Europa, Norteamerica y Sudamerica — y mapeamos los documentos operacionales que produce cada uno.

### Lo que encontramos

Cada parlamento, sin importar el pais, sigue esencialmente el mismo ciclo:

```
1. CONVOCATORIA  →  "¿Cuándo nos reunimos y para qué?"
2. SESION        →  "El debate y la votacion"
3. REGISTRO      →  "Lo que pasó"
```

AKN cubre los pasos 2 y 3 muy bien (debate, act, amendment, judgment). El gap es el paso 1. Y el hallazgo clave es: **el paso 1 es el mismo documento en practicamente todos los parlamentos.** Solo cambia el nombre:

| Pais | Nombre | Contenido |
|------|--------|-----------|
| Chile | Citacion + Tabla | Fecha, hora, lugar, lista de proyectos |
| España | Orden del Dia | Fijado por Presidencia + Junta de Portavoces |
| Francia | Ordre du Jour ("feuille verte") | Fijado por Conference des Presidents |
| Alemania | Tagesordnung | Fijado por Altestenrat (Consejo de Ancianos) |
| Reino Unido | Order Paper | Publicado diariamente, estructurado por tipo de asunto |
| Estados Unidos (House) | Calendar / Schedule | Fijado por liderazgo de mayoria + Rules Committee |
| Estados Unidos (Senate) | Calendar of Business | "General Orders" + unanimous consent agreements |
| Argentina | Plan de Labor / Orden del Dia | Fijado por Comision de Labor Parlamentaria |
| Mexico | Orden del Dia | Fijado por Mesa Directiva, tiene secciones definidas |
| Italia | Ordine del Giorno | Fijado por Conferencia de Lideres de Grupo |
| Brasil | Ordem do Dia | Publicado como "Ordem do Dia Eletronica" |
| Union Europea | Agenda | Fijada por Conference of Presidents |

El documento es estructuralmente el mismo en todas partes: **una fecha, un cuerpo parlamentario, y una lista ordenada de asuntos a discutir, cada uno referenciando un proyecto de ley o mocion.**

### Lo que ya esta cubierto por AKN

Buscamos especificamente otros tipos de documentos operacionales que pudieran estar faltando:

- **Registros de votacion**: Ya lo resolvimos con `akndiff:vote` en el `changeSet`.
- **Informes de comision**: El tipo `doc` funciona bien para esto. Un informe es un documento terminado con conclusiones, no un artefacto operacional.
- **Preguntas parlamentarias**: El tipo `debate` tiene elementos `<questions>`, `<oralStatements>`, `<writtenStatements>`.
- **Mociones y acciones procedimentales**: El tipo `debate` tiene `<proceduralMotion>`, `<pointOfOrder>`, `<adjournment>`.
- **Calendario legislativo**: El calendario de semanas (semanas de gobierno, semanas de control, recesos) es puramente administrativo. No referencia proyectos especificos. No vale la pena formalizarlo.
- **Urgencias y acuerdos de unanimidad**: Son maniobras procedimentales que afectan la agenda. Viven dentro del debate o como atributos de la citacion. No son un documento separado.

### El veredicto

**No es la caja de Pandora. Es una sola caja.** La citacion es el unico documento operacional significativo que cumple todos estos criterios:

1. Es **universal** en los parlamentos occidentales
2. Es **estructuralmente consistente** entre paises (siempre tiene fecha, cuerpo, y lista de asuntos)
3. **Falta en AKN**
4. Es **importante para el trabajo diario** de Parlamento.ai

Todo lo demas esta cubierto por AKN, resuelto por nuestras extensiones, o es demasiado administrativo para formalizar.

### Nadie lo ha resuelto

Un dato revelador: investigamos como publican sus agendas los parlamentos mas avanzados del mundo:

- **Reino Unido**: Tiene un API REST dedicado (`services.orderpaper.parliament.uk`) que retorna XML/JSON. Pero es un sistema propietario, no AKN.
- **Italia**: El pais donde nacio AKN. El Senado italiano publica datos legislativos en AKN en GitHub. Pero su *ordine del giorno* se publica como paginas HTML. Ni siquiera Italia usa AKN para esto.
- **Union Europea**: Tiene un portal de datos abiertos con agendas y actas. Pero con su propio modelo de datos, no AKN.
- **Paraguay**: Sorprendentemente avanzado con `datos.congreso.gov.py`. Pero tampoco es AKN.
- **Chile**: Citaciones y tabla semanal publicadas como paginas web. Sin formato estructurado, sin API.

Nadie usa AKN para agendas. Nadie ha resuelto este problema con un formato interoperable. Los que lo han resuelto (UK, EU) construyeron sistemas a medida.

---

## Parte 3: El tipo `citation` — Diseño completo

### Principios de diseño

1. **Consistencia con AKN**: Seguimos exactamente las mismas convenciones de estructura, metadata FRBR, referencias TLC, y nombres de elementos.
2. **Auto-descriptivo**: Un archivo `citation` contiene toda la informacion necesaria para ser filtrado y consultado sin contexto externo.
3. **Linked**: Cada item de la agenda referencia el proyecto de ley o mocion correspondiente via `<ref>`. Despues de la sesion, la citacion se linkea al debate resultante.
4. **Convertible a iCalendar**: Los campos de `<session>` mapean directamente a VEVENT (RFC 5545), permitiendo generar feeds `.ics` de forma mecanica.
5. **Universal**: La estructura acomoda las variaciones entre paises sin forzar un modelo unico.

### Elementos nuevos

| Elemento | Proposito |
|----------|-----------|
| `<citation>` | Tipo raiz del documento (como `<debate>`, `<act>`, `<bill>`) |
| `<citationBody>` | Contenedor del cuerpo (como `<debateBody>`, `<judgmentBody>`) |
| `<session>` | Metadata operacional: cuando, donde, quien convoca |
| `<agenda>` | Contenedor de la lista ordenada de asuntos |
| `<agendaSection>` | Seccion tematica de la agenda (como `<debateSection>`) |
| `<agendaItem>` | Cada asunto individual a discutir |
| `<step>` | Etapa legislativa en la que se encuentra el asunto |

### Estructura completa

```xml
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0">
  <citation name="sesion-senado-2026-02-05">

    <!-- ============================================================ -->
    <!-- METADATA (identica estructura FRBR que todos los tipos AKN)  -->
    <!-- ============================================================ -->
    <meta>
      <identification source="#secretaria">

        <!-- Work: la citacion como concepto abstracto -->
        <FRBRWork>
          <FRBRthis value="/akn/cl/citation/senado/2026-02-05"/>
          <FRBRuri value="/akn/cl/citation/senado/2026-02-05"/>
          <FRBRdate date="2026-02-05" name="session"/>
          <FRBRauthor href="#senado"/>
          <FRBRcountry value="cl"/>
        </FRBRWork>

        <!-- Expression: esta version especifica (idioma + fecha de publicacion) -->
        <FRBRExpression>
          <FRBRthis value="/akn/cl/citation/senado/2026-02-05/esp@2026-02-03"/>
          <FRBRuri value="/akn/cl/citation/senado/2026-02-05/esp@2026-02-03"/>
          <FRBRdate date="2026-02-03" name="publication"/>
          <FRBRlanguage language="esp"/>
        </FRBRExpression>

        <!-- Manifestation: el archivo fisico -->
        <FRBRManifestation>
          <FRBRthis value="/akn/cl/citation/senado/2026-02-05/esp@2026-02-03/main.xml"/>
          <FRBRformat value="application/akn+xml"/>
        </FRBRManifestation>

      </identification>

      <!-- Referencias a entidades mencionadas en el documento -->
      <references source="#secretaria">
        <TLCOrganization eId="senado" href="/org/cl/senado"
                         showAs="Senado de la Republica"/>
        <TLCOrganization eId="comision-hacienda" href="/org/cl/senado/comision/hacienda"
                         showAs="Comision de Hacienda"/>
        <TLCPerson eId="secretaria" href="/persona/cl/secretaria-senado"
                   showAs="Secretaria del Senado"/>
        <TLCConcept eId="sesion-ordinaria" href="/ontology/session-type/ordinary"
                    showAs="Sesion Ordinaria"/>
      </references>
    </meta>


    <!-- ============================================================ -->
    <!-- PREFACE (titulo y subtitulo, igual que en otros tipos AKN)   -->
    <!-- ============================================================ -->
    <preface>
      <p class="title">Citacion a Sesion Ordinaria N. 47</p>
      <p class="subtitle">Legislatura 372 - Periodo Ordinario</p>
    </preface>


    <!-- ============================================================ -->
    <!-- CITATION BODY                                                -->
    <!-- ============================================================ -->
    <citationBody>

      <!--
        SESSION: metadata operacional de la sesion convocada.
        Este elemento es lo que hace queryable al documento.
        Cada atributo existe para responder una pregunta concreta.
      -->
      <session eId="session_1"
               date="2026-02-05"
               time="16:00"
               endTime="20:00"
               place="Sala del Senado, Valparaiso"
               body="#senado"
               type="#sesion-ordinaria"
               number="47"
               legislature="372"/>

      <!--
        AGENDA: la lista ordenada de asuntos a tratar.
        Organizada en secciones, cada una con items.
      -->
      <agenda>

        <!-- Seccion: Facil Despacho -->
        <agendaSection eId="agsect_facil-despacho" name="easy-dispatch">
          <heading>Facil Despacho</heading>

          <agendaItem eId="agitem_1" status="pending">
            <heading>Proyecto de Ley 16.230-05</heading>
            <p>Modifica el Codigo Sanitario en materia de etiquetado
               de alimentos procesados.</p>
            <ref href="/akn/cl/bill/16230-05">Proyecto 16.230-05</ref>
            <step type="second-reading"/>
          </agendaItem>

        </agendaSection>

        <!-- Seccion: Orden del Dia -->
        <agendaSection eId="agsect_orden-del-dia" name="order-of-the-day">
          <heading>Orden del Dia</heading>

          <agendaItem eId="agitem_2" status="pending" priority="urgent">
            <heading>Reforma Tributaria</heading>
            <p>Proyecto que moderniza el sistema tributario.
               Informe de la <ref href="/org/cl/senado/comision/hacienda">
               Comision de Hacienda</ref>.</p>
            <ref href="/akn/cl/bill/16245-07">Proyecto 16.245-07</ref>
            <step type="committee-report"/>
          </agendaItem>

          <agendaItem eId="agitem_3" status="pending">
            <heading>Ley de Proteccion de Datos Personales</heading>
            <p>Segundo tramite constitucional. Proyecto con urgencia
               simple del Ejecutivo.</p>
            <ref href="/akn/cl/bill/11144-07">Proyecto 11.144-07</ref>
            <step type="second-reading"/>
          </agendaItem>

          <agendaItem eId="agitem_4" status="pending">
            <heading>Modernizacion del Servicio Nacional de Aduanas</heading>
            <p>Primer tramite constitucional. Mensaje presidencial.</p>
            <ref href="/akn/cl/bill/15899-05">Proyecto 15.899-05</ref>
            <step type="first-reading"/>
          </agendaItem>

        </agendaSection>

        <!-- Seccion: Incidentes -->
        <agendaSection eId="agsect_incidentes" name="incidents">
          <heading>Incidentes</heading>
          <p>Tiempo restante para intervenciones de los señores Senadores.</p>
        </agendaSection>

      </agenda>

    </citationBody>

  </citation>
</akomaNtoso>
```

### Detalle de cada elemento

#### `<citation>`

El elemento raiz del documento, al mismo nivel que `<act>`, `<bill>`, `<debate>`, etc. Tiene un atributo `name` que sirve como identificador legible, siguiendo la convencion de todos los tipos AKN.

#### `<citationBody>`

El contenedor del cuerpo del documento. Sigue la convencion de AKN donde cada tipo tiene su propio body:

| Tipo | Body |
|------|------|
| `act` | `<body>` |
| `bill` | `<body>` |
| `debate` | `<debateBody>` |
| `amendment` | `<amendmentBody>` |
| `judgment` | `<judgmentBody>` |
| `doc` | `<mainBody>` |
| `documentCollection` | `<collectionBody>` |
| `officialGazette` | `<collectionBody>` |
| **`citation`** | **`<citationBody>`** |

#### `<session>`

La metadata operacional de la sesion convocada. Cada atributo responde a una pregunta concreta:

| Atributo | Tipo | Proposito | Pregunta que responde |
|----------|------|-----------|----------------------|
| `eId` | string | Identificador unico dentro del documento | Referencia interna |
| `date` | date (YYYY-MM-DD) | Fecha de la sesion | "¿Que sesiones hay esta semana?" |
| `time` | time (HH:MM) | Hora de inicio | "¿A que hora es?" / Sincronizacion calendario |
| `endTime` | time (HH:MM) | Hora estimada de termino | Duracion del evento de calendario |
| `place` | string | Ubicacion fisica | "¿Donde es?" / LOCATION en iCalendar |
| `body` | ref (#eId) | Referencia al cuerpo que convoca | "Todas las citaciones de la Comision de Hacienda" |
| `type` | ref (#eId) | Tipo de sesion | Filtrar por ordinaria/extraordinaria/especial |
| `number` | integer | Numero de sesion dentro de la legislatura | Referencia secuencial |
| `legislature` | string | Periodo legislativo | Agrupacion historica |

El atributo `body` es una referencia `#eId` que apunta a un `TLCOrganization` declarado en la metadata. Esto permite queries como "todas las citaciones donde `body` referencia a `/org/cl/senado/comision/hacienda`".

El atributo `type` referencia un `TLCConcept` declarado en la metadata. Los valores tipicos serian:

| Valor | Descripcion |
|-------|-------------|
| `ordinary` | Sesion ordinaria, programada en el calendario regular |
| `extraordinary` | Sesion extraordinaria, convocada fuera del calendario |
| `special` | Sesion especial, convocada para un asunto especifico |
| `ceremonial` | Sesion ceremonial (inauguracion, cuenta publica, etc.) |

#### `<agenda>`

Contenedor para la lista ordenada de asuntos. Separa el "que" (la agenda) del "cuando y donde" (la sesion). Esta separacion es importante porque permite que la misma sesion tenga una agenda que se actualice (nueva Expression en FRBR) sin cambiar los datos de convocatoria.

#### `<agendaSection>`

Cada seccion tematica de la agenda. Sigue la misma logica que `<debateSection>` en los debates: un contenedor con `eId`, `name` y `<heading>`.

El atributo `name` usa valores estandarizados que mapean a las secciones universales:

| `name` | Chile | España | Francia | UK | US | Argentina | Mexico |
|---------|-------|--------|---------|-----|-----|-----------|--------|
| `easy-dispatch` | Facil Despacho | — | — | — | Suspension of Rules | — | — |
| `order-of-the-day` | Orden del Dia | Orden del Dia | Ordre du Jour | Orders of the Day | Calendar of Business | Orden del Dia | Orden del Dia |
| `incidents` | Incidentes | Ruegos y Preguntas | Questions au Gouvernement | Questions | — | — | Proposiciones |
| `voting` | Votaciones | Votaciones | Vote | Divisions | Roll Call | Votacion | Votacion |
| `statements` | — | Declaraciones | Declarations | Statements | — | Manifestaciones | Comunicaciones |
| `petitions` | — | Peticiones | Petitions | Petitions | — | Peticiones | — |
| `questions` | — | Preguntas | Questions orales | Oral Questions | — | — | Preguntas |

No todos los parlamentos usan todas las secciones. Un parlamento chileno tipicamente usa `easy-dispatch`, `order-of-the-day`, e `incidents`. Un parlamento britanico usa `questions`, `order-of-the-day`, `statements`, y `voting`. El formato acomoda ambos sin forzar nada.

#### `<agendaItem>`

Cada asunto individual en la agenda. Atributos:

| Atributo | Tipo | Proposito |
|----------|------|-----------|
| `eId` | string | Identificador unico (patron: `agitem_[numero]`) |
| `status` | enum | Estado del asunto |
| `priority` | enum | Prioridad (mapea a "urgencias" en Chile) |

Valores de `status`:

| Valor | Significado |
|-------|-------------|
| `pending` | Pendiente de discusion (estado inicial) |
| `discussed` | Discutido durante la sesion |
| `postponed` | Postergado para otra sesion |
| `withdrawn` | Retirado de la agenda |

Valores de `priority`:

| Valor | Chile | España | UK |
|-------|-------|--------|-----|
| `normal` | Sin urgencia | Normal | — |
| `simple` | Urgencia simple | — | — |
| `extreme` | Suma urgencia | — | — |
| `immediate` | Discusion inmediata | — | Emergency debate |

Contenido del `<agendaItem>`:

- `<heading>`: Titulo del asunto
- `<p>`: Descripcion o contexto
- `<ref>`: Referencia al proyecto de ley, mocion, o documento relacionado
- `<step>`: Etapa legislativa (ver siguiente seccion)

#### `<step>`

Indica en que punto del proceso legislativo se encuentra el asunto. Responde a la pregunta: *"¿por que este proyecto esta en la agenda hoy?"*

| `type` | Significado | Chile |
|--------|-------------|-------|
| `first-reading` | Primera discusion | Primer tramite constitucional |
| `second-reading` | Segunda discusion | Segundo tramite |
| `third-reading` | Tercera discusion | Tercer tramite |
| `committee-report` | Informe de comision | Informe de comision |
| `conference` | Comision mixta | Comision mixta |
| `final-vote` | Votacion final | Votacion en general |
| `veto-override` | Rechazo de veto | Insistencia |
| `reconsideration` | Reconsideracion | — |

### Convencion de eId

Siguiendo los patrones de AKN:

| Elemento | Patron eId | Ejemplos |
|----------|-----------|----------|
| `session` | `session_[numero]` | `session_1` |
| `agendaSection` | `agsect_[nombre-semantico]` | `agsect_orden-del-dia` |
| `agendaItem` | `agitem_[numero]` | `agitem_1`, `agitem_2` |

### Convencion de URI

Siguiendo el patron FRBR de AKN:

```
Work:          /akn/[pais]/citation/[cuerpo]/[fecha-sesion]
Expression:    /akn/[pais]/citation/[cuerpo]/[fecha-sesion]/[idioma]@[fecha-publicacion]
Manifestation: /akn/[pais]/citation/[cuerpo]/[fecha-sesion]/[idioma]@[fecha-publicacion]/main.xml
```

Ejemplos:

```
/akn/cl/citation/senado/2026-02-05
/akn/cl/citation/comision-hacienda/2026-02-04
/akn/cl/citation/camara/2026-02-06
/akn/es/citation/congreso-diputados/2026-02-10
/akn/fr/citation/assemblee-nationale/2026-02-12
```

Para comisiones, el cuerpo en la URI es el slug de la comision:

```
/akn/cl/citation/comision-hacienda/2026-02-04
/akn/cl/citation/comision-educacion/2026-02-05
/akn/cl/citation/subcomision-presupuesto/2026-02-03
```

---

## Parte 4: Cross-linking con otros tipos AKN

### Citation → Debate (lo planeado → lo que paso)

Cuando la sesion se realiza y se produce un registro de debate, ambos documentos se linkean mutuamente:

```xml
<!-- En la citation: link forward al debate resultante -->
<session date="2026-02-05" ...
         debate="/akn/cl/debate/senado/2026-02-05"/>

<!-- En el debate: link backward a la citacion que lo convoco -->
<meta>
  <references>
    <TLCEvent eId="citacion" href="/akn/cl/citation/senado/2026-02-05"
              showAs="Citacion Sesion 47"/>
  </references>
</meta>
```

Esto crea una trazabilidad bidireccional. Desde la citacion puedes ir al debate. Desde el debate puedes volver a la citacion. Y lo mas importante: puedes comparar la agenda planificada con lo que realmente se discutio.

### Citation → Bill (la agenda → los proyectos)

Cada `<agendaItem>` contiene un `<ref>` al proyecto de ley:

```xml
<agendaItem eId="agitem_2" status="pending" priority="urgent">
  <heading>Reforma Tributaria</heading>
  <ref href="/akn/cl/bill/16245-07">Proyecto 16.245-07</ref>
  <step type="committee-report"/>
</agendaItem>
```

Esto permite queries como: "¿en cuantas citaciones ha aparecido el proyecto 16.245-07?" o "¿cuanto tiempo lleva este proyecto en la agenda sin ser discutido?"

### Citation → Organization (la convocatoria → quien convoca)

A traves de `session@body` y las referencias `TLCOrganization`:

```xml
<session body="#comision-hacienda" .../>
...
<TLCOrganization eId="comision-hacienda"
                 href="/org/cl/senado/comision/hacienda"
                 showAs="Comision de Hacienda"/>
```

La jerarquia organizacional se expresa en el `href` de la URI:

```
/org/cl/congreso                                    ← Congreso Nacional
/org/cl/senado                                      ← Senado
/org/cl/senado/comision/hacienda                    ← Comision del Senado
/org/cl/senado/comision/hacienda/subcomision/X      ← Subcomision
/org/cl/camara                                      ← Camara de Diputados
/org/cl/congreso/comision-mixta/reforma-tributaria   ← Comision Mixta
```

---

## Parte 5: Compatibilidad con iCalendar / CalDAV

### El mapeo

El elemento `<session>` fue diseñado para mapear directamente a un `VEVENT` segun [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545):

```
AKN citation                    →  iCalendar VEVENT
─────────────────────────────────────────────────────────
session@date + session@time     →  DTSTART
session@date + session@endTime  →  DTEND
session@place                   →  LOCATION
preface/p.title                 →  SUMMARY
session@body → TLCOrganization  →  ORGANIZER
agendaItem/heading (todos)      →  DESCRIPTION
FRBRWork/FRBRthis               →  UID
FRBRExpression/FRBRdate         →  DTSTAMP
FRBRWork/FRBRuri (como URL)     →  URL
```

### Ejemplo de conversion

Un archivo citation como el de arriba se convertiria mecanicamente a:

```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Parlamento.ai//AKN Diff//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Senado de la Republica - Sesiones

BEGIN:VEVENT
UID:/akn/cl/citation/senado/2026-02-05
DTSTAMP:20260203T120000Z
DTSTART;TZID=America/Santiago:20260205T160000
DTEND;TZID=America/Santiago:20260205T200000
SUMMARY:Sesion Ordinaria N. 47 - Senado
LOCATION:Sala del Senado\, Valparaiso
ORGANIZER;CN=Senado de la Republica:mailto:senado@senado.cl
STATUS:CONFIRMED
CATEGORIES:Senado,Sesion Ordinaria,Legislatura 372
DESCRIPTION:FACIL DESPACHO:\n
 1. Proyecto 16.230-05 - Etiquetado sanitario\n
 \nORDEN DEL DIA:\n
 2. Proyecto 16.245-07 - Reforma Tributaria [URGENTE]\n
 3. Proyecto 11.144-07 - Proteccion de Datos\n
 4. Proyecto 15.899-05 - Modernizacion Aduanas\n
 \nINCIDENTES:\n
 Intervenciones de Senadores
URL:https://parlamento.ai/akn/cl/citation/senado/2026-02-05
END:VEVENT

END:VCALENDAR
```

### Modelo de suscripcion por calendario

La arquitectura de feeds seria:

```
AKN citation files (fuente de verdad)
        │
        ├──→  /cal/cl/senado.ics                    (todas las sesiones del Senado)
        ├──→  /cal/cl/camara.ics                    (todas las sesiones de la Camara)
        ├──→  /cal/cl/comision/hacienda.ics          (solo Comision de Hacienda)
        ├──→  /cal/cl/comision/educacion.ics         (solo Comision de Educacion)
        ├──→  /cal/cl/comision/salud.ics             (solo Comision de Salud)
        └──→  /cal/cl/all.ics                        (todo)
```

Cada feed `.ics` se genera automaticamente a partir de los archivos citation filtrados por `session@body`. Un usuario suscribe `/cal/cl/comision/hacienda.ics` en Google Calendar, Apple Calendar u Outlook, y recibe automaticamente cada sesion de la Comision de Hacienda sincronizada en su calendario.

Los `<agendaItem>` se concatenan en el campo DESCRIPTION del evento, asi que cuando abres el evento en tu calendario ves exactamente que proyectos se van a discutir, con links de vuelta a los documentos AKN completos.

### Lo que esto no intenta resolver

El tipo citation se mantiene deliberadamente en su ambito:

- **No es un sistema de calendario.** Es un tipo de documento que *puede producir* eventos de calendario. El `.ics` es un artefacto derivado, no la fuente.
- **No modela quienes asisten.** Eso es trabajo del debate (con `<speech by="#...">` para cada intervencion). La citacion solo dice que cuerpo convoca.
- **No modela resultados.** Eso es el debate + amendment + vote. La citacion solo captura la intencion.
- **No reemplaza al debate.** Si la sesion se realiza, se crea un documento `<debate>` separado y se linkea.

Un tipo, un proposito: **que se supone que va a pasar, cuando y donde.**

---

## Parte 6: Nota sobre compatibilidad con AKN

Este tipo **rompe el estandar oficial de Akoma Ntoso**. AKN v1.0 (OASIS LegalDocML) define 12 tipos de documentos: `act`, `bill`, `debate`, `amendment`, `judgment`, `doc`, `documentCollection`, `officialGazette`, y otros. `citation` no es uno de ellos.

Somos conscientes de esto. La decision fue tomada despues de evaluar las alternativas (usar `doc` con convenciones, usar `doc` con extensiones) y concluir que ninguna resolvia el problema fundamental: las citaciones necesitan una estructura semantica propia para ser queryables.

AKN nunca fue adoptado correctamente por ningun parlamento del mundo. El formato tiene un potencial enorme, pero tiene gaps que explican en parte por que no fue adoptado. Nosotros preferimos hacer algo que funcione bien y luego ver como acercarnos al estandar, en vez de limitarnos a un estandar que nadie usa y que no cubre lo que necesitamos.

Si algun dia AKN evoluciona para incluir un tipo similar, migrar seria directo: la estructura de `<citation>` fue diseñada para ser consistente con el resto del formato.

---

## Referencias

### Especificaciones y estandares
- [Akoma Ntoso v1.0 - XML Vocabulary (OASIS)](https://docs.oasis-open.org/legaldocml/akn-core/v1.0/akn-core-v1.0-part1-vocabulary.html)
- [Akoma Ntoso Overview (UN)](https://unsceb-hlcm.github.io/part1/index-13.html)
- [RFC 5545 - iCalendar Specification](https://www.rfc-editor.org/rfc/rfc5545)
- [RFC 4791 - CalDAV Specification](http://webdav.org/specs/rfc4791.html)
- [iCalendar VEVENT Component](https://icalendar.org/iCalendar-RFC-5545/3-6-1-event-component.html)

### Parlamentos investigados
- [UK Parliament Order Paper API](https://services.orderpaper.parliament.uk/)
- [UK Order Paper - Guide to Procedure](https://guidetoprocedure.parliament.uk/collections/Z2ohs868)
- [Italian Senate AKN Bulk Data (GitHub)](https://github.com/SenatoDellaRepubblica/AkomaNtosoBulkData)
- [EU Parliament Open Data Portal](https://data.europarl.europa.eu/en/home)
- [EU Parliament Plenary Agendas](https://www.europarl.europa.eu/plenary/en/agendas.html)
- [France - L'ordre du jour et la Conference des presidents](https://www.assemblee-nationale.fr/dyn/synthese/fonctionnement-assemblee-nationale/la-fixation-de-l-ordre-du-jour-et-la-conference-des-presidents)
- [Spain - Junta de Portavoces](https://www.congreso.es/es/junta-de-portavoces)
- [Germany - Bundestag Plenary Agenda](https://www.bundestag.de/en/parliament/plenary/neuerordner)
- [Germany - Bundestag Parliamentary Documentation (DIP API)](https://www.bundestag.de/en/documents/parliamentary_documentation)
- [US Congress - Calendars and Scheduling](https://www.congress.gov/legislative-process/calendars-and-scheduling)
- [US Senate Floor Process (CRS Report)](https://crsreports.congress.gov/product/pdf/RL/96-548)
- [Argentina - Plan de Labor y Orden del Dia](https://www2.hcdn.gob.ar/secparl/dgral_info_parlamentaria/dip/glosario/P/plan_labor.html)
- [Mexico - Reglamento Camara de Diputados](https://www.ordenjuridico.gob.mx/Documentos/Federal/html/wo88327.html)
- [Chile - Citaciones Senado](https://www.senado.cl/actividad-legislativa/comisiones/citaciones)
- [Chile - Tabla Semanal Senado](https://www.senado.cl/actividad-legislativa/sala-de-sesiones/tabla-semanal)
- [Paraguay - Datos Abiertos Legislativos](https://datos.congreso.gov.py/)
