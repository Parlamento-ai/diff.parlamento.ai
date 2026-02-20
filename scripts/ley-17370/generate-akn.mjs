/**
 * Generate AKN Diff XMLs for Boletín 17.370-17
 * Cumplimiento alternativo de penas privativas de libertad
 *
 * 3 stages → 3 files:
 *   01-bill.xml           = Moción original (4 artículos)
 *   02-amendment-1.xml    = Informe Comisión DDHH (artículos modificados) + voto Sala RECHAZADO
 *   03-amendment-2.xml    = (Empty stage — bill rejected, no further progress)
 *
 * Key feature: Tests result="rejected" vote in AKN Diff
 * Vote: 21 a favor / 24 en contra / 0 abstenciones (21/01/2026)
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const OUT_DIR = 'research/2026-02-19/ley-17370/akn';
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================================================
// ARTICLE TEXT — MOCIÓN ORIGINAL (from 01-mocion.txt)
// Source: Moción senadores Chahuán, Ebensperger, Cruz-Coke,
//         Kusanovic y Kuschel
// ============================================================

const ART1_MOCION = `Principios. Los siguientes cinco principios deberán seguirse en el cumplimiento de la pena penal:
a) la pena penal ofrece la respuesta para los responsables de hechos ilícitos culpables y tiene una función eminentemente preventiva;
b) la prevención general o la retribución no deben tomarse en cuenta en la fase de ejecución de la pena;
c) la vida en prisión debe ser lo más parecida posible a las condiciones generales de vida existentes en el medio libre;
d) Los efectos dañinos del encarcelamiento deben ser contrarrestados por la autoridad penitenciaria;
e) La ejecución de la pena deberá orientarse hacia una eventual reintegración del prisionero en la sociedad libre, incluyéndose en esta, la posibilidad de tratar adecuadamente, en tiempo y forma, su enfermedad, ya sea por el sistema público o privado, y el derecho inalienable a recuperar la salud, y si ello no fuese posible, a morir afuera de la cárcel.`;

const ART2_MOCION = `Suspensión de la pena. El Tribunal, deberá a petición de parte o de oficio disponer la suspensión de la ejecución de una pena privativa de libertad, y mientras dure el impedimento:
a) Al condenado que presente una enfermedad mental;
b) Al condenado que padezca otras enfermedades, cuando fuese de temer un peligro próximo por la ejecución en la cárcel para la vida del condenado;
c) Al condenado que se encuentre en un estado físico incompatible con la ejecución en la cárcel o con la organización o infraestructura del establecimiento penitenciario.`;

const ART3_MOCION = `El Tribunal, deberá a petición de parte o de oficio disponer el cumplimiento de la pena penal impuesta en una modalidad de reclusión domiciliaria total, por el tiempo que reste de condena:
a) Al interno enfermo cuando la privación de la libertad en el establecimiento carcelario, por cualquier motivo, le impida recuperarse o tratar adecuadamente su enfermedad crónica;
b) Al interno que padezca una enfermedad incurable en período terminal;
c) Al interno discapacitado cuando la privación de la libertad en el establecimiento carcelario es inadecuada por su condición implicándole un trato indigno, inhumano o cruel;
d) Al interno mayor, cumplido 80 (ochenta) años o más, como resultado de la suma de su edad real, más los años que efectivamente ha estado privado de libertad en un recinto penal, teniendo una edad mínima de 70 (setenta) años.`;

const ART4_MOCION = `Para el objeto de cumplir con lo dispuesto en los artículos anteriores, el Tribunal deberá a petición de parte o de oficio acompañar al proceso los antecedentes médicos que certifiquen la enfermedad, discapacidad o deterioro físico y mental que justifiquen la suspensión de la pena o la sustitución de la misma por la pena de reclusión domiciliaria total, los que deberán comprender aquellos emitidos por el Ministerio de Salud; así como los antecedentes que acrediten el aplazamiento transitorio de la pena o la sustitución de la misma, en el caso de la letra d) del artículo cuarto.
La reclusión domiciliaria total importa la privación total de libertad en el domicilio del interno, y con las condiciones que establezca el Tribunal, y bajo el monitoreo constante de la autoridad penitenciaria, sin perjuicio de las autorizaciones que a petición de parte o de oficio, se otorguen para que el interno acuda a sus controles médicos, y dejando siempre a salvo los casos de urgencia médica vital, las que deberán ser informadas al tribunal al día siguiente hábil de ocurrido el infortunio.
Mientras dure la reclusión domiciliaria total, será también competente para conocer en los términos de los artículos 10, 95 y 466 del Código Procesal Penal, el Juzgado de Garantía correspondiente al domicilio del interno.
La resolución acerca de la concesión, denegación o revocación de cualquiera de las medidas contempladas en los artículos segundo y tercero de esta ley, será apelable en ambos efectos, dentro del plazo de cinco días. El recurso gozará de preferencia para su vista y fallo.`;

// ============================================================
// ARTICLE TEXT — INFORME COMISIÓN DDHH (from 04-informe-comision-ddhh.txt)
// Source: Comisión de Derechos Humanos, Nacionalidad y Ciudadanía
// Approved in general and particular with 4 indicaciones
// ============================================================

const ART1_COMISION = `Principios. Los siguientes cinco principios deberán seguirse en el cumplimiento de la pena penal:
a) La pena penal ofrece la respuesta para los responsables de hechos ilícitos culpables y tiene una función eminentemente preventiva;
b) La prevención general o la retribución no deben tomarse en cuenta en la fase de ejecución de la pena;
c) La vida en prisión debe ser lo más parecida posible a las condiciones generales de vida existentes en el medio libre;
d) Los efectos dañinos del encarcelamiento deben ser contrarrestados por la autoridad penitenciaria;
e) La ejecución de la pena deberá orientarse hacia una eventual reintegración del prisionero en la sociedad libre, incluyéndose en esta, la posibilidad de tratar adecuadamente, en tiempo y forma, su enfermedad, ya sea por el sistema público o privado, y el derecho inalienable a recuperar la salud, y si ello no fuese posible, a morir afuera de la cárcel.`;

const ART2_COMISION = `Reclusión domiciliaria total. La reclusión domiciliaria total consiste en la sustitución del cumplimiento de la pena privativa de libertad por el encierro en el domicilio del condenado, durante las veinticuatro horas del día.
En ningún caso podrá fijarse como domicilio aquel en el que actualmente residiere la víctima del delito por el cual la persona hubiere sido condenada.`;

const ART3_COMISION = `Cumplimiento alternativo de la pena. El Tribunal deberá, a petición de parte o de oficio, disponer el cumplimiento de la pena penal impuesta en una modalidad de reclusión domiciliaria total, por el tiempo que reste de condena:
a) Al interno enfermo cuando la privación de la libertad en el establecimiento carcelario, por cualquier motivo, le impida recuperarse o tratar adecuadamente su enfermedad crónica;
b) Al interno que padezca una enfermedad incurable en período terminal;
c) Al interno discapacitado cuando la privación de la libertad en el establecimiento carcelario es inadecuada por su condición implicándole un trato indigno, inhumano o cruel;
d) Al interno mayor, cumplido 80 (ochenta) años o más, como resultado de la suma de su edad real, más los años que efectivamente ha estado privado de libertad en un recinto penal, teniendo una edad mínima de 70 (setenta) años.`;

const ART4_COMISION = `Procedimiento. Para el objeto de cumplir con lo dispuesto en los artículos anteriores, el Tribunal deberá, a petición de parte o de oficio, acompañar al proceso los antecedentes médicos que certifiquen la enfermedad, discapacidad o deterioro físico y mental que justifiquen la sustitución de la pena por la de reclusión domiciliaria total, los que deberán comprender aquellos emitidos por el Ministerio de Salud; así como los antecedentes que acrediten el aplazamiento transitorio de la pena o la sustitución de la misma, en el caso de la letra d) del artículo tercero.
La reclusión domiciliaria total importa la privación total de libertad en el domicilio del interno, con las condiciones que establezca el Tribunal, y bajo el monitoreo constante de la autoridad penitenciaria, sin perjuicio de las autorizaciones que a petición de parte o de oficio, se otorguen para que el interno acuda a sus controles médicos, y dejando siempre a salvo los casos de urgencia médica vital, las que deberán ser informadas al tribunal al día siguiente hábil de ocurrido el infortunio.
Mientras dure la reclusión domiciliaria total, será también competente para conocer en los términos de los artículos 10, 95 y 466 del Código Procesal Penal, el Juzgado de Garantía correspondiente al domicilio del interno.
La resolución acerca de la concesión, denegación o revocación de cualquiera de las medidas contempladas en el artículo tercero de esta ley, será apelable en ambos efectos, dentro del plazo de cinco días. El recurso gozará de preferencia para su vista y fallo.`;

// ============================================================
// VOTE DATA — Sala vote (REJECTED 21-24)
// Source: tramitacion.senado.cl/wspublico/votaciones.php?boletin=17370
// Date: 21/01/2026
// This was a procedural vote to send the bill to another commission
// ============================================================
const SALA_VOTE = {
  date: '2026-01-21',
  result: 'rejected',
  for: [
    'De Urresti V., Alfonso', 'Insulza S., José Miguel', 'Ordenes N., Ximena',
    'Flores G., Iván', 'Núñez A., Daniel', 'Pascual D., Alejandra',
    'Saavedra C., Gastón', 'Walker P., Matías', 'Araya G., Pedro',
    'Quintana L., Jaime', 'Campillai R., Fabiola', 'Vodanovic R., Paulina',
    'Espinoza S., Fidel', 'Provoste C., Yasna', 'Lagos W., Ricardo',
    'Rincón G., Ximena', 'Latorre M., Juan Ignacio', 'Castro G., Juan Luis',
    'Sepúlveda O., Alexis', 'Velásquez N., Esteban', 'De Rementería V., Tomás'
  ],
  against: [
    'Moreira B., Iván', 'Ossandón I., Manuel José', 'Durana S., José Miguel',
    'Edwards S., Rojo', 'Gatica B., María José', 'Keitel B., Sebastián',
    'Kusanovic G., Alejandro', 'Macaya D., Javier', 'Coloma C., Juan Antonio',
    'García R., José', 'Kuschel S., Carlos Ignacio', 'Chahuán C., Francisco',
    'Ebensperger O., Luz Eliana', 'Prohens E., Rafael', 'Sandoval P., David',
    'Núñez P., José', 'Sanhueza D., Gustavo', 'Cruz-Coke C., Luciano',
    'Pugh O., Kenneth', 'Castro P., Juan Enrique', 'Galilea O., Rodrigo',
    'Aravena A., Carmen Gloria', 'Kast R., Felipe', 'Van Rysselberghe H., Enrique'
  ],
  abstain: []
};

// ============================================================
// HELPERS
// ============================================================

function buildArticles(articles) {
  return articles.map(({ eId, num, text }) => `      <article eId="${eId}">
        <heading>Artículo ${num}</heading>
        <content>
          <p>${escapeXml(text)}</p>
        </content>
      </article>`).join('\n');
}

function buildVoterXml(voters, type) {
  if (voters.length === 0) return `        <akndiff:${type}/>`;
  const inner = voters.map(v => {
    const slug = v.split(',')[0].trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/ /g, '-');
    return `          <akndiff:voter href="/cl/senador/${slug}" showAs="${escapeXml(v)}"/>`;
  }).join('\n');
  return `        <akndiff:${type}>\n${inner}\n        </akndiff:${type}>`;
}

// ============================================================
// GENERATE: 01-bill.xml (Moción original)
// ============================================================
function generateBill() {
  const articles = [
    { eId: 'art_1', num: 'primero', text: ART1_MOCION },
    { eId: 'art_2', num: 'segundo', text: ART2_MOCION },
    { eId: 'art_3', num: 'tercero', text: ART3_MOCION },
    { eId: 'art_4', num: 'cuarto', text: ART4_MOCION },
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
  <bill name="boletin-17370-17-mocion">
    <meta>
      <identification source="#parlamento-ai">
        <FRBRWork>
          <FRBRthis value="/cl/boletin/17370-17/mocion"/>
          <FRBRuri value="/cl/boletin/17370-17"/>
          <FRBRdate date="2025-03-04" name="presentación"/>
          <FRBRauthor href="/cl/senador/chahuan-francisco"/>
          <FRBRcountry value="cl"/>
        </FRBRWork>
        <FRBRExpression>
          <FRBRthis value="/cl/boletin/17370-17/mocion/esp@2025-03-04"/>
          <FRBRuri value="/cl/boletin/17370-17/esp@2025-03-04"/>
          <FRBRdate date="2025-03-04" name="versión"/>
          <FRBRlanguage language="spa"/>
        </FRBRExpression>
        <FRBRManifestation>
          <FRBRthis value="/cl/boletin/17370-17/mocion/esp@2025-03-04/akn"/>
          <FRBRuri value="/cl/boletin/17370-17/esp@2025-03-04/akn"/>
          <FRBRdate date="2026-02-19" name="generación"/>
        </FRBRManifestation>
      </identification>
      <references>
        <TLCPerson eId="chahuan" href="/cl/senador/chahuan-francisco" showAs="Francisco Chahuán Chahuán"/>
        <TLCPerson eId="ebensperger" href="/cl/senador/ebensperger-luz-eliana" showAs="Luz Eliana Ebensperger Orrego"/>
        <TLCPerson eId="cruzcoke" href="/cl/senador/cruz-coke-luciano" showAs="Luciano Cruz-Coke Carvallo"/>
        <TLCPerson eId="kusanovic" href="/cl/senador/kusanovic-alejandro" showAs="Alejandro Kusanovic Glusevic"/>
        <TLCPerson eId="kuschel" href="/cl/senador/kuschel-carlos" showAs="Carlos Kuschel Silva"/>
      </references>
    </meta>
    <preface>
      <longTitle>
        <p>Proyecto de Ley: <docTitle>Moción — Boletín 17.370-17</docTitle></p>
      </longTitle>
      <p>Regula la suspensión y el cumplimiento alternativo de penas privativas de libertad, para condenados que indica. Moción de los senadores Chahuán, Ebensperger, Cruz-Coke, Kusanovic y Kuschel.</p>
    </preface>
    <body>
${buildArticles(articles)}
    </body>
  </bill>
</akomaNtoso>`;
}

// ============================================================
// GENERATE: 02-amendment-1.xml (Informe Comisión DDHH + Sala REJECTED vote)
// The committee approved with modifications, but the Sala rejected
// ============================================================
function generateAmendment1() {
  const forXml = buildVoterXml(SALA_VOTE.for, 'for');
  const againstXml = buildVoterXml(SALA_VOTE.against, 'against');
  const abstainXml = buildVoterXml(SALA_VOTE.abstain, 'abstain');

  return `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
  <amendment name="boletin-17370-17-informe-comision">
    <meta>
      <identification source="#parlamento-ai">
        <FRBRWork>
          <FRBRthis value="/cl/boletin/17370-17/informe-comision"/>
          <FRBRuri value="/cl/boletin/17370-17"/>
          <FRBRdate date="2025-10-28" name="informe"/>
          <FRBRauthor href="/cl/senado/comision-ddhh"/>
          <FRBRcountry value="cl"/>
        </FRBRWork>
        <FRBRExpression>
          <FRBRthis value="/cl/boletin/17370-17/informe-comision/esp@2025-10-28"/>
          <FRBRuri value="/cl/boletin/17370-17/esp@2025-10-28"/>
          <FRBRdate date="2025-10-28" name="versión"/>
          <FRBRlanguage language="spa"/>
        </FRBRExpression>
        <FRBRManifestation>
          <FRBRthis value="/cl/boletin/17370-17/informe-comision/esp@2025-10-28/akn"/>
          <FRBRuri value="/cl/boletin/17370-17/esp@2025-10-28/akn"/>
          <FRBRdate date="2026-02-19" name="generación"/>
        </FRBRManifestation>
      </identification>
      <references>
        <TLCOrganization eId="comision-ddhh" href="/cl/senado/comision-ddhh" showAs="Comisión de Derechos Humanos, Nacionalidad y Ciudadanía"/>
      </references>
    </meta>
    <preface>
      <longTitle>
        <p><docTitle>Informe Comisión DDHH + Votación en Sala</docTitle></p>
      </longTitle>
      <p>La Comisión de Derechos Humanos, Nacionalidad y Ciudadanía aprobó en general y en particular con modificaciones: se elimina el artículo sobre suspensión de la pena, se agrega una definición de reclusión domiciliaria total (nuevo Art. 2), se reestructura el articulado. 4 indicaciones procesadas (3 aprobadas, 1 rechazada). La Sala del Senado RECHAZÓ el proyecto en votación general: 21 votos a favor, 24 en contra (no alcanzó mayoría simple).</p>
    </preface>
    <amendmentBody>
      <amendmentContent>
        <p>Principales modificaciones de la Comisión:</p>
        <p>1. Art. 1 (Principios): cambios de capitalización en letras a) a e).</p>
        <p>2. Art. 2: se elimina "Suspensión de la pena" y se reemplaza por "Reclusión domiciliaria total" con definición y protección a víctimas.</p>
        <p>3. Art. 3: se renombra "Cumplimiento alternativo de la pena" y se ajusta redacción.</p>
        <p>4. Art. 4: se renombra "Procedimiento", se elimina referencia a suspensión, se ajustan referencias internas.</p>
      </amendmentContent>
    </amendmentBody>
    <akndiff:changeSet
      base="/cl/boletin/17370-17/esp@2025-03-04"
      result="/cl/boletin/17370-17/esp@2025-10-28">
      <akndiff:vote date="${SALA_VOTE.date}" result="${SALA_VOTE.result}" source="/cl/senado/sesion/2026-01-21">
${forXml}
${againstXml}
${abstainXml}
      </akndiff:vote>
      <akndiff:articleChange article="art_1" type="substitute">
        <akndiff:old>${escapeXml(ART1_MOCION)}</akndiff:old>
        <akndiff:new>${escapeXml(ART1_COMISION)}</akndiff:new>
      </akndiff:articleChange>
      <akndiff:articleChange article="art_2" type="substitute">
        <akndiff:old>${escapeXml(ART2_MOCION)}</akndiff:old>
        <akndiff:new>${escapeXml(ART2_COMISION)}</akndiff:new>
      </akndiff:articleChange>
      <akndiff:articleChange article="art_3" type="substitute">
        <akndiff:old>${escapeXml(ART3_MOCION)}</akndiff:old>
        <akndiff:new>${escapeXml(ART3_COMISION)}</akndiff:new>
      </akndiff:articleChange>
      <akndiff:articleChange article="art_4" type="substitute">
        <akndiff:old>${escapeXml(ART4_MOCION)}</akndiff:old>
        <akndiff:new>${escapeXml(ART4_COMISION)}</akndiff:new>
      </akndiff:articleChange>
    </akndiff:changeSet>
  </amendment>
</akomaNtoso>`;
}

// ============================================================
// MAIN
// ============================================================
const files = [
  { name: '01-bill.xml', gen: generateBill },
  { name: '02-amendment-1.xml', gen: generateAmendment1 },
];

for (const { name, gen } of files) {
  const xml = gen();
  const outPath = join(OUT_DIR, name);
  writeFileSync(outPath, xml, 'utf-8');
  console.log(`  ${name} (${xml.length} chars)`);
}

console.log(`\nGenerated ${files.length} AKN files in ${OUT_DIR}`);
console.log('Key feature: amendment-1 has result="rejected" vote (21-24)');
