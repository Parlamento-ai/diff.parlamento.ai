# Pruebas manuales: Ley 31814 (Inteligencia Artificial) — PL 2775/2022-CR

> Prueba de factibilidad para generar AKN Diff con datos del Congreso de Perú.
> Proyecto de referencia: Ley 31814, aprobada el 25/05/2023 con 104-0-2 votos.

## Datos del proyecto

| Campo | Valor |
|-------|-------|
| Proyecto de Ley | 2775/2022-CR |
| Autor | José Cueto Aservi (RP) |
| Presentación | 30/06/2022 |
| Comisión 1 | Descentralización, Regionalización, Gobiernos Locales y Modernización |
| Comisión 2 | Ciencia, Innovación y Tecnología |
| Dictámenes | 2 favorables (ambos por unanimidad) |
| Pleno (1ra votación) | 25/05/2023, 17:14h — 104 a favor, 0 en contra, 2 abstenciones |
| 2da votación | Exonerada |
| Autógrafa | 13/06/2023 |
| Promulgación | 04/07/2023 (Presidenta Boluarte) |
| Publicación D.O. | 05/07/2023 (El Peruano) |
| Vigencia | 06/07/2023 |

## Fuentes probadas

### Funcionales (sin Playwright)

| # | Fuente | URL | Resultado |
|---|--------|-----|-----------|
| 1 | **El Peruano visor_html API** | `busquedas.elperuano.pe/api/visor_html/2192926-1` | HTML del texto promulgado (resumen estructurado) |
| 2 | **Archivo Digital — Texto Consolidado** | `leyes.congreso.gob.pe/Documentos/2021_2026/ADLP/Texto_Consolidado/31814-TXM.pdf` | **PDF 210KB, 4 pág, 7161 chars** — texto completo parseable con pdf-parse |
| 3 | **Archivo Digital — Ficha Técnica** | `leyes.congreso.gob.pe/Documentos/2021_2026/ADLP/Ficha_Tecnica_Espanol/31814-FTE.pdf` | **PDF 203KB, 1 pág** — fechas clave, concordancias, resumen |
| 4 | **gob.pe CDN** | `cdn.www.gob.pe/uploads/document/file/5038703/...pdf` | PDF 805KB (versión El Peruano con formato diagramado) |
| 5 | **Comunicaciones Congreso** | `comunicaciones.congreso.gob.pe/noticias/aprueban-ley-que-promueve-el-uso-de-la-inteligencia-artificial/` | Nota de prensa: fecha votación, conteo, congresistas clave |
| 6 | **gob.pe normas-legales** | `gob.pe/institucion/congreso-de-la-republica/normas-legales/4565760-31814` | Metadatos + link PDF |

### Parcialmente funcionales (con Playwright)

| # | Fuente | URL | Resultado |
|---|--------|-----|-----------|
| 1 | **Expediente Virtual** (Lotus Notes) | `www2.congreso.gob.pe/.../RepExpVirt?OpenForm&Db=202102775&View=` | **200 OK — 10159 chars**. Menú completo con URLs de todos los documentos en hidden fields. Ver detalle abajo. |
| 2 | **participacion-ciudadana-portal-service** | `wb2server.congreso.gob.pe/participacion-ciudadana-portal-service/opinion-ciudadana/estado-para-opinar` | JSON 200 OK. Único servicio API no bloqueado en wb2server. |

### Bloqueadas — Radware WAF (403)

