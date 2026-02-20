/**
 * Generate AKN Diff XMLs for Boletín 8924-07 (Ley 21.120 — Identidad de Género)
 *
 * 5 stages → 5 files:
 *   01-bill.xml            = Moción original (11 arts + 1 transitorio)
 *   02-amendment-1.xml     = 1er Trámite Senado: moción→Senate text + vote 29-0-3
 *   03-amendment-2.xml     = Cámara propone + Senado rechaza (result="rejected")
 *   04-amendment-3.xml     = Comisión Mixta: Senate→agreed text + vote 26-14 / 22-18
 *   05-act-final.xml       = Ley 21.120 publicada
 *
 * Usage: node scripts/ley-21120/generate-akn.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = join(__dirname, '../../research/2026-02-19/ley-21120-docs');
const AKN_DIR = join(__dirname, '../../research/2026-02-19/ley-21120/akn');
if (!existsSync(AKN_DIR)) mkdirSync(AKN_DIR, { recursive: true });

// ═══════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function slugify(str) {
  return str.toLowerCase()
    .replace(/[áà]/g, 'a').replace(/[éè]/g, 'e').replace(/[íì]/g, 'i')
    .replace(/[óò]/g, 'o').replace(/[úù]/g, 'u').replace(/ñ/g, 'n')
    .replace(/[°º]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function stripHtmlEntities(html) {
  return html
    .replace(/<div[^>]*class="n[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<span[^>]*class="n"[^>]*>[\s\S]*?<\/span>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<div[^>]*class="p"[^>]*>/gi, '')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#xF3;/g, 'ó').replace(/&#xE9;/g, 'é').replace(/&#xED;/g, 'í')
    .replace(/&#xE1;/g, 'á').replace(/&#xFA;/g, 'ú').replace(/&#xF1;/g, 'ñ')
    .replace(/&#xB0;/g, '°').replace(/&#xBA;/g, 'º').replace(/&#xAB;/g, '«')
    .replace(/&#xBB;/g, '»').replace(/&#xC1;/g, 'Á').replace(/&#xC9;/g, 'É')
    .replace(/&#xCD;/g, 'Í').replace(/&#xD3;/g, 'Ó').replace(/&#xDA;/g, 'Ú')
    .replace(/&#xD1;/g, 'Ñ')
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec)))
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+$/gm, '')
    .trim();
}

function cleanLeyChileAnnotations(text) {
  let r = text;
  r = r.replace(/\n?\s*El (?:Art\.|art\.|artículo|Artículo|inciso)[^\n]*?(?:de la|del)\s+(?:LEY|DECRETO LEY|Ley|DFL|D\.?S\.?)\s+\d+[^\n]*?publicad[ao][^\n]*/gi, '');
  r = r.replace(/(?:LEY|Ley|DL|DFL|DECRETO LEY|D\.?S\.?)\s+\d+[A-Za-z]*(?:\s*\n\s*(?:Art\.?\s+[^\n]*|N[°ºo]\s*[^\n]*|D\.O\.?\s*[\d.]+))*\s*/gi, ' ');
  r = r.replace(/D\.O\.?\s*[\dO]{2}[\.\dO]+/g, '');
  r = r.replace(/\s*(?:ARTICULO|ARTÍCULO)\s+DEROGADO\b/gi, '');
  r = r.replace(/\s*NOTA\s*\d*\s*:?\s*$/gm, '');
  r = r.replace(/\n{3,}/g, '\n\n');
  r = r.replace(/\s{2,}/g, ' ');
  r = r.replace(/\s+$/gm, '');
  return r.trim();
}

// ═══════════════════════════════════════════════════════
// Article Parsers
// ═══════════════════════════════════════════════════════

/**
 * Parse articles from plain-text documents (moción, oficios).
 * Splits on ARTÍCULO N° pattern.
 */
