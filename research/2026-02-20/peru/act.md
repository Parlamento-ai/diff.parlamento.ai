# act — Reporte de Factibilidad Perú

> Texto de una ley promulgada y publicada en el Diario Oficial El Peruano, o texto consolidado vigente en el SPIJ (Sistema Peruano de Información Jurídica). **No existe API versionada** — solo se puede obtener el texto vigente actual (SPIJ) o el texto original tal como fue publicado (El Peruano). Para reconstruir versiones históricas, habría que aplicar cronológicamente todas las normas modificatorias. **No implementado** — evaluación basada en exploración de fuentes públicas.

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | El Peruano visor_html (texto publicado) | [busquedas.elperuano.pe](https://busquedas.elperuano.pe/normaslegales/) | HTML (API no documentada) | Texto completo ley publicada, fecha D.O. | Mecánica compleja |
| 2 | SPIJ (texto consolidado vigente) | [spijweb.minjus.gob.pe](https://spijweb.minjus.gob.pe/) | HTML (sin API) | Texto vigente, estructura jerárquica | AI simple |
| 3 | Datos Abiertos CSV (catálogo normas) | [datosabiertos.gob.pe](https://www.datosabiertos.gob.pe/dataset/dispositivos-legales-emitidos-por-el-congreso-de-la-rep%C3%BAblica) | CSV (CKAN) | Índice: número ley, fecha, tipo, materia | Mecánica simple |
| 4 | Archivo Digital del Congreso | [leyes.congreso.gob.pe](https://leyes.congreso.gob.pe/LeyNume_Rango.aspx) | PDF | Texto escaneado/digital de ley publicada | AI + Humano |

**Escala de dificultad**: 0 (Ya AKN) · Mecánica simple · Mecánica compleja · AI simple · AI + Humano · No disponible

## Métricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---------------|--------------|-------------|----------------|
| Texto completo ley publicada | Sí | Sí | El Peruano HTML (fuente 1) |
| Texto consolidado vigente | Sí | Sí | SPIJ HTML (fuente 2) |
| Estructura jerárquica (títulos, capítulos, artículos) | Parcial | Sí | SPIJ HTML (fuente 2) |
| Número y tipo de norma | Sí | Sí | CSV catálogo (fuente 3) |
| Fecha publicación D.O. | Sí | Sí | CSV catálogo (fuente 3) |
| Versiones históricas con fecha | No | No | No existe API versionada |
| Preámbulo / considerandos | Sí | Sí | El Peruano HTML (fuente 1) |
| Anexos | Parcial | No | PDF (fuente 4) |
| Texto escaneado (leyes antiguas) | Sí | No | PDF imagen (fuente 4) |

- **Datos disponibles pero no aprovechados**: Anexos en PDF, texto escaneado de leyes pre-digitales (requiere OCR)
- **Cobertura**: ~40%

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|-----------|--------------|--------|
| `<act>` type | Sí | Hardcoded |
| FRBR URIs | Parcial | Número ley + fecha (sin versionado) |
| `<preface>` docTitle | Sí | El Peruano / CSV |
| `<body>` sections | Parcial | SPIJ HTML (estructura variable) |
| `<body>` articles (eId, heading, content) | Parcial | SPIJ HTML o El Peruano |
| `<conclusions>` | No | — |
| `<attachments>` (anexos) | No | Solo PDF |
| Historial de versiones | No | No existe fuente |

- **Completitud**: ~30%

## Observaciones

- La API `visor_html` de El Peruano retorna HTML del texto publicado. No está documentada oficialmente pero fue verificada funcional. URL: `busquedas.elperuano.pe/api/visor_html/{id}` donde `id` es el identificador de publicación (ej: `2192926-1` para Ley 31814). También: `busquedas.elperuano.pe/dispositivo/NL/{id}` para la vista completa.
- SPIJ migró a `spijweb.minjus.gob.pe`. Tiene texto consolidado vigente con estructura HTML semi-jerárquica, pero sin API. Requiere scraping con Playwright. La estructura varía entre leyes. Acceso libre parcial; acceso completo requiere suscripción.
- **Limitación crítica**: No hay versionado histórico. Para reconstruir el estado de una ley en una fecha específica, habría que recolectar todas las normas modificatorias del catálogo CSV y aplicarlas cronológicamente.
- Los Datos Abiertos CSV (24+ archivos, 2013-2024) sirven como índice de descubrimiento: permiten listar todas las leyes por número, fecha y materia, luego descargar el texto desde El Peruano o SPIJ.
- El Archivo Digital tiene PDFs desde 1904 con URL predecible: `leyes.congreso.gob.pe/Documentos/Leyes/{num}.pdf`. También publica fichas técnicas y textos consolidados (ej: `31814-TXM.pdf`, `31814-FTE.pdf`). Leyes antiguas son PDFs escaneados que requerirían OCR.
- **Ejemplo**: Ley 31814 (Inteligencia Artificial, 2023-07-05) — ley pequeña (5 arts), texto disponible en El Peruano, SPIJ y Archivo Digital. Ley 32138 (Crimen Organizado, 2024-10-19) — reforma a ley existente, 5 PLs consolidados, texto más complejo.
