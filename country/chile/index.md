# Sistema de comparados legislativos en Chile: estado del arte técnico

Los "comparados legislativos" en Chile **no tienen definición formal reglamentaria**, pero constituyen una práctica parlamentaria consolidada. Son documentos de trabajo producidos por las secretarías de comisión que presentan en columnas paralelas las distintas versiones de un proyecto de ley durante su tramitación. A diferencia de lo que podría esperarse, no existe un servicio estructurado ni API específica para acceder a estos documentos: están dispersos en PDFs dentro de los portales del Congreso, sin formato estandarizado ni metadatos consistentes.

---

## Terminología oficial: un vacío normativo sorprendente

Tras revisar los reglamentos del Senado (actualizado marzo 2025) y la Cámara de Diputados (julio 2023), **no existe definición formal** de los términos "comparados", "textos comparados" o "cuadros comparados". El término más cercano en normativa es "texto propuesto" o "texto que se propone aprobar", que aparece en los informes de comisión.

En la práctica parlamentaria se utiliza el término **"boletín comparado"**. El Diario de Sesiones del Senado (Sesión 38°, julio 2025) menciona que "el texto que se propone aprobar se transcribe en las páginas 187 y siguientes del informe de la Comisión, así como en el boletín comparado". La BCN utiliza "Comparador de textos constitucionales" para su herramienta web específica del proceso constitucional (www.bcn.cl/comparador), pero esto no aplica a la tramitación legislativa ordinaria.

**Lo que sí está regulado**: El Art. 40 del Reglamento del Senado establece que en el articulado propuesto "se distinguirá gráficamente la iniciativa que tuvieron las disposiciones y la votación con que hayan sido aprobadas". Esta es la única base normativa para los documentos comparativos, pero no especifica formato ni denominación.

---

## Flujo legislativo y momentos donde aparecen los comparados

El proceso legislativo chileno sigue estas etapas principales:

| Etapa | Descripción | ¿Genera comparado? |
|-------|-------------|-------------------|
| Inicio | Mensaje (Ejecutivo) o moción (parlamentarios) | No |
| 1er trámite - Comisión | Primer informe (idea de legislar) | Raramente |
| 1er trámite - Sala | Discusión general | No |
| 1er trámite - Comisión | **Segundo informe** (indicaciones) | **Sí, frecuente** |
| 1er trámite - Sala | Discusión particular | Usa comparado |
| 2do trámite | Cámara revisora, mismo proceso | **Sí, obligatorio para modificaciones** |
| 3er trámite | Si hay modificaciones | **Sí** |
| Comisión Mixta | Propuesta de resolución de discrepancias | **Sí, con dos versiones** |
| Veto presidencial | Observaciones del Ejecutivo | Comparado veto/texto |

Los comparados son **más frecuentes en el segundo informe de comisión** y en comisiones mixtas, donde se requiere visualizar las modificaciones respecto al texto previo. **No son técnicamente obligatorios** como documento separado, pero la práctica los ha institucionalizado como herramienta indispensable para la discusión particular.

**Productores**: Las **secretarías de comisión** de cada Cámara son responsables. El Art. 43 del Reglamento del Senado establece que el Secretario debe "ilustrar a los miembros de la Comisión acerca de los proyectos... haciendo una relación de las materias que tratan, normas legales en que inciden y, en su caso, del resultado de su tramitación en la Cámara de Diputados". La BCN no produce comparados para tramitación ordinaria; su rol se limita al servicio "Historia de la Ley" post-aprobación.

---

## Formato técnico: PDFs heterogéneos sin estandarización

### Características del archivo

Los comparados se publican como **PDF generados desde procesadores de texto** (probablemente Word). Los archivos contienen **texto seleccionable** (no son imágenes/OCR), pero **no utilizan PDF/A** para archivado de largo plazo. Generalmente **no llevan firma electrónica avanzada (FEA)**, ya que son documentos de trabajo interno de comisión, a diferencia de los informes oficiales que sí pueden estar firmados por el secretario.

### Estructura visual típica

La estructura más común utiliza **2-3 columnas**:

**Formato de 2 columnas:**
- Columna izquierda: "Texto aprobado en trámite anterior" o "Ley vigente"
- Columna derecha: "Observaciones/Indicaciones/Modificaciones propuestas"

