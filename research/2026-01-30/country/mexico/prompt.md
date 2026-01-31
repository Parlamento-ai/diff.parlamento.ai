# Deep Research: Comparados legislativos en México

## Prompt

No conozco nada sobre el sistema de comparados legislativos de México. Necesito que me expliques todo desde cero, con el máximo nivel de detalle posible.

### Contexto

Soy desarrollador de software en una startup de seguimiento legislativo (parlamento.ai). Estamos investigando cómo funcionan los documentos de comparación legislativa en distintos países del mundo. El objetivo es documentar el estado del arte, identificar patrones comunes entre jurisdicciones, y eventualmente proponer formatos abiertos y legibles por máquina para publicar la evolución de proyectos de ley.

Vengo del mundo del software. Para mí, la forma natural de ver cambios entre versiones es un `git diff`. Me cuesta entender por qué la legislación se publica en formatos opacos. Quiero entender exactamente cómo funciona México hoy.

### Lo que necesito saber

#### 1. Concepto y terminología
- ¿Cómo se llaman estos documentos en México? "Cuadro comparativo", "cuadro de tres columnas", ¿otros términos?
- ¿Hay una definición formal en el Reglamento de la Cámara de Diputados o del Senado?
- ¿Es obligatorio incluirlos en los dictámenes? ¿Qué dice la normativa exactamente?
- ¿Quién los produce? ¿Las secretarías técnicas de comisión, los asesores, CEFP?

#### 2. El proceso legislativo y dónde aparecen los comparados
- Describir el flujo completo de una iniciativa en México (presentación → turno a comisión → dictamen → pleno → cámara revisora → promulgación/publicación en DOF).
- ¿En qué etapas exactas se producen cuadros comparativos?
- ¿Cómo se estructura un dictamen de comisión y dónde encaja el cuadro comparativo?
- ¿Hay diferencias entre Cámara de Diputados y Senado en cuanto a formato?

#### 3. Formato y estructura de los documentos
- ¿Cuál es el formato físico? (PDF, Word, HTML, otro)
- La estructura de tres columnas: ¿qué contiene cada columna exactamente?
- ¿Cada artículo/sección ocupa su propia fila?
- ¿Cómo marcan las diferencias? (colores, negritas, tachado, otro)
- Si es PDF: ¿qué tipo? ¿Firma electrónica? ¿Texto seleccionable?
- Mostrar ejemplos concretos con URLs si es posible.

#### 4. Portales y sistemas de publicación
- ¿Dónde se publican? Listar todos los portales relevantes:
  - Gaceta Parlamentaria (gaceta.diputados.gob.mx)
  - Sistema de Información Legislativa (sil.gobernacion.gob.mx)
  - Cámara de Diputados (diputados.gob.mx)
  - Senado (senado.gob.mx)
  - Diario Oficial de la Federación (dof.gob.mx)
  - Cualquier otro portal
- ¿Qué ofrece cada portal en relación a comparados?
- ¿Hay APIs? ¿Datos descargables? ¿Formatos estructurados?

#### 5. Organismos involucrados
- Listar todos los organismos:
  - Cámara de Diputados (secretarías técnicas, CEFP)
  - Senado de la República
  - Secretaría de Gobernación (SIL)
  - DOF como publicador oficial
  - Centros de estudio de las cámaras
  - Cualquier otro
- ¿Qué rol cumple cada uno?

#### 6. Estándares y formatos técnicos
- ¿Se usa algún estándar XML en México? ¿Akoma Ntoso?
- ¿Hay algún proyecto de modernización digital del proceso legislativo?
- ¿Se ha hablado de formatos abiertos para documentos parlamentarios?

#### 7. Realidad vs. aspiración
- Los parlamentos son muy buenos para proponer modernización y nunca implementarla. Necesito que distingas claramente entre:
  - Lo que **efectivamente funciona hoy** y está en uso diario
  - Lo que **está en proceso** de implementación (con evidencia concreta)
  - Lo que **se anunció pero nunca se implementó** o quedó abandonado
  - Lo que **es solo una propuesta** sin implementación real

#### 8. Datos y acceso programático
- ¿Es posible hoy acceder programáticamente a los textos legislativos?
- ¿Qué se puede scrapear? ¿Qué tiene API?
- El SIL de Gobernación: ¿ofrece datos estructurados?

#### 9. Actores del ecosistema
- ¿Hay organizaciones de la sociedad civil trabajando en transparencia legislativa en México?
- ¿Proyectos de civic tech relevantes? (Ej: Borde Político, Legisla, etc.)

### Formato de respuesta

Responde en español. Sé exhaustivo. Prefiero un documento largo y detallado a uno superficial. Incluye URLs concretas cuando sea posible. Cuando no tengas certeza sobre algo, indícalo explícitamente en vez de inventar.
