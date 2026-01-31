# Documentos comparativos legislativos en España: guía técnica completa

Los documentos que comparan versiones de leyes durante su tramitación en España **no siguen un formato estandarizado legible por máquina**. El sistema produce documentos en PDF que, aunque técnicamente contienen texto seleccionable, no están diseñados para procesamiento automatizado tipo "git diff". Sin embargo, existe una arquitectura de datos públicos fragmentada pero funcional que permite reconstruir el historial de cambios combinando múltiples fuentes.

La pieza más valiosa es la **API REST del BOE**, que ofrece legislación consolidada en XML con todas las versiones históricas de cada artículo. Para textos en tramitación parlamentaria, la situación es más precaria: los documentos del BOCG (Boletín Oficial de las Cortes Generales) se publican exclusivamente en PDF, aunque con URLs predecibles que permiten scraping sistemático.

---

## Terminología oficial y marco normativo

En el derecho parlamentario español **no existe un término oficial único** para "documento comparativo" en el sentido técnico de mostrar diferencias entre versiones. Los letrados de las Cortes y la documentación oficial utilizan varios términos para documentos que cumplen funciones comparativas parciales:

El **informe de ponencia** es el documento más cercano a un comparativo en la fase de Comisión. Según el artículo 113 del Reglamento del Congreso, la Ponencia (grupo de trabajo designado por la Comisión) examina el texto original y las enmiendas presentadas, proponiendo un texto consolidado. El artículo 45 del mismo Reglamento especifica que los letrados "redactarán sus correspondientes informes y dictámenes, recogiendo los acuerdos adoptados".

El **mensaje motivado del Senado** es el único documento que utiliza formalmente un **formato de doble columna** para mostrar cambios. Cuando el Senado introduce enmiendas a un proyecto de ley, lo devuelve al Congreso con este documento según el artículo 90.2 de la Constitución Española. La columna izquierda muestra el texto original remitido por el Congreso y la columna derecha las modificaciones del Senado, con los cambios destacados en **negrita**.

El **dictamen de Comisión** recoge el texto resultante tras el debate en Comisión, incorporando las enmiendas aprobadas respecto al informe de ponencia. Los **textos a doble columna** o **cuadros comparativos** son formatos auxiliares que los servicios técnicos pueden elaborar, pero no están estandarizados ni garantizados.

### Quién elabora estos documentos

La responsabilidad técnica de redacción recae en el **Cuerpo de Letrados de las Cortes Generales**. Según el artículo 8 del Estatuto del Personal de las Cortes Generales, corresponde a este cuerpo "la redacción, de conformidad con los acuerdos adoptados por dichos órganos, de las resoluciones, informes y dictámenes". En la práctica, cada Comisión tiene letrados adscritos que redactan materialmente los documentos, mientras que los ponentes (parlamentarios) toman las decisiones políticas sobre qué enmiendas aceptar o rechazar.

---

## El proceso legislativo y dónde aparecen los comparados

El procedimiento legislativo ordinario español tiene tres fases principales con múltiples puntos donde se generan documentos que permiten comparar versiones.

### Fase inicial

La iniciativa legislativa puede ser un **proyecto de ley** (origen en el Gobierno, no requiere toma en consideración) o una **proposición de ley** (origen en grupos parlamentarios, Comunidades Autónomas o iniciativa popular, requiere votación de toma en consideración en Pleno). Una vez admitida, se publica en el BOCG y se abre plazo de **15 días** para presentar enmiendas según el artículo 110 del Reglamento del Congreso.

### Fase constitutiva en el Congreso

Tras el debate de totalidad (si hay enmiendas a la totalidad), la Comisión nombra una **Ponencia** compuesta por representantes de los distintos grupos parlamentarios. Esta Ponencia tiene **15 días** para elaborar el informe de ponencia (artículo 113 RC).

