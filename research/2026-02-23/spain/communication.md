# communication — Reporte de Factibilidad Spain

> Timeline del ciclo de vida legislativo. Eventos del procedimiento: presentacion, ponencia, comision, pleno Congreso, Senado, sancion real, publicacion BOE.

**Estado**: No implementado. Viabilidad media-alta.

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | Congreso Open Data Iniciativas | `congreso.es/opendata/iniciativas` | XML/JSON/CSV | Estado, fechas, tramites, comision | Mecanica simple |
| 2 | BOE API Metadatos | `boe.es/datosabiertos/api/legislacion-consolidada/id/{id}` | XML | Fecha disposicion, publicacion, vigencia | Mecanica simple |
| 3 | BOE API Analisis | `boe.es/datosabiertos/api/legislacion-consolidada/id/{id}/analisis` | XML | Referencias cruzadas (leyes que la modifican, con fechas) | Mecanica simple |
| 4 | Senado Open Data | `senado.es/.../catalogodatos/` | XML | Tramitacion en Senado, fechas | Mecanica compleja |

**Escala de dificultad**: **Mecanica simple** (BOE + Congreso) · Mecanica compleja (Senado)

### Ejemplo real: Timeline reconstruido desde BOE

Desde el BOE se puede reconstruir el timeline de modificaciones de una ley:

```xml
<!-- BOE API /analisis devuelve: -->
<posteriores>
  <posterior>
    <id_norma>BOE-A-2021-8806</id_norma>
    <relacion codigo="270">MODIFICA</relacion>
    <texto>el art. 2 por la LO 7/2021, de 26 de mayo</texto>
  </posterior>
  <posterior>
    <id_norma>BOE-A-2023-XXXXX</id_norma>
    <relacion codigo="270">MODIFICA</relacion>
    <texto>los arts. 47, 48 por la Ley X/2023</texto>
  </posterior>
</posteriores>
```

Y desde las `<version>` del texto:

```
2018-12-07: Ley original publicada (BOE-A-2018-16673)
2021-06-16: Modificada por LO 7/2021 (BOE-A-2021-8806) — art 2
2023-XX-XX: Modificada por Ley X/2023 (BOE-A-2023-XXXXX) — arts 47, 48
```

### Ejemplo: Timeline del Congreso Open Data

Metadatos de iniciativa incluyen:

| Campo | Ejemplo |
|---|---|
| Tipo | Proyecto de Ley |
| Fecha presentacion | 2018-03-15 |
| Comision competente | Comision de Justicia |
| Estado | Aprobado definitivamente |
| Tramites | Calificacion, Ponencia, Comision, Pleno |

### Verificado con

| Fuente | Dato | Status |
|--------|------|--------|
| BOE API `/analisis` | Lista de leyes modificadoras con fechas | API OK |
| BOE API `/texto` | Fechas de vigencia por version | API OK |
| Congreso Open Data | Metadatos de iniciativas descargables | Descarga OK |

## Metricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---|---|---|---|
| Fecha publicacion BOE | Si | Si | BOE metadatos |
| Fecha vigencia | Si | Si | BOE metadatos |
| Fecha de cada modificacion | Si | Si | `fecha_vigencia` en `<version>` |
| Ley modificadora (id + texto) | Si | Si | BOE analisis `<posteriores>` |
| Estado tramitacion Congreso | Si | No (pendiente) | Congreso Open Data |
| Comision competente | Si | No (pendiente) | Congreso Open Data |
| Tramites parlamentarios | Si | No (pendiente) | Congreso Open Data |
| Tramitacion Senado | Si | No (pendiente) | Senado Open Data |
| Sancion Real (fecha) | Parcial | No | BOE `<fecha_disposicion>` |

- **Track A cobertura**: ~70% (timeline de modificaciones completo desde BOE)
- **Track B cobertura**: ~40% (metadatos del Congreso + Senado)

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|---|---|---|
| `<doc name="communication">` | Si | Generado |
| FRBR URIs | Si | BOE ID / ELI |
| `<lifecycle>` eventRef por modificacion | Si | BOE `<posteriores>` + `<version>` fechas |
| `<lifecycle>` eventRef tramitacion parlamentaria | No (pendiente) | Congreso/Senado Open Data |
| `<references>` TLCOrganization | Parcial | Congreso, Senado, BOE |

- **Completitud**: ~60%

## Observaciones

- Para Track A, el BOE da un timeline completo de modificaciones: que ley modifico, cuando, que articulos. Suficiente para `procedureEvents` en el viewer.
- Para Track B, combinar Congreso Open Data (metadatos de iniciativa con tramites) + Senado Open Data (tramitacion Senado) cubre el journey parlamentario.
- No existe un API unico que de todo el lifecycle como EP Open Data para la UE. Hay que combinar BOE + Congreso + Senado.
- Los codigos de relacion del BOE (`270`=MODIFICA, `210`=DEROGA, `407`=ANADE) mapean directamente a tipos de evento en el timeline.
- El Congreso Open Data da metadatos de iniciativas en XML/JSON/CSV descargable, no es API REST en tiempo real.
