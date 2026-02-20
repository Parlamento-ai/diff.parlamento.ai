# act — Reporte de Factibilidad EU

> Texto final de una regulación publicada en el Diario Oficial (OJ). Resultado del procedimiento legislativo ordinario (COD).

**Estado**: Implementado y verificado en pipeline

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | EU CELLAR | `publications.europa.eu/resource/celex/{CELEX}` | Formex 4 XML (ZIP) | Artículos, títulos, capítulos, preámbulo | Mecánica simple |

### Ejemplo real

```
GET https://publications.europa.eu/resource/celex/32022R2065
Accept: application/xml
Accept-Language: en
```

Respuesta: ZIP con archivos `.fmx.xml`. Extracto:

```xml
<ACT>
  <ENACTING.TERMS>
    <ARTICLE IDENTIFIER="001">
      <TI.ART>Article 1</TI.ART>
      <PARAG><ALINEA><P>Subject matter and scope...</P></ALINEA></PARAG>
    </ARTICLE>
  </ENACTING.TERMS>
</ACT>
```

### Verificado con

| Regulación | CELEX | Artículos | Status |
|------------|-------|-----------|--------|
| Digital Services Act | 32022R2065 | 93 | PASS |
| AI Act | 32024R1689 | 113 | PASS |
| Data Act | 32023R2854 | 50 | PASS |
| Cyber Resilience Act | 32024R2847 | — | FAIL (timeout CELLAR) |

CRA falló por timeout de CELLAR (>120s). Ejecutado directamente fuera del pipeline, descargó correctamente. Es un problema de latencia del servidor, no de formato.

## Métricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---------------|--------------|-------------|----------------|
| Texto completo regulación | Sí | Sí | Formex XML |
| Estructura jerárquica (chapters, sections, articles) | Sí | Sí | Formex XML |
| Preámbulo (considerandos) | Sí | Parcial | Formex XML |
| Anexos | Sí | No | Formex XML |
| Versiones consolidadas | Sí | No | CELLAR (distinto CELEX) |

- **Cobertura**: ~70%

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|-----------|--------------|--------|
| `<act>` type | Sí | Formex |
| FRBR URIs | Sí | CELEX + fechas |
| `<preface>` docTitle, docNumber | Sí | Formex |
| `<preamble>` recitals | Parcial | Formex |
| `<body>` articles | Sí | Formex |
| `<conclusions>` | No | — |
| `<attachments>` (annexes) | No | Disponible, no implementado |

- **Completitud**: ~75%

## Observaciones

- CELLAR es la fuente oficial de la UE, activa desde ~2012. Formex disponible para regulaciones desde ~2000.
- Tiempos de descarga variables: 2-180 segundos. CELLAR puede ser muy lento.
- Todas las regulaciones COD se publican en el OJ. Cobertura 100% para actos finales.
