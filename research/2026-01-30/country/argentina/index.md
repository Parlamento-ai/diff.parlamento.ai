# Argentina: Sistema de comparados legislativos en Argentina: guía técnica exhaustiva

Los documentos de comparación legislativa en Argentina **no tienen un sistema formal ni estandarizado** como en otros países. El término "cuadro comparativo" se usa en la práctica parlamentaria de manera ad hoc, pero no existe una herramienta oficial automatizada ni un repositorio centralizado. Para un desarrollador de parlamento.ai, esto significa que la comparación de versiones debe construirse desde cero combinando múltiples fuentes de datos.

---

## Terminología y marco legal: ausencia de definición formal

El primer hallazgo crítico es que **no existe definición oficial** del término "cuadro comparativo" ni "comparado legislativo" en los reglamentos parlamentarios argentinos. Ni el Reglamento de la Cámara de Diputados (disponible en congreso.gob.ar/reglamentoDiputados.pdf) ni el Reglamento del Senado (senado.gob.ar/bundles/senadoportal/pdf/Reglamento_HSN.pdf) mencionan estos documentos como requisito formal del proceso legislativo.

Sin embargo, el término se utiliza en la práctica. Una evidencia directa aparece en una versión taquigráfica de la Comisión de Asuntos Constitucionales de 2014, donde la entonces presidenta Conti mencionó: *"Algunos de ustedes cuentan con un cuadro comparativo que pudimos elaborar en las últimas horas de anoche entre el texto de la ley de inteligencia 25.520 y el proyecto de ley sancionado por el Senado"*. Esta cita revela dos aspectos importantes: los cuadros comparativos **existen como práctica**, pero se producen de manera improvisada y no sistemática.

Los documentos que sí tienen definición formal son otros:
- **Dictamen de comisión**: resolución escrita adoptada por comisiones sobre una iniciativa
- **Despacho de comisión**: resumen de decisiones incluyendo dictámenes e informe obligatorio
- **Orden del Día**: documento numerado que contiene los despachos impresos

---

## El flujo legislativo argentino y dónde encajan los comparados

Para entender dónde podrían generarse comparativos, es necesario mapear el proceso completo de sanción de leyes según los artículos 77-84 de la Constitución Nacional:

**Etapa 1 - Presentación**: El proyecto ingresa por Mesa de Entradas de cualquier cámara. La cámara donde ingresa es "cámara de origen" y la otra "cámara revisora".

**Etapa 2 - Comisiones**: El presidente gira el proyecto a las comisiones competentes. Aquí las secretarías de comisión pueden elaborar cuadros comparativos como herramienta de análisis, pero **no es obligatorio**. Las comisiones estudian, investigan y convocan especialistas.

**Etapa 3 - Dictamen/Despacho**: Las comisiones emiten dictamen (mayoría o minoría). El despacho debe incluir un informe escrito obligatorio, pero **los cuadros comparativos no son parte formal del despacho**.

**Etapa 4 - Debate en plenario**: Discusión en general (idea fundamental) y en particular (artículo por artículo).

**Etapa 5 - Cámara revisora**: Puede aprobar, rechazar totalmente, o modificar/adicionar. Si modifica, vuelve a cámara de origen.

**Etapa 6 - Retorno a cámara de origen** (si hubo modificaciones): La cámara de origen puede aprobar o rechazar las modificaciones pero **no puede introducir nuevas** (Acta conjunta 1995).

**Etapa 7 - Poder Ejecutivo**: Promulgación o veto, y publicación en Boletín Oficial.

Los momentos donde un comparativo sería técnicamente más útil son: (1) cuando una comisión analiza un proyecto que modifica legislación existente, (2) cuando la cámara revisora introduce modificaciones, y (3) cuando el Ejecutivo promulga con observaciones parciales. Sin embargo, **en ninguno de estos momentos hay producción sistemática de comparados oficiales**.

---

## Quién produce documentos comparativos y en qué formato

### Productores dentro del Congreso

