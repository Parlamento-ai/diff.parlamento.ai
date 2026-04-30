# Research ES + EU — Mapeo del rito legislativo contra el schema v3

> Fecha: 2026-04-30
> Países cubiertos: España (ES) + Unión Europea (EU)
> Schema validado: v3 (`research/schema/v3-schema.ts`)
> Casos modelados: Ley 1/2026 de Economía Social (ES) + Reglamento (UE) 2024/1689 AI Act (EU)

---

## 1. Los ejemplos modelados — qué son y cómo se relacionan entre sí

Para validar si el schema v3 cubre el rito legislativo completo, no alcanza con cargar un documento aislado: hay que modelar un **caso entero**, con los distintos tipos de documentos que el rito produce, conectados unos con otros como ocurre en la realidad. La idea es probar que cada tipo del schema (`bill`, `act`, `amendment`, `journal`, `debate`, `citation`) tiene un equivalente real en el rito de cada país, y que las relaciones entre ellos (un bill referenciando una ley anterior, un debate citando un proyecto, un journal publicando un act) se pueden representar con los hrefs AKN sin perder estructura.

Eso es exactamente lo que se modeló para España y para la Unión Europea: un caso completo por país, eligiendo una ley reciente con todo su trámite cerrado, y modelando los siete tipos del rito que ese caso produjo, conectados entre sí.

### 1.1. España — Ley 1/2026 de Economía Social

El caso elegido es la **Ley 1/2026, de 8 de abril, integral de impulso de la economía social** (BOE-A-2026-7967), promulgada el 8 de abril de 2026 tras un trámite parlamentario completo de año y medio. Su expediente en el Congreso es el 121/000036 de la XV Legislatura.

| Type del schema | Documento del rito real | Archivo | Identificador |
|---|---|---|---|
| `act` | Ley anterior que la nueva modifica | `acts/ley-27-1999.xml` | BOE-A-1999-15681 (Ley de Cooperativas) |
| `act` | Ley nueva promulgada | `acts/ley-1-2026.xml` | BOE-A-2026-7967 (Economía Social) |
| `bill` | Proyecto de Ley en el Congreso | `bills/121-000036.xml` | Expediente Congreso 121/000036 |
| `amendment` | Informe de Ponencia que consolida 50+ enmiendas | `amendments/121-000036-am-ponencia.xml` | BOCG-15-A-36-4 |
| `journal` | Boletín Oficial del Estado donde se publica la Ley | `journals/BOE-2026-087.xml` | BOE núm. 87 |
| `citation` | Sesión de Comisión donde se aprobó el dictamen | `citations/cit-com-trabajo-2025-12-09.xml` | DSCD-15-CO-482 |
| `debate` | Pleno con las 9 votaciones de enmiendas del Senado | `debates/dscd-15-pl-26-mar-2026.xml` | DSCD-15-PL-175 |

Estos siete documentos no son cualquier siete documentos. Son uno de cada tipo del rito, eligiendo el caso particular donde aparezcan **conectados entre sí**:

- El `bill` (Proyecto 121/000036) declara que **modifica** la Ley 27/1999 — eso enlaza el bill con el primer act (la ley anterior).
- El `bill` también se convierte en la Ley 1/2026 — eso lo enlaza con el segundo act (la ley nueva).
- El `amendment` (Informe de Ponencia) se presenta **contra** el bill — eso lo enlaza con el bill.
- El `journal` (BOE núm. 87) **contiene** la publicación oficial de la Ley 1/2026 — eso lo enlaza con el act nuevo.
- La `citation` (sesión de Comisión 9-dic-2025) es la **convocatoria** donde se votó el dictamen del bill — eso la enlaza con el bill.
- El `debate` (Pleno 26-mar-2026) discutió las enmiendas del Senado al bill — eso lo enlaza con el bill.

El resultado es un grafo cerrado de siete nodos donde cada relación del rito real (modificar, contener, votar, debatir) se modela con un href AKN y se materializa en la tabla `DocumentLinkTable` del schema.

### 1.2. Unión Europea — Reglamento (UE) 2024/1689 (AI Act)

El caso elegido es el **Reglamento (UE) 2024/1689 del Parlamento Europeo y del Consejo, de 13 de junio de 2024, por el que se establecen normas armonizadas en materia de inteligencia artificial** (AI Act), procedure file 2021/0106(COD), que cerró su rito comunitario completo en julio de 2024.

| Type del schema | Documento del rito real | Archivo | Identificador |
|---|---|---|---|
| `act` | Reglamento previo que el AI Act modifica | `acts/reg-2019-2144.xml` | CELEX 32019R2144 (motor vehicle safety) |
| `act` | Reglamento nuevo promulgado | `acts/reg-2024-1689-ai-act.xml` | CELEX 32024R1689 |
| `bill` | Propuesta de la Comisión Europea | `bills/com-2021-206.xml` | COM(2021)206 final |
| `amendment` | Posición de primera lectura del EP que consolida cientos de enmiendas | `amendments/ep-p9-ta-2024-0138.xml` | P9_TA(2024)0138 |
| `journal` | Diario Oficial de la UE donde se publica el Reglamento | `journals/oj-l-2024-1689.xml` | OJ L_2024/1689 |
| `citation` | Agenda del voto de plenaria del EP | `citations/ep-agenda-2024-03-13.xml` | OJ-9-2024-03-13 |
| `debate` | Verbatim del debate plenario en Estrasburgo | `debates/ep-cre-2024-03-12.xml` | CRE-9-2024-03-12 |

Las relaciones entre estos siete documentos siguen exactamente la misma lógica del caso español, validando que el patrón es transversal a parlamentos muy distintos:

- El `bill` (COM(2021)206) declara que **enmienda** nueve actos previos, entre ellos el Reglamento 2019/2144 — eso enlaza el bill con el primer act.
- El `bill` se convirtió en el AI Act tras dos años y medio de trámite — eso lo enlaza con el segundo act.
- El `amendment` (P9_TA(2024)0138) es la posición consolidada del EP **sobre** la propuesta — eso lo enlaza con el bill.
- El `journal` (OJ L_2024/1689) **contiene** la publicación oficial del AI Act — eso lo enlaza con el act nuevo.
- La `citation` (agenda del 13/03/2024) es la **convocatoria** del voto en plenaria — eso la enlaza con el bill.
- El `debate` (CRE del 12/03/2024 en Estrasburgo) discutió la propuesta el día anterior al voto — eso lo enlaza con el bill.

Mismo patrón, distinto parlamento. Lo que cambia son los nombres y las nomenclaturas — DSCD vs CRE, BOCG vs COM, BOE vs OJ — pero la estructura del grafo (siete tipos conectados) es la misma. Eso es lo que permite que un solo schema represente los dos ritos.

### 1.3. Lo que carga en /demo

Los dos corpus cargan limpios en v3. El build (`npm run research:build`) recorre `research/schema/data/<país>/<tipo>/*.xml`, parsea cada archivo, valida estructura AKN básica, llena la `DocumentTable` (común a todos los tipos) más las tablas detalle (`BillTable`, `ActTable`, etc.), resuelve los hrefs internos como rows en `DocumentLinkTable`, y genera la SQLite que `/demo` lee.