| # | Fuente | URL | Error | Dato que tiene |
|---|--------|-----|-------|----------------|
| 1 | **spley-portal-service/archivo/** | `api.congreso.gob.pe/spley-portal-service/archivo/{base64}/pdf/{name}` | **403 Radware** (`server: rdwr`) | PDFs: proyecto, autógrafa, ley publicada |
| 2 | **spley-portal-service/** (cualquier endpoint) | `api.congreso.gob.pe/spley-portal-service/expediente/...` | **403 Radware** | API JSON del expediente |
| 3 | **service-alfresco** | `wb2server.congreso.gob.pe/service-alfresco/alfresko/detalle/...` | **401** en wb2server, **403** en api.congreso | Backend documental (Alfresco) |
| 4 | **spley-portal SPA** | `wb2server.congreso.gob.pe/spley-portal/#/expediente/2021/2775` | SPA carga shell pero Angular **no renderiza** la ruta | Tracking, timeline, documentos |
| 5 | **Votaciones Pleno** | `congreso.gob.pe/AsistenciasVotacionesPleno/...` | SPA dinámico, no renderiza | Votos nominales por congresista |

> **Nota**: `wb2server.congreso.gob.pe` redirige 301 → `api.congreso.gob.pe`. Todo `spley-portal-service` está detrás de Radware WAF.
> La página 403 es un HTML simple con Transaction ID (sin challenge JS, sin CAPTCHA).
> Intentos con headers custom (Referer, Sec-Fetch-Dest: iframe, etc.) no cambian el resultado.

### No encontradas (404)

| # | Fuente | Intentos | Resultado |
|---|--------|----------|-----------|
| 1 | Archivo Digital — Proyecto de Ley | 6 variantes en `leyes.congreso.gob.pe/Documentos/2021_2026/Proyectos_de_Ley*/PL02775*.pdf` | 404 |
| 2 | Archivo Digital — Autógrafa | 4 variantes en `leyes.congreso.gob.pe/Documentos/2021_2026/Autografas/...` | 404 |
| 3 | Archivo Digital — Directorios | `Proyectos_de_Ley/`, `Autografas/`, `ADLP/` | 404 (no hay directory listing) |
| 4 | Lotus Notes — Seguimiento | `CLProLey2021.nsf/PAporNumeroInwordc`, `ProyectosAprobadosPorGrupo` | 404 |
| 5 | Lotus Notes — visbusqptraam | `Expvirt_2021.nsf/visbusqptraam/02775?OpenDocument` | 500 Internal Server Error |

## Expediente Virtual — hallazgo clave

La URL `RepExpVirt?OpenForm&Db=202102775&View=` carga exitosamente y contiene **hidden fields** con URLs de todos los documentos:

| Hidden field | Valor | Dominio | ¿Accesible? |
|-------------|-------|---------|-------------|
| `pl_c01_u1` | `.../archivo/MTE2MTkw/pdf/31814-LEY` | spley-portal-service | **No** (403) |
| `pl_c04_u4` | `.../ADLP/Ficha_Tecnica_Espanol/31814-FTE.pdf` | leyes.congreso.gob.pe | **Sí** |
| `pl_c05_u5` | `.../archivo/MTA4MTM4/pdf/AU2775` | spley-portal-service | **No** (403) |
| `pl_c06_u6` | `.../ADLP/Texto_Consolidado/31814-TXM.pdf` | leyes.congreso.gob.pe | **Sí** |
| `pl_c07_u7` | `.../spley-portal/#/expediente/2021/2775` | spley-portal SPA | **No** (no renderiza) |
| `pl_c11_u11` | `.../ADLP/Lenguas_originarias/31814-FTQ.PDF` | leyes.congreso.gob.pe | **Sí** |
| `pl_c13_u13` | `.../ADLP/Audios_Espanol/31814-FTE_Audio.mp3` | leyes.congreso.gob.pe | **Sí** |
| `pl_c14_u14` | `.../ParCiudadana/Foro_pvp.nsf/RepOpiweb04?...` | www2.congreso.gob.pe | **Sí** |

**IDs base64 de documentos**: ODQ1OTA= → 84590 (proyecto), MTA4MTM4 → 108138 (autógrafa), MTE2MTkw → 116190 (ley publicada)

La navegación por menú funciona (formulario Lotus Notes con `num.value`):
- Menú 01 (Norma legal): iframe → spley-portal-service **(bloqueado)**
- Menú 04 (Ficha técnica): iframe → leyes.congreso.gob.pe **(funciona)**
- Menú 05 (Texto aprobado): iframe → spley-portal-service **(bloqueado)**
- Menú 06 (Texto consolidado): iframe → leyes.congreso.gob.pe **(funciona)**
- Menú 11 (Quechua): iframe → leyes.congreso.gob.pe **(funciona)**
- Menú 14 (Opiniones): iframe → Lotus Notes **(funciona)**

## Texto obtenido: Ley 31814 promulgada

Extraído de `31814-TXM.pdf` con `pdf-parse`. Ver [ley-31814-texto.txt](ley-31814-texto.txt).

**Estructura**:
- Título Preliminar: Artículo único (6 principios: a-f)
- Capítulo I — Disposiciones Generales: Artículos 1-3
- Capítulo II — Autoridad Nacional: Artículos 4-5
- Disposición Complementaria Final Única

**Total**: 5 artículos + 1 artículo preliminar + 1 disposición = 7 unidades de texto.

## Hallazgos clave

