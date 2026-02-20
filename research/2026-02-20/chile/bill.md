# bill — Reporte de Factibilidad Chile

> Proyecto de ley original: moción (parlamentaria) o mensaje (presidencial). Punto de partida del proceso legislativo. Contiene el articulado propuesto antes de cualquier modificación. **Implementado y verificado** — 4 boletines procesados.

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | Documentos Senado | [getDocto&iddocto=18004](https://tramitacion.senado.cl/appsenado/index.php?mo=tramitacion&ac=getDocto&iddocto=18004&tipodoc=mensaje_mocion) | PDF/DOC | Texto completo del proyecto, articulado, autores | AI simple |

**Escala de dificultad**: 0 (Ya AKN) · Mecánica simple · Mecánica compleja · AI simple · AI + Humano · No disponible

## Métricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---------------|--------------|-------------|----------------|
| Texto completo proyecto | Sí | Sí | PDF (Senado) |
| Articulado estructurado | Sí | Sí | PDF → regex/AI |
| Autores (mocionantes/Presidente) | Sí | Sí | API tramitación + PDF |
| Exposición de motivos | Sí | Parcial | PDF (en preface) |
| Fundamentos jurídicos | Sí | No | PDF |

- **Datos disponibles pero no aprovechados**: Fundamentos jurídicos, exposición de motivos (parcial)
- **Cobertura**: ~70%

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|-----------|--------------|--------|
| `<bill>` type | Sí | Hardcoded |
| FRBR URIs | Sí | Boletín + fecha |
| FRBRauthor | Sí | API tramitación |
| `<preface>` docTitle | Sí | PDF |
| `<references>` TLCPerson | Sí | API tramitación + PDF |
| `<body>` articles (eId, heading, content) | Sí | PDF → regex/AI |
| `<body>` sections | Parcial | Solo si el proyecto tiene títulos |

- **Completitud**: ~80%

## Observaciones

- La dificultad es "AI simple" porque los PDFs no tienen estructura semántica: los artículos se identifican por regex (`Artículo primero`, `Art. 1°`, `ARTÍCULO 1.-`). Los formatos varían entre mociones y mensajes.
- Mensajes presidenciales tienden a ser más grandes y mejor estructurados que las mociones parlamentarias.
- PDFs escaneados (documentos antiguos) no tienen texto extraíble — requieren OCR o transcripción manual.
- Los `iddocto` y `tipodoc` se obtienen automáticamente de la API de tramitación.
- Verificado con 4 boletines: 17.370-17 (4 arts), 15.480-13 (423 arts), 15.995-02 (4 arts), 8924-07 (~20 arts).
