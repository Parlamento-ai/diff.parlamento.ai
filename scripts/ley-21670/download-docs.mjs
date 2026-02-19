/**
 * Download all legislative documents for Boletín 15.995-02 (Ley 21.670)
 * Uses Playwright to bypass CloudFront/anti-bot protections
 */
import { chromium } from 'playwright';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const OUT_DIR = 'research/2026-02-19/ley-21670/docs';
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

// Senate/Cámara documents
const SENATE_DOCS = [
  { id: '16536', type: 'mensaje_mocion', name: '01-mocion.html', desc: 'Moción original' },
  { id: '32945', type: 'ofic', name: '02-indicaciones-ejecutivo.html', desc: 'Indicaciones del Ejecutivo (311-371)' },
  { id: '26310', type: 'info', name: '03-informe-comision-camara.html', desc: 'Primer informe Comisión Defensa Cámara' },
  { id: '33029', type: 'ofic', name: '04-oficio-1er-tramite.html', desc: 'Oficio de ley a Cámara Revisora (19265)' },
  { id: '26401', type: 'info', name: '05-informe-comision-senado.html', desc: 'Primer informe Comisión Defensa Senado' },
  { id: '4970', type: 'compa', name: '06-comparado-2do-tramite.html', desc: 'Comparado 2do trámite' },
  { id: '33217', type: 'ofic', name: '07-oficio-modificaciones-senado.html', desc: 'Oficio modificaciones Senado (178)' },
  { id: '33294', type: 'ofic', name: '08-oficio-ley-ejecutivo.html', desc: 'Oficio de ley al Ejecutivo (19465)' },
];

async function downloadSenateDoc(page, doc) {
  const outPath = join(OUT_DIR, doc.name);
  if (existsSync(outPath)) {
    console.log(`  SKIP ${doc.name} (already exists)`);
    return;
  }

  const url = `http://www.senado.cl/appsenado/index.php?mo=tramitacion&ac=getDocto&iddocto=${doc.id}&tipodoc=${doc.type}`;
  console.log(`  Downloading ${doc.desc}...`);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    const html = await page.content();
    writeFileSync(outPath, html, 'utf-8');
    console.log(`  -> Saved ${doc.name} (${html.length} chars)`);
  } catch (err) {
    console.error(`  ERROR downloading ${doc.name}: ${err.message}`);
  }
}

