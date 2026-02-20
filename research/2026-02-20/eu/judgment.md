# judgment — Reporte de Factibilidad EU

> Sentencias del Tribunal de Justicia de la UE (CJEU). Interpretaciones judiciales que afectan cómo se aplica una regulación.

**Estado**: No implementado

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | EU CELLAR | `publications.europa.eu/resource/celex/6{year}CJ{num}` | XHTML | Texto sentencia, partes, decisión | Mecánica compleja |
| 2 | CURIA (CJEU) | `curia.europa.eu/juris/liste.jsf` | HTML | Sentencias por caso | Mecánica compleja |

**Escala de dificultad**: Mecánica simple · **Mecánica compleja** · AI simple · AI + Humano · No disponible

### Ejemplo real

```
# Sentencia C-401/20 (ejemplo CELEX para sentencias: prefijo 6)
GET https://publications.europa.eu/resource/celex/62020CJ0401
Accept: application/xhtml+xml
Accept-Language: en
```

Respuesta: XHTML del texto completo de la sentencia.

```html
<body>
  <p class="C19Centre">JUDGMENT OF THE COURT (Grand Chamber)</p>
  <p class="C19Centre">13 May 2014</p>
  <p class="C71Indicateur">In Case C-131/12,</p>
  <p class="C02AlineaAltA">Google Spain SL...</p>
  <p class="C41OperatifTraitSouligne">On those grounds, the Court hereby rules:</p>
  <p class="C08Dispositif">1. Article 2(b) of Directive 95/46/EC...</p>
</body>
```

### Verificado con

No probado en pipeline. CELLAR sirve sentencias en XHTML confirmado manualmente.

## Métricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---------------|--------------|-------------|----------------|
| Texto completo sentencia | Sí | No | CELLAR XHTML |
| Partes del caso | Sí | No | CELLAR XHTML |
| Dispositivo (fallo) | Sí | No | CELLAR XHTML |
| Opinión Abogado General | Sí | No | CELLAR (CELEX separado) |

- **Cobertura**: 0% utilizado (100% disponible vía CELLAR)

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|-----------|--------------|--------|
| `<judgment>` type | No | — |
| `<header>` court, date, caseNumber | No | CELLAR XHTML |
| `<judgmentBody>` introduction, background, motivation, decision | No | CELLAR XHTML |
| `<decision>` operative part | No | CELLAR XHTML |

- **Completitud**: 0%

## Observaciones

- CELLAR tiene sentencias en XHTML, pero la estructura HTML varía entre sentencias de distintas épocas y cámaras del tribunal.
- Sentencias disponibles en CELLAR desde los años 1950. Formato digital desde ~2000.
- Relación con COD es indirecta. Las sentencias no son parte del procedimiento legislativo. Son contexto jurídico (sentencia que motiva regulación, o interpretación post-publicación).
- ~600-800 sentencias por año del CJEU. Solo una fracción se relaciona con regulaciones COD específicas.