El **informe de ponencia** es el primer documento comparativo implícito del proceso. Contiene:
- Relación de todas las enmiendas presentadas
- Análisis artículo por artículo
- Propuesta de la Ponencia (aceptación, rechazo o transacción de cada enmienda)
- Texto articulado completo con las modificaciones incorporadas
- Enmiendas rechazadas (para posible defensa como votos particulares)

El debate en Comisión se realiza artículo por artículo (artículo 114 RC), generando el **dictamen de Comisión** como segundo documento comparativo implícito. Posteriormente el Pleno del Congreso debate y aprueba el texto, que se remite al Senado.

### Fase constitutiva en el Senado

El Senado dispone de **2 meses** (o 20 días en tramitación urgente) para aprobar, vetar o enmendar el texto del Congreso. Si introduce enmiendas, lo devuelve con el **mensaje motivado**, único documento que utiliza formato comparativo explícito con dos columnas.

### Etapas donde se producen documentos comparativos

| Etapa | Documento | Tipo de comparación |
|-------|-----------|---------------------|
| Congreso - Ponencia | Informe de Ponencia | Texto inicial vs. enmiendas (implícito) |
| Congreso - Comisión | Dictamen de Comisión | Texto de ponencia vs. enmiendas de comisión (implícito) |
| Senado - Ponencia | Informe de Ponencia | Texto del Congreso vs. enmiendas senatoriales (implícito) |
| Senado - Comisión | Dictamen de Comisión | Texto modificado (implícito) |
| Senado → Congreso | **Mensaje motivado** | **Dos columnas explícitas** con cambios en negrita |

### Diferencias entre proyectos y proposiciones de ley

En cuanto a documentos comparativos, **no hay diferencias sustanciales** en el procedimiento una vez iniciada la tramitación. Ambos tipos siguen el mismo flujo. La única diferencia notable es que los proyectos de ley incluyen documentación previa del Gobierno (Memoria del Análisis de Impacto Normativo, dictámenes del Consejo de Estado) que permite comparar la evolución del texto desde fases anteriores.

---

## Formato técnico de los documentos

### Características de los PDFs del BOCG

Los documentos del Boletín Oficial de las Cortes Generales son **PDFs con texto seleccionable** (no imágenes escaneadas). Incluyen:

- **Sello electrónico de Administración Pública** como firma digital
- **Código de Verificación Electrónica (CVE)** en cada página para autenticación
- Metadatos básicos en las propiedades del documento
- Texto estructurado que permite extracción mediante herramientas de parsing

Los documentos **no son PDF/A** específicamente, pero están firmados electrónicamente. El formato técnico es PDF convencional generado probablemente desde procesadores de texto como Word, aunque no hay documentación oficial sobre el flujo de producción.

### Estructura del mensaje motivado del Senado

El formato de doble columna del mensaje motivado sigue esta estructura:

1. **Encabezamiento** con identificación de la iniciativa
2. **Explicación narrativa** de cada enmienda aprobada ("Como consecuencia de la aprobación de la enmienda núm. X del Grupo Parlamentario Y...")
3. **Tabla a dos columnas**:
   - Columna izquierda: Texto remitido por el Congreso (con correcciones técnicas en negrita)
   - Columna derecha: Texto con enmiendas aprobadas por el Senado

### Ejemplos concretos con URLs

**Mensaje motivado - Ley de prevención del desperdicio alimentario** (marzo 2025):
`https://www.congreso.es/public_oficiales/L15/CONG/BOCG/A/BOCG-15-A-4-8.PDF`

**Mensaje motivado - Ley de atención al cliente**:
`https://www.congreso.es/public_oficiales/L15/CONG/BOCG/A/BOCG-15-A-12-8.PDF`

**Informe de Ponencia - Ley de Vivienda** (abril 2023):
BOCG. Congreso de los Diputados Núm. A-89-4 de 24/04/2023

### Patrón de URLs predecibles

Los documentos del BOCG siguen un patrón sistemático que facilita el scraping:

