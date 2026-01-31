# Deep Research: Comparados legislativos en Chile

## Prompt

No conozco nada sobre el sistema de comparados legislativos de Chile. Necesito que me expliques todo desde cero, con el máximo nivel de detalle posible.

### Contexto

Soy desarrollador de software en una startup de seguimiento legislativo (parlamento.ai). Estamos investigando cómo funcionan los documentos de comparación legislativa —llamados "comparados" o "textos comparados" o "cuadros comparados"— en distintos países del mundo. El objetivo es documentar el estado del arte, identificar patrones comunes entre jurisdicciones, y eventualmente proponer formatos abiertos y legibles por máquina para publicar la evolución de proyectos de ley.

Vengo del mundo del software. Para mí, la forma natural de ver cambios entre versiones es un `git diff`. Me cuesta entender por qué la legislación se publica en formatos opacos. Quiero entender exactamente cómo funciona Chile hoy.

### Lo que necesito saber

#### 1. Concepto y terminología
- ¿Cómo se llaman estos documentos en Chile? ¿Qué términos usan los parlamentarios, los abogados, la BCN?
- ¿Hay una definición formal en algún reglamento o normativa?
- ¿Quién los produce? ¿Las secretarías de comisión, la BCN, otro organismo?

#### 2. El proceso legislativo y dónde aparecen los comparados
- Describir el flujo completo de un proyecto de ley en Chile (mensaje/moción → comisión → sala → cámara revisora → comisión mixta → promulgación).
- ¿En qué etapas exactas se producen documentos comparativos?
- ¿Es obligatorio producirlos o es a criterio de la comisión/secretaría?
- ¿Cómo se relacionan con los informes de comisión?

#### 3. Formato y estructura de los documentos
- ¿Cuál es el formato físico? (PDF, Word, HTML, otro)
- ¿Tienen una estructura estandarizada? (¿Cuántas columnas? ¿Qué contiene cada una?)
- ¿Cómo marcan las diferencias? (colores, tachado, negrita, otro)
- Si es PDF: ¿es PDF generado desde Word? ¿PDF/A? ¿Tiene OCR o es texto seleccionable? ¿Tiene firma electrónica? ¿Qué tipo de firma (simple, avanzada, cualificada)?
- ¿Hay metadatos en los documentos? (autor, fecha, proyecto asociado)
- Mostrar ejemplos concretos con URLs si es posible.

#### 4. Portales y sistemas de publicación
- ¿Dónde se publican? Listar todos los portales relevantes:
  - Sistema de Información Legislativa (SIL) — www.senado.cl / www.camara.cl
  - Biblioteca del Congreso Nacional (BCN) — www.bcn.cl
  - Ley Chile — www.leychile.cl
  - Cualquier otro portal o sistema
- ¿Qué ofrece cada portal exactamente en relación a comparados?
- ¿Hay APIs? ¿Datos descargables en bulk? ¿Formatos estructurados (XML, JSON)?
- ¿Qué limitaciones tienen estos portales?

#### 5. Organismos involucrados
- Listar todos los organismos que participan en la producción, publicación o uso de comparados:
  - Secretarías de comisión (Senado y Cámara)
  - Biblioteca del Congreso Nacional (BCN)
  - Oficinas de informática del Congreso
  - Cualquier otro
- ¿Qué rol cumple cada uno?

#### 6. Estándares y formatos técnicos
- ¿Se usa algún estándar XML? (Akoma Ntoso, LegalDocML, otro)
- ¿Hay algún proyecto de adopción de formatos abiertos? ¿En qué estado está?
- ¿Se ha hablado de Akoma Ntoso o estándares similares en Chile?
- El 5° Plan de Gobierno Abierto mencionaba mejorar la interoperabilidad del SIL: ¿qué se ha implementado realmente? ¿Qué quedó en buenas intenciones?

#### 7. Realidad vs. aspiración
- Los parlamentos son muy buenos para proponer modernización y nunca implementarla. Necesito que distingas claramente entre:
  - Lo que **efectivamente funciona hoy** y está en uso diario
  - Lo que **está en proceso** de implementación (con evidencia concreta de avance)
  - Lo que **se anunció pero nunca se implementó** o quedó abandonado
  - Lo que **es solo una propuesta** sin implementación real

#### 8. Datos y acceso programático
- ¿Es posible hoy, como desarrollador, acceder programáticamente a los textos de proyectos de ley en sus distintas versiones?
- ¿Qué se puede scrapear? ¿Qué tiene API? ¿Qué está bloqueado?
- ¿Hay datasets públicos disponibles?

#### 9. Actores del ecosistema
- ¿Hay organizaciones de la sociedad civil, académicas, o empresas trabajando en transparencia legislativa en Chile?
- ¿Hay proyectos de civic tech relevantes?

### Formato de respuesta

Responde en español. Sé exhaustivo. Prefiero un documento largo y detallado a uno superficial. Incluye URLs concretas cuando sea posible. Cuando no tengas certeza sobre algo, indícalo explícitamente en vez de inventar.
