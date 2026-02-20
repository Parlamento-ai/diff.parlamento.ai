/**
 * Extract text from downloaded documents for Boletín 17.370-17
 */
import { PDFParse } from 'pdf-parse';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const WordExtractor = require('word-extractor');

const DOCS_DIR = 'research/2026-02-19/ley-17370/docs';

async function extractPdf(filePath) {
  const buffer = readFileSync(filePath);
  const pdf = new PDFParse(new Uint8Array(buffer));
  await pdf.load();
  const result = await pdf.getText();
  pdf.destroy();
  // result has { pages, text, total } - use text field (all pages concatenated)
  return result.text;
}

async function extractDoc(filePath) {
  const extractor = new WordExtractor();
  const doc = await extractor.extract(filePath);
  return doc.getBody();
}

async function main() {
  const files = readdirSync(DOCS_DIR)
    .filter(f => f.match(/^\d{2}-/) && f.match(/\.(pdf|doc|docx)$/))
    .sort();

  for (const file of files) {
    const filePath = join(DOCS_DIR, file);
    const ext = file.split('.').pop();
    const baseName = file.replace(/\.[^.]+$/, '');
    const outPath = join(DOCS_DIR, `${baseName}.txt`);

    console.log(`\nExtracting ${file}...`);

    try {
      let text;
      if (ext === 'pdf') {
        text = await extractPdf(filePath);
      } else if (ext === 'doc') {
        text = await extractDoc(filePath);
      }

      writeFileSync(outPath, text, 'utf-8');
      console.log(`  -> ${baseName}.txt (${text.length} chars, ${text.split('\n').length} lines)`);

      const preview = text.split('\n').slice(0, 15).join('\n');
      console.log(`  Preview:\n${preview}\n  ...`);
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
    }
  }
}

main().catch(console.error);
