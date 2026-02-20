# debate — Reporte de Factibilidad EU

> Registro textual de los debates plenarios del Parlamento Europeo. Contiene las intervenciones de cada MEP sobre un tema legislativo.

**Estado**: No implementado

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | EP CRE (Compte Rendu in Extenso) | `europarl.europa.eu/doceo/document/CRE-{term}-{date}` | HTML | Intervenciones textuales, speakers, grupos | Mecánica compleja |
| 2 | EP Open Data API | `data.europarl.europa.eu/api/v2/plenary-documents` | JSON-LD | Metadatos del debate | Mecánica simple |

**Escala de dificultad**: Mecánica simple · **Mecánica compleja** · AI simple · AI + Humano · No disponible

### Ejemplo real

```
# Debates del 9 de noviembre 2023 (sesión Data Act)
GET https://www.europarl.europa.eu/doceo/document/CRE-9-2023-11-09_EN.html
```

Respuesta: HTML con intervenciones identificadas por speaker.

```html
<div class="section">
  <h3>12. Data Act (debate)</h3>
  <div class="speaker">
    <span class="name">Pilar del Castillo Vera</span>
    <span class="group">PPE</span>
    <span class="function">rapporteur</span>
  </div>
  <p>Mr President, I would like to start by thanking...</p>
</div>
```

Cada intervención incluye: nombre del MEP/Comisario, grupo político, rol, idioma original, y texto completo.

### Verificado con

No probado en pipeline. URLs verificadas manualmente para:

| Regulación | URL CRE | Status |
|------------|---------|--------|
| Data Act | CRE-9-2023-11-09 | HTML disponible |
| AI Act | CRE-9-2024-03-13 | HTML disponible |
| DSA | CRE-9-2022-07-05 | HTML disponible |

CRE disponible para todas las sesiones plenarias.

## Métricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---------------|--------------|-------------|----------------|
| Transcripción completa del debate | Sí | No | CRE HTML |
| Speaker identification | Sí | No | CRE HTML |
| Grupo político del speaker | Sí | No | CRE HTML |
| Idioma original de intervención | Sí | No | CRE HTML |

- **Cobertura**: 0% utilizado (100% disponible)

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|-----------|--------------|--------|
| `<debate>` type | No | — |
| `<debateBody>` | No | — |
| `<debateSection>` por tema | No | CRE HTML sections |
| `<speech>` por intervención | No | CRE HTML speaker divs |
| `<from>` speaker | No | CRE names |

- **Completitud**: 0%

## Observaciones

- El CRE HTML está bien estructurado con speakers identificados. La conversión a AKN `<debate>` sería mecánica compleja pero determinística.
- CRE disponible para todas las sesiones plenarias del PE, desde el 5to mandato (~1999).
- No es parte directa del flujo bill → amendment → act. Agrega contexto sobre qué dijo cada MEP.