Cada documento queda accesible en `/demo/{país}/{tipo}/{nativeId}` con su detalle, los links salientes (qué documentos referencia) y los links entrantes (quién lo referencia). El timeline del bill muestra los 19 events del trámite ES y los 16 del trámite EU. Los detalles de tabla específicos (status del bill, datos del act, fecha de promulgación, etc.) aparecen extraídos a columnas para que las queries del demo no tengan que parsear XML. El XML completo queda guardado opaco como respaldo.

### 1.4. Lo que NO se ve en /demo aunque esté en el XML

Aquí empieza la fricción. Hay datos reales que los XMLs llevan correctamente — porque el rito los produce y se modelaron con fidelidad — pero que el loader no extrae a columnas SQL, o que el schema directamente no tiene cómo guardar. En la sección 5 de este documento se mapea cada uno de esos casos a la tabla y columna afectada del schema.

## 2. Cómo es el rito en cada parlamento

### 2.1. España — bicameralismo secuencial sancionado por el Rey

El rito legislativo español está en el Título III de la Constitución (arts. 66-96), desarrollado en el Reglamento del Congreso de los Diputados (BOE-A-1982-5196) y el Reglamento del Senado (BOE-A-1994-10830). Las **Cortes Generales** son la suma del **Congreso de los Diputados** (350 diputados, primacía legislativa) y el **Senado** (cámara de segunda lectura).

El flujo típico es secuencial: una iniciativa entra al Congreso, se debate en comisión y eventualmente en pleno, se aprueba, se manda al Senado, vuelve al Congreso si el Senado modifica o veta, y termina en sanción real (Felipe VI firma) + refrendo del Presidente del Gobierno + publicación en el BOE.

Hay cinco vías constitucionales para iniciar (art. 87 CE): el Gobierno proponiendo un Proyecto de Ley, un Grupo Parlamentario o 15 diputados con una Proposición de Ley en el Congreso, un Grupo del Senado o 25 senadores con una Proposición en el Senado, una Asamblea autonómica con una Proposición de Comunidad Autónoma, o 500.000 ciudadanos con una Iniciativa Legislativa Popular. Cada vía tiene su propio número de expediente (serie 121, 122, 123, 125, 120 respectivamente).

El producto final puede ser una Ley ordinaria (mayoría simple), una Ley Orgánica (mayoría absoluta del Congreso, reservada a derechos fundamentales y otras materias del art. 81 CE), un Real Decreto-Ley (lo emite el Gobierno por urgencia y debe convalidarse en 30 días), un Real Decreto Legislativo (delegación legislativa del Congreso al Gobierno), o un reglamento (Real Decreto, Orden Ministerial). Cada uno tiene procedimiento, jerarquía y efectos jurídicos distintos.

### 2.2. Unión Europea — triángulo institucional con bicameralismo paralelo

El rito legislativo de la UE no se parece al de un parlamento nacional. Hay tres instituciones que comparten el poder legislativo (Comisión, Parlamento Europeo, Consejo de la UE) más una cuarta que fija agenda política sin legislar (Consejo Europeo, los jefes de Estado).

La **Comisión Europea** tiene prácticamente el monopolio de la iniciativa: es la única que puede proponer legislación, salvo tres excepciones (un cuarto de los Estados Miembros en JHA, la Iniciativa Ciudadana Europea con un millón de firmas que pide a la Comisión proponer, o el EP/Consejo solicitando a la Comisión que proponga). Los actos los adoptan **el Parlamento Europeo y el Consejo de la UE** conjuntamente.

El procedimiento estándar (procedimiento legislativo ordinario, art. 294 TFEU, antes "codecisión") tiene hasta tres lecturas más conciliación, pero el 80% de los casos se cierra en primera lectura gracias al **trilogue**: una negociación informal entre Comisión, EP y Consejo que ocurre en paralelo a las lecturas formales y produce un acuerdo político que las dos instituciones después adoptan formalmente.

A diferencia de España, **EP y Consejo trabajan en pistas paralelas, no secuenciales**. El Consejo puede tener su "general approach" antes de que el EP termine su committee report, y los dos textos se reconcilian en trilogue. Una vez hay acuerdo, los Presidentes del EP y del Consejo firman conjuntamente. No existe "promulgación" como acto separado.

Los productos jurídicos posibles son varios y con efectos muy distintos: el **Reglamento** vincula directamente en todos los Estados Miembros sin transposición, la **Directiva** obliga al resultado pero deja la forma a cada Estado (requiere transposición nacional), la **Decisión** vincula a destinatarios específicos, la **Recomendación** y el **Dictamen** no son vinculantes. Aparte hay actos delegados (art. 290 TFEU) e implementing acts (art. 291 TFEU + Reg 182/2011, "comitología"), que son adoptados por la Comisión bajo control de los Estados Miembros sin pasar por el procedimiento legislativo.

### 2.3. La diferencia de fondo

El rito español es **secuencial bicameral** (Congreso → Senado → vuelta al Congreso → sanción), produce textos cuya autoridad se valida por la firma del Rey, y publica en una sola gaceta nacional (BOE) que agrupa decenas de actos por número.

El rito europeo es **paralelo trinstitucional con reconciliación informal** (Comisión + EP + Consejo en paralelo, trilogue cierra), produce textos firmados conjuntamente sin promulgación separada, y publica desde 2023 en una gaceta donde cada acto tiene su propia entrada única (un acto = un OJ entry).

Estas dos diferencias estructurales son las que generan la mayor parte de las fricciones que vienen.

## 3. Iniciativas, normas, procedimientos, pasos

### 3.1. Quién propone

**España** — cinco vías por art. 87 CE.

| Vía | Autor | Serie del expediente |
|---|---|---|
| Proyecto de Ley | Gobierno (Consejo de Ministros) | 121/NNNNNN |
| Proposición de Ley del Congreso | Grupo Parlamentario o 15 diputados | 122/NNNNNN |
| Proposición de Ley del Senado | Grupo Parlamentario o 25 senadores | 624/NNNNNN (Senado) |
| Proposición de Ley de Comunidad Autónoma | Asamblea autonómica | 125/NNNNNN |
| Iniciativa Legislativa Popular | 500.000 firmas | 120/NNNNNN |

A esto se suma el expediente de **convalidación de Real Decreto-Ley** (serie 130), que no es estrictamente una iniciativa nueva sino la convalidación obligatoria por el Congreso en 30 días de un RDL ya emitido por el Gobierno.

**Unión Europea** — el monopolio de la Comisión más excepciones.

| Vía | Autor |
|---|---|
| COM proposal (legislación legislativa) | European Commission (Colegio de Comisarios) |
| Iniciativa de un cuarto de Estados Miembros | EM en materias JHA (art. 76 TFEU) |
| Iniciativa Ciudadana Europea | 1 millón de ciudadanos UE de al menos 7 EM diferentes |
| Solicitud del EP a la Comisión | art. 225 TFEU (raras pero existen) |
| Solicitud del Consejo a la Comisión | art. 241 TFEU |

