# act — Reporte de Factibilidad Chile

> Texto de una ley vigente (promulgada) o una versión histórica de ella. Resultado final del proceso legislativo, o punto de partida en el caso de reformas a leyes existentes. **Implementado y verificado** — 8 normas procesadas exitosamente.

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | LeyChile JSON API (versionada) | [get_norma_json?idNorma=7147](https://nuevo.leychile.cl/servicios/Navegar/get_norma_json?idNorma=7147&idVersion=2025-03-25) | JSON | Artículos, títulos, estructura jerárquica, preámbulo | Mecánica simple |
| 2 | API Tramitación Senado (metadatos) | [tramitacion.php?boletin=15480](https://tramitacion.senado.cl/wspublico/tramitacion.php?boletin=15480) | XML | Número de ley, fecha D.O., estado | Mecánica simple |
| 3 | BCN datos.bcn.cl | [datos.bcn.cl](https://datos.bcn.cl) | AKN 2.0 XML | ~34,936 normas (sin changeSets) | 0 (Ya AKN) |

**Escala de dificultad**: 0 (Ya AKN) · Mecánica simple · Mecánica compleja · AI simple · AI + Humano · No disponible

## Métricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---------------|--------------|-------------|----------------|
| Texto completo ley vigente | Sí | Sí | LeyChile JSON |
| Estructura jerárquica (títulos, artículos) | Sí | Sí | LeyChile JSON (`tH` + `h`) |
| Versiones históricas con fecha | Sí | Sí | LeyChile JSON (`idVersion`) |
| Preámbulo | Sí | Sí | LeyChile JSON |
| Anexos | Parcial | No | LeyChile JSON |
| Fecha publicación D.O. | Sí | Sí | API Tramitación (`diariooficial`) |
| Número de ley asignado | Sí | Sí | API Tramitación (`leynro`) |

- **Datos disponibles pero no aprovechados**: Anexos (parcialmente disponibles en LeyChile)
- **Cobertura**: ~80%

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|-----------|--------------|--------|
| `<act>` type | Sí | Hardcoded |
| FRBR URIs | Sí | idNorma + fecha |
| `<preface>` docTitle | Sí | LeyChile JSON |
| `<body>` sections | Sí | LeyChile JSON (`tH`) |
| `<body>` articles (eId, heading, content) | Sí | LeyChile JSON (`h` array) |
| `<conclusions>` | No | — |
| `<attachments>` (anexos) | No | Disponible, no implementado |

- **Completitud**: ~75%

## Observaciones

- La API versionada de LeyChile es excepcional: `idVersion=YYYY-MM-DD` permite reconstruir la historia completa de cualquier norma. Esto habilita tanto el flujo de reforma (act pre/post) como historiales completos (32 versiones de Ley 18.045).
- Requiere Playwright con `headless:false` por Cloudflare. Respuestas de ~1MB para leyes grandes (DL 3.500).
- El HTML contiene anotaciones inline (ej: `LEY XXXX\nArt...\nD.O...`) que deben limpiarse antes de parsear artículos.
- datos.bcn.cl podría servir como base alternativa (AKN 2.0), pero requiere conversión de estándar.
- Verificado con 8 normas: DL 3.500, DFL 5, Ley 18.045 (32 versiones), DFL 28, Ley 20.880, Ley 17.798, Ley 21.120, Ley 21.735.
