# Sistema de comparados legislativos en Alemania: guía técnica completa

El sistema alemán de **Synopsen** (comparados legislativos) está en plena transición tecnológica. Hoy funciona con herramientas basadas en Word (eNorm) y un formato XML propietario, mientras que para **2027** se planea migrar a un estándar moderno basado en Akoma Ntoso. La buena noticia para desarrolladores: existe una **API oficial del Bundestag** bien documentada con datos desde 1949, aunque las Synopsen no se generan automáticamente sino que aparecen como PDFs dentro de los documentos de comisiones.

---

## 1. Terminología y definiciones oficiales

### Los términos oficiales en Alemania

El término oficial es **"Synopse"**, utilizado tanto en la GGO (Reglamento Común de los Ministerios Federales) como en la GOBT (Reglamento del Bundestag). Otros términos equivalentes son **"Gegenüberstellung"** (confrontación) y **"Zusammenstellung"** (compilación) —este último aparece frecuentemente en los documentos de comisiones. El término **"Textgegenüberstellung"** es más común en Austria, donde estas comparaciones son obligatorias.

### Definición formal en la GGO §42

La versión actualizada de junio 2024 del §42 de la GGO establece:

> *"Gesetzesvorlagen zu Änderungsgesetzen soll eine Synopse beigefügt werden, die die aktuelle Rechtslage den geplanten Änderungen gegenüberstellt. Die Synopse ist nicht Bestandteil des rechtsverbindlichen Textes der Gesetzesvorlage."*

**Traducción:** A los proyectos de ley de enmienda se les debe adjuntar una sinopsis que compare la situación jurídica actual con los cambios previstos. La sinopsis NO es parte del texto jurídicamente vinculante.

### Distinción clave: "soll" vs. "muss"

En derecho administrativo alemán, **"soll"** (debe/debería) implica una obligación relativa —más fuerte que "kann" (puede) pero menos que "muss" (tiene que). Esto significa que la sinopsis es **prácticamente obligatoria salvo circunstancias excepcionales justificadas**, no una simple recomendación.

### Quién produce las Synopsen

| Productor | Tipo de documentos | Obligatoriedad |
|-----------|-------------------|----------------|
| **Ministerios federales** | Proyectos de ley del gobierno (Regierungsentwürfe) | Soll-Vorschrift desde 2024 (§42 GGO) |
| **Secretarías de comisión (Ausschusssekretariate)** | Beschlussempfehlungen con cambios | Práctica estándar |
| **Fraktionen** (grupos parlamentarios) | Proyectos propios de diputados | Soll-Vorschrift (§76 GOBT) |
| **Servicio Científico** | NO produce sistemáticamente | Solo a solicitud en contexto de análisis |

**URLs de referencia:**
- GGO completa: https://www.bmi.bund.de/SharedDocs/downloads/DE/veroeffentlichungen/themen/ministerium/ggo.pdf
- GGO online: https://www.verwaltungsvorschriften-im-internet.de/bsvwvbund_21072009_O11313012.htm
- GOBT §76: https://www.gesetze-im-internet.de/btgo_1980/__76.html

---

## 2. El proceso legislativo y dónde aparecen los comparados

### Flujo completo de un proyecto de ley

```
1. INICIATIVA
   ├── Gobierno Federal (mayoría de casos)
   │   └── Ministerio → Bundeskabinett → Bundesrat (1er paso) → Bundestag
   ├── Bundesrat
   │   └── Beschluss → Gobierno (opinión) → Bundestag
   └── Bundestag (Fraktion o 5% de diputados)
       └── Directamente al Bundestag

2. PRIMERA LECTURA (Bundestag)
   └── Debate → Remisión a comités

3. DELIBERACIÓN EN COMITÉS
   ├── Comité principal (federführend)
   ├── Comités consultivos (mitberatend)
   └── Posibles audiencias públicas
   
4. SEGUNDA Y TERCERA LECTURA (Bundestag)
   ├── Debate sobre Beschlussempfehlung
   └── Votación final

5. BUNDESRAT (2do paso)
   ├── Zustimmung (aprobación directa)
   ├── Vermittlungsausschuss (mediación)
   └── Einspruch (objeción - puede ser superada)

6. FIRMA
   ├── Bundeskanzler
   ├── Ministro responsable
   └── Bundespräsident (Ausfertigung)

7. PUBLICACIÓN en Bundesgesetzblatt → Entrada en vigor
```

### Etapas donde se producen Synopsen