### 3.2. Tipo de norma producida

**España** — varios rangos con procedimiento y jerarquía distintos.

| Rango | Mayoría / Procedimiento | Quién emite | Ejemplo |
|---|---|---|---|
| Ley Orgánica | Mayoría absoluta del Congreso (art. 81.2 CE) | Cortes Generales | LO 3/2007 igualdad efectiva |
| Ley ordinaria | Mayoría simple | Cortes Generales | Ley 1/2026 economía social |
| Real Decreto-Ley | Gobierno por urgencia, convalidación 30 días (art. 86 CE) | Consejo de Ministros | RDL 6/2023 medidas urgentes |
| Real Decreto Legislativo | Delegación expresa de las Cortes (art. 82 CE) | Consejo de Ministros | RDLeg 8/2015 LGSS |
| Real Decreto | Reglamentario, desarrolla leyes | Consejo de Ministros | RD 931/2017 |
| Orden Ministerial | Sub-reglamentario, ámbito ministerial | Ministro | OM ECC/123/2024 |
| Tratado Internacional | Autorización Cortes (arts. 93-94 CE) + ratificación Rey | Estado | CETA, Acuerdo París |

El BOE registra el rango explícitamente con un código en su XML (`<rango codigo="100">Ley</rango>`, `<rango codigo="200">Ley Orgánica</rango>`, `<rango codigo="730">Real Decreto-ley</rango>`, etc.).

**Unión Europea** — los cinco actos del art. 288 TFEU más variantes.

| Acto | Efecto | Quién emite | Ejemplo |
|---|---|---|---|
| Reglamento | Vinculante directo en todos los EM | EP + Consejo (legislativo) o Comisión (delegado/implementing) | GDPR, AI Act |
| Directiva | Vinculante en cuanto al resultado, requiere transposición nacional | EP + Consejo | NIS2, CSRD |
| Decisión | Vinculante para destinatarios específicos | EP + Consejo o Comisión | Multas DG COMP, decisiones de adecuación |
| Recomendación | No vinculante | Cualquier institución | Council Recommendation on key competences |
| Dictamen | No vinculante | Cualquier institución | Dictamen del BCE |
| Acto Delegado | Modifica/completa elementos no esenciales del acto base | Comisión bajo delegación del EP+Consejo | Delegated Regulations bajo MiFID II |
| Implementing Act | Asegura aplicación uniforme | Comisión bajo control comitológico de EM | Implementing Decisions adequacy GDPR |
| Acuerdo Internacional | Vinculante para la UE como parte | UE (negociado por Comisión, firmado por Consejo) | CETA, EU-UK Trade Agreement |

### 3.3. Procedimientos / itinerarios

**España** — varios caminos posibles.

- **Procedimiento ordinario por Pleno**: el camino completo. Plazo de enmiendas → ponencia → comisión → pleno Congreso → Senado → vuelta al Congreso si hay modificaciones → sanción.
- **Competencia legislativa plena de Comisión** (art. 75.2 CE): el Pleno delega en la Comisión la votación final. La Comisión vota como si fuera Pleno, no hay sesión final del Pleno antes de mandar al Senado. Caso de la Ley 1/2026.
- **Procedimiento de urgencia**: plazos reducidos a la mitad. Senado tiene 20 días en vez de 2 meses.
- **Procedimiento de lectura única**: texto debatido y votado en una sola sesión, sin pasar por Comisión.
- **Procedimiento de Ley Orgánica**: idéntico al ordinario hasta la votación final, que requiere mayoría absoluta del Congreso.
- **Convalidación de RDL** (art. 86 CE): plazo de 30 días, voto único en Pleno. Si convalida, las Cortes pueden además tramitarlo como Proyecto de Ley urgente.
- **Tramitación de Tratados**: el texto del tratado es inmodificable; las Cortes solo autorizan o no.

**Unión Europea** — varios procedimientos según base jurídica.

- **Procedimiento Legislativo Ordinario (OLP, art. 294 TFEU)**: ~85% de la legislación. Hasta tres lecturas más conciliación. Caso del AI Act.
- **Procedimientos Legislativos Especiales (SLP)**: consulta (Consejo decide, EP solo opina) y aprobación (EP da consentimiento sí/no, no enmienda — usado para acuerdos internacionales, MFP).
- **Acto delegado** (art. 290 TFEU): la Comisión adopta tras consulta a expertos de EM. EP y Consejo tienen período de objeción.
- **Acto implementing** (art. 291 + Reg 182/2011): la Comisión adopta bajo control de comités de EM (comitología).
- **Acuerdo internacional** (art. 218 TFEU): negocia la Comisión, firma el Consejo previo consentimiento o consulta del EP.
- **Iniciativa Ciudadana Europea** (art. 11 TEU + Reg 2019/788): 1M firmas en 12 meses, audiencia pública, respuesta motivada de la Comisión en 6 meses.
- **Procedimientos especiales JHA**: 1/4 de EM puede iniciar (art. 76 TFEU).

### 3.4. Pasos típicos del rito ordinario

**España** — 19 pasos del Proyecto al BOE (aproximadamente lo que el corpus 121/000036 ya tiene modelado en su lifecycle).

Presentación al Congreso → publicación en BOCG-A-N-1 → calificación por la Mesa → apertura del plazo de enmiendas → enmiendas a la totalidad (BOCG-A-N-2) → debate de totalidad en Pleno → cierre del plazo de enmiendas tras prórrogas → enmiendas al articulado (BOCG-A-N-3) → designación de Ponencia → Informe de Ponencia (BOCG-A-N-4) → Dictamen de Comisión (BOCG-A-N-5) → aprobación final (Pleno o Comisión c.l.p.) → remisión al Senado → trámite Senado paralelo (enmiendas, dictamen, Pleno) → vuelta al Congreso si hay modificaciones → texto definitivo (BOCG-A-N-Final) → sanción real → publicación BOE → eventual corrección de errores.

**Unión Europea** — 13 pasos del COM proposal al OJ.

Pre-propuesta (Roadmap, Impact Assessment, public consultation) → adopción por el Colegio de Comisarios → publicación COM(YYYY)NNN final → transmisión al EP, Consejo y parlamentos nacionales → consultas obligatorias (EESC, BCE, CoR según materia) → trabajo en comisión EP (lead committee + comisiones de opinión, designación de rapporteur) → committee report (A9-NNNN/YYYY) → debate en plenary EP (CRE) → trabajo paralelo en Consejo (working party → COREPER → general approach) → trílogos informales para reconciliar → adopción formal por EP (P9_TA) → adopción formal por Consejo → firma conjunta de Presidentes EP+Consejo → publicación en OJ → entry into force (típicamente 20 días) → aplicación (puede ser escalonada por capítulos).

### 3.5. Pasos que el corpus modeló y los que no

