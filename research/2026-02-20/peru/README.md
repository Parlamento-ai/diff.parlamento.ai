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

### Cobertura del rito legislativo (actualizado post-pruebas)

| Tipo | Cobertura | Nota |
|------|-----------|------|
| act | ~40% | Texto vigente vía Texto Consolidado PDF + El Peruano visor_html. Sin versionado histórico. |
| bill | ~~30%~~ **0%** | PDFs **bloqueados por Radware WAF**. Sin fuente alternativa accesible programáticamente. |
| amendment | ~~35%~~ **~10%** | Solo conteo total de votos (prensa). Votos nominales en SPA que no renderiza. |
| dictamen | ~~20%~~ **0%** | PDFs **bloqueados por Radware WAF**. |
| observación | ~15% | PDFs disponibles en teoría, no probado (Ley 31814 no fue observada). |
| debate | 0% | PDFs sin estructura |
| judgment | 0% | PDFs del TC, sin API |

### Completitud AKN (actualizado post-pruebas)

| Tipo | Completitud | Nota |
|------|-------------|------|
| act | ~30% | Texto extraíble (pdf-parse, 7161 chars para Ley 31814). Estructura reconocible. |
| bill | ~~25%~~ **0%** | PDF inaccesible. |
| amendment | ~~30%~~ **~5%** | Solo metadata: fecha, conteo total. Sin votos nominales ni changeset. |
| dictamen | ~~10%~~ **0%** | PDF inaccesible. |
| observación | ~10% | No probado |
| debate | 0% | — |
| judgment | 0% | — |

## Evidencia empírica

Se realizaron pruebas manuales con **Ley 31814** (PL 2775/2022-CR, Inteligencia Artificial) como proyecto de referencia. Detalle completo en [`../2026-02-24/peru-31814/README.md`](../2026-02-24/peru-31814/README.md).

### Verificación de fuentes (post pruebas manuales)

| Fuente verificada | Método | Resultado |
|-------------------|--------|-----------|
| El Peruano visor_html API | fetch | **Funcional** — `busquedas.elperuano.pe/api/visor_html/{id}` retorna HTML |
| Archivo Digital — Texto Consolidado | fetch | **Funcional** — `leyes.congreso.gob.pe/Documentos/2021_2026/ADLP/Texto_Consolidado/{num}-TXM.pdf` |
| Archivo Digital — Ficha Técnica | fetch | **Funcional** — `.../ADLP/Ficha_Tecnica_Espanol/{num}-FTE.pdf` |
| gob.pe CDN | fetch | **Funcional** — PDF versión El Peruano |
| Expediente Virtual (Lotus Notes) | Playwright | **Funcional** — `RepExpVirt?OpenForm&Db={id}&View=` retorna HTML con hidden fields con URLs de todos los documentos |
| Datos Abiertos CSV | CKAN API | **Funcional** — catálogo 2013-2024 |
| TC jurisprudencia | URLs predecibles | No probado — `tc.gob.pe/jurisprudencia/{year}/{expediente}.pdf` |
| SPIJ | Web | No probado — migró a `spijweb.minjus.gob.pe` |
| **spley-portal-service** | Playwright | **BLOQUEADO — Radware WAF** (403 en TODOS los endpoints) |
| **spley-portal SPA** | Playwright | **NO RENDERIZA** — Angular carga shell pero no bootstrapa rutas |
| **service-alfresco** | Playwright | **BLOQUEADO** — 401 en wb2server, 403 en api.congreso |
| **Votaciones Pleno** | Playwright | **NO RENDERIZA** — SPA dinámico |
| Archivo Digital — Proyectos de Ley | fetch | **NO EXISTE** — 404 en 6+ variantes de URL |
| Archivo Digital — Autógrafas | fetch | **NO EXISTE** — 404 en 4+ variantes |
| Lotus Notes — visbusqptraam | Playwright | **ERROR** — 500 Internal Server Error |
| Lotus Notes — CLProLey2021 | Playwright | **NO EXISTE** — 404 en todas las vistas |

### Hallazgo crítico: Radware WAF

`wb2server.congreso.gob.pe` redirige 301 → `api.congreso.gob.pe`. **Todo `spley-portal-service`** está detrás de Radware WAF (`server: rdwr`). La página 403 es HTML simple con Transaction ID — sin challenge JS, sin CAPTCHA. No se supera con headers custom, cookies, ni sesión de navegador.

Esto bloquea el acceso programático a:
- **PDFs de proyectos de ley** (el texto original del bill)
- **PDFs de autógrafas** (texto aprobado por el Congreso)
- **PDFs de la ley publicada** (via spley-portal-service)
- **API JSON del expediente** (metadatos, timeline, documentos)
- **PDFs de dictámenes** (opiniones de comisiones)

Los **únicos documentos accesibles** son los alojados en `leyes.congreso.gob.pe` (Texto Consolidado, Ficha Técnica, Lenguas Originarias).

### Dos dominios, dos niveles de acceso

