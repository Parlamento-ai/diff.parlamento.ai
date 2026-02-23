# documentCollection — Reporte de Factibilidad Spain

> Coleccion de documentos agrupados bajo un mismo expediente legislativo. Agrupa proyecto de ley, enmiendas, informes, votaciones y ley final. AKN lo define como contenedor que referencia otros documentos AKN.

**Estado**: No implementado (concepto presente implicitamente en el pipeline via `00-metadata.json`)

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | Congreso Open Data Iniciativas | `congreso.es/opendata/iniciativas` | XML/JSON/CSV | Expediente, documentos vinculados | Mecanica simple |
| 2 | BOE API Analisis | `boe.es/datosabiertos/api/legislacion-consolidada/id/{id}/analisis` | XML | Referencias cruzadas entre leyes | Mecanica simple |
| 3 | Pipeline (local) | N/A | JSON config | Referencias a todos los AKN XMLs generados | Mecanica simple |

**Escala de dificultad**: **Mecanica simple**

### Ejemplo real

**Track A** — Coleccion de versiones de una ley:
```json
{
  "slug": "lo-3-2018-proteccion-datos",
  "boeId": "BOE-A-2018-16673",
  "eli": "https://www.boe.es/eli/es/lo/2018/12/05/3",
  "documents": [
    "01-act-original.xml",
    "02-amendment-1.xml",
    "02-amendment-2.xml",
    "03-act-final.xml"
  ],
  "modifiedBy": [
    { "boeId": "BOE-A-2021-8806", "title": "LO 7/2021", "date": "2021-06-16" }
  ]
}
```

**Track B** — Coleccion del journey parlamentario:
```json
{
  "slug": "ley-vivienda-2023",
  "expediente": "121/000089",
  "documents": [
    "01-bill.xml",
    "02-amendment-ponencia.xml",
    "03-amendment-comision.xml",
    "04-amendment-senado.xml",
    "05-act-final.xml"
  ]
}
```

## Metricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---|---|---|---|
| Lista de leyes modificadoras (Track A) | Si | Si (via BOE analisis) | BOE XML |
| Expediente legislativo (Track B) | Si | No (pendiente) | Congreso Open Data |
| Referencias cruzadas entre documentos | Si | Si (via changeSets) | Generado |

- **Cobertura**: ~50% como agrupacion implicita

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|---|---|---|
| `<documentCollection>` type | No | — |
| `<collectionBody>` references | Parcial | Config JSON |
| `<component>` por documento | No | Cada AKN XML |
| `<meta>` FRBR URI del expediente | No | BOE ID / ELI |

- **Completitud**: ~30% implicitamente

## Observaciones

- Todos los datos ya existen o se generan en el pipeline. Solo falta serializar como `<documentCollection>` AKN formal.
- Para Track A, la coleccion es la ley + sus modificaciones sucesivas.
- Para Track B, la coleccion es el expediente legislativo completo.
- Es un tipo contenedor: su fiabilidad depende de los documentos contenidos.
