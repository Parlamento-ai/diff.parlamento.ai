# Sistema de cuadros comparativos legislativos en México: guía técnica completa

Los cuadros comparativos legislativos son documentos técnicos esenciales en el proceso legislativo mexicano que contrastan el texto vigente de una ley con las reformas propuestas. Aunque **no existe obligación legal explícita** de incluirlos en los dictámenes, constituyen una práctica institucional consolidada indispensable para el análisis parlamentario. Para una startup de seguimiento legislativo como parlamento.ai, este sistema representa tanto oportunidades como desafíos técnicos significativos: la información está fragmentada en múltiples portales gubernamentales, predomina el formato PDF, y **no existen APIs públicas** en las cámaras del Congreso federal —aunque el Diario Oficial de la Federación sí ofrece servicios web documentados.

---

## La terminología oficial y el vacío normativo sorprendente

La denominación formal más utilizada en México es **"Cuadro comparativo del texto vigente y del texto que se propone"**, según la documentación de la Dirección General de Apoyo Parlamentario (DGAP) de la Cámara de Diputados. También circulan variantes como "cuadro comparativo de reformas propuestas" o "cuadro de tres columnas" —este último término aparece en la práctica pero no está formalizado en ningún reglamento.

Lo más revelador de esta investigación es que **ningún reglamento parlamentario mexicano define formalmente estos documentos ni los establece como obligatorios**. El Artículo 85 del Reglamento de la Cámara de Diputados enumera 15 elementos que debe contener un dictamen, incluyendo "análisis y valoración de los textos normativos propuestos, explicando si se aprueban, modifican o desechan" (fracción XI), pero nunca menciona explícitamente los cuadros comparativos.

El único documento normativo que menciona expresamente estos instrumentos es el **Estatuto de los Servicios Parlamentarios del Senado** (DOF 17/05/2024), que los incluye entre las funciones de la Coordinación de Consultoría Jurídica Legislativa: "determinar y autorizar la publicación de las opiniones, estudios técnico-jurídicos, **cuadros comparativos en materia nacional e internacional**, medios de control constitucional, tesis, precedentes y la información de su competencia."

### Quiénes los producen

La elaboración de cuadros comparativos recae en múltiples actores técnicos:

- **Dirección General de Apoyo Parlamentario** (Diputados): A través de su Subdirección de Apoyo Técnico-Jurídico a Comisiones, produce los "Análisis Técnicos Preliminares" con formato DGAP-F01-08
- **Secretarías Técnicas de las Comisiones**: Responsables directas del trabajo operativo de comparación de textos
- **Coordinación de Consultoría Jurídica Legislativa** (Senado): Con sus consultores parlamentarios especializados
- **Instituto Belisario Domínguez** (Senado): Publica la serie "Cuadros Analíticos de Propuestas Legislativas"
- **Centros de Estudio de la Cámara de Diputados**: CEFP, CEDIP, CESOP, CEDRSSA y CELIG producen análisis comparativos especializados por materia

---

## El proceso legislativo y dónde emergen los comparativos

El flujo completo de una iniciativa en México atraviesa siete fases principales, y los cuadros comparativos aparecen específicamente en las etapas de **trabajo en comisiones** y **dictaminación**.

### Flujo legislativo completo

1. **Presentación de iniciativa**: Puede provenir del Presidente de la República (exclusivo para Ley de Ingresos y Presupuesto), diputados, senadores, legislaturas estatales o ciudadanos (0.13% de la Lista Nominal)

2. **Turno a comisión**: La Mesa Directiva turna a la comisión correspondiente según la materia. Plazos: 45 días para iniciativas ordinarias, 90 días para minutas, 30 días improrrogables para iniciativas preferentes

3. **Trabajo en comisiones**: Aquí se elabora el cuadro comparativo. El proceso interno incluye:
   - Solicitud de opiniones a instituciones
   - **Elaboración del comparativo** (texto vigente vs. propuesta) por la secretaría técnica
   - Consulta ciudadana (15 días hábiles en portal del Congreso)
   - Mesas de trabajo internas
   - Discusión y votación del dictamen

4. **Votación en pleno**: Declaratoria de publicidad, discusión en lo general y particular, votación nominal

5. **Cámara revisora**: Tres escenarios posibles (aprobación total, rechazo, o modificaciones)

6. **Sanción del Ejecutivo**: 10 días útiles para observar o se considera aprobado