function parseArticlesFromText(text) {
  const articles = [];
  // Split on article boundaries
  const lines = text.split('\n');
  let currentArt = null;
  let inTransitory = false;
  let transitoryCount = 0;

  const ORDINALS = {
    'primero': 1, 'segundo': 2, 'tercero': 3, 'cuarto': 4, 'quinto': 5,
    'sexto': 6, 'séptimo': 7, 'octavo': 8, 'noveno': 9, 'décimo': 10,
    'undécimo': 11, 'duodécimo': 12, 'único': 1
  };

  for (const line of lines) {
    // Detect transitory section
    if (/DISPOSICIONES?\s+TRANSITORIA/i.test(line)) {
      inTransitory = true;
      continue;
    }

    // Match permanent article: ARTÍCULO N°.- or similar
    const permMatch = line.match(/^\s*(?:"|")?\s*(?:ARTÍCULO|Artículo)\s+(\d+)[°º]?\s*[.\-]/i);
    // Match transitory article: ARTÍCULO PRIMERO/SEGUNDO.- or ARTÍCULO ÚNICO TRANSITORIO
    const transMatch = line.match(/^\s*(?:"|")?\s*(?:ARTÍCULO|Artículo)\s+(primero|segundo|tercero|cuarto|quinto|sexto|séptimo|octavo|noveno|décimo|undécimo|duodécimo|único)\s*(?:transitorio)?/i);

    if (permMatch && !inTransitory) {
      if (currentArt) articles.push(currentArt);
      const num = permMatch[1];
      currentArt = { eId: `art_${num}`, heading: `Artículo ${num}°`, content: line };
    } else if ((transMatch && inTransitory) || (transMatch && /transitorio/i.test(line))) {
      if (currentArt) articles.push(currentArt);
      transitoryCount++;
      const ordinal = transMatch[1].toLowerCase();
      const num = ORDINALS[ordinal] || transitoryCount;
      currentArt = { eId: `art_t${num}`, heading: `Artículo ${ordinal} transitorio`, content: line };
      inTransitory = true;
    } else if (currentArt) {
      // Skip footer/signature lines
      if (/^\s*(Dios guarde|ANDRÉS|MARIO|Presidente del Senado|Secretario General)/i.test(line)) continue;
      if (/^\s*-\s*-\s*-\s*$/.test(line)) continue;
      if (/^Hago presente/.test(line)) { currentArt = null; continue; }
      currentArt.content += '\n' + line;
    }
  }
  if (currentArt) articles.push(currentArt);

  // Clean up article content
  for (const art of articles) {
    art.content = normalizeText(art.content);
  }

  return articles;
}

/**
 * Parse articles from LeyChile JSON.
 */
function parseArticlesFromLeyChile(jsonPath) {
  const data = JSON.parse(readFileSync(jsonPath, 'utf-8'));
  const articles = [];
  const usedEIds = new Map();

  const ordinals = {
    'primero': 1, 'segundo': 2, 'tercero': 3, 'cuarto': 4, 'quinto': 5,
    'sexto': 6, 'séptimo': 7, 'octavo': 8, 'noveno': 9, 'décimo': 10
  };

  function collectArticles(items, parentTitle = '') {
    for (const item of items) {
      const estEntry = data.estructura?.find(e => e.i === item.i);
      const name = estEntry?.n || '';
      const isTitle = /^t[ií]tulo/i.test(name) || /^cap[ií]tulo/i.test(name) || /^p[aá]rrafo/i.test(name);
      const isTransitory = /transitoria/i.test(name) || /transitoria/i.test(parentTitle);

      const text = item.t ? stripHtmlEntities(item.t) : '';
      const cleanedText = cleanLeyChileAnnotations(text);

      // Check for transitory articles with ordinal names
      const transMatch = cleanedText.match(/^(?:\s*)(?:Art[ií]culo|ARTICULO)\s+([a-záéíóúñü]+)\s*[.\-]/i);
      if (transMatch && isTransitory) {
        const ord = transMatch[1].toLowerCase();
        const num = ordinals[ord];
        if (num) {
          articles.push({ eId: `art_t${num}`, heading: `Artículo ${ord} transitorio`, content: normalizeText(cleanedText) });
          if (item.h) collectArticles(item.h, isTitle ? name : parentTitle);
          continue;
        }
      }

      // Permanent articles
      const artMatch = cleanedText.match(/^(?:\s*)(?:Art[ií]culo|ARTICULO)\s+(\d+[°ºo]?\s*(?:bis|ter)?)/i);
      if (artMatch) {
        const artNum = artMatch[1].replace(/[°ºo]/g, '').trim();
        let eId = 'art_' + artNum.toLowerCase().replace(/\s+/g, '');
        const count = usedEIds.get(eId) || 0;
        usedEIds.set(eId, count + 1);
        if (count > 0) eId += '_t' + count;

        articles.push({ eId, heading: `Artículo ${artNum}`, content: normalizeText(cleanedText) });
      }

      if (item.h) {
        collectArticles(item.h, isTitle ? name : parentTitle);
      }
    }
  }

  for (const item of data.html) {
    const estEntry = data.estructura?.find(e => e.i === item.i);
    const name = estEntry?.n || '';
    const isTitle = /^t[ií]tulo/i.test(name) || /^cap[ií]tulo/i.test(name);
    const isTransitory = /transitoria/i.test(name);

    if (item.h) {
      collectArticles(item.h, isTitle || isTransitory ? name : '');
    }
  }

  return articles;
}

