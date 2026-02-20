# Formex 4: El formato XML real de la legislacion EU

**Fecha:** 19/02/2026
**Contexto:** Esto es lo que la UE publica realmente en EUR-Lex. No es Akoma Ntoso.

---

## 1. Que es Formex

Formex (Formalized Exchange of Electronic Publications) es el formato XML propio de la UE para representar documentos del Diario Oficial (Official Journal). No tiene relacion con Akoma Ntoso; es un formato completamente independiente.

**Historia:**
- 1985: primera version en SGML
- 2004: version 4 migra a XML
- Schema actual: `formex-06.02.1-20231031.xd`
- ~260 tags (reducido desde ~1200 en v3)

Formex describe la estructura completa de publicaciones del OJ: reglamentos, directivas, decisiones, dictamenes, comunicaciones, etc. Cada documento se descompone en un paquete de archivos XML con roles especificos (TOC, manifest, cuerpo del acto, anexos).

---

## 2. Como descargar de CELLAR

CELLAR es el repositorio de contenido de la UE. Todas las llamadas usan content negotiation via headers HTTP.

### 2.1 Metadata del documento

```bash
curl -H "Accept: application/xml;notice=object" \
  "https://publications.europa.eu/resource/celex/32024R1689"
```

Retorna **303 redirect**. Seguir la redireccion para obtener XML con metadata completa del documento: manifestaciones disponibles, idiomas, fechas, relaciones. Las manifestaciones incluyen `fmx4`, `pdfa1a`, `xhtml` — **no aparece AKN**.

### 2.2 Listar archivos Formex

```bash
curl -H "Accept: application/list;mtype=fmx4" \
     -H "Accept-Language: spa" \
  "https://publications.europa.eu/resource/celex/32024R1689"
```

Retorna HTML con lista de URLs individuales de cada archivo XML del paquete. La estructura tipica:

- `.toc.fmx.xml` — tabla de contenido de la publicacion
- `.doc.fmx.xml` — manifest del documento
- `.000101.fmx.xml` — cuerpo del acto legislativo
- Archivos adicionales para anexos

### 2.3 Descargar un archivo individual

```bash
curl -L "[cellar-url]/DOC_1/[filename].fmx.xml"
```

Usar `-L` para seguir redirects. La URL base del cellar se obtiene del listado anterior.

### 2.4 Descarga ZIP completa

```bash
curl -H "Accept: application/zip;mtype=fmx4" \
     -H "Accept-Language: spa" \
  "https://publications.europa.eu/resource/celex/32024R1689"
```

Descarga todos los archivos Formex del documento en un ZIP.

### 2.5 AKN no esta disponible

```bash
curl -H "Accept: application/akn+xml" \
  "https://publications.europa.eu/resource/celex/32024R1689"
# => HTTP 400 Bad Request
```

**`application/akn+xml` retorna HTTP 400.** Akoma Ntoso NO es un formato soportado por CELLAR.

---

## 3. Estructura XML de un acto legislativo

Ejemplo real: AI Act (CELEX 32024R1689). El paquete Formex contiene:

```
Paquete Formex de un acto legislativo:
|
+-- .toc.fmx.xml       PUBLICATION > OJ > VOLUME > SECTION > ITEM.PUB
+-- .doc.fmx.xml       DOC > BIB.DOC + FMX (manifest) + PDF refs
+-- .000101.fmx.xml    ACT (contenido real)
    |
    +-- BIB.INSTANCE                 metadata bibliografica
    |   +-- DOCUMENT.REF             referencia al DOC padre
    |   +-- DATE                     fecha del acto (ISO)
    |   +-- LG.DOC                   idioma
    |   +-- NO.DOC > YEAR + NO.CURRENT
    |   +-- PAGE.FIRST / LAST / TOTAL
    |
    +-- TITLE > TI > P              titulo del acto
    |   (con HT, DATE, NOTE)
    |
    +-- PREAMBLE                     preambulo
    |   +-- PREAMBLE.INIT           "EL PARLAMENTO EUROPEO Y EL CONSEJO..."
    |   +-- GR.VISA > VISA (xN)    referencias a tratados
    |   |   +-- NOTE                notas al pie con REF.DOC.OJ
    |   +-- GR.CONSID > CONSID (xN) considerandos numerados (1), (2)...
    |       +-- NP > NO.P + TXT
    |
    +-- ENACTING.TERMS               parte dispositiva
    |   +-- TITLE (xN)              "TITULO I", "TITULO II"...
    |   +-- CHAPTER (xN)            capitulos
    |   +-- SECTION (xN)            secciones
    |   +-- ARTICLE (xN)            articulos
    |       +-- TI > STI (numero) + STI (titulo)
    |       +-- PARAG (xN) > ALINEA / NP / P
    |
    +-- FINAL > SIGNATURE (xN)      firmas
```

