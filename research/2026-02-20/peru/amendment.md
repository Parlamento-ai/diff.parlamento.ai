# amendment — Reporte de Factibilidad Perú

> Cada evento que modifica el texto del proyecto de ley: dictamen de comisión con texto sustitutorio, votación en Pleno (1ra votación), y votación en Pleno (2da votación, 7 días después). El sistema es unicameral con doble votación obligatoria. El flujo típico es: proyecto → dictamen(es) → 1ra votación Pleno → 2da votación Pleno → autógrafa → promulgación. La 2da votación puede exonerarse por mayoría calificada. **No implementado** — evaluación basada en exploración de fuentes públicas.

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | Votaciones Pleno (asistencia y votaciones) | [congreso.gob.pe/AsistenciasVotacionesPleno](https://www.congreso.gob.pe/AsistenciasVotacionesPleno/asistencia-votacion-pleno) | HTML + PDF | Votos nominales por congresista, resultado, fecha | Mecánica compleja |
| 2 | Expediente Virtual (tracking PLs) | [Expvirt_2021.nsf](https://www2.congreso.gob.pe/Sicr/TraDocEstProc/Expvirt_2021.nsf/) | HTML (Lotus Notes) | Etapas del trámite, comisiones, documentos | Mecánica compleja |
| 3 | spley-portal (tracking PLs, 2021+) | [wb2server.congreso.gob.pe/spley-portal](https://wb2server.congreso.gob.pe/spley-portal/) | SPA + JSON (no documentado) | Estado, trámite, links a documentos | Mecánica compleja |
| 4 | Autógrafa de ley (texto final aprobado) | Archivo Digital / spley-portal | PDF | Texto final certificado antes de promulgación | AI simple |

**Escala de dificultad**: 0 (Ya AKN) · Mecánica simple · Mecánica compleja · AI simple · AI + Humano · No disponible

## Métricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---------------|--------------|-------------|----------------|
| 1ra votación Pleno (nominal) | Sí | Sí | HTML Lotus Notes (fuente 1) |
| 2da votación Pleno (nominal) | Sí | Sí | HTML Lotus Notes (fuente 1) |
| Resultado votación (aprobado/rechazado) | Sí | Sí | HTML Lotus Notes (fuente 1) |
| Votos nominales por congresista | Sí | Sí | HTML Lotus Notes (fuente 1) |
| Texto sustitutorio (post-comisión) | Sí (PDF) | Sí | PDF dictamen (fuente 2/3) |
| Autógrafa (texto final aprobado) | Sí (PDF) | Sí | PDF (fuente 4) |
| Etapas del trámite | Sí | Sí | Expediente Virtual (fuente 2) |
| Votación en comisión | Parcial | No | No sistematizada |
| Exoneración de 2da votación | Sí | No | HTML (fuente 1) |

- **Datos disponibles pero no aprovechados**: Votación en comisión (no sistematizada en fuente electrónica), exoneración de 2da votación (dato en actas)
- **Cobertura**: ~35%

### Completitud AKN

| Campo AKN / AKN Diff | ¿Completado? | Fuente |
|-----------------------|--------------|--------|
| `<amendment>` type | Sí | Generado |
| FRBR URIs | Sí | Número PL + fecha votación |
| `<preface>` | Sí | Metadatos Expediente Virtual |
| `akndiff:changeSet` base/result | Parcial | Requiere ambas versiones del texto |
| `akndiff:articleChange` substitute/insert/repeal | Parcial | Diff engine (si textos disponibles) |
| `akndiff:old` + `akndiff:new` | Parcial | Diff engine (si textos disponibles) |
| `akndiff:vote` result/date/source | Sí | Votaciones Pleno HTML |
| `akndiff:voter` nominal (for/against/abstain) | Sí | Votaciones Pleno HTML |

- **Completitud**: ~30%

## Observaciones

- La **doble votación** genera 2 registros de votos por cada ley (separados por mínimo 7 días). Esto produce 2 amendments de tipo votación por proyecto. La exoneración de 2da votación (por mayoría calificada) reduce esto a 1.
- Los **votos nominales** se publican en la sección Asistencia y Votaciones del Pleno (`congreso.gob.pe/AsistenciasVotacionesPleno/`). El formato incluye nombre del congresista + voto (Sí/No/Abstención/Sin respuesta). No hay API estructurada (JSON/XML) — los datos se publican como HTML y PDFs estadísticos mensuales.
- El **texto sustitutorio** (resultado del trabajo en comisión) viene como PDF adjunto al dictamen. Para generar `akndiff:changeSet`, se necesita parsear el articulado del dictamen (AI simple) y comparar con el proyecto original — ambos son PDFs.
- El **changeSet** (diff computado) depende de la calidad de extracción de texto de los PDFs. Ambas versiones (original y sustitutorio) son PDFs, no texto estructurado.
- El Pleno vota proyectos "en bloque" (varios a la vez) o individualmente. Los votos en bloque presentan un desafío adicional para mapear resultado → proyecto específico.
- **Ejemplo**: Ley 32138 (Crimen Organizado) — 1ra votación: 81 a favor, 23 en contra, 8 abstenciones; exonerada de 2da votación. Ley 31814 (IA) — 104 a favor, 0 en contra, 2 abstenciones; exonerada de 2da votación. Ley 32270 (Voto Digital) — 1ra votación: 69-10-11; exoneración: 82-16-1.