7. **Publicación en DOF**: El decreto final **no incluye cuadros comparativos**, solo el texto normativo aprobado

### Ubicación precisa del cuadro comparativo en el dictamen

Los dictámenes de comisión se estructuran conforme al Artículo 85 del Reglamento de la Cámara de Diputados en: proemio, antecedentes, considerandos, resolutivos y proyecto de decreto. El cuadro comparativo se ubica típicamente en la **sección de considerandos**, como herramienta de análisis de los textos normativos, o como **anexo técnico** al final del documento.

En el caso de **iniciativas** (no dictámenes), el cuadro comparativo aparece dentro de la **exposición de motivos**, generalmente introducido con frases como "a continuación se ilustra en el siguiente cuadro comparativo" o "para exponer con mayor claridad la propuesta de modificación normativa."

---

## El formato físico de los cuadros comparativos

La investigación documental reveló que el formato predominante es **PDF con texto seleccionable** y estructura de **dos columnas** (no tres, como frecuentemente se asume).

### Estructura estándar de dos columnas

| TEXTO VIGENTE | TEXTO PROPUESTO |
|---------------|-----------------|
| Artículo X. [Contenido actual de la ley] | Artículo X. [Contenido con modificaciones en **negritas**] |
| Sin correlativo | [Artículo nuevo completo] |

Las características técnicas observadas en documentos reales incluyen:

- **Cada artículo ocupa su propia fila**, permitiendo comparación lado a lado
- **Negritas** para resaltar texto nuevo o modificado
- **"Sin correlativo"** cuando no existe texto vigente correspondiente (artículos nuevos)
- **Tachado** para texto derogado (menos frecuente)
- Los PDFs son generados digitalmente (no escaneados), con texto buscable y seleccionable
- Fuente tipográfica serif (generalmente Times), tamaño carta, codificación UTF-8

### Cuándo se usa formato de tres columnas

El formato de tres columnas (texto vigente | iniciativa original | texto aprobado por comisión) aparece solo cuando la comisión dictaminadora **modifica** la propuesta original del iniciador. No es el estándar predominante.

### Ejemplos reales con URLs

**Gaceta Parlamentaria - Cámara de Diputados:**
- Iniciativa sobre Telecomunicaciones (octubre 2025): https://gaceta.diputados.gob.mx/PDF/66/2025/oct/20251028-II-1-1.pdf
- Reforma sobre terminología de abuso sexual infantil (septiembre 2025): https://gaceta.diputados.gob.mx/PDF/66/2025/sep/20250918-II-6.pdf

**Servicios de Información y Análisis (SAPI):**
- Análisis de Reforma Electoral Constitucional (julio 2022): https://www.diputados.gob.mx/sedia/sia/spi/SAPI-ASS-11-22.pdf — Documento de 69+ páginas con comparativos detallados

**Senado de la República:**
- Dictamen de Simplificación Orgánica (noviembre 2024): https://infosen.senado.gob.mx/sgsp/gaceta/66/1/2024-11-28-2/assets/documentos/Dictamen_Simplificaci%C3%B3n_Org%C3%A1nica.pdf

**Congreso de la Ciudad de México:**
- Iniciativa sobre cigarrillos electrónicos (febrero 2025): https://www.congresocdmx.gob.mx/media/documentos/951466e508053863077f53e2b1497e8fdf80957a.pdf

---

## Los cinco portales principales y sus capacidades

### Gaceta Parlamentaria (Cámara de Diputados)

**URL**: https://gaceta.diputados.gob.mx/

Es el repositorio más completo para documentos legislativos de la cámara baja. Publica iniciativas, dictámenes, votaciones, convocatorias de comisiones y versiones estenográficas. Los cuadros comparativos **sí aparecen** como parte de los análisis técnicos preliminares y dentro de los dictámenes.

**Formatos**: PDF, Word, HTML. Organización por fecha de publicación con motor de búsqueda interno. URL pattern predecible para PDFs: `https://gaceta.diputados.gob.mx/PDF/[legislatura]/[año]/[mes]/[fecha]-[tipo].pdf`

### Sistema de Información Legislativa (SIL)

**URL**: https://sil.gobernacion.gob.mx/

Operado por la Secretaría de Gobernación, centraliza información de ambas cámaras. Ofrece perfiles de legisladores, seguimiento de iniciativas, numeralia y búsqueda avanzada. Sin embargo, **no publica cuadros comparativos directamente** y advierte que sus contenidos "carecen de validez oficial."

