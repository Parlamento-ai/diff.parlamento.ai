# BPMN + DMN para representar el rito parlamentario

## El problema

AKN es **document-centric**: captura los artefactos del rito (leyes, enmiendas, debates, informes), pero no las **reglas del juego** que determinan cómo esos artefactos se mueven por el sistema. Falta una capa **process-centric** que represente el flujo de decisiones del rito parlamentario de forma machine-readable y human-readable.

## Formatos evaluados

### 1. BPMN (Business Process Model and Notation) — Recomendado

Estándar ISO 19510 de la OMG para modelar procesos con decisiones, bifurcaciones y caminos paralelos. Es XML por debajo y visual por arriba.

Un rito parlamentario en BPMN se vería algo como:

```
[Ingreso Proyecto] → (Gateway: ¿Requiere urgencia?)
    → Sí → [Comisión con plazo reducido]
    → No → [Comisión ordinaria]
        → (Gateway: ¿Aprobado en comisión?)
            → Sí → [Votación en Sala]
            → No → [Archivo]
```

**Ventajas:**
- Formato XML estándar (`.bpmn`) machine-readable
- Visualizadores y editores maduros (Camunda, bpmn.io)
- Soporta gateways de decisión, eventos temporales (plazos), sub-procesos
- Ya usado en gobiernos para modelar trámites
- Mecanismo de extensión nativo (custom XML namespaces)

**Limitación:** No fue pensado para lo legal. No entiende de quórum, mayorías, ni terminología parlamentaria.

### 2. DMN (Decision Model and Notation) — Complemento de BPMN

Otro estándar de la OMG, enfocado en **tablas de decisión**. Ideal para reglas como:

| Tipo de ley | Cámara de origen | Mayoría requerida |
|---|---|---|
| Constitucional | Cualquiera | 2/3 |
| Orgánica | Senado | Absoluta |
| Simple | Cualquiera | Simple |

**La combinación BPMN + DMN es poderosa:** BPMN modela el flujo, DMN modela las reglas de decisión dentro de cada paso.

### 3. LegalRuleML (evaluado, descartado)

Parte de la familia OASIS LegalXML (la misma que AKN). Diseñado para representar reglas legales en XML. Es jurídicamente preciso e interopera con AKN, pero es menos visual que BPMN, más verboso y tiene mucho menos tooling.

### 4. SCXML — State Chart XML (evaluado, descartado)

Estándar W3C para máquinas de estados. Ideal si se piensa en un proyecto de ley como algo con **estados** y **transiciones** (Presentado → En Comisión → Aprobado → Promulgado). Simple y elegante, pero le faltan las reglas de decisión.

### 5. Catala (evaluado, interesante pero distinto)

Lenguaje de programación de INRIA (Francia) para codificar legislación ejecutable. Usado por el gobierno francés para cálculo de impuestos (DGFIP) y beneficios sociales (CNAF). v1.1.0, repo activo con 2.2k estrellas en GitHub.

La diferencia clave con una librería JS normal: el texto de la ley ES el código fuente (literate programming). Un abogado lee el documento y ve la ley con anotaciones de código debajo. El compilador detecta conflictos entre reglas automáticamente. Compila a Python y C.

**No aplica directamente** al rito parlamentario (está diseñado para leyes que se computan: impuestos, beneficios). Pero podría servir para codificar reglas de quórum y mayorías de forma verificable.

## Propuesta: AKN + BPMN + DMN

```
1. AKN  = los documentos (qué se produjo)
2. BPMN = el proceso (cómo se mueven los documentos)
3. DMN  = las reglas (por qué se toman las decisiones)
```

Cada país tendría su **modelo BPMN** del rito parlamentario, con sus **tablas DMN** de reglas. Los nodos del proceso BPMN referenciarían los tipos de documentos AKN que se producen en cada paso.

## Gaps identificados (extensiones necesarias)

BPMN y DMN vanilla cubren ~85% del caso parlamentario. Pero hay 4 gaps concretos que necesitan convenciones o extensiones ligeras, similar a lo que se hizo con AKN Diff.

### Gap 1: Puente AKN ↔ BPMN

