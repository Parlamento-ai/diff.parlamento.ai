# Perú — Reporte de Factibilidad AKN Diff

> Perú tiene un proceso legislativo unicameral (Congreso de la República, 130 miembros) con doble votación en Pleno separada por 7 días. Los datos legislativos públicos están fragmentados entre sistemas legacy (IBM Lotus Notes/Domino), SPAs sin API documentada, y PDFs. No existe equivalente a la API versionada de LeyChile. Se evaluó la viabilidad de convertir estos datos a AKN Diff.
>
> **Nota**: Perú vuelve al bicameralismo (130 diputados + 60 senadores) a partir de las elecciones de 2026, lo que modificará fundamentalmente el rito legislativo.

## Tipos AKN objetivo

| Tipo AKN | Uso en Perú | Estado | Reporte |
|----------|------------|--------|---------|
| `act` | Ley promulgada (El Peruano / SPIJ) | No implementado | [act.md](act.md) |
| `bill` | Proyecto de Ley (Congreso) | No implementado | [bill.md](bill.md) |
| `amendment` | Votación en Pleno (1ra y 2da) + cambios al texto | No implementado | [amendment.md](amendment.md) |
| `dictamen` | Dictamen de comisión (Perú-específico) | No implementado | [dictamen.md](dictamen.md) |
| `observación` | Observaciones del Ejecutivo (Perú-específico) | No implementado | [observacion.md](observacion.md) |
| `debate` | Diario de los Debates (transcripción Pleno) | No implementado | [debate.md](debate.md) |
| `judgment` | Fallo del Tribunal Constitucional | No implementado | [judgment.md](judgment.md) |

## Fuentes de datos

