# documentCollection — Reporte de Factibilidad EU

> Colección de documentos agrupados bajo un mismo dossier legislativo. En el rito COD, agrupa propuesta COM, amendments EP, posición del Consejo y regulación final. AKN lo define como contenedor que referencia otros documentos AKN.

**Estado**: No implementado como tipo AKN (concepto presente implícitamente en pipeline)

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | EP Open Data API | `data.europarl.europa.eu/api/v2/procedures/{procId}` | JSON-LD | Lista de documentos del dossier | Mecánica simple |
| 2 | Pipeline (local) | N/A | JSON config | Referencias a todos los XMLs generados | Mecánica simple |

**Escala de dificultad**: **Mecánica simple** · Mecánica compleja · AI simple · AI + Humano · No disponible

### Ejemplo real

El pipeline ya genera un config que agrupa los documentos del dossier:

```json
{
  "slug": "digital-services-act-regulation",
  "billFile": "52020PC0825-bill-akn.xml",
  "finalFile": "32022R2065-akn.xml",
  "changesetFile": "changeset-digital-services-act.xml",
  "epAmendmentsFile": "ep-amendments-digital-services-act.xml",
  "legislativeProcedure": { "procedure": "2020/0361(COD)" }
}
```

Esto agrupa los documentos AKN del procedimiento. Solo falta formalizarlo como `<documentCollection>`.

### Verificado con

Concepto funciona implícitamente en las 4 regulaciones probadas (DSA, AI Act, CRA, Data Act). Cada una genera config con referencias cruzadas entre documentos.

## Métricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---------------|--------------|-------------|----------------|
| Lista de documentos del dossier | Sí | Parcial | EP Open Data + config |
| Referencias cruzadas (base/result) | Sí | Sí | changeSet URIs |
| Timeline del procedimiento | Sí | Sí | communication AKN |
| Committee opinions/reports | Sí | No | EP/EUR-Lex (PDFs) |

- **Cobertura**: ~60% como agrupación implícita

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|-----------|--------------|--------|
| `<documentCollection>` type | No | — |
| `<collectionBody>` references | Parcial | Config JSON |
| `<component>` por documento | No | Cada AKN XML |
| `<meta>` FRBR procedure URI | No | Procedure ID |

- **Completitud**: ~30% implícitamente

## Observaciones

- Todos los datos ya existen en el pipeline. Solo falta serializar como `<documentCollection>` AKN formal.
- Es un tipo contenedor: su fiabilidad depende de los documentos contenidos.
- Relación directa con COD: es el "dossier" del procedimiento legislativo.
