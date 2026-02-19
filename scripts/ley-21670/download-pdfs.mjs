/**
 * Download Senate PDFs for Boletín 15.995-02 (Ley 21.670)
 * Handles PDF file downloads + searches for Ley 21.670 on LeyChile
 */
import { chromium } from 'playwright';
import { writeFileSync, existsSync, mkdirSync, renameSync } from 'fs';
import { join, basename } from 'path';

const DOCS_DIR = 'research/2026-02-19/ley-21670/docs';
const JSON_DIR = 'research/2026-02-19/ley-21670/json';

const SENATE_DOCS = [
  { id: '16536', type: 'mensaje_mocion', name: '01-mocion', desc: 'Moción original' },
  { id: '32945', type: 'ofic', name: '02-indicaciones-ejecutivo', desc: 'Indicaciones Ejecutivo (311-371)' },
  { id: '26310', type: 'info', name: '03-informe-comision-camara', desc: 'Informe Comisión Defensa Cámara' },
  { id: '33029', type: 'ofic', name: '04-oficio-1er-tramite', desc: 'Oficio 1er Trámite (19265)' },
  { id: '26401', type: 'info', name: '05-informe-comision-senado', desc: 'Informe Comisión Defensa Senado' },
  { id: '4970', type: 'compa', name: '06-comparado-2do-tramite', desc: 'Comparado 2do Trámite' },
  { id: '33217', type: 'ofic', name: '07-oficio-modificaciones-senado', desc: 'Oficio Modificaciones Senado (178)' },
  { id: '33294', type: 'ofic', name: '08-oficio-ley-ejecutivo', desc: 'Oficio Ley al Ejecutivo (19465)' },
];

async function downloadPdf(page, doc) {
  // Check if already downloaded
  const pdfPath = join(DOCS_DIR, `${doc.name}.pdf`);
  if (existsSync(pdfPath)) {
    console.log(`  SKIP ${doc.name}.pdf (exists)`);
    return;
  }

  const url = `https://www.senado.cl/appsenado/index.php?mo=tramitacion&ac=getDocto&iddocto=${doc.id}&tipodoc=${doc.type}`;
  console.log(`  Downloading ${doc.desc}...`);

  try {
    // Set up download handling
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await page.goto(url, { waitUntil: 'commit', timeout: 30000 });
    const download = await downloadPromise;

    // Save the download
    await download.saveAs(pdfPath);
    console.log(`  -> Saved ${doc.name}.pdf`);
  } catch (err) {
    console.error(`  ERROR ${doc.name}: ${err.message}`);
  }
}

async function findLey21670OnLeyChile(page) {
  console.log('\n=== Searching Ley 21.670 on LeyChile ===');

  // Ley 21.670 is from 2024. Recent laws have high idNorma values.
  // Ley 21.735 = 1212060, so 21.670 is a bit earlier
  // Try a range around 1206000-1210000

  // First try BCN website search
  try {
    await page.goto('https://www.bcn.cl/leychile/navegar?idNorma=&idParte=&idVersion=&tipoNorma=30&numNorma=21670', {
      waitUntil: 'domcontentloaded', timeout: 30000
    });
    await page.waitForTimeout(5000);
    const url = page.url();
    const match = url.match(/idNorma=(\d+)/);
    if (match) {
      console.log(`  Found via BCN redirect: idNorma=${match[1]}`);
      return parseInt(match[1]);
    }
    const html = await page.content();
    const htmlMatch = html.match(/idNorma=(\d+)/);
    if (htmlMatch) {
      console.log(`  Found in BCN page: idNorma=${htmlMatch[1]}`);
      return parseInt(htmlMatch[1]);
    }
  } catch (e) {
    console.log(`  BCN search failed: ${e.message}`);
  }

  // Binary search in the range 1205000-1212000
  console.log('  Trying range 1205000-1212000...');
  for (let id = 1206000; id <= 1210000; id += 100) {
    try {
      await page.goto(`https://nuevo.leychile.cl/servicios/Navegar/get_norma_json?idNorma=${id}`, {
        waitUntil: 'domcontentloaded', timeout: 10000
      });
      await page.waitForTimeout(800);
      const text = await page.innerText('body');
      if (text.length < 100) continue;
      const data = JSON.parse(text);
      const tipos = data?.metadatos?.tipos_numeros || [];
      const num = tipos[0]?.numero;
      if (num) {
        const numInt = parseInt(num);
        console.log(`    id=${id} -> Ley ${num}`);
        if (num === '21670') {
          console.log(`  FOUND! idNorma=${id}`);
          return id;
        }
        // If we're close, narrow the search
        if (Math.abs(numInt - 21670) < 50) {
          console.log(`    Close! Narrowing around ${id}...`);
          const offset = (21670 - numInt);
          for (let j = id + offset - 20; j <= id + offset + 20; j++) {
            try {
              await page.goto(`https://nuevo.leychile.cl/servicios/Navegar/get_norma_json?idNorma=${j}`, {
                waitUntil: 'domcontentloaded', timeout: 10000
              });
              await page.waitForTimeout(500);
              const t2 = await page.innerText('body');
              const d2 = JSON.parse(t2);
              const n2 = d2?.metadatos?.tipos_numeros?.[0]?.numero;
              if (n2 === '21670') {
                console.log(`  FOUND! idNorma=${j}`);
                return j;
              }
            } catch (e) { /* skip */ }
          }
        }
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

  // Part 1: Download Senate PDFs
  console.log('=== Downloading Senate PDFs ===\n');
  for (const doc of SENATE_DOCS) {
    await downloadPdf(page, doc);
    await page.waitForTimeout(1500);
  }

  // Part 2: Find Ley 21.670 on LeyChile
  const idNorma = await findLey21670OnLeyChile(page);
  if (idNorma) {
    writeFileSync(join(JSON_DIR, '_idnorma-21670.txt'), String(idNorma));
    const outPath = join(JSON_DIR, 'ley-21670.json');
    if (!existsSync(outPath)) {
      console.log(`\n  Downloading Ley 21.670 JSON (idNorma=${idNorma})...`);
      await page.goto(`https://nuevo.leychile.cl/servicios/Navegar/get_norma_json?idNorma=${idNorma}`, {
        waitUntil: 'domcontentloaded', timeout: 30000
      });
      await page.waitForTimeout(3000);
      const text = await page.innerText('body');
      writeFileSync(outPath, text, 'utf-8');
      console.log(`  -> ley-21670.json (${text.length} chars)`);
    }
  } else {
    console.log('\n  WARNING: Could not find Ley 21.670');
  }

  await browser.close();
  console.log('\n=== Done ===');
}

main().catch(console.error);
