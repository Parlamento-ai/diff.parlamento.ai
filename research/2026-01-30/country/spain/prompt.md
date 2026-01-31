# Deep Research: Comparados legislativos en España

## Prompt

No conozco nada sobre el sistema de comparados legislativos de España. Necesito que me expliques todo desde cero, con el máximo nivel de detalle posible.

### Contexto

Soy desarrollador de software en una startup de seguimiento legislativo (parlamento.ai). Estamos investigando cómo funcionan los documentos de comparación legislativa en distintos países del mundo. El objetivo es documentar el estado del arte, identificar patrones comunes entre jurisdicciones, y eventualmente proponer formatos abiertos y legibles por máquina para publicar la evolución de proyectos de ley.

Vengo del mundo del software. Para mí, la forma natural de ver cambios entre versiones es un `git diff`. Me cuesta entender por qué la legislación se publica en formatos opacos. Quiero entender exactamente cómo funciona España hoy.

### Lo que necesito saber

#### 1. Concepto y terminología
- ¿Cómo se llaman estos documentos en España? ¿"Informe de ponencia"? ¿"Texto comparado"? ¿Otros términos?
- ¿Hay una definición formal en el Reglamento del Congreso, del Senado, o en alguna normativa?
- ¿Quién los produce? ¿Las ponencias, las secretarías de comisión, los letrados?

#### 2. El proceso legislativo y dónde aparecen los comparados
- Describir el flujo completo de un proyecto de ley en España (iniciativa → ponencia → comisión → pleno del Congreso → Senado → vuelta al Congreso si hay cambios).
- ¿En qué etapas exactas se producen documentos comparativos?
- ¿Qué es exactamente el "informe de ponencia" y cómo funciona como documento comparativo (art. 127 del Reglamento)?
- ¿Cómo funciona el "mensaje motivado" del Senado?
- ¿Hay diferencia entre proyectos de ley y proposiciones de ley en cuanto a comparados?

#### 3. Formato y estructura de los documentos
- ¿Cuál es el formato físico? (PDF, Word, HTML, otro)
- ¿Tienen una estructura estandarizada? (¿Cuántas columnas? ¿Qué contiene cada una?)
- ¿Cómo marcan las diferencias? (colores, tachado, negrita, otro)
- Si es PDF: ¿es PDF generado desde Word? ¿PDF/A? ¿Tiene texto seleccionable? ¿Tiene firma electrónica? ¿Qué tipo?
- ¿Hay metadatos en los documentos?
- Mostrar ejemplos concretos con URLs si es posible.

#### 4. Portales y sistemas de publicación
- ¿Dónde se publican? Listar todos los portales relevantes:
  - Congreso de los Diputados — www.congreso.es
  - Senado — www.senado.es
  - Boletín Oficial de las Cortes Generales (BOCG)
  - BOE — www.boe.es
  - Cualquier otro portal
- ¿Qué ofrece cada portal exactamente en relación a textos comparativos?
- ¿Hay APIs? ¿Datos descargables? ¿Formatos estructurados (XML, JSON)?

#### 5. Organismos involucrados
- Listar todos los organismos que participan:
  - Letrados de las Cortes
  - Secretarías de comisión
  - Oficinas de informática parlamentaria
  - BOE como publicador oficial
  - Cualquier otro
- ¿Qué rol cumple cada uno?

#### 6. Estándares y formatos técnicos
- ¿Se usa algún estándar XML en España? (Akoma Ntoso, ELI, otro)
- El BOE usa XML internamente — ¿cómo funciona? ¿Está disponible públicamente?
- ¿Hay algún proyecto de adopción de formatos abiertos para documentos parlamentarios?
- ¿España participa en iniciativas europeas como ELI?

#### 7. Realidad vs. aspiración
- Los parlamentos son muy buenos para proponer modernización y nunca implementarla. Necesito que distingas claramente entre:
  - Lo que **efectivamente funciona hoy** y está en uso diario
  - Lo que **está en proceso** de implementación (con evidencia concreta de avance)
  - Lo que **se anunció pero nunca se implementó** o quedó abandonado
  - Lo que **es solo una propuesta** sin implementación real

#### 8. Datos y acceso programático
- ¿Es posible hoy acceder programáticamente a los textos legislativos en sus distintas versiones?
- ¿Qué se puede scrapear? ¿Qué tiene API? ¿Qué está bloqueado?
- ¿Hay datasets públicos disponibles?

#### 9. Actores del ecosistema
- ¿Hay organizaciones de la sociedad civil, académicas, o empresas trabajando en transparencia legislativa en España?
- ¿Hay proyectos de civic tech relevantes? (Ej: Qué hacen, OpenKratio, etc.)

### Formato de respuesta

Responde en español. Sé exhaustivo. Prefiero un documento largo y detallado a uno superficial. Incluye URLs concretas cuando sea posible. Cuando no tengas certeza sobre algo, indícalo explícitamente en vez de inventar.