En ES el lifecycle del bill 121/000036 modela los 19 events del trámite real, incluyendo el debate de totalidad rechazado el 13/03/2025, las 23 ampliaciones del plazo (mencionadas en showAs aunque no como events individuales), la aprobación por Comisión c.l.p. el 9/12/2025 con 19/18, la vuelta del Senado con 9 votaciones por bloques el 26/03/2026, y la sanción real con BOE-A-2026-7967 el 8/04/2026.

En EU el lifecycle del bill COM(2021)206 modela los 16 events incluyendo el commission proposal del 21/04/2021, los dictámenes consultivos (EESC, BCE, CoR), el committee referral IMCO+LIBE, el general approach del Consejo con presidencia checa, el committee report A9-0188/2023, el mandato de primera lectura, los inicios y cierre del trilogue (este último bajo presidencia española de Carme Artigas), el COREPER endorsement bajo presidencia belga, la adopción del EP con 523/46/49, la adopción del Consejo, y la firma final del 13/06/2024.

## 4. Mapeo type-por-type contra el schema v3

El schema v3 define 14 DocumentTypes que sirven como "casillas" donde clasificar cada documento del rito. La extracción del XML llena la DocumentTable (común a todos) más una tabla detalle por tipo (BillTable, ActTable, AmendmentTable, JournalTable, etc.).

A continuación, qué entra a cada tipo desde los dos parlamentos modelados.

### 4.1. bill (BillTable)

**España** — caben las cinco vías de iniciativa más la convalidación de RDL. La distinción se hace por `BillTable.subtype` (texto libre): "proyecto-de-ley", "proposicion-de-ley-congreso", "proposicion-de-ley-senado", "proposicion-de-ley-ca", "iniciativa-legislativa-popular", "convalidacion-rdl", "tratado-internacional-art93", "tratado-internacional-art94". El subtype no es queryable cross-país porque es texto libre.

**Unión Europea** — caben los COM proposals (procedure file COD para OLP, CNS para consulta, APP para consent). También caben las posiciones de primera lectura del EP y los general approaches del Consejo, aunque encajan con violencia: técnicamente son enmiendas-del-bill, no bills nuevos, pero el rito EU los trata como entidades documentales propias con su numeración.

### 4.2. act (ActTable)

**España** — caben todos los rangos: Ley, Ley Orgánica, RDL, RDLeg, RD, Orden, Tratado ratificado, Estatuto, Reforma Constitucional. **Todos colapsan a `type='act'`** sin distinción en columnas SQL. El campo `issuingBody` (texto libre) puede llevar "Cortes Generales" o "Jefatura del Estado" pero no distingue Ley de LO de RDL (todos firman Cortes Generales o Jefatura).

**Unión Europea** — caben Reglamento, Directiva, Decisión, Recomendación, Acto Delegado, Implementing Act, Acuerdo Internacional. Todos colapsan también a `type='act'`. El campo `issuingBody` lleva la institución pero no el tipo del acto.

### 4.3. amendment (AmendmentTable)

**España** — caben las enmiendas individuales al articulado (cada Grupo presenta varias contra artículos concretos), las enmiendas a la totalidad, los vetos del Senado. Lo que no encaja limpiamente es el **Informe de Ponencia** y el **Dictamen de Comisión**: son documentos que **consolidan** 50-200 enmiendas individuales en un solo instrumento. Modelarlos como un único amendment con submitter "Ponencia" funciona, pero pierde la granularidad por enmienda. Si se modela cada enmienda individual, se pierde la consolidación procedimental.

**Unión Europea** — el caso típico es el **P9_TA(YYYY)NNNN**, la posición consolidada de primera lectura del EP. Misma fricción de consolidación: P9_TA(2024)0138 contiene cientos de enmiendas individuales del committee report, todas aprobadas en bloque por el plenary. AmendmentTable lo modela como un row único.

### 4.4. journal (JournalTable)

**España** — el BOE encaja perfectamente: una numeración de issues (BOE núm. 87 del 9/04/2026), un publisher (Agencia Estatal Boletín Oficial del Estado), `scope='national'`. Cada BOE issue agrupa decenas de disposiciones. Los BOCG (Boletín Oficial de las Cortes Generales) también encajan estructuralmente como journals con publisher distinto.

**Unión Europea** — el OJ (Official Journal of the European Union) post-2023 entró en un formato nuevo: cada acto legislativo tiene su propia "OJ entry" única (`OJ L_2024/1689` es el AI Act él solo). El modelo issue → muchos docs colapsa: en EU post-2023 cada issue tiene exactamente un acto. Funciona técnicamente pero pierde sentido.

### 4.5. debate (DebateTable)

**España** — el DSCD (Diario de Sesiones del Congreso de los Diputados) y el DS_P del Senado encajan como debates con `chamber`, `sessionStartedAt`, `sessionEndedAt`. Tu DSCD-15-PL-175 lleva el horario literal 09:02 a 14:29.

**Unión Europea** — el CRE (Compte rendu in extenso) del EP encaja igual con `chamber='european-parliament-plenary'`. El verbatim del Consejo no existe (las deliberaciones del Consejo son streamadas pero no transcritas). Los committee meetings públicos del EP también encajan.

**Lo que no encaja**: las **votaciones**. El schema modela debates como sesión con hora de inicio y fin, sin estructura de votaciones. Las vote tallies viven como narrativa en el XML del body. Tu DSCD-15-PL-175 tiene 9 votaciones por bloques con counts exactos (350/137/180/33, 350/346/4, etc.) que no son consultables en SQL. La votación del AI Act 523/46/49 vive en `<akndiff:voteRecord>` pero tampoco está en columnas estructuradas.

### 4.6. citation (CitationTable)

**España** — encajan las convocatorias formales de sesión de Comisión, Pleno, Mesa, Junta de Portavoces. El `cit-com-trabajo-2025-12-09.xml` del corpus recoge la sesión de Comisión donde se aprobó el dictamen.

**Unión Europea** — encajan las agendas de plenary EP (Order of Business OJ-9-YYYY-MM-DD), las agendas de comisión, las agendas de COREPER. El `ep-agenda-2024-03-13.xml` del corpus recoge la agenda del voto en plenaria.

### 4.7. judgment, question, communication, statement, document_collection, doc

Estos tipos completan el catálogo pero no son protagonistas del rito modelado.

- **judgment**: para España las STC del Tribunal Constitucional sobre leyes; para EU los casos CJEU. Tu corpus no incluye sentencias.
- **question**: para España las preguntas escritas y orales al Gobierno; para EU las preguntas escritas a la Comisión/Consejo. Tu corpus no incluye preguntas.
- **communication**: para España los mensajes del Senado al Congreso (caso del veto), las comunicaciones del Gobierno a las Cortes; para EU las transmisiones interinstitucionales.
- **statement**: declaraciones institucionales, mensajes del Rey, statements del Council.
- **document_collection**: el expediente completo de un trámite (todos los BOCGs + DSCDs + bill + act).
- **doc**: catch-all genérico para lo que no entra en otros tipos. En EU se usa mucho para Impact Assessments (SWD), opiniones del EESC/BCE/CoR, Reasoned Opinions de parlamentos nacionales por subsidiariedad.

## 5. Las fricciones encontradas