### Detalle de nodos clave

**BIB.INSTANCE**: Contiene toda la metadata: CELEX, idioma, numero de documento, fecha, paginas. Es lo primero que se parsea para identificar el acto.

**PREAMBLE.INIT**: Texto fijo institucional que identifica quien emite el acto. Ej: "EL PARLAMENTO EUROPEO Y EL CONSEJO DE LA UNION EUROPEA".

**GR.VISA / VISA**: Las "visas" son las bases juridicas. Cada VISA referencia un articulo del tratado o un acto previo. Las notas al pie (NOTE) contienen referencias cruzadas con REF.DOC.OJ (enlace al OJ donde se publico el acto citado).

**GR.CONSID / CONSID**: Los considerandos ("recitals"). Numerados secuencialmente. Cada CONSID contiene un NP con NO.P (el numero) y TXT (el texto).

**ENACTING.TERMS**: El cuerpo dispositivo. Jerarquia: TITLE > CHAPTER > SECTION > ARTICLE > PARAG. No todos los niveles son obligatorios; un acto simple puede tener solo ARTICLEs directamente.

**ARTICLE**: Cada articulo tiene un TI con uno o dos STI (numero y titulo opcional). El contenido se estructura en PARAG, que pueden contener ALINEA (texto libre), NP (puntos numerados con NO.P + TXT), o P (parrafos simples).

---

## 4. Tags clave y mapeo a AKN

| Formex | AKN | Significado |
|--------|-----|-------------|
| `ACT` | `act` | Acto legislativo |
| `TITLE` | `title` | Titulo (agrupacion) |
| `CHAPTER` | `chapter` | Capitulo |
| `SECTION` | `section` | Seccion |
| `ARTICLE` | `article` | Articulo |
| `PARAG` | `paragraph` | Parrafo |
| `ALINEA` | `content` / `subparagraph` | Alinea |
| `NP` | `point` | Punto numerado |
| `NO.P` | `num` | Numeracion |
| `TXT` | (inline content) | Texto |
| `P` | `p` | Parrafo de texto |
| `PREAMBLE` | `preamble` | Preambulo |
| `PREAMBLE.INIT` | `formula[@name="actingEntity"]` | Formula institucional |
| `GR.VISA` | `citations` | Grupo de visas |
| `VISA` | `citation` | Visa individual |
| `GR.CONSID` | `recitals` | Grupo de considerandos |
| `CONSID` | `recital` | Considerando |
| `ENACTING.TERMS` | `body` | Parte dispositiva |
| `FINAL` | `conclusions` | Clausulas finales |
| `SIGNATURE` | `signature` | Firma |
| `NOTE` | `authorialNote` | Nota al pie |
| `REF.DOC.OJ` | `ref` | Referencia a otro documento |
| `HT TYPE="SUP"` | `sup` | Superindice |
| `HT TYPE="UC"` | (CSS styling) | Mayusculas |
| `DATE ISO="..."` | `date[@date="..."]` | Fecha |
| `TI` | `heading` | Titulo/encabezado |
| `STI` | `heading` / `subheading` | Subtitulo |
| `BIB.INSTANCE` | `meta/identification` | Metadata bibliografica |
| `LG.DOC` | `FRBRlanguage` | Idioma |
| `NO.DOC` | `FRBRnumber` | Numero de documento |