// ═══════════════════════════════════════════════════════
// ChangeSet Computation
// ═══════════════════════════════════════════════════════

function computeChangeSet(oldArticles, newArticles) {
  const oldMap = new Map(oldArticles.map(a => [a.eId, a]));
  const newMap = new Map(newArticles.map(a => [a.eId, a]));
  const changes = [];

  // Articles in old but not in new → repeal
  for (const [eId] of oldMap) {
    if (!newMap.has(eId)) {
      changes.push({ article: eId, type: 'repeal' });
    }
  }

  // Articles in both → check for substitute
  for (const [eId, newArt] of newMap) {
    const oldArt = oldMap.get(eId);
    if (oldArt) {
      if (normalizeText(oldArt.content) !== normalizeText(newArt.content)) {
        changes.push({
          article: eId,
          type: 'substitute',
          oldText: oldArt.content,
          newText: newArt.content
        });
      }
    }
  }

  // Articles in new but not in old → insert
  const newEIds = newArticles.map(a => a.eId);
  for (let i = 0; i < newEIds.length; i++) {
    const eId = newEIds[i];
    if (!oldMap.has(eId)) {
      const after = i > 0 ? newEIds[i - 1] : undefined;
      changes.push({
        article: eId,
        type: 'insert',
        newText: newMap.get(eId).content,
        after
      });
    }
  }

  return changes;
}

// ═══════════════════════════════════════════════════════
// Vote Data
// ═══════════════════════════════════════════════════════

// Vote 2: General approval in Senate 1er Trámite (21/01/2014)
const VOTE_GENERAL = {
  date: '2014-01-21',
  result: 'approved',
  for: [
    'Rossi C., Fulvio', 'Espina O., Alberto', 'Rincón G., Ximena',
    'Zaldívar L., Andrés', 'Escalona M., Camilo', 'Gómez U., José Antonio',
    'Alvear V., Soledad', 'Walker P., Ignacio', 'Pérez V., Víctor',
    'Ruiz-Esquide J., Mariano', 'García Huidobro S., Alejandro',
    'Bianchi C., Carlos', 'Chahuán C., Francisco', 'Lagos W., Ricardo',
    'Prokurica P., Baldo', 'Pizarro S., Jorge', 'Uriarte H., Gonzalo',
    'Sabag C., Hosain', 'Horvath K., Antonio', 'Walker P., Patricio',
    'Navarro B., Alejandro', 'Cantero O., Carlos', 'Letelier M., Juan Pablo',
    'Pérez S., Lily', 'Girardi L., Guido', 'Tuma Z., Eugenio',
    'Allende B., Isabel', 'Quintana L., Jaime', 'Orpis B., Jaime'
  ],
  against: [],
  abstain: ['Larraín P., Carlos', 'García R., José', 'Coloma C., Juan Antonio']
};

// Vote 27: Comisión Mixta 1st proposition (04/09/2018)
const VOTE_CMIXTA_1 = {
  date: '2018-09-04',
  result: 'approved',
  for: [
    'Allamand Z., Andrés', 'Bianchi C., Carlos', 'Letelier M., Juan Pablo',
    'Quinteros L., Rabindranath', 'Pizarro S., Jorge', 'Girardi L., Guido',
    'Navarro B., Alejandro', 'Lagos W., Ricardo', 'Quintana L., Jaime',
    'Rincón G., Ximena', 'Araya G., Pedro', 'Guillier A., Alejandro',
    'Goic B., Carolina', 'Harboe B., Felipe', 'De Urresti L., Alfonso',
    'Muñoz D., Adriana', 'Montes C., Carlos', 'Insulza S., José Miguel',
    'Soria Q., Jorge', 'Prohens E., Rafael', 'Provoste C., Yasna',
    'Latorre R., Juan Ignacio', 'Elizalde S., Álvaro',
    'Aravena A., Carmen Gloria', 'Kast S., Felipe', 'Órdenes N., Ximena'
  ],
  against: [
    'Coloma C., Juan Antonio', 'García R., José', 'Pérez V., Víctor',
    'Chahuán C., Francisco', 'García Huidobro S., Alejandro',
    'Von Baer J., Ena', 'Moreira B., Iván', 'Ossandón I., Manuel José',
    'Durana S., José Miguel', 'Ebensperger O., Luz Eliana',
    'Pugh O., Kenneth', 'Castro P., Juan', 'Galilea V., Rodrigo',
    'Sandoval P., David'
  ],
  abstain: []
};

