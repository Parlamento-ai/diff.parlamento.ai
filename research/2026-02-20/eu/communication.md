# communication — Reporte de Factibilidad EU

> Comunicación inter-institucional del ciclo de vida legislativo. Cada evento del procedimiento COD: propuesta Comisión, opiniones PE/Consejo, trilogue, adopción, publicación OJ.

**Estado**: Implementado y verificado en pipeline

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | EP Open Data API | `data.europarl.europa.eu/api/v2/procedures/{procId}` | JSON-LD | Eventos, fechas, instituciones, documentos | Mecánica simple |

### Ejemplo real

```
# Procedure ID usa guiones, NO slashes: 2022/0047 → 2022-0047
GET https://data.europarl.europa.eu/api/v2/procedures/2022-0047?format=application%2Fld%2Bjson
```

Respuesta (extracto):

```json
{
  "data": [{
    "process_id": "2022-0047",
    "process_title": { "en": "Harmonised rules on fair access to and use of data (Data Act)" },
    "current_stage": "def/ep-events/SIGN_FINAL_ACT",
    "consists_of": [
      { "activity_date": "2022-02-23", "had_activity_type": "def/ep-events/COMMISSION_PROPOSAL" },
      { "activity_date": "2023-03-14", "had_activity_type": "def/ep-events/EP_1_READING_COMMITTEE_REPORT" },
      { "activity_date": "2023-11-09", "had_activity_type": "def/ep-events/EP_1_READING" },
      { "activity_date": "2023-11-27", "had_activity_type": "def/ep-events/COUNCIL_1_READING" },
      { "activity_date": "2023-12-13", "had_activity_type": "def/ep-events/SIGN_FINAL_ACT" }
    ]
  }]
}
```

### Verificado con

| Regulación | Procedure ID | Eventos | Status |
|------------|-------------|---------|--------|
| Digital Services Act | 2020-0361 | 25 | PASS |
| AI Act | 2021-0106 | 32 | PASS |
| Cyber Resilience Act | 2022-0272 | 17 | PASS |
| Data Act | 2022-0047 | 25 | PASS |

100% de éxito en las 4 regulaciones. Bug corregido: procedure IDs usan guiones en la API, no slashes.

## Métricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---------------|--------------|-------------|----------------|
| Propuesta COM (fecha, ref) | Sí | Sí | EP Open Data |
| Opinión comités EP | Sí | Sí | EP Open Data |
| EP primera lectura | Sí | Sí | EP Open Data |
| Posición del Consejo | Sí | Sí | EP Open Data |
| Firma acto final | Sí | Sí | EP Open Data |
| Publicación OJ | Sí | Sí | EP Open Data |
| Rapporteur (ponente) | Sí | No | EP Open Data |

- **Cobertura**: ~80%

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|-----------|--------------|--------|
| `<doc name="communication">` | Sí | Generado |
| FRBR URIs | Sí | Procedure ID |
| `<lifecycle>` eventRef | Sí | EP Open Data events |
| `<references>` TLCOrganization | Sí | Instituciones UE |
| `<mainBody>` sections | Sí | EP Open Data events |

- **Completitud**: ~80%

## Observaciones

- EP Open Data es la fuente más fiable para lifecycle data. API lanzada ~2022, procedimientos COD disponibles desde ~1999.
- Cobertura 100% para procedimientos COD.
- Rate limiting generoso, respuestas JSON-LD bien estructuradas.
