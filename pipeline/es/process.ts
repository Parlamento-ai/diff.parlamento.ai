#!/usr/bin/env tsx
/**
 * Pipeline ES — Unified dispatcher for Spanish legislative pipeline
 *
 * Auto-detects mode from the identifier format:
 *   BOE-A-YYYY-NNNNN  → BOE pipeline (published laws)
 *   121/NNNNNN         → Tramitación pipeline (bills in progress)
 *
 * Usage:
 *   npx tsx pipeline/es/process.ts BOE-A-2018-16673           # BOE mode
 *   npx tsx pipeline/es/process.ts 121/000036                  # Tramitación mode
 *   npx tsx pipeline/es/process.ts 121/000036 --phase=3        # Resume from phase 3
 */
import { runBOE } from './run-boe.js';
import { runTramitacion } from './run-tramitacion.js';

type Mode = 'boe' | 'tramitacion';

function detectMode(identifier: string): Mode | null {
	if (/^BOE-[A-Z]-\d{4}-\d+$/.test(identifier)) return 'boe';
	if (/^\d{3}\/\d{6}$/.test(identifier)) return 'tramitacion';
	return null;
}

function parseArgs(): { identifier: string; mode: Mode; startPhase: number } {
	const args = process.argv.slice(2);

	if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
		console.log(`
Pipeline España — Unified AKN Diff Generator

Usage:
  npx tsx pipeline/es/process.ts <identifier> [options]

Identifier formats (auto-detected):
  BOE-A-2018-16673   → BOE mode (published laws, 6 phases)
  121/000036          → Tramitación mode (bills in progress, 5 phases)

Examples:
  npx tsx pipeline/es/process.ts BOE-A-2018-16673
  npx tsx pipeline/es/process.ts BOE-A-2018-16673 --phase=5
  npx tsx pipeline/es/process.ts 121/000036
  npx tsx pipeline/es/process.ts 121/000036 --phase=3

Options:
  --phase=N    Start from phase N (default: 1)
               BOE: 1-6, Tramitación: 1-5
  -h, --help   Show this help
`);
		process.exit(0);
	}

	const identifier = args[0];
	const mode = detectMode(identifier);

	if (!mode) {
		console.error(`Error: Unrecognized identifier format: "${identifier}"`);
		console.error('  Expected BOE-A-YYYY-NNNNN (e.g. BOE-A-2018-16673)');
		console.error('  or 121/NNNNNN (e.g. 121/000036)');
		process.exit(1);
	}

	let startPhase = 1;
	const maxPhase = mode === 'boe' ? 6 : 5;

	for (const arg of args.slice(1)) {
		if (arg.startsWith('--phase=')) {
			startPhase = parseInt(arg.split('=')[1], 10);
			if (isNaN(startPhase) || startPhase < 1 || startPhase > maxPhase) {
				console.error(`Error: --phase must be 1-${maxPhase} for ${mode} mode`);
				process.exit(1);
			}
		}
	}

	return { identifier, mode, startPhase };
}

async function main(): Promise<void> {
	const { identifier, mode, startPhase } = parseArgs();

	if (mode === 'boe') {
		await runBOE(identifier, startPhase);
	} else {
		await runTramitacion(identifier, startPhase);
	}
}

main().catch((err) => {
	console.error('\nPipeline failed:', err.message || err);
	process.exit(1);
});
