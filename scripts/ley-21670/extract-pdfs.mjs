/**
 * Extract text from PDF files only (fix ESM import for pdf-parse)
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const DOCS_DIR = 'research/2026-02-19/ley-21670/docs';

async function main() {
  const pdfParse = require('pdf-parse/lib/pdf-parse.js');

  const files = readdirSync(DOCS_DIR).filter(f => f.endsWith('.pdf')).sort();

  for (const file of files) {
    const filePath = join(DOCS_DIR, file);
    const baseName = file.replace('.pdf', '');
    const outPath = join(DOCS_DIR, `${baseName}.txt`);

    console.log(`\nExtracting ${file}...`);

    try {
      const buffer = readFileSync(filePath);
      const data = await pdfParse(buffer);
      writeFileSync(outPath, data.text, 'utf-8');
      console.log(`  -> ${baseName}.txt (${data.text.length} chars, ${data.numpages} pages)`);

      const preview = data.text.split('\n').filter(l => l.trim()).slice(0, 8).join('\n');
      console.log(`  Preview:\n${preview}`);
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
    }
  }
}

main().catch(console.error);