**Formato de 3 columnas (más completo):**
- Columna 1: Ley vigente
- Columna 2: Texto proyecto original
- Columna 3: Texto aprobado en comisión

**Encabezados típicos**: Título del documento ("COMPARADO DE [TEMA]"), número de boletín(es), trámite constitucional actual, identificación de la comisión.

### Marcado de diferencias

Las convenciones **no están estandarizadas** entre comisiones. Se observan estos patrones variables:

- **Negrita**: Para modificaciones importantes o texto nuevo
- **Texto tachado**: Para indicar eliminaciones (no siempre usado)
- **Subrayado**: Para énfasis en adiciones
- **Corchetes [ ]**: Para indicar texto eliminado
- **Asteriscos (*)**: Para notas al pie explicativas

La variación depende de la comisión, el tipo de proyecto, y la discrecionalidad de cada secretaría. No existe un manual de estilo obligatorio.

### Metadatos

Los PDFs generalmente **carecen de metadatos estructurados**. No hay esquema XML/Dublin Core obligatorio. Los archivos se identifican principalmente por número de boletín, tipo de documento, y fecha de sesión. En el Senado, los identificadores suelen ser UUIDs (ej: `fb021174-2dd2-4405-afaf-b88821b1b25c`).

### Ejemplos concretos documentados

| Proyecto | URL | Tipo | Estructura |
|----------|-----|------|------------|
| Protección de Datos (Bol. 11.144-07 y 11.092-07) | https://www.camara.cl/verDoc.aspx?prmID=255351&prmTipo=DOCUMENTO_COMISION | Comparado de observaciones | 2 columnas |
| Derechos Lingüísticos Pueblos Indígenas (Bol. 17241-17) | https://www.camara.cl/verDoc.aspx?prmID=343457&prmTipo=DOCUMENTO_COMISION | Comparado con indicaciones | Multi-columna |
| Sistema Político Electoral (Bol. 17.253-07) | https://www.camara.cl/verDoc.aspx?prmID=85137&prmTipo=INFORME_COMISION | Informe con comparado | Integrado |

---

## Portales de publicación: fragmentación institucional

### Portal unificado de datos abiertos

**URL**: https://opendata.congreso.cl/

Portal centralizado que agrupa datos de Senado, Cámara y BCN. Ofrece:
- Proyectos de ley (XML)
- Votaciones por boletín
- Períodos legislativos
- Senadores/Diputados vigentes
- Sesiones y diarios de sesión

**Formato**: Exclusivamente XML (no JSON). **Limitación crítica**: No ofrece acceso estructurado a documentos comparados.

### Sistema del Senado

| Recurso | URL |
|---------|-----|
| Portal principal | https://www.senado.cl/ |
| Tramitación de proyectos | https://tramitacion.senado.cl/appsenado/templates/tramitacion/index.php |
| Web services | https://tramitacion.senado.cl/wspublico/ |

**Endpoints API disponibles** (XML, vigentes desde 27/11/2012):
- `invoca_proyecto.html` – Consulta proyectos
- `invoca_tramitacion_fecha.html` – Proyectos con movimiento por fecha
- `invoca_votacion.html` – Votaciones por boletín
- `invoca_sesion.html` – Sesiones de Sala
- `senadores_vigentes.php` – Senadores actuales

**Ejemplo**: `https://tramitacion.senado.cl/wspublico/proyecto.php?boletin=8575-05`

Los comparados **no están disponibles vía API**; solo accesibles navegando la ficha de cada proyecto.

### Sistema de la Cámara de Diputados

| Recurso | URL |
|---------|-----|
| Portal principal | https://www.camara.cl/ |
| Proyectos de ley | https://www.camara.cl/legislacion/ProyectosDeLey/proyectos_ley.aspx |
| Datos abiertos | https://www.camara.cl/transparencia/datosAbiertos.aspx |
| WSDL | https://opendata.camara.cl/wscamaradiputados.asmx |

**API más completa del ecosistema** (~35+ endpoints XML):
- `retornarProyectoLey` – Proyecto específico
- `retornarVotacionDetalle` – Detalle de votación
- `retornarComisionesVigentes` – Comisiones activas
- `retornarDiputadosPeriodoActual` – Diputados actuales
- `retornarMocionesXAnno`, `retornarMensajesXAnno` – Por año