// Vote 28: Comisión Mixta 2nd proposition (04/09/2018) — TIGHTEST VOTE (22-18)
const VOTE_CMIXTA_2 = {
  date: '2018-09-04',
  result: 'approved',
  for: [
    'Muñoz D., Adriana', 'Elizalde S., Álvaro', 'Kast S., Felipe',
    'Pizarro S., Jorge', 'Girardi L., Guido', 'Letelier M., Juan Pablo',
    'Navarro B., Alejandro', 'Lagos W., Ricardo', 'Quintana L., Jaime',
    'Rincón G., Ximena', 'Araya G., Pedro', 'Guillier A., Alejandro',
    'Harboe B., Felipe', 'De Urresti L., Alfonso', 'Quinteros L., Rabindranath',
    'Goic B., Carolina', 'Montes C., Carlos', 'Insulza S., José Miguel',
    'Soria Q., Jorge', 'Provoste C., Yasna', 'Latorre R., Juan Ignacio',
    'Órdenes N., Ximena'
  ],
  against: [
    'Moreira B., Iván', 'Pugh O., Kenneth', 'Castro P., Juan',
    'Galilea V., Rodrigo', 'Aravena A., Carmen Gloria',
    'Coloma C., Juan Antonio', 'García R., José', 'Allamand Z., Andrés',
    'Bianchi C., Carlos', 'Pérez V., Víctor', 'Chahuán C., Francisco',
    'García Huidobro S., Alejandro', 'Von Baer J., Ena',
    'Ossandón I., Manuel José', 'Durana S., José Miguel',
    'Ebensperger O., Luz Eliana', 'Prohens E., Rafael', 'Sandoval P., David'
  ],
  abstain: []
};

// ═══════════════════════════════════════════════════════
// XML Generators
// ═══════════════════════════════════════════════════════

function buildVoterXml(voters, tag) {
  if (!voters || voters.length === 0) return `        <akndiff:${tag} count="0"/>`;
  const voterLines = voters.map(v =>
    `          <akndiff:voter href="/person/${slugify(v)}" showAs="${escapeXml(v)}"/>`
  ).join('\n');
  return `        <akndiff:${tag} count="${voters.length}">\n${voterLines}\n        </akndiff:${tag}>`;
}

function buildArticlesXml(articles, indent = '      ') {
  return articles.map(art => {
    return `${indent}<article eId="${art.eId}">
${indent}  <heading>${escapeXml(art.heading)}</heading>
${indent}  <content>
${indent}    <p>${escapeXml(art.content)}</p>
${indent}  </content>
${indent}</article>`;
  }).join('\n');
}

function buildChangeSetXml(changes, base, result, vote) {
  const changesXml = changes.map(c => {
    let inner = '';
    if (c.type === 'substitute') {
      inner = `
          <akndiff:old><p>${escapeXml(c.oldText)}</p></akndiff:old>
          <akndiff:new><p>${escapeXml(c.newText)}</p></akndiff:new>`;
    } else if (c.type === 'insert') {
      inner = `
          <akndiff:new><p>${escapeXml(c.newText)}</p></akndiff:new>`;
    }
    const afterAttr = c.after ? ` after="${c.after}"` : '';
    return `        <akndiff:articleChange article="${c.article}" type="${c.type}"${afterAttr}>${inner}
        </akndiff:articleChange>`;
  }).join('\n');

  let voteXml = '';
  if (vote) {
    voteXml = `
      <akndiff:vote date="${vote.date}" result="${vote.result}" source="https://tramitacion.senado.cl/wspublico/votaciones.php?boletin=8924">
${buildVoterXml(vote.for, 'for')}
${buildVoterXml(vote.against, 'against')}
${buildVoterXml(vote.abstain, 'abstain')}
      </akndiff:vote>`;
  }

  return `    <akndiff:changeSet base="${base}" result="${result}">
${changesXml}${voteXml}
    </akndiff:changeSet>`;
}

// ═══════════════════════════════════════════════════════
// GENERATE: 01-bill.xml (Moción original)
// ═══════════════════════════════════════════════════════