Aquí está el output central del research. Cada fricción registra: qué es, cuál tabla del schema afecta y cuál columna concretamente, si se puede ver en /demo con el corpus actual, y por qué importa (qué query bloquea).

Las fricciones se agrupan en tres niveles:

- **Críticas** — aparecen en ambos parlamentos. Son las que más fuerza ganan para una v4 porque el patrón se repite cross-país.
- **Importantes** — fuertes en uno de los dos países y conceptualmente replicables en otros.
- **Específicas** — propias del bicameralismo español o del rito comunitario europeo. No cross-país pero igualmente reales contra el schema.

### 5.1. Fricciones críticas

**1. El sponsor está modelado como persona, pero el rito real lo trata como institución**

El campo `BillTable.sponsors` es un JSON de objetos con la forma `{name, role, party, chamber, externalId}`, asumiendo que cada sponsor es una persona individual con afiliación partidaria y cámara. Esa forma se replica en `AmendmentTable.submitter`, `QuestionTable.questioner` y `StatementTable.author`.

En España rompe en cinco vías de iniciativa: el **Proyecto de Ley** lo firma el Gobierno como entidad colegiada (sin party ni chamber), la **Proposición de Ley** la firma un Grupo Parlamentario (no una persona, es el Grupo entero el que es party), la **Proposición de CA** la firma una Asamblea autonómica, la **ILP** la firman 500.000 ciudadanos, la **convalidación de RDL** la inicia el Consejo de Ministros. En EU pasa igual: la **COM proposal** la firma la Comisión Europea como Colegio, las **iniciativas JHA** las firman 1/4 de Estados Miembros, la **ECI** la firman 1 millón de ciudadanos.

El loader actual (líneas 537-549 de `loader.ts`) busca sponsors emparejando `<sponsor refersTo="#X">` con un `<TLCPerson eId="X">`. Si el `refersTo` apunta a un `<TLCOrganization>` (que es lo que se necesita para Gobierno o Comisión), el sponsor se descarta silenciosamente. **La Ley 1/2026 y el AI Act modelados cargan hoy con `BillTable.sponsors=[]`** aunque el XML lo declare correctamente.

Visible en /demo: sí. En `/demo/es/bill/121-000036` y `/demo/eu/bill/com-2021-206` la sección de sponsors aparece vacía.

Query bloqueada: "todos los bills donde el sponsor es el Gobierno", "todos los bills propuestos por la Comisión Europea", "porcentaje de bills con autor persona vs institución".

**2. El tipo de norma se aplasta — Ley, LO, RDL y Reglamento UE caen al mismo lugar**

La tabla ActTable tiene status, fecha de promulgación, fecha de aplicación, fecha de derogación, issuingBody (texto libre) y publicationJournalId. **No tiene una columna que distinga entre Ley ordinaria, Ley Orgánica, RDL, RDLeg o RD en España, ni entre Reglamento, Directiva, Decisión y Recomendación en EU**.

En España los rangos tienen procedimiento, mayoría requerida, materias reservadas y jerarquía radicalmente distintos. La Ley Orgánica requiere mayoría absoluta del Congreso y materias del art. 81 CE; el RDL lo emite el Gobierno por urgencia y debe convalidarse en 30 días; el RDLeg es delegación legislativa con plazo no prorrogable. En EU la diferencia entre Reglamento (vinculante directo en todos los EM) y Directiva (requiere transposición nacional) es la más grande del derecho comunitario.

El BOE registra el rango explícitamente con un código numérico (`<rango codigo="100">` para Ley, `<rango codigo="200">` para LO, `<rango codigo="730">` para RDL). En EU el dato vive en `FRBRsubtype` del XML (`value="regulation"` o `value="directive"`). En ningún caso se extrae a columna SQL.

Visible en /demo: sí. Tus tres acts (Ley 27/1999, Ley 1/2026, AI Act) cargan con `type='act'` indistinguibles. /demo no permite filtrar "muéstrame solo Leyes Orgánicas" o "todas las Directivas UE".

Query bloqueada: filtrar por jerarquía normativa, contar producción legislativa por rango, distinguir efectos jurídicos de actos diferentes.

**3. La "ley modificadora" no tiene subtype**

ActTable asume que un act tiene contenido sustantivo propio. La realidad es que en España aproximadamente la mitad de la producción legislativa son **leyes modificadoras puras**: su cuerpo entero son cambios a otras leyes anteriores. Toda "ley de medidas X que modifica las leyes Y, Z, W" cae en este patrón. Tu Ley 1/2026 es exactamente este caso: su articulado son cuatro artículos que cada uno modifica una ley anterior, y sus disposiciones finales modifican otras cuatro leyes. Cero contenido sustantivo propio.

En EU el caso del AI Act es **híbrido**: los artículos 1-101 más el Capítulo XII son contenido nuevo regulando IA, pero los artículos 102-110 modifican nueve actos previos (Reglamentos de aviación civil, vehículos a motor, equipo marino, etc.).

ActTable no tiene campo `actSubtype` ni `actClassification`. La única señal de que un act es modificador hoy son los rows en `DocumentLinkTable` con `relation='amends'` saliendo del act, pero eso no es un atributo del act en sí.

Visible en /demo: sí. Las páginas de detalle de Ley 1/2026 y AI Act muestran outgoing links 'amends' a leyes anteriores, pero no marcan al act como "modificador puro" o "híbrido". Para el lector, navegar a una ley puramente modificadora le interesa más el diff con las leyes target que el texto modificador, y eso no se refleja en la UI porque no hay marcador.

Query bloqueada: "todas las leyes modificadoras de los últimos 10 años", separación entre derecho originario y derecho modificativo, estadística de producción.

**4. Cada documento tiene varios identificadores oficiales y solo uno entra al schema**

`DocumentTable.nativeId` es un único string. Pero los documentos legales reales tienen varios identificadores paralelos, cada uno usado por un sistema distinto.

En España, la Ley 1/2026 tiene al menos cuatro: el código BOE (`BOE-A-2026-7967`), el ELI URI europeo (`https://www.boe.es/eli/es/l/2026/04/08/1`), el número oficial (`1/2026`), y el expediente parlamentario (`121/000036` en el Congreso, distinto en el Senado).

En EU, el AI Act tiene cuatro estables: el CELEX (`32024R1689`), el ELI (`eli/reg/2024/1689/oj`), la referencia OJ (`L_2024/1689`), y el procedure file (`2021/0106(COD)`). Cada uno se usa por un sistema diferente: CELEX es el ID de EUR-Lex, ELI es para interoperabilidad semántica web, OJ es para citación legal formal, COD es para tracking inter-institucional.

Cuando elegís uno como `nativeId`, los otros viven en el XML como `<akndiff:celexNumber>`, `<akndiff:procedureFile>`, `<akndiff:eliUri>`. Datos opacos, no consultables en SQL.

Visible en /demo: sí. La página de detalle de cada act muestra el nativeId que elegiste, no los otros tres.

