# amendment — Reporte de Factibilidad Spain

> Modificaciones a una ley publicada. En Espana hay dos tipos de amendment: (A) reformas legislativas que modifican articulos de leyes existentes via nueva ley, y (B) enmiendas parlamentarias durante la tramitacion de un proyecto de ley.

**Estado**: No implementado.
- Track A (reformas): Viabilidad alta. Datos nativos en BOE.
- Track B (enmiendas parlamentarias): Viabilidad media. Requiere multiples fuentes.

## Track A: Reformas legislativas (ley que modifica otra ley)

### Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | BOE API Texto | `boe.es/datosabiertos/api/legislacion-consolidada/id/{id}/texto` | XML | Versiones por articulo con old/new | Mecanica simple |
| 2 | BOE API Analisis | `boe.es/datosabiertos/api/legislacion-consolidada/id/{id}/analisis` | XML | `<posteriores>` lista de leyes modificadoras | Mecanica simple |

**Escala de dificultad**: 0 (Ya AKN) · **Mecanica simple** · Mecanica compleja · AI simple · AI + Humano · No disponible

### Ejemplo real

Articulo 2 de LO 3/2018 — modificado por LO 7/2021:

```xml
<bloque id="a2" tipo="precepto" titulo="Articulo 2">
  <!-- VERSION 1: Original (2018) — 4 apartados -->
  <version id_norma="BOE-A-2018-16673" fecha_publicacion="20181206" fecha_vigencia="20181207">
    <p class="articulo">Articulo 2. Ambito de aplicacion...</p>
    <p class="parrafo">1. ...</p>
    <p class="parrafo">2. ...</p>
    <p class="parrafo_2">3. ...</p>
    <p class="parrafo">4. El tratamiento de datos por los organos judiciales...</p>
  </version>

  <!-- VERSION 2: Modificada por LO 7/2021 — se anade apartado 5 -->
  <version id_norma="BOE-A-2021-8806" fecha_publicacion="20210527" fecha_vigencia="20210616">
    <p class="articulo">Articulo 2. Ambito de aplicacion...</p>
    <p class="parrafo">1. ...</p>
    <p class="parrafo">2. ...</p>
    <p class="parrafo_2">3. ...</p>
    <p class="parrafo">4. El tratamiento de datos por los organos judiciales...</p>
    <p class="parrafo">5. El tratamiento de datos por el Ministerio Fiscal...</p>
    <blockquote>
      <p class="nota_pie">Se anade el apartado 5 por la disposicion final 4.1
         de la Ley Organica 7/2021. <a class="refPost">Ref. BOE-A-2021-8806#df-4</a></p>
    </blockquote>
  </version>
</bloque>
```

### Algoritmo de changeset

```
Para cada <bloque tipo="precepto"> con mas de 1 <version>:
  Para cada par de versiones consecutivas (N, N+1):
    old_text = extraer texto de version N (ignorar <blockquote>)
    new_text = extraer texto de version N+1 (ignorar <blockquote>)
    if normalizeText(old) != normalizeText(new):
      -> articleChange type="substitute"
    if version N+1 tiene <strong>(Derogado)</strong>:
      -> articleChange type="repeal"

Para bloques que aparecen solo en version N+1 (nuevo articulo):
  -> articleChange type="insert"
```

**Ventaja clave**: El BOE ya da old y new separados. No hay que comparar dos documentos completos como Chile (dos PDFs) o EU (bill vs act). Solo iterar versiones dentro de cada bloque.

### Output AKN esperado

```xml
<amendment name="lo-7-2021-modifica-lo-3-2018">
  <meta>...</meta>
  <akndiff:changeSet
    base="/es/lo/2018/3@2018-12-07"
    result="/es/lo/2018/3@2021-06-16">
    <akndiff:articleChange article="art_2" type="substitute">
      <akndiff:old>1. Lo dispuesto... 4. El tratamiento...</akndiff:old>
      <akndiff:new>1. Lo dispuesto... 5. El tratamiento por el Ministerio Fiscal...</akndiff:new>
    </akndiff:articleChange>
  </akndiff:changeSet>
</amendment>
```

### Verificado con

| Ley | BOE ID | Articulos con multiples versiones | Status |
|-----|--------|-----------------------------------|--------|
| LO 3/2018 Proteccion de Datos | BOE-A-2018-16673 | art 2 (2 versiones) | API OK |
| Codigo Civil (1889) | BOE-A-1889-4763 | art 92 (7 versiones), art 49 (5 versiones) | API OK |

## Track B: Enmiendas parlamentarias (durante tramitacion)

### Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | Senado Open Data | `senado.es/.../enmiendasvetos/` | XML | Enmiendas por iniciativa, texto, autor | Mecanica compleja |
| 2 | BOCG Congreso | `congreso.es/public_oficiales/L{leg}/CONG/BOCG/A/BOCG-{leg}-A-{num}-{fase}.PDF` | PDF | Texto de enmiendas al articulado | AI simple |
| 3 | Congreso Open Data Votaciones | `congreso.es/opendata/votaciones` | XML/JSON | Votaciones nominales por sesion | Mecanica simple |