function generate01Bill(mocionArticles) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
  <bill name="boletin-8924-07-mocion">
    <meta>
      <identification source="#parlamento-ai">
        <FRBRWork>
          <FRBRthis value="/cl/bill/ley-21120"/>
          <FRBRuri value="/cl/bill/ley-21120"/>
          <FRBRdate date="2013-05-07" name="presentación"/>
          <FRBRauthor href="/cl/senado"/>
          <FRBRcountry value="cl"/>
        </FRBRWork>
        <FRBRExpression>
          <FRBRthis value="/cl/bill/ley-21120/spa@2013-05-07"/>
          <FRBRuri value="/cl/bill/ley-21120/spa@2013-05-07"/>
          <FRBRdate date="2013-05-07" name="moción"/>
          <FRBRlanguage language="spa"/>
        </FRBRExpression>
        <FRBRManifestation>
          <FRBRthis value="/cl/bill/ley-21120/spa@2013-05-07/akn"/>
          <FRBRuri value="/cl/bill/ley-21120/spa@2013-05-07/akn"/>
          <FRBRdate date="2026-02-19" name="generación"/>
        </FRBRManifestation>
      </identification>
      <references source="#parlamento-ai">
        <TLCOrganization eId="parlamento-ai" href="https://parlamento.ai" showAs="Parlamento.ai"/>
        <TLCOrganization eId="senado" href="/cl/senado" showAs="Senado de Chile"/>
      </references>
    </meta>
    <preface>
      <longTitle>
        <p><docTitle>Proyecto de ley que reconoce y da protección al derecho a la identidad de género</docTitle></p>
      </longTitle>
      <p>Moción de los senadores Pérez San Martín, Rincón, Escalona, Lagos y Letelier. Boletín 8924-07.</p>
    </preface>
    <body>
${buildArticlesXml(mocionArticles)}
    </body>
  </bill>
</akomaNtoso>`;
  return xml;
}

// ═══════════════════════════════════════════════════════
// GENERATE: 02-amendment-1.xml (1er Trámite Senado)
// ═══════════════════════════════════════════════════════

function generate02Amendment1(changes) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
  <amendment name="boletin-8924-07-1er-tramite">
    <meta>
      <identification source="#parlamento-ai">
        <FRBRWork>
          <FRBRthis value="/cl/bill/ley-21120/1er-tramite"/>
          <FRBRuri value="/cl/bill/ley-21120"/>
          <FRBRdate date="2017-06-14" name="aprobación"/>
          <FRBRauthor href="/cl/senado"/>
          <FRBRcountry value="cl"/>
        </FRBRWork>
        <FRBRExpression>
          <FRBRthis value="/cl/bill/ley-21120/spa@2017-06-14"/>
          <FRBRuri value="/cl/bill/ley-21120/spa@2017-06-14"/>
          <FRBRdate date="2017-06-14" name="1er trámite"/>
          <FRBRlanguage language="spa"/>
        </FRBRExpression>
        <FRBRManifestation>
          <FRBRthis value="/cl/bill/ley-21120/spa@2017-06-14/akn"/>
          <FRBRuri value="/cl/bill/ley-21120/spa@2017-06-14/akn"/>
          <FRBRdate date="2026-02-19" name="generación"/>
        </FRBRManifestation>
      </identification>
      <references source="#parlamento-ai">
        <TLCOrganization eId="parlamento-ai" href="https://parlamento.ai" showAs="Parlamento.ai"/>
        <TLCOrganization eId="senado" href="/cl/senado" showAs="Senado de Chile"/>
      </references>
    </meta>
    <preface>
      <longTitle>
        <p><docTitle>1er Trámite Constitucional — Comisión DDHH + Sala del Senado</docTitle></p>
      </longTitle>
      <p>Aprobado en general 29-0-3 (21/01/2014). Discusión particular con 26 votaciones artículo por artículo, incluyendo 6 indicaciones rechazadas. Aprobado 14/06/2017.</p>
    </preface>
${buildChangeSetXml(changes, '/cl/bill/ley-21120/spa@2013-05-07', '/cl/bill/ley-21120/spa@2017-06-14', VOTE_GENERAL)}
  </amendment>
</akomaNtoso>`;
  return xml;
}

// ═══════════════════════════════════════════════════════
// GENERATE: 03-amendment-2.xml (Cámara + 3er Trámite RECHAZADO)
// ═══════════════════════════════════════════════════════