| Etapa | ¿Synopse? | Obligatoriedad | Productor |
|-------|-----------|----------------|-----------|
| Referentenentwurf (borrador ministerial) | Sí | Soll (desde 2024) | Ministerio |
| Kabinettvorlage (proyecto al gabinete) | Sí | Soll | Ministerio |
| Bundesrat 1er paso | A solicitud | Facultativo (§53 GGO) | Ministerio |
| **Comité del Bundestag** | **Sí (frecuente)** | Práctica estándar | Ausschusssekretariat |
| **Beschlussempfehlung** | **Sí (frecuente)** | Práctica estándar | Ausschusssekretariat |
| Vermittlungsausschuss | A solicitud | Facultativo | Variable |

### El §53(2) de la GGO en detalle

Este artículo regula específicamente las sinopsis **a solicitud del comité** para comparar tres versiones:

> *"Auf Anforderung des zuständigen Ausschusses des Deutschen Bundestages übersendet das federführende Bundesministerium dem Ausschuss [...] eine Synopse, die die Darstellung des Gesetzestextes der Regierungsvorlage, des Votums in der Stellungnahme des Bundesrates und des Votums in der Gegenäußerung der Bundesregierung enthält."*

Es decir: proyecto gubernamental + posición del Bundesrat + contrapropuesta del gobierno, todo en una tabla comparativa.

### La propuesta de Die Linke (2021) y su destino

**Drucksache 19/26537** del 9 de febrero de 2021, titulada "Gesetzgebung transparenter machen – Gesetzentwürfen immer eine Synopse beifügen", proponía hacer obligatorias las sinopsis para todos los proyectos de ley de enmienda.

**¿Qué pasó?**
1. La propuesta fue remitida al Geschäftsordnungsausschuss (Comité de Reglamento)
2. SPD, FDP y Grüne expresaron objeciones argumentando que las sinopsis serían innecesarias para leyes simples
3. La legislatura 19 terminó en septiembre 2021 sin votación en pleno
4. Por el principio de **Diskontinuität**, la propuesta caducó

**Sin embargo, tuvo impacto indirecto:** El Koalitionsvertrag 2021 de la coalición semáforo incluyó el compromiso de introducir sinopsis, y en **marzo 2024** el gobierno aprobó la reforma de la GGO que estableció la "Synopsenpflicht" vigente desde junio 2024.

**Fuentes:**
- Propuesta: https://www.lto.de/recht/nachrichten/n/die-linke-bundestag-antrag-gesetzentwurf-synopse-gesetzgebung-verstaendlicher-trasparenter-gegenueberstellung-wortlaut
- Análisis académico: https://verfassungsblog.de/die-lesbarkeit-von-gesetzentwurfen/

---

## 3. Formato y estructura de los documentos

### Formato físico de las Synopsen

| Aspecto | Especificación |
|---------|----------------|
| **Formato principal** | PDF con texto seleccionable (no escaneado) |
| **Firma electrónica** | No en Drucksachen parlamentarias |
| **Formato interno** | Word con complemento eNorm |
| **Exportación** | PDF, XML (LegalDocML.de desde 2027) |

### Estructura estandarizada: tabla de dos columnas

La estructura está regulada por el **Handbuch der Rechtsförmlichkeit (HdR)**, 4ª edición 2024. El formato estándar es:

| Columna izquierda | Columna derecha |
|-------------------|-----------------|
| Texto vigente / Entwurf (proyecto original) | Beschlüsse des Ausschusses (decisiones del comité) |
| Se mantiene **sin cambios** | Se introducen **todas las modificaciones** |

### Sistema de marcado de diferencias

El sistema tipográfico es consistente:

| Tipo de cambio | Columna izquierda | Columna derecha |
|----------------|-------------------|-----------------|
| **Texto eliminado** | *Cursiva* | (vacío o texto nuevo) |
| **Texto añadido** | (vacío) | **Negrita** |
| **Sin cambios** | Texto normal | "**u n v e r ä n d e r t**" (espaciado) |
| **Párrafo eliminado** | *Texto completo en cursiva* | "**entfällt**" (en negrita) |

**Importante:** Los documentos oficiales **NO usan colores**, solo tipografía. Las versiones web de terceros (dejure.org, buzer.de) sí usan colores para facilitar la lectura.

### Ejemplos concretos con URLs

