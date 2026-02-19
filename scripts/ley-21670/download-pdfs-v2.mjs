/**
 * Download Senate PDFs for Boletín 15.995-02 (Ley 21.670) - v2
 * Fixes download handling: register listener BEFORE goto
 */
import { chromium } from 'playwright';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const DOCS_DIR = 'research/2026-02-19/ley-21670/docs';
const JSON_DIR = 'research/2026-02-19/ley-21670/json';

const SENATE_DOCS = [
  { id: '16536', type: 'mensaje_mocion', name: '01-mocion', desc: 'Moción original' },
  { id: '32945', type: 'ofic', name: '02-indicaciones-ejecutivo', desc: 'Indicaciones Ejecutivo' },
  { id: '26310', type: 'info', name: '03-informe-comision-camara', desc: 'Informe Comisión Cámara' },
  { id: '33029', type: 'ofic', name: '04-oficio-1er-tramite', desc: 'Oficio 1er Trámite (19265)' },
  { id: '26401', type: 'info', name: '05-informe-comision-senado', desc: 'Informe Comisión Senado' },
  { id: '4970', type: 'compa', name: '06-comparado-2do-tramite', desc: 'Comparado 2do Trámite' },
  { id: '33217', type: 'ofic', name: '07-oficio-modificaciones-senado', desc: 'Oficio Modif. Senado' },
  { id: '33294', type: 'ofic', name: '08-oficio-ley-ejecutivo', desc: 'Oficio Ley al Ejecutivo' },
];

async function downloadPdf(page, doc) {
  const pdfPath = join(DOCS_DIR, `${doc.name}.pdf`);
  if (existsSync(pdfPath)) {
    console.log(`  SKIP ${doc.name}.pdf (exists)`);
    return true;
  }

  const url = `https://www.senado.cl/appsenado/index.php?mo=tramitacion&ac=getDocto&iddocto=${doc.id}&tipodoc=${doc.type}`;
  console.log(`  Downloading ${doc.desc}...`);

  try {
    // Register download listener BEFORE navigation
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30000 }),
      page.goto(url).catch(() => {}) // goto will "fail" because it starts a download
    ]);

    await download.saveAs(pdfPath);
    console.log(`  -> ${doc.name}.pdf OK`);
    return true;
  } catch (err) {
    console.error(`  ERROR ${doc.name}: ${err.message}`);
    return false;
  }
}

async function findLey21670(page) {
  console.log('\n=== Searching Ley 21.670 on LeyChile ===');

  // We know 21.690 is at 1206100. 21.670 is 20 less, but idNormas are NOT sequential by law number.
  // Let me search a wider range with step 1 around the area
  // Also try below 1206100

  // First: check individually around 1206100 going backwards
  for (let id = 1206099; id >= 1205800; id--) {
    try {
      await page.goto(`https://nuevo.leychile.cl/servicios/Navegar/get_norma_json?idNorma=${id}`, {
        waitUntil: 'domcontentloaded', timeout: 8000
      });
      await page.waitForTimeout(500);
      const text = await page.innerText('body');
      if (text.length < 100) continue;
      const data = JSON.parse(text);
      const num = data?.metadatos?.tipos_numeros?.[0]?.numero;
      if (!num) continue;
      if (num === '21670') {
        console.log(`  FOUND! idNorma=${id}`);
        return id;
      }
      // Only log actual laws (not exentas)
      const desc = data?.metadatos?.tipos_numeros?.[0]?.descripcion || '';
      if (num.match(/^\d{4,5}$/) && !desc.includes('EXENT')) {
        console.log(`    id=${id} -> ${data?.metadatos?.tipos_numeros?.[0]?.compuesto}`);
      }
    } catch (e) { /* skip */ }
  }

  // Also try the range above 1206100
  for (let id = 1206101; id <= 1206200; id++) {
    try {
      await page.goto(`https://nuevo.leychile.cl/servicios/Navegar/get_norma_json?idNorma=${id}`, {
        waitUntil: 'domcontentloaded', timeout: 8000
      });
      await page.waitForTimeout(500);
      const text = await page.innerText('body');
      if (text.length < 100) continue;
      const data = JSON.parse(text);
      const num = data?.metadatos?.tipos_numeros?.[0]?.numero;
      if (num === '21670') {
        console.log(`  FOUND! idNorma=${id}`);
        return id;
      }
    } catch (e) { /* skip */ }
  }

  console.log('  Not found in narrow range. Trying wider...');

  // Try a much wider range with larger steps
  for (let id = 1200000; id <= 1212000; id += 500) {
    try {
      await page.goto(`https://nuevo.leychile.cl/servicios/Navegar/get_norma_json?idNorma=${id}`, {
        waitUntil: 'domcontentloaded', timeout: 8000
      });
      await page.waitForTimeout(500);
      const text = await page.innerText('body');
      if (text.length < 100) continue;
      const data = JSON.parse(text);
      const num = data?.metadatos?.tipos_numeros?.[0]?.numero;
      if (num && num.match(/^2\d{4}$/)) {
        console.log(`    id=${id} -> Ley ${num}`);
      }
    } catch (e) { /* skip */ }
  }

  return null;
}

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    acceptDownloads: true
  });
  const page = await context.newPage();

  // Part 1: Senate PDFs
  console.log('=== Downloading Senate PDFs ===\n');
  let successCount = 0;
  for (const doc of SENATE_DOCS) {
    const ok = await downloadPdf(page, doc);
    if (ok) successCount++;
    await page.waitForTimeout(1500);
  }
  console.log(`\n  Downloaded ${successCount}/${SENATE_DOCS.length} PDFs`);

  // Part 2: Find Ley 21.670
  const idNorma = await findLey21670(page);
  if (idNorma) {
    writeFileSync(join(JSON_DIR, '_idnorma-21670.txt'), String(idNorma));
    const outPath = join(JSON_DIR, 'ley-21670.json');
    if (!existsSync(outPath)) {
      await page.goto(`https://nuevo.leychile.cl/servicios/Navegar/get_norma_json?idNorma=${idNorma}`, {
        waitUntil: 'domcontentloaded', timeout: 30000
      });
      await page.waitForTimeout(3000);
      const text = await page.innerText('body');
      writeFileSync(outPath, text, 'utf-8');
      console.log(`  -> ley-21670.json (${text.length} chars)`);
    }
  }

  await browser.close();
  console.log('\n=== Done ===');
}

main().catch(console.error);
