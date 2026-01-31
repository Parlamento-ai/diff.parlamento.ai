# Deep Research: Comparados legislativos en la Unión Europea

## Prompt

No conozco nada sobre el sistema de comparados legislativos de la Unión Europea. Necesito que me expliques todo desde cero, con el máximo nivel de detalle posible.

### Contexto

Soy desarrollador de software en una startup de seguimiento legislativo (parlamento.ai). Estamos investigando cómo funcionan los documentos de comparación legislativa en distintos países y organizaciones supranacionales. El objetivo es documentar el estado del arte, identificar patrones comunes entre jurisdicciones, y eventualmente proponer formatos abiertos y legibles por máquina para publicar la evolución de proyectos de ley.

Vengo del mundo del software. Para mí, la forma natural de ver cambios entre versiones es un `git diff`. Me cuesta entender por qué la legislación se publica en formatos opacos. Quiero entender exactamente cómo funciona la UE hoy.

### Lo que necesito saber

#### 1. Concepto y terminología
- ¿Cómo se llaman estos documentos en la UE? "Consolidated text", "texte consolidé", ¿otros?
- ¿Hay una definición formal en los tratados o reglamentos internos?
- ¿Quién los produce? ¿La Oficina de Publicaciones, el Servicio Jurídico, otro?

#### 2. El proceso legislativo y dónde aparecen los comparados
- Describir el procedimiento legislativo ordinario (propuesta de la Comisión → Parlamento primera lectura → Consejo primera lectura → segunda lectura → conciliación → adopción).
- ¿En qué etapas se producen documentos comparativos o consolidados?
- ¿Cómo funciona el sistema de "textos consolidados" de EUR-Lex?
- ¿Cómo se rastrean las enmiendas del Parlamento Europeo?
- ¿Qué papel juegan los "four-column documents" en los trílogos?

#### 3. EUR-Lex y textos consolidados
- ¿Cómo funciona exactamente el sistema de consolidación?
- Tags B (acto base), M (modificación), R (corrección): ¿cómo funcionan en detalle?
- Timeline de versiones (desde marzo 2022): ¿qué muestra exactamente?
- Grafo de relaciones entre documentos: ¿cómo funciona?
- ¿Los textos consolidados tienen valor jurídico o son solo informativos?

#### 4. El repositorio CELLAR
- ¿Qué es exactamente CELLAR? Arquitectura, tecnología.
- ¿Cómo funciona el SPARQL endpoint?
- ¿Qué es la ontología CDM (Common Data Model)?
- ¿Qué se puede consultar realmente?
- Ejemplos de queries útiles.

#### 5. EU Law Tracker
- ¿Qué es exactamente? (lanzado abril 2024)
- ¿Quiénes participan? (Parlamento, Consejo, Comisión)
- ¿Qué funcionalidad ofrece realmente?
- ¿Está operativo o aún en desarrollo?

#### 6. Portales y sistemas de publicación
- Listar todos los portales relevantes:
  - EUR-Lex (eur-lex.europa.eu)
  - Legislative Observatory / OEIL (oeil.secure.europarl.europa.eu)
  - Council register of documents
  - EU Law Tracker
  - Cualquier otro
- ¿Qué ofrece cada uno? APIs? Formatos? Bulk data?

#### 7. Estándares y formatos técnicos
- **ELI (European Legislation Identifier)**: ¿cómo funciona? ¿Adopción real?
- **Akoma Ntoso**: ¿lo usa la UE? ¿En qué medida?
- **Formule**: el formato XML interno de EUR-Lex — ¿cómo funciona?
- ¿Qué formatos están disponibles para descarga? (HTML, PDF, XML, RDF)

#### 8. Realidad vs. aspiración
- Las instituciones son muy buenas para proponer modernización y nunca implementarla. Necesito que distingas claramente entre:
  - Lo que **efectivamente funciona hoy** y está en uso diario
  - Lo que **está en proceso** de implementación (con evidencia concreta)
  - Lo que **se anunció pero nunca se implementó** o quedó abandonado
  - Lo que **es solo una propuesta** sin implementación real

#### 9. Datos y acceso programático
- ¿Es posible hoy acceder programáticamente a los textos legislativos de la UE?
- ¿Qué APIs existen? ¿SPARQL? ¿REST? ¿Bulk data?
- ¿Cuáles son las limitaciones reales de acceso?

#### 10. Actores del ecosistema
- ¿Hay organizaciones trabajando en transparencia legislativa europea?
- ¿Proyectos de civic tech? (Ej: VoteWatch, etc.)

### Formato de respuesta

Responde en español. Sé exhaustivo. Prefiero un documento largo y detallado a uno superficial. Incluye URLs concretas cuando sea posible. Cuando no tengas certeza sobre algo, indícalo explícitamente en vez de inventar.
