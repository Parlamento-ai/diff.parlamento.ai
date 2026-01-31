# Deep Research: Comparados legislativos en Alemania

## Prompt

No conozco nada sobre el sistema de comparados legislativos de Alemania. Necesito que me expliques todo desde cero, con el máximo nivel de detalle posible.

### Contexto

Soy desarrollador de software en una startup de seguimiento legislativo (parlamento.ai). Estamos investigando cómo funcionan los documentos de comparación legislativa en distintos países del mundo. El objetivo es documentar el estado del arte, identificar patrones comunes entre jurisdicciones, y eventualmente proponer formatos abiertos y legibles por máquina para publicar la evolución de proyectos de ley.

Vengo del mundo del software. Para mí, la forma natural de ver cambios entre versiones es un `git diff`. Me cuesta entender por qué la legislación se publica en formatos opacos. Quiero entender exactamente cómo funciona Alemania hoy.

### Lo que necesito saber

#### 1. Concepto y terminología
- ¿Cómo se llaman estos documentos en Alemania? "Synopse", "Textgegenüberstellung", ¿otros términos?
- ¿Hay una definición formal en el reglamento del Bundestag o en la GGO (Gemeinsame Geschäftsordnung der Bundesministerien)?
- ¿Quién los produce? ¿El servicio científico del Bundestag, las secretarías de comisión, los ministerios?

#### 2. El proceso legislativo y dónde aparecen los comparados
- Describir el flujo completo de un proyecto de ley en Alemania (Gesetzentwurf → Bundesrat primer paso → Bundestag → comisión → pleno → Bundesrat segundo paso → firma del Presidente).
- ¿En qué etapas exactas se producen Synopsen?
- ¿Son obligatorias? La propuesta de Die Linke (2021) para hacerlas obligatorias no prosperó — ¿qué pasó exactamente?
- ¿Qué dice el §53(2) de la GGO sobre cuándo los ministerios deben producirlas?
- ¿Cómo funciona el software eNorm en la creación de estos documentos?

#### 3. Formato y estructura de los documentos
- ¿Cuál es el formato físico? (PDF, Word, HTML, otro)
- ¿Tienen una estructura estandarizada? (tabla de dos columnas: ¿qué va en cada una?)
- ¿Cómo marcan las diferencias? (negrita para cambios, cursiva para eliminaciones — ¿es así realmente?)
- Si es PDF: ¿qué tipo? ¿Firma electrónica? ¿Texto seleccionable?
- Mostrar ejemplos concretos con URLs si es posible.

#### 4. Portales y sistemas de publicación
- ¿Dónde se publican? Listar todos los portales relevantes:
  - bundestag.de y el portal de opendata
  - DIP (Dokumentations- und Informationssystem) — dip.bundestag.de
  - GESTA
  - gesetze-im-internet.de
  - bgbl.de (Bundesgesetzblatt)
  - Cualquier otro
- ¿Qué ofrece cada portal en relación a comparados y versiones de proyectos?
- La API del DIP: ¿cómo funciona? ¿Qué formatos ofrece? ¿Documentación?

#### 5. Organismos involucrados
- Listar todos los organismos:
  - Bundestag (comisiones, servicio científico)
  - Bundesrat
  - Ministerios federales
  - Bundesanzeiger / Bundesgesetzblatt
  - Cualquier otro
- ¿Qué rol cumple cada uno?

#### 6. Estándares y formatos técnicos
- ¿Se usa algún estándar XML? ¿LegalDocML.de? ¿Akoma Ntoso?
- ¿Cómo funciona el proyecto LegalDocML.de? ¿En qué estado está realmente?
- ¿Qué relación tiene eNorm con los estándares XML?
- ¿Hay interoperabilidad con estándares europeos (ELI, etc.)?

#### 7. Realidad vs. aspiración
- Los parlamentos son muy buenos para proponer modernización y nunca implementarla. Necesito que distingas claramente entre:
  - Lo que **efectivamente funciona hoy** y está en uso diario
  - Lo que **está en proceso** de implementación (con evidencia concreta de avance)
  - Lo que **se anunció pero nunca se implementó** o quedó abandonado
  - Lo que **es solo una propuesta** sin implementación real

#### 8. Datos y acceso programático
- ¿Es posible hoy acceder programáticamente a los textos legislativos?
- ¿Qué APIs existen? ¿Bulk data? ¿Formatos?
- El archivo histórico desde 1949 del DIP: ¿es realmente accesible?

#### 9. Actores del ecosistema
- ¿Hay organizaciones de la sociedad civil o empresas trabajando en transparencia legislativa en Alemania?
- ¿Proyectos de civic tech? (Ej: FragDenStaat, abgeordnetenwatch.de, OffenesParlament, etc.)

### Formato de respuesta

Responde en español. Sé exhaustivo. Prefiero un documento largo y detallado a uno superficial. Incluye URLs concretas cuando sea posible. Cuando no tengas certeza sobre algo, indícalo explícitamente en vez de inventar.