**Limitación crítica**: No ofrece API pública documentada. La búsqueda avanzada requiere interacción manual con formularios POST.

### Portales de Cámara de Diputados y Senado

**Diputados**: https://www.diputados.gob.mx/ — Incluye la sección de Leyes Federales Vigentes (https://www.diputados.gob.mx/LeyesBiblio/) con textos completos en PDF, Word y ZIP. Cada comisión tiene micrositio con dictámenes y cuadros comparativos como anexos.

**Senado**: https://www.senado.gob.mx/ — La Gaceta del Senado (https://www.senado.gob.mx/66/gaceta_del_senado/) publica dictámenes con comparativos. El Instituto Belisario Domínguez ofrece la serie "Cuadros Analíticos de Propuestas Legislativas" (http://bibliodigitalibd.senado.gob.mx/).

### Diario Oficial de la Federación (DOF)

**URL**: https://sidof.segob.gob.mx/

Publica los decretos finales, pero **no incluye cuadros comparativos** —solo el texto normativo promulgado. Es el **único portal federal con API documentada y funcional** (ver sección de acceso técnico).

---

## El acceso programático: realidad vs aspiración

Esta es probablemente la sección más crítica para parlamento.ai. La brecha entre lo que debería existir y lo que realmente funciona es considerable.

### Lo que funciona hoy con evidencia verificable

**API del DOF (✓ Funcional):**
- URL de datos abiertos: https://sidof.segob.gob.mx/datos_abiertos
- Endpoints disponibles: consultar diario por fecha, obtener documentos, indicadores, notas
- Formato de respuesta: JSON
- Widgets embebibles disponibles
- Apps móviles en Google Play y App Store

**Portal CKAN del Congreso de Guanajuato (✓ Funcional):**
- URL: https://datos.congresogto.gob.mx/
- **34 conjuntos de datos** con API CKAN estándar
- Único caso estatal documentado con datos abiertos legislativos estructurados
- Contacto: datos@congresogto.gob.mx

**Scraping viable de Gaceta Parlamentaria:**
- PDFs con texto extraíble
- URLs predecibles
- Sin rate limiting detectado
- Robots.txt no restrictivo

### Lo que no existe (a pesar de expectativas)

| Recurso | Estado Real |
|---------|-------------|
| API del SIL | ❌ No existe públicamente |
| API de Cámara de Diputados | ❌ No documentada |
| API del Senado | ❌ No documentada |
| Akoma Ntoso en México | ❌ No adoptado |
| Portal de datos abiertos del Congreso Federal | ❌ No existe |
| Identificadores únicos de documentos legislativos | ❌ No implementados |

### Iniciativas en desarrollo

**Estándar de Datos Legislativos de Codeando México:**
- Repositorio: https://github.com/CodeandoMexico/estandar-datos-legislativos
- Versión actual: v0.1 (90 commits, activo)
- Colaboración con Guanajuato y Jalisco
- **No es Akoma Ntoso**, es estándar propio
- Licencia CC-BY-SA-4.0

**Congreso de Jalisco:**
- Único estado con Ley de Datos Abiertos Legislativos (2021)
- Adoptó la Carta Internacional de Datos Abiertos
- Implementación parcial, sin portal CKAN verificado

### Stack técnico recomendado para extracción

Para acceder programáticamente a los datos legislativos mexicanos hoy, la única opción viable para la mayoría de fuentes es el **scraping responsable**:

- Python + BeautifulSoup/Scrapy para HTML
- pdfplumber o PyPDF2 para extracción de texto de PDFs
- Rate limiting responsable
- Monitoreo de cambios estructurales en los portales

---

## Los organismos del ecosistema legislativo

### Cámara de Diputados

- **Dirección General de Apoyo Parlamentario (DGAP)**: Elabora análisis técnicos preliminares con cuadros comparativos
- **Centro de Estudios de las Finanzas Públicas (CEFP)**: Comparativos de Ley de Ingresos y estudios de impacto presupuestario
- **Centro de Estudios de Derecho e Investigaciones Parlamentarias (CEDIP)**: Técnica legislativa especializada
- **46 comisiones ordinarias** con secretarías técnicas

### Senado de la República

- **Instituto Belisario Domínguez**: Dirección General de Análisis Legislativo produce los "Cuadros Analíticos"
- **Coordinación de Consultoría Jurídica Legislativa**: Consultores parlamentarios especializados
- **Comisiones** con secretarías técnicas propias