| Dominio | Acceso | Contenido |
|---------|--------|-----------|
| `leyes.congreso.gob.pe` | **Abierto** | Texto consolidado, ficha técnica, traducciones |
| `api.congreso.gob.pe` (ex wb2server) | **Bloqueado** (Radware WAF) | PDFs: proyecto, autógrafa, ley publicada, dictámenes |
| `www2.congreso.gob.pe` | **Parcial** | Expediente Virtual funciona (metadata), pero documentos que referencia están en api.congreso |
| `busquedas.elperuano.pe` | **Abierto** | Texto de ley promulgada (HTML) |

### Resultados sobre Ley 31814

| Documento AKN | Factible | Fuente | Bloqueante |
|----------------|----------|--------|------------|
| `act.xml` (ley promulgada) | **Sí** | Texto Consolidado PDF (7161 chars, 5 arts) | — |
| `bill.xml` (proyecto original) | **No** | Solo en spley-portal-service | Radware WAF 403 |
| `amendment.xml` (votación Pleno) | **Parcial** | Conteo 104-0-2 (prensa), sin nominales | SPA no renderiza |
| `dictamen.xml` | **No** | Solo en spley-portal-service | Radware WAF 403 |

### Proyectos de referencia

| PL | Ley | Tema | Característica clave |
|----|-----|------|---------------------|
| 2775/2022-CR | Ley 31814 | Inteligencia Artificial | **Probado** — happy path: unanimidad (104-0-2), 2 dictámenes, sin observaciones |
| 9055 + 4 PLs/2024-CR | Ley 32138 | Crimen Organizado | 5 PLs acumulados, 2+ comisiones, votación divisiva (81-23-8) |
| 2132 + 2 PLs/2021-CR | Ley 32195 | Cáñamo Industrial | Observada por Ejecutivo → insistencia (82-4-6) |
| 3254/2022-CR | Ley 32179 | Personal EsSalud | Observada → insistencia fallida → reconsideración → insistencia (87-1-11) |
| 1663 + 4 PLs/2021-2024 | Ley 32270 | Voto Digital | 5 PLs multi-período, modifica ley orgánica |

## Observaciones

- Perú tiene los datos legislativos públicos necesarios, pero en formatos **significativamente menos accesibles**: HTML de Lotus Notes, SPAs sin API documentada, y PDFs.
- La **ausencia de versionado histórico de leyes** es la limitación más grave. Para reconstruir la historia de una ley, hay que recolectar todas las normas modificatorias desde el catálogo de Datos Abiertos y aplicarlas cronológicamente.
- El **Expediente Virtual** (Lotus Notes) es la fuente más rica de metadata. URL funcional: `RepExpVirt?OpenForm&Db={2021XXXXX}&View=`. Contiene hidden fields con IDs base64 de todos los documentos (e.g., `ODQ1OTA=` → 84590). La navegación por menú funciona (Lotus Notes form submission), pero los documentos que referencia están mayoritariamente en `spley-portal-service` (bloqueado).
- El **spley-portal** (2021+) está completamente detrás de **Radware WAF** — no solo los PDFs sino TODOS los endpoints del servicio devuelven 403. El SPA Angular carga el shell pero nunca renderiza rutas. El reverse-engineering del backend **no es viable** en estas condiciones.
- El **Diario Oficial El Peruano** tiene una API `visor_html` no documentada que retorna texto completo en HTML — verificada funcional.
- La **doble votación** (7 días de separación) genera 2 registros de votos por cada ley. La exoneración de 2da votación (frecuente) reduce esto a 1.
- Las **observaciones presidenciales** generan flujos complejos: observación → insistencia (requiere 87/130 votos) → posible reconsideración si falla. Ley 32179 (EsSalud) demostró el flujo más complejo.
- La **transición a bicameralismo en 2026** (130 diputados + 60 senadores) cambiará el rito fundamentalmente, añadiendo trámites entre cámaras y posible comisión mixta.

## Veredicto

**NO FACTIBLE para AKN Diff completo** con acceso programático.

El WAF de Radware bloquea `spley-portal-service`, que es la **única fuente** de los PDFs del proyecto original (bill), autógrafa, dictámenes, y ley publicada. Solo se puede generar `act.xml` (ley promulgada) desde `leyes.congreso.gob.pe`.

### Opciones para desbloquear

1. **Descarga manual**: Abrir el Expediente Virtual en un navegador real — si Radware permite tráfico no-Playwright, los iframes cargarían los PDFs.
2. **Playwright con stealth**: Usar `playwright-extra` con stealth plugin para evadir detección de Radware (no probado, sin garantía).
3. **Contacto institucional**: Solicitar acceso programático a los PDFs via canales oficiales del Congreso.
4. **Monitorear**: El WAF puede ser una configuración temporal. Reintentar periódicamente.
5. **Fuentes alternativas**: Buscar si organizaciones civiles (Hiperderecho, etc.) publican textos de proyectos — no encontrado para PL 2775.
