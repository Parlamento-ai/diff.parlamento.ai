# Documentos comparativos legislativos: estado del arte internacional

Los "comparados" o documentos de comparación legislativa existen en prácticamente todos los parlamentos occidentales, aunque con nombres muy diversos y niveles de sofisticación tecnológica muy dispares. **El Reino Unido lidera en apertura de datos, Estados Unidos tiene la herramienta de comparación más avanzada (pero interna), y Brasil es el referente latinoamericano** con su portal LexML. Ningún parlamento ofrece hoy una herramienta pública interactiva tipo "diff" para comparar versiones de proyectos de ley—un vacío que representa una oportunidad clara para innovadores como parlamento.ai.

---

## Qué son los "comparados" y cómo se llaman en cada jurisdicción

Los documentos de comparación legislativa cumplen una función universal: mostrar cómo evoluciona un proyecto de ley a medida que atraviesa comisiones y cámaras. En esencia, presentan el texto original junto al texto modificado, destacando las adiciones, eliminaciones y cambios. Aunque todos los parlamentos producen alguna forma de estos documentos, la terminología varía considerablemente:

- **Español**: "texto comparado", "cuadro comparativo" (Chile, Argentina), "cuadro de tres columnas" (México)
- **Inglés**: "comparative prints", "redlines" (EE.UU.), "Keeling schedules", "as amended versions" (Reino Unido)
- **Alemán**: "Synopse", "Textgegenüberstellung"
- **Francés**: "tableau comparatif", "texte comparé"
- **Portugués**: "quadro comparativo" (Brasil)
- **EU**: "consolidated text", "texte consolidé"

El formato típico es una **tabla de dos a tres columnas**: texto vigente, texto propuesto, y a veces justificación o texto de la cámara revisora. En México este formato está formalizado como requisito para los dictámenes de comisión. En España, el documento clave es el "informe de ponencia", que integra las enmiendas aprobadas como base para el debate en comisión.

---

## Panorama por país: cómo publican los comparados hoy

### Chile: PDFs y modernización en curso

El Congreso Nacional chileno publica textos comparados principalmente como **PDFs** a través del Sistema de Información Legislativa (SIL) y los informes de comisión del Senado y la Cámara. La Biblioteca del Congreso Nacional (BCN) produce extensos "cuadros comparados" como parte de sus asesorías parlamentarias—más de **7.200 documentos** disponibles en su portal.

Un proyecto de modernización está en marcha bajo el 5° Plan de Gobierno Abierto, con el objetivo de mejorar la interoperabilidad del SIL y ofrecer "trazabilidad legislativa completa". Sin embargo, actualmente **no existe un documento único** que muestre la evolución completa desde el proyecto original hasta la ley promulgada, y los comparados se producen de manera ad hoc más que sistemática.

### España: proceso formalizado pero documentos dispersos

El sistema español tiene una estructura procedimental clara. El documento central es el **"informe de ponencia"**, que presenta el texto con las enmiendas aprobadas según el artículo 127 del Reglamento del Congreso. La secuencia (ponencia → informe → dictamen de comisión → texto del Pleno) está bien definida, pero los textos comparativos están **embebidos en el flujo procedimental** más que publicados como documentos independientes.

El formato principal es **PDF**, publicado en el Boletín Oficial de las Cortes Generales (BOCG). Cuando el Senado modifica un texto, se envía un "mensaje motivado" al Congreso con los cambios comparativos. No existe API pública ni formato XML estándar para estos documentos.

### Estados Unidos: la herramienta más avanzada es solo interna

Congress.gov ofrece **múltiples versiones de cada proyecto** (Introduced, Engrossed, Enrolled) en formatos PDF, TXT y XML, pero sin herramienta pública de comparación. Los usuarios deben descargar versiones y compararlas manualmente.

La verdadera innovación está en el **Comparative Print Suite**, una herramienta interna lanzada en octubre de 2022 por la Office of the Clerk en colaboración con Xcential. Permite tres tipos de comparación: entre versiones de un proyecto, entre ley vigente y cambios propuestos, y entre un proyecto y sus enmiendas. Muestra diferencias con **colores y formato** (tachados, subrayados), genera PDF descargable e interfaz interactiva. El problema: está disponible solo en compare.house.gov detrás del firewall del Congreso—**el público no tiene acceso**.

El estándar **USLM (United States Legislative Markup)**, derivado de Akoma Ntoso, está en beta desde 2020 para leyes promulgadas y estatutos. La API de Congress.gov (v3) ofrece datos en JSON/XML con 5.000 solicitudes/hora permitidas.

### Reino Unido: el modelo dorado de apertura de datos

El Reino Unido tiene el ecosistema más maduro para datos legislativos abiertos. **legislation.gov.uk**, gestionado por The National Archives, ofrece:

- Legislación "point-in-time" (versiones históricas en cualquier fecha)
- Timeline visual mostrando todas las versiones de una ley
- Vista de "changes to legislation" (qué ley modificó qué)
- Múltiples formatos: **CLML XML, Akoma Ntoso, RDF/XML, HTML5, PDF**
- API RESTful completa (agregar `/data.xml`, `/data.akn` a cualquier URL)
- SPARQL endpoint para consultas de Linked Data

Los **Keeling Schedules** son documentos oficiales que muestran cómo un proyecto modificaría leyes existentes, con cambios tipo "track changes" (inserciones/eliminaciones marcadas). El sistema **Lawmaker**, usado internamente por los redactores, permite comparar documentos y aplicar enmiendas automáticamente con marcado azul/rojo.

Para proyectos en trámite, **bills.parliament.uk** publica amendment papers, marshalled lists, y versiones "as amended" después de cada etapa. Está disponible en **PDF y XML descargable**.

### Alemania: Synopsen bien establecidas pero no obligatorias

El Bundestag utiliza **Synopsen** (sinopsis comparativas) como tablas de dos columnas: texto original del proyecto a la izquierda, texto modificado por comisión a la derecha. Los cambios se **resaltan en negrita**, las eliminaciones en *cursiva*. El software **eNorm** asiste en la creación de estos documentos.

Importante: las Synopsen **no son obligatorias por ley**. Propuestas para hacerlas obligatorias (Die Linke, 2021) no prosperaron. Los ministerios pueden ser requeridos a producirlas bajo §53(2) del GGO.

El sistema **DIP (Dokumentations- und Informationssystem)** ofrece API completa en JSON/XML, con todos los documentos parlamentarios desde 1949 disponibles. El portal bundestag.de/opendata es uno de los más completos en acceso histórico.

### Francia: tableaux comparatifs en informes de comisión

La Assemblée Nationale incluye **tableaux comparatifs** como sección estándar de los informes legislativos de comisión. El formato típico tiene múltiples columnas: ley vigente, texto original del proyecto, texto del Senado (si aplica), y propuestas de la comisión.

El portal **data.assemblee-nationale.fr** ofrece datos abiertos bajo Licence Ouverte: enmiendas con autor, contenido, resultado; votos individuales; debates completos; dossiers legislativos. Formatos disponibles: **XML, JSON, CSV**. El ecosistema de civic tech es activo: NosDéputés.fr y ParlAPI.fr ofrecen APIs simplificadas.

### Unión Europea: infraestructura semántica sofisticada

EUR-Lex no produce "comparados" tradicionales, sino **textos consolidados** que integran el acto base con todas sus modificaciones. El sistema ofrece:

- **Timeline de versiones** (desde marzo 2022) mostrando puntos de modificación
- **Grafo de relaciones** entre acto y documentos relacionados
- Tags indicando origen: B (acto base), M (modificación), R (corrección)
- Identificadores **ELI (European Legislation Identifier)** para URIs persistentes

El repositorio **CELLAR** es la base de datos semántica que alimenta EUR-Lex, con SPARQL endpoint y ontología CDM. El nuevo **EU Law Tracker** (abril 2024), iniciativa conjunta del Parlamento, Consejo y Comisión, permite seguir el procedimiento legislativo ordinario desde propuesta hasta adopción.

El **Legislative Observatory (OEIL)** rastrea procedimientos legislativos con archivos desde julio 1994, actualizaciones diarias, y documentación completa de cada etapa.

### México: el formato más estandarizado de América Latina

México tiene el sistema más formalizado de la región. Los dictámenes deben incluir un **cuadro comparativo de tres columnas**: texto vigente, texto propuesto, justificación. Cada sección/artículo ocupa su propia fila.

La **Gaceta Parlamentaria** es el órgano oficial de publicación (gaceta.diputados.gob.mx). Formato principal: **PDF y HTML**. El CEFP (Centro de Estudios de las Finanzas Públicas) publica comparativos especializados. No hay API pública robusta ni formatos XML estándar.

### Argentina: el sistema menos formalizado

Argentina usa el término "cuadro comparativo" pero **sin formato estandarizado**. Los despachos de comisión pueden incluirlos, pero no es sistemático. Los análisis comparativos frecuentemente son producidos por organizaciones externas (universidades, ONGs) más que por el Congreso oficialmente.

El **Trámite Parlamentario** diario contiene textos de proyectos, pero la trazabilidad de cambios requiere navegar múltiples documentos. Infoleg (infoleg.gob.ar) es la base de datos legal oficial, pero sin funciones de comparación.

### Brasil: el líder latinoamericano

Brasil destaca con **LexML** (lexml.gov.br), un portal nacional lanzado en 2009 que indexa **más de 1.5 millones de documentos** de todos los niveles (federal, estadual, municipal) y poderes (Ejecutivo, Legislativo, Judicial).

