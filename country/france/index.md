# Sistema de documentos comparativos legislativos en Francia: análisis técnico exhaustivo

Los **tableaux comparatifs** franceses son documentos de práctica consuetudinaria —no regulados explícitamente— que se producen como parte de los informes de comisión parlamentaria, disponibles exclusivamente en formato PDF sin API estructurada para acceso programático. Francia cuenta con un ecosistema maduro de datos legislativos abiertos (ELI desde 2014, API PISTE, descargas masivas XML), pero los documentos de comparación específicamente permanecen como un punto ciego para la interoperabilidad automatizada.

---

## 1. Concepto y terminología oficial

El sistema francés utiliza varios términos relacionados pero distintos para referirse a documentos de comparación legislativa. El término principal en la **Assemblée Nationale** es **"tableau comparatif"**, que designa las tablas comparativas incluidas en los informes de comisión. En el **Sénat**, aunque también se usa "tableau comparatif", es más frecuente encontrar **"texte comparé"** especialmente en contextos de navette entre cámaras.

Un hallazgo crítico es que **ninguno de estos términos tiene definición formal** en el Règlement de l'Assemblée Nationale ni en el Règlement du Sénat. El Artículo 86 del Reglamento de la Asamblea Nacional especifica los contenidos obligatorios de los informes de comisión (observaciones sobre estudios de impacto, información sobre derecho europeo, textos susceptibles de derogación), pero el tableau comparatif constituye **práctica consuetudinaria** más que requisito reglamentario.

Otros términos relevantes incluyen **"texte de la commission"** (texto adoptado por la comisión, publicado separadamente según Artículo 86 del Règlement AN y Artículo 28.3 del Règlement du Sénat), **"petite loi"** (texto adoptado en cada etapa, también llamado "texte authentique" o "texte provisoire"), y para la Commission Mixte Paritaire: **"tableau comparatif des textes adoptés par chaque assemblée"**.

La producción de estos documentos recae en los **administrateurs** (funcionarios parlamentarios asignados a las secretarías de comisión), quienes asisten al rapporteur. La **Division des Lois** dentro de la Direction de la Séance contribuye a la interpretación de textos pero no produce directamente los tableaux comparatifs. El flujo exacto de trabajo no está codificado formalmente.

---

## 2. El proceso legislativo y puntos de producción documental

### Flujo completo de un proyecto de ley

El proceso comienza con el **dépôt** (depósito): los proyectos gubernamentales requieren dictamen previo del Conseil d'État y estudio de impacto obligatorio desde 2009, mientras las proposiciones parlamentarias se depositan directamente. Tras el **renvoi en commission** (remisión a comisión competente o especial), el trabajo de comisión incluye la designación del rapporteur, audiencias preparatorias, y examen artículo por artículo con plazo de enmiendas fijado en el tercer día hábil antes del examen a las 17h (Artículo 86, párrafo 5).

Un cambio fundamental introducido por la **revisión constitucional de 2008** (Artículo 42 de la Constitución) establece que la discusión en pleno se basa en el texto adoptado por la comisión, no en el texto gubernamental, con excepciones para leyes de finanzas, seguridad social y revisiones constitucionales. Esto aumentó significativamente la importancia del "texte de la commission" y, por extensión, de los tableaux comparatifs.

### Momentos exactos de producción de comparados

Los tableaux comparatifs se producen en cuatro momentos principales: durante el **informe de comisión en primera lectura** (comparando texto en vigor, texto depositado y texto de comisión), en **lecturas sucesivas** durante la navette (mostrando evolución del texto), en la **preparación de la CMP** (documento esencial comparando versiones AN y Sénat), y en los **informes CMP** si hay acuerdo.

La **navette parlementaire** funciona así: el texto transmitido entre cámaras excluye los "articles conformes" (idénticos) de examen posterior; cada cámara produce nuevos tableaux comparatifs en sus informes de comisión mostrando las diferencias con la versión recibida; tras dos lecturas en cada cámara (o una con "procédure accélérée"), puede convocarse la **Commission Mixte Paritaire** con 7 diputados y 7 senadores.

---

## 3. Formato técnico y estructura documental

### Características del formato físico