Query bloqueada: "dame el doc con CELEX 32024R1689", "cruzá esta cita ELI con nuestro corpus", linkar una cita externa a un documento del corpus por cualquier ID que no sea el canónico.

**5. La fecha de aplicación es un timestamp único cuando el rito moderno la escalona**

`ActTable.effectiveAt` es un solo timestamp para "cuándo entró en vigor". En la práctica, los actos modernos tienen calendarios de aplicación.

En España la Ley 1/2026 difiere un artículo concreto un año entero (su disposición final 5.2). Es un caso suave pero ya rompe el modelo single-timestamp.

En EU el caso fuerte: el AI Act tiene **cuatro fechas de aplicación distintas** según el capítulo, todas codificadas en su artículo 113. Las prácticas prohibidas (Capítulo II) aplican desde el 2 de febrero de 2025. Los GPAI (Capítulo V) y la gobernanza (Capítulo VII) y las penalidades (Capítulo XII) aplican desde el 2 de agosto de 2025. La aplicación general es del 2 de agosto de 2026. Los sistemas de alto riesgo del Annex I aplican desde el 2 de agosto de 2027.

El lifecycle del XML del AI Act sí captura las cuatro fechas como eventRefs (`#partial_application_chapters_I_II`, `#partial_application_gpai_governance`, `#general_application`, `#high_risk_application`). Pero el extractor `extractAct()` del loader solo busca `#commencement` y guarda esa única fecha en `effectiveAt`. Las otras tres no entran a SQL.

Visible en /demo: sí. La página del AI Act muestra una sola fecha de aplicación. Las otras tres son texto opaco dentro del lifecycle.

Query bloqueada: "qué disposiciones del AI Act aplican el 1 de junio de 2026", "actos con aplicación escalonada en su corpus", planning regulatorio.

**6. El loader tira el atributo `chamber` de los eventos del bill**

Esto es un bug del extractor, no un problema del diseño del schema. La columna `BillEventTable.chamber` existe y está nullable. Tus XMLs llevan correctamente el atributo `chamber=` en cada eventRef del lifecycle: `chamber="congreso"`, `chamber="senado"`, `chamber="ambos"`, `chamber="ejecutivo"` en España; `chamber="commission"`, `chamber="parliament"`, `chamber="council"`, `chamber="parliament_and_council"`, `chamber="trilogue"` en EU.

Pero el extractor `extractEvents()` (líneas 417-435 de `loader.ts`) no lee ese atributo. La función emite un objeto con sequence, occurredAt, actionType y actionTypeLocal, pero no incluye chamber. Resultado: la columna chamber queda vacía en la base, aunque el dato esté en el XML.

Visible en /demo: sí. El timeline del bill 121/000036 muestra los 19 events pero sin marcar en qué cámara pasó cada uno. El timeline del AI Act muestra 16 events sin distinguir si fueron en Comisión, Parlamento o Consejo.

Query bloqueada: filtrar el lifecycle por cámara, contar trámites por chamber, reconstruir el flujo bicameral. Fix: una línea en el loader. Es un caso tipo completeness donde el campo existe pero no se llena.

**7. Las votaciones por bloque viven como narrativa en el XML del debate**

`DebateTable` solo tiene chamber, sessionStartedAt, sessionEndedAt y externalRef. **No hay tabla side de votaciones.** El comentario del schema lo dice explícitamente: "anything beyond chamber + session window timing belongs in the body XML".

La realidad es que cada Pleno produce 5-50 votaciones independientes con sus counts (sí/no/abstención por bloque). En el corpus español, el Pleno del 26 de marzo de 2026 (DSCD-15-PL-175) produjo 9 votaciones por bloques de enmiendas del Senado: dos aprobadas (bloques 3 y 4 con 346/4 y 313/4/33) y siete rechazadas. Cada bloque agrupa enmiendas distintas.

En EU el caso es más simple en cuanto a número (un voto único 523/46/49 para el AI Act el 13 de marzo de 2024) pero el patrón es el mismo: el voto recorded vive en el XML del amendment como `<akndiff:voteRecord>`, no en columnas estructuradas.

Visible en /demo: sí. El debate `dscd-15-pl-175` se muestra con su horario y oradores, pero las 9 votaciones aparecen solo como texto narrativo dentro del XML body, no como filas estructuradas que puedas filtrar.

Query bloqueada: "todas las enmiendas aprobadas en el Pleno del 26 de marzo", "todos los bills donde Grupo X votó a favor", "tasa de aprobación de enmiendas del Senado en la XV Legislatura". Ninguna funciona hoy porque las votaciones son texto plano.

**8. El status del bill es demasiado grueso para los sub-estados reales del trámite**

El enum `BillTable.status` tiene 10 valores: submitted, in_committee, floor_debate, second_chamber, reconciliation, passed, enacted, rejected, withdrawn, archived. Funciona como agrupación gruesa pero pierde sub-estados procesales con consecuencias jurídicas distintas.

En España el valor `in_committee` agrupa "calificado por Mesa", "en plazo de enmiendas a la totalidad", "en plazo de enmiendas al articulado", "ponencia constituida", "pendiente de Dictamen", "aprobado por Comisión c.l.p. sin pasar a Pleno". Cada uno tiene duración medible, plazos legales propios y consecuencias procedimentales. El valor `reconciliation` agrupa "vetado por el Senado, esperando levantamiento" y "modificado por el Senado, vuelta al Congreso", que son situaciones jurídicas radicalmente distintas con mayorías y plazos diferentes.

En EU `second_chamber` colapsa "general approach del Council" con "first reading position del EP", que son fases paralelas no secuenciales.

Visible en /demo: sí parcial. El timeline del bill 121/000036 captura los 19 events finos correctamente como rows en BillEventTable, pero el campo `BillTable.status` final es solo `enacted`. Para queries agregadas, se pierde la granularidad.

Query bloqueada: "bills aprobados por Comisión c.l.p. en XV Legislatura", "bills donde el Senado vetó vs solo enmendó", panel de control del estado del trámite en tiempo real.

**9. Falta el LinkRelation `enacted_as` para "este bill se convirtió en este acto"**

El enum `LinkRelation` tiene 13 valores: amends, modifies, promulgates, mentions, cites, replaces, derives_from, contains, refers_to, responds_to, interprets, consolidates, transmits. **Falta el más fundamental conceptualmente**: la relación 1:1 entre un bill y el acto en el que se convierte tras su aprobación.

En España, el bill 121/000036 se convirtió en la Ley 1/2026. En EU, COM(2021)206 se convirtió en el Reglamento 2024/1689. Esa relación no se puede representar como un LinkRelation porque ningún valor del enum la captura.

Hay un campo `BillTable.amendsActId` que apunta a un Act, pero ese campo apunta a la ley que el bill MODIFICA (la ley anterior, target de las modificaciones), no al acto en el que el bill se CONVIERTE.

Visible en /demo: sí. La página del bill muestra outgoing links a las leyes que modifica, pero no hay un link explícito a "el acto que produjo este bill". La conexión bill → act es la columna vertebral del rito legislativo y no tiene representación nativa en el schema.

