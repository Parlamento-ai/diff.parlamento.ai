# question — Reporte de Factibilidad Spain

> Preguntas parlamentarias de diputados y senadores al Gobierno. Mecanismo de control democratico. Preguntas orales en pleno, preguntas escritas, interpelaciones.

**Estado**: No implementado

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | Congreso Open Data - Iniciativas | `congreso.es/opendata/iniciativas` | XML/JSON/CSV | Metadatos de preguntas (tipo 180 = pregunta oral, 184 = pregunta escrita) | Mecanica simple |
| 2 | Congreso - Busqueda de iniciativas | `congreso.es/busqueda-de-iniciativas` | HTML | Texto completo pregunta + respuesta | Mecanica compleja |
| 3 | Senado Open Data | `senado.es/.../catalogodatos/` | XML | Preguntas en Senado | Mecanica compleja |
| 4 | BOCG Serie D | `congreso.es/public_oficiales/L{leg}/CONG/BOCG/D/` | PDF | Preguntas escritas y respuestas publicadas | AI simple |

**Escala de dificultad**: Mecanica simple (metadatos) · **Mecanica compleja** (texto completo)

### Tipos de preguntas parlamentarias en Espana

| Tipo | Descripcion | Fuente texto |
|---|---|---|
| Pregunta oral en Pleno | Formulada por diputado al Gobierno, respuesta en pleno | Diario de Sesiones PDF |
| Pregunta oral en Comision | Formulada en comision, respuesta del ministro | Diario de Sesiones PDF |
| Pregunta escrita | Formulada por escrito, respuesta escrita del Gobierno | BOCG Serie D PDF |
| Interpelacion | Pregunta sobre politica general del Gobierno | Diario de Sesiones PDF |

### Verificado con

| Fuente | Dato | Status |
|--------|------|--------|
| Congreso Open Data | Pagina de iniciativas accesible con user-agent | Acceso con user-agent OK, 403 sin el |
| BOCG Serie D PDFs | URLs predecibles | No verificado en vivo |

**Nota**: congreso.es bloquea curl sin user-agent (403). Con user-agent de navegador la pagina carga (verificado).

## Metricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---|---|---|---|
| Metadatos pregunta (autor, fecha, tipo) | Si | No | Congreso Open Data |
| Texto completo de la pregunta | Si | No | BOCG PDF / Congreso web |
| Respuesta del Gobierno | Si | No | BOCG PDF / Congreso web |
| Vinculacion a ley especifica | Parcial | No | No siempre explicita |

- **Cobertura**: 0% utilizado (~80% disponible)

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|---|---|---|
| `<doc name="question">` | No | — |
| `<meta>` FRBR URIs | No | Congreso expediente |
| `<preface>` author, date | No | Congreso Open Data |
| `<mainBody>` question text | No | BOCG PDF / Congreso web |
| Response section | No | BOCG PDF / Congreso web |

- **Completitud**: 0%

## Observaciones

- Las preguntas parlamentarias NO son parte directa del procedimiento legislativo. Son mecanismo de control independiente.
- Congreso Open Data tiene metadatos de iniciativas tipo pregunta pero no el texto completo.
- El texto completo esta en PDFs del BOCG Serie D (preguntas escritas) y Diario de Sesiones (preguntas orales).
- congreso.es tiene proteccion anti-scraping (403 sin user-agent). Funciona con user-agent de navegador.
- El Senado tambien tiene preguntas pero su portal de datos abiertos bloquea acceso desde curl/WebFetch.
- ~3000-5000 preguntas escritas por legislatura. Volumen alto pero bajo valor para el pipeline de diff.