El mapeo es mayoritariamente 1:1. Las principales diferencias:

- **ALINEA** no tiene equivalente directo exacto; mapea a `content` o `subparagraph` segun el contexto.
- **HT TYPE="UC"** es presentacion visual (mayusculas); en AKN se maneja via CSS, no con un tag semantico.
- **BIB.INSTANCE** se descompone en el bloque `meta` de AKN con sus sub-secciones FRBR.
- **PREAMBLE.INIT** mapea a `formula` con atributo `name="actingEntity"` en AKN.

---

## 5. Formatos disponibles confirmados

| Formato | MIME type | Estado |
|---------|-----------|--------|
| Formex XML | `application/xml;mtype=fmx4` | Disponible |
| PDF/A-1a | `application/pdf;mtype=pdfa1a` | Disponible |
| PDF/A-2a | `application/pdf;mtype=pdfa2a` | Disponible |
| XHTML | `application/xhtml+xml` | Disponible |
| Akoma Ntoso | `application/akn+xml` | **HTTP 400** |

Formex es el unico formato XML estructurado disponible. XHTML existe pero es presentacional, no semantico.

---

## 6. Conclusion para parlamento.ai

1. **Formex es XML estructurado real**, no HTML que hay que parsear. Cada elemento tiene semantica legislativa clara.

2. **La conversion Formex a AKN es mecanica.** El mapeo de tags es casi 1:1 (ver tabla anterior). No requiere NLP, heuristicas ni parsing ambiguo.

3. **Construimos un converter Formex->AKN funcional** (`poc-formex-to-akn.ts`, ~700 LOC). Convierte reglamentos, decisiones, directivas y corrigendums con estructura completa (preambulo, considerandos, cuerpo, firmas, anexos).

4. **Formex solo aplica a documentos publicados en el OJ.** Las propuestas COM (bills) NO tienen Formex (HTTP 404). Para esos documentos, CELLAR provee XHTML que es parseable via CSS classes -- ver `poc-cellar-to-bill.ts`.

5. **La UE es el pais mas facil para implementar AKN** porque ya tiene XML gratis por API. No hay que scrapear HTML como en Chile, Espana o Peru. Solo descargar y transformar.

---

## 7. Samples generados

Todos los XMLs de salida estan en `samples/`:

| Carpeta | Archivo | Fuente | PoC |
|---------|---------|--------|-----|
| `act/` | 32018R1645-formex.xml | CELLAR Formex | poc-cellar-download-formex.ts |
| `act/` | 32018R1645-akn.xml | Formex → AKN | poc-formex-to-akn.ts |
| `bill/` | 52024PC0150-raw.xhtml | CELLAR XHTML | poc-cellar-to-bill.ts |
| `bill/` | 52024PC0150-bill-akn.xml | XHTML → AKN | poc-cellar-to-bill.ts |
| `consolidated/` | 02019R2088-*-formex.xml (×2) | CELLAR Formex | poc-cellar-download-formex.ts |
| `consolidated/` | 02019R2088-*-akn.xml (×2) | Formex → AKN | poc-formex-to-akn.ts |
| `consolidated/` | changeset-2019-2088.xml | Diff v1↔v2 | poc-akn-diff.ts |
| `votes/` | eu-votes-plenary-2025.xml | EP Open Data | poc-epdata-to-vote.ts |
| `citation/` | eu-citation-plenary-2026.xml | EP Open Data | poc-epdata-to-citation.ts |
| `communication/` | eu-communication-2025-0012-COD.xml | EP Open Data | poc-epdata-to-communication.ts |
| `question/` | eu-question-E-10-2026-000002.xml | EP Open Data | poc-epdata-to-question.ts |
| `amendment/` | eu-amendment-*-AM-*.xml (×5) | EP Open Data | poc-epdata-to-amendment.ts |
| `officialGazette/` | eu-oj-L274-2018-akn.xml | Formex TOC | poc-formex-toc-to-gazette.ts |