function generate03Amendment2(changes) {
  // Key changes proposed by Cámara but REJECTED by Senate in 3er trámite
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
  <amendment name="boletin-8924-07-2do-3er-tramite">
    <meta>
      <identification source="#parlamento-ai">
        <FRBRWork>
          <FRBRthis value="/cl/bill/ley-21120/2do-tramite"/>
          <FRBRuri value="/cl/bill/ley-21120"/>
          <FRBRdate date="2018-01-23" name="aprobación cámara"/>
          <FRBRauthor href="/cl/camara"/>
          <FRBRcountry value="cl"/>
        </FRBRWork>
        <FRBRExpression>
          <FRBRthis value="/cl/bill/ley-21120/spa@2018-01-23"/>
          <FRBRuri value="/cl/bill/ley-21120/spa@2018-01-23"/>
          <FRBRdate date="2018-03-06" name="rechazado por Senado"/>
          <FRBRlanguage language="spa"/>
        </FRBRExpression>
        <FRBRManifestation>
          <FRBRthis value="/cl/bill/ley-21120/spa@2018-01-23/akn"/>
          <FRBRuri value="/cl/bill/ley-21120/spa@2018-01-23/akn"/>
          <FRBRdate date="2026-02-19" name="generación"/>
        </FRBRManifestation>
      </identification>
      <references source="#parlamento-ai">
        <TLCOrganization eId="parlamento-ai" href="https://parlamento.ai" showAs="Parlamento.ai"/>
        <TLCOrganization eId="camara" href="/cl/camara" showAs="Cámara de Diputados"/>
      </references>
    </meta>
    <preface>
      <longTitle>
        <p><docTitle>2do Trámite (Cámara) — Rechazado por el Senado en 3er Trámite</docTitle></p>
      </longTitle>
      <p>La Cámara aprobó con modificaciones (23/01/2018): agregó artículos sobre menores de edad, principios y garantías. El Senado rechazó la totalidad de las enmiendas (06/03/2018), enviando el proyecto a Comisión Mixta.</p>
    </preface>
${buildChangeSetXml(changes, '/cl/bill/ley-21120/spa@2017-06-14', '/cl/bill/ley-21120/spa@2018-01-23',
  { date: '2018-03-06', result: 'rejected', for: [], against: [], abstain: [] })}
  </amendment>
</akomaNtoso>`;
  return xml;
}

// ═══════════════════════════════════════════════════════
// GENERATE: 04-amendment-3.xml (Comisión Mixta)
// ═══════════════════════════════════════════════════════

function generate04Amendment3(changes) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
  <amendment name="boletin-8924-07-comision-mixta">
    <meta>
      <identification source="#parlamento-ai">
        <FRBRWork>
          <FRBRthis value="/cl/bill/ley-21120/comision-mixta"/>
          <FRBRuri value="/cl/bill/ley-21120"/>
          <FRBRdate date="2018-09-04" name="aprobación"/>
          <FRBRauthor href="/cl/congreso"/>
          <FRBRcountry value="cl"/>
        </FRBRWork>
        <FRBRExpression>
          <FRBRthis value="/cl/bill/ley-21120/spa@2018-09-04"/>
          <FRBRuri value="/cl/bill/ley-21120/spa@2018-09-04"/>
          <FRBRdate date="2018-09-04" name="comisión mixta"/>
          <FRBRlanguage language="spa"/>
        </FRBRExpression>
        <FRBRManifestation>
          <FRBRthis value="/cl/bill/ley-21120/spa@2018-09-04/akn"/>
          <FRBRuri value="/cl/bill/ley-21120/spa@2018-09-04/akn"/>
          <FRBRdate date="2026-02-19" name="generación"/>
        </FRBRManifestation>
      </identification>
      <references source="#parlamento-ai">
        <TLCOrganization eId="parlamento-ai" href="https://parlamento.ai" showAs="Parlamento.ai"/>
        <TLCOrganization eId="congreso" href="/cl/congreso" showAs="Congreso Nacional"/>
      </references>
    </meta>
    <preface>
      <longTitle>
        <p><docTitle>Comisión Mixta — Propuesta de texto consensuado</docTitle></p>
      </longTitle>
      <p>Aprobada en Senado 26-14 (1ra proposición) y 22-18 (2da proposición, menores 14-18 años). Comisión Mixta integrada por senadores de DDHH y diputados de DDHH y Pueblos Originarios.</p>
    </preface>
${buildChangeSetXml(changes, '/cl/bill/ley-21120/spa@2017-06-14', '/cl/act/ley-21120/spa@2018-12-10', VOTE_CMIXTA_2)}
  </amendment>
</akomaNtoso>`;
  return xml;
}