**Documentos de comisiones del Bundestag (Beschlussempfehlungen con Zusammenstellung):**
- https://dserver.bundestag.de/btd/21/031/2103104.pdf — Steueränderungsgesetz 2025, ejemplo completo de sinopsis
- https://dserver.bundestag.de/btd/20/130/2013015.pdf — Bürokratieentlastungsgesetz IV
- https://dserver.bundestag.de/btd/21/039/2103907.pdf — Ejemplo reciente

**Synopsen comparativas históricas:**
- https://www.bundestag.de/resource/blob/190442/578f04736a4f4ea2920883d79cc8be36/verfassungen_synopse.pdf — Comparación de constituciones alemanas 1849-1949 (4 columnas)

**Synopsen online interactivas (con colores):**
- https://dejure.org/grundgesetz-synopse.php — Reforma del Federalismo 2006
- https://www.buzer.de/gesetz/6597/l.htm — Historial de cambios del BGB

### El software eNorm y la creación de Synopsen

**eNorm** es un complemento para Microsoft Word desarrollado por DIaLOGIKa GmbH, mantenido por el Ministerio Federal de Justicia (BMJ), y **es el sistema en uso productivo desde 2005**.

**Proceso de creación de una sinopsis con eNorm:**
1. Descargar ley vigente de gesetze-im-internet.de en XML
2. Usar el "eNorm-Bestandsrecht-Konverter" para convertir XML → documento Word/eNorm
3. Aplicar función "Arbeitsdokument erstellen"
4. Usar "Synopsendokument erstellen" para generar tabla comparativa de 2 columnas

**URL oficial:** https://www.enorm.bund.de/

---

## 4. Portales y sistemas de publicación

### Mapa completo de portales

| Portal | URL | Contenido | Synopsen | Estado |
|--------|-----|-----------|----------|--------|
| **DIP** | https://dip.bundestag.de/ | Drucksachen, Protokolle, Vorgänge | Dentro de documentos PDF | ✅ Activo |
| **Open Data Bundestag** | https://www.bundestag.de/services/opendata | XML/JSON desde 1949 | No directamente | ✅ Activo |
| **gesetze-im-internet.de** | https://www.gesetze-im-internet.de/ | Leyes vigentes consolidadas | ❌ No | ✅ Activo |
| **recht.bund.de** | https://www.recht.bund.de/ | BGBl oficial desde 2023 | ❌ No | ✅ Activo |
| **bgbl.de** | https://www.bgbl.de/ | Archivo BGBl 1949-2022 | ❌ No | ✅ Activo |
| **Bundesrat** | https://www.bundesrat.de/ | Drucksachen BR | ❌ No | ✅ Activo |
| **Parlamentsspiegel** | https://www.parlamentsspiegel.de/ | Docs 16 Landtage | ❌ No | ✅ Activo |

### DIP (Dokumentations- und Informationssystem)

El sistema DIP es la **fuente principal** para seguimiento legislativo. Es un sistema conjunto del Bundestag y Bundesrat lanzado en mayo 2021.

**Cobertura histórica:**
- Procedimientos legislativos completos: desde la 8ª legislatura (1976)
- Documentos del Bundestag: desde la 1ª legislatura (**7 septiembre 1949**) como facsímiles
- Búsqueda de texto completo: Bundestag desde 1949; Bundesrat desde 2003

**Sobre Synopsen en DIP:** El sistema NO genera synopses automáticamente, pero los documentos PDF de las Beschlussempfehlungen de comités suelen incluir una "Zusammenstellung" con la tabla comparativa.

### GESTA: sistema predecesor

GESTA (Stand der Gesetzgebung) fue **reemplazado por DIP**. Los números GESTA aún aparecen en el Bundesgesetzblatt como referencia cruzada. URL archivada: https://webarchiv.bundestag.de/archive/2007/0206/htdocs_e/documents/gesta.html

### Portales externos con Synopsen automáticas

Dado que los portales oficiales **no ofrecen synopses automáticas**, existen servicios externos:

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **dejure.org** | https://dejure.org/BGBl | Synopsen del Grundgesetz y seguimiento BGBl |
| **buzer.de** | https://www.buzer.de/ | Gegenüberstellungen de cambios legales |
| **rewis.io** | https://rewis.io/aktuell/synopsen/ | Synopsen automáticas desde 2019 |

---

## 5. API del DIP y acceso programático

### API oficial del Bundestag

**Existe una API oficial bien documentada:**

