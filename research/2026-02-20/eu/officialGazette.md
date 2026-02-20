# officialGazette — Reporte de Factibilidad EU

> El Diario Oficial de la Unión Europea (Official Journal, OJ). Donde se publican todas las regulaciones, directivas y decisiones. La publicación en el OJ marca la entrada en vigor.

**Estado**: No implementado como tipo independiente (datos disponibles indirectamente)

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | EU CELLAR (Formex TOC) | `publications.europa.eu/resource/celex/{CELEX}` | Formex XML (ZIP con TOC) | Índice del OJ, metadatos publicación | Mecánica simple |
| 2 | EU CELLAR SPARQL | `publications.europa.eu/webapi/rdf/sparql` | RDF/SPARQL | Fecha publicación, serie, número OJ | Mecánica simple |

**Escala de dificultad**: **Mecánica simple** · Mecánica compleja · AI simple · AI + Humano · No disponible

### Ejemplo real

Al descargar Formex de una regulación, el ZIP contiene un archivo TOC:

```xml
<TOC>
  <TITLE.TOC>Official Journal of the European Union</TITLE.TOC>
  <OJ.CL>L</OJ.CL>
  <OJ.DATE>2023-12-22</OJ.DATE>
  <ITEM.TOC>
    <NO.OJ>L 2023/2854</NO.OJ>
    <TITLE>Regulation (EU) 2023/2854 — Data Act</TITLE>
    <PAGE.FIRST>1</PAGE.FIRST>
    <PAGE.LAST>71</PAGE.LAST>
  </ITEM.TOC>
</TOC>
```

Series del OJ: **L** (Legislation) contiene actos finales, **C** (Communications) contiene EP amendments.

### Verificado con

Datos OJ disponibles indirectamente en pipeline:

| Regulación | Serie L (Formex act) | Serie C (EP amendments) | TOC disponible |
|------------|---------------------|------------------------|----------------|
| DSA | Sí | Sí | Sí |
| AI Act | Sí | Sí | Sí |
| Data Act | Sí | Sí (trilogue) | Sí |
| CRA | Timeout | Sí (trilogue) | — |

## Métricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---------------|--------------|-------------|----------------|
| Fecha publicación OJ | Sí | Parcial | CELLAR metadata |
| Serie OJ (L, C) | Sí | No | CELLAR metadata |
| Número OJ | Sí | No | CELLAR metadata |
| Tabla de contenido | Sí | No | Formex TOC |
| ELI (European Legislation Identifier) | Sí | No | CELLAR/EUR-Lex |

- **Cobertura**: ~20% (usamos contenido del OJ pero no los metadatos como tipo independiente)

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|-----------|--------------|--------|
| `<officialGazette>` type | No | — |
| FRBR URIs | No | OJ reference |
| `<mainBody>` TOC items | No | Formex TOC |
| Publication date | No | CELLAR metadata |
| Series (L/C) | No | CELLAR metadata |

- **Completitud**: 0% como tipo independiente

## Observaciones

- Todos los datos ya se obtienen indirectamente (Formex ZIP incluye el TOC). Solo falta generar el tipo AKN `<officialGazette>` explícitamente.
- El OJ es la fuente oficial definitiva de la UE. Publicación diaria desde 1952, digital completo desde ~1998.
- Relación directa con COD: la publicación en el OJ es el paso final del rito.