| # | Fuente | Formato | Autenticación | Tipos que alimenta |
|---|--------|---------|---------------|-------------------|
| 1 | [spley-portal](https://wb2server.congreso.gob.pe/spley-portal/) (tracking PLs, 2021+) | SPA + JSON (no documentado) | Pública | bill, amendment |
| 2 | [Expediente Virtual](https://www2.congreso.gob.pe/Sicr/TraDocEstProc/Expvirt_2021.nsf/) (Lotus Notes) | HTML | Pública | bill, amendment, dictamen |
| 3 | [Votaciones Pleno](https://www.congreso.gob.pe/AsistenciasVotacionesPleno/asistencia-votacion-pleno) | HTML + PDF | Pública | amendment |
| 4 | [Archivo Digital](https://leyes.congreso.gob.pe/) (leyes 1904-presente) | PDFs | Pública | act, bill |
| 5 | [El Peruano visor_html](https://busquedas.elperuano.pe/normaslegales/) (texto publicado) | HTML (API no documentada) | Pública | act |
| 6 | [SPIJ](https://spijweb.minjus.gob.pe/) (texto consolidado vigente) | HTML (sin API) | Pública | act |
| 7 | [Datos Abiertos CSV](https://www.datosabiertos.gob.pe/dataset/dispositivos-legales) (catálogo normas 2013-2024) | CSV | Pública | act (índice) |
| 8 | [Tribunal Constitucional](https://tc.gob.pe/jurisprudencia/) | PDFs (URLs predecibles) | Pública | judgment |

## Métricas agregadas

### Cobertura del rito legislativo

| Tipo | Cobertura | Nota |
|------|-----------|------|
| act | ~40% | Texto vigente (SPIJ) + texto publicado (El Peruano), pero sin versionado histórico |
| bill | ~30% | PDFs disponibles, sin estructura; spley-portal podría tener JSON |
| amendment | ~35% | Votos nominales en HTML + tracking en Expediente Virtual |
| dictamen | ~20% | PDFs disponibles, texto no estructurado |
| observación | ~15% | PDFs disponibles, sin fuente estructurada |
| debate | 0% | PDFs sin estructura |
| judgment | 0% | PDFs del TC, sin API |

### Completitud AKN

| Tipo | Completitud | Nota |
|------|-------------|------|
| act | ~30% | Falta versionado, estructura jerárquica parcial |
| bill | ~25% | Falta articulado estructurado (solo PDF) |
| amendment | ~30% | Votos existen pero requieren scraping HTML |
| dictamen | ~10% | Solo PDF, texto no parseado |
| observación | ~10% | Solo PDF |
| debate | 0% | — |
| judgment | 0% | — |

## Evidencia empírica

No se han procesado proyectos peruanos aún. La evaluación se basa en exploración de las fuentes públicas y verificación de URLs:

| Fuente verificada | Método | Resultado |
|-------------------|--------|-----------|
| El Peruano visor_html API | WebFetch | Funcional — `busquedas.elperuano.pe/api/visor_html/{id}` retorna HTML |
| Datos Abiertos CSV | CKAN API | Funcional — 24+ archivos CSV, catálogo 2013-2024 |
| Expediente Virtual (Lotus Notes) | Web | Funcional — `Expvirt_2021.nsf` para período actual |
| Votaciones Pleno | Web | Funcional — `congreso.gob.pe/AsistenciasVotacionesPleno/` |
| spley-portal / Alfresco | Web | Funcional — PDFs via `spley-portal-service/archivo/{base64}/pdf` |
| TC jurisprudencia | URLs predecibles | Funcional — `tc.gob.pe/jurisprudencia/{year}/{expediente}.pdf` |
| SPIJ | Web | Funcional — migró a `spijweb.minjus.gob.pe` |
| Archivo Digital | Web | Funcional — `leyes.congreso.gob.pe/Documentos/Leyes/{num}.pdf` |

### Proyectos de referencia

| PL | Ley | Tema | Característica clave |
|----|-----|------|---------------------|
| 2775/2022-CR | Ley 31814 | Inteligencia Artificial | Happy path: unanimidad (104-0-2), 2 dictámenes, sin observaciones |
| 9055 + 4 PLs/2024-CR | Ley 32138 | Crimen Organizado | 5 PLs acumulados, 2+ comisiones, votación divisiva (81-23-8) |
| 2132 + 2 PLs/2021-CR | Ley 32195 | Cáñamo Industrial | Observada por Ejecutivo → insistencia (82-4-6) |
| 3254/2022-CR | Ley 32179 | Personal EsSalud | Observada → insistencia fallida → reconsideración → insistencia (87-1-11) |
| 1663 + 4 PLs/2021-2024 | Ley 32270 | Voto Digital | 5 PLs multi-período, modifica ley orgánica |

## Observaciones

- Perú tiene los datos legislativos públicos necesarios, pero en formatos **significativamente menos accesibles**: HTML de Lotus Notes, SPAs sin API documentada, y PDFs.
- La **ausencia de versionado histórico de leyes** es la limitación más grave. Para reconstruir la historia de una ley, hay que recolectar todas las normas modificatorias desde el catálogo de Datos Abiertos y aplicarlas cronológicamente.
- El **Expediente Virtual** (Lotus Notes) es la fuente más completa para tracking legislativo, pero es legacy. El `spley-portal` (2021+) es el reemplazo moderno con servicio Alfresco para PDFs, pero su API no está documentada. El subdominio `api.congreso.gob.pe` sugiere una API en desarrollo.
- El **Diario Oficial El Peruano** tiene una API `visor_html` no documentada que retorna texto completo en HTML — verificada funcional.
- La **doble votación** (7 días de separación) genera 2 registros de votos por cada ley. La exoneración de 2da votación (frecuente) reduce esto a 1.
- Las **observaciones presidenciales** generan flujos complejos: observación → insistencia (requiere 87/130 votos) → posible reconsideración si falla. Ley 32179 (EsSalud) demostró el flujo más complejo.
- La **transición a bicameralismo en 2026** (130 diputados + 60 senadores) cambiará el rito fundamentalmente, añadiendo trámites entre cámaras y posible comisión mixta.
- **Veredicto: FACTIBLE CON LIMITACIONES** — se estima ~50-60% de cobertura y ~25-30% de completitud AKN. La principal barrera es la falta de APIs y versionado de leyes. El reverse-engineering del `spley-portal` backend podría mejorar significativamente estas cifras.