Query bloqueada: "qué bill produjo esta ley", "bills enacted que se convirtieron en LO vs Ley ordinaria", trazabilidad inversa del rito.

### 5.2. Fricciones importantes

**10. Las consolidaciones de enmiendas pierden granularidad**

`AmendmentTable` está pensada con la lógica "una enmienda, un documento". Pero el rito real produce documentos consolidadores que agregan decenas o cientos de enmiendas individuales en un solo instrumento.

En España el caso típico es el **Informe de Ponencia** (BOCG-A-N-4): la Ponencia de la Comisión revisa todas las enmiendas presentadas por los Grupos y emite un informe que incorpora algunas, rechaza otras, propone redacciones de compromiso. El BOCG-15-A-36-4 modelado consolidó alrededor de 50 enmiendas individuales en un documento. Modelarlo como un único amendment con submitter "Ponencia" pierde la granularidad por enmienda. Modelar cada enmienda individual pierde la consolidación procedimental que ES el documento.

En EU el caso paralelo es la **posición de primera lectura del EP** (P9_TA(YYYY)NNNN): el P9_TA(2024)0138 modelado consolidó cientos de enmiendas del committee report y de plenary en un texto único que reemplaza enteramente la propuesta original de la Comisión. AmendmentTable lo modela como un row único.

Visible en /demo: sí. El amendment de Ponencia ES y el P9_TA EU se muestran como instrumentos únicos. Las enmiendas individuales que cada uno contiene no son entidades del corpus.

Tabla afectada: `AmendmentTable` — la estructura asume one-amendment-one-doc.

**11. El loader exige un evento `#promulgation` que en EU no existe**

El extractor `extractAct()` del loader (línea 564 de `loader.ts`) busca un eventRef con `refersTo="#promulgation"` y lanza error si no lo encuentra. La promulgación, en el rito español, es el acto formal del ejecutivo que da fe pública de que la ley aprobada por las Cortes existe: Felipe VI sanciona y promulga, refrendado por el Presidente del Gobierno.

En la UE no existe ese acto separado. La firma conjunta de los Presidentes del EP y del Consejo es lo más cercano semánticamente, pero estrictamente la fuerza de ley deviene de la publicación en el OJ tras 20 días. Para que el AI Act cargue en el schema, mapeaste su evento de firma del 13 de junio de 2024 a `refersTo="#promulgation"`, lo cual técnicamente carga pero es semánticamente impreciso.

Visible en /demo: sí. El timeline del AI Act muestra "Promulgation" en una fecha (13/06/2024) que en realidad es la firma conjunta. Vocabulario nacional-legal forzado a un concepto comunitario que no encaja.

Tabla afectada: `ActTable.promulgatedAt` (timestamp obligatorio) más el contrato del loader que requiere `#promulgation` en el lifecycle.

**12. Los anexos del AI Act son contenido legal de primer nivel, no apéndices**

El esquema modela un acto como una pieza con cuerpo articulado. Los anexos quedan dentro del XML como `<hcontainer name="annex">`, pero no se extraen a una tabla side ni son consultables individualmente.

En EU esto es una pérdida grande. El **Annex III del AI Act** lista las áreas de uso de alto riesgo (biometría, infraestructura crítica, educación, empleo, servicios esenciales, law enforcement, migración, justicia) y se referencia más de cincuenta veces en el articulado. **Es la regla operativa que dispara las obligaciones del Capítulo III**, no un apéndice. El Annex I lista la legislación armonizada UE que sirve de marco al otro camino al alto riesgo. El Annex XIII contiene los criterios para designar GPAI con riesgo sistémico (parámetros, compute, modalidades).

En España se vive una versión suave del problema con las **Disposiciones Adicionales, Transitorias, Finales y Derogatorias**, que también suelen llevar contenido sustantivo importante (la disposición final 5.2 de la Ley 1/2026 difiere un artículo un año).

Visible en /demo: sí. La página del AI Act tiene los 13 anexos como bloques de XML, pero no podés navegar al Annex III directamente o pedir "todos los actos con un anexo cuya rúbrica contenga 'high-risk'".

Tabla afectada: `DocumentTable.xml` (el contenido vive opaco). No existe tabla side `act_components` o similar.

**13. El OJ post-2023 colapsa el modelo journal a 1-doc-por-issue**

`JournalTable` fue pensada con la lógica "un issue del boletín contiene N actos publicados". El BOE núm. 87 cumple eso perfectamente: contiene la Ley 1/2026 más decenas de otras disposiciones publicadas el mismo día.

Desde el 1 de octubre de 2023, la UE reformó el formato del OJ: cada acto legislativo tiene su propia "OJ entry" con un número único (`L_2024/1689` es el AI Act él solo). El modelo issue → muchos docs degenera: un OJ entry = un acto. JournalTable funciona técnicamente (carga el row), pero la relación deja de tener sentido. La query "todos los actos publicados en el mismo issue del OJ" devuelve siempre N=1 para EU post-2023.

No es un bug del schema, es una señal de que el modelo journal está pensado para gacetas nacionales tradicionales y EU se salió de ese molde.

Visible en /demo: sí. El journal `oj-l-2024-1689` muestra la cabecera con el AI Act como única disposición contenida.

Tabla afectada: `JournalTable` — el modelo conceptual issue→docs.

**14. El multilingüismo es real en ambos países y el schema solo guarda un idioma**

`DocumentTable.language` es un solo string. Pero el dato real es multi-language en los dos parlamentos.

España publica los actos consolidados en **catalán y gallego** además del castellano (PDFs separados que el BOE mantiene). Los actos de Comunidades Autónomas con lengua co-oficial nacen multilingues por diseño.

EU es el caso extremo: las **24 lenguas oficiales tienen autenticidad equal**. Cada acto se publica simultáneamente en 24 versiones del OJ, todas con el mismo valor jurídico. AKN modela esto vía FRBR Expressions múltiples (varias Expressions por Work, una por idioma). El schema v3 colapsa a un único `language` en DocumentTable.

Visible en /demo: no en datos. Tu corpus es monolingüe en cada país (castellano para ES, inglés para EU). La fricción está documentada en notas pero no se materializa en el corpus actual.

Tabla afectada: `DocumentTable.language` (single text).

**15. El rapporteur del EP y el Ponente español son roles que el schema no tiene**

El campo `BillTable.sponsors[].role` es texto libre, así que técnicamente cabe poner "rapporteur" ahí. Pero en el rito real, el rapporteur del EP es un rol con su propia institución detrás (la comisión a la que pertenece, los shadow rapporteurs de los otros grupos políticos), y el ponente español es miembro de una Ponencia plural designada por la Comisión.

El AI Act tuvo dos co-rapporteurs porque fue tratado en joint committee referral (IMCO + LIBE bajo Rule 58 RoP): Brando Benifei (S&D, Italia, IMCO) y Dragoş Tudorache (Renew Europe, Rumanía, LIBE). Tu XML los lleva como `<akndiff:rapporteur>` extension elements con atributo `committee` apuntando a la comisión responsable. El loader no los lee.