**Acceso a documentos de comisión**: Parámetro `prmTipo=DOCUMENTO_COMISION` o `prmTipo=INFORME_COMISION` en `verDoc.aspx`.

### BCN: el ecosistema más sofisticado técnicamente

**LeyChile** (https://www.leychile.cl/):
- **347,000+ normas** de diversa jerarquía
- **Versiones históricas disponibles**: `https://www.leychile.cl/Navegar?idNorma=XXXXX&idVersion=YYYY-MM-DD`
- **API XML**: `https://www.leychile.cl/Consulta/obtxml?opt=7&idNorma=XXXXX`
- **Limitación**: No ofrece comparación visual lado a lado

**Historia de la Ley** (https://www.bcn.cl/historiadelaley/):
- Recopila todos los documentos de tramitación de leyes promulgadas
- Utiliza **Akoma Ntoso 2.0** para marcado XML
- Incluye diarios de sesiones, informes, votaciones

**Datos Abiertos Enlazados** (https://datos.bcn.cl/):
- **28 millones de tripletas RDF**
- **Endpoint SPARQL funcional**: https://datos.bcn.cl/sparql
- Ontologías publicadas: normas, biografías, congreso, recursos legislativos, sesión parlamentaria, geografía

### Tabla comparativa de capacidades

| Portal | XML | JSON | API REST | SPARQL | Comparados estructurados |
|--------|-----|------|----------|--------|-------------------------|
| opendata.congreso.cl | ✅ | ❌ | ✅ | ❌ | ❌ |
| Senado.cl | ✅ | ❌ | ✅ | ❌ | ❌ |
| Camara.cl | ✅ | ❌ | ✅ | ❌ | ❌ |
| LeyChile.cl | ✅ | ❌ | ✅ | ❌ | ⚠️ Solo versiones |
| datos.bcn.cl | ✅ | ❌ | ✅ | ✅ | ❌ |

---

## Estándares técnicos: Akoma Ntoso implementado, pero fragmentado

### Lo que funciona hoy

**Akoma Ntoso 2.0 en BCN**:
- Esquema XSD personalizado: `http://datos.bcn.cl/XMLSchema/2013/akomantoso20_BCN.xsd`
- **29,000+ documentos** disponibles en formato AKN XML
- Tipos cubiertos: diarios de sesiones históricos (1965-1973), mociones, mensajes, informes
- Desarrollo asesorado por académicos de la Universidad de Bolonia

**Acceso vía propiedades RDF**:
- `bcnres:tieneDocumentoAkomaNtoso` – enlace al XML AKN
- `bcnres:tieneDocumentoTXT` – enlace a versión texto plano

**XML propietario del Senado**: Formato diferente a Akoma Ntoso, vigente desde 2012, sin documentación pública del esquema.

### Lo que no existe

- **LegalDocML (OASIS)**: Sin evidencia de implementación
- **JSON APIs**: Ningún portal oficial ofrece JSON nativo
- **Webhooks/streaming**: No hay mecanismos de actualización en tiempo real
- **Portal unificado de desarrolladores**: Documentación dispersa entre instituciones

### Interoperabilidad del SIL: promesa incumplida

El **5° Plan de Gobierno Abierto (2020-2022)** incluyó el compromiso C9: "Diseño de plataforma integrada e interoperable de gestión e información legislativa". Identificaba problemas reales:

- Información dispersa en múltiples plataformas
- Falta de estandarización en registro de información
- Datos inconsistentes entre sistemas

**Estado actual**: ❌ **Sin evidencia de implementación**. El 6° Plan (2023-2027) no incluye compromiso continuador. La interoperabilidad SIL quedó como propuesta abandonada.

---

## Acceso programático: qué se puede hacer hoy

### APIs funcionales

| Fuente | Base URL | Autenticación | Rate limit |
|--------|----------|---------------|------------|
| Cámara | opendata.camara.cl | No requerida | No documentado |
| Senado | tramitacion.senado.cl/wspublico/ | No requerida | No documentado |
| LeyChile | leychile.cl/Consulta | No requerida | No documentado |
| BCN SPARQL | datos.bcn.cl/sparql | No requerida | No documentado |

### Qué se puede obtener programáticamente

✅ **Disponible vía API**:
- Metadatos de proyectos de ley (boletín, título, estado, trámites)
- Votaciones por proyecto (detalle por parlamentario)
- Información de parlamentarios vigentes
- Comisiones y sus sesiones
- Textos de normas vigentes en XML
- Versiones históricas de leyes (LeyChile)

⚠️ **Disponible pero no estructurado**:
- Informes de comisión (PDF sin metadatos)
- Comparados (PDF dispersos en fichas de proyectos)

❌ **No disponible**:
- Comparados en formato estructurado (XML/JSON)
- Diferencias entre versiones de proyectos en tramitación
- Textos de proyectos en versiones intermedias (solo final)

### Scraping: factible pero con limitaciones

Los sitios `tramitacion.senado.cl` y `camara.cl` **bloquean acceso automatizado via robots.txt** en algunas rutas. Sin embargo, el scraping de fichas de proyectos y documentos PDF es técnicamente posible. Los PDFs de comparados están accesibles públicamente sin autenticación.

**Patrón de URLs para documentos de comisión (Cámara)**:
```
https://www.camara.cl/verDoc.aspx?prmID=[ID]&prmTipo=DOCUMENTO_COMISION
```

**Patrón en Senado**: Sistema de microservicios con UUIDs.

---

## Organismos y sus roles específicos

| Organismo | Rol respecto a comparados | Contacto técnico |
|-----------|---------------------------|------------------|
| **Secretarías de Comisión (Senado)** | Producen comparados para sesiones | Vía secretaría de cada comisión |
| **Secretarías de Comisión (Cámara)** | Producen comparados para sesiones | Vía secretaría de cada comisión |
| **Oficina de Informática del Senado** | Mantiene tramitacion.senado.cl y APIs | tramitacion.senado.cl |
| **Oficina de Informática de la Cámara** | Mantiene opendata.camara.cl | camara.cl/transparencia |
| **BCN - Área de Desarrollo** | Mantiene LeyChile, datos.bcn.cl, Historia de la Ley | datos.bcn.cl |
| **Grupo Bicameral de Transparencia** | Coordinación entre Cámaras | Vía presidencias |

---

## Ecosistema de actores relevantes

### Organizaciones de sociedad civil activas

**Fundación Ciudadanía Inteligente** (https://ciudadaniai.org/):
- Principal organización civic tech de Latinoamérica
- **193 repositorios en GitHub** (https://github.com/ciudadanointeligente)
- Proyectos relevantes: `bill-it` (tracking de proyectos), `votainteligente-portal-electoral`, `legislative`
- Estado: Activo, financiado por Open Society y Omidyar Network

**Chile Transparente** (https://www.chiletransparente.cl/):
- Capítulo chileno de Transparencia Internacional
- Proyecto **"Observa"**: monitoreo de proyectos clave, votaciones, lobby
- Publica Índice Latinoamericano de Transparencia Legislativa (Chile: 64.5%)

**Observatorio Congreso** (https://observatoriocongreso.cl/):
- Fiscalización y análisis de comportamiento parlamentario
- Ofrece suscripción para informes por región/comuna

### Startups y empresas

**Parlamento.ai** (https://parlamento.ai/) – **Competidor/similar directo**:
- Fundadores: Pablo Matamoros (exasesor gobierno, académico U. Central), Juan Pablo Moreno
- Lanzamiento: 2024
- Funcionalidad: Transcripción en tiempo real de sesiones con IA, alertas personalizadas, resúmenes
- Cobertura: Chile, España (beta), Perú (beta)
- Clientes: Estudios de abogados, empresas en mercados regulados

**Asociación ALTECH** (legaltech chileno):
- Lemontech, Webdox, Legalbot, Causa Alerta
- Ninguna enfocada específicamente en datos legislativos

### Repositorios GitHub útiles

| Repositorio | Descripción | Stars |
|-------------|-------------|-------|
| `ciudadanointeligente/bill-it` | Sistema de tracking de proyectos de ley | 19 |
| `ciudadanointeligente/votainteligente-portal-electoral` | Portal electoral | 43 |
| `alangrafu/votaciones-senado-congreso.cl` | Extracción votaciones Senado a RDF | 7 |
| `nelyj/senado_chile` | Librería para obtener info del Senado en JSON | - |
| `senadores-chile/senadores` | Datos públicos de senado.cl | - |
| `imfd/awesome-data-chile` | Lista curada de datasets públicos | - |

### Academia

- **Universidad de Chile**: Tesis sobre sistemas de monitoreo parlamentario (FCFM, 2015)
- **Universidad Diego Portales**: Centro de DDHH, parte del Observatorio Parlamentario
- **Universidad Central**: Pablo Matamoros (Parlamento.ai), proyecto ChatBot Constitucional IA
- **Cámara de Diputados**: Proyecto CAMINAR (RAG para investigación legislativa, en desarrollo 2024)

---

## Realidad vs. aspiración: clasificación definitiva

### ✅ Funciona hoy (operativo y usable)

- **APIs XML** de Cámara y Senado para proyectos, votaciones, parlamentarios
- **Endpoint SPARQL** de datos.bcn.cl con 28M tripletas
- **Akoma Ntoso 2.0** en BCN para documentos históricos
- **Versiones históricas** de leyes en LeyChile
- **Historia de la Ley** con documentos de tramitación post-promulgación
- **Portales web** con acceso a PDFs de comparados (sin estructura)

### 🔄 En proceso (evidencia de implementación activa)

- **Proyecto CAMINAR** (Cámara): RAG para investigación legislativa
- **Parlamento.ai**: Transcripción y análisis con IA (sector privado)

### ❌ Anunciado pero no implementado

- **Interoperabilidad del SIL** (5° Plan de Gobierno Abierto)
- **Plataforma integrada de gestión legislativa**
- **Estandarización de registro de información**

### ❓ No existe y no hay indicios de desarrollo

- **API JSON** para ningún portal oficial
- **Servicio estructurado de comparados** (XML/JSON con diferencias marcadas)
- **Webhooks** para actualizaciones en tiempo real
- **Comparación visual automatizada** de versiones de proyectos en tramitación
- **Metadatos estandarizados** en documentos PDF

---

## Recomendaciones técnicas para parlamento.ai

### Estrategia de obtención de datos

1. **Para proyectos y votaciones**: Usar APIs XML oficiales de Cámara y Senado
2. **Para textos de normas vigentes**: API de LeyChile con versiones históricas
3. **Para documentos históricos estructurados**: SPARQL de datos.bcn.cl
4. **Para comparados**: Scraping de PDFs + procesamiento propio

### Desafío técnico principal

No existe forma de obtener comparados estructurados. La solución requiere:
1. Identificar URLs de documentos de comisión por proyecto
2. Descargar PDFs
3. Extraer texto (ya son seleccionables, no requiere OCR)
4. Parsear estructura de columnas (variable por documento)
5. Identificar marcado de diferencias (negrita, tachado, etc.)
6. Generar representación estructurada propia

### Oportunidad de mercado

Dado que **no existe servicio estructurado de comparados**, una API que ofrezca:
- Textos de proyectos en versiones intermedias
- Diferencias marcadas entre versiones (tipo diff)
- Formato JSON estructurado

Sería una propuesta de valor única en el mercado chileno, complementando lo que Parlamento.ai ofrece en análisis de sesiones.

---

## Fuentes principales consultadas

- Reglamento del Senado (actualizado 18/03/2025): https://cdn.senado.cl/portal-senado-produccion/s3fs-public/2025-05/reglamento-del-senado-18032025.pdf
- Reglamento de la Cámara (julio 2023): https://www.camara.cl/camara/doc/leyes_normas/reglamento.pdf
- Portal opendata.congreso.cl
- datos.bcn.cl (documentación de ontologías y SPARQL)
- camara.cl/transparencia/datosAbiertos.aspx
- senado.cl/datos-abiertos-legislativos
- 5° Plan de Gobierno Abierto Chile (ogp.gob.cl)
- Tesis "Sistema de información para seguimiento de la labor de los Parlamentarios" (U. Chile, 2015)
- Paper "Legislative Document Content Extraction Based on Semantic Web Technologies" (Springer, ESWC 2019)