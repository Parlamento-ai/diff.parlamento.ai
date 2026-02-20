# AKN4EU 4.2: El estandar de EU basado en Akoma Ntoso

**Fecha:** 19/02/2026
**Fuente:** AKN4EU 4.2 specification (155 + 133 paginas), publicada 11/10/2024

---

## 1. Que es AKN4EU

AKN4EU es un **profile (sub-schema)** de Akoma Ntoso (OASIS LegalDocML, AKN 3.0) adaptado para las instituciones de la Union Europea. No es un estandar nuevo: es AKN 3.0 con restricciones adicionales, convenciones de nombrado y extensiones especificas para el contexto legislativo europeo.

- **Desarrollado por:** IMFC (Interinstitutional Metadata and Formats Committee)
- **Version actual:** 4.2, publicada el 11/10/2024
- **Companion document:** CoV (Compendium of Validations) 4.2, junio 2024
- **Namespace propio:** `xmlns:akn4eu="http://imfc.europa.eu/akn4eu"`
- **Scope:** Ordinary Legislative Procedure (OLP), actos del Consejo, y Propuestas legislativas

AKN4EU define como codificar en XML los documentos legislativos de la EU que se publican en el Official Journal, mas las propuestas que los originan. Opera dentro del esquema AKN 3.0 sin romper compatibilidad: cualquier parser AKN 3.0 puede leer un documento AKN4EU, y las extensiones EU van en su propio namespace.

---

## 2. Que cubre (document types)

La especificacion Part 2 define los tipos de documento soportados, organizados en cinco partes:

### PART 2.1 -- EU Acts (publicados en el OJ)

Documentos legislativos finales publicados en el Official Journal. Todos usan `<act>`:

| Elemento XML | `@name` | Tipo |
|---|---|---|
| `<act name="REG">` | `REG` | Regulation |
| `<act name="DIR">` | `DIR` | Directive |
| `<act name="DEC">` | `DEC` | Decision |
| `<act name="DEC_IMPL">` | `DEC_IMPL` | Implementing Decision |
| `<bill>` | (varios) | Draft versions durante el proceso legislativo |

### PART 2.2 -- International Agreements

Acuerdos internacionales celebrados por la EU con terceros paises u organizaciones internacionales.

### PART 2.3 -- Proposals for an Act

Propuestas legislativas (tipicamente de la Comision). Todos usan `<bill>`:

| Elemento XML | `@name` | Tipo |
|---|---|---|
| `<bill name="REG">` | `REG` | Proposal for a Regulation |
| `<bill name="DIR">` | `DIR` | Proposal for a Directive |
| `<bill name="DEC">` | `DEC` | Proposal for a Decision |
| `<bill name="DEC_IMPL">` | `DEC_IMPL` | Proposal for Implementing Decision |

Una propuesta es un paquete compuesto por multiples componentes:
- **Explanatory Memorandum:** `<doc name="EXPL_MEMORANDUM">`
- **Financial Statement:** informacion presupuestaria
- **Legal Text:** el texto legal propiamente dicho (como `<bill>`)

### PART 2.4 -- Corrigenda

Correcciones a actos ya publicados en el OJ.

### PART 2.5 -- Council Internal Documents

Documentos internos del Consejo: `<doc name="INTERNAL_DOC_CONSIL">`

### Regla clave

- **`<act>`** = version final publicada
- **`<bill>`** = cualquier borrador durante el procedimiento legislativo

---

## 3. Estructura XML real (de los samples)

Estructura observada en las instancias XML oficiales descargadas de la publicacion AKN4EU:

```xml
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0">
  <act name="REG">  <!-- o "DIR", "DEC", "DEC_IMPL" -->
    <meta>
      <identification source="~PUBL">
        <FRBRWork>
          <FRBRcountry value="EU"/>
          <FRBRnumber value="eli/reg/2017/2395"/>  <!-- ELI identifier -->
          <FRBRprescriptive value="true"/>
        </FRBRWork>
        <FRBRManifestation>
          <preservation xmlns:akn4eu="http://imfc.europa.eu/akn4eu">
            <akn4eu:akn4euVersion value="4.2.0.0"/>  <!-- Version marker -->
          </preservation>
        </FRBRManifestation>
      </identification>
      <analysis>
        <activeModifications>  <!-- Referencias cruzadas a actos modificados -->
          <textualMod type="insertion">
            <destination href="http://data.europa.eu/eli/reg/2013/575/art_473"/>
          </textualMod>
        </activeModifications>
      </analysis>
      <references>
        <!-- EU Authority Lists para organizaciones, roles, lugares -->
        <TLCOrganization xml:id="EP" href=".../corporate-body/EP"/>
        <TLCOrganization xml:id="CONSIL" href=".../corporate-body/CONSIL"/>
        <TLCRole xml:id="PRESID" href=".../role/PRESID"/>
        <TLCLocation xml:id="BEL_BRU" href=".../place/BEL_BRU"/>
        <TLCReference xml:id="REG" name="docType" href=".../resource-type/REG"/>
      </references>
    </meta>
    <preface>
      <longTitle>
        <p><docType refersTo="~REG">REGULATION <docNumber>(EU) 2017/2395</docNumber>
          OF THE EUROPEAN PARLIAMENT AND OF THE COUNCIL</docType>
          of <date date="2017-12-12">12 December 2017</date>
          <docPurpose>amending...</docPurpose></p>
      </longTitle>
    </preface>
    <preamble>
      <formula name="actingEntity">...</formula>
      <citations>
        <citation refersTo="~legalBasis">...</citation>
      </citations>
      <recitals>
        <recital><num>(1)</num><p>...</p></recital>
      </recitals>
      <formula name="enactingFormula">HAS ADOPTED THIS REGULATION:</formula>
    </preamble>
    <body>
      <title><num>TITLE I</num><heading>...</heading></title>
      <chapter><num>CHAPTER I</num><heading>...</heading></chapter>
      <article><num>Article 1</num>
        <paragraph><content><p>...</p></content></paragraph>
      </article>
    </body>
    <conclusions>
      <p>Done at <location refersTo="~BEL_BRU">Brussels</location>,
         <date date="2019-12-19">19 December 2019</date>.</p>
      <block name="signatory">
        <signature>
          <organization refersTo="~CONSIL">For the Council</organization>
          <role refersTo="~PRESID">The President</role>
          <person>K. MIKKONEN</person>
        </signature>
      </block>
    </conclusions>
  </act>
</akomaNtoso>
```

### Anatomia de un documento AKN4EU

Un `<act>` o `<bill>` tiene siempre estas secciones principales:

1. **`<meta>`** -- Metadatos: identificacion FRBR, analisis de modificaciones, referencias a authority lists
2. **`<preface>`** -- Titulo largo, numero del documento, proposito
3. **`<preamble>`** -- Entidad que actua, bases legales (citations), considerandos (recitals), formula de promulgacion
4. **`<body>`** -- Contenido normativo: titulos, capitulos, articulos, paragrafos
5. **`<conclusions>`** -- Lugar y fecha de firma, firmantes con sus roles e instituciones

---

## 4. Que agrega AKN4EU sobre AKN base

AKN4EU no reemplaza AKN 3.0 sino que lo especializa. Las adiciones concretas:

### 4.1 Namespace propio

```xml
xmlns:akn4eu="http://imfc.europa.eu/akn4eu"
```

Con el elemento `akn4eu:akn4euVersion` dentro de `<preservation>` para marcar la version del profile usado.

### 4.2 ELI URIs

European Legislation Identifier como valor de `FRBRnumber`. Ejemplo: `eli/reg/2017/2395`. Esto conecta cada documento con el sistema de identificacion persistente de legislacion europea.

### 4.3 EU Authority Lists

Todas las referencias a organizaciones, roles y lugares deben apuntar a las EU Authority Lists oficiales:
- Organizaciones: `corporate-body/EP`, `corporate-body/CONSIL`, `corporate-body/COM`
- Roles: `role/PRESID`, `role/AUTHOR`
- Lugares: `place/BEL_BRU`, `place/LUX`
- Tipos de documento: `resource-type/REG`, `resource-type/DIR`

### 4.4 Packaging (.leg)

Los documentos se empaquetan en archivos ZIP con extension `.leg`, conteniendo multiples archivos XML (documento principal + anexos + recursos como imagenes o formulas).

### 4.5 Naming convention estricta

Convencion rigida para nombres de archivos dentro del paquete `.leg`.

### 4.6 Atributo `@name` con codigos NAL

El atributo `@name` de `<act>` y `<bill>` debe usar los codigos de EU Resource Type NAL: `REG`, `DIR`, `DEC`, `DEC_IMPL`, etc.

### 4.7 Elemento `<preservation>`

Dentro de `<FRBRManifestation>`, el elemento `<preservation>` contiene la version de AKN4EU usada. Permite a los procesadores saber que profile aplicar.

### 4.8 `activeModifications` para enmiendas cruzadas

Tracking estructurado de que articulos de otros actos modifica el documento actual, via `<textualMod>` con `@type` (insertion, substitution, repeal) y `<destination>` apuntando al ELI del acto modificado.

---

## 5. Que NO cubre AKN4EU

