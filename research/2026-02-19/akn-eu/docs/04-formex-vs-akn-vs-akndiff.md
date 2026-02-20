# Formex, AKN, AKN4EU y AKN Diff: diferencias reales y viabilidad para EU

**Fecha:** 19/02/2026
**Contexto:** Evaluacion de los formatos XML legislativos en el contexto de la UE para decidir sobre que base construir el diff de parlamento.ai.

---

## 1. Diferencias estructurales reales (mismo articulo, tres formatos)

### Formex 4 (lo que CELLAR entrega)

```xml
<ARTICLE IDENTIFIER="001.001">
  <TI><STI>Article 1</STI><STI>Subject matter</STI></TI>
  <PARAG>
    <ALINEA>This Regulation lays down harmonised rules on AI.</ALINEA>
  </PARAG>
  <PARAG>
    <NP><NO.P>(a)</NO.P><TXT>placing on the market</TXT></NP>
    <NP><NO.P>(b)</NO.P><TXT>putting into service</TXT></NP>
  </PARAG>
</ARTICLE>
```

- Tags propietarios de la OP (~260). No namespace, no FRBR, no eIds.
- `IDENTIFIER` es un numero secuencial interno, no una URI persistente.
- No hay forma de referenciar este articulo desde otro documento de forma estandar.

### AKN4EU 4.2 (lo que LEOS produce internamente)

```xml
<article eId="art_1">
  <num>Article 1</num>
  <heading>Subject matter</heading>
  <paragraph eId="art_1__para_1">
    <content><p>This Regulation lays down harmonised rules on AI.</p></content>
  </paragraph>
  <paragraph eId="art_1__para_2">
    <list>
      <point eId="art_1__para_2__point_a"><num>(a)</num><content><p>placing on the market</p></content></point>
      <point eId="art_1__para_2__point_b"><num>(b)</num><content><p>putting into service</p></content></point>
    </list>
  </paragraph>
</article>
```

- AKN 3.0 con restricciones. eIds unicos por elemento. FRBR URIs en `<meta>`.
- Cada elemento es direccionable (`art_1__para_2__point_b`).
- Namespace propio `akn4eu` solo para metadata de version del profile en `<preservation>`.

### AKN Diff (nuestra implementacion)

```xml
<!-- El acto en si es identico a AKN/AKN4EU. La diferencia esta en el changeSet: -->
<doc name="changeSet" xmlns:akndiff="http://parlamento.ai/akndiff/1.0">
  <akndiff:changeSet base="/akn/eu/bill/com/2021-04-21/206" result="/akn/eu/act/eu/2024-06-13/1689">
    <akndiff:articleChange type="substitute" articleId="art_1">
      <akndiff:old><p>...texto original de la propuesta...</p></akndiff:old>
      <akndiff:new><p>...texto final del reglamento...</p></akndiff:new>
    </akndiff:articleChange>
    <akndiff:articleChange type="insert" articleId="art_1a">
      <akndiff:new><p>...articulo nuevo que no existia...</p></akndiff:new>
    </akndiff:articleChange>
  </akndiff:changeSet>
  <akndiff:vote result="approved" date="2024-03-13">
    <akndiff:voter name="MEP Name" group="S&amp;D" vote="for"/>
  </akndiff:vote>
</doc>
```

- Los documentos base (`act`, `bill`) son AKN 3.0 puro, compatibles con AKN4EU.
- Lo que agregamos es la **capa de proceso**: changeSets, votaciones, word diffs.
- Namespace separado `akndiff` que coexiste con `akn4eu` sin conflicto.

---

## 2. Que resuelve cada formato (y que no)

| Necesidad concreta | Formex | AKN 3.0 | AKN4EU | AKN Diff |
|---|---|---|---|---|
| Representar un reglamento con su estructura | Si | Si | Si | Si |
| Representar una propuesta COM | No (HTTP 404) | Si | Si (`<bill>`) | Si |
| Identificar un articulo de forma unica y persistente | No (IDs internos) | Si (eId) | Si (eId + ELI) | Si |
| Referenciar un documento desde otro | No nativo | Si (FRBR) | Si (FRBR + ELI) | Si |
| Expresar "art_1 cambio de X a Y entre propuesta y ley final" | No | No | No | Si |
| Expresar "se inserto art_1a que no existia" | No | No | No | Si |
| Registrar "523 a favor, 46 en contra, 49 abstenciones" | No | No | No | Si |
| Registrar voto nominal por MEP | No | No | No | Si |
| Encadenar propuesta → enmiendas EP → ley final como timeline | No | No | No | Si |
| Funcionar para Chile, Espana, Peru ademas de EU | No | Si | No (solo EU) | Si |

