/**
 * Download documents for Boletín 15.995-02 (Ley 21.670) - v2
 * Fixes: proper LeyChile idNorma search, Senate docs with retries
 */
import { chromium } from 'playwright';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const DOCS_DIR = 'research/2026-02-19/ley-21670/docs';
const JSON_DIR = 'research/2026-02-19/ley-21670/json';

async function findIdNorma(page, numLey) {
  console.log(`\nSearching for Ley ${numLey} on LeyChile...`);

  // Navigate to main site first to get cookies/session
  await page.goto('https://www.bcn.cl/leychile', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Try the search API
  const searchUrl = `https://www.bcn.cl/leychile/consulta/listado_n_702?agession_id=&comp=&noression_id=&tipoNorma=30&woression_id=&numNorma=${numLey}&woression_id=&woression_id=&d-49489-p=1&total=10`;
  try {
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    const html = await page.content();

    // Look for idNorma in the search results
    const matches = [...html.matchAll(/idNorma=(\d+)/g)].map(m => m[1]);
    if (matches.length > 0) {
      console.log(`  Found idNorma candidates: ${[...new Set(matches)].join(', ')}`);
      return parseInt(matches[0]);
    }
  } catch (err) {
    console.log(`  Search page failed: ${err.message}`);
  }

  // Try navigating to LeyChile directly
  try {
    const directUrl = `https://www.bcn.cl/leychile/navegar?idNorma=&idParte=&idVersion=&tipoNorma=30&numNorma=${numLey}`;
    await page.goto(directUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);
    const finalUrl = page.url();
    const idMatch = finalUrl.match(/idNorma=(\d+)/);
    if (idMatch) {
      console.log(`  Found via redirect: idNorma=${idMatch[1]}`);
      return parseInt(idMatch[1]);
    }
    // Also check page content
    const html = await page.content();
    const contentMatch = html.match(/idNorma=(\d+)/);
    if (contentMatch) {
      console.log(`  Found in page: idNorma=${contentMatch[1]}`);
      return parseInt(contentMatch[1]);
    }
  } catch (err) {
    console.log(`  Direct navigation failed: ${err.message}`);
  }

  // Brute force: try range near known values for 1970s laws
  // Ley 17.798 is from 1972. Nearby: Ley 17.578 = 29120, so 17.798 should be ~29340
  console.log('  Trying computed range...');
  const estimatedId = 29120 + (17798 - 17578);  // ~29340
  for (let id = estimatedId - 50; id <= estimatedId + 50; id++) {
    try {
      const url = `https://nuevo.leychile.cl/servicios/Navegar/get_norma_json?idNorma=${id}`;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(800);
      const text = await page.innerText('body');
      if (text.length < 100) continue;

      // Parse just enough to check
      try {
        const data = JSON.parse(text);
        const tipos = data?.metadatos?.tipos_numeros || [];
        for (const t of tipos) {
          if (t.numero === String(numLey) || t.numero === numLey.toString().replace('.', '')) {
            console.log(`  FOUND! idNorma=${id} (${t.compuesto})`);
            return id;
          }
        }
      } catch (e) {
        // not JSON, skip
      }
    } catch (err) {
      // timeout, skip
    }
    if ((id - estimatedId + 50) % 20 === 0) console.log(`    checked ${id}...`);
  }

  return null;
}

async function downloadLeyChileVersion(page, idNorma, dateStr, outName) {
  const outPath = join(JSON_DIR, outName);
  if (existsSync(outPath)) {
    console.log(`  SKIP ${outName} (exists)`);
    return;
  }

  const url = dateStr
    ? `https://nuevo.leychile.cl/servicios/Navegar/get_norma_json?idNorma=${idNorma}&idVersion=${dateStr}`
    : `https://nuevo.leychile.cl/servicios/Navegar/get_norma_json?idNorma=${idNorma}`;

  console.log(`  Downloading ${outName}...`);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    const text = await page.innerText('body');
    writeFileSync(outPath, text, 'utf-8');
    console.log(`  -> ${outName} (${text.length} chars)`);
  } catch (err) {
    console.error(`  ERROR: ${err.message}`);
  }
}

