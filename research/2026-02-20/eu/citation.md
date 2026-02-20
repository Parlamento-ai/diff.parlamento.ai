# citation — Reporte de Factibilidad EU

> Orden del día / agenda de sesiones plenarias y de comité. Tipo propuesto por AKN Diff (no existe en AKN estándar). Representa la citación a una sesión parlamentaria: fecha, hora, lugar, y lista de temas a tratar.

**Estado**: No implementado

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | EP Open Data API | `data.europarl.europa.eu/api/v2/meetings` | JSON-LD | Metadatos de sesiones | Mecánica simple |
| 2 | EP Plenary Agenda | `europarl.europa.eu/doceo/document/OJ-{term}-{date}` | HTML | Temas, documentos, horarios | Mecánica compleja |

**Escala de dificultad**: Mecánica simple · **Mecánica compleja** · AI simple · AI + Humano · No disponible

### Ejemplo real

```
GET https://data.europarl.europa.eu/api/v2/meetings?year=2023&format=application%2Fld%2Bjson&offset=0&limit=5
```

Respuesta (extracto):

```json
{
  "data": [
    {
      "activity_id": "MTG-PL-2023-11-09",
      "had_activity_type": "def/ep-activities/PLENARY_SITTING",
      "activity_date": "2023-11-09",
      "activity_label": {
        "en": "Plenary sitting - 9 November 2023"
      }
    }
  ]
}
```

Agenda detallada en EP website:

```
https://www.europarl.europa.eu/doceo/document/OJ-9-2023-11-09_EN.html
```

```html
<div class="agendaItem">
  <span class="itemNumber">12</span>
  <span class="itemTitle">Data Act ***I</span>
  <span class="reference">A9-0031/2023</span>
  <span class="procedure">2022/0047(COD)</span>
  <span class="rapporteur">Pilar del Castillo Vera</span>
</div>
```

La agenda vincula directamente: item con tema, procedure COD, rapporteur, y documentos de referencia.

### Verificado con

No probado en pipeline. EP Open Data meetings API verificada funcionando (se usa para derivar meeting IDs de votaciones).

## Métricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---------------|--------------|-------------|----------------|
| Fecha/hora sesión plenaria | Sí | Parcial (via meetings API) | EP Open Data |
| Lista de temas (items agenda) | Sí | No | EP Website HTML |
| Vinculación tema → procedure COD | Sí | No | EP Website HTML |
| Rapporteur por tema | Sí | No | EP Website HTML |

- **Cobertura**: ~5% (solo usamos meeting ID para derivar votaciones)

### Completitud AKN

| Campo AKN (propuesto) | ¿Completado? | Fuente |
|------------------------|--------------|--------|
| `<doc name="citation">` | No | — |
| Session date/time | No | EP Open Data |
| Agenda items list | No | EP Website HTML |
| Item → procedure reference | No | EP Website HTML |
| Item → rapporteur | No | EP Website HTML |

- **Completitud**: 0%

## Observaciones

- EP Open Data tiene metadatos de meetings. La agenda detallada (items con referencias) está en el EP website HTML, no en la API.
- Agendas disponibles online desde el 5to mandato (~1999). Formato HTML relativamente estable.
- Relación con COD es indirecta. La agenda lista cuándo se discutirá/votará una regulación, pero no afecta el contenido legislativo. Es un dato operativo, no jurídico.
- Este tipo fue propuesto como tipo nuevo para AKN Diff. AKN estándar no lo contempla.
