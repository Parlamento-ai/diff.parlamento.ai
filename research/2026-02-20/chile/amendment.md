# amendment — Reporte de Factibilidad Chile

> Cada trámite legislativo que modifica el texto del proyecto: informe de comisión, indicaciones, aprobación en Sala, trámite en cámara revisora, Comisión Mixta. Incluye `akndiff:changeSet` (diff computado) y `akndiff:vote` (votación nominal). **Implementado y verificado** — 15 amendments procesados en 5 boletines.

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | API Tramitación Senado (descubrimiento) | [tramitacion.php?boletin=17370](https://tramitacion.senado.cl/wspublico/tramitacion.php?boletin=17370) | XML | Etapas, documentos (iddocto+tipodoc), fechas, cámara | Mecánica simple |
| 2 | Documentos Senado (oficios/informes) | [getDocto&iddocto=27646](https://tramitacion.senado.cl/appsenado/index.php?mo=tramitacion&ac=getDocto&iddocto=27646&tipodoc=info) | PDF/DOC | Texto modificado, articulado post-trámite | AI simple |
| 3 | API Votaciones Senado | [votaciones.php?boletin=17370](https://tramitacion.senado.cl/wspublico/votaciones.php?boletin=17370) | XML | Votos nominales, resultado, conteo (Senado) | Mecánica simple |
| 4 | API Votaciones Cámara | [getVotacion_Detalle?prmVotacionID=26710](https://opendata.camara.cl/wscamaradiputados.asmx/getVotacion_Detalle?prmVotacionID=26710) | XML | Votos nominales, resultado, conteo (Cámara) | Mecánica simple |
| 5 | LeyChile JSON API (para reformas) | [get_norma_json?idNorma=7147](https://nuevo.leychile.cl/servicios/Navegar/get_norma_json?idNorma=7147&idVersion=2025-03-26) | JSON | Articulado post-reforma (versión final) | Mecánica simple |
| 6 | Computado (diff engine) | N/A | JSON | Artículos modificados/insertados/eliminados | Mecánica simple |

**Escala de dificultad**: 0 (Ya AKN) · Mecánica simple · Mecánica compleja · AI simple · AI + Humano · No disponible

## Métricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---------------|--------------|-------------|----------------|
| Trámites y etapas (descubrimiento) | Sí | Sí | XML (fuente 1) |
| Oficios entre cámaras (texto modificado) | Sí | Sí | PDF (fuente 2) |
| Informes de comisión | Sí | Sí | PDF (fuente 2) |
| Votaciones nominales Senado | Sí | Sí | XML (fuente 3) |
| Votaciones nominales Cámara | Sí | Sí | XML (fuente 4) |
| Diff computado (changeSet) | Computable | Sí | Algoritmo local (fuente 6) |
| Texto post-reforma (LeyChile) | Sí | Sí | JSON (fuente 5) |
| Informe Comisión Mixta | Sí | Sí | PDF (fuente 2) |

- **Datos disponibles pero no aprovechados**: —
- **Cobertura**: ~80%

### Completitud AKN

| Campo AKN / AKN Diff | ¿Completado? | Fuente |
|-----------------------|--------------|--------|
| `<amendment>` type | Sí | Generado |
| FRBR URIs | Sí | Boletín + fecha trámite |
| `<preface>` | Sí | Metadatos PDF |
| `akndiff:changeSet` base/result | Sí | FRBR URIs encadenadas |
| `akndiff:articleChange` substitute/insert/repeal | Sí | Diff engine |
| `akndiff:articleChange` renumber | Sí | Diff engine |
| `akndiff:old` + `akndiff:new` | Sí | Diff engine |
| `akndiff:vote` result/date/source | Sí | API votaciones |
| `akndiff:voter` nominal (for/against/abstain) | Sí | API votaciones |

- **Completitud**: ~90%

## Observaciones

- El changeSet (diff computado) funciona siempre que ambas versiones del articulado estén disponibles. Es 100% determinístico. Fórmula de cross-check: `arts_previos + inserciones - derogaciones = arts_nuevos`.
- Chile tiene votos nominales en formato XML estructurado (APIs Senado y Cámara), lo que permite poblar `akndiff:vote` al 100%.
- Boletín 17.370-17 fue el primer caso de `result="rejected"` — el proyecto fue rechazado en Sala 21-24.
- Ley 21.120 demostró el flujo más complejo: 2do trámite rechazado en Cámara → Comisión Mixta → aprobación.
- Para reformas, la versión final del `<act>` se obtiene directamente de LeyChile (fuente 5), sin necesidad de parsear PDFs.
- Verificado con 5 boletines: 17.370-17 (1 amendment), 15.480-13 boletín (4 amendments), 15.480-13 DL 3.500 (5 amendments), 15.995-02 (2 amendments), 8924-07 (3 amendments + C. Mixta).
