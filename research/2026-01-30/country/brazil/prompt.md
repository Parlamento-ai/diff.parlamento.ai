# Deep Research: Comparados legislativos en Brasil

## Prompt

No conozco nada sobre el sistema de comparados legislativos de Brasil. Necesito que me expliques todo desde cero, con el máximo nivel de detalle posible.

### Contexto

Soy desarrollador de software en una startup de seguimiento legislativo (parlamento.ai). Estamos investigando cómo funcionan los documentos de comparación legislativa en distintos países del mundo. El objetivo es documentar el estado del arte, identificar patrones comunes entre jurisdicciones, y eventualmente proponer formatos abiertos y legibles por máquina para publicar la evolución de proyectos de ley.

Vengo del mundo del software. Para mí, la forma natural de ver cambios entre versiones es un `git diff`. Me cuesta entender por qué la legislación se publica en formatos opacos. Quiero entender exactamente cómo funciona Brasil hoy.

### Lo que necesito saber

#### 1. Concepto y terminología
- ¿Cómo se llaman estos documentos en Brasil? "Quadro comparativo", ¿otros términos?
- ¿Hay una definición formal en los reglamentos de la Câmara o del Senado?
- ¿Quién los produce?

#### 2. El proceso legislativo y dónde aparecen los comparados
- Describir el flujo completo de un proyecto de ley en Brasil (apresentação → comissão → plenário → câmara revisora → sanção/veto → publicação no DOU).
- ¿En qué etapas se producen documentos comparativos?
- ¿Son obligatorios en los pareceres de comisión?
- ¿Cómo funciona con Medidas Provisórias (que tienen un flujo especial)?
- ¿Cómo funciona con Propostas de Emenda à Constituição (PECs)?

#### 3. LexML — el sistema estrella
- ¿Cómo funciona LexML exactamente? Arquitectura, tecnología, alcance.
- ¿Qué son los 1.5+ millones de documentos indexados? ¿De qué niveles y poderes?
- El estándar LexML-BR: schema XML, URN LEX, OAI-PMH — explicar cada componente en detalle.
- ¿Cómo se relaciona con Akoma Ntoso?
- Servicio de resolución de URNs: ¿cómo funciona?
- Servicio de linking automático de citas: ¿cómo funciona?
- ¿LexML realmente se usa en la práctica diaria o es más un proyecto académico/institucional?

#### 4. Formato y estructura de los documentos
- ¿Cuál es el formato físico de los comparados? (PDF, HTML, XML, otro)
- ¿Tienen una estructura estandarizada?
- ¿Cómo marcan las diferencias?
- El portal de la Constitución Federal con timeline de enmiendas: ¿cómo funciona?
- Mostrar ejemplos concretos con URLs si es posible.

#### 5. Portales y sistemas de publicación
- ¿Dónde se publican? Listar todos los portales relevantes:
  - LexML (lexml.gov.br)
  - Câmara dos Deputados (camara.leg.br)
  - Dados Abertos da Câmara (dadosabertos.camara.leg.br)
  - Senado Federal (senado.leg.br)
  - API del Senado
  - Planalto (planalto.gov.br)
  - Diário Oficial da União
  - Cualquier otro
- ¿Qué ofrece cada portal? APIs? Formatos? Bulk data?
- Las APIs de Câmara y Senado: documentación, formatos, limitaciones.

#### 6. Organismos involucrados
- Listar todos los organismos:
  - Câmara dos Deputados
  - Senado Federal
  - Presidência da República
  - Imprensa Nacional (DOU)
  - Prodasen (empresa de TI del Senado)
  - Cualquier otro
- ¿Qué rol cumple cada uno?

#### 7. Estándares y formatos técnicos
- LexML-BR vs. Akoma Ntoso: ¿cuáles son las diferencias concretas?
- ¿Cómo funciona el schema XML de LexML-BR?
- URN LEX: ¿cómo se construyen los identificadores?
- ¿Hay interoperabilidad con otros estándares internacionales?

#### 8. Realidad vs. aspiración
- Los parlamentos son muy buenos para proponer modernización y nunca implementarla. Necesito que distingas claramente entre:
  - Lo que **efectivamente funciona hoy** y está en uso diario
  - Lo que **está en proceso** de implementación (con evidencia concreta)
  - Lo que **se anunció pero nunca se implementó** o quedó abandonado
  - Lo que **es solo una propuesta** sin implementación real
- LexML específicamente: ¿está activo y mantenido? ¿Se actualiza? ¿O es un proyecto que perdió momento?

#### 9. Datos y acceso programático
- ¿Es posible hoy acceder programáticamente a los textos legislativos?
- APIs de Câmara y Senado: ¿qué tan completas son realmente?
- ¿Hay bulk data disponible?
- ¿Cuáles son las limitaciones reales?

#### 10. Actores del ecosistema
- ¿Hay organizaciones de la sociedad civil trabajando en transparencia legislativa?
- ¿Proyectos de civic tech? (Ej: Câmara aberta, Parlametria, Serenata de Amor, etc.)
- ¿Brasil participa en el Hub Latinoamericano de interoperabilidad parlamentaria?

### Formato de respuesta

Responde en español. Sé exhaustivo. Prefiero un documento largo y detallado a uno superficial. Incluye URLs concretas cuando sea posible. Cuando no tengas certeza sobre algo, indícalo explícitamente en vez de inventar.