```
https://www.congreso.es/public_oficiales/L[LEGISLATURA]/CONG/BOCG/[SERIE]/BOCG-[LEG]-[SERIE]-[NUM]-[FASE].PDF
```

Donde:
- **Serie A**: Proyectos de ley
- **Serie B**: Proposiciones de ley
- **Serie C**: Tratados internacionales
- **Serie D**: General (composición, control del Gobierno)

Y los sufijos de fase:
- `-1`: Texto inicial
- `-2 a -n`: Enmiendas presentadas
- `-4`: Informe de Ponencia (típicamente)
- `-5`: Dictamen de Comisión
- `-8`: Enmiendas del Senado mediante mensaje motivado

---

## Portales y sistemas de publicación

### Congreso de los Diputados (congreso.es)

El portal ofrece acceso completo a la documentación legislativa pero con limitaciones para acceso automatizado.

**Secciones principales**:
- Búsqueda de iniciativas: `https://www.congreso.es/busqueda-de-iniciativas`
- Proyectos de ley: `https://www.congreso.es/proyectos-de-ley`
- Proposiciones de ley: `https://www.congreso.es/proposiciones-de-ley`
- Últimas publicaciones oficiales: `https://www.congreso.es/ultimas-publicaciones-oficiales`

**Portal de Datos Abiertos**: `https://www.congreso.es/datos-abiertos`

Ofrece datasets descargables en **XML, JSON y CSV** para:
- Votaciones (por sesión plenaria, detalle de votos, por legislatura)
- Diputados (activos, histórico, declaraciones de intereses)
- Iniciativas (metadatos, no textos completos)
- Intervenciones
- Órganos del Congreso

**Limitación crítica**: Los datos de iniciativas son **metadatos**, no el texto completo de los documentos. No hay API para textos de proyectos de ley en distintas versiones, enmiendas ni informes de ponencia estructurados.

### Senado (senado.es)

El Senado tiene un portal de datos abiertos mejor estructurado para algunos datos específicos.

**Portal Datos Abiertos**: `https://www.senado.es/web/relacionesciudadanos/datosabiertos/catalogodatos/`

**Ventaja importante**: El Senado **sí ofrece datos de enmiendas estructurados** en XML:
`https://www.senado.es/web/relacionesciudadanos/datosabiertos/catalogodatos/enmiendasvetos/`

Categorías disponibles:
- Pleno y Diputación Permanente (sesiones, votaciones)
- Comisiones y Ponencias
- Iniciativas legislativas (listado, fichas)
- **Enmiendas** (agrupadas por iniciativas)
- Votaciones por iniciativas
- Senadores (composición desde 1977)

Los datos se sirven mediante un servlet con URLs tipo:
`/web/ficopendataservlet?tipoFich=9&legis=15`

### BOE (boe.es) - El más completo técnicamente

El BOE publica la **ley final aprobada** tras sanción real y ofrece **legislación consolidada** (textos con todas las modificaciones integradas).

**API REST documentada y funcional**: `https://www.boe.es/datosabiertos/api/api.php`

Documentación técnica PDF: `https://www.boe.es/datosabiertos/documentos/APIconsolidada.pdf`

**Endpoints principales**:

| Endpoint | Descripción |
|----------|-------------|
| `/datosabiertos/api/legislacion-consolidada` | Búsqueda de normas consolidadas |
| `/datosabiertos/api/legislacion-consolidada/id/{id}` | Norma completa con todas sus versiones |
| `/datosabiertos/api/legislacion-consolidada/id/{id}/texto` | Texto consolidado completo |
| `/datosabiertos/api/legislacion-consolidada/id/{id}/metadatos` | Metadatos de la norma |
| `/datosabiertos/api/boe/sumario/{fecha}` | Sumario del BOE por fecha (AAAAMMDD) |

**Características técnicas**:
- Formatos de respuesta: **XML** y **JSON** (según cabecera Accept)
- Sin autenticación requerida
- Esquemas XSD descargables para validación
- Paginación mediante parámetros offset/limit
- Todas las versiones históricas de textos consolidados

