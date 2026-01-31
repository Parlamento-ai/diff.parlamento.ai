# Sistema de comparados legislativos en Brasil: guía técnica completa

Brasil posee uno de los ecosistemas de datos legislativos más desarrollados de América Latina, con el sistema **LexML** como pieza central y APIs públicas bien documentadas de Câmara y Senado. Sin embargo, existe una brecha significativa entre la infraestructura de identificadores/metadatos (que funciona) y la publicación de documentos XML estructurados nativos (mayormente aspiracional). Los "quadros comparativos" son documentos PDF elaborados manualmente por equipos técnicos del Congreso, sin API disponible para generación automática.

## El quadro comparativo es el término estándar en Brasil

El término oficial predominante es **"quadro comparativo"** para referirse a documentos que comparan versiones de textos legislativos. Estos documentos son elaborados por el **Serviço de Redação da Secretaria-Geral da Mesa do Senado Federal** y la **Seção de Edição de Textos da Consultoria Legislativa da Câmara dos Deputados**.

No existe una definición formal explícita en los Regimentos Internos de ninguna de las cámaras. El término aparece como práctica institucionalizada consuetudinaria, no como requisito normativo. Otros términos menos frecuentes incluyen "texto comparativo" y "análise comparativa".

Los quadros comparativos se producen principalmente en tres momentos: durante la publicación de Medidas Provisórias en el DOU, en los pareceres de Comissões Mistas para MPs, y cuando hay alteraciones sustanciales en PECs o proyectos que modifican legislación vigente. **No son legalmente obligatorios** pero constituyen práctica establecida para proposiciones que modifican legislación existente.

El formato típico presenta estructura en columnas: Legislação Vigente | Proposta Original | Substitutivo/Texto Final. Las convenciones de marcación incluyen texto tachado para supresiones, **negrita** para agregados, y la notación "(NR)" para Nueva Redacción. Ejemplos reales están disponibles en:
- https://legis.senado.leg.br/sdleg-getter/documento?dm=4415659 (PEC 20/2013)
- https://www2.camara.leg.br/atividade-legislativa/comissoes/comissoes-temporarias/especiais/54a-legislatura/8046-10-codigo-de-processo-civil/arquivos/quadro-comparativo-do-cpc-atual-e-pl-8.046-11

## El proceso legislativo brasileño y sus etapas de comparación

Un Projeto de Lei (PL) atraviesa un flujo completo desde la apresentação hasta la publicación en el Diário Oficial da União. La casa iniciadora es generalmente la Câmara dos Deputados, excepto cuando el proyecto es presentado por senador o comisión del Senado. El proyecto se distribuye a hasta **3 comissões de mérito**, donde se designa un relator que emite parecer tras analizar emendas.

La tramitação conclusiva aplica a la mayoría de proyectos (no pasan por Plenario), mientras que van obligatoriamente al Plenário los proyectos de lei complementar, códigos, iniciativa popular, régimen de urgencia, o cuando hay pareceres divergentes. Tras aprobación en la casa de origen, el proyecto va a la câmara revisora; si esta lo altera, retorna para análisis solo de las alteraciones. El Presidente tiene **15 días útiles** para sancionar o vetar (parcial o totalmente). La documentación completa del proceso está en https://www.camara.leg.br/entenda-o-processo-legislativo/.

Las **Medidas Provisórias** tienen un flujo especial regulado por el Art. 62 de la Constituição Federal y la Resolução do Congresso Nacional nº 1 de 2002. Son editadas por el Presidente en situaciones de "relevância e urgência" con **fuerza de ley desde la edición**. Tienen vigencia inicial de 60 días prorrogable por 60 más, y después del día 45 trancan la pauta del Plenário. El quadro comparativo se publica junto con la MP en el DOU y posteriormente con el parecer de la Comissão Mista (12 Senadores + 12 Deputados). La tramitación detallada está disponible en https://www.congressonacional.leg.br/materias/medidas-provisorias/entenda-a-tramitacao-da-medida-provisoria.

Las **Propostas de Emenda à Constituição (PECs)** requieren firma de mínimo 1/3 de diputados (171) o senadores (27), pasan por CCJC para admisibilidad, luego Comissão Especial con hasta 40 sessões para votar, y finalmente **dos turnos** de votación en Plenário con aprobación de **3/5 de los votos**. No requieren sanción presidencial. Los quadros comparativos para PECs típicamente presentan tres columnas: Constituição Federal | PEC original | PEC alterada.

