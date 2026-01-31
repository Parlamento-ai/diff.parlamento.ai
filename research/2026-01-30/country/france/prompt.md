# Deep Research: Comparados legislativos en Francia

## Prompt

No conozco nada sobre el sistema de comparados legislativos de Francia. Necesito que me expliques todo desde cero, con el máximo nivel de detalle posible.

### Contexto

Soy desarrollador de software en una startup de seguimiento legislativo (parlamento.ai). Estamos investigando cómo funcionan los documentos de comparación legislativa en distintos países del mundo. El objetivo es documentar el estado del arte, identificar patrones comunes entre jurisdicciones, y eventualmente proponer formatos abiertos y legibles por máquina para publicar la evolución de proyectos de ley.

Vengo del mundo del software. Para mí, la forma natural de ver cambios entre versiones es un `git diff`. Me cuesta entender por qué la legislación se publica en formatos opacos. Quiero entender exactamente cómo funciona Francia hoy.

### Lo que necesito saber

#### 1. Concepto y terminología
- ¿Cómo se llaman estos documentos en Francia? "Tableau comparatif", "texte comparé", ¿otros términos?
- ¿Hay una definición formal en el Reglamento de la Assemblée Nationale o del Sénat?
- ¿Quién los produce? ¿Los rapporteurs, las secretarías de comisión, los administrateurs?

#### 2. El proceso legislativo y dónde aparecen los comparados
- Describir el flujo completo de un proyecto de ley en Francia (projet/proposition → commission → séance publique → navette → CMP → promulgation).
- ¿En qué etapas exactas se producen tableaux comparatifs?
- ¿Son parte obligatoria de los informes de comisión (rapports)?
- ¿Cómo funciona la "navette" (ida y vuelta entre Assemblée y Sénat) en términos de documentos comparativos?
- ¿Qué pasa con los textos de la Commission Mixte Paritaire?

#### 3. Formato y estructura de los documentos
- ¿Cuál es el formato físico? (PDF, Word, HTML, otro)
- ¿Tienen una estructura estandarizada? (¿Cuántas columnas? ¿Qué contiene cada una?)
- ¿Cómo marcan las diferencias?
- Si es PDF: ¿qué tipo? ¿Firma electrónica? ¿Texto seleccionable?
- Mostrar ejemplos concretos con URLs si es posible.

#### 4. Portales y sistemas de publicación
- ¿Dónde se publican? Listar todos los portales relevantes:
  - assemblee-nationale.fr
  - senat.fr
  - data.assemblee-nationale.fr (datos abiertos)
  - legifrance.gouv.fr
  - Journal Officiel
  - Cualquier otro portal
- ¿Qué ofrece cada portal en relación a comparados?
- ¿Qué APIs existen? (datos abiertos de la Assemblée, etc.)
- ¿Qué formatos están disponibles? (XML, JSON, CSV)

#### 5. Organismos involucrados
- Listar todos los organismos:
  - Assemblée Nationale (comisiones, administrateurs)
  - Sénat
  - Secrétariat général du Gouvernement
  - Légifrance como publicador
  - Cualquier otro
- ¿Qué rol cumple cada uno?

#### 6. Estándares y formatos técnicos
- ¿Se usa algún estándar XML en Francia? ¿Akoma Ntoso?
- Légifrance usa XML internamente — ¿cómo funciona? ¿Está disponible?
- ¿Francia participa en ELI (European Legislation Identifier)?
- ¿Hay interoperabilidad con el ecosistema europeo?

#### 7. Ecosistema civic tech
- NosDéputés.fr, ParlAPI.fr, Regards Citoyens — ¿qué hacen exactamente?
- ¿Qué datos explotan y cómo?
- ¿Hay otros proyectos relevantes?

#### 8. Realidad vs. aspiración
- Los parlamentos son muy buenos para proponer modernización y nunca implementarla. Necesito que distingas claramente entre:
  - Lo que **efectivamente funciona hoy** y está en uso diario
  - Lo que **está en proceso** de implementación (con evidencia concreta)
  - Lo que **se anunció pero nunca se implementó** o quedó abandonado
  - Lo que **es solo una propuesta** sin implementación real

#### 9. Datos y acceso programático
- ¿Es posible hoy acceder programáticamente a los textos legislativos?
- ¿Qué APIs existen? ¿Bulk data? ¿Formatos?
- La Licence Ouverte: ¿qué cubre exactamente?

### Formato de respuesta

Responde en español. Sé exhaustivo. Prefiero un documento largo y detallado a uno superficial. Incluye URLs concretas cuando sea posible. Cuando no tengas certeza sobre algo, indícalo explícitamente en vez de inventar.