**Ejemplo de uso**:
```bash
curl -X "GET" -H "Accept: application/json" "https://boe.es/datosabiertos/api/legislacion-consolidada/id/BOE-A-2015-10566"
```

**Sistema de Códigos Electrónicos**: `https://www.boe.es/biblioteca_juridica/index.php?tipo=C`
Compilaciones temáticas gratuitas en PDF y ePUB.

---

## Estándares técnicos: ELI funciona, Akoma Ntoso no existe

### ELI (European Legislation Identifier) - Implementación madura

España participa activamente en ELI desde 2017 como miembro del Task Force europeo. En 2018 la Comisión Sectorial de Administración Electrónica aprobó la "Especificación Técnica para la Implementación del ELI en España", actualizada en febrero 2022.

**El BOE implementa los 4 pilares de ELI desde diciembre 2018**:
- **+90.000** piezas de legislación identificadas con ELI
- Legislación estatal desde 29/12/1978
- Legislación autonómica publicada en el BOE
- Legislación anterior a 1978 con versión consolidada

**URLs funcionales**:
- Portal ELI: `https://www.boe.es/eli/`
- Sitemap ELI: `https://boe.es/eli/sitemap.xml`
- Feed ATOM (actualizaciones diarias): `https://boe.es/eli/eli-update-feed.atom`
- Documentación: `https://www.boe.es/legislacion/eli.php`

**Estructura de URIs ELI**:
```
https://www.boe.es/eli/es/l/2015/10/01/40       → Ley 40/2015 (HTML)
https://www.boe.es/eli/es/l/2015/10/01/40/dof/spa/xml → Versión XML
https://www.boe.es/eli/es/l/2015/10/01/40/con/20180704/spa/html → Versión consolidada
```

**Metadatos RDF** disponibles en RDFa (embebido en HTML) y RDF/XML en las páginas XML.

**Implementación regional**: País Vasco, Cataluña, Valencia, Murcia, Castilla-La Mancha, Castilla y León, Madrid, Extremadura y Baleares han implementado los pilares 1, 2 y 3. Portal de coordinación: `https://www.elidata.es/`

### Akoma Ntoso - No implementado en España

**No hay evidencia de implementación de Akoma Ntoso** en ninguna institución española. Ni el BOE, ni el Congreso, ni el Senado utilizan este estándar OASIS para documentos legislativos.

El BOE usa su propio **esquema XML propietario** (documentado en la API) con estructura como:

```xml
<response>
  <data>
    <metadatos>
      <identificador>BOE-A-2015-10566</identificador>
      <rango codigo="1300">Ley</rango>
      <url_eli>https://www.boe.es/eli/es/l/2015/10/01/40</url_eli>
    </metadatos>
    <texto>
      <bloque id="a22" tipo="precepto" titulo="Artículo 22">
        <version id_norma="BOE-A-1995-25444" fecha_publicacion="19951124">
          <p class="articulo">Artículo 22.</p>
        </version>
      </bloque>
    </texto>
  </data>
</response>
```

Las instituciones europeas (Parlamento Europeo, Comisión, Consejo) están adoptando AKN4EU, una versión de Akoma Ntoso para la UE, pero **España no participa activamente en la implementación nacional**.

---

## Acceso programático: qué funciona realmente

### APIs oficiales funcionales

| Fuente | Tipo de acceso | Calidad |
|--------|----------------|---------|
| BOE Legislación consolidada | API REST oficial | ⭐⭐⭐⭐⭐ |
| Sumarios BOE/BORME | API REST oficial | ⭐⭐⭐⭐⭐ |
| Congreso datos abiertos | Archivos estáticos XML/JSON/CSV | ⭐⭐⭐ |
| Senado datos abiertos | Archivos XML | ⭐⭐⭐⭐ |

### Feeds RSS funcionales

