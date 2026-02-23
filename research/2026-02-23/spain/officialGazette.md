# officialGazette — Reporte de Factibilidad Spain

> El Boletin Oficial del Estado (BOE). Diario oficial donde se publican todas las leyes, reales decretos y disposiciones. La publicacion en el BOE marca la entrada en vigor.

**Estado**: No implementado como tipo AKN independiente (datos disponibles y verificados via API)

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | BOE API Sumario diario | `boe.es/datosabiertos/api/boe/sumario/{fecha}` | XML | Indice del BOE del dia: secciones, departamentos, disposiciones | Mecanica simple |
| 2 | BOE API Legislacion Consolidada | `boe.es/datosabiertos/api/legislacion-consolidada` | XML | Busqueda de normas | Mecanica simple |

**Escala de dificultad**: **Mecanica simple**

### Ejemplo real verificado

```bash
curl -s -H "Accept: application/xml" \
  "https://www.boe.es/datosabiertos/api/boe/sumario/20250220"
```

Respuesta (extracto):

```xml
<response>
  <status><code>200</code><text>ok</text></status>
  <data>
    <sumario>
      <metadatos>
        <publicacion>BOE</publicacion>
        <fecha_publicacion>20250220</fecha_publicacion>
      </metadatos>
      <diario numero="44">
        <sumario_diario>
          <identificador>BOE-S-2025-44</identificador>
          <url_pdf szBytes="501637">https://www.boe.es/boe/dias/2025/02/20/pdfs/BOE-S-2025-44.pdf</url_pdf>
        </sumario_diario>
        <seccion codigo="1" nombre="I. Disposiciones generales">
          <departamento codigo="1820" nombre="CONSEJO GENERAL DEL PODER JUDICIAL">
            <epigrafe nombre="Actuaciones judiciales">
              <item>
                <identificador>BOE-A-2025-3298</identificador>
                <titulo>Acuerdo de 12 de febrero de 2025...</titulo>
                <url_pdf>https://www.boe.es/boe/dias/2025/02/20/pdfs/BOE-A-2025-3298.pdf</url_pdf>
                <url_html>https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-3298</url_html>
                <url_xml>https://www.boe.es/diario_boe/xml.php?id=BOE-A-2025-3298</url_xml>
              </item>
            </epigrafe>
          </departamento>
        </seccion>
      </diario>
    </sumario>
  </data>
</response>
```

### Estructura del sumario BOE

| Nivel | Elemento | Descripcion |
|---|---|---|
| 1 | `<seccion>` | Secciones del BOE (I. Disposiciones generales, II. Autoridades, III. Otras, etc.) |
| 2 | `<departamento>` | Ministerio u organo emisor |
| 3 | `<epigrafe>` | Categoria de la disposicion |
| 4 | `<item>` | Disposicion individual con BOE ID, titulo, URLs (PDF, HTML, XML) |

### Verificado con

| Fecha | BOE numero | Items | Status |
|---|---|---|---|
| 2025-02-20 | 44 | Multiples secciones y departamentos | **API OK** — estructura completa |

### Secciones del BOE

| Seccion | Nombre | Contenido relevante |
|---|---|---|
| I | Disposiciones generales | Leyes, reales decretos, ordenes ministeriales |
| II | Autoridades y personal | Nombramientos, oposiciones |
| III | Otras disposiciones | Convenios, subvenciones |
| IV | Administracion de Justicia | Edictos, anuncios judiciales |
| V | Anuncios | Contratacion publica |

## Metricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---|---|---|---|
| Fecha publicacion BOE | Si | Parcial (via metadatos ley) | BOE API sumario |
| Numero del BOE | Si | No | BOE API sumario |
| Seccion de publicacion | Si | No | BOE API sumario |
| Departamento emisor | Si | No | BOE API sumario |
| URL PDF de cada disposicion | Si | No | BOE API sumario `<url_pdf>` |
| URL XML de cada disposicion | Si | No | BOE API sumario `<url_xml>` |
| Indice completo del dia | Si | No | BOE API sumario |

- **Cobertura**: ~10% (usamos fecha publicacion indirectamente, no el sumario como tipo)

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|---|---|---|
| `<officialGazette>` type | No | — |
| FRBR URIs | No (disponible) | BOE sumario `<identificador>` |
| Publication date | No (disponible) | BOE sumario `<fecha_publicacion>` |
| TOC items | No (disponible) | BOE sumario `<item>` |
| Section (I-V) | No (disponible) | BOE sumario `<seccion>` |

- **Completitud**: 0% como tipo independiente

## Observaciones

- El BOE es la fuente oficial definitiva de Espana. API sumario verificada y funcionando.
- Publicacion diaria desde 1661 (uno de los diarios oficiales mas antiguos del mundo). Digital completo desde 1995.
- Cada `<item>` tiene URL a PDF, HTML y XML de la disposicion individual.
- La relacion con el pipeline es directa: la publicacion en el BOE es el paso final del rito legislativo.
- El endpoint de sumario es util para monitorizar nuevas leyes publicadas (posible trigger automatico del pipeline).
- Tambien existe API para BORME (Boletin Oficial del Registro Mercantil): `boe.es/datosabiertos/api/borme/sumario/{fecha}`.
