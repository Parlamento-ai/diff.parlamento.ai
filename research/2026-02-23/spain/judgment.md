# judgment — Reporte de Factibilidad Spain

> Sentencias del Tribunal Constitucional (TC) que declaran inconstitucionalidad de articulos de leyes. Afectan directamente el texto vigente de la legislacion.

**Estado**: No implementado

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | BOE API (indirectamente) | `boe.es/datosabiertos/api/legislacion-consolidada/id/{id}/texto` | XML | `<blockquote class="noDesde99999999">` con declaracion de inconstitucionalidad | Mecanica simple |
| 2 | BOE API Analisis | `boe.es/datosabiertos/api/legislacion-consolidada/id/{id}/analisis` | XML | Referencias a sentencias TC en `<posteriores>` | Mecanica simple |
| 3 | BOE - Sentencias TC | `boe.es/diario_boe/txt.php?id=BOE-A-{id}` | HTML | Texto completo de la sentencia | Mecanica compleja |
| 4 | Tribunal Constitucional | `hj.tribunalconstitucional.es` | HTML | Buscador de sentencias | Mecanica compleja |

**Escala de dificultad**: **Mecanica simple** (deteccion via BOE) · Mecanica compleja (texto completo sentencia)

### Ejemplo real verificado

Articulo 92 del Codigo Civil (BOE-A-1889-4763) — version 4 de 5:

```xml
<version id_norma="BOE-A-2012-14060" fecha_publicacion="20121114" fecha_vigencia="20121114">
  <p class="articulo">Articulo 92.</p>
  ...
  <p class="parrafo">8. Excepcionalmente... con informe <strong>favorable</strong> del
     Ministerio Fiscal, podra acordar la guarda y custodia compartida...</p>
  <blockquote class="noDesde99999999">
    <p class="parrafo">Declarado inconstitucional y nulo el inciso destacado del
       apartado 8 por Sentencia del TC de 17 de octubre de 2012.
       <a class="refPost">Ref. BOE-A-2012-14060</a>.</p>
  </blockquote>
  ...
</version>
```

**Observar**:
- El texto inconstitucional se marca con `<strong>` (negrita): la palabra "favorable"
- La nota usa `class="noDesde99999999"` (fecha especial = permanente)
- La referencia apunta a la sentencia publicada en el BOE: `BOE-A-2012-14060`

### Verificado con

| Ley | BOE ID | Articulo | Sentencia TC | Status |
|-----|--------|----------|-------------|--------|
| Codigo Civil | BOE-A-1889-4763 | art 92.8 | STC 17/10/2012 (BOE-A-2012-14060) | **API OK** — `<blockquote class="noDesde99999999">` presente |

### Como se detecta mecanicamente

1. Buscar `<blockquote class="noDesde99999999">` dentro de `<version>` → sentencia TC
2. Buscar `<strong>` dentro del texto del articulo → texto declarado inconstitucional
3. Extraer referencia BOE de la sentencia desde `<a class="refPost">Ref. BOE-A-XXXX-XXXXX</a>`
4. Mapear a AKN: `type="repeal"` parcial (solo el inciso marcado en `<strong>`)

## Metricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---|---|---|---|
| Deteccion de inconstitucionalidad | Si | No (pendiente) | BOE XML `<blockquote class="noDesde99999999">` |
| Texto inconstitucional marcado | Si | No (pendiente) | BOE XML `<strong>` dentro del articulo |
| Referencia a sentencia TC | Si | No (pendiente) | BOE XML `<a class="refPost">` |
| Fecha de la sentencia | Si | No (pendiente) | Texto de la nota + `fecha_publicacion` |
| Texto completo sentencia | Si | No | BOE HTML / TC website |
| Fundamentos juridicos | Si | No | BOE HTML / TC website |

- **Cobertura**: 0% utilizado (~80% disponible via BOE indirectamente)

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|---|---|---|
| `<judgment>` type | No | — |
| Referencia a ley afectada | No (disponible) | BOE analisis |
| Articulo/inciso afectado | No (disponible) | `<strong>` en BOE texto |
| Fecha sentencia | No (disponible) | BOE nota |
| Efecto (nulidad parcial/total) | No (disponible) | Texto de `<blockquote>` |

- **Completitud**: 0%

## Observaciones

- **Diferencia clave con EU**: En Espana las sentencias del TC afectan DIRECTAMENTE el texto de la ley y se reflejan en el BOE consolidado. El BOE ya marca el texto inconstitucional con `<strong>` y la nota con `class="noDesde99999999"`. Esto es detectable mecanicamente sin necesidad de parsear la sentencia completa.
- En EU las sentencias del TJUE son contexto indirecto. En Espana las sentencias del TC son modificaciones efectivas del texto legislativo.
- Para Track A, la deteccion de inconstitucionalidad puede integrarse como un tipo especial de `articleChange` (parcial, solo el inciso en `<strong>`).
- El Tribunal Constitucional tiene buscador en `hj.tribunalconstitucional.es` pero no API publica.
- Las sentencias se publican en el BOE (Seccion Tribunal Constitucional) y se puede acceder via `boe.es/diario_boe/txt.php?id=BOE-A-{id}`.