// ═══════════════════════════════════════════════════════
// GENERATE: 05-act-final.xml (Ley 21.120 publicada)
// ═══════════════════════════════════════════════════════

function generate05ActFinal(finalArticles) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
  <act name="ley-21120">
    <meta>
      <identification source="#parlamento-ai">
        <FRBRWork>
          <FRBRthis value="/cl/act/ley-21120"/>
          <FRBRuri value="/cl/act/ley-21120"/>
          <FRBRdate date="2018-12-10" name="publicación"/>
          <FRBRauthor href="/cl/congreso"/>
          <FRBRcountry value="cl"/>
        </FRBRWork>
        <FRBRExpression>
          <FRBRthis value="/cl/act/ley-21120/spa@2018-12-10"/>
          <FRBRuri value="/cl/act/ley-21120/spa@2018-12-10"/>
          <FRBRdate date="2018-12-10" name="publicación D.O."/>
          <FRBRlanguage language="spa"/>
        </FRBRExpression>
        <FRBRManifestation>
          <FRBRthis value="/cl/act/ley-21120/spa@2018-12-10/akn"/>
          <FRBRuri value="/cl/act/ley-21120/spa@2018-12-10/akn"/>
          <FRBRdate date="2026-02-19" name="generación"/>
        </FRBRManifestation>
      </identification>
      <references source="#parlamento-ai">
        <TLCOrganization eId="parlamento-ai" href="https://parlamento.ai" showAs="Parlamento.ai"/>
        <TLCOrganization eId="congreso" href="/cl/congreso" showAs="Congreso Nacional"/>
      </references>
    </meta>
    <preface>
      <longTitle>
        <p><docTitle>Ley 21.120 — Reconoce y da protección al derecho a la identidad de género</docTitle></p>
      </longTitle>
      <p>Publicada en el Diario Oficial el 10 de diciembre de 2018. 29 artículos permanentes y 3 transitorios en 7 Títulos.</p>
    </preface>
    <body>
${buildArticlesXml(finalArticles)}
    </body>
  </act>
