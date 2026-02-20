import { PDFParse } from 'pdf-parse';
import { readFileSync } from 'fs';

const buf = readFileSync('research/2026-02-19/ley-17370/docs/01-mocion.pdf');
const uint8 = new Uint8Array(buf);
const p = new PDFParse(uint8);

const text = await p.getText();
console.log('Text length:', text.length);
console.log('First 2000 chars:\n', text.substring(0, 2000));