En España, la Ponencia es un sub-órgano colegiado de la Comisión, normalmente un ponente por Grupo Parlamentario, encargada de elaborar el Informe sobre el texto y las enmiendas. La Ponencia no es persona, no es Grupo, es una entidad ad-hoc temporal que solo existe para ese expediente.

Visible en /demo: parcial. Los rapporteurs viven en el XML del bill EU como extension elements pero no aparecen en columnas SQL. La Ponencia ES queda como submitter genérico del Informe.

Tabla afectada: `BillTable.sponsors` (no diferencia rapporteur de sponsor) y falta `committee` o equivalent para anclar el rol al órgano responsable.

### 5.3. Fricciones específicas por país

**16. ES — La convalidación de RDL es una cadena bill→act→bill→act que el schema no encadena**

Cuando el Gobierno emite un Real Decreto-Ley, este es un act publicado en BOE. La Constitución exige convalidación por el Congreso en 30 días: eso abre un expediente de convalidación que es un bill (serie 130). Si tras la convalidación las Cortes acuerdan tramitarlo como Proyecto de Ley urgente, se abre OTRO bill (serie 121) que produce un acto final (la Ley resultante).

La cadena conceptual es: act₁ (RDL) → bill₁ (convalidación) → bill₂ (Proyecto urgente) → act₂ (Ley). El esquema tiene LinkRelation para `amends`, `replaces`, `derives_from`, pero no para "act convalidado por bill" ni para "RDL devenido en Ley tras tramitación parlamentaria".

Visible en /demo: no, no se modeló un RDL en este corpus.

Tabla afectada: enum `LinkRelation` — falta `convalidates` o similar.

**17. ES — Veto del Senado vs enmiendas del Senado: dos cosas distintas, un solo enum**

Cuando el Senado recibe un texto del Congreso tiene dos respuestas posibles muy diferentes. **Vetar** requiere mayoría absoluta del Senado y devuelve el texto al Congreso, que solo puede levantar el veto por mayoría absoluta inmediata o por mayoría simple después de dos meses. **Enmendar** requiere solo mayoría simple y vuelve al Congreso, que acepta o rechaza por mayoría simple.

Procedimientos jurídicamente distintos, mayorías distintas, plazos distintos. El enum `AmendmentOutcome` (pending, approved, rejected, withdrawn, inadmissible, merged) no distingue veto de enmienda.

Visible en /demo: no en este caso. Tu corpus modeló el Pleno del 26 de marzo donde el Senado **modificó** (no vetó) la Ley 1/2026.

Tabla afectada: enum `AmendmentOutcome` — falta `vetoed` o `amended_by_senate`.

**18. ES — Las 23 ampliaciones del plazo de enmiendas son la regla, no la excepción**

`BillEventTable` modela eventos discretos. En el rito español, el plazo inicial de enmiendas (15 días hábiles desde la publicación en BOCG, art. 110.1 RC) se prorroga sucesivamente por la Mesa de la Comisión. Tu caso 121/000036 tuvo **23 ampliaciones** desde el cierre original del 6/11/2024 hasta el cierre real del 4/06/2025. Cada ampliación se publica como acuerdo de Mesa.

Tu XML modela apertura y cierre como dos events, mencionando "tras múltiples ampliaciones" en el showAs. Las 23 prórrogas individuales no son events.

Visible en /demo: sí parcial. El showAs del event de cierre menciona la cantidad pero no las 23 prórrogas como filas separadas.

Tabla afectada: `BillEventTable` — el modelo agregado pierde las prórrogas individuales.

**19. EU — El trilogue es una negociación informal que produce documentos sin home en el schema**

El acuerdo político del trilogue (caso del AI Act, alcanzado el 8 de diciembre de 2023 bajo presidencia española de Carme Artigas) cierra la sustancia del rito. La negociación produce un "4-column document" comparativo con la propuesta de la Comisión, la posición del EP, la del Consejo y el texto de compromiso final.

Ese documento no es un bill (no es propuesta nueva), no es un amendment formal (no es enmienda individual), no es un debate (es a puerta cerrada). El schema no tiene "negotiation document" type. El lifecycle del bill captura el inicio del trilogue y el acuerdo político como events, pero el documento en sí no se modela como entidad.

Visible en /demo: parcial. Tu lifecycle del bill EU tiene `#trilogue_started` (21/06/2023) y `#trilogue_political_agreement` (08/12/2023) como events. El 4-column document no es un documento del corpus.

Tabla afectada: enum `DocumentType` — no hay "negotiation_document" o similar.

**20. EU — Las Reasoned Opinions de parlamentos nacionales por subsidiariedad cruzan jurisdicciones**

El Protocolo 2 del Tratado de Lisboa da a los parlamentos nacionales 8 semanas para evaluar si una propuesta legislativa de la Comisión respeta el principio de subsidiariedad. Si más de un tercio (Yellow Card) o más de la mitad (Orange Card) de los votos manifestan objeciones, la Comisión debe revisar.

El documento producido es una **Reasoned Opinion** de un parlamento nacional sobre un bill comunitario. Es decir, un documento de `countryCode='es'` (o 'fr', 'de', etc.) que critica un bill de `countryCode='eu'`. El schema asume que cada documento pertenece a un solo país y los hrefs cross-jurisdiction más allá del enum LinkRelation no están modelados.

Visible en /demo: no, no se modelaron reasoned opinions en este corpus.

Tabla afectada: el modelo conceptual de countryCode + LinkRelation cross-jurisdiction.

**21. EU — La Iniciativa Ciudadana Europea es una petición sin home claro**

Una ECI exitosa (1 millón de firmas en 12 meses) provoca una respuesta motivada de la Comisión, que puede o no proponer legislación. No es bill (no es propuesta legislativa formal del proponente), no es petition (el schema no tiene ese tipo), no es initiative (tampoco). Cae en `doc` genérico, perdiendo la naturaleza institucional.

Visible en /demo: no, el AI Act no se originó por ECI.

Tabla afectada: enum `DocumentType` — no hay `petition` ni `citizen_initiative`.

## Resumen del corpus contra las fricciones

De las **9 fricciones críticas**, las 9 son visibles en /demo con el corpus actual. La evidencia para discutir una v4 está completa para esta categoría.

De las **6 fricciones importantes**, 5 son visibles. La excepción es el multilingüismo (14): el dato existe en el rito real (BOE catalán y gallego, OJ en 24 idiomas) pero el corpus modeló cada caso en un solo idioma.

De las **6 fricciones específicas por país**, 1 está parcialmente visible (las ampliaciones del plazo en ES, fricción 18) y 5 quedan documentadas como mapeo del rito pero no materializadas en datos. Para verlas habría que modelar un RDL convalidado, un caso con veto del Senado, un acto EU con Reasoned Opinions de parlamentos nacionales, y una ECI exitosa.

Las nueve críticas son las que más fuerza ganan para una v4 porque el patrón se repite en los dos parlamentos modelados, no son particularidades de un caso o de un país. Las importantes son consistentes con esa direccion. Las específicas son materia de Phase 2 vertical, donde profundizar en cada país completará la cobertura.