La **Dirección de Información Parlamentaria (DIP)** de la Cámara de Diputados es el organismo que más se acerca a producir material comparativo. Creada en 1913, sus funciones incluyen asesoramiento en técnica legislativa, elaboración de "legislación comparada, traducida y sintetizada" y publicación de "textos actualizados". El contacto es dip@hcdn.gob.ar, ubicados en Av. Rivadavia 1864, 2do piso.

Sin embargo, la DIP no publica sistemáticamente cuadros comparativos accesibles al público. Su producción incluye estadísticas parlamentarias, documentación de debates, y materiales de investigación internos.

Las **secretarías de comisión** elaboran cuadros comparativos ocasionalmente, como herramienta de trabajo interno para facilitar el análisis de los legisladores. Estos documentos no tienen formato estandarizado y generalmente no se publican.

### El sistema de Infoleg: notas al pie en lugar de columnas

El sistema más cercano a una herramienta de comparación oficial es **Infoleg** (infoleg.gob.ar), administrado por la Dirección Nacional del Sistema Argentino de Información Jurídica (SAIJ) del Ministerio de Justicia. Infoleg ofrece dos versiones de cada norma:

1. **"Texto completo de la norma"**: versión original publicada
2. **"Texto actualizado de la norma"**: versión consolidada con modificaciones

Para indicar cambios, Infoleg usa un sistema de **notas al pie**, no columnas lado a lado. Por ejemplo, en un artículo modificado aparece: *"(Nota Infoleg: por art. X del Decreto N° XXX B.O. fecha, se establece...)"*. Para artículos derogados: *"(Artículo derogado por art. X del Decreto N° XXX)"*.

**Advertencia importante**: Infoleg no tiene facultades de "ordenar" legislación ni interpretar la intención del legislador. Los textos actualizados son **meramente informativos**, no oficiales.

### Productores externos: editoriales jurídicas

Los cuadros comparativos más completos y estructurados provienen de **editoriales jurídicas privadas**:

- **Thomson Reuters/La Ley**: Produce análisis comparativos profesionales, como el "Cuadro Comparativo Ley de Bases" (Ley 27.742) disponible en thomsonreuters.com.ar
- **Erreius**: Publicaciones legales con cuadros comparativos integrados
- **Alveroni**: Publica tablas comparativas, por ejemplo del Código Civil vs. Código Civil y Comercial (PDF en alveroni.com)

Estos documentos comerciales usan estructura de **columnas lado a lado** ("texto anterior" | "texto nuevo"), son PDFs con texto seleccionable, pero requieren suscripción o compra.

---

## Los portales oficiales: qué ofrece cada uno

### HCDN (hcdn.gob.ar)

La Cámara de Diputados ofrece un **buscador avanzado de proyectos** desde 1983 con criterios múltiples: período, tipo, expediente, firmante, comisión, palabras clave, orden del día. Se puede seguir el trámite parlamentario, pero **no hay herramienta de comparación de textos**.

- **Proyectos**: hcdn.gob.ar/proyectos/
- **Datos abiertos**: datos.hcdn.gob.ar (portal CKAN, aunque con problemas de acceso)
- **Votaciones**: votaciones.hcdn.gob.ar

### Senado (senado.gob.ar)

Sistema similar con buscador avanzado. Distingue entre tipos de texto: **TE** (texto original), **TD** (texto sancionado), **SD** (sanción con modificaciones de Diputados), **EX** (resumen de carátula). Esto permite ver distintas versiones de un proyecto, pero **no hay comparación automática**.

- **Proyectos**: senado.gob.ar/parlamentario/parlamentaria/
- **Datos abiertos funcionales**: senado.gob.ar/micrositios/DatosAbiertos/

### SAIJ (saij.gob.ar)

El Sistema Argentino de Información Jurídica, fundado en 1981 con apoyo de UNESCO, ofrece:
- Todas las leyes nacionales desde 1853, actualizadas diariamente
- Jurisprudencia federal y provincial
- Doctrina
- **Digesto Jurídico Argentino**: consolidación de 22,234 normas reducidas a **3,353 leyes vigentes** (Ley 26.939)