Los tableaux comparatifs se publican **exclusivamente en PDF**, generados digitalmente (texto seleccionable, no escaneado). Los PDFs del Journal Officiel en Légifrance incluyen firma electrónica autenticada, pero los informes parlamentarios generalmente no. Los informes de comisión suelen dividirse en tomos separados: **Tome I** con análisis y exposición, **Tome II** con el tableau comparatif.

La estructura estándar comprende **3 a 4 columnas**:

| Columna | Contenido típico |
|---------|------------------|
| 1ª | "Texte en vigueur" / "Texte de référence" — ley actualmente vigente |
| 2ª | "Texte du projet initial" / "Texte transmis par le Sénat" — propuesta original o texto de otra cámara |
| 3ª | "Texte de la commission" / "Amendements adoptés" — versión enmendada por comisión |
| 4ª (opcional) | Enmiendas adicionales o "Texte adopté" en lecturas posteriores |

Para documentos CMP, la estructura compara directamente las versiones AN y Sénat, con "propositions de rédaction" indicando compromisos alcanzados.

### Ejemplos concretos verificados (2024-2025)

- **Loi de finances de fin de gestion 2024** (CMP): https://www.senat.fr/rap/l24-175/l24-175.pdf
- **Simplification urbanisme** (CMP, julio 2025): https://www.senat.fr/rap/l24-826/l24-826.html
- **PLFSS 2025** (CMP): Informe RAPPANR5L17B0638 en Assemblée Nationale
- Patrón URL Sénat: `https://www.senat.fr/rap/l[SESIÓN]-[NÚMERO]/l[SESIÓN]-[NÚMERO].pdf`

---

## 4. Ecosistema de portales y sistemas de publicación

### Assemblée Nationale

