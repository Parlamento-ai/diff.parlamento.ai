# amendment — Reporte de Factibilidad EU

> Enmiendas del Parlamento Europeo en primera lectura + diff computado (AKN Diff `changeSet`) entre propuesta y regulación final. Cubre tanto los amendments del EP como el changeset bill→act.

**Estado**: Implementado. EP amendments funcionan para ~50% de regulaciones. Changeset funciona 100%.

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | EU CELLAR (OJ HTML) | `publications.europa.eu/resource/celex/5{year}AP{num}` | OJ CONVEX XHTML | Tablas de amendments artículo por artículo | Mecánica compleja |
| 2 | Computado (bill vs act) | N/A | AKN XML diff | Artículos modificados/insertados/eliminados | Mecánica simple |

### Fuente 1: EP Amendments (CELLAR)

CELEX se deriva del TA reference: `ta-9-2022-0014.html` → `52022AP0014`

```
GET https://publications.europa.eu/resource/celex/52022AP0014
Accept: application/xhtml+xml, text/html
Accept-Language: en
```

Respuesta para DSA (1.6MB): tablas OJ con old/new por artículo.

```html
<table class="oj-table">
  <tr><td><p class="oj-bold">Amendment 1</p></td></tr>
  <tr>
    <td><p>Text proposed by the Commission</p></td>
    <td><p>Amendment</p></td>
  </tr>
  <tr>
    <td><p>Article 1(1) This Regulation lays down...</p></td>
    <td><p>Article 1(1) This Regulation lays down <b>harmonised</b> rules...</p></td>
  </tr>
</table>
```

Respuesta para CRA (14KB): solo resolución legislativa, sin tablas.

### Problema: Trilogue vs Pre-Trilogue

| Tipo de acuerdo | OJ tiene amendments detallados? | Tamaño HTML |
|-----------------|--------------------------------|-------------|
| EP posición con amendments | Sí — tablas `oj-table` | 1-3 MB |
| Trilogue agreement | No — solo resolución | 10-15 KB |

Cuando EP y Consejo acuerdan en trilogue, el EP vota el texto completo sin amendments individuales. El OJ solo publica la resolución.

### Fuente 2: Changeset computado (AKN Diff)

No requiere API. Compara bill AKN vs act AKN artículo por artículo y genera `akndiff:changeSet` con `substitute`, `insert`, `repeal`.

La fórmula `bill_articles + insertions = final_articles` sirve como cross-check automático.

### Verificado con

| Regulación | EP CELEX | EP HTML | EP changes | Changeset | Status |
|------------|----------|---------|------------|-----------|--------|
| DSA | 52022AP0014 | 1.6 MB | 76 | 74+19=93 | PASS |
| AI Act | 52023AP0236 | 2.7 MB | 92 | 85+28=113 | PASS |
| CRA | 52024AP0130 | 14 KB | 0 (trilogue) | pendiente | WARN |
| Data Act | 52023AP0385 | 14 KB | 0 (trilogue) | pendiente | WARN |

EP amendments: 2/4 PASS (50%). Changeset: 2/2 PASS donde bill+act estaban disponibles (100%).

## Métricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---------------|--------------|-------------|----------------|
| EP amendments artículo por artículo | Parcial (~50%) | Sí | OJ CONVEX HTML |
| Diff bill→act (changeset) | Computable | Sí | Algoritmo local |
| EP committee reports (con amendments) | Sí | No | PDF en EP website |
| Resolución legislativa EP | Sí (100%) | No | OJ HTML |

- **Cobertura**: ~60% (changeset cubre 100%, EP amendments ~50%)

### Completitud AKN

| Campo AKN / AKN Diff | ¿Completado? | Fuente |
|-----------------------|--------------|--------|
| `<amendment>` type | Sí | Generado |
| FRBR URIs | Sí | TA reference |
| `akndiff:changeSet` base/result | Sí | FRBR URIs bill/act |
| `akndiff:articleChange` substitute | Sí | Diff + OJ tables |
| `akndiff:articleChange` insert | Sí | Diff + OJ tables |
| `akndiff:vote` result/counts | Sí | Config metadata |
| `akndiff:voter` nominal | Sí (via vote data) | EP Open Data |

- **Completitud**: ~70% cuando OJ tiene tablas, ~40% cuando es trilogue (solo changeset, sin EP amendments)

## Observaciones

- El changeset (diff computado) funciona siempre que bill y act estén disponibles. Es 100% determinístico.
- Los EP amendments vía CELLAR OJ funcionan solo cuando el EP publicó posición con tablas (~50% de regulaciones COD). Trilogue agreements no tienen tablas.
- Los EP committee reports (PDFs de 100-500 págs) contienen amendments incluso para trilogue texts. Podrían cubrir el gap del 50%, pero requieren parsing PDF con dificultad "AI simple".
- CELLAR OJ HTML disponible desde ~2010. Regulaciones anteriores pueden tener formato distinto.