### Boletín Oficial (boletinoficial.gob.ar)

Única fuente con **carácter oficial y auténtico** para leyes promulgadas (Decretos 659/1947 y 207/2016). La publicación digital tiene mismo valor que la edición impresa.

---

## Acceso programático: qué funciona hoy

### APIs y endpoints funcionales

**Senado - Endpoints JSON (funcionan hoy):**
```
/micrositios/DatosAbiertos/ExportarListadoSenadores/json
/micrositios/DatosAbiertos/ExportarListadoComisiones/json/todas
/micrositios/DatosAbiertos/ExportarListadoVersionesTac/json
/micrositios/DatosAbiertos/ExportarNormativaVigente/json
```
Acceso directo sin autenticación.

**Infoleg - Datasets CSV (funcionan hoy):**
- Portal: datos.jus.gob.ar/dataset/base-de-datos-legislativos-infoleg
- También en: datos.gob.ar/ar/dataset/justicia-base-infoleg-normativa-nacional
- Actualización: mensual (última: enero 2026)
- Formato: CSV UTF-8

Los campos disponibles en el dataset de Infoleg incluyen: `id_norma`, `tipo_norma`, `numero_norma`, `fecha_sancion`, `titulo_sumario`, `texto_original` (link al PDF), `texto_actualizado` (link al texto vigente), `modificada_por`, `modifica_a`. Estos dos últimos campos son cruciales para reconstruir el grafo de modificaciones.

**Documentación GitHub**: github.com/datos-justicia-argentina/Base-de-datos-legislativos-infoleg

### Scraping: viabilidad técnica

Ambos sitios del Congreso declaran explícitamente: *"La información contenida en este sitio es de dominio público y puede ser utilizada libremente. Se solicita citar la fuente."*

Proyectos de scraping existentes en GitHub:
- **nahuelhds/votaciones-ar-datasets**: Datasets de votaciones 1993-2019 en CSV
- **Arzanico/scrapingDiputadosArgentina**: Actas de votación desde votaciones.hcdn.gob.ar

El sitio de Diputados usa OpenCms/7.5.4 con URLs predecibles. Rate limiting recomendado: 1 request cada 5-10 segundos.

### Estándares XML: inexistentes

Argentina **no utiliza** estándares XML legislativos como Akoma Ntoso o LegalDocML. Los textos se publican en HTML y PDF. Brasil tiene LexML (derivación de AKN), Italia y UK publican en Akoma Ntoso, pero Argentina no ha adoptado ningún estándar estructurado para textos legislativos.

---

## Ecosistema de organizaciones externas

### Red Argentina de Parlamento Abierto (RAPA)

Integrada por: ACIJ, CIPPEC, Conocimiento Abierto, Democracia en Red, Directorio Legislativo, Poder Ciudadano. Sus principales demandas incluyen sanción de ley de lobby, designación del titular de la Agencia de Acceso a la Información del Congreso, y publicación completa de información sobre legisladores.

### Directorio Legislativo (directoriolegislativo.org)

Fundación desde 2000 con herramientas relevantes:
- **Directorio de Legisladores**: Base de datos de legisladores de América Latina
- **OPeN (Open Parliament Network)**: Asistencia técnica a legislaturas
- **Civic Space Guardian**: Monitor de regulaciones que impactan libertades civiles en 18 países

### Democracia en Red (democraciaenred.org)

Desarrollan **DemocraciaOS** (democraciaos.org), plataforma de código abierto para participación ciudadana. GitHub: github.com/democraciaenred. Incluye presupuesto participativo, consulta pública, y elaboración colaborativa de leyes.

### Índice Latinoamericano de Transparencia Legislativa

Argentina obtuvo **36% de transparencia** (posición media-baja regional). La Legislatura de Córdoba alcanzó 66.79%, primera de América Latina en 2023.

