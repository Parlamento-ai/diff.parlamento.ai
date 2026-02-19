/**
 * Generate AKN Diff XMLs for Boletín 15.995-02 (Ley 21.670)
 * Modifies Art. 6 of Ley 17.798 (Control de Armas)
 *
 * 4 stages → 5 files:
 *   01-act-original.xml   = Ley 17.798 Art. 6 before reform
 *   02-bill.xml           = Moción original (simple word change)
 *   03-amendment-1.xml    = 1er Trámite: Indicaciones del Ejecutivo + Comisión Cámara
 *   04-amendment-2.xml    = 2do Trámite: Senado modifica redacción
 *   05-act-final.xml      = Ley 21.670 publicada (= 2do trámite, Cámara aprobó modifs)
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const OUT_DIR = 'research/2026-02-19/ley-21670/akn';
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================================================
// TEXT OF ART. 6 AT EACH STAGE
// Source: Informe Comisión Defensa Cámara (03-informe-comision-camara.txt)
// and Oficios 19.265, 178, 19.465
// ============================================================

// Art 6 inciso 1 (unchanged throughout)
const INC1 = 'Las armas indicadas en el artículo anterior podrán ser poseídas o tenidas únicamente por las personas que cuenten con autorización de la Dirección General de Movilización Nacional y las hayan inscrito en el Registro Nacional de Armas.';

// Art 6 inciso 2 (unchanged throughout)
const INC2 = 'El permiso de porte de armas tendrá una vigencia máxima de un año, contado desde la fecha de su otorgamiento, y sólo autoriza al beneficiario para portar un arma.';

// Art 6 inciso 3 - BEFORE reform (original text of Ley 17.798)
const INC3_ORIGINAL = 'Asimismo, no requerirán este permiso, los aspirantes a oficiales de Carabineros ni los aspirantes a oficiales de la Policía de Investigaciones, que cursen tercer año en las Escuelas de Carabineros y de Investigaciones Policiales, durante la realización de las respectivas prácticas policiales.';

// Art 6 inciso 3 - AFTER reform (Carabineros references removed)
const INC3_REFORMED = 'Asimismo, no requerirán este permiso los aspirantes a oficiales de la Policía de Investigaciones, que cursen tercer año en la Escuela de Investigaciones Policiales, durante la realización de las respectivas prácticas policiales.';

// Art 6 inciso 4 (nuevo) - version 1er Trámite (Comisión Cámara)
const INC4_1ER_TRAMITE = 'Tampoco requerirán este permiso los aspirantes a oficiales de Carabineros que estén cursando tercer y cuarto año en la Escuela de Carabineros de Chile, ni los carabineros alumnos que estén cursando segundo año en la Escuela de Formación de Carabineros y sus grupos de formación a nivel nacional, durante la realización de los periodos de práctica que determinen las respectivas mallas curriculares. Sin perjuicio de lo anterior, para que dichos aspirantes a oficiales y carabineros alumnos se encuentren exentos del permiso de porte de armas a que se refiere este artículo, deberán haber aprobado todos los cursos de tiro policial correspondientes a los semestres anteriores al que se encontraren cursando. Estas prácticas profesionales tendrán únicamente la finalidad de contribuir a las labores de prevención y mantención del orden público.';

// Art 6 inciso 4 (nuevo) - version 2do Trámite (Senado) y Final
const INC4_SENADO = 'Tampoco requerirán este permiso los aspirantes a oficiales de Carabineros que cursen tercer y cuarto año en la Escuela de Carabineros de Chile, ni los carabineros alumnos que cursen segundo año en la Escuela de Formación de Carabineros y sus grupos de formación a nivel nacional, mientras realicen los periodos de práctica que determinen las respectivas mallas curriculares. Para que dichos aspirantes a oficiales y carabineros alumnos se encuentren exentos del permiso de porte de armas a que se refiere este artículo deberán haber aprobado todos los cursos de tiro policial correspondientes a sus semestres anteriores. Estas prácticas profesionales tendrán únicamente la finalidad de contribuir a las labores de prevención y mantención del orden público.';

// Art 6 inciso 5 (nuevo) - version 1er Trámite
const INC5_1ER_TRAMITE = 'Los aspirantes a oficiales de la Policía de Investigaciones a los que se refiere el inciso tercero y los aspirantes a oficiales de Carabineros y los carabineros alumnos a los que se refiere el inciso cuarto tendrán la calidad de funcionarios de la Policía de Investigaciones o de Carabineros de Chile, respectivamente, en las actuaciones que realicen durante los periodos de práctica que determinen las respectivas mallas curriculares.';

// Art 6 inciso 5 (nuevo) - version 2do Trámite (Senado) y Final
const INC5_SENADO = 'Los aspirantes a oficiales de la Policía de Investigaciones a los que se refiere el inciso tercero y los aspirantes a oficiales de Carabineros y los carabineros alumnos a los que se refiere el inciso cuarto tendrán la calidad de funcionarios de la Policía de Investigaciones o de Carabineros de Chile, respectivamente, en cualquier actuación en la que participen durante los periodos de práctica que determinen las respectivas mallas curriculares.';

// Art 6 inciso 4 original (becomes inciso 6 after reform)
const INC4_ORIGINAL = 'Los permisos de porte serán otorgados por las Comandancias de Guarnición de las Fuerzas Armadas o por la autoridad de Carabineros de mayor jerarquía en la localidad, en caso de urgencia calificada por esas instituciones.';

// ============================================================
// VOTE DATA (from Senate API)
// ============================================================
const SENATE_VOTE = {
  date: '2024-04-23',
  result: 'approved',
  for: [
    'Coloma C., Juan Antonio', 'García R., José', 'Kuschel S., Carlos Ignacio',
    'Chahuán C., Francisco', 'Lagos W., Ricardo', 'Quintana L., Jaime',
    'Rincón G., Ximena', 'Araya G., Pedro', 'Moreira B., Iván',
    'Ossandón I., Manuel José', 'Insulza S., José Miguel',
    'Ebensperger O., Luz Eliana', 'Provoste C., Yasna', 'Pugh O., Kenneth',
    'Huenchumilla J., Francisco', 'Ordenes N., Ximena', 'Sandoval P., David',
    'Castro G., Juan Luis', 'Cruz-Coke C., Luciano', 'Edwards S., Rojo',
    'Espinoza S., Fidel', 'Gahona S., Sergio', 'Gatica B., María José',
    'Keitel B., Sebastián', 'Kusanovic G., Alejandro', 'Núñez A., Daniel',
    'Saavedra C., Gastón', 'Sanhueza D., Gustavo',
    'Van Rysselberghe H., Enrique', 'Walker P., Matías', 'Vodanovic R., Paulina'
  ],
  against: [],
  abstain: ['Durana S., José Miguel', 'Campillai R., Fabiola']
};

// ============================================================
// HELPER: Build article content for Art. 6
// ============================================================
function buildArt6Content(incisos) {
  return incisos.map((inc, i) => `        <p>Inciso ${i + 1}°: ${escapeXml(inc)}</p>`).join('\n');
}

// ============================================================
// GENERATE: 01-act-original.xml (Ley 17.798 before reform)
// ============================================================
function generateOriginal() {
  const art6Incisos = [INC1, INC2, INC3_ORIGINAL, INC4_ORIGINAL];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
  <act name="ley-17798-art6-pre-reforma">
    <meta>
      <identification source="#parlamento-ai">
        <FRBRWork>
          <FRBRthis value="/cl/ley/17798/art6"/>
          <FRBRuri value="/cl/ley/17798"/>
          <FRBRdate date="1972-10-21" name="publicación"/>
          <FRBRauthor href="/cl/congreso"/>
          <FRBRcountry value="cl"/>
        </FRBRWork>
        <FRBRExpression>
          <FRBRthis value="/cl/ley/17798/art6/esp@2024-06-12"/>
          <FRBRuri value="/cl/ley/17798/esp@2024-06-12"/>
          <FRBRdate date="2024-06-12" name="versión"/>
          <FRBRlanguage language="spa"/>
        </FRBRExpression>
        <FRBRManifestation>
          <FRBRthis value="/cl/ley/17798/art6/esp@2024-06-12/akn"/>
          <FRBRuri value="/cl/ley/17798/esp@2024-06-12/akn"/>
          <FRBRdate date="2026-02-19" name="generación"/>
        </FRBRManifestation>
      </identification>
    </meta>
    <preface>
      <longTitle>
        <p>Ley N° <docTitle>Ley 17.798 — Control de Armas (Art. 6)</docTitle></p>
      </longTitle>
      <p>Texto del artículo 6 de la Ley 17.798 sobre Control de Armas, vigente antes de la reforma introducida por la Ley 21.670.</p>
    </preface>
    <body>
      <article eId="art_6">
        <heading>Artículo 6</heading>
        <content>
${buildArt6Content(art6Incisos)}
        </content>
      </article>
    </body>
  </act>
</akomaNtoso>`;
  return xml;
}

// ============================================================
// GENERATE: 02-bill.xml (Moción original)
// ============================================================
function generateBill() {
  // Original moción: simply change "tercer" to "primer" in inc. 3
  const newInc3 = INC3_ORIGINAL.replace('tercer', 'primer');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
  <bill name="boletin-15995-02-mocion">
    <meta>
      <identification source="#parlamento-ai">
        <FRBRWork>
          <FRBRthis value="/cl/boletin/15995-02/mocion"/>
          <FRBRuri value="/cl/boletin/15995-02"/>
          <FRBRdate date="2023-06-05" name="presentación"/>
          <FRBRauthor href="/cl/diputado/castro-bascunan-jose-miguel"/>
          <FRBRcountry value="cl"/>
        </FRBRWork>
        <FRBRExpression>
          <FRBRthis value="/cl/boletin/15995-02/mocion/esp@2023-06-05"/>
          <FRBRuri value="/cl/boletin/15995-02/esp@2023-06-05"/>
          <FRBRdate date="2023-06-05" name="versión"/>
          <FRBRlanguage language="spa"/>
        </FRBRExpression>
        <FRBRManifestation>
          <FRBRthis value="/cl/boletin/15995-02/mocion/esp@2023-06-05/akn"/>
          <FRBRuri value="/cl/boletin/15995-02/esp@2023-06-05/akn"/>
          <FRBRdate date="2026-02-19" name="generación"/>
        </FRBRManifestation>
      </identification>
      <references>
        <TLCPerson eId="castro" href="/cl/diputado/castro-bascunan-jose-miguel" showAs="José Miguel Castro Bascuñán"/>
      </references>
    </meta>
    <preface>
      <longTitle>
        <p>Proyecto de Ley: <docTitle>Moción — Boletín 15.995-02</docTitle></p>
      </longTitle>
      <p>Modifica la Ley N°17.798, sobre Control de Armas, para autorizar el porte de armas por los aspirantes a oficiales de Carabineros y de la Policía de Investigaciones desde el primer año de formación y durante la realización de la práctica policial.</p>
    </preface>
    <body>
      <article eId="art_unico">
        <heading>Artículo Único</heading>
        <content>
        <p>Sustitúyase en el inciso tercero del artículo 6 de la Ley N°17.798, sobre Control de Armas, cuyo texto refundido, coordinado y sistematizado ha sido fijado por el Decreto N°400 de 13 de abril de 1978 del Ministerio de Defensa Nacional, la palabra "tercer" por la palabra "primer".</p>
        </content>
      </article>
    </body>
    <akndiff:changeSet
      base="/cl/ley/17798/art6/esp@2024-06-12"
      result="/cl/boletin/15995-02/esp@2023-06-05">
      <akndiff:articleChange article="art_6" type="substitute">
        <akndiff:old>${escapeXml(INC3_ORIGINAL)}</akndiff:old>
        <akndiff:new>${escapeXml(newInc3)}</akndiff:new>
      </akndiff:articleChange>
    </akndiff:changeSet>
  </bill>
</akomaNtoso>`;
  return xml;
}

// ============================================================
// GENERATE: 03-amendment-1.xml (1er Trámite: Indicaciones Ejecutivo + Comisión Cámara)
// ============================================================
function generateAmendment1() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
  <amendment name="boletin-15995-02-1er-tramite">
    <meta>
      <identification source="#parlamento-ai">
        <FRBRWork>
          <FRBRthis value="/cl/boletin/15995-02/1er-tramite"/>
          <FRBRuri value="/cl/boletin/15995-02"/>
          <FRBRdate date="2024-03-11" name="aprobación"/>
          <FRBRauthor href="/cl/camara-diputados"/>
          <FRBRcountry value="cl"/>
        </FRBRWork>
        <FRBRExpression>
          <FRBRthis value="/cl/boletin/15995-02/1er-tramite/esp@2024-03-11"/>
          <FRBRuri value="/cl/boletin/15995-02/esp@2024-03-11"/>
          <FRBRdate date="2024-03-11" name="versión"/>
          <FRBRlanguage language="spa"/>
        </FRBRExpression>
        <FRBRManifestation>
          <FRBRthis value="/cl/boletin/15995-02/1er-tramite/esp@2024-03-11/akn"/>
          <FRBRuri value="/cl/boletin/15995-02/esp@2024-03-11/akn"/>
          <FRBRdate date="2026-02-19" name="generación"/>
        </FRBRManifestation>
      </identification>
      <references>
        <TLCOrganization eId="camara" href="/cl/camara-diputados" showAs="Cámara de Diputados"/>
      </references>
    </meta>
    <preface>
      <longTitle>
        <p><docTitle>1er Trámite: Cámara de Diputados</docTitle></p>
      </longTitle>
      <p>Oficio N°19.265 — La Cámara aprueba en general y particular con indicaciones del Ejecutivo. Se reescribe completamente la modificación: se elimina a Carabineros del inciso 3° y se agregan nuevos incisos 4° y 5° con regulación diferenciada para aspirantes a oficiales y carabineros alumnos. Aprobado por 109 votos (quórum calificado).</p>
    </preface>
    <amendmentBody>
      <amendmentContent>
        <p>Artículo único.- Modifícase el artículo 6 de la ley N°17.798:</p>
        <p>1. En el inciso tercero: a) Elimínase la expresión ", los aspirantes a oficiales de Carabineros ni". b) Sustitúyese "las Escuelas de Carabineros y" por "la Escuela".</p>
        <p>2. Agréganse nuevos incisos cuarto y quinto.</p>
      </amendmentContent>
    </amendmentBody>
    <akndiff:changeSet
      base="/cl/boletin/15995-02/esp@2023-06-05"
      result="/cl/boletin/15995-02/esp@2024-03-11">
      <akndiff:vote date="2024-03-11" result="approved" source="/cl/camara-diputados/sesion/1-372">
        <akndiff:for>
          <akndiff:voter href="/cl/camara-diputados" showAs="109 diputados a favor (quórum calificado)"/>
        </akndiff:for>
        <akndiff:against/>
        <akndiff:abstain/>
      </akndiff:vote>
      <akndiff:articleChange article="art_6" type="substitute">
        <akndiff:old>${escapeXml(INC3_ORIGINAL)}</akndiff:old>
        <akndiff:new>${escapeXml(INC3_REFORMED)}</akndiff:new>
      </akndiff:articleChange>
      <akndiff:articleChange article="art_6_inc4" type="insert" after="art_6">
        <akndiff:new>${escapeXml(INC4_1ER_TRAMITE)}</akndiff:new>
      </akndiff:articleChange>
      <akndiff:articleChange article="art_6_inc5" type="insert" after="art_6_inc4">
        <akndiff:new>${escapeXml(INC5_1ER_TRAMITE)}</akndiff:new>
      </akndiff:articleChange>
    </akndiff:changeSet>
  </amendment>
</akomaNtoso>`;
  return xml;
}

// ============================================================
// GENERATE: 04-amendment-2.xml (2do Trámite: Senado modifica)
// ============================================================
function generateAmendment2() {
  const voterXml = SENATE_VOTE.for.map(v =>
    `          <akndiff:voter href="/cl/senador/${v.split(',')[0].trim().toLowerCase().replace(/ /g, '-')}" showAs="${escapeXml(v)}"/>`
  ).join('\n');
  const abstainXml = SENATE_VOTE.abstain.map(v =>
    `          <akndiff:voter href="/cl/senador/${v.split(',')[0].trim().toLowerCase().replace(/ /g, '-')}" showAs="${escapeXml(v)}"/>`
  ).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
  <amendment name="boletin-15995-02-2do-tramite">
    <meta>
      <identification source="#parlamento-ai">
        <FRBRWork>
          <FRBRthis value="/cl/boletin/15995-02/2do-tramite"/>
          <FRBRuri value="/cl/boletin/15995-02"/>
          <FRBRdate date="2024-04-23" name="aprobación"/>
          <FRBRauthor href="/cl/senado"/>
          <FRBRcountry value="cl"/>
        </FRBRWork>
        <FRBRExpression>
          <FRBRthis value="/cl/boletin/15995-02/2do-tramite/esp@2024-04-23"/>
          <FRBRuri value="/cl/boletin/15995-02/esp@2024-04-23"/>
          <FRBRdate date="2024-04-23" name="versión"/>
          <FRBRlanguage language="spa"/>
        </FRBRExpression>
        <FRBRManifestation>
          <FRBRthis value="/cl/boletin/15995-02/2do-tramite/esp@2024-04-23/akn"/>
          <FRBRuri value="/cl/boletin/15995-02/esp@2024-04-23/akn"/>
          <FRBRdate date="2026-02-19" name="generación"/>
        </FRBRManifestation>
      </identification>
      <references>
        <TLCOrganization eId="senado" href="/cl/senado" showAs="Senado de la República"/>
      </references>
    </meta>
    <preface>
      <longTitle>
        <p><docTitle>2do Trámite: Senado</docTitle></p>
      </longTitle>
      <p>Oficio N°178 — El Senado aprueba con modificaciones. Ajusta redacción del inciso 4° ("que estén cursando" → "que cursen", "durante la realización de" → "mientras realicen") y del inciso 5° ("en las actuaciones que realicen" → "en cualquier actuación en la que participen"). Votación: 31-0-2 (quórum calificado).</p>
    </preface>
    <amendmentBody>
      <amendmentContent>
        <p>El Senado ha aprobado el proyecto con las siguientes modificaciones al artículo único:</p>
        <p>En el inciso cuarto propuesto: se reemplaza "que estén cursando" por "que cursen" y "durante la realización de los periodos" por "mientras realicen los periodos".</p>
        <p>En el inciso quinto propuesto: se reemplaza "en las actuaciones que realicen durante los periodos" por "en cualquier actuación en la que participen durante los periodos".</p>
      </amendmentContent>
    </amendmentBody>
    <akndiff:changeSet
      base="/cl/boletin/15995-02/esp@2024-03-11"
      result="/cl/boletin/15995-02/esp@2024-04-23">
      <akndiff:vote date="2024-04-23" result="approved" source="/cl/senado/sesion/13-372">
        <akndiff:for>
${voterXml}
        </akndiff:for>
        <akndiff:against/>
        <akndiff:abstain>
${abstainXml}
        </akndiff:abstain>
      </akndiff:vote>
      <akndiff:articleChange article="art_6_inc4" type="substitute">
        <akndiff:old>${escapeXml(INC4_1ER_TRAMITE)}</akndiff:old>
        <akndiff:new>${escapeXml(INC4_SENADO)}</akndiff:new>
      </akndiff:articleChange>
      <akndiff:articleChange article="art_6_inc5" type="substitute">
        <akndiff:old>${escapeXml(INC5_1ER_TRAMITE)}</akndiff:old>
        <akndiff:new>${escapeXml(INC5_SENADO)}</akndiff:new>
      </akndiff:articleChange>
    </akndiff:changeSet>
  </amendment>
</akomaNtoso>`;
  return xml;
}

// ============================================================
// GENERATE: 05-act-final.xml (Ley 21.670 publicada)
// ============================================================
function generateFinal() {
  const art6Incisos = [INC1, INC2, INC3_REFORMED, INC4_SENADO, INC5_SENADO, INC4_ORIGINAL];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
  <act name="ley-21670">
    <meta>
      <identification source="#parlamento-ai">
        <FRBRWork>
          <FRBRthis value="/cl/ley/21670"/>
          <FRBRuri value="/cl/ley/21670"/>
          <FRBRdate date="2024-06-13" name="publicación"/>
          <FRBRauthor href="/cl/congreso"/>
          <FRBRcountry value="cl"/>
        </FRBRWork>
        <FRBRExpression>
          <FRBRthis value="/cl/ley/21670/esp@2024-06-13"/>
          <FRBRuri value="/cl/ley/21670/esp@2024-06-13"/>
          <FRBRdate date="2024-06-13" name="versión"/>
          <FRBRlanguage language="spa"/>
        </FRBRExpression>
        <FRBRManifestation>
          <FRBRthis value="/cl/ley/21670/esp@2024-06-13/akn"/>
          <FRBRuri value="/cl/ley/21670/esp@2024-06-13/akn"/>
          <FRBRdate date="2026-02-19" name="generación"/>
        </FRBRManifestation>
      </identification>
    </meta>
    <preface>
      <longTitle>
        <p>Ley N° <docTitle>Ley 21.670 — Porte de Armas Aspirantes Policiales</docTitle></p>
      </longTitle>
      <p>Modifica la ley N°17.798, sobre Control de Armas, para autorizar el porte de armas por los aspirantes a oficiales de Carabineros y por los carabineros alumnos desde el año de formación que indica, mientras realizan sus respectivas prácticas profesionales. Publicada en el Diario Oficial el 13 de junio de 2024.</p>
    </preface>
    <body>
      <article eId="art_6">
        <heading>Artículo 6 (texto reformado)</heading>
        <content>
${buildArt6Content(art6Incisos)}
        </content>
      </article>
    </body>
  </act>
</akomaNtoso>`;
  return xml;
}

// ============================================================
// MAIN
// ============================================================
const files = [
  { name: '01-act-original.xml', gen: generateOriginal },
  { name: '02-bill.xml', gen: generateBill },
  { name: '03-amendment-1.xml', gen: generateAmendment1 },
  { name: '04-amendment-2.xml', gen: generateAmendment2 },
  { name: '05-act-final.xml', gen: generateFinal },
];

for (const { name, gen } of files) {
  const xml = gen();
  const outPath = join(OUT_DIR, name);
  writeFileSync(outPath, xml, 'utf-8');
  console.log(`  ${name} (${xml.length} chars)`);
}

console.log(`\nGenerated ${files.length} AKN files in ${OUT_DIR}`);