### Secretaría de Gobernación

- **Dirección General de Información Legislativa**: Opera el SIL como portal centralizador, aunque sin producción propia de cuadros comparativos

### DOF

- **Dirección General del Diario Oficial de la Federación**: Publicador oficial de decretos finales, único con API funcional

---

## El ecosistema de civic tech y transparencia legislativa

México cuenta con un robusto ecosistema de organizaciones de sociedad civil trabajando en transparencia parlamentaria, lo cual representa tanto aliados potenciales como validación de la demanda de mercado.

### Organizaciones líderes

**Fundar - Centro de Análisis e Investigación** (fundar.org.mx): Miembro fundador de la Alianza para el Parlamento Abierto, realiza el Diagnóstico de Parlamento Abierto evaluando los **34 cuerpos legislativos** de México con 97 indicadores.

**IMCO** (imco.org.mx): Co-impulsor de la iniciativa #3de3, publica el Diagnóstico de Parlamento Abierto y el Índice de Información Presupuestal Estatal.

**México Evalúa** (mexicoevalua.org): Análisis crítico de reformas legislativas, evaluación del Sistema Nacional Anticorrupción.

**Transparencia Mexicana** (tm.org.mx): Capítulo de Transparency International, monitorea implementación anticorrupción.

### La Alianza para el Parlamento Abierto

**URL**: https://www.parlamentoabierto.mx/

Coalición de 9+ organizaciones de sociedad civil que trabaja para que los 32 congresos locales y el Congreso de la Unión cumplan con **10 principios de parlamento abierto**. Utiliza los estándares de Opening Parliament (openingparliament.org) como referencia internacional.

### Proyectos de tecnología cívica relevantes

- **Codeando México**: Organización líder, mantiene el catálogo Awesome Civic Tech y el estándar de datos legislativos
- **Borde Político** (bordepolitico.com): Plataforma de evaluación individual de legisladores
- **Quién Me Representa** (quienmerepresenta.com.mx): Encuentra representantes por ubicación geográfica
- **3de3.mx**: Publicación voluntaria de declaraciones patrimoniales de políticos

### Oportunidad de mercado identificada

Un hallazgo crítico: **no existe un servicio comercial robusto de inteligencia legislativa en tiempo real** en México comparable a los servicios estadounidenses (Quorum, FiscalNote). El ecosistema legaltech mexicano (25+ empresas) se enfoca en gestión de despachos, automatización de contratos y seguimiento de procesos judiciales —no en monitoreo legislativo profesional. Esto representa una **oportunidad de mercado significativa** para parlamento.ai.

---

## Conexiones internacionales

México es **miembro fundador de Open Government Partnership** desde 2011, con 4 planes de acción completados y 11 miembros locales activos (incluyendo Jalisco, Nuevo León, Monterrey y Mérida). La Red Latinoamericana por la Transparencia Legislativa incluye a Fundar, Impacto Legislativo y Transparencia Mexicana como miembros, publicando el Índice Latinoamericano de Transparencia Legislativa que evalúa a México junto con Argentina, Chile, Colombia y Perú.

---

## Conclusiones operativas para parlamento.ai

**Lo que debe saberse con certeza:**

1. Los cuadros comparativos son **práctica institucional consolidada** aunque no legalmente obligatorios
2. El formato estándar es **PDF de dos columnas** (texto vigente | texto propuesto)
3. La **Gaceta Parlamentaria** es la fuente primaria para dictámenes con comparativos
4. **No existen APIs** en las cámaras del Congreso —solo el DOF tiene servicios web funcionales
5. El **scraping es la única vía técnica viable** para acceso masivo a datos legislativos federales
6. **Guanajuato** es el modelo a seguir a nivel estatal con su portal CKAN

**Riesgos a considerar:**

- Fragilidad del scraping ante cambios en estructura de portales
- PDFs de baja calidad en documentos escaneados del Senado
- Nueva Ley General de Transparencia (2025) genera incertidumbre sobre acceso a información
- Ausencia de identificadores únicos dificulta el tracking longitudinal de iniciativas

**Aliados estratégicos potenciales:**

La Alianza para el Parlamento Abierto, Codeando México y el Congreso de Guanajuato son actores con intereses alineados que podrían facilitar acceso a datos, validar el producto y proporcionar legitimidad en el espacio de transparencia legislativa mexicano.