## LexML es el sistema estrella de identificación legislativa

LexML Brasil es un proyecto de gobierno electrónico lanzado el **30 de junio de 2009**, coordinado por el Senado Federal a través de PRODASEN e Interlegis. Integra información legislativa y jurídica de los tres poderes en los tres niveles de gobierno. Su arquitectura se divide en LexML 1.0 (operativo: motor de búsqueda federada, resolver URN, linking de citas) y LexML 2.0 (en desarrollo desde 2010: herramientas open source para XML estructurado).

El acervo actual contiene más de **10 millones de documentos** con aproximadamente **20+ millones de links**. Los principales proveedores incluyen: Tribunal Superior do Trabalho (3.37M documentos), TRT 3ª Região (1.67M), STJ (827K), Senado Federal (291K), Câmara dos Deputados (258K), y diversas Assembleias Legislativas estaduales. La página de descripción del acervo muestra última actualización **29/01/2026 14:12**, confirmando que el sistema está activo.

El stack tecnológico incluye **OAI-PMH** para intercambio de metadatos, **URN LEX** para identificadores (RFC 9676 finalizado en mayo 2025), **LexML-BR XML Schema** derivado de Akoma Ntoso, y **API SRU** para búsquedas. El portal está operativo en https://www.lexml.gov.br/ y la documentación técnica en https://projeto.lexml.gov.br/.

El **URN LEX** sigue la sintaxis `urn:lex:{jurisdicción}:{autoridad}:{tipo}:{fecha};{número}`. Ejemplos funcionales:
- Constitución Federal: `urn:lex:br:federal:constituicao:1988-10-05;1988`
- Código Civil: `urn:lex:br:federal:lei:2002-01-10;10406`
- Lei Maria da Penha: `urn:lex:br:federal:lei:2006-08-07;11340`

El servicio de resolución de URNs está **operativo** en https://www.lexml.gov.br/urn/ – añadiendo el URN completo a esta URL se obtiene una página de metadatos con enlaces a las fuentes originales.

## La relación con Akoma Ntoso es de derivación, no interoperabilidad directa

LexML-BR XML Schema fue explícitamente **derivado de Akoma Ntoso** según la documentación oficial (Parte 3): "Como o XML Schema do LexML foi derivado do XML Schema do Projeto AKOMA NTOSO, foram preservados a forma de organização e alguns comentários originais."

La diferencia crítica es el idioma de los elementos XML: LexML usa portugués (`<Artigo>`, `<Livro>`, `<Parte>`) mientras Akoma Ntoso usa inglés (`<article>`, `<book>`, `<part>`). El schema está adaptado a la LC 95/1998 (técnica legislativa brasileña). Según la Universidad de Bologna: "This has been a frequent request of national governments across the globe, however we do not consider it a customization of AKN, but rather the creation of a new vocabulary that heavily affects existing tools, XSLT, applications and interoperability."

**No existen herramientas oficiales** de conversión bidireccional LexML-BR ↔ Akoma Ntoso disponibles públicamente. El mapping conceptual existe pero la conversión automatizada no está implementada. Tampoco hay implementación oficial de mapping a ELI (European Legislation Identifier), aunque investigación académica reciente (2025) trabaja en ello.

El schema XSD está publicado en https://projeto.lexml.gov.br/esquemas/oai_lexml.xsd y la documentación completa en https://projeto.lexml.gov.br/documentacao/Parte-3-XML-Schema.pdf (última actualización abril 2016). Los vocabularios controlados en RDF están disponibles en https://github.com/lexml/lexml-vocabulary.

## El servicio de linking automático funciona vía Docker

El **lexml-linker** es un parser en Haskell que identifica referencias a normas legislativas en texto y genera automáticamente las URNs correspondientes. El repositorio está en https://github.com/lexml/lexml-linker y se puede ejecutar vía Docker:

```bash
docker run -i --rm lexmlbr/lexml-linker:latest /usr/bin/linkertool
echo 'Os incisos I e III do art. 8o da Lei n.o. 12.527, de 18 de novembro de 2011' | linker
```

Soporta múltiples formatos de entrada/salida: texto plano a lista de URNs, texto a HTML con links, XML/HTML a XML decorado con URNs. El output XML incluye elementos `<Remissao>` con atributos `xlink:href` conteniendo las URNs detectadas.

## Los portales y APIs ofrecen acceso desigual

