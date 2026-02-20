/**
 * Extract text from downloaded documents for Boletín 8924-07
 * (Ley 21.120 — Identidad de Género)
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const WordExtractor = require('word-extractor');

const DOCS_DIR = 'research/2026-02-19/ley-21120-docs';

async function extractDoc(filePath) {
  const extractor = new WordExtractor();
  const doc = await extractor.extract(filePath);
  return doc.getBody();
}

async function main() {
  const files = readdirSync(DOCS_DIR)
    .filter(f => f.match(/^\d{2}-/) && f.match(/\.(doc|docx)$/))
    .sort();

  for (const file of files) {
    const filePath = join(DOCS_DIR, file);
    const baseName = file.replace(/\.[^.]+$/, '');
    const outPath = join(DOCS_DIR, `${baseName}.txt`);

    console.log(`\nExtracting ${file}...`);

    try {
      const text = await extractDoc(filePath);
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