AKN4EU tiene un scope deliberadamente limitado a documentos legislativos. Lo que **no** incluye:

| Aspecto | Cubierto? | Notas |
|---|---|---|
| Texto de actos legislativos finales | Si | `<act>` |
| Propuestas legislativas | Si | `<bill>` |
| ChangeSets computables (diffs entre versiones) | **No** | No hay forma de representar un diff maquina-legible |
| Votaciones (quien voto que) | **No** | Ningun elemento para roll-calls o resultados de votacion |
| Agendas / ordenes del dia | **No** | No hay tipo de documento para agendas |
| Preguntas parlamentarias escritas | **No** | Fuera de scope |
| Oficios / comunicaciones inter-institucionales | **No** | Fuera de scope |
| Debates / transcripciones (actas plenarias) | **No** | Fuera de scope |
| Enmiendas como documentos separados | **No** | Solo `activeModifications` dentro de un acto |

En resumen: AKN4EU cubre los **productos finales** del proceso legislativo y sus propuestas, pero no el **proceso** en si (quien propuso que, como se voto, que se debatio).

---

## 6. AKN4EU vs AKN Diff

AKN4EU y AKN Diff son **complementarios**, no competidores:

| | AKN4EU | AKN Diff |
|---|---|---|
| **Proposito** | Como marcar un documento EU en XML (el formato contenedor) | Que cambio entre versiones, quien voto, el proceso legislativo |
| **Scope** | Documento individual | Relaciones entre documentos y eventos |
| **Namespace** | `http://imfc.europa.eu/akn4eu` | Namespace separado (extension) |
| **Compatibilidad** | AKN 3.0 profile | Extension sobre AKN 3.0 |

### Relacion practica

- AKN4EU **podria ser la base** para representar documentos EU en parlamento.ai
- AKN Diff extensions **irian encima** para agregar la capa de proceso (diffs, votaciones, trazabilidad)
- Son **100% compatibles**: usan namespaces separados y pueden coexistir en el mismo documento
- Un documento puede ser AKN4EU-compliant Y tener extensiones AKN Diff al mismo tiempo

---

## 7. Los 16 samples oficiales

La publicacion AKN4EU 4.2 incluye 16 instancias XML de ejemplo (15 numeradas, una con 2 sub-instancias). Todos cubren tipos REG/DIR/DEC:

| # | ID del Sample | Tipo de Documento |
|---|---|---|
| 1 | COV_DLV19_1.04 | Figura con leyenda |
| 2 | COV_DLV19_1.19 | Formula matematica (Regulation) |
| 3 | CoV_DLV20_1.34 | Council Regulation (con tablas) |
| 4 | COV_DLV20_1.34_1 | Tabla compleja |
| 5 | CoV_DLV20_1.35 | Council Directive |
| 6 | CoV_DLV20_1.36 | Council Decision |
| 7 | CoV_DLV20_1.38 | Council internal document con draft decision |
| 8 | CoV_DLV21_1.01 | Proposal for Council Decision (2 instancias) |
| 9 | CoV_DLV21_1.02 | Proposal for Council Decision (con anexo) |
| 10 | CoV_DLV21_1.03 | Proposal for Council Directive |
| 11 | COV_DLV21_1.06 | Council Decision (con anexo) |
| 12 | COV_DLV21_1.07 | Council internal document con fragmento |
| 13 | CoV_DLV23_1.01 | Proposal for Council implementing decision |
| 14 | COV_DLV23_1.04 | Joint Proposal for Council Regulation |
| 15 | COV_DLV23_1.09 | Council implementing decision |

### Observaciones sobre los samples

- **Todos** son de tipo REG, DIR o DEC. No hay ningun sample de debate, enmienda como documento separado, o votacion.
- Los samples ilustran features especificos: tablas complejas, formulas matematicas, figuras, anexos, documentos internos del Consejo.
- Las propuestas (PART 2.3) incluyen tanto el texto legal como documentos acompanantes empaquetados.
- Los nombres de sample usan el patron `CoV_DLV{version}_{numero}`, donde DLV = deliverable y el numero corresponde al requisito del CoV que validan.

---

## 8. Relacion con nuestros PoCs

AKN4EU define el formato para `act` y `bill` — los tipos que ya cubrimos con nuestros converters Formex->AKN y XHTML->AKN. Los otros tipos que necesitamos (question, citation, vote, communication, amendment, changeSet) **no estan cubiertos por AKN4EU** — usamos AKN 3.0 base para esos, lo cual es 100% compatible.

En la practica: un documento AKN4EU-compliant puede coexistir con nuestras extensiones AKN Diff porque usan namespaces separados.
