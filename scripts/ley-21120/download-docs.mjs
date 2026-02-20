/**
 * Download Senate documents for Boletín 8924-07
 * (Ley 21.120 — Identidad de Género)
 *
 * Key documents for each legislative stage:
 * - Moción original
 * - Oficio de ley a Cámara (text after 1er Trámite)
 * - Oficio modificaciones de Cámara (text after 2do Trámite)
 * - Informe Comisión Mixta
 * - Comparado para Sala (C. Mixta final text)
 */
import { chromium } from 'playwright';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const DOCS_DIR = 'research/2026-02-19/ley-21120-docs';
mkdirSync(DOCS_DIR, { recursive: true });

const SENATE_DOCS = [
  // Original motion
  { id: '9331', type: 'mensaje_mocion', name: '01-mocion', desc: 'Moción original (07/05/2013)' },
  // 1er informe Comisión DDHH
  { id: '16215', type: 'info', name: '02-primer-informe-ddhh', desc: 'Primer informe Comisión DDHH (27/08/2013)' },
  // Segundo informe (nuevo) - final Senate version
  { id: '19660', type: 'info', name: '03-nuevo-segundo-informe-ddhh', desc: 'Nuevo segundo informe DDHH (26/05/2017)' },
  // Oficio de ley a Cámara Revisora (text after 1er Trámite Senado)
  { id: '22438', type: 'ofic', name: '04-oficio-ley-camara', desc: 'Oficio de ley a Cámara Revisora (14/06/2017)' },
  // 1er informe Cámara de Diputados
  { id: '20196', type: 'info', name: '05-informe-camara', desc: 'Informe Cámara Diputados (15/01/2018)' },
  // Oficio modificaciones a Cámara de Origen (text after 2do Trámite)
  { id: '23141', type: 'ofic', name: '06-oficio-modificaciones-senado', desc: 'Oficio modificaciones a Cámara Origen (23/01/2018)' },
  // Oficio rechazo modificaciones (3er Trámite)
  { id: '23215', type: 'ofic', name: '07-oficio-rechazo-3er-tramite', desc: 'Oficio rechazo modificaciones (06/03/2018)' },
  // Informe Comisión Mixta
  { id: '20587', type: 'info', name: '08-informe-comision-mixta', desc: 'Informe Comisión Mixta (21/08/2018)' },
  // Comparado para Sala (final C. Mixta)
  { id: '2645', type: 'compa', name: '09-comparado-sala-cmixta', desc: 'Comparado para Sala - C. Mixta' },
  // Nuevo comparado de estudio C. Mixta
  { id: '2573', type: 'compa', name: '10-comparado-estudio-cmixta', desc: 'Nuevo comparado estudio C. Mixta (04/06/2018)' },
  // Comparado 3er trámite
  { id: '1896', type: 'compa', name: '11-comparado-3er-tramite', desc: 'Comparado 3er trámite (24/01/2018)' },
];

async function downloadDoc(page, doc) {
  const pdfPath = join(DOCS_DIR, `${doc.name}.pdf`);
  // Check if already downloaded (any extension)
  const extensions = ['pdf', 'doc', 'docx', 'xlsx'];
  for (const ext of extensions) {
    if (existsSync(join(DOCS_DIR, `${doc.name}.${ext}`))) {
      console.log(`  SKIP ${doc.name} (exists)`);
      return true;
    }
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

  console.log('=== Downloading Senate docs for Boletín 8924-07 (Ley 21.120) ===\n');
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