---

## Realidad vs. aspiración: lo que funciona y lo que no

### Funciona efectivamente hoy

| Elemento | Estado | URL/Evidencia |
|----------|--------|---------------|
| Datasets Infoleg CSV | ✅ Operativo | datos.jus.gob.ar/dataset/base-de-datos-legislativos-infoleg |
| Endpoints JSON Senado | ✅ Operativo | senado.gob.ar/micrositios/DatosAbiertos/ |
| Scraping de votaciones | ✅ Viable | github.com/nahuelhds/votaciones-ar-datasets |
| Firma digital documentos | ✅ Implementada | Ley 25.506 |
| Textos actualizados Infoleg | ✅ Operativo | servicios.infoleg.gob.ar |
| Buscadores de proyectos | ✅ Operativo | hcdn.gob.ar/proyectos/, senado.gob.ar/parlamentario/ |

### En proceso de implementación

| Elemento | Estado | Evidencia |
|----------|--------|-----------|
| Portal datos HCDN | 🟡 Problemas de acceso | datos.hcdn.gob.ar tiene errores 500 frecuentes |
| Interoperabilidad documentos | 🟡 Compromiso en Plan Congreso Abierto | Sin implementación técnica visible |
| Digitalización históricos Senado | 🟡 Anunciado 2021 | Documentos 1853-1983 |

### Anunciado pero no implementado

| Elemento | Estado | Observación |
|----------|--------|-------------|
| API REST oficial documentada | ❌ No existe | Solo endpoints dispersos sin documentación |
| Estándar XML legislativo | ❌ No adoptado | Ni Akoma Ntoso ni LegalDocML |
| Cuadros comparativos automatizados | ❌ No existe | Ningún portal ofrece esta funcionalidad |
| Hub interoperabilidad parlamentaria | ❌ No encontrado | Argentina no participa en hub regional específico |
| Webhooks/notificaciones de cambios | ❌ No existe | No hay sistema de suscripción a actualizaciones |

---

## Implicaciones técnicas para parlamento.ai

Para construir una herramienta tipo "git diff" para legislación argentina, necesitarás:

**Fuentes de datos a combinar:**
1. Dataset Infoleg (CSV mensual) para normativa vigente y enlaces de modificación
2. Endpoints JSON del Senado para datos estructurados de proyectos
3. Scraping de HCDN para proyectos de Diputados
4. Scraping de trámite parlamentario para seguir versiones

**Reconstrucción del diff:**
Como no hay formato estructurado, deberás:
1. Obtener el `texto_original` y `texto_actualizado` de Infoleg
2. Aplicar algoritmos de diff de texto (como difflib en Python)
3. Usar los campos `modifica_a` y `modificada_por` para reconstruir el grafo de modificaciones
4. Los tipos de texto del Senado (TE, TD, SD) te dan versiones para comparar

**Limitaciones a considerar:**
- Los PDFs antiguos pueden ser imágenes escaneadas (requieren OCR)
- No hay identificadores únicos estables entre sistemas
- La actualización de Infoleg es mensual, no en tiempo real
- No hay estándar de estructura para artículos (numeración inconsistente entre leyes)

---

## Conclusión

Argentina carece de un sistema formal de comparados legislativos comparable al de países como Estados Unidos (redlining en bills) o la Unión Europea (documentos consolidados estructurados). Los "cuadros comparativos" existen como práctica informal dentro de las comisiones, pero no hay repositorio público ni formato estandarizado.

Para un desarrollador, el camino más viable es combinar los datasets de Infoleg (que incluyen campos de modificación) con scraping de los portales parlamentarios, y construir la funcionalidad de diff en la capa de aplicación. El campo `modifica_a` de Infoleg es el activo más valioso para reconstruir relaciones entre versiones de normas. La ausencia de estándares XML significa que todo procesamiento debe partir de texto plano o HTML, lo cual complica pero no imposibilita la construcción de herramientas de comparación.