async function downloadSenateDoc(page, iddocto, tipodoc, outName, desc) {
  const outPath = join(DOCS_DIR, outName);
  if (existsSync(outPath) && readFileSync(outPath, 'utf-8').length > 10000) {
    console.log(`  SKIP ${outName} (exists, ${readFileSync(outPath, 'utf-8').length} chars)`);
    return;
  }

  const url = `https://www.senado.cl/appsenado/index.php?mo=tramitacion&ac=getDocto&iddocto=${iddocto}&tipodoc=${tipodoc}`;
  console.log(`  Downloading ${desc}...`);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);
      const html = await page.content();

      if (html.includes('520') && html.includes('cloudflare')) {
        console.log(`    Attempt ${attempt}: 520 error, retrying...`);
        await page.waitForTimeout(5000);
        continue;
      }

      writeFileSync(outPath, html, 'utf-8');
      console.log(`  -> ${outName} (${html.length} chars)`);
      return;
    } catch (err) {
      console.log(`    Attempt ${attempt}: ${err.message}`);
      await page.waitForTimeout(3000);
    }
  }
  console.error(`  FAILED: ${outName} after 3 attempts`);
}

async function main() {
  const browser = await chromium.launch({ headless: false }); // non-headless to bypass Cloudflare
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  // === PART 1: Find Ley 17.798 idNorma ===
  const idNorma17798 = await findIdNorma(page, 17798);
  if (idNorma17798) {
    writeFileSync(join(JSON_DIR, '_idnorma-17798.txt'), String(idNorma17798));
    console.log(`\nLey 17.798 idNorma: ${idNorma17798}`);

    // Download current version
    await downloadLeyChileVersion(page, idNorma17798, null, 'ley-17798-current.json');

    // Download pre-reform (day before Ley 21.670 published: 13/06/2024)
    await downloadLeyChileVersion(page, idNorma17798, '2024-06-12', 'ley-17798-pre-reform.json');

    // Download post-reform
    await downloadLeyChileVersion(page, idNorma17798, '2024-06-13', 'ley-17798-post-reform.json');
  } else {
    console.log('\nWARNING: Could not find idNorma for Ley 17.798');
  }

  // Also find and download Ley 21.670 itself
  const idNorma21670 = await findIdNorma(page, 21670);
  if (idNorma21670) {
    writeFileSync(join(JSON_DIR, '_idnorma-21670.txt'), String(idNorma21670));
    await downloadLeyChileVersion(page, idNorma21670, null, 'ley-21670.json');
  }

  // === PART 2: Senate/Cámara documents ===
  console.log('\n=== Senate/Cámara Documents ===\n');

  const docs = [
    { id: '16536', type: 'mensaje_mocion', name: '01-mocion.html', desc: 'Moción original' },
    { id: '32945', type: 'ofic', name: '02-indicaciones-ejecutivo.html', desc: 'Indicaciones Ejecutivo' },
    { id: '26310', type: 'info', name: '03-informe-comision-camara.html', desc: 'Informe Comisión Cámara' },
    { id: '33029', type: 'ofic', name: '04-oficio-1er-tramite.html', desc: 'Oficio 1er Trámite' },
    { id: '26401', type: 'info', name: '05-informe-comision-senado.html', desc: 'Informe Comisión Senado' },
    { id: '4970', type: 'compa', name: '06-comparado-2do-tramite.html', desc: 'Comparado 2do Trámite' },
    { id: '33217', type: 'ofic', name: '07-oficio-modificaciones-senado.html', desc: 'Oficio Modificaciones Senado' },
    { id: '33294', type: 'ofic', name: '08-oficio-ley-ejecutivo.html', desc: 'Oficio Ley al Ejecutivo' },
  ];

  for (const doc of docs) {
    await downloadSenateDoc(page, doc.id, doc.type, doc.name, doc.desc);
    await page.waitForTimeout(2000);
  }

  await browser.close();
  console.log('\n=== Done ===');
}

main().catch(console.error);