---

## 3. Relacion entre los formatos (no compiten)

```
Formex ──(conversion mecanica)──→ AKN 3.0 ──(compatible)──→ AKN4EU
                                     │
                                     └──(extension namespace)──→ AKN Diff
```

- **Formex → AKN**: conversion 1:1 para ~90% de tags. 700 LOC, sin NLP, sin heuristicas. Confirmado con PoCs reales (AI Act, DSA, SFDR).
- **AKN ↔ AKN4EU**: AKN4EU ES AKN 3.0 con restricciones. Todo doc AKN4EU es AKN 3.0 valido. La diferencia es que AKN4EU exige ELI URIs, EU Authority Lists, y marca la version del profile en `<preservation>`.
- **AKN + AKN Diff**: AKN Diff agrega su namespace encima. Un doc puede ser AKN4EU-compliant Y tener extensiones akndiff simultaneamente.

### La UE internamente ya tiene un converter (FMX2AK)

La OP tiene el proyecto FMX2AK que convierte Formex a AKN4EU. No es publico. LEOS produce AKN4EU nativamente para documentos nuevos. Pero CELLAR sigue sirviendo solo Formex (y XHTML). No hay fecha para que AKN aparezca en CELLAR.

---

## 4. Viabilidad: construir sobre Formex directo vs sobre AKN

### Opcion A: Formex como base (sin pasar por AKN)

Significaria que nuestro diff engine trabaje directamente con tags Formex (`ARTICLE`, `PARAG`, `ALINEA`).

**Problemas:**
- Formex no tiene eIds. Necesitariamos inventar un sistema de identificacion para poder decir "este ARTICLE es el mismo que este otro". Los `IDENTIFIER` de Formex son posicionales, no semanticos.
- Sin namespace extensible, las anotaciones de diff (old/new, vote, changeSet) tendrian que ir en un formato completamente distinto al documento base, o inventar un wrapper.
- Solo funciona para EU. Para Chile/Espana/Peru tendriamos otro formato base, duplicando toda la logica de diff.
- Las propuestas COM no tienen Formex — tendriamos XHTML + Formex como inputs distintos sin formato comun.

### Opcion B: AKN como base (lo que hacemos hoy)

Formex es solo input. Se convierte a AKN. El diff engine solo entiende AKN.

**Ventajas verificadas:**
- Un solo formato para EU, Chile, Espana, Peru. Un solo diff engine.
- eIds dan identificacion unica por elemento, necesaria para el diff.
- Namespace extensible permite akndiff sin romper compatibilidad AKN/AKN4EU.
- Si CELLAR empieza a servir AKN4EU manana, eliminamos el paso de conversion y todo sigue funcionando.
- La conversion Formex→AKN es trivial (mecanica, sin perdida de informacion).

---

## 5. Donde AKN4EU se queda corto para nosotros

AKN4EU es un buen formato para documentos individuales pero no resuelve el problema que nosotros resolvemos:

1. **No tiene changeSets.** AKN4EU tiene `<activeModifications>` con `<textualMod>` que dice "este acto modifica el art 5 del Reg X". Pero es una referencia, no un diff computable. No dice QUE cambio, solo que ALGO cambio.

2. **No tiene votaciones.** No hay forma de registrar quien voto que en AKN4EU.

3. **No tiene enmiendas como docs separados.** AKN4EU solo define `<act>` y `<bill>`. Las enmiendas del Parlamento Europeo no tienen representacion en AKN4EU.

4. **No tiene timeline del proceso.** No hay forma de encadenar propuesta → enmienda EP → trilogue → acto final como una secuencia de documentos relacionados.

Estas carencias no son un defecto de AKN4EU — estan fuera de su scope declarado. AKN4EU cubre productos finales, no proceso. AKN Diff cubre proceso.

---

## 6. Conclusion

Formex es la fuente de datos para la UE y va a seguir siendolo por anos. AKN4EU es la direccion oficial de la UE pero no esta disponible por API y no cubre proceso legislativo. AKN Diff es nuestra capa sobre AKN 3.0 que agrega lo que ni Formex ni AKN4EU resuelven: diffs computables, votaciones, trazabilidad del proceso completo.

La arquitectura actual (Formex como input → AKN como formato comun → AKN Diff como extension) es la correcta. No hay razon para trabajar directo sobre Formex ni para esperar a que AKN4EU aparezca en CELLAR. Lo que tenemos funciona hoy, es compatible con AKN4EU si la UE lo adopta en CELLAR, y escala a otras jurisdicciones sin cambios.
