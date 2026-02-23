# amendment — Reporte de Factibilidad EE.UU.

> Enmiendas a bills durante el proceso legislativo (en comisión o en piso) y los roll call votes asociados. En EE.UU., las enmiendas son documentos separados con su propia numeración (H.Amdt., S.Amdt.) y los votos se registran en XML estructurado. Este tipo alimenta los `changeSet` y `vote` del AKN Diff.

## Fuentes de datos

| # | Fuente | URL | Formato | Campos utilizados | Dificultad |
|---|--------|-----|---------|-------------------|------------|
| 1 | Congress.gov API — amendments | [api.congress.gov/v3/amendment/](https://api.congress.gov/) | JSON | Metadatos: sponsor, purpose, actions, amended bill | Mecánica simple |
| 2 | Senate.gov — Roll Call Votes | [senate.gov/.../roll_call_votes/](https://www.senate.gov/legislative/LIS/roll_call_lists/vote_menu_119_1.htm) | XML | Voto nominal: yeas, nays, not_voting, por senador | Mecánica simple |
| 3 | House Clerk — Roll Call Votes | [clerk.house.gov/evs/](https://clerk.house.gov/Votes) | XML | Voto nominal: yea, nay, present, not voting, por representante | Mecánica simple |
| 4 | Congress.gov API — roll call (beta) | [api.congress.gov/v3/house-roll-call-vote/](https://blogs.loc.gov/law/2025/05/introducing-house-roll-call-votes-in-the-congress-gov-api/) | JSON | Votos House (118th Congress+ / 2023+) | Mecánica simple |
| 5 | GovInfo — BILLS (versiones pre/post) | [api.govinfo.gov/packages/BILLS-*](https://api.govinfo.gov/docs/) | XML | Texto del bill antes y después de enmiendas | Mecánica compleja |

**Escala de dificultad**: 0 (Ya AKN) · Mecánica simple · Mecánica compleja · AI simple · AI + Humano · No disponible

## Métricas

### Cobertura del rito legislativo

| Dato del rito | ¿Disponible? | ¿Utilizado? | Formato origen |
|---------------|--------------|-------------|----------------|
| Votos nominales Senado | Sí | Sí | Senate.gov XML (sin auth) |
| Votos nominales House | Sí | Sí | House Clerk XML (sin auth) |
| Nombre/partido/estado del votante | Sí | Sí | Vote XML |
| Resultado de la votación | Sí | Sí | Vote XML |
| Texto de la enmienda | Parcial | Parcial | Congress.gov API (description + links) |
| Sponsor de la enmienda | Sí | Sí | Congress.gov API |
| Bill afectado | Sí | Sí | Congress.gov API |
| Versiones pre/post enmienda | Sí | Sí | GovInfo BILLS (IH→RH, RH→EH, etc.) |
| Votos en comisión | No (estructurado) | No | Solo en committee reports (texto) |

- **Datos disponibles pero no aprovechados**: Votos en comisión (no estructurados), texto detallado de enmiendas rechazadas
- **Cobertura**: ~75%

### Completitud AKN

| Campo AKN | ¿Completado? | Fuente |
|-----------|--------------|--------|
| `<amendment>` type | Sí | Congress.gov API |
| FRBR URIs | Sí | Amendment number + Congress |
| `<changeSet>` base/result | Sí | Versiones pre/post del bill (GovInfo) |
| `<articleChange>` type | Parcial | Diff entre versiones XML |
| `<vote>` result | Sí | Senate/House XML |
| `<vote>` individual votes | Sí | Senate/House XML |
| TLCPerson (votantes) | Sí | congress-legislators YAML |
| `<vote>` counts (yea/nay) | Sí | Vote XML |

- **Completitud**: ~70%

## Estructura de votos XML

### Senate Roll Call Vote

```xml
<roll_call_vote>
  <congress>119</congress>
  <session>1</session>
  <congress_year>2025</congress_year>
  <vote_number>42</vote_number>
  <vote_date>February 15, 2025</vote_date>
  <vote_question_text>On the Amendment (Smith Amdt. No. 123)</vote_question_text>
  <vote_result>Amendment Agreed to</vote_result>
  <vote_title>An amendment to improve...</vote_title>
  <majority_requirement>1/2</majority_requirement>
  <document>
    <document_type>amdt</document_type>
    <document_number>123</document_number>
  </document>
  <count>
    <yeas>62</yeas>
    <nays>35</nays>
    <present>0</present>
    <absent>3</absent>
  </count>
  <members>
    <member>
      <member_full>Baldwin (D-WI)</member_full>
      <last_name>Baldwin</last_name>
      <first_name>Tammy</first_name>
      <party>D</party>
      <state>WI</state>
      <vote_cast>Yea</vote_cast>
    </member>
    <!-- ... 99 more senators ... -->
  </members>
</roll_call_vote>
```

### House Roll Call Vote

```xml
<rollcall-vote>
  <vote-metadata>
    <majority>R</majority>
    <congress>119</congress>
    <session>1st</session>
    <rollcall-num>42</rollcall-num>
    <legis-num>H R 1</legis-num>
    <vote-question>On Agreeing to the Amendment</vote-question>
    <vote-type>YEA-AND-NAY</vote-type>
    <vote-result>Passed</vote-result>
    <action-date>15-Feb-2025</action-date>
    <vote-totals>
      <totals-by-party>
        <party>R</party>
        <yea-total>210</yea-total>
        <nay-total>10</nay-total>
      </totals-by-party>
      <!-- ... -->
    </vote-totals>
  </vote-metadata>
  <vote-data>
    <recorded-vote>
      <legislator name-id="A000000" party="R" state="AL" role="legislator">
        Adams
      </legislator>
      <vote>Yea</vote>
    </recorded-vote>
    <!-- ... 434 more representatives ... -->
  </vote-data>
</rollcall-vote>
```

### Mapeo a AKN Diff `<vote>`

| XML fuente | AKN Diff |
|-----------|----------|
| `<vote_result>` / `<vote-result>` | `<vote result="approved/rejected">` |
| `<yeas>` / `<yea-total>` | `<count refersTo="#yea" value="N">` |
| `<nays>` / `<nay-total>` | `<count refersTo="#nay" value="N">` |
| `<member>` / `<recorded-vote>` | `<voteAtom by="#person" choice="#yea/#nay">` |
| `<party>` | `TLCOrganization` en `<references>` |
| `<state>` | Metadata adicional en TLCPerson |

## El desafío de las enmiendas prose-based

En EE.UU., las enmiendas se expresan como instrucciones en inglés:

```
On page 5, line 12, strike "shall" and insert "may".

Section 203(a)(1) is amended by adding at the end the following:
"(C) Any individual who..."

Strike section 4 and insert the following:
SEC. 4. REVISED PROVISIONS.
(a) IN GENERAL.—The Secretary shall...
```

**Problema**: Estas instrucciones NO están en un formato estructurado parseable automáticamente. El Comparative Print Suite del House usa NLP para resolverlas, pero esa herramienta no es pública.

**Solución pragmática para AKN Diff**: En vez de parsear instrucciones amendatorias:
1. Tomar la versión IH (Introduced) como `base`
2. Tomar la versión RH (Reported, post-comisión) como `result`
3. Hacer diff entre los dos XMLs completos
4. Generar `<articleChange>` para cada sección que cambió
5. Asociar el roll call vote correspondiente

Esto es exactamente lo que hacemos en Chile: no parseamos las indicaciones, comparamos textos pre/post.

## Observaciones

- **Los votos son la parte más fácil**: XML estructurado, sin autenticación, con nombre/partido/estado de cada legislador. Superior a Chile donde las APIs de votaciones requieren Playwright.
- **535 legisladores** (100 senadores + 435 representantes) vs 45+155=200 en Chile. Más datos, misma estructura.
- **Votos en comisión son el gap principal**: No hay XML estructurado. Solo aparecen en textos de committee reports. Esto es similar a Chile donde los votos de comisión están en PDFs.
- **El diff entre versiones XML es la estrategia más viable**: Evita el problema de NLP para instrucciones amendatorias. Tenemos experiencia directa con este approach en Chile.
- **congress-legislators** (YAML/JSON con todos los miembros 1789-presente) es la fuente ideal para `TLCPerson` references.
- **Historial de votos**: Senate.gov tiene votos desde el 101st Congress (1989). House Clerk desde el 101st también. 35+ años de cobertura.
