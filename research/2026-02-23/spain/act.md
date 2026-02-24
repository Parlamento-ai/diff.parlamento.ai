# act — Reporte de Factibilidad Spain

> Texto de una ley publicada en el BOE (Boletin Oficial del Estado). Resultado del procedimiento legislativo ordinario bicameral (Congreso + Senado + Sancion Real).

**Estado**: No implementado. Viabilidad alta.

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | BOE API Legislacion Consolidada | `boe.es/datosabiertos/api/legislacion-consolidada/id/{id}/texto` | XML propietario | Articulos, titulos, capitulos, preambulo, versiones | Mecanica simple |
| 2 | BOE API Metadatos | `boe.es/datosabiertos/api/legislacion-consolidada/id/{id}` | XML propietario | Identificador, rango, fechas, ELI, materias, referencias | Mecanica simple |

**Escala de dificultad**: 0 (Ya AKN) · **Mecanica simple** · Mecanica compleja · AI simple · AI + Humano · No disponible

### Ejemplo real

```bash
curl -s -H "Accept: application/xml" \
  "https://www.boe.es/datosabiertos/api/legislacion-consolidada/id/BOE-A-2018-16673/texto"
```

Respuesta (extracto):

```xml
<response>
  <data>
    <texto>
      <bloque id="a1" tipo="precepto" titulo="Articulo 1">
        <version id_norma="BOE-A-2018-16673" fecha_publicacion="20181206" fecha_vigencia="20181207">
          <p class="articulo">Articulo 1. Objeto de la ley.</p>
          <p class="parrafo">La presente ley organica tiene por objeto:</p>
          <p class="parrafo_2">a) Adaptar el ordenamiento juridico espanol...</p>
        </version>
      </bloque>
    </texto>
  </data>
</response>
```

### Verificado con

| Ley | BOE ID | Articulos | Versiones | Status |
|-----|--------|-----------|-----------|--------|
| LO 3/2018 Proteccion de Datos | BOE-A-2018-16673 | 97 | art 2 tiene 2 versiones | API OK |
| Codigo Civil (1889) | BOE-A-1889-4763 | 1976 | art 92 tiene 7 versiones | API OK |
| Ley 28/2022 Startups | BOE-A-2022-21739 | ~50 | Pocas versiones | API OK |

100% de exito en las 3 leyes probadas con la API.

### Mapeo BOE XML -> AKN

| BOE elemento | AKN elemento |
|---|---|
| `<bloque tipo="preambulo">` | `<preamble>` |
| `<bloque tipo="encabezado">` con `<p class="titulo_num">` | `<title>` |
| `<bloque tipo="encabezado">` con `<p class="capitulo_num">` | `<chapter>` |
| `<bloque tipo="precepto">` | `<article>` |
| `<bloque tipo="firma">` | `<conclusions>` |
| `<p class="articulo">` | `<num>` + `<heading>` |
| `<p class="parrafo">` | `<content><p>` |
| `<version>` primera | Version original del act |
| `<version>` ultima | Version vigente (act final) |

### Particularidades

- **Estructura plana**: Los `<bloque>` son siblings (no hay nesting). Hay que reconstruir la jerarquia titulo > capitulo > articulo por orden de aparicion.
- **IDs inconsistentes**: `a1` vs `art1` vs `art_1` segun la ley. Parsear desde `titulo` o `<p class="articulo">`.
- **HTML dentro de XML**: Contenido usa `<p>` con clases CSS, `<em>`, `<strong>`, `<a>`.
- **Notas editoriales**: `<blockquote>` con `nota_pie` al final de cada `<version>` modificada.
- **Articulos derogados**: `fecha_caducidad` en el `<bloque>` + `<strong>(Derogado)</strong>` en el texto.

## Metricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---|---|---|---|
| Texto completo ley publicada | Si | Si | BOE XML `<bloque>` |
| Estructura jerarquica (titulos, capitulos, articulos) | Si | Si | BOE XML `tipo` + clases CSS |
| Preambulo | Si | Si | BOE XML `<bloque tipo="preambulo">` |
| Disposiciones adicionales/transitorias/finales | Si | Si | BOE XML `<bloque tipo="precepto">` con id `da*`, `dt*`, `df*` |
| Firma (Rey, Ministro) | Si | No | BOE XML `<bloque tipo="firma">` |
| Todas las versiones historicas por articulo | Si | Si | BOE XML multiples `<version>` |
| Ley modificadora de cada version | Si | Si | `id_norma` en `<version>` |
| Fecha de entrada en vigor de cada version | Si | Si | `fecha_vigencia` en `<version>` |
| Nota editorial de cada modificacion | Si | Parcial | `<blockquote>` con `nota_pie` |
| Materias/temas de la ley | Si | No | BOE XML `<materia>` |
| Referencias cruzadas (leyes que modifica/la modifican) | Si | No | BOE XML `<anteriores>/<posteriores>` |
| ELI URI | Si | Si | BOE XML `<url_eli>` |
| Anexos | Si | No | BOE XML (bloques tipo encabezado con "ANEXO") |

- **Datos disponibles pero no aprovechados**: Firma, materias, referencias cruzadas, anexos
- **Cobertura**: ~85% de los datos publicos del rito que fueron utilizados

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|---|---|---|
| `<act>` type | Si | `<rango>` del BOE (Ley, Ley Organica, Real Decreto, etc.) |
| FRBR URIs | Si | ELI URI del BOE |
| `<preface>` docTitle, docNumber | Si | `<titulo>`, `<numero_oficial>` |
| `<preamble>` | Si | `<bloque tipo="preambulo">` |
| `<body>` articles | Si | `<bloque tipo="precepto">` |
| `<body>` hierarchy (titles, chapters) | Si | `<bloque tipo="encabezado">` |
| `<conclusions>` | Si | `<bloque tipo="firma">` |
| `<attachments>` (annexes) | No | Disponible, no implementado |

- **Completitud**: ~85%

## Observaciones

- El BOE es la fuente oficial del Estado espanol. API publica desde ~2018, legislacion consolidada desde 1978.
- **Es la fuente mas limpia de las tres jurisdicciones** (Chile, EU, Espana). XML estructurado con versionado nativo, sin necesidad de PDF parsing ni SPARQL.
- Tiempos de respuesta rapidos (1-5 segundos para leyes normales, 10-30s para el Codigo Civil completo).
- Cobertura 100% para leyes estatales publicadas en el BOE.
- Leyes consolidadas con estado "Finalizado" (codigo 3) estan completamente actualizadas.
- El header `Accept: application/xml` es obligatorio. JSON no esta soportado para este endpoint.
- +90,000 leyes identificadas con ELI, disponibles desde 1978.