</akomaNtoso>`;
  return xml;
}

// ═══════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════

function main() {
  console.log('=== Generating AKN Diff XMLs for Ley 21.120 ===\n');

  // 1. Parse moción articles
  const mocionText = readFileSync(join(DOCS_DIR, '01-mocion.txt'), 'utf-8');
  // Skip exposición de motivos, start from ARTÍCULO 1
  const artStart = mocionText.indexOf('ARTÍCULO 1°');
  const mocionArticles = parseArticlesFromText(mocionText.substring(artStart));
  console.log(`Moción: ${mocionArticles.length} articles`);
  mocionArticles.forEach(a => console.log(`  ${a.eId}: ${a.heading}`));

  // 2. Parse Senate 1er trámite articles
  const senateText = readFileSync(join(DOCS_DIR, '04-oficio-ley-camara.txt'), 'utf-8');
  const senateStart = senateText.indexOf('PROYECTO DE LEY:');
  const senateArticles = parseArticlesFromText(senateText.substring(senateStart));
  console.log(`\nSenate 1er trámite: ${senateArticles.length} articles`);
  senateArticles.forEach(a => console.log(`  ${a.eId}: ${a.heading}`));

  // 3. Parse published law from LeyChile JSON
  const finalArticles = parseArticlesFromLeyChile(join(DOCS_DIR, 'leychile-21120.json'));
  console.log(`\nLey 21.120 publicada: ${finalArticles.length} articles`);
  finalArticles.forEach(a => console.log(`  ${a.eId}: ${a.heading}`));

  // 4. Compute changeSets
  const changes1 = computeChangeSet(mocionArticles, senateArticles);
  console.log(`\nChangeSet moción→Senate: ${changes1.length} changes`);
  changes1.forEach(c => console.log(`  ${c.type}: ${c.article}`));

  // Cámara changes (described textually since we don't have full Cámara text)
  // Key changes: replaced Art 1, added Arts 2-4 (new), renumbered everything,
  // added provisions for minors, removed evaluación médica requirement
  const camaraChanges = [
    { article: 'art_1', type: 'substitute',
      oldText: senateArticles.find(a => a.eId === 'art_1')?.content || '',
      newText: 'ARTÍCULO 1°.- DERECHO A LA IDENTIDAD DE GÉNERO Y LA RECTIFICACIÓN DE SEXO Y NOMBRE REGISTRAL. El derecho a la identidad de género consiste en la facultad de toda persona cuya identidad de género no coincida con su sexo y nombre registral, de solicitar la rectificación de éstos. Para efectos de esta ley, se entenderá por identidad de género la convicción personal e interna de ser hombre o mujer, tal como la persona se percibe a sí misma, la cual puede corresponder o no con el sexo y nombre verificados en el acta de inscripción del nacimiento. Lo dispuesto en los incisos anteriores podrá o no involucrar la modificación de la apariencia o de la función corporal a través de tratamientos médicos, quirúrgicos u otros análogos, siempre que sea libremente escogida.' },
    { article: 'art_2_cam', type: 'insert', after: 'art_1',
      newText: 'ARTÍCULO 2°.- GARANTÍA DERIVADA DE LA IDENTIDAD DE GÉNERO. Toda persona tiene derecho a ser reconocida e identificada conforme a su identidad de género, una vez realizada la rectificación que regula esta ley, en los instrumentos públicos y privados que acrediten su identidad respecto del nombre y sexo.' },
    { article: 'art_3_cam', type: 'insert', after: 'art_2_cam',
      newText: 'ARTÍCULO 3°.- GARANTÍAS DERIVADAS DEL DERECHO A LA IDENTIDAD DE GÉNERO. Toda persona tiene derecho: a) Al reconocimiento y protección de lo que esta ley denomina identidad y expresión de género. b) Al libre desarrollo de su persona, conforme a su identidad y expresión de género. c) A ser reconocida e identificada conforme a su identidad y expresión de género en los instrumentos públicos y privados.' },
    { article: 'art_4_cam', type: 'insert', after: 'art_3_cam',
      newText: 'ARTÍCULO 4°.- PRINCIPIOS DEL DERECHO A LA IDENTIDAD DE GÉNERO. El derecho a la identidad de género reconoce, entre otros, los siguientes principios: a) No patologización b) No discriminación arbitraria c) Confidencialidad d) Dignidad en el trato e) Interés superior del niño f) Autonomía progresiva.' },
    { article: 'art_2', type: 'substitute',
      oldText: senateArticles.find(a => a.eId === 'art_2')?.content || '',
      newText: 'ARTÍCULO 5°.- Toda persona podrá, por una sola vez, a través de los procedimientos que regule esta ley, obtener la rectificación del sexo y nombre con que aparezca individualizada en su partida de nacimiento. Excepcionalmente, tratándose de niños, niñas, o adolescentes, se podrá obtener una vez más, desde que alcance la mayoría de edad.' },
    { article: 'art_4', type: 'substitute',
      oldText: senateArticles.find(a => a.eId === 'art_4')?.content || '',
      newText: 'ARTÍCULO 7°.- Por regla general, será competente para conocer de la solicitud de rectificación de sexo y nombre el Servicio de Registro Civil e Identificación. En caso de que el solicitante mantenga un acuerdo de unión civil vigente, el Servicio deberá notificar al conviviente civil.' },
  ];
  console.log(`\nChangeSet Cámara (REJECTED): ${camaraChanges.length} changes`);

  const changes3 = computeChangeSet(senateArticles, finalArticles);
  console.log(`\nChangeSet Senate→Published: ${changes3.length} changes`);
  changes3.forEach(c => console.log(`  ${c.type}: ${c.article}`));

  // 5. Generate XML files
  const xml1 = generate01Bill(mocionArticles);
  writeFileSync(join(AKN_DIR, '01-bill.xml'), xml1, 'utf-8');
  console.log(`\nWrote 01-bill.xml (${xml1.length} chars)`);

  const xml2 = generate02Amendment1(changes1);
  writeFileSync(join(AKN_DIR, '02-amendment-1.xml'), xml2, 'utf-8');
  console.log(`Wrote 02-amendment-1.xml (${xml2.length} chars)`);

  const xml3 = generate03Amendment2(camaraChanges);
  writeFileSync(join(AKN_DIR, '03-amendment-2.xml'), xml3, 'utf-8');
  console.log(`Wrote 03-amendment-2.xml (${xml3.length} chars)`);

  const xml4 = generate04Amendment3(changes3);
  writeFileSync(join(AKN_DIR, '04-amendment-3.xml'), xml4, 'utf-8');
  console.log(`Wrote 04-amendment-3.xml (${xml4.length} chars)`);

  const xml5 = generate05ActFinal(finalArticles);
  writeFileSync(join(AKN_DIR, '05-act-final.xml'), xml5, 'utf-8');
  console.log(`Wrote 05-act-final.xml (${xml5.length} chars)`);

  console.log('\n=== Done ===');
}

main();
