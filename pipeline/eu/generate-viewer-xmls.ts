/**
 * Generic EU Regulation Viewer XML Generator — CLI wrapper
 *
 * Usage:
 *   node --experimental-strip-types generate-viewer-xmls.ts <config.json>
 */
import { resolve } from 'node:path';
import { generateViewerXmls } from './lib/viewer-generator.js';

const args = process.argv.slice(2);
if (args.length < 1) {
	console.error('Usage: node generate-viewer-xmls.ts <config.json>');
	process.exit(1);
}

const configPath = resolve(args[0]);
generateViewerXmls(configPath);