El portal principal (https://www.assemblee-nationale.fr) organiza dossiers législatifs bajo `/dyn/[legislatura]/dossiers/`. El **portal de datos abiertos** (https://data.assemblee-nationale.fr) ofrece XML, JSON y CSV para enmiendas, votos, debates, dossiers y diputados, con actualizaciones diarias y archivos ZIP por legislatura. Sin embargo, **no incluye tableaux comparatifs en formato estructurado**.

Contacto: opendata@assemblee-nationale.fr

### Sénat

El portal principal (https://www.senat.fr) organiza informes bajo `/rap/` y dossiers bajo `/dossierleg/`. El portal **data.senat.fr** ofrece:

- **DOSLEG**: Dossiers legislativos desde octubre 1977 (dumps PostgreSQL)
- **AMELI**: Enmiendas desde octubre 2001 (séance publique) y octubre 2010 (comisión)
- **Monalisa**: Textos legislativos en **Akoma Ntoso XML** desde diciembre 2019
- **Comptes rendus**: Transcripciones desde enero 2003

El Sénat es la única institución francesa que utiliza el estándar internacional **Akoma Ntoso** para textos legislativos, lo cual representa un avance significativo en interoperabilidad.

Contacto: opendata-tech@senat.fr

### Légifrance y DILA

Légifrance (https://www.legifrance.gouv.fr) es la base oficial de derecho vigente, operada por la DILA (Direction de l'Information Légale et Administrative). Contiene **textos promulgados** (no documentos parlamentarios) con identificadores ELI y enlaces a dossiers parlamentarios en AN y Sénat.

Las descargas masivas DILA están disponibles en https://echanges.dila.gouv.fr/OPENDATA/ con fondos **LEGI** (legislación consolidada, ~1.6GB), **JORF** (Journal Officiel), **KALI** (convenios colectivos), **JADE** (Conseil d'État), **CASS/CAPP** (jurisprudencia), y **CONSTIT** (Conseil Constitutionnel).

---

## 5. Estándares técnicos e identificadores

### Esquemas XML propios de Francia

Francia utiliza un **sistema propietario de DTDs** llamado DTD LEGIFRANCE, con esquemas específicos para cada fondo (LEGI, JORF, KALI, etc.). Toda la documentación técnica está disponible en https://echanges.dila.gouv.fr/OPENDATA/DTD_LEGIFRANCE/. Este sistema difiere del estándar internacional Akoma Ntoso, aunque el Sénat ha adoptado este último para Monalisa desde 2019.

### European Legislation Identifier (ELI)

Francia implementó **ELI completamente desde diciembre 2014**. La estructura URI sigue el patrón:
```
/eli/{tipo}/{año}/{mes}/{día}/{identificador_natural}/{versión}/{nivel}
```

Ejemplos funcionales:
- `https://www.legifrance.gouv.fr/eli/loi/2023/4/14/2023-270/jo/texte`
- `https://www.legifrance.gouv.fr/eli/loi/2014/12/29/FCPX1425969L/jo/texte/fr/html`

Los identificadores NOR (Numéro d'Ordre Normalisé) como `FCPX1425969L` y los números de ley como `2023-270` son válidos como `{identificador_natural}`. Los metadatos ELI se incrustan como **RDFa** en páginas HTML de Légifrance para textos publicados desde enero 2002.

### API PISTE de Légifrance

La **API PISTE** (Plateforme d'Intermédiation des Services pour la Transformation de l'État) proporciona acceso programático a Légifrance desde abril 2023:

- **Sandbox**: `https://sandbox-api.piste.gouv.fr/dila/legifrance/lf-engine-app/`
- **Producción**: `https://api.piste.gouv.fr/dila/legifrance/lf-engine-app/`
- **Autenticación**: OAuth 2.0 (Client Credentials)
- **Formato**: JSON (requests y responses)
- **Registro**: Gratuito en https://piste.gouv.fr

Endpoints principales: `/consult/jorf` para textos del Journal Officiel, búsquedas por fondo (LEGI, JORF, CODE). **Limitación crítica**: textos JO anteriores a junio 2004 no tienen versión HTML disponible vía API.

---

## 6. Licenciamiento y cobertura legal

Todos los datos legislativos franceses están cubiertos por la **Licence Ouverte 2.0** (Etalab, 27 abril 2017), basada en el Artículo L.323-2 del CRPA. Esta licencia permite:

- Reproducir, copiar, publicar, transmitir
- Distribuir, redistribuir
- Adaptar, modificar, extraer, transformar
- **Explotación comercial** (incluyendo combinación con otros datos)

La única obligación es **atribución**: mencionar fuente y fecha de última actualización. La licencia es compatible con Open Government Licence (UK), Creative Commons Attribution (CC-BY), y Open Data Commons Attribution (ODC-BY).

---

## 7. Ecosistema civic tech francés

### NosDéputés.fr y Regards Citoyens

**Regards Citoyens** (asociación sin ánimo de lucro fundada en 2009) opera el ecosistema civic tech parlamentario más completo de Francia. Su proyecto insignia **NosDéputés.fr** (lanzado septiembre 2009) monitoriza la actividad de diputados con perfiles, intervenciones, preguntas escritas, enmiendas, y visualizaciones de palabras clave.

La **API de NosDéputés** es extremadamente accesible: simplemente añadir `/xml`, `/json`, o `/csv` a cualquier URL. Por ejemplo:
- Lista de diputados: `https://www.nosdeputes.fr/deputes/enmandat/json`
- Enmiendas: `https://www.nosdeputes.fr/16/amendements/xml`

Dumps SQL completos disponibles en https://www.regardscitoyens.org/telechargement/donnees/ bajo licencia ODbL.

**Alerta de sostenibilidad**: Regards Citoyens anunció posible cierre de NosDéputés.fr tras la XVI legislatura por agotamiento voluntario, un riesgo significativo para el ecosistema.

### La Fabrique de la Loi

**La Fabrique de la Loi** (https://lafabriquedelaloi.fr) es la herramienta más relevante para comparación legislativa. Desarrollada por Regards Citoyens con Sciences Po médialab, rastrea la **evolución textual** de leyes a través del proceso parlamentario con:

- Visualización de diffs entre versiones
- Seguimiento de enmiendas vinculadas a modificaciones
- Comparación etapa por etapa (texto inicial → comisión → pleno → Sénat → CMP → final)
- Integración de censuras del Conseil Constitutionnel

El **parser** (https://github.com/regardscitoyens/the-law-factory-parser) usa Python 3.5+, scrapers para AN y Sénat, y algoritmos Diff Match and Patch. Cubre **más de 800 leyes promulgadas desde 2008**.

### Archéo Lex

**Archéo Lex** (https://archeo-lex.fr, https://github.com/Legilibre/Archeo-Lex) convierte los códigos franceses en **repositorios Git con Markdown**, permitiendo diffs entre cualquier versión histórica. Descarga la base LEGI (~5GB), crea SQLite vía legi.py, y genera commits Git por cada versión del código. Licencia WTFPL 2.0.

### ParlAPI.fr

**ParlAPI** (https://parlapi.fr) es un wrapper API REST simplificado sobre los datos oficiales de data.assemblee-nationale.fr y data.senat.fr, desarrollado por Regards Citoyens. Proporciona JSON con hipervínculos entre objetos relacionados y fidelidad al esquema original.

---

## 8. Realidad versus aspiración: qué funciona realmente

### Funcionalidad confirmada ✅

- **Descargas masivas DILA**: XML actualizado diariamente (LEGI, JORF, etc.)
- **URIs ELI**: Funcionales para textos desde 2002
- **data.assemblee-nationale.fr**: Enmiendas, votos, debates en XML/JSON/CSV
- **data.senat.fr**: Dumps PostgreSQL, Akoma Ntoso desde 2019
- **API PISTE**: Operativa con registro OAuth2

### Funcionalidad parcial o limitada ⚠️

- **Documentación API PISTE**: Errores reportados en nombres de fondos y valores de filtros
- **Textos JO pre-2004**: Sin versión HTML vía API
- **Algunos patrones URI ELI**: No funcionales (ej. URIs solo de idioma como `/fr`)
- **Espejo Etalab de datos AN**: "Rarement MAJ pour des raisons techniques"

### No disponible o discontinuado ❌

- **API REST directa para Assemblée Nationale**: Solo descargas bulk
- **API Légifrance Beta**: Cerrada permanentemente 6 junio 2023
- **APIs streaming en tiempo real**: Inexistentes
- **Tableaux comparatifs en formato estructurado**: Solo PDF, sin XML/JSON

### El problema fundamental

**Los tableaux comparatifs NO están disponibles en formato estructurado**. Existen y son públicamente accesibles, pero únicamente como PDFs dentro de informes de comisión. No hay API, XML, ni JSON para documentos de comparación legislativa. El acceso programático requiere **parseo de PDF o scraping**, con todas las complejidades asociadas.

---

## 9. Implicaciones para desarrollo de software

### Estrategia recomendada actual

Para una startup de seguimiento legislativo como parlamento.ai, el enfoque más viable combina:

1. **data.assemblee-nationale.fr** para enmiendas, votos, metadatos de dossiers
2. **API PISTE** para texto de ley promulgada (tras registro OAuth2)
3. **NosDéputés.fr/ParlAPI** para datos simplificados de actividad parlamentaria
4. **Scraping manual de PDFs** para tableaux comparatifs (sin alternativa estructurada)
5. **La Fabrique de la Loi** como referencia para algoritmos de diff legislativo

### Oportunidades identificadas

- El **parser de La Fabrique de la Loi** (Python, open source) proporciona algoritmos probados para extracción y comparación textual
- El formato **Akoma Ntoso del Sénat** podría servir como base para proponer estandarización
- La participación francesa en **ELI** facilita interoperabilidad europea
- La **Licence Ouverte** permite explotación comercial completa

### Riesgos y limitaciones

- Dependencia de scraping para datos críticos (tableaux comparatifs)
- Posible discontinuidad de NosDéputés.fr (sostenibilidad voluntariado)
- Fragmentación entre sistemas AN y Sénat (formatos distintos)
- Ausencia de estándar unificado para documentos comparativos parlamentarios

---

## Conclusión: estado del arte y propuesta de acción

Francia presenta un **ecosistema legislativo abierto maduro pero fragmentado**. La implementación de ELI, la API PISTE, y las descargas masivas XML de DILA representan avances significativos. Sin embargo, persiste una brecha crítica: los **documentos comparativos legislativos** —elemento central para el seguimiento del proceso parlamentario— permanecen atrapados en formato PDF sin estructura semántica.

El **Sénat francés con Akoma Ntoso** y proyectos como **La Fabrique de la Loi** demuestran que la comparación legislativa estructurada es técnicamente viable. Para proponer formatos abiertos internacionalmente, Francia ofrece tanto un modelo parcial (Akoma Ntoso en Sénat) como una demostración clara de la carencia: **ninguna institución parlamentaria francesa publica tableaux comparatifs en formato legible por máquina**. Esta laguna representa una oportunidad para proponer estándares que otros países podrían adoptar, tomando como base técnica el parser de La Fabrique de la Loi, el esquema Akoma Ntoso, y la estructura URI de ELI.