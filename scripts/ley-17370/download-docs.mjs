/**
 * Download Senate documents for Boletín 17.370-17
 * (Cumplimiento alternativo de penas privativas de libertad)
 */
import { chromium } from 'playwright';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const DOCS_DIR = 'research/2026-02-19/ley-17370/docs';

const SENATE_DOCS = [
  { id: '18004', type: 'mensaje_mocion', name: '01-mocion', desc: 'Moción original (30/01/2025)' },
  { id: '34548', type: 'ofic', name: '02-oficio-consulta-cs', desc: 'Oficio consulta Corte Suprema (04/03/2025)' },
  { id: '34824', type: 'ofic', name: '03-oficio-respuesta-cs', desc: 'Oficio respuesta Corte Suprema (28/05/2025)' },
  { id: '27646', type: 'info', name: '04-informe-comision-ddhh', desc: 'Primer informe Comisión DDHH (05/11/2025)' },
];

async function downloadDoc(page, doc) {
  const ext = 'pdf'; // default extension, will be renamed based on actual content
  const pdfPath = join(DOCS_DIR, `${doc.name}.pdf`);
  if (existsSync(pdfPath) || existsSync(pdfPath.replace('.pdf', '.docx')) || existsSync(pdfPath.replace('.pdf', '.doc'))) {
    console.log(`  SKIP ${doc.name} (exists)`);
    return true;
  }

  const url = `https://www.senado.cl/appsenado/index.php?mo=tramitacion&ac=getDocto&iddocto=${doc.id}&tipodoc=${doc.type}`;
  console.log(`  Downloading ${doc.desc}...`);

  try {
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30000 }),
      page.goto(url).catch(() => {})
    ]);

    const suggestedName = download.suggestedFilename();
    const ext = suggestedName.split('.').pop() || 'pdf';
    const finalPath = join(DOCS_DIR, `${doc.name}.${ext}`);
    await download.saveAs(finalPath);
    console.log(`  -> ${doc.name}.${ext} OK (${suggestedName})`);
    return true;
  } catch (err) {
    console.error(`  ERROR ${doc.name}: ${err.message}`);
    return false;
  }
}

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    acceptDownloads: true
  });
  const page = await context.newPage();

  console.log('=== Downloading Senate docs for Boletín 17.370-17 ===\n');
  let success = 0;
  for (const doc of SENATE_DOCS) {
    const ok = await downloadDoc(page, doc);
    if (ok) success++;
    await page.waitForTimeout(1500);
  }
  console.log(`\n  Downloaded ${success}/${SENATE_DOCS.length} documents`);

  await browser.close();
  console.log('\n=== Done ===');
}

main().catch(console.error);
