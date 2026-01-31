# Sistema de comparados legislativos de la Unión Europea: guía técnica completa

El seguimiento legislativo en la UE se apoya en un ecosistema fragmentado pero robusto de textos consolidados, portales y APIs. **Los textos consolidados son documentos informativos sin valor jurídico** que combinan un acto base con todas sus modificaciones posteriores —una distinción crítica para cualquier herramienta de seguimiento. El acceso programático es viable hoy principalmente a través del **endpoint SPARQL de CELLAR** (https://publications.europa.eu/webapi/rdf/sparql), aunque no existe una API REST moderna unificada. Este informe documenta exhaustivamente el estado actual del arte para el desarrollo de parlamento.ai.

---

## 1. Terminología oficial: consolidación, codificación y refundición

### Textos consolidados (Consolidated texts / Textes consolidés)

La terminología oficial distingue tres conceptos fundamentales que frecuentemente se confunden:

| Concepto | Definición | Valor jurídico | Proceso |
|----------|------------|----------------|---------|
| **Consolidación** | Combinación de un acto base con sus modificaciones en un único documento legible | **NO** - puramente informativo | Administrativo (Oficina de Publicaciones) |
| **Codificación** | Nuevo acto jurídicamente vinculante que reúne un acto y sus modificaciones sin cambios sustantivos | **SÍ** - reemplaza actos anteriores | Procedimiento legislativo acelerado |
| **Refundición (Recast)** | Codificación que además introduce cambios sustantivos | **SÍ** - nuevo acto legal | Procedimiento legislativo completo |

El disclaimer oficial de EUR-Lex es inequívoco: *"This text is meant purely as a documentation tool and has no legal effect. The Union's institutions do not assume any liability for its contents."*

La **Oficina de Publicaciones de la UE** es responsable de producir los textos consolidados, no las instituciones legislativas. El Servicio Jurídico del Consejo mantiene la consolidación específica de los Tratados Fundacionales.

### Sistema de etiquetas en textos consolidados

Cada texto consolidado incluye marcadores que indican la procedencia de cada fragmento:

- **B** (Basic act): Texto del acto original
- **M** (Modifier): Texto introducido por un acto modificador (M1, M2, M3...)
- **A** (Accession Treaty): Modificaciones por tratados de adhesión
- **C** (Corrigendum): Correcciones de erratas

Al inicio de cada texto consolidado aparece la lista completa de todos los actos que lo afectan, permitiendo rastrear el origen de cada modificación.

---

## 2. El procedimiento legislativo ordinario y los documentos de comparación

### Etapas del proceso legislativo

El **Artículo 294 TFUE** establece el procedimiento legislativo ordinario (antes "codecisión"), que representa aproximadamente el **85% de la legislación adoptada** gracias a los trílogos informales:

**Primera lectura:**
1. La Comisión presenta propuesta (documento COM)
2. El Parlamento Europeo examina en comité, nombra ponente (rapporteur), y adopta posición
3. El Consejo puede aceptar la posición del PE (acto adoptado) o modificarla (pasa a segunda lectura)

**Segunda lectura** (3 meses + 1 mes de prórroga):
4. El PE puede aprobar, rechazar o enmendar la posición del Consejo
5. Si enmienda, el Consejo examina de nuevo (3 meses + 1 mes)

**Conciliación** (6 semanas + 2 semanas):
6. Se convoca Comité de Conciliación (igual representación PE/Consejo)
7. Se busca acuerdo en forma de **Texto Conjunto (Joint Text)**
8. Confirmación por ambas instituciones y publicación en el Diario Oficial

### El documento de cuatro columnas: herramienta central de los trílogos

Los **trílogos** son negociaciones informales entre representantes del PE, Consejo y Comisión que ocurren en cualquier etapa del procedimiento. Su herramienta principal es el **four-column document**:

| Columna 1 | Columna 2 | Columna 3 | Columna 4 |
|-----------|-----------|-----------|-----------|
| Posición de la Comisión | Posición del Parlamento | Posición del Consejo | Texto de compromiso |

Las columnas 1 y 2 son públicas; las columnas 3 y 4 frecuentemente permanecen confidenciales durante las negociaciones. El caso **De Capitani v European Parliament (T-540/15)** estableció que estos documentos constituyen documentos legislativos y requieren mayor transparencia, aunque en la práctica el acceso sigue siendo limitado.

### Brechas identificadas para parlamento.ai

No existe un sistema oficial de "tracking changes" visual o diferencial entre versiones. Los documentos de cuatro columnas no tienen API pública. El Legislative Observatory del PE ofrece seguimiento pero sin acceso programático directo.

---

## 3. EUR-Lex y el sistema de textos consolidados

### Arquitectura del sistema de consolidación

EUR-Lex (https://eur-lex.europa.eu) utiliza **CELLAR** como base de datos subyacente desde 2014. La consolidación sigue estrictamente las instrucciones del acto modificador sin alterar contenido. La fecha en el encabezado indica cuándo la última modificación incluida se volvió aplicable.

### Estructura del número CELEX

El identificador CELEX es la clave única de cada documento, independiente del idioma:

```
[SECTOR][AÑO][TIPO_DOC][NÚMERO]
```

**Sectores relevantes:**
- **0**: Textos consolidados
- **3**: Legislación (Directivas, Reglamentos, Decisiones)
- **5**: Documentos preparatorios

**Ejemplos concretos:**
- Acto base GDPR: `32016R0679`
- Texto consolidado GDPR: `02016R0679-20160504` (sector 0 + fecha de aplicación)

### Timeline de versiones (desde marzo 2022)

EUR-Lex incorporó una **timeline gráfica** que muestra los puntos temporales en que el acto fue modificado. Los "pins" representan versiones consolidadas o el acto inicial. La opción "Show all versions" en el menú lateral permite navegar cronológicamente. Los metadatos incluyen fechas de aplicación, lista de modificadores, estado de vigencia (en vigor/derogado), referencias al Diario Oficial, y descriptores EuroVoc.

### Grafo de relaciones entre documentos

El feature experimental "Show relationship graph" visualiza:
- Nodo central: acto principal
- Nodos circundantes: documentos relacionados (mismo color por tipo)
- Tipos de relación: amendments, delegated acts, consolidated versions, implementing acts, repeals, based on

El **deep linking** muestra enlaces a otros actos referidos dentro del texto, aunque actualmente solo funciona para documentos menores de 900 KB.

### URLs y formatos de descarga

**Estructura de URL:**
```
https://eur-lex.europa.eu/legal-content/[IDIOMA]/TXT/?uri=CELEX:[CELEX_NUMBER]
```

**Formatos disponibles:**
- HTML: `/TXT/HTML/?uri=CELEX:...`
- PDF: `/TXT/PDF/?uri=CELEX:...`
- XML (Formex): Vía Cellar API
- RDF: Vía SPARQL endpoint

---

## 4. CELLAR: el repositorio semántico central

### Arquitectura técnica verificada

**CELLAR** es el repositorio central de datos semánticos de la Oficina de Publicaciones, operativo desde aproximadamente 2012-2013 (versión actual: Cellar 8.14.0).

| Componente | Tecnología |
|------------|------------|
| Triplestore | OpenLink Virtuoso 7 (upgrade a Virtuoso 8 planificado marzo 2026) |
| Repositorio de objetos | Fedora Digital Objects Repository |
| Base de datos adicional | Oracle |
| Modelo semántico | RDF/OWL basado en FRBR |

El sistema almacena **decenas de millones de publicaciones**, más de **200 tipos diferentes de documentos**, y sirve a **76 instituciones, organismos y agencias de la UE**.

### Ontología CDM (Common Data Model)

El CDM (versión actual 4.15.0) es la descripción formal de documentos oficiales de la UE. Está publicado en OWL y es descargable:

- **URI ontología**: http://publications.europa.eu/ontology/cdm
- **Documentación**: https://op.europa.eu/en/web/eu-vocabularies/cdm

**Estadísticas del modelo:**
- ~250 subclases de WORK (tipos de documentos)
- ~1000 object properties (relaciones)
- ~900 data properties

El CDM implementa el modelo **WEMI de FRBR**:
```
WORK (concepto abstracto, ej: una directiva)
  └── EXPRESSION (realización en un idioma)
       └── MANIFESTATION (formato específico: PDF, HTML)
            └── ITEM (archivo físico)
```

### SPARQL Endpoint público

**URL del endpoint**: https://publications.europa.eu/webapi/rdf/sparql

**Query builder visual**: https://op.europa.eu/en/advanced-sparql-query-editor

**Características:**
- Sin autenticación requerida
- Resultados limitados a ~1 millón de filas por consulta
- Formatos de respuesta: JSON, XML, CSV, TSV, RDF/XML, Turtle
- Timeout en queries muy complejas; usar paginación con LIMIT/OFFSET

**Query ejemplo para obtener todas las Directivas:**
```sparql
PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>

SELECT DISTINCT ?work ?celex ?date ?inForce
WHERE {
  ?work cdm:work_has_resource-type 
    <http://publications.europa.eu/resource/authority/resource-type/DIR> .
  OPTIONAL { ?work cdm:resource_legal_id_celex ?celex . }
  OPTIONAL { ?work cdm:work_date_document ?date . }
  OPTIONAL { ?work cdm:resource_legal_in-force ?inForce . }
}
LIMIT 100
```

---

## 5. EU Law Tracker: nueva herramienta interinstitucional

### Estado actual verificado (enero 2026)

**EU Law Tracker** (https://law-tracker.europa.eu/) fue lanzado el **30 de abril de 2024** como proyecto conjunto del Parlamento Europeo, Consejo y Comisión. Está **operativo pero con funcionalidad limitada**.

### Funcionalidades confirmadas

| Funcionalidad | Estado |
|---------------|--------|
| Seguimiento de propuestas legislativas | ✅ Sí (solo COD) |
| Información integrada de 3 instituciones | ✅ Sí |
| Acceso a documentos relacionados | ✅ Sí |
| Timeline visual del progreso | ✅ Sí |
| API/Acceso programático | ❌ No documentado |
| Múltiples idiomas | ❌ Solo inglés |
| Procedimientos especiales (CNS, APP) | ❌ No |
| Archivos pre-abril 2024 | ❌ No |

### Relación con otros portales

EU Law Tracker **no reemplaza** EUR-Lex ni el Legislative Observatory (OEIL). Es complementario, con la ventaja de integrar datos del Consejo que antes eran más difíciles de obtener de forma consolidada. OEIL sigue siendo necesario para:
- Cobertura histórica desde 1994
- Todos los tipos de procedimientos
- Sistema de alertas funcional
- Disponibilidad en inglés y francés

### Planes futuros anunciados

Se planea cubrir procedimientos legislativos especiales y listar prioridades legislativas de la UE, pero sin fechas específicas publicadas.

---

## 6. Catálogo completo de portales y sistemas

### Tabla comparativa de portales

| Portal | URL | Contenido | API REST | SPARQL | Bulk Data |
|--------|-----|-----------|----------|--------|-----------|
| **EUR-Lex** | eur-lex.europa.eu | Legislación adoptada, consolidados | ✅ Cellar | ✅ | ✅ datadump |
| **OEIL** | oeil.secure.europarl.europa.eu | Procedimientos legislativos | ❌ | ❌ | ❌ |
| **EP Open Data** | data.europarl.europa.eu | MEPs, votaciones, actividad PE | ✅ | ✅ | ✅ |
| **Council Register** | consilium.europa.eu/documents | Documentos del Consejo | ❌ | ❌ | ❌ |
| **data.europa.eu** | data.europa.eu | Datasets abiertos UE | ✅ | ✅ | ✅ |
| **CELLAR** | op.europa.eu/en/web/cellar | Repositorio central | ✅ | ✅ | ✅ |
| **Have Your Say** | have-your-say.ec.europa.eu | Consultas públicas | ❌ | ❌ | ❌ |
| **EU Law Tracker** | law-tracker.europa.eu | Seguimiento legislativo COD | ❌ | ❌ | ❌ |
| **N-Lex** | n-lex.europa.eu | Legislación nacional de EEMM | ❌ | ❌ | ❌ |

### European Parliament Open Data Portal

El portal de datos abiertos del PE (https://data.europarl.europa.eu/) merece atención especial por su **API REST moderna** con documentación Swagger. Ofrece:
- Organización del PE (grupos políticos, delegaciones, comités)
- Datos de MEPs con membresías detalladas
- Calendario de eventos
- Documentos plenarios (agendas, actas, votaciones, debates)
- Preguntas parlamentarias y respuestas

Formatos: JSON-LD, RDF (Turtle, N-Triples), CSV en 24 idiomas.

### Bulk Data disponible

**Data Dump oficial**: https://datadump.publications.europa.eu/
- Requiere EU Login (gratuito)
- Contiene todos los actos legales en vigor (sector CELEX 3)
- Formato XML Formex, organizado por idioma
- Actualización regular

**Dataset académico Harvard Dataverse** (CEPS EurLex Dataset): 142,036 leyes UE (1952-2019) con texto completo en CSV.

---

## 7. Estándares y formatos técnicos

### ELI (European Legislation Identifier)

ELI es el estándar europeo para identificar legislación de forma uniforme, establecido por Conclusiones del Consejo en 2012 y actualizado en 2017 y 2019. Es **voluntario pero ampliamente adoptado**.

**Estructura URI:**
```
http://data.europa.eu/eli/{typeOfDocument}/{yearOfAdoption}/{numberOfDocument}/oj
```

**Ejemplos reales:**
- Decisión 2009/496/EC: `http://data.europa.eu/eli/dec/2009/496/oj`
- Artículo específico: `https://eur-lex.europa.eu/eli/reg/2019/1241/art_2/oj`

**Los 4 pilares de ELI:**
1. Identificación mediante URIs HTTP
2. Metadatos basados en ontología ELI (OWL publicado)
3. Publicación en RDFa o JSON-LD
4. Sincronización de metadatos (sitemaps, Atom feeds)

**Países implementando ELI** (a enero 2023): Austria, Bélgica, Croacia, Dinamarca, España (incluyendo CCAA), Finlandia, Francia, Hungría, Irlanda, Italia, Luxemburgo, Malta, Noruega, Polonia, Portugal, Serbia, Eslovenia, Suiza, Reino Unido, y la Oficina de Publicaciones UE.

**Ontología OWL**: https://op.europa.eu/documents/3938058/11669184/eli.owl/

### Akoma Ntoso y AKN4EU

**Akoma Ntoso** es el estándar internacional XML para representar documentos parlamentarios y legislativos, ratificado como estándar OASIS (LegalDocML) en 2018.

**AKN4EU** es el perfil de aplicación de Akoma Ntoso para la UE, desarrollado por el IMFC desde 2018:
- URL: https://op.europa.eu/en/web/eu-vocabularies/akn4eu
- **Estado: "work in progress"** - NO completamente implementado
- Es el "futuro formato estructurado" para intercambio de documentos legales

**LEOS** (Legislation Editing Open Software) es el editor web de la Comisión que usa Akoma Ntoso como formato nativo, disponible como open source bajo licencia EUPL.

### Formex: el formato XML real de EUR-Lex

**Formex** (Formalized Exchange of Electronic Publications) es el formato XML propietario para intercambio de datos y producción del Diario Oficial:

- Introducido en 1985 (SGML), XML desde 2004 (Formex V4)
- Versión actual: formex-06.02.1-20231031
- **Completamente público y documentado**
- Schema XSD: http://publications.europa.eu/resource/distribution/formex/xsd/schema_formex/
- Manual: https://publications.europa.eu/documents/3938058/5910419/formex_manual_on_screen_version.html/

Define ~260 tags para artículos, recitales, anexos, tablas, fórmulas, y elementos específicos para jurisprudencia.

### Resumen de implementación real

| Componente | Estado |
|------------|--------|
| **ELI** | ✅ Completamente implementado en EUR-Lex |
| **Formex XML** | ✅ Disponible para descarga |
| **SPARQL/LOD** | ✅ Endpoint público funcional |
| **AKN4EU** | ⚠️ En desarrollo, no desplegado |
| **JSON API nativa** | ❌ No disponible |

---

## 8. Realidad versus aspiración: evaluación crítica

### Lo que funciona hoy y está en uso diario

- **SPARQL endpoint de CELLAR**: Completamente funcional, sin autenticación, con documentación adecuada
- **Textos consolidados de EUR-Lex**: Actualizados regularmente, accesibles en múltiples formatos
- **ELI**: Implementado en EUR-Lex con URIs dereferencables
- **Formex XML**: Disponible para descarga masiva y vía API
- **EP Open Data Portal**: API REST moderna con JSON-LD
- **EU Law Tracker**: Operativo para procedimientos ordinarios desde abril 2024
- **Data Dump**: Bulk download funcional (requiere EU Login)

### Lo que está en proceso de implementación

- **AKN4EU**: Desarrollo activo pero no desplegado en producción
- **Virtuoso 8 upgrade**: Planificado para marzo 2026
- **EU Law Tracker para procedimientos especiales**: Anunciado sin fecha
- **LEOS editor**: Disponible pero adopción institucional gradual

### Lo que se anunció pero tiene limitaciones significativas

- **API REST unificada para EUR-Lex**: No existe; solo webservice SOAP que requiere registro y aprobación manual
- **Acceso a documentos de trílogos**: Los four-column documents siguen siendo mayoritariamente confidenciales
- **Tracking visual de cambios**: No hay herramienta oficial de "diff" entre versiones
- **JSON nativo para contenido legislativo**: No disponible directamente

### Brechas críticas para parlamento.ai

1. **Legislative Observatory sin API**: OEIL no ofrece acceso programático directo
2. **Textos consolidados históricos**: Solo versión actual disponible; versiones intermedias requieren reconstrucción manual
3. **Documentos pre-1990**: Frecuentemente solo PDF escaneado sin OCR
4. **Retrasos en consolidación**: Pueden pasar semanas entre modificación y actualización del texto consolidado

---

## 9. Acceso programático: guía técnica para desarrolladores

### Arquitectura recomendada para parlamento.ai

```
┌─────────────────────────────────────────────────────────────┐
│  CAPA DE METADATOS: SPARQL endpoint de CELLAR              │
│  URL: https://publications.europa.eu/webapi/rdf/sparql     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  CAPA DE CONTENIDO: CELLAR REST API                        │
│  Base: https://publications.europa.eu/resource/cellar/     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  ACTUALIZACIONES: RSS/Atom feeds + polling SPARQL          │
└─────────────────────────────────────────────────────────────┘
```

### EUR-Lex Webservice (SOAP)

- **Tipo**: SOAP (NO REST)
- **Requiere**: EU Login + aprobación manual
- **Límite**: Máximo 10,000 resultados por búsqueda (desde enero 2026)
- **Documentación**: https://eur-lex.europa.eu/content/help/data-reuse/webservice.html

### APIs de terceros disponibles

| API | URL | Descripción | Costo |
|-----|-----|-------------|-------|
| **api.epdb.eu** | http://api.epdb.eu/ | EUR-Lex, PreLex, OEIL, votaciones Consejo | Gratuita |
| **HowTheyVote.eu** | https://howtheyvote.eu/ | Votaciones PE | Open Database License |
| **LexAPI** | https://www.lex-api.com/ | REST para EUR-Lex | Desde €4.99/mes |

### Librerías open source existentes

**R (la más madura):**
```r
install.packages("eurlex")
library(eurlex)

query <- elx_make_query("directive", include_date = TRUE)
results <- elx_run_query(query)
text <- elx_fetch_data(url = results$work[1], type = "text")
```

**Python:**
- `eurlex-parser`: Parser de documentos por CELEX ID
- `step21/eurlex`: Genera queries SPARQL
- `scrapelex`: Scraper multilingüe

### Queries SPARQL funcionales

**Obtener todas las versiones de un documento:**
```sparql
PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
PREFIX purl: <http://purl.org/dc/elements/1.1/>

SELECT DISTINCT ?work ?expr ?manif ?langCode ?format ?item
WHERE {
  ?work owl:sameAs <http://publications.europa.eu/resource/celex/32016R0679> .
  ?expr cdm:expression_belongs_to_work ?work ;
        cdm:expression_uses_language ?lang .
  ?lang purl:identifier ?langCode .
  ?manif cdm:manifestation_manifests_expression ?expr;
         cdm:manifestation_type ?format.
  ?item cdm:item_belongs_to_manifestation ?manif.
} LIMIT 1000
```

**Actos en vigor que entraron en 2024:**
```sparql
PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

SELECT ?act ?date_entry_into_force ?celex
WHERE {
  ?act cdm:resource_legal_in-force "true"^^xsd:boolean .
  ?act cdm:resource_legal_date_entry-into-force ?date_entry_into_force .
  ?act cdm:resource_legal_id_celex ?celex .
  FILTER(?date_entry_into_force >= "2024-01-01"^^xsd:date 
         && ?date_entry_into_force < "2025-01-01"^^xsd:date)
}
ORDER BY ?date_entry_into_force
```

### Limitaciones reales documentadas

| Limitación | Detalle |
|------------|---------|
| **Textos completos en SPARQL** | NO disponibles; solo metadatos. Usar URIs para descargar vía REST |
| **Rate limiting implícito** | Queries muy complejas dan timeout |
| **Legislative Observatory** | Sin API; requiere scraping o api.epdb.eu |
| **Votaciones Consejo** | Solo desde 2006 |
| **Documentos de trílogos** | No públicos por naturaleza |

---

## 10. Ecosistema de civic tech y transparencia legislativa

### Proyectos activos verificados (enero 2026)

**Parltrack** (https://parltrack.org/) - 🟢 ACTIVO
- Base de datos de transparencia del PE con 23,817 dossiers, 4,595 MEPs históricos, 44,047 votaciones
- Código open source (AGPL v3+), datos JSON bajo ODBLv1.0
- GitHub: https://github.com/parltrack/parltrack

**HowTheyVote.eu** (https://howtheyvote.eu/) - 🟢 ACTIVO
- Visualización de votaciones del PE por MEP, grupo y país
- Datos actualizados semanalmente en CSV
- Financiado por Prototype Fund y MIZ Babelsberg

**AskTheEU.org** (https://www.asktheeu.org/) - 🟢 ACTIVO
- Plataforma para solicitudes de acceso a documentos UE
- Operado por Access Info Europe, basado en Alaveteli

**LobbyFacts** (https://www.lobbyfacts.eu/) - 🟢 ACTIVO
- Datos del Transparency Register presentados de forma usable
- Archivo histórico único desde 2012
- Operado por Corporate Europe Observatory + LobbyControl

**IntegrityWatch EU** (https://www.integritywatch.eu/) - 🟢 ACTIVO
- Declaraciones de interés de MEPs, reuniones con lobistas
- Operado por Transparency International EU

**VoteWatch Europe** - 🔴 CERRADO (junio 2022)
- Fue referencia del sector; su cierre deja vacío en el mercado

### Organizaciones de transparencia relevantes

- **Access Info Europe** (Madrid): Litigación estratégica, FOI expertise
- **Transparency International EU** (Bruselas): Anticorrupción, ética institucional
- **Corporate Europe Observatory** (Bruselas): Influencia corporativa, lobbying

### Servicios comerciales

**FiscalNote / EU Issue Tracker** (https://euissuetracker.com/) ofrece monitoreo legislativo profesional con analistas in-house, perfiles de funcionarios, y análisis predictivo. Demuestra demanda de mercado para soluciones de pago.

### Oportunidades identificadas para parlamento.ai

1. **Vacío post-VoteWatch**: Espacio para soluciones modernas de seguimiento de votaciones
2. **Fragmentación de datos**: Valor en plataforma unificada (EUR-Lex + OEIL + Transparency Register)
3. **Diferenciación potencial**: IA para análisis predictivo, interfaz multilingüe, enfoque España/LATAM
4. **Aliados potenciales**: Access Info Europe, Parltrack, academia (BACES/UPF)

---

## Conclusiones y recomendaciones técnicas

### Para el desarrollo de parlamento.ai

**Stack técnico recomendado:**
1. **Fase 1**: Bulk download inicial + parsing de Formex XML para corpus base
2. **Fase 2**: SPARQL queries a CELLAR para metadatos y relaciones
3. **Fase 3**: REST API de CELLAR para documentos individuales bajo demanda
4. **Fase 4**: Integración con OEIL (scraping controlado si necesario, o api.epdb.eu)
5. **Actualización continua**: RSS/Atom feeds + polling periódico

**Identificadores a usar:**
- CELEX como clave primaria interna
- ELI como identificador público/externo (dereferencable)

**Formatos de propuesta para comparados legibles por máquina:**
- Basarse en ELI para identificación
- Considerar extensión de CDM para relaciones de modificación
- AKN4EU como referencia para estructura de documento (aunque no implementado)
- JSON-LD para metadatos (compatible con schema.org/Legislation)

### Recursos técnicos clave

| Recurso | URL |
|---------|-----|
| SPARQL Endpoint | https://publications.europa.eu/webapi/rdf/sparql |
| Query Builder | https://op.europa.eu/en/advanced-sparql-query-editor |
| Data Dump | https://datadump.publications.europa.eu/ |
| CDM Ontology | https://op.europa.eu/en/web/eu-vocabularies/cdm |
| ELI Specification | https://op.europa.eu/en/web/eu-vocabularies/eli |
| Formex Schema | https://op.europa.eu/en/web/eu-vocabularies/formex |
| CELEX Guide | https://eur-lex.europa.eu/content/tools/TableOfSectors/types_of_documents_in_eurlex.html |

### Viabilidad técnica

**ALTA**. El acceso programático a datos legislativos de la UE es completamente factible sin necesidad de scraping para la mayoría de casos. El SPARQL endpoint de CELLAR es la herramienta más potente disponible. Las principales barreras son la curva de aprendizaje del modelo CDM/FRBR y la ausencia de API para Legislative Observatory.