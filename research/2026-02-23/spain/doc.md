# doc — Reporte de Factibilidad Spain

> Tipo generico de AKN para documentos sin tipo especifico. En Espana se usa para: votaciones plenarias (`doc name="vote"`), informes de ponencia, dictamenes de comision, y otros documentos del proceso legislativo.

**Estado**: No implementado

## Sub-tipos y fuentes

| Sub-tipo | Fuente | Formato | Dificultad | Estado |
|---|---|---|---|---|
| **vote** (votaciones Congreso) | Congreso Open Data | XML/JSON/CSV | Mecanica simple | No implementado |
| **vote** (votaciones Senado) | Senado Open Data | XML | Mecanica simple | No implementado |
| Informe de Ponencia | BOCG | PDF | AI simple | No implementado |
| Dictamen de Comision | BOCG | PDF | AI simple | No implementado |
| Memoria de Analisis de Impacto | Congreso web | PDF | AI + Humano | No implementado |
| Dictamen Consejo de Estado | Consejo de Estado web | PDF | AI + Humano | No implementado |

## Sub-tipo: vote (votaciones)

### Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | Congreso Open Data Votaciones | `congreso.es/opendata/votaciones` | XML/JSON/CSV | Resultado, votos nominales por diputado | Mecanica simple |
| 2 | Senado Open Data | `senado.es/.../catalogodatos/` | XML | Votaciones por iniciativa | Mecanica simple |

**Escala de dificultad**: **Mecanica simple**

### Ejemplo real

**Congreso Open Data — Votaciones**:
Dataset descargable por legislatura y sesion con campos:
- Sesion, fecha, numero de votacion
- Titulo/asunto de la votacion
- Resultado (aprobado/rechazado)
- Voto de cada diputado (si/no/abstencion)
- Grupo parlamentario de cada diputado

### Verificado con

| Fuente | Dato | Status |
|--------|------|--------|
| Congreso Open Data | Votaciones XV Legislatura | Descarga OK |
| Senado Open Data | Votaciones por iniciativa | Descarga OK |

### Output AKN esperado

```xml
<akndiff:vote date="2023-04-27" result="approved"
  source="https://www.congreso.es/opendata/votaciones">
  <akndiff:for count="176">
    <akndiff:voter href="/es/congreso/diputado/{id}" showAs="Nombre Apellido"/>
    ...
  </akndiff:for>
  <akndiff:against count="170">
    <akndiff:voter href="/es/congreso/diputado/{id}" showAs="Nombre Apellido"/>
    ...
  </akndiff:against>
  <akndiff:abstain count="1"/>
</akndiff:vote>
```

## Sub-tipos NO implementados

**Informe de Ponencia**: Texto consolidado tras examen en ponencia. Solo disponible como PDF en BOCG (sufijo -4). Contiene el texto articulado modificado + relacion de enmiendas aceptadas/rechazadas. Dificultad: AI simple.

**Dictamen de Comision**: Texto aprobado por la Comision. PDF en BOCG (sufijo -5). Similar al informe de ponencia pero con modificaciones adicionales de la Comision. Dificultad: AI simple.

**Dictamen del Consejo de Estado**: Solo para proyectos de ley del Gobierno. PDF en web del Consejo de Estado. Dificultad: AI + Humano.

## Metricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---|---|---|---|
| Votaciones nominales Congreso | Si | No (pendiente) | Congreso Open Data |
| Votaciones Senado | Si | No (pendiente) | Senado Open Data |
| Informe de Ponencia | Si | No | BOCG PDF |
| Dictamen de Comision | Si | No | BOCG PDF |
| Dictamen Consejo de Estado | Parcial | No | PDF |

- **Cobertura**: 0% utilizado (votaciones ~90% disponibles, informes en PDF)

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|---|---|---|
| `<doc name="vote">` | No | — |
| `akndiff:vote` result/counts | No (pendiente) | Congreso/Senado Open Data |
| `akndiff:voter` nominal | No (pendiente) | Congreso Open Data |
| Informe Ponencia content | No | BOCG PDF |
| Dictamen Comision content | No | BOCG PDF |

- **Completitud**: 0%

## Observaciones

- Votaciones del Congreso son la fuente mas valiosa. Datos nominales (voto de cada diputado) disponibles en formato estructurado.
- Las votaciones son por sesion, no por ley individual. Una sesion puede tener 10-50 votaciones. Hay que matchear por titulo/asunto.
- Informes de ponencia y dictamenes son PDFs del BOCG. Misma dificultad que el pipeline de Chile para PDFs.
- Datos de votaciones del Congreso disponibles desde la X Legislatura (~2011).