La **Câmara dos Deputados** tiene la API más completa y mejor documentada. Datos Abertos (https://dadosabertos.camara.leg.br) ofrece API REST sin autenticación, documentación Swagger en https://dadosabertos.camara.leg.br/swagger/api.html, formatos JSON/XML/CSV/XLSX/ODS, y bulk data descargable. Los endpoints cubren deputados, proposições, votações, eventos, órgãos, legislaturas desde 1827. El repositorio GitHub está en https://github.com/CamaraDosDeputados/dados-abertos.

El **Senado Federal** ofrece API REST documentada en https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html con endpoints para senadores, materias, legislación, comisiones, votaciones. El catálogo completo está en https://www12.senado.leg.br/dados-abertos/catalogo-de-dados-abertos.

El portal **normas.leg.br** es una herramienta relativamente nueva (~2023) que ofrece **timeline de versiones** de la Constitución y algunas leyes federales. Permite consultar la versión vigente en cualquier fecha histórica con anotaciones de compilación. El acceso programático usa patrones URN: `https://normas.leg.br/?urn=urn:lex:br:federal:constituicao:1988-10-05;1988@{fecha}~texto;pt$text-html`.

El portal **Planalto** (https://www4.planalto.gov.br/legislacao) **no tiene API oficial** – requiere web scraping. Las URLs no son persistentes.

El **Diário Oficial da União** ofrece bulk data XML mensual en https://in.gov.br/acesso-a-informacao/dados-abertos/base-de-dados, pero **no hay API pública de consulta**. La herramienta comunitaria Ro-DOU (https://gestaogovbr.github.io/Ro-dou/) y Base dos Dados (https://basedosdados.org) proporcionan alternativas.

**Limitación crítica**: No existe API para generar quadros comparativos automáticamente. Son documentos manuales elaborados durante la tramitación.

## Los organismos clave y sus sistemas tecnológicos

**PRODASEN** (Secretaria de Tecnologia da Informação do Senado), fundado en 1972, es el órgano de TI del Senado con más de 50 años de historia. Creó la primera página web de una casa legislativa en América del Sur, dio soporte a la Asamblea Constituyente de 1988, y desarrolló el Sistema de Deliberación Remota durante la pandemia.

**DITEC** (Departamento de Inovação e Tecnologia da Informação) es el equivalente para la Câmara, específicamente la **SISEI** (Seção de Integração a Serviços Externos de Interação Social) mantiene el servicio de Datos Abiertos.

**Interlegis/ILB** (Instituto Legislativo Brasileiro) es un programa crucial para casas legislativas municipales y estaduales, ejecutado por el Senado desde 1997. Ofrece productos gratuitos: Portal Modelo (CMS usado por +1.500 cámaras), **SAPL** (Sistema de Apoio ao Processo Legislativo), dominio .leg.br, e-mail legislativo. Todo en software libre GPL.

La **Imprensa Nacional**, subordinada a la Casa Civil, es responsable del DOU. Opera el sistema **INCom** para envío electrónico de materias y verifica autenticidad de publicaciones.

Las **Consultorias Legislativas** de ambas cámaras producen los quadros comparativos. La Câmara tiene 22 áreas temáticas especializadas (https://www2.camara.leg.br/a-camara/estruturaadm/consultoria-geral/consultoria-legislativa); el Senado opera a través de la Consultoria Legislativa (código 49) y CONORF para asuntos presupuestarios.

## Lo que realmente funciona hoy versus lo aspiracional

Esta distinción es crítica para planificación técnica:

**Funciona hoy (operativo y usado diariamente)**: Portal LexML como buscador unificado, URN Resolver (https://www.lexml.gov.br/urn/), API SRU para metadatos, normas.leg.br con timeline de versiones, JSON-LD con Schema.org/Legislation en páginas del Senado (Brasil fue el primer país en implementar esto para normas de jerarquía superior), APIs REST de Câmara y Senado.

**En implementación activa (evidencia GitHub 2024-2026)**: lexml-eta (Editor de Textos Articulados) con commits hasta enero 2026, lexml-parser-projeto-lei, lexml-urn-formatter, lexml-emenda (web component para enmiendas), eta-backend-services. El proyecto en GitHub tiene ~62 repositorios activos.

**Parcialmente implementado (existe con limitaciones)**: Schema XML documentado pero publicación real de documentos LexML XML es limitada – la mayoría de textos son HTML/PDF. Versiones históricas disponibles solo para algunas normas (Constitución, códigos principales) en normas.leg.br, no universal. Bulk data XML vía Kaggle (https://www.kaggle.com/datasets/lexmlacervo/lexml-brasil-acervo) pero no oficial completo.

**Abandonado o solo propuesta**: LexML 2.0 (adopción amplia de XML nativo) anunciado en 2010, nunca completamente implementado. Conversión automática masiva a XML: propuesta no materializada. Interoperabilidad regional latinoamericana: solo propuesta sin evidencia de adopción de URN LEX por otros países.

## El ecosistema civic tech brasileño está vivo

**Querido Diário** es el proyecto más activo (https://queridodiario.ok.org.br) con **1,895 commits, 1,300+ stars, 438 forks** en GitHub. Libera diarios oficiales municipales de PDFs cerrados a texto abierto, cubre +350 municipios con robôs para +2,200 municipios. Tiene API pública documentada en https://queridodiario.ok.org.br/api/docs.

**Parlametria** (desarrollado por UFCG + OKBR + Dado Capital) combina Perfil Parlamentar (cruzamiento de bases sobre parlamentarios) y Leg.go (proposiciones, "temperatura" de tramitación). Usa las APIs de Câmara y Senado con machine learning. Información en https://ok.org.br/projetos/parlametria/.

**Operação Serenata de Amor** está en mantenimiento con actualizaciones poco frecuentes. Su IA Rosie detectó +8,000 reembolsos sospechosos (~700,000 USD) y +600 denuncias. El equipo migró a Querido Diário.

**Radar Legislativo** (https://www.radarlegislativo.org) monitorea proyectos sobre internet/tecnologías digitales con filtros por tramitación, grafo interactivo de PLs/autores, y bot en Telegram.

Las organizaciones clave incluyen **Open Knowledge Brasil** (https://ok.org.br) como articulador central, **Transparência Brasil** con el proyecto Achados e Pedidos (+350,000 pedidos de LAI), **ABRAJI** coordinando el Fórum de Direito de Acesso (28 organizaciones), y la **RAC** (Rede de Advocacy Colaborativo) con ~60 organizaciones de sociedad civil.

Brasil es **co-fundador de la Open Government Partnership** y en el 4º Plan de Acción (2018) el Congreso asumió compromiso de incrementar participación en proceso legislativo, incluyendo textos articulados en formato LexML. No encontré evidencia específica de participación activa en un "Hub Latinoamericano de Interoperabilidad Parlamentaria" como tal, aunque Brasil participa en iniciativas regionales a través de ILDA y OGP.

## Recomendaciones técnicas para desarrollo

Para acceso programático a proposiciones y votaciones, usar la API de Câmara (https://dadosabertos.camara.leg.br/api/v2/). Para legislación y normas jurídicas, usar la API del Senado (https://legis.senado.leg.br/dadosabertos/). Para identificadores persistentes y búsqueda federada, usar LexML con URN LEX. Para Planalto se requiere scraping – no hay alternativa oficial. Para DOU, descargar bulk data mensual o usar Base dos Dados.

El wrapper Python py-lexml-acervo (https://github.com/netoferraz/py-lexml-acervo) facilita consultas al acervo. El lexml-linker vía Docker permite detección automática de remisiones legislativas en texto.

**Stack técnico recomendado**: URN LEX para identificadores (estable), API SRU + JSON-LD Schema.org para metadatos, scraping HTML para texto completo de Planalto/Senado, lexml-linker para detección de remisiones, LexML XML Schema si se genera XML propio.

## Conclusión: infraestructura sólida de identificación, XML estructurado aspiracional

El ecosistema LexML Brasil ofrece una infraestructura sólida de identificación (URN LEX finalizado como RFC 9676 en 2025) y metadatos (API SRU, JSON-LD), pero la promesa de documentos XML estructurados nativos permanece mayormente aspiracional 17 años después del lanzamiento. Los quadros comparativos siguen siendo documentos PDF elaborados manualmente sin API para generación automática.

Para parlamento.ai, la estrategia práctica implica consumir metadatos estructurados de las APIs oficiales, implementar parsing propio de HTML para textos completos, usar URN LEX como identificadores canónicos, y considerar el modelo de normas.leg.br (timeline de versiones con visualización estructurada pero no XML nativo) como referencia de funcionalidad alcanzable. El ecosistema civic tech brasileño (especialmente Querido Diário y Parlametria) ofrece patrones probados de extracción y estructuración de datos legislativos que pueden informar el desarrollo.