- **URL base:** `https://search.dip.bundestag.de/api/v1`
- **Documentación Swagger:** https://search.dip.bundestag.de/api/v1/swagger-ui/
- **Documentación PDF:** https://dip.bundestag.de/documents/informationsblatt_zur_dip_api.pdf
- **Ayuda:** https://dip.bundestag.de/über-dip/hilfe/api#content

### Endpoints disponibles

| Endpoint | Descripción |
|----------|-------------|
| `/aktivitaet` | Actividades parlamentarias |
| `/drucksache` | Documentos impresos (Drucksachen) |
| `/drucksache-text` | Textos completos |
| `/plenarprotokoll` | Protocolos plenarios |
| `/plenarprotokoll-text` | Textos completos de protocolos |
| `/vorgang` | Procedimientos legislativos |
| `/person` | Datos de diputados |

### Autenticación

**API Key pública temporal (válida hasta mayo 2026):**
```
OSOegLs.PR2lwJ1dwCeje9vTj7FPOt3hvpYKtwKkhw
```

**Uso:**
```bash
# Header HTTP
Authorization: ApiKey OSOegLs.PR2lwJ1dwCeje9vTj7FPOt3hvpYKtwKkhw

# O parámetro GET
?apikey=OSOegLs.PR2lwJ1dwCeje9vTj7FPOt3hvpYKtwKkhw
```

Para API key personal: contactar `parlamentsdokumentation@bundestag.de`

### Formatos y límites

- **Formatos:** JSON (default), XML
- **Límites:** máx. 25 peticiones simultáneas recomendadas, 100 entidades por respuesta, 10 para textos completos
- **Paginación:** sistema basado en cursor

### Ejemplo de respuesta JSON

```json
{
  "id": "908",
  "typ": "Dokument",
  "dokumentart": "Plenarprotokoll",
  "titel": "Protokoll der 1. Sitzung des 19. Deutschen Bundestages",
  "dokumentnummer": "19/1",
  "wahlperiode": 19,
  "datum": "2017-10-24",
  "fundstelle": {
    "pdf_url": "https://dserver.bundestag.de/btp/19/19001.pdf"
  }
}
```

### Clientes de programación

**Python (PyPI):**
```bash
pip install deutschland[dip_bundestag]
# o
pip install de-dip-bundestag
```

- PyPI: https://pypi.org/project/de-dip-bundestag/
- GitHub: https://github.com/bundesAPI/dip-bundestag-api

### Portal Open Data del Bundestag

**URL:** https://www.bundestag.de/services/opendata

**Datasets disponibles para bulk download:**
- Plenarprotokolle (XML, JSON) desde 1949
- Drucksachen (XML, JSON) desde 1949
- Stammdaten de diputados (XML) desde 1949
- Abstimmungslisten (XLSX) actuales

**Descarga directa Stammdaten:** https://www.bundestag.de/resource/blob/472878/MdB-Stammdaten.zip

### gesetze-im-internet.de: acceso programático

**No tiene API oficial**, pero ofrece:
- Índice XML actualizado diario: `https://www.gesetze-im-internet.de/gii-toc.xml`
- DTD de estructura: `https://www.gesetze-im-internet.de/dtd/1.01/gii-norm.dtd`
- Cada ley disponible en XML, PDF, EPUB, HTML

### Archivo histórico: 75,000+ documentos desde 1949

El proyecto de digitalización completado en 2013-2014 por Bundesdruckerei incluye:
- **100% de Plenarprotokolle** 1949-presente digitalizados
- **100% de Drucksachen** 1949-presente
- **1.25 millones de páginas** con OCR de 99.8% de precisión
- Audio histórico 1949-1953 disponible en Mediathek

**Nota importante:** La API DIP tiene datos estructurados completos desde la 8ª WP (1976). Los documentos 1949-1976 están como PDFs descargables con menos metadatos estructurados.

### Repositorios GitHub relevantes

| Repositorio | Descripción | URL |
|-------------|-------------|-----|
| bundesAPI/dip-bundestag-api | Cliente Python oficial | https://github.com/bundesAPI/dip-bundestag-api |
| bundestag/gesetze | Todas las leyes federales en Markdown | https://github.com/bundestag/gesetze |
| QuantLaw/gesetze-im-internet | Archivo diario desde 2019 | https://github.com/QuantLaw/gesetze-im-internet |
| bundesAPI | Portal de documentación de APIs gubernamentales | https://bund.dev/ |

---

## 6. Estándares técnicos: hoy vs. futuro

### Lo que funciona HOY (en producción)

