# bill — Reporte de Factibilidad EU

> Propuesta legislativa de la Comisión Europea (documento COM). Punto de partida del procedimiento COD.

**Estado**: Implementado y verificado en pipeline

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | EU CELLAR | `publications.europa.eu/resource/celex/{CELEX}` | XHTML | Artículos, títulos, preámbulo | Mecánica compleja |

### Ejemplo real

```
GET https://publications.europa.eu/resource/celex/52022PC0068
Accept: application/xhtml+xml
Accept-Language: en
```

Respuesta: XHTML del documento COM. No existe Formex para propuestas — solo XHTML.

```html
<p class="Titrearticle">Article 1</p>
<p class="ti-art">Subject matter and scope</p>
<p class="Normal">1. This Regulation lays down harmonised rules on...</p>
```

Las CSS classes varían entre propuestas (`Titrearticle`, `Articleno`, `Normal`). El pipeline usa regex multilingüe para detectar artículos en EN/DE/FR/ES/IT.

### Verificado con

| Regulación | CELEX | Artículos | Status |
|------------|-------|-----------|--------|
| Digital Services Act | 52020PC0825 | 74 | PASS |
| AI Act | 52021PC0206 | 85 | PASS |
| Cyber Resilience Act | 52022PC0454 | 57 | PASS |
| Data Act | 52022PC0068 | 42 | PASS |

100% de éxito en las 4 regulaciones probadas.

## Métricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---------------|--------------|-------------|----------------|
| Texto completo propuesta | Sí | Sí | XHTML |
| Estructura de artículos | Sí | Sí | XHTML (parsing) |
| Exposición de motivos | Sí | No | XHTML |
| Impact Assessment | Sí | No | PDF separado |
| Metadatos COM | Sí | Sí | CELEX |

- **Cobertura**: ~60%

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|-----------|--------------|--------|
| `<bill>` type | Sí | Hardcoded |
| FRBR URIs | Sí | CELEX + fecha |
| `<preface>` docTitle | Sí | XHTML parsing |
| `<preamble>` recitals | Parcial | XHTML parsing |
| `<body>` articles | Sí | XHTML parsing |

- **Completitud**: ~65%

## Observaciones

- CELLAR sirve XHTML para todas las propuestas COM. Cobertura 100% para COD.
- La dificultad es "mecánica compleja" porque el XHTML no es estructurado: cada propuesta puede usar CSS classes distintas. Funciona bien (~99%) pero no es determinístico.
- Propuestas COM disponibles en CELLAR desde ~1999.