El estándar técnico **LexML-BR** deriva de Akoma Ntoso e incluye:
- Schema XML específico para Brasil
- Identificadores URN LEX para referencias persistentes
- Protocolo OAI-PMH para intercambio de metadatos
- Servicio de resolución (URN a documento)
- Servicio de linking automático de citas

La **Câmara dos Deputados** ofrece API REST en dadosabertos.camara.leg.br (JSON, XML, CSV). El Senado tiene su propia API con documentación Swagger. El portal de la Constitución Federal muestra timeline de las 52+ enmiendas con navegación bidireccional.

---

## Estado del arte en formatos abiertos y estándares

### Estándares XML relevantes (referencia)

| Estándar | Descripción | Principales adoptantes |
|----------|-------------|------------------------|
| **Akoma Ntoso / LegalDocML** | Estándar OASIS (2018), vocabulario XML internacional | UK, Italia, ONU, Alemania (LegalDocML.de) |
| **USLM** | Derivado de Akoma Ntoso para EE.UU. | Congress.gov, GPO |
| **CEN MetaLex** | Estándar europeo de interoperabilidad | Países Bajos, UK (RDF) |
| **LexML-BR** | Derivado brasileño de Akoma Ntoso | Portal LexML Brasil |
| **ELI** | Identificador europeo de legislación | EUR-Lex, estados miembros UE |
| **CLML** | Formato propietario UK | legislation.gov.uk |

### Parlamentos con APIs y datos abiertos

**Nivel avanzado** (APIs robustas, múltiples formatos):
- UK legislation.gov.uk — API REST, SPARQL, Akoma Ntoso, RDF
- US Congress/GPO — API JSON/XML, bulk data, USLM
- EUR-Lex/CELLAR — SPARQL, REST, datos masivos
- Brasil Câmara/Senado — APIs REST, LexML

**Nivel intermedio** (datos abiertos pero APIs limitadas):
- Alemania Bundestag — DIP API
- Francia Assemblée — datasets XML/JSON
- UK Parliament — bills API, data.parliament.uk

**Nivel básico** (principalmente PDF):
- España, Chile, México, Argentina

### Herramientas interactivas de comparación

El hallazgo más significativo: **ningún parlamento ofrece una herramienta pública interactiva tipo "diff"** para comparar versiones de proyectos de ley. El vacío incluye:

- US Comparative Print Suite es la más avanzada, pero solo interna
- UK legislation.gov.uk muestra versiones históricas, pero sin diff visual
- EUR-Lex tiene timeline y grafos, pero no comparación línea a línea
- Brasil LexML tiene navegación de versiones constitucionales, pero no diff

Las únicas herramientas de comparación interactiva disponibles son **comerciales/propietarias**: LegiScan, CQ (Congressional Quarterly), State Net (LexisNexis), FastDemocracy, BillTrack50. Estas operan principalmente en EE.UU. y cobran suscripciones significativas.

---

## Modelos a seguir y oportunidades

### Líderes por categoría

| Capacidad | Líder | Por qué |
|-----------|-------|---------|
| **Apertura de datos** | UK legislation.gov.uk | API-first, múltiples formatos, point-in-time |
| **Herramienta de comparación** | US Comparative Print Suite | Diff visual, tres tipos de comparación (pero interna) |
| **América Latina** | Brasil LexML | Schema Akoma Ntoso, 1.5M documentos, APIs |
| **Estándar XML** | Akoma Ntoso | Consenso internacional, mayor adopción |
| **Datos semánticos** | EUR-Lex CELLAR | SPARQL, ontología CDM, ELI |

### El vacío de mercado

La investigación revela una **oportunidad clara**: no existe en ningún parlamento occidental una herramienta pública, gratuita e interactiva que permita a ciudadanos comparar visualmente versiones de proyectos de ley con cambios destacados. El modelo del US Comparative Print Suite demuestra que es técnicamente factible; simplemente no se ha hecho público.

Para Chile y América Latina específicamente:
- Brasil es el único país de la región con infraestructura XML robusta
- México tiene el formato de cuadros comparativos más estandarizado
- Chile está en proceso de modernización del SIL con objetivos de trazabilidad
- El Hub Latinoamericano (apoyado por UIP) busca compartir software y prácticas

## Conclusión

El estado del arte internacional confirma que los "comparados" son universales en concepto pero fragmentados en implementación. **UK legislation.gov.uk representa el estándar dorado** en apertura de datos legislativos, mientras que el **US Comparative Print Suite** demuestra la tecnología de comparación más avanzada—aunque restringida a uso interno. **Brasil LexML** es el modelo regional relevante para América Latina. 

El vacío más significativo—y la mayor oportunidad—es la ausencia de herramientas públicas interactivas de comparación tipo diff. Una startup como parlamento.ai, trabajando con datos del SIL chileno y aplicando principios de legislación.gov.uk más funcionalidad de comparación visual, podría crear algo que no existe hoy en ningún parlamento del mundo en formato público.