BPMN tiene "data objects" genéricos pero no sabe qué es un documento AKN. Cuando un nodo dice "Comisión emite informe", no hay forma nativa de decir "este paso produce un `REPORT` AKN".

Extensión propuesta:
```xml
<bpmn:task id="emitir_informe" name="Emitir informe de comisión">
  <bpmnparl:produces
    aknType="report"
    aknHref="/cl/report/2024-03-15/comision-hacienda/informe-1" />
</bpmn:task>
```

### Gap 2: Semántica parlamentaria en tareas

BPMN tiene "tasks" genéricos. Un debate y una votación son ambos "tasks", pero son radicalmente distintos en el rito. Un debate tiene oradores y turnos; una votación tiene quórum, tipo de mayoría y resultado.

Extensión propuesta:
```xml
<bpmnparl:votingTask id="votacion_sala"
  quorumType="absolute_majority"
  majorityRule="simple">
  <bpmnparl:linkedDecision dmnRef="tabla_mayorias" />
</bpmnparl:votingTask>
```

### Gap 3: Fuente legal de cada regla DMN

Una tabla DMN dice "si es ley constitucional, se necesitan 2/3", pero no dice de dónde sale esa regla. Sin referencia legal, la tabla es útil pero no verificable.

Extensión propuesta:
```xml
<dmn:rule>
  <dmn:inputEntry>Constitucional</dmn:inputEntry>
  <dmn:outputEntry>2/3</dmn:outputEntry>
  <dmnparl:legalSource
    href="/cl/act/constitución/art_66"
    showAs="Art. 66 CPR" />
</dmn:rule>
```

### Gap 4: Localización cross-jurisdicción

Chile dice "Cámara de Diputados", España dice "Congreso de los Diputados". BPMN no tiene un `showAs` como AKN.

Extensión propuesta:
```xml
<bpmn:lane id="lower_chamber" name="Lower Chamber">
  <bpmnparl:localization>
    <bpmnparl:name lang="es-CL" showAs="Cámara de Diputadas y Diputados" />
    <bpmnparl:name lang="es-ES" showAs="Congreso de los Diputados" />
    <bpmnparl:name lang="en" showAs="House of Representatives" />
  </bpmnparl:localization>
</bpmn:lane>
```

## Comparación de esfuerzo

| Aspecto | ¿AKN lo necesitó? | ¿BPMN/DMN lo necesita? |
|---|---|---|
| El formato base funciona para lo esencial | Sí (~80%) | Sí (~85%) |
| Necesitó nuevos tipos/extensiones | Sí: `changeSet`, `citation`, `questions` | Sí: puente AKN, task types parlamentarios |
| Localización multi-país | AKN ya lo tenía (`showAs`) | No lo tiene, hay que agregarlo |
| Referencia a fuente legal | AKN es la fuente legal | DMN necesita apuntar a AKN |
| Mecanismo de extensión del estándar | Sí (namespaces XML) | Sí (namespaces XML) |

La carga es **menor** que con AKN porque el flujo del proceso se modela bien con BPMN vanilla. Lo que falta es principalmente **metadata y conectores**, no tipos completamente nuevos.

## Herramientas relevantes

- [bpmn.io](https://bpmn.io) — Editor/visualizador BPMN open source (renderiza en navegador)
- [Camunda](https://camunda.com) — Plataforma de ejecución BPMN + DMN
- [dmn-js](https://bpmn.io/toolkit/dmn-js/) — Editor DMN open source

## Fuentes

- [BPMN 2.0 Specification (OMG)](https://www.omg.org/spec/BPMN/2.0/PDF/)
- [DMN Specification (OMG)](https://www.omg.org/dmn/)
- [Law Modeling with Ontological Support and BPMN](https://www.researchgate.net/publication/228399296)
- [Towards exploiting BPMN and DMN in public service modeling](https://dl.acm.org/doi/fullHtml/10.1145/3635059.3635092)
- [CATALA translates law into code (INRIA)](https://www.inria.fr/en/catala-software-dgfip-cnaf)
- [CatalaLang/catala (GitHub)](https://github.com/CatalaLang/catala)
