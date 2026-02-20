# doc — Reporte de Factibilidad EU

> Tipo genérico de AKN para documentos sin tipo específico. En EU se usa para: votaciones plenarias (`doc name="vote"`), committee reports, staff working documents, impact assessments, y otros documentos del proceso COD.

**Estado**: Parcialmente implementado (vote como sub-tipo principal)

## Sub-tipos y fuentes

| Sub-tipo | Fuente | Formato | Dificultad | Estado |
|----------|--------|---------|------------|--------|
| **vote** (votaciones) | EP Open Data API | JSON-LD | Mecánica simple | Implementado |
| EP committee report | EP Website | PDF/HTML | AI simple | No implementado |
| Council position | Consilium | PDF | AI + Humano | No implementado |
| Impact assessment | CELLAR | PDF | AI + Humano | No implementado |
| Staff working document | CELLAR | XHTML/PDF | Mecánica compleja | No implementado |

## Sub-tipo implementado: vote

### Ejemplo real

```
# Meeting ID = MTG-PL-{fecha votación}
GET https://data.europarl.europa.eu/api/v2/meetings/MTG-PL-2023-11-09/decisions?format=application%2Fld%2Bjson
```

Respuesta (extracto):

```json
{
  "data": [{
    "decision_method": "def/ep-decision-methods/ROLL_CALL_VOTE",
    "decision_outcome": "def/ep-decision-outcomes/ADOPTED",
    "had_decision_count": [
      { "decision_count": 481, "decision_count_type": "def/ep-decision-count-types/FOR" },
      { "decision_count": 31, "decision_count_type": "def/ep-decision-count-types/AGAINST" },
      { "decision_count": 71, "decision_count_type": "def/ep-decision-count-types/ABSTENTION" }
    ]
  }]
}
```

Nombres de MEPs via endpoint separado:

```
GET https://data.europarl.europa.eu/api/v2/meps?format=application%2Fld%2Bjson&parliamentary-term=9&offset=0&limit=50
```

### Verificado con

| Regulación | Meeting ID | Decisiones | Status |
|------------|-----------|------------|--------|
| Digital Services Act | MTG-PL-2022-07-05 | 132 | PASS |
| AI Act | MTG-PL-2024-03-13 | 651 | PASS |
| Cyber Resilience Act | MTG-PL-2024-03-12 | 164 | PASS |
| Data Act | MTG-PL-2023-11-09 | 472 | PASS |

100% de éxito. Datos por sesión plenaria completa (todas las votaciones del día). Se integran al `akndiff:vote` dentro de amendments.

## Sub-tipos NO implementados

**EP committee reports** son la fuente más valiosa no explotada. Contienen amendments artículo por artículo incluso para regulaciones trilogue (resolvería el gap del 50% en amendment). Formato: PDF/HTML semi-estructurado en `europarl.europa.eu/doceo/document/A-{term}-{year}-{num}`. Dificultad: AI simple.

**Council documents** no tienen API pública estructurada. Solo PDFs en `consilium.europa.eu`. Dificultad: AI + Humano.

## Métricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---------------|--------------|-------------|----------------|
| Votaciones plenarias (vote) | Sí | Sí | EP Open Data |
| Nombres MEPs nominales | Sí | Sí | EP Open Data |
| EP committee reports | Sí | No | EP PDF/HTML |
| Council documents | Parcial | No | Consilium PDF |
| Impact assessments | Sí | No | CELLAR PDF |

- **Cobertura**: ~30% (solo vote de los sub-tipos genéricos)

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|-----------|--------------|--------|
| `<doc>` type | Sí (vote) | Generado |
| `akndiff:vote` result/counts | Sí | EP Open Data |
| `akndiff:voter` nominal | Sí | EP Open Data MEPs |
| Committee report content | No | — |

- **Completitud**: ~30%

## Observaciones

- Vote funciona al 100%, datos desde mandato 6 (~2004).
- Los datos de votación son por sesión, no por regulación. Una sesión puede tener 100-700 votaciones.
- EP committee reports serían el siguiente sub-tipo más valioso a implementar.