async function downloadLeyChile(page) {
  // First, find idNorma for Ley 17.798
  // Try to get it from the norma search
  const searchUrl = 'https://nuevo.leychile.cl/servicios/Navegar/get_norma_json?idNorma=29120';
  // Actually, Ley 17.798 is about Control de Armas, published 1972
  // Let's try common idNorma values. We know the pattern from our research.

  const LEY_17798_CANDIDATES = [29120, 29119, 29118, 29121, 29122, 29123, 29124, 29125];

  console.log('\n--- Searching for Ley 17.798 on LeyChile ---');

  // First try to find the right idNorma
  let idNorma = null;

  // Try a direct search approach - go to the search page
  const searchPage = 'https://nuevo.leychile.cl/servicios/Consulta/listarNormasio?d-7462506-p=1&tipNorma=30&numNorma=17798';
  console.log('  Searching via LeyChile search...');

  try {
    await page.goto(searchPage, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    const searchHtml = await page.content();
    writeFileSync(join(OUT_DIR, '_leychile-search-17798.html'), searchHtml, 'utf-8');

    // Try to extract idNorma from search results
    const idMatch = searchHtml.match(/idNorma=(\d+)/);
    if (idMatch) {
      idNorma = parseInt(idMatch[1]);
      console.log(`  Found idNorma: ${idNorma}`);
    }
  } catch (err) {
    console.log(`  Search failed: ${err.message}`);
  }

  // If search didn't work, try a known range
  if (!idNorma) {
    console.log('  Trying candidate idNormas...');
    for (const candidate of LEY_17798_CANDIDATES) {
      try {
        const url = `https://nuevo.leychile.cl/servicios/Navegar/get_norma_json?idNorma=${candidate}`;
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(1500);
        const text = await page.innerText('body');
        if (text.includes('17.798') || text.includes('17798') || text.includes('control de armas') || text.includes('Control de Armas')) {
          idNorma = candidate;
          console.log(`  Found! idNorma=${candidate}`);
          break;
        }
      } catch (err) {
        // continue
      }
    }
  }

  if (!idNorma) {
    // Try broader range
    console.log('  Trying broader range 28900-29200...');
    for (let i = 28900; i <= 29200; i += 10) {
      try {
        const url = `https://nuevo.leychile.cl/servicios/Navegar/get_norma_json?idNorma=${i}`;
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await page.waitForTimeout(1000);
        const text = await page.innerText('body');
        if (text.includes('17.798') || text.includes('Control de Armas')) {
          idNorma = i;
          console.log(`  Found! idNorma=${i}`);
          break;
        }
        if (i % 50 === 0) console.log(`    checked ${i}...`);
      } catch (err) {
        // continue
      }
    }
  }

  if (!idNorma) {
    console.log('  WARNING: Could not find idNorma for Ley 17.798. Trying 29120 as fallback.');
    idNorma = 29120;
  }

  // Download current version (has vigencias for all versions)
  console.log(`\n  Downloading Ley 17.798 (idNorma=${idNorma}) current version...`);
  const currentPath = join('research/2026-02-19/ley-21670/json', 'ley-17798-current.json');

  if (!existsSync(currentPath)) {
    try {
      const url = `https://nuevo.leychile.cl/servicios/Navegar/get_norma_json?idNorma=${idNorma}`;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);
      const text = await page.innerText('body');
      writeFileSync(currentPath, text, 'utf-8');
      console.log(`  -> Saved ley-17798-current.json (${text.length} chars)`);
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
    }
  }

  // Download pre-Ley 21.670 version (before 13/06/2024)
  const preReformPath = join('research/2026-02-19/ley-21670/json', 'ley-17798-pre-reform.json');
  if (!existsSync(preReformPath)) {
    console.log('  Downloading pre-reform version (2024-06-12)...');
    try {
      const url = `https://nuevo.leychile.cl/servicios/Navegar/get_norma_json?idNorma=${idNorma}&idVersion=2024-06-12`;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);
      const text = await page.innerText('body');
      writeFileSync(preReformPath, text, 'utf-8');
      console.log(`  -> Saved ley-17798-pre-reform.json (${text.length} chars)`);
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
    }
  }

  // Download post-Ley 21.670 version (after 13/06/2024)
  const postReformPath = join('research/2026-02-19/ley-21670/json', 'ley-17798-post-reform.json');
  if (!existsSync(postReformPath)) {
    console.log('  Downloading post-reform version (2024-06-13)...');
    try {
      const url = `https://nuevo.leychile.cl/servicios/Navegar/get_norma_json?idNorma=${idNorma}&idVersion=2024-06-13`;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);
      const text = await page.innerText('body');
      writeFileSync(postReformPath, text, 'utf-8');
      console.log(`  -> Saved ley-17798-post-reform.json (${text.length} chars)`);
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
    }
  }

  // Also download Ley 21.670 itself
  console.log('\n  Searching for Ley 21.670 on LeyChile...');
  let idNorma21670 = null;
  const search21670 = 'https://nuevo.leychile.cl/servicios/Consulta/listarNormasio?d-7462506-p=1&tipNorma=30&numNorma=21670';
  try {
    await page.goto(search21670, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    const searchHtml = await page.content();
    const idMatch = searchHtml.match(/idNorma=(\d+)/);
    if (idMatch) {
      idNorma21670 = parseInt(idMatch[1]);
      console.log(`  Found Ley 21.670 idNorma: ${idNorma21670}`);

      const ley21670Path = join('research/2026-02-19/ley-21670/json', 'ley-21670.json');
      if (!existsSync(ley21670Path)) {
        const url = `https://nuevo.leychile.cl/servicios/Navegar/get_norma_json?idNorma=${idNorma21670}`;
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(3000);
        const text = await page.innerText('body');
        writeFileSync(ley21670Path, text, 'utf-8');
        console.log(`  -> Saved ley-21670.json (${text.length} chars)`);
      }
    }
  } catch (err) {
    console.log(`  Could not find Ley 21.670: ${err.message}`);
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== Downloading Senate/Cámara documents ===\n');
  for (const doc of SENATE_DOCS) {
    await downloadSenateDoc(page, doc);
    await page.waitForTimeout(1500);
  }

  console.log('\n=== Downloading LeyChile data ===\n');
  await downloadLeyChile(page);

  await browser.close();
  console.log('\n=== Done ===');
}

main().catch(console.error);