El BOE ofrece excelentes feeds RSS:
- Sumario completo diario: `https://www.boe.es/rss/boe.php`
- Sección I - Disposiciones generales: `/rss/boe.php?s=1`
- Legislación por temas (30+ canales): `/rss/canal_leg.php?l=l&c={codigo}`

El Congreso y Senado **no ofrecen feeds RSS públicos** para seguimiento de iniciativas.

### Scraping: viabilidad técnica

**congreso.es**: URLs predecibles, PDFs públicos y accesibles, estructura web con JavaScript moderno (puede requerir Puppeteer/Selenium). No se reportan CAPTCHAs ni bloqueos agresivos históricamente.

**senado.es**: URLs de descarga XML predecibles, menor complejidad técnica.

**boe.es**: No necesario gracias a la API oficial completa.

### Proyectos en GitHub

**quehacen/que_hacen** (`https://github.com/quehacen/que_hacen`): Programas para descarga, análisis y visualización de datos de diputados españoles. PHP principalmente, estado pre-alpha pero funcional para scraping de votaciones.

**BOE-API/BOE_API**: Wrapper no oficial para BOE en Python/PostgreSQL.

### Lo que NO está disponible programáticamente

- Textos de proyectos de ley en tramitación (requiere scraping de PDFs)
- Enmiendas del Congreso estructuradas (solo PDFs)
- Informes de ponencia estructurados
- Documentos comparativos en formato procesable
- Versiones históricas de textos en tramitación (solo versión final en BOE)

---

## Realidad versus aspiración

### Funciona hoy y está en uso diario

| Componente | Estado | Evidencia |
|------------|--------|-----------|
| API REST del BOE | Operativo desde 2018 | Documentación actualizada sept. 2025 |
| ELI en BOE (+90.000 normas) | Operativo | `https://www.boe.es/eli/` |
| Sitemap ELI + Feed ATOM | Operativo, actualización diaria | URLs funcionan |
| JSON/XML del BOE | Operativo | Header Accept configurable |
| Datos abiertos Congreso (metadatos) | Operativo | Portal funcional |
| Datos abiertos Senado (incluye enmiendas) | Operativo | XML descargable |
| ELI en 9 CCAA | Parcialmente operativo | `https://www.elidata.es/` |

### No implementado ni planificado

| Componente | Estado | Observaciones |
|------------|--------|---------------|
| Akoma Ntoso | No implementado | Ni BOE, ni Congreso, ni Senado |
| Endpoint SPARQL público | No disponible | No hay linked data queryable |
| XML estructurado para BOCG | No disponible | Solo PDF |
| Formatos diff-able tipo git | No disponible | No hay herramientas oficiales |
| API del Congreso para textos completos | No disponible | Solo metadatos |

### Anunciado pero sin evidencia de implementación

Los Planes de Gobierno Abierto (III, IV y V Plan) incluyen compromisos sobre datos abiertos pero **no mencionan específicamente la adopción de estándares como Akoma Ntoso** para documentos legislativos. España Digital 2026 tampoco incluye referencias específicas a modernización de formatos legislativos parlamentarios.

---

## Ecosistema de actores

### Organizaciones muy activas (2025-2026)

**Fundación Ciudadana Civio** (`https://civio.es/`): La organización civic tech más activa en España. Fundada en 2012, Premio Rey de España de Periodismo 2023. Actividades principales: vigilancia del poder público, periodismo de investigación, litigios por transparencia (ganaron caso BOSCO en Tribunal Supremo 2025), propuestas sobre huella legislativa y registro de lobbies. **59 repositorios públicos en GitHub** (`https://github.com/civio`) incluyendo visualizaciones presupuestarias y scrapers.

**Access Info Europe** (`https://www.access-info.org/`): Sede en Madrid, muy activa en litigios por acceso a información y advocacy por mejora de la Ley de Transparencia española. Victoria en junio 2025: tribunal ordenó al Ministerio de Exteriores entregar documentos sobre implementación UNCAC.

