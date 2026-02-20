# judgment — Reporte de Factibilidad Chile

> Fallos del Tribunal Constitucional (TC) sobre proyectos de ley. Control preventivo obligatorio (leyes orgánicas constitucionales) o requerimientos de inconstitucionalidad. **No implementado** — sin API pública, solo PDFs del sitio del TC.

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | Tribunal Constitucional | [tribunalconstitucional.cl](https://www.tribunalconstitucional.cl/sentencias/busqueda-basica) | PDF | Texto fallo, partes declaradas inconstitucionales, dispositivo | AI + Humano |

**Escala de dificultad**: 0 (Ya AKN) · Mecánica simple · Mecánica compleja · AI simple · **AI + Humano** · No disponible

## Métricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---------------|--------------|-------------|----------------|
| Fallo completo TC | Sí | No | PDF (sitio TC) |
| Artículos declarados inconstitucionales | Sí | No | PDF (dispositivo) |
| Prevención de constitucionalidad | Sí | No | PDF |

- **Datos disponibles pero no aprovechados**: Fallo completo, artículos declarados inconstitucionales, prevenciones de constitucionalidad
- **Cobertura**: 0% utilizado (100% disponible para LOC)

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|-----------|--------------|--------|
| `<judgment>` type | No | — |
| `<header>` court, date, caseNumber | No | PDF TC |
| `<judgmentBody>` | No | PDF TC |
| `<decision>` dispositivo | No | PDF TC |

- **Completitud**: 0%

## Observaciones

- El TC no tiene API pública. Los fallos se obtienen descargando PDFs del sitio web.
- Solo aplica a leyes orgánicas constitucionales (control preventivo obligatorio) y a requerimientos de inconstitucionalidad. No todos los boletines pasan por TC.
- El dato más valioso del fallo es el dispositivo: qué artículos se declaran constitucionales/inconstitucionales. Esto afecta directamente el texto final de la ley.
- Actualmente en el pipeline, el trámite "Tribunal Constitucional" aparece como un amendment sin changeSet detallado del fallo.
