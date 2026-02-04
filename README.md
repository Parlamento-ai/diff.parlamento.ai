# Diff by Parlamento.ai

Herramienta para generar **comparados legislativos** de forma automática. 

El problema: cuando se modifica una ley, no existe un formato estándar ni una herramienta pública que permita ver lado a lado qué cambió. Cada parlamento hace lo suyo, muchos solo publican PDFs, y el ciudadano queda a ciegas.

Nuestra propuesta es `AKN Diff`, una extensión del estándar [Akoma Ntoso](http://www.akomantoso.org/) que agrega un `changeSet` computable a los documentos legislativos, permitiendo reconstruir el comparado de cualquier modificación de forma automática.


## Changelog

---
**03/02/2026**

Viendo el buen resultado del proof of concept, rediseñamos toda la página para hacerla más accesible. Aún no lo publicamos abiertamente. El objetivo es crear un debate alrededor de estos temas.

También cambiamos el nombre a la extensión, ya no es AKN++ pero AKN Diff, porque se concentra únicamente en los cambios del comparado, nada más que eso. Y llamamos a este proyecto de research Diff by Parlamento.ai, de esa manera, englobamos todo bajo el nombre de "Diff".

Estamos agradablemente sorprendidos del formato Akoma Ntoso, se ve bastante completo y hecho con mucha dedicación para adaptarse a todos los tipos de parlamentos alrededor del mundo. 

Le vemos harto potencial. Incluso si el mundo decidió ignorarlo.

Se nos ocurrieron varias ideas que me gustaría explorar:
1. Tal vez los parlamentos deberían tener como base de datos un equivalente a S3 en vez de una DB relacional SQL, y que en ella se navigue como en la web, basada en links. Todo podía ser representado con AKN. En vez de tener `raws` y `columns` tiene archivos linkeados. Esto sería libremente accesible en lectura por el público. 
2. Podría usar el formato Git Para tener transparencia en las versiones y actualizaciones, en ese caso sería aún más simple que un S3 y sería una carpeta, con todo adentro. Se puede clonar por cualquiera. Serían básicamente archivos y carpetas, nada más.
3. Me gustaría hacer un visualizador de AKN online, algo donde podamos cargar estos archivos y poder visualizarlos de forma más bonita. Algo que englobe la totalidad del formato para poder explorar los tipos.
4. ¿Cómo podríamos convertir los datos actuales a este formato? Obviamente que con un trabajo manual monstruoso se podría hacer, pero eso no parece para nada viable. Habría que explorar workflows que combinen informática, inteligencia artificial y trabajo manual para reconstruir los datos.
5. Ver qué tan viable es AKN para ser el formato que englobe todo. A primera vista se ve bastante completo, pero tal vez, en realidad, es súper terco y difícil de trabajar y no se adapta a la realidad de los parlamentos. Explicaría el por qué nunca fue adaptado correctamente.

A raíz del punto 1 y 3 decidimos hacer un test de cómo podríamos hacer un visualizador en el cual puedo cliquear, como si fueran links, los distintos archivos AKN para poder navegar. El resultado es positivo: es agradable de navegar y el formato lo permite muy bien. Agregamos una nueva sección a la documentación para mostrar la versión renderizada y el XML bruto de cada uno de los tipos disponibles en AKN. 

![AKN Split View - Renderizado y XML](research/2026-02-03/xml-render-split.jpg)

Hicimos como si fuera un navegador web para ejemplificar aún más. En la imagen se puede ver la 'split view' en la que se ven el modo renderizado y el XML al mismo tiempo.

Siguiendo en la misma idea, nos preguntamos cómo podríamos crear una interfaz para cualquier persona que trabaje o siga el reto parlamentario 100 % basada en los formatos AKN. Es como si creáramos una plantilla para cualquier parlamento, poder simplemente copiar, pegar y, basada en AKN, todo podría estar conectado. Pienso esto para, en primer lugar, Parlamento.ai que necesita organización y queremos seguir varios parlamentos, pero también para crear un proyecto open source para cualquier parlamento que le gustaría tomar una interfaz ya trabajada y compatible con AKN.

Analizando cómo ver el problema, nos dimos cuenta de que no existía una forma ordenada de representar el orden del día. La solución que propone el formato es hacer un documento genérico, que podría ser un reporte, una conclusión o una citación, pero no tiene un formato específico para la citación.

A base de eso decidimos crear un tipo de "orden del día" para agregarlo a AKN, incluso si eso rompería el formato. Pero nos parece tan importante que tomamos la decisión de seguir con esa idea.

Investigamos un poco sobre por qué el formato no comprendía el concepto de "orden del día". La conclusión fue que AKN es un formato para archivar temas que son jurídicamente relevantes y que este concepto de citación vendría siendo algo de operación y no jurídico.

Nos pareció curioso. La situación parece algo esencial al debate legislativo.

Hicimos un primer test de cómo podría ser un tipo de citación creado desde cero. [En este documento está detallado todo con las motivaciones](/Users/lb/work/diff-law/research/2026-02-03/citation-type-proposal.md), se nos ocurrió hacer un formato que también intente ser mecánicamente compatible con CalDAV, tal vez es un poco 'gadget', pero muestra la motivación a una máxima estandarización y compatibilidad.  

El formato aún merece revisión. 

---
**01/02/2026**

Con lo satisfactorio que se veía en el Proof of Concept, nos preguntamos por qué no abarcar más con este nuevo formato: ¿Cómo podríamos agregar la votación de cada cambio en la interfaz? Esto agregaría una nueva capa de visibilidad y transparencia.

El formato propuesto sería agregarle a nuestro `changeSet` el resultado final del voto, con los nombres. La razón de esto es porque, de la misma manera que los cambios, la votación en el formato actual simplemente es mencionada, pero en ningún momento se computa con un resultado final.

En el archivo `DEBATE.xml` solamente hacen el guión como en una pieza de teatro en la que dice "Senador Pérez: a favor". Pero en ningún momento se registra el voto final en el documento (e.g. `a-favor: 5, en-contra: 7`). 

Agregamos estos campos a nuestro `AKN Diff` formato, dentro del `changeSet`:

```md
  ┌─────────────────┬───────────────────────────────────────────────────────────────┐
  │    Elemento     │                           Propósito                           │
  ├─────────────────┼───────────────────────────────────────────────────────────────┤
  │ akndiff:vote    │ Consolida el resultado de la votación                         │
  ├─────────────────┼───────────────────────────────────────────────────────────────┤
  │ date            │ Cuándo se votó                                                │
  ├─────────────────┼───────────────────────────────────────────────────────────────┤
  │ result          │ approved, rejected, withdrawn, inadmissible, pending          │
  ├─────────────────┼───────────────────────────────────────────────────────────────┤
  │ source          │ Referencia al documento debate donde está el detalle completo │
  ├─────────────────┼───────────────────────────────────────────────────────────────┤
  │ akndiff:for     │ Lista de votantes a favor                                     │
  ├─────────────────┼───────────────────────────────────────────────────────────────┤
  │ akndiff:against │ Lista de votantes en contra                                   │
  ├─────────────────┼───────────────────────────────────────────────────────────────┤
  │ akndiff:abstain │ Lista de abstenciones (vacío si no hay)                       │
  ├─────────────────┼───────────────────────────────────────────────────────────────┤
  │ akndiff:voter   │ Cada persona, con href (ID único) y showAs (nombre legible)   │
  └─────────────────┴───────────────────────────────────────────────────────────────┘
```

El resultado en la interfaz es bastante atractivo:

![AKN Diff Votaciones](research/2026-02-01/akndiff-votes.png)


---
**31/01/2026**

Después de los descubrimientos bien pesimistas de ayer, decidimos irnos más en profundidad en este formato maravilla llamado *Akoma Ntoso* (AKN).

Es un formato bastante grande que engloba el ritual legislativo prácticamente por completo, basado en XML, siendo actualizado por un organismo de buena reputación en estándares.

Pero tiene dos problemas.

El primero es que nunca fue realmente adoptado y muchos países optaron por sus propias implementaciones basadas en XML.

El segundo problema es que, si bien es muy completo, no tiene el concepto de un comparado, solamente comprende el `AMENDMENT` que básicamente es el cambio escrito en lenguaje natural, pero que no es computable para generar un comparado de forma automática.

La razón por la cual no tiene un comparado como un tipo nativo es que, en realidad, el comparado no tiene lugar oficial en el ritual legislativo. Lo que cuenta es el `AMENDMENT`, y luego cada uno calcula el comparado por su lado, y tal vez esa es la raíz del problema.

Aquí un resumen que ejemplifica el problema:
```md
  La analogía: una receta de cocina

  Imagina que tienes una receta de cocina publicada en un libro (la ley vigente). Alguien propone cambiarla (el proyecto de ley). El proceso sería:

  1. La receta original (en el libro)     → ACT
     "Agregar 100g de azúcar"

  2. Alguien dice "hay que cambiarla"     → BILL
     "Propongo reemplazar 100g por 50g"

  3. La comisión de cocina la discute     → DEBATE
     "Juan dijo que 50g es muy poco..."

  4. Votan y aprueban con cambios         → AMENDMENT
     "Mejor que sean 75g"

  5. La receta actualizada (nuevo libro)  → ACT (nueva versión)
     "Agregar 75g de azúcar"

  El comparado sería una hoja que pone lado a lado:
  ┌────────────────────────┬───────────────────────┐
  │    Receta original     │     Receta nueva      │
  ├────────────────────────┼───────────────────────┤
  │ Agregar 100g de azúcar │ Agregar 75g de azúcar │
  └────────────────────────┴───────────────────────┘
  Esa hoja no existe como tipo de documento en AKN. Es algo que tú produces para que la gente entienda qué cambió.
```

Lo que se nos ocurrió es aumentar el formato AKN Para poder agregar los cambios computados. La primera idea fue crear un nuevo tipo `RED-LINE` dónde vivirían los comparados. La segunda idea que vino, que nos pareció mucho mejor, fue aumentar cada uno de los tipos para agregarles la manera de representar el cambio computado.

Decidimos llamarlo `AKN Diff`.

Este es un ejemplo del `AMENDMENT`, pero con el nuevo campo `changeSet`:

```xml
  <amendment>
    <!-- El "mensaje del commit" (lo que ya existe en AKN) -->
    <amendmentBody>
      <amendmentContent>
        <p>Reemplázase en el artículo 1 la frase "100g de azúcar"
           por "75g de azúcar"</p>
      </amendmentContent>
      <amendmentJustification>
        <p>Porque 100g es demasiado dulce.</p>
      </amendmentJustification>
    </amendmentBody>

    <!-- El "diff" (lo que NO existe en AKN y tú propones agregar) -->
    <changeSet
      base="/receta/v2"
      result="/receta/v3">
      <articleChange article="art_1">
        <old>Agregar 100g de azúcar</old>
        <new>Agregar 75g de azúcar</new>
      </articleChange>
    </changeSet>
  </amendment>
```

Este campo se le agregaría a cualquier tipo que pueda modificar la ley textualmente, como, por ejemplo el `BILL`.

Con este sistema podemos cargar un `AMENDMENT`, gracias a los links volver al inicio (`ACT`), y volver a construir todos los cambios computados para saber el comparado actual de forma automática.

En teoría, debería poder funcionar; si bien hay casos en los que se juntan varios cambios de una y se cambian de una forma un poco opaca. También está el caso donde deciden reemplazar toda una sección por una nueva o deciden reordenar los números de un artículo. El resultado no sería el más bonito o más práctico, pero sería algo.

Para esos casos, se podría complejizar un poco más el formato, agregando cambios por línea y cosas de ese estilo:

```xml
  <articleChange old="art_24" new="art_22" type="renumber+modify">
    <old>...</old>
    <new>...</new>
  </articleChange>
  <articleChange old="art_25" type="repeal"/>
  <articleChange new="art_23" type="insert"/>
```

A partir de ese formato, construimos un proof of concept que parece funcionar bastante bien.

![AKN Diff Proof of Concept](research/2026-01-31/akndiff-v0.1.png)

Realmente nos permite hacer un seguimiento mucho más agradable y comprensible. Ahora el ejemplo es una simple receta, no una verdadera ley. Faltaría ver cómo funciona con más datos.


---
**30/01/2026**

Lo primero que buscamos es explorar lo existente. Con un simple deep research ([primera búsqueda](research/2026-01-30/primera-busqueda.md)) vimos que hay muchas cosas existentes y que varían bastante de país en país. Decidimos hacer una búsqueda para cada país para tener mucho más detalle sobre las propuestas e implementaciones ya vigentes (ver [research por país](research/2026-01-30/country)).

Después de analizarlas, llegamos a una conclusión bastante similar a la que generó la AI:
> La conclusión transversal: **ningún país ofrece comparados legislativos en formato estructurado y legible por máquina**. Incluso UK y USA, que tienen la mejor infraestructura, mantienen sus herramientas de comparación como internas o limitadas a leyes ya promulgadas. El gap que motivó este proyecto es real y universal.

La segunda mala noticia después de esta primera búsqueda, es que **muchas herramientas no están abiertas al público**. ¿Tal vez son propuestas que quedaron en el aire y nunca se implementaron? O tal vez sí están bien implementadas, pero solo los miembros de los congresos tienen acceso y, por ende, no podemos verificar y probar esas implementaciones. Si al final del proceso el público solamente tiene acceso a un PDF, consideraríamos que no está implementado.

El tercer aprendizaje fue la existencia del formato `AKN/LegalDocML`, lo cual **parece ser exactamente la respuesta al problema**. Un formato universal basado en `XML` para el mundo legislativo. Pero prácticamente ningún Parlamento lo ha implementado correctamente, Y aun peor, cada uno implemento su propia version basada en `XML` alejándose del estándar.