| Sistema | Descripción | Desde |
|---------|-------------|-------|
| **eNorm** | Complemento Word para redacción legislativa | 2005 |
| **DTD gii-norm** | XML propietario de gesetze-im-internet.de | ~2002 |
| **recht.bund.de** | BGBl electrónico oficial | 2023 |

### LegalDocML.de: el futuro (en desarrollo)

**LegalDocML.de** es el perfil de aplicación alemán del estándar OASIS LegalDocML, basado en Akoma Ntoso.

- **Versión 1.0:** publicada en marzo 2020
- **Desarrollador:** Bundesministerium des Innern und für Heimat (BMI)
- **Proyecto marco:** "Elektronisches Gesetzgebungsverfahren (E-Gesetzgebung)"

**Timeline según Drucksache 20/13400 (octubre 2024):**
- **Fase de transición:** julio 2025 - enero 2026
- **Uso unificado obligatorio:** enero/julio 2027

**URLs:**
- Página oficial: http://egesetzgebung.bund.de/legaldocml.html
- Especificación (vía FragDenStaat): https://fragdenstaat.de/dokumente/8670-spezifikation-legaldocmlde-xml-standard-fur-dokumente-der-bundesrechtsetzung/
- Repositorio código: https://gitlab.opencode.de/bmi/e-gesetzgebung

### Relación de estándares

```
Akoma Ntoso (UN, 2004)
    ↓
OASIS LegalDocML (v1.0 agosto 2018)
    ↓
LegalDocML.de (perfil alemán, v1.0 marzo 2020)
```

LegalDocML.de es un **subesquema restrictivo** de Akoma Ntoso, adaptado a requisitos alemanes como el Handbuch der Rechtsförmlichkeit y la GGO.

### ELI (European Legislation Identifier)

Alemania participa en el ELI Task Force pero la implementación es **parcial**:
- gesetze-im-internet.de: NO implementa ELI URIs
- recht.bund.de: sin evidencia de ELI
- El estándar LegalDocML.de menciona compatibilidad pero no hay implementación visible

---

## 7. Realidad vs. aspiración: tabla resumen

### ✅ Funciona hoy (en uso diario)

| Componente | Estado | Desde |
|------------|--------|-------|
| API DIP oficial con JSON/XML | Activo | 2021 |
| Portal Open Data con bulk downloads | Activo | — |
| eNorm para redacción legislativa | Activo | 2005 |
| gesetze-im-internet.de con XML | Activo | ~2002 |
| recht.bund.de (BGBl electrónico) | Activo | 2023 |
| Synopsen en PDFs de comisiones | Práctica estándar | — |
| Synopsenpflicht §42 GGO | Vigente | Junio 2024 |

### 🔄 En desarrollo/piloto

| Componente | Timeline | Fuente |
|------------|----------|--------|
| E-Gesetzgebung (plataforma completa) | Obligatorio 2027 | Drucksache 20/13400 |
| LegalDocML.de (estándar XML) | En pruebas | BMI |
| Editor E-Gesetzgebung | Transición desde julio 2025 | BMI |
| Synopsen automáticas "auf Knopfdruck" | En desarrollo | GGO reform 2024 |

### ⚠️ Anunciado pero no implementado

| Concepto | Estado |
|----------|--------|
| URI-Konzept para LegalDocML.de | Pendiente ("liegt bislang noch nicht vor") |
| Integración ELI completa | Solo participación en grupo de trabajo |
| Interoperabilidad activa con EUR-Lex | Sin implementación |

---

## 8. Organismos involucrados

| Organismo | Rol en comparados legislativos |
|-----------|-------------------------------|
| **Bundestag** | Publicación de Drucksachen con Zusammenstellungen vía comités |
| **Ausschusssekretariate** | Producción directa de synopses para Beschlussempfehlungen |
| **Ministerios federales** | Synopsen obligatorias desde 2024 para proyectos gubernamentales |
| **Bundesministerium der Justiz (BMJ)** | Mantiene eNorm y Handbuch der Rechtsförmlichkeit |
| **Bundesministerium des Innern (BMI)** | Proyecto E-Gesetzgebung y LegalDocML.de |
| **Bundesrat** | Sistema de documentación paralelo, sin synopses automáticas |
| **Bundesamt für Justiz (BfJ)** | Mantiene gesetze-im-internet.de |
| **Bundesanzeiger Verlag** | Archivo histórico BGBl (bgbl.de) |

---

## 9. Ecosistema civic tech

