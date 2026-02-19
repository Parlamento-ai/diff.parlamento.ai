/**
 * Extract text from all downloaded documents for Ley 21.670
 * Handles DOCX (mammoth), PDF (pdf-parse), and DOC (raw extraction)
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const DOCS_DIR = 'research/2026-02-19/ley-21670/docs';

async function extractDocx(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

async function extractPdf(filePath) {
  const buffer = readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text;
}

function extractDoc(filePath) {
  // OLE2 .doc - extract text by finding readable strings
  const buf = readFileSync(filePath);
  const text = buf.toString('utf-16le');
  // Filter to printable segments
  const lines = text.split('\n')
    .map(l => l.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '').trim())
    .filter(l => l.length > 2);
  return lines.join('\n');
}

async function main() {
  const files = readdirSync(DOCS_DIR)
    .filter(f => f.match(/^\d{2}-/) && f.match(/\.(docx|pdf|doc)$/))
    .sort();

  for (const file of files) {
    const filePath = join(DOCS_DIR, file);
    const ext = file.split('.').pop();
    const baseName = file.replace(/\.[^.]+$/, '');
    const outPath = join(DOCS_DIR, `${baseName}.txt`);

    console.log(`\nExtracting ${file}...`);

    try {
      let text;
      if (ext === 'docx') {
        text = await extractDocx(filePath);
      } else if (ext === 'pdf') {
        text = await extractPdf(filePath);
      } else if (ext === 'doc') {
        text = await extractDoc(filePath);
      }

      writeFileSync(outPath, text, 'utf-8');
      console.log(`  -> ${baseName}.txt (${text.length} chars, ${text.split('\n').length} lines)`);

      // Show first 10 lines for preview
      const preview = text.split('\n').slice(0, 10).join('\n');
      console.log(`  Preview:\n${preview}\n  ...`);
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
    }
  }
}

main().catch(console.error);