### 1. El WAF es Radware, no CloudFront
- Header `server: rdwr` confirma Radware (no AWS CloudFront como se asumía)
- Block page es HTML simple con Transaction ID — **no hay challenge JS ni CAPTCHA**
- Bloqueo no se supera con headers custom (Referer, Sec-Fetch-*, etc.)
- Todos los endpoints de `spley-portal-service` están bloqueados, no solo `/archivo/`
- `service-alfresco` devuelve 401 en wb2server, 403 en api.congreso

### 2. Dos dominios, dos niveles de acceso
- `leyes.congreso.gob.pe` (Archivo Digital): **abierto**, documentos descargables directamente
- `api.congreso.gob.pe` (ex wb2server): **bloqueado** por Radware WAF
- El Expediente Virtual (Lotus Notes en www2) funciona, pero los documentos que referencia están en ambos dominios

### 3. El proyecto original no tiene fuente alternativa
- El PDF del PL 2775 solo existe en `spley-portal-service/archivo/ODQ1OTA=/pdf/PL 2775 (U)`
- Archivo Digital no tiene directorio de Proyectos de Ley (404 en 6 variantes de URL)
- Búsqueda web: Hiperderecho, Gestión, El Comercio referencian la misma URL del Congreso
- No hay copia cached en sitios de la sociedad civil

### 4. La SPA Angular nunca renderiza
- El SPA `spley-portal` carga el shell (77 chars visible text) pero Angular no bootstrapa la ruta
- No emite XHR requests al backend (0 responses capturadas al cambiar hash)
- Posiblemente requiere lazy-loading de módulos que fallan silenciosamente

### 5. Expediente Virtual es la fuente más rica de metadata
- URL funcional: `www2.congreso.gob.pe/Sicr/TraDocEstProc/Expvirt_2021.nsf/RepExpVirt?OpenForm&Db={id}&View=`
- Contiene IDs de todos los documentos, título, número de ley, estado
- Navegación por menú funciona (form submission con `num.value`)
- Patrón de ID: `2021XXXXX` donde XXXXX es el número de proyecto con padding

## Factibilidad del AKN Diff — Veredicto final

### Con acceso programático (Playwright incluido)

| Documento AKN | Factible | Datos disponibles | Bloqueante |
|----------------|----------|-------------------|------------|
| `act.xml` (ley promulgada) | **Sí** | Texto completo (PDF → txt), fechas, estructura | — |
| `bill.xml` (proyecto original) | **No** | Solo metadatos (autor, fecha, comisiones) | Radware WAF bloquea el PDF |
| `amendment.xml` (votación Pleno) | **Parcial** | Conteo votos (104-0-2), fecha, resultado | Sin votos nominales (SPA no renderiza) |
| `dictamen.xml` (opcional) | **No** | Solo sabemos que existen 2 favorables | PDFs en spley-portal-service (bloqueados) |

### Resultado

**AKN Diff completo: NO FACTIBLE** con acceso programático.

Solo podemos generar `act.xml` (ley promulgada). Sin el texto del proyecto original no se puede computar el diff bill → act.

### Opciones para desbloquear

1. **Descarga manual**: El usuario abre el Expediente Virtual en un navegador real y descarga los PDFs manualmente. Si Radware permite tráfico de navegador real (vs. Playwright), los iframes deberían cargar los PDFs.
2. **Playwright con stealth**: Usar `playwright-extra` con stealth plugin para evadir detección de Radware (no probado, sin garantía).
3. **Contacto institucional**: Solicitar acceso a los PDFs via canales oficiales del Congreso.
4. **Monitorear**: El WAF puede ser una configuración temporal. Reintentar en semanas/meses.

## Archivos en esta carpeta

| Archivo | Tamaño | Contenido |
|---------|--------|-----------|
| `ley-31814-texto-consolidado.pdf` | 210KB | PDF texto consolidado (Archivo Digital) |
| `ley-31814-elperuano.pdf` | 805KB | PDF versión El Peruano (gob.pe CDN) |
| `ficha-tecnica-31814.pdf` | 203KB | Ficha técnica (Archivo Digital) |
| `agenda-pleno-24-25-05-2023.pdf` | 616KB | Agenda del Pleno 24-25 mayo 2023 |
| `ley-31814-texto.txt` | 7KB | Texto extraído con pdf-parse |
| `expediente-lotus.html` | 10KB | HTML del Expediente Virtual (con hidden fields) |
| `expediente-texto-aprobado.html` | 10KB | Expediente Virtual menú "Texto aprobado" |
| `cloudfront-403-body.html` | 334B | Página 403 de Radware WAF |
| `spley-portal-text.txt` | ~77B | Texto visible del SPA (solo shell) |