### Organizaciones activas (enero 2026)

| Organización | URL | API/Datos | Relevancia |
|--------------|-----|-----------|------------|
| **FragDenStaat** | https://fragdenstaat.de/ | Sí, API pública | Acceso a información, campaña "Gläserne Gesetze" |
| **abgeordnetenwatch.de** | https://www.abgeordnetenwatch.de/ | Sí, API v2 CC0 | Perfiles de políticos, votaciones |
| **OKFN DE** | https://okfn.de/ | — | Organización paraguas |
| **LobbyControl** | https://lobbycontrol.de/ | Lobbypedia | Monitoreo de lobbying |
| **OffeneGesetze** | https://offenegesetze.de/ | Sí, API JSON | BGBl histórico (ahora parcialmente redundante) |

### APIs de sociedad civil disponibles

**abgeordnetenwatch API v2** (CC0):
- URL: https://www.abgeordnetenwatch.de/api/v2/
- Endpoints: `/politicians`, `/polls`, `/votes`, `/parliaments`
- Cobertura: Bundestag, Europaparlament, 16 Landtage

**FragDenStaat API**:
- URL: https://fragdenstaat.de/api/
- Documentación completa disponible

**Lobbyregister API** (oficial):
- URL: https://www.lobbyregister.bundestag.de/
- API V2 lanzada junio 2025
- Más de 6,000 entidades registradas

### Proyectos finalizados pero con datos útiles

- **OffenesParlament** (https://offenesparlament.de/) — Protocolos 18ª WP, datos bajo CC0, proyecto archivado
- **KleineAnfragen** — Archivo 2013-2019 de preguntas parlamentarias menores
- **SehrGutachten** — Dictámenes del Servicio Científico (ahora publicados oficialmente)

### Recursos para desarrolladores

| Recurso | URL |
|---------|-----|
| bundesAPI (documentación OpenAPI) | https://bund.dev/ |
| GitHub bundesAPI | https://github.com/bundesAPI |
| GitHub OKFN DE | https://github.com/okfde (193 repos) |
| GitHub bundestag | https://github.com/bundestag |

---

## 10. Recomendaciones técnicas para parlamento.ai

### Para tracking legislativo básico

1. **Usar la API DIP** como fuente principal para:
   - Vorgänge (procedimientos): seguimiento del estado de cada proyecto
   - Drucksachen: acceso a documentos completos incluyendo synopses en PDFs
   - Metadatos estructurados desde 1976

2. **Complementar con Open Data** para bulk processing de documentos históricos en XML/JSON

3. **Para synopses automáticas**, considerar:
   - Extraer el texto de los PDFs de Beschlussempfehlungen que incluyen "Zusammenstellung"
   - O generar synopses propias comparando versiones de leyes de gesetze-im-internet.de

### Para generación de synopses propias

El formato XML de gesetze-im-internet.de (`gii-norm.dtd`) permite:
1. Descargar versiones consolidadas actuales
2. Usar el archivo diario de QuantLaw (https://github.com/QuantLaw/gesetze-im-internet) para versiones históricas
3. Comparar con diff estructurado para generar synopses automáticas

### Limitaciones actuales a considerar

- Las synopses oficiales **no están en formato estructurado** —están embebidas como tablas en PDFs
- El XML de gesetze-im-internet.de **no usa estándares internacionales** (no es Akoma Ntoso)
- La transición a LegalDocML.de en 2027 podría cambiar significativamente los formatos disponibles

### Contactos oficiales

- API DIP: `parlamentsdokumentation@bundestag.de`
- E-Gesetzgebung: Proyecto en https://www.cio.bund.de/Webs/CIO/DE/digitale-loesungen/it-konsolidierung/dienstekonsolidierung/it-massnahmen/e-gesetzgebung/
- Handbuch der Rechtsförmlichkeit: https://hdr4.bmj.de/

---

## Conclusión

El sistema alemán de comparados legislativos está **en plena transición**. Hoy funciona con herramientas maduras pero técnicamente anticuadas (eNorm/Word + XML propietario), mientras que para 2027 se planea un ecosistema moderno basado en LegalDocML.de. Para desarrolladores, la API del DIP ofrece acceso robusto a metadatos y documentos, pero las synopses siguen siendo principalmente PDFs embebidos en documentos de comisiones, no datos estructurados. La oportunidad para parlamento.ai está en generar valor añadido mediante synopses automáticas —algo que los portales oficiales alemanes aún no ofrecen.