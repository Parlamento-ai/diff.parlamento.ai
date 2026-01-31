# Deep Research: Comparados legislativos en Argentina

## Prompt

No conozco nada sobre el sistema de comparados legislativos de Argentina. Necesito que me expliques todo desde cero, con el máximo nivel de detalle posible.

### Contexto

Soy desarrollador de software en una startup de seguimiento legislativo (parlamento.ai). Estamos investigando cómo funcionan los documentos de comparación legislativa en distintos países del mundo. El objetivo es documentar el estado del arte, identificar patrones comunes entre jurisdicciones, y eventualmente proponer formatos abiertos y legibles por máquina para publicar la evolución de proyectos de ley.

Vengo del mundo del software. Para mí, la forma natural de ver cambios entre versiones es un `git diff`. Me cuesta entender por qué la legislación se publica en formatos opacos. Quiero entender exactamente cómo funciona Argentina hoy.

### Lo que necesito saber

#### 1. Concepto y terminología
- ¿Cómo se llaman estos documentos en Argentina? "Cuadro comparativo", ¿otros términos?
- ¿Hay una definición formal en los reglamentos del Senado o la Cámara de Diputados?
- ¿Quién los produce? ¿Las secretarías de comisión, la Dirección de Información Parlamentaria, otro?
- ¿Es obligatorio producirlos o es completamente ad hoc?

#### 2. El proceso legislativo y dónde aparecen los comparados
- Describir el flujo completo de un proyecto de ley en Argentina (presentación → comisión → plenario → cámara revisora → promulgación).
- ¿En qué etapas se producen documentos comparativos, si es que se producen?
- ¿Cómo funcionan los despachos de comisión? ¿Incluyen comparados?
- ¿Hay diferencia entre Senado y Diputados?

#### 3. Formato y estructura de los documentos
- ¿Cuál es el formato físico cuando existen? (PDF, Word, HTML, otro)
- ¿Tienen alguna estructura estandarizada o es completamente libre?
- Si es PDF: ¿qué tipo? ¿Firma electrónica? ¿Texto seleccionable?
- Mostrar ejemplos concretos con URLs si es posible.

#### 4. Portales y sistemas de publicación
- ¿Dónde se publican? Listar todos los portales relevantes:
  - HCDN (Cámara de Diputados) — hcdn.gob.ar
  - Senado — senado.gob.ar
  - Infoleg — infoleg.gob.ar (servicios.infoleg.gob.ar)
  - Trámite Parlamentario
  - Boletín Oficial
  - SAIJ (Sistema Argentino de Información Jurídica)
  - Cualquier otro
- ¿Qué ofrece cada portal en relación a versiones de proyectos y comparados?
- ¿Hay APIs? ¿Datos descargables? ¿Formatos estructurados?

#### 5. Organismos involucrados
- Listar todos los organismos:
  - Cámara de Diputados (secretarías, Dirección de Información Parlamentaria)
  - Senado
  - Ministerio de Justicia (Infoleg, SAIJ)
  - Cualquier otro
- ¿Qué rol cumple cada uno?

#### 6. Estándares y formatos técnicos
- ¿Se usa algún estándar XML en Argentina?
- ¿Hay algún proyecto de modernización digital del proceso legislativo?
- ¿Argentina participa en el Hub Latinoamericano de interoperabilidad parlamentaria?

#### 7. Rol de organizaciones externas
- Nuestro primer reporte indica que los análisis comparativos frecuentemente son producidos por organizaciones externas (universidades, ONGs). ¿Cuáles son?
- ¿Qué producen exactamente? ¿En qué formato?

#### 8. Realidad vs. aspiración
- Los parlamentos son muy buenos para proponer modernización y nunca implementarla. Necesito que distingas claramente entre:
  - Lo que **efectivamente funciona hoy** y está en uso diario
  - Lo que **está en proceso** de implementación (con evidencia concreta)
  - Lo que **se anunció pero nunca se implementó** o quedó abandonado
  - Lo que **es solo una propuesta** sin implementación real

#### 9. Datos y acceso programático
- ¿Es posible hoy acceder programáticamente a los textos legislativos?
- ¿Qué se puede scrapear? ¿Qué tiene API?
- Infoleg: ¿ofrece datos estructurados o solo HTML/PDF?

#### 10. Actores del ecosistema
- ¿Hay organizaciones de la sociedad civil trabajando en transparencia legislativa?
- ¿Proyectos de civic tech relevantes? (Ej: Directorio Legislativo, CIPPEC, etc.)

### Formato de respuesta

Responde en español. Sé exhaustivo. Prefiero un documento largo y detallado a uno superficial. Incluye URLs concretas cuando sea posible. Cuando no tengas certeza sobre algo, indícalo explícitamente en vez de inventar.
