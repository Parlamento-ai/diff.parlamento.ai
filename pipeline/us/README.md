# Pipeline US — AKN Diff para el Congreso de EE.UU.

Genera documentos AKN Diff a partir de bills del Congreso de EE.UU., tanto **promulgados** como **en tramitacion**.

## Uso

```bash
npx tsx pipeline/us/process.ts <bill-id> [--phase=N] [--api-key=KEY]
```

Ejemplos:
```bash
npx tsx pipeline/us/process.ts s5-119           # Laken Riley Act (promulgado)
npx tsx pipeline/us/process.ts hr2196-119       # EMS Memorial (activo, en comite)
npx tsx pipeline/us/process.ts s331-119 --phase=5  # Solo regenerar AKN
```

## Fases del pipeline

| Fase | Nombre | Entrada | Salida |
|------|--------|---------|--------|
| 1 | **Discover** | bill-id | `discovery.json` — metadata, textVersions, passageActions |
| 2 | **Configure** | discovery.json | `config.json` — timeline, downloads |
| 3 | **Download** | config.json | XMLs en `sources/` |
| 4 | **Parse** | XMLs | `parsed.json` — secciones por version + votos |
| 5 | **Generate** | parsed + config | AKN XMLs en `akn/` |

## Soporte para bills activos (en tramitacion)

El pipeline soporta bills en cualquier etapa del proceso legislativo. La Phase 2 (Configure) itera **todas** las versiones de texto disponibles, no solo las que tienen votacion de camara.

### Progresion tipica de versiones

```
IH/IS  ->  RH/RS/PCS  ->  EH/ES  ->  ENR  ->  PLAW
  |           |              |        |
 intro    committee       passed   enrolled
          report          chamber    (final)
```

Cada transicion genera un `<amendment>` AKN con el changeSet correspondiente.

### Tipos de timeline entries

| Tipo | Cuando | Ejemplo |
|------|--------|---------|
| `bill` | Primera version disponible | IH, IS, PCS |
| `amendment` | Con passage action (voto) | ES con roll call 84-16 |
| `amendment` | Sin passage (version intermedia) | RS (committee report) |
| `act` | ENR de bill promulgado | Public Law 119-1 |

### Caso especial: ENR dual

Cuando ENR tiene una passage action (ej. House Passage) Y el bill esta promulgado, se emiten **dos** entries:
1. `amendment` — con el voto y changeSet (diff vs version anterior)
2. `act` — snapshot final del texto promulgado

## APIs y fuentes de datos

### GovInfo Collections API (descubrimiento)
- **Endpoint:** `GET https://api.govinfo.gov/collections/BILLS/{since}`
- **Rate limit:** 1,000/hr (con key), 40/hr (DEMO_KEY)
- **PackageId:** `BILLS-{congress}{type}{number}{versionCode}`
- Permite descubrir nuevas versiones via polling periodico

### Congress.gov CDN (descarga de XMLs)
- **URL:** `https://www.congress.gov/{congress}/bills/{type}{number}/BILLS-{congress}{type}{number}{version}.xml`
- **Sin API key, sin rate limit significativo** — archivos estaticos
- Formato: Bill DTD XML

### Congress.gov API (metadata)
- **Endpoint:** `https://api.congress.gov/v3/bill/{congress}/{type}/{number}`
- **Rate limit:** 5,000/hr (con key), 30/hr (DEMO_KEY)
- Provee: textVersions, passageActions, sponsor, votes, status

### Votos (roll call)
- **Senado:** `https://www.senate.gov/legislative/LIS/roll_call_votes/...xml`
- **House:** `https://clerk.house.gov/evs/{year}/roll{number}.xml`

## Bills procesados

| Bill | Tipo | Versiones | Descripcion |
|------|------|-----------|-------------|
| s5-119 | Promulgado | PCS -> ES -> ENR | Laken Riley Act (PL 119-1) |
| s269-119 | Promulgado | IS -> ES -> ENR | Ending Improper Payments (PL 119-77) |
| s331-119 | Promulgado | IS -> RS -> ES -> ENR | HALT Fentanyl Act (PL 119-26), con version intermedia RS |
| s1582-119 | Promulgado | PCS -> ES -> ENR | GENIUS Act (PL 119-27), 16 section changes |
| hr2196-119 | **Activo** | IH -> RH | EMS Memorial Extension, en comite |

## Tracking de bills activos — Hallazgos

Investigacion realizada 2026-02-25.

### Mecanismo de deteccion
1. **Poll** GovInfo `/collections/BILLS/{since}` cada ~6h
2. **Parsear** packageIds -> identificar nuevas versiones
3. **Descargar** desde CDN publico (gratis, sin rate limit)
4. **Procesar** con pipeline existente (parse -> diff -> AKN)

### Latencia medida
| Metrica | Valor |
|---------|-------|
| Accion legislativa -> API disponible | ~4-6 horas |
| Polling cada 6h -> deteccion | ~6-12 horas |
| Roll call vote -> XML disponible | minutos |

### Volumen observado (ventana 48h)
- 118 BILLS packages modificados
- 100 bills unicos con texto
- 2 bills con 2+ versiones (hr2196, hr755)

### Costo por ejecucion
~3 API calls (GovInfo) + ~66 CDN requests. Estimado diario: ~12 API calls + ~264 CDN requests.

## Limitaciones conocidas

1. **eIds cambiantes:** Congress genera nuevos IDs XML por version. El pipeline usa matching por heading para detectar sustituciones correctamente.
2. **Versiones sin sections:** Algunas versiones (ej. RS de s331) parsean con 0 secciones si usan estructura XML diferente. El diff muestra repeal+insert en vez de cambios granulares.
3. **Bills grandes:** Bills de reconciliation (1000+ secciones) requieren mas procesamiento.
4. **DEMO_KEY:** 30 req/hr para Congress.gov API. Con API key propia se puede escalar.
