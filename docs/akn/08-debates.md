# Debate Documents

AKN has dedicated support for parliamentary debates, committee hearings, and any proceeding structured around speeches. The `<debate>` and `<debateReport>` document types use `<debateBody>` instead of `<body>`.

## Structure

```xml
<debate name="session-56">
  <meta><!-- ... --></meta>
  <preface>
    <p>Session 56 of the Chamber of Deputies</p>
    <docDate date="2006-06-15">15 June 2006</docDate>
  </preface>
  <debateBody>
    <debateSection eId="dbsect_1" name="openingStatements">
      <heading>Opening Statements</heading>
      <speech eId="dbsect_1__spch_1" by="#president">
        <from>The President</from>
        <p>The session is now open.</p>
      </speech>
    </debateSection>
    <!-- more sections... -->
  </debateBody>
</debate>
```

## Debate sections

The `<debateBody>` contains `<debateSection>` elements, which can be nested. AKN also provides 19 specialized section types for common parliamentary activities:

| Element | Purpose |
|---|---|
| `<debateSection>` | Generic debate section (most flexible) |
| `<administrationOfOath>` | Swearing-in ceremonies |
| `<rollCall>` | Roll call / attendance |
| `<prayers>` | Opening prayers or invocations |
| `<oralStatements>` | Oral statements by ministers/members |
| `<writtenStatements>` | Written statements entered into record |
| `<personalStatements>` | Personal statements by members |
| `<ministerialStatements>` | Statements by ministers/government |
| `<resolutions>` | Resolution deliberations |
| `<nationalInterest>` | Matters of national interest |
| `<declarationOfVote>` | Members declaring their vote rationale |
| `<communication>` | Communications to the chamber |
| `<petitions>` | Citizen petitions |
| `<papers>` | Papers laid before the chamber |
| `<noticesOfMotion>` | Notices of future motions |
| `<questions>` | Question time |
| `<address>` | Formal addresses (e.g., head of state) |
| `<proceduralMotions>` | Procedural motions |
| `<pointOfOrder>` | Points of order |

All specialized sections have the same internal structure as `<debateSection>`.

## Speech elements

### `<speech>` — A speech by a member

```xml
<speech eId="dbsect_1__spch_1" by="#diputado-valenciano">
  <from>Dip. Valenciano</from>
  <p>Mr. President, I rise to oppose this amendment.</p>
  <p>The use of chorizo in paella is an affront to our culinary heritage.</p>
</speech>
```

| Attribute | Description |
|---|---|
| `by` | Reference to the speaker (matches a TLCPerson in `<references>`) |
| `as` | The role in which they speak (matches a TLCRole) |
| `to` | Who they are addressing |

### `<from>` — Speaker identification

Always the first child of `<speech>`:

```xml
<from>The Minister of Agriculture</from>
```

### `<question>` — A question

```xml
<question eId="dbsect_1__quest_1" by="#diputada-consumo" to="#minister">
  <from>Dip. Consumo</from>
  <p>Can the Minister confirm whether newspaper ink is food-safe?</p>
</question>
```

### `<answer>` — An answer

```xml
<answer eId="dbsect_1__ans_1" by="#minister">
  <from>The Minister</from>
  <p>I refer the honorable member to my previous statement.</p>
</answer>
```

### `<scene>` — Stage directions

Non-verbal events during the debate:

```xml
<scene>[Applause]</scene>
<scene>[The member leaves the chamber]</scene>
```

### `<narrative>` — Descriptive text

Narrative passages by the transcriber:

```xml
<narrative>At this point, the session was suspended for 15 minutes.</narrative>
```

### `<summary>` — Summary of proceedings

```xml
<summary>
  <p>The committee discussed 5 amendments and approved 2.</p>
</summary>
```

## Voting in debates

Voting sections within debates use `<voting>`:

```xml
<debateSection name="voting" eId="dbsect_vote">
  <heading>Voting</heading>
  <speech by="#president">
    <from>The President</from>
    <p>We shall now proceed to vote on Amendment 1.</p>
  </speech>
  <voting>
    <quorumVerification>
      <count value="88" refersTo="#membersPresent"/>
    </quorumVerification>
    <p>Those in favor: 86. Those against: 0. Abstentions: 2.</p>
    <p>The amendment is approved.</p>
  </voting>
</debateSection>
```

For structured (computable) voting data, use the `<analysis><parliamentary><voting>` metadata — or the [AKN++ vote extension](../aknpp/03-voting.md).

## Real example: Chile Session 56

From `cl_Sesion56_2.xml` in the official examples:

```xml
<debate name="recurso">
  <meta>
    <identification source="#bcn">
      <FRBRWork>
        <FRBRthis value="/akn/cl/debate/recurso/2006/1076048"/>
        <FRBRuri value="/akn/cl/debate/recurso/2006/1076048"/>
        <FRBRdate date="2006-06-15" name="workDate"/>
        <FRBRauthor href="#bcn"/>
        <FRBRcountry value="cl"/>
      </FRBRWork>
      <!-- Expression, Manifestation... -->
    </identification>
    <analysis source="#bcn">
      <parliamentary>
        <voting eId="v_1" outcome="#aprobacionUnanime" href="#ct1-db1-vot1">
          <count eId="v_1__c_1" value="0" refersTo="#SinConteo"/>
        </voting>
        <voting eId="v_2" outcome="#aprobado" href="#od01-pl01-V01-01">
          <count eId="v_2__c_1" value="86" refersTo="#aFavor"/>
          <count eId="v_2__c_2" value="0" refersTo="#enContra"/>
          <count eId="v_2__c_3" value="2" refersTo="#seAbstiene"/>
        </voting>
      </parliamentary>
    </analysis>
    <references source="#bcn">
      <TLCLocation eId="Sotaqui" href="/cl/..." showAs="Sotaqui"/>
      <TLCOrganization eId="ministerio-de-relaciones-exteriores"
                        href="/akn/recurso/cl/organismo/..." showAs="..."/>
      <!-- many more organizations, persons... -->
    </references>
  </meta>
  <debateBody>
    <debateSection name="agenda">
      <!-- sections for roll call, committees, main debate, voting -->
    </debateSection>
  </debateBody>
</debate>
```

Note how voting data appears both in `<analysis><parliamentary>` (structured metadata) and in the `<debateBody>` (narrative transcript).

---

Previous: [Inline elements](07-inline-elements.md) | Next: [Naming convention](09-naming-convention.md)
