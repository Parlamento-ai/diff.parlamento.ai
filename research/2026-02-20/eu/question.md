# question — Reporte de Factibilidad EU

> Preguntas parlamentarias de MEPs dirigidas a la Comisión, el Consejo u otras instituciones de la UE. Mecanismo de control democrático. Se representaría como `<doc name="question">` en AKN.

**Estado**: No implementado

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | EP Open Data API | `data.europarl.europa.eu/api/v2/parliamentary-questions` | JSON-LD | Metadatos de preguntas | Mecánica simple |
| 2 | EP Website | `europarl.europa.eu/doceo/document/` | HTML | Texto completo pregunta + respuesta | Mecánica compleja |

**Escala de dificultad**: Mecánica simple · **Mecánica compleja** · AI simple · AI + Humano · No disponible

### Ejemplo real

```
GET https://data.europarl.europa.eu/api/v2/parliamentary-questions?format=application%2Fld%2Bjson&year=2023&limit=5
```

Respuesta (extracto):

```json
{
  "data": [
    {
      "identifier": "P-2023-001234",
      "label": "Question for written answer to the Commission",
      "had_participant_person": ["person/12345"],
      "activity_date": "2023-06-15",
      "question_type": "def/ep-question-types/WRITTEN"
    }
  ]
}
```

Tipos: Written questions (E-/P-), Oral questions (O-), Question Time, Priority questions.

### Verificado con

No probado en pipeline. API verificada manualmente — retorna metadatos de preguntas.

## Métricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---------------|--------------|-------------|----------------|
| Metadatos pregunta (autor, fecha, tipo) | Sí | No | EP Open Data |
| Texto completo de la pregunta | Sí | No | EP Website HTML |
| Respuesta de la Comisión/Consejo | Sí | No | EP Website HTML |
| Vinculación a procedimiento legislativo | Parcial | No | No siempre explícita |

- **Cobertura**: 0% utilizado (>90% disponible para preguntas desde ~2004)

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|-----------|--------------|--------|
| `<doc name="question">` | No | — |
| `<meta>` FRBR URIs | No | EP Question ID |
| `<preface>` author, date | No | EP Open Data |
| `<mainBody>` question text | No | EP Website HTML |
| Response section | No | EP Website HTML |

- **Completitud**: 0%

## Observaciones

- EP Open Data tiene API estructurada para metadatos de preguntas. Texto completo requiere acceso al EP website HTML.
- Preguntas disponibles desde el 5to mandato (~1999). ~5000-7000 preguntas escritas por mandato.
- Las preguntas parlamentarias no son parte directa del procedimiento COD. Son un mecanismo de control independiente. No participan en el flujo bill → amendment → act.