### Organizaciones con baja actividad reciente

**Qué Hacen los Diputados** (`http://www.quehacenlosdiputados.net/`): Proyecto histórico de seguimiento de diputados (2012-2016). La web sigue en línea pero sin actualizaciones recientes. API documentada en `http://api.saladeprensa.org/que-hacen-los-diputados`.

**OpenKratio** (`https://openkratio.org/`): Colectivo de Sevilla activo principalmente 2012-2018. 20 repositorios en GitHub. Proyectos relevantes incluyeron el Comparador de Ley de Transparencia de Andalucía (herramienta visual de diff entre proyecto y ley final). Actividad esporádica actual, principalmente asesoramiento a administraciones.

### Participación internacional

España es miembro del **Open Government Partnership (OGP)** y copresidirá el Comité de Dirección desde octubre 2024. Las únicas entidades subnacionales europeas miembros son el Ayuntamiento de Madrid y el Gobierno Vasco.

España firmó el **Convenio de Tromsø** (acceso a documentos públicos del Consejo de Europa) en noviembre 2021, pendiente de ratificación.

---

## Por qué se publican en formatos "opacos"

La respuesta a la pregunta central del desarrollador tiene componentes jurídicos y prácticos:

1. **El PDF firmado digitalmente es el documento oficial y auténtico** con valor jurídico. Los textos en XML/JSON son servicios complementarios para reutilización, sin valor oficial.

2. **No existe obligación legal** de publicar en formatos estructurados. La Ley 19/2013 de Transparencia exige publicación pero no especifica formato técnico más allá de accesibilidad.

3. **La tradición jurídica española** prioriza el documento como unidad indivisible y autenticada, no como datos estructurados.

4. **Los recursos técnicos** de las Cortes Generales se han orientado a la publicación web básica, no a la interoperabilidad semántica.

5. **La demanda de la sociedad civil** se ha centrado en acceso a información (qué se publica) más que en formato técnico (cómo se publica).

---

## Recomendaciones técnicas para parlamento.ai

### Arquitectura de datos recomendada

```
1. BOE API → Legislación vigente y consolidada (fuente principal)
2. Congreso Open Data → Metadatos de iniciativas, votaciones, diputados
3. Senado Open Data → Enmiendas estructuradas (XML), votaciones
4. Scraper personalizado → BOCG PDFs para textos en tramitación
5. Parser PDF → Extracción de informes de ponencia y enmiendas
```

### Para reconstruir el historial de cambios de una ley

1. Usar la API del BOE para descargar versiones consolidadas en XML
2. El nodo `<texto>` contiene `<bloque>` con múltiples `<version>` que permiten reconstruir el historial artículo por artículo
3. Cada bloque tiene fechas de publicación que permiten ordenar cronológicamente
4. Implementar algoritmo de diff sobre el texto de cada versión

### Para seguimiento de textos en tramitación

1. Monitorizar el BOCG mediante scraping de URLs predecibles
2. Extraer texto de PDFs usando bibliotecas como PyMuPDF o pdfplumber
3. Detectar estructura de columnas para mensajes motivados del Senado
4. Almacenar versiones con timestamps para comparación posterior

### Gaps principales a considerar

- No existe API única para todo el proceso legislativo
- Los textos de proyectos en tramitación requieren scraping
- Los documentos comparativos no están estructurados
- La "huella legislativa" completa (tracking de cambios desde origen) sigue siendo una demanda no satisfecha
- No hay estándar internacional (Akoma Ntoso) que facilite interoperabilidad

### Recursos de código abierto aprovechables

- **github.com/civio**: Scrapers y visualizaciones de presupuestos (referencia para scraping de datos públicos españoles)
- **github.com/quehacen/que_hacen**: Base técnica para scraping del Congreso
- **Proyecto OpenKratio Comparador Ley Transparencia**: Precedente de herramienta de diff legislativo en España