**Escala de dificultad**: Mecanica simple para votos, **Mecanica compleja** para enmiendas Senado, **AI simple** para PDFs BOCG Congreso

### Documentos del journey parlamentario

| Etapa | Documento | Fuente | Formato | Dificultad |
|---|---|---|---|---|
| Texto inicial | Proyecto/Proposicion de Ley | BOCG | PDF | AI simple |
| Enmiendas Congreso | Enmiendas al articulado | BOCG | PDF | AI simple |
| Informe Ponencia | Texto consolidado tras ponencia | BOCG | PDF | AI simple |
| Dictamen Comision | Texto tras comision | BOCG | PDF | AI simple |
| Votacion Congreso | Resultado pleno | Congreso OpenData | XML/JSON | Mecanica simple |
| Enmiendas Senado | Enmiendas y vetos | Senado OpenData | XML | Mecanica compleja |
| Mensaje motivado | Dos columnas (Congreso vs Senado) | BOCG | PDF | AI simple |
| Ley final | Texto publicado | BOE API | XML | Mecanica simple |

### Particularidades del Senado XML

El Senado publica enmiendas estructuradas en XML descargable por iniciativa:
```
https://www.senado.es/web/ficopendataservlet?tipoFich=9&legis=15
```

Contiene: numero de enmienda, grupo parlamentario, senador autor, tipo (al articulado, a la totalidad, veto), texto propuesto.

### URLs predecibles del BOCG

```
https://www.congreso.es/public_oficiales/L{LEGISLATURA}/CONG/BOCG/{SERIE}/BOCG-{LEG}-{SERIE}-{NUM}-{FASE}.PDF
```

Sufijos: -1 (texto inicial), -2 a -n (enmiendas), -4 (informe ponencia), -5 (dictamen), -8 (enmiendas senado)

## Metricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---|---|---|---|
| Versiones historicas por articulo (Track A) | Si | Si | BOE XML `<version>` |
| Ley modificadora de cada version (Track A) | Si | Si | `id_norma` en `<version>` |
| Nota editorial de modificacion (Track A) | Si | Si | `<blockquote>` con `nota_pie` |
| Enmiendas Senado (Track B) | Si | No (pendiente) | Senado XML |
| Enmiendas Congreso (Track B) | Si | No (pendiente) | BOCG PDFs |
| Votaciones nominales Congreso (Track B) | Si | No (pendiente) | Congreso OpenData |
| Informe de Ponencia (Track B) | Si | No (pendiente) | BOCG PDFs |
| Mensaje motivado Senado (Track B) | Si | No (pendiente) | BOCG PDFs |

- **Track A cobertura**: ~90% (versionado completo con metadata)
- **Track B cobertura**: ~30% (solo votos y enmiendas Senado XML; textos intermedios requieren PDF)

### Completitud AKN

| Campo AKN / AKN Diff | ¿Completado? (Track A) | ¿Completado? (Track B) | Fuente |
|---|---|---|---|
| `<amendment>` type | Si | Si | Generado |
| FRBR URIs | Si | Parcial | ELI / BOE ID |
| `akndiff:changeSet` base/result | Si | Parcial | ELI URIs por version |
| `akndiff:articleChange` substitute | Si | No (pendiente) | BOE `<version>` diff |
| `akndiff:articleChange` insert | Si | No (pendiente) | BOE `<version>` diff |
| `akndiff:articleChange` repeal | Si | No (pendiente) | `fecha_caducidad` + `(Derogado)` |
| `akndiff:vote` result/counts | No (Track A no tiene votos) | Si | Congreso OpenData |
| `akndiff:voter` nominal | No | Si | Congreso OpenData |

- **Track A completitud**: ~80%
- **Track B completitud**: ~30%

## Observaciones

- **Track A es el mas favorable de las tres jurisdicciones**. El BOE entrega exactamente lo que Chile y EU tienen que reconstruir: texto versionado por articulo con metadata de la ley modificadora.
- Track A no incluye votos porque las reformas son ley-a-ley (la votacion fue de la ley modificadora, no de cada articulo individual). Podria enriquecerse buscando la votacion de la ley modificadora en Congreso OpenData.
- Track B tiene la misma dificultad que Chile: PDFs del BOCG para textos intermedios.
- El Senado es mas abierto que el Congreso: ofrece enmiendas en XML estructurado, mientras que el Congreso solo da PDFs.
- El mensaje motivado del Senado (formato dos columnas) es el unico documento del journey que muestra diff explicito, pero es PDF.
- Recomendacion: implementar Track A primero (rapido, alto valor), Track B despues (requiere mas trabajo).
