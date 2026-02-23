/**
 * Phase 2: CONFIGURE — Generate config.json from discovery data
 * Detects reforma/comisión mixta and builds correct timeline
 */
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { createInterface } from 'readline';
import type {
	Discovery,
	PipelineConfig,
	ConfigDocumento,
	TimelineConfig,
	Tramite,
	VotacionData,
	NormaModificada,
	ReformaConfig
} from '../types.js';

export async function configure(discovery: Discovery, outDir: string): Promise<PipelineConfig> {
	console.log('\n=== Phase 2: CONFIGURE ===\n');

	const configPath = join(outDir, 'config.json');

	// If config already exists, load and validate it
	if (existsSync(configPath)) {
		console.log(`  Loading existing ${configPath}`);
		const existing = JSON.parse(readFileSync(configPath, 'utf-8')) as PipelineConfig;
		console.log(`  Documentos: ${existing.documentos.length}`);
		console.log(`  Timeline: ${existing.timeline.length} entries`);
		return existing;
	}

	// Build initial config from discovery
	const documentos: ConfigDocumento[] = [];

	// Add moción/mensaje if found
	if (discovery.mocion) {
		documentos.push({
			iddocto: discovery.mocion.iddocto,
			tipodoc: discovery.mocion.tipodoc,
			rol: isMotion(discovery.iniciativa) ? 'mocion' : 'mensaje',
			descripcion: `${discovery.iniciativa} original`,
			auto: true
		});
	}

	// Add documents from tramites
	for (const tramite of discovery.tramites) {
		for (const doc of tramite.documentos || []) {
			if (documentos.some((d) => d.iddocto === doc.iddocto)) continue;
			const rol = inferDocumentRole(doc.tipodoc, doc.descripcion);
			if (rol) {
				documentos.push({
					iddocto: doc.iddocto,
					tipodoc: doc.tipodoc,
					rol,
					descripcion: doc.descripcion,
					auto: true
				});
			}
		}
	}

	// Detect reforma
	console.log(`  Estado: ${discovery.estado}`);
	console.log(`  Iniciativa: ${discovery.iniciativa}`);
	console.log(`  Cámara origen: ${discovery.camaraOrigen}`);
	console.log(`  Trámites: ${discovery.tramites.length}`);
	console.log(`  Votaciones: ${discovery.votaciones.length}`);
	console.log(`  Documentos auto-discovered: ${documentos.length}\n`);

	const reformaAnswer = await promptUser(
		'  Does this bill modify existing law(s)? (y/n, default n): '
	);
	let reforma: ReformaConfig | null = null;

	if (reformaAnswer.toLowerCase() === 'y') {
		reforma = await promptReformaConfig();
	}

	// Detect published status
	const isPublished = isLeyPublished(discovery.estado);
	let leychileFinal: { idNorma: number; fecha?: string } | undefined;

	if (isPublished && !reforma) {
		console.log('\n  Law is published. To generate act-final from LeyChile:');
		const idNormaStr = await promptUser(
			'  Enter LeyChile idNorma for the published law (or Enter to skip): '
		);
		if (idNormaStr) {
			const fechaStr = await promptUser(
				'  Enter publication date YYYY-MM-DD (or Enter for last tramite date): '
			);
			leychileFinal = {
				idNorma: parseInt(idNormaStr, 10),
				fecha: fechaStr || undefined
			};
		}
	}

	// Build timeline
	const timeline = buildTimeline(discovery, documentos, reforma, isPublished, leychileFinal);

	const slug = `boletin-${discovery.boletin.replace(/\./g, '')}`;
	const config: PipelineConfig = {
		boletin: discovery.boletin,
		tipo: reforma ? 'reforma' : isMotion(discovery.iniciativa) ? 'mocion' : 'mensaje',
		titulo: discovery.titulo,
		slug,
		documentos,
		reforma,
		leychileFinal,
		timeline
	};

	// Save config.json
	writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
	console.log(`\n  -> Saved ${configPath}`);
	console.log(
		`  Documentos: ${documentos.length} (${documentos.filter((d) => d.auto).length} auto-discovered)`
	);
	console.log(`  Timeline: ${timeline.length} entries`);
	for (const entry of timeline) {
		const voteLabel = entry.voteIndex !== undefined ? ` [vote ${entry.voteIndex}]` : '';
		console.log(`    ${entry.type.padEnd(14)} ${entry.slug.padEnd(16)} <- ${entry.source}${voteLabel}`);
	}

	// Prompt user to review
	console.log('\n  Please review and edit config.json if needed.');
	console.log('  Add missing document IDs (iddocto) for informes, oficios, etc.');
	console.log('  Press Enter when ready to continue...');

	await waitForEnter();

	// Reload in case user edited
	return JSON.parse(readFileSync(configPath, 'utf-8')) as PipelineConfig;
}

// --- Helpers ---

function isMotion(iniciativa: string): boolean {
	const lower = iniciativa.toLowerCase();
	return lower.includes('mocion') || lower.includes('moción');
}

function isLeyPublished(estado: string): boolean {
	const lower = estado.toLowerCase();
	return (
		lower.includes('promulgad') ||
		lower.includes('publicad') ||
		lower.includes('ley de la república')
	);
}

function inferDocumentRole(
	tipodoc: string,
	descripcion: string
): ConfigDocumento['rol'] | null {
	const desc = descripcion.toLowerCase();
	const tipo = tipodoc.toLowerCase();

	if (tipo === 'mensaje_mocion' || tipo === 'mensaje') return 'mocion';
	if (tipo === 'info' && desc.includes('informe')) return 'informe-comision';
	if (tipo === 'compa' && desc.includes('comparado')) return 'comparado';
	if (desc.includes('oficio') && desc.includes('1er')) return 'oficio-1er-tramite';
	if (desc.includes('oficio') && desc.includes('2do')) return 'oficio-2do-tramite';
	if (desc.includes('comisión mixta') || desc.includes('comision mixta')) return 'comision-mixta';
	if (desc.includes('indicacion')) return 'indicaciones';
	if (desc.includes('oficio') && desc.includes('ley')) return 'oficio-ley';

	return null;
}

// --- Timeline construction ---

interface ReadingInfo {
	label: string;
	date: string;
	source: string;
	voteDate?: string;
	chamber: 'senado' | 'camara';
}

function buildTimeline(
	discovery: Discovery,
	documentos: ConfigDocumento[],
	reforma: ReformaConfig | null,
	isPublished: boolean,
	leychileFinal?: { idNorma: number; fecha?: string }
): TimelineConfig[] {
	const timeline: TimelineConfig[] = [];
	const isReforma = reforma !== null && reforma.normasModificadas.length > 0;

	// 1. ACT-ORIGINAL (only for reformas)
	if (isReforma) {
		const firstNorma = reforma!.normasModificadas[0];
		const slug = firstNorma.nombre.replace(/ /g, '-');
		timeline.push({
			slug: 'act-original',
			label: `${firstNorma.nombre} (pre-reforma)`,
			date: firstNorma.fechaPre,
			type: 'act-original',
			source: `leychile-${slug}-pre`
		});
	}

	// 2. BILL (moción or mensaje)
	const mocionDoc = documentos.find((d) => d.rol === 'mocion' || d.rol === 'mensaje');
	if (mocionDoc && discovery.tramites[0]) {
		timeline.push({
			slug: 'bill',
			label: discovery.iniciativa,
			date: discovery.tramites[0].fecha,
			type: 'bill',
			source: mocionDoc.rol
		});
	}

	// 3. AMENDMENTS from legislative readings
	const readings = identifyReadings(discovery, documentos);
	let amendmentIndex = 1;

	for (const reading of readings) {
		const voteIndex = reading.voteDate
			? discovery.votaciones.findIndex((v) => v.fecha === reading.voteDate)
			: -1;

		timeline.push({
			slug: `amendment-${amendmentIndex}`,
			label: reading.label,
			date: reading.date,
			type: 'amendment',
			source: reading.source,
			voteIndex: voteIndex >= 0 ? voteIndex : undefined,
			chamber: reading.chamber
		});
		amendmentIndex++;
	}

	// 4. ACT-FINAL (if published)
	if (isPublished) {
		if (isReforma) {
			const firstNorma = reforma!.normasModificadas[0];
			const slug = firstNorma.nombre.replace(/ /g, '-');
			timeline.push({
				slug: 'act-final',
				label: 'Ley Promulgada',
				date: firstNorma.fechaPost,
				type: 'act-final',
				source: `leychile-${slug}-post`
			});
		} else if (leychileFinal) {
			const lastTramite = discovery.tramites[discovery.tramites.length - 1];
			timeline.push({
				slug: 'act-final',
				label: 'Ley Promulgada',
				date: leychileFinal.fecha || lastTramite?.fecha || '',
				type: 'act-final',
				source: 'leychile-final'
			});
		} else {
			// Fallback: use oficio-ley as source
			const lastTramite = discovery.tramites[discovery.tramites.length - 1];
			timeline.push({
				slug: 'act-final',
				label: 'Ley Promulgada',
				date: lastTramite?.fecha || '',
				type: 'act-final',
				source: 'oficio-ley'
			});
		}
	}

	return timeline;
}

function identifyReadings(
	discovery: Discovery,
	documentos: ConfigDocumento[]
): ReadingInfo[] {
	const readings: ReadingInfo[] = [];
	const isCamaraOrigen =
		discovery.camaraOrigen.toLowerCase().includes('diputado') ||
		discovery.camaraOrigen.toLowerCase() === 'c.diputados';
	const firstChamber: 'senado' | 'camara' = isCamaraOrigen ? 'camara' : 'senado';
	const secondChamber: 'senado' | 'camara' = isCamaraOrigen ? 'senado' : 'camara';

	// Group tramites by etapa
	const primer = discovery.tramites.filter((t) =>
		t.etapa.toLowerCase().includes('primer')
	);
	const segundo = discovery.tramites.filter((t) =>
		t.etapa.toLowerCase().includes('segundo')
	);
	const tercer = discovery.tramites.filter((t) =>
		t.etapa.toLowerCase().includes('tercer')
	);
	const mixta = discovery.tramites.filter((t) => {
		const d = (t.descripcion + ' ' + t.etapa).toLowerCase();
		return d.includes('comisión mixta') || d.includes('comision mixta');
	});
	const tc = discovery.tramites.filter((t) => {
		const d = (t.descripcion + ' ' + t.etapa).toLowerCase();
		return d.includes('tribunal constitucional');
	});

	// Helper: find best source document for a reading
	function findSource(preferredRoles: string[]): string {
		for (const role of preferredRoles) {
			if (documentos.some((d) => d.rol === role)) return role;
		}
		return preferredRoles[preferredRoles.length - 1] || 'informe-comision';
	}

	// 1er trámite
	if (primer.length > 0) {
		const vote = findVoteForTramite(discovery.votaciones, primer);
		const lastPrimer = primer[primer.length - 1];
		readings.push({
			label: `1er Trámite: ${isCamaraOrigen ? 'C. Diputados' : 'Senado'}`,
			date: vote?.fecha || lastPrimer.fecha,
			source: findSource(['informe-comision', 'oficio-1er-tramite']),
			voteDate: vote?.fecha,
			chamber: firstChamber
		});
	}

	// 2do trámite
	if (segundo.length > 0) {
		const vote = findVoteForTramite(discovery.votaciones, segundo);
		const lastSegundo = segundo[segundo.length - 1];
		readings.push({
			label: `2do Trámite: ${isCamaraOrigen ? 'Senado' : 'C. Diputados'}`,
			date: vote?.fecha || lastSegundo.fecha,
			source: findSource(['oficio-2do-tramite', 'informe-comision']),
			voteDate: vote?.fecha,
			chamber: secondChamber
		});
	}

	// 3er trámite
	if (tercer.length > 0) {
		const vote = findVoteForTramite(discovery.votaciones, tercer);
		const lastTercer = tercer[tercer.length - 1];
		readings.push({
			label: `3er Trámite: ${isCamaraOrigen ? 'C. Diputados' : 'Senado'}`,
			date: vote?.fecha || lastTercer.fecha,
			source: findSource(['comparado', 'oficio-2do-tramite']),
			voteDate: vote?.fecha,
			chamber: firstChamber
		});
	}

	// Comisión Mixta
	if (mixta.length > 0) {
		const vote = findVoteForTramite(discovery.votaciones, mixta);
		const lastMixta = mixta[mixta.length - 1];
		readings.push({
			label: 'Comisión Mixta',
			date: vote?.fecha || lastMixta.fecha,
			source: findSource(['comision-mixta', 'informe-comision']),
			voteDate: vote?.fecha,
			chamber: 'senado'
		});
	}

	// Tribunal Constitucional
	if (tc.length > 0) {
		const lastTc = tc[tc.length - 1];
		readings.push({
			label: 'Tribunal Constitucional',
			date: lastTc.fecha,
			source: findSource(['oficio-ley']),
			chamber: 'senado'
		});
	}

	return readings;
}

function findVoteForTramite(
	votaciones: VotacionData[],
	tramites: Tramite[]
): VotacionData | undefined {
	const tramiteDates = new Set(tramites.map((t) => t.fecha));

	// Exact date match
	for (const v of votaciones) {
		if (tramiteDates.has(v.fecha)) return v;
	}

	// Closest vote within 30 days of last tramite
	if (tramites.length > 0) {
		const lastDate = tramites[tramites.length - 1].fecha;
		const lastMs = new Date(lastDate).getTime();

		let closest: VotacionData | undefined;
		let closestDiff = Infinity;

		for (const v of votaciones) {
			const diff = Math.abs(new Date(v.fecha).getTime() - lastMs);
			if (diff < closestDiff && diff < 30 * 24 * 60 * 60 * 1000) {
				closest = v;
				closestDiff = diff;
			}
		}

		return closest;
	}

	return undefined;
}

// --- Interactive prompts ---

async function promptReformaConfig(): Promise<ReformaConfig> {
	const normas: NormaModificada[] = [];
	let addMore = true;

	while (addMore) {
		console.log(`\n  --- Norma modificada ${normas.length + 1} ---`);
		const idNormaStr = await promptUser('    LeyChile idNorma: ');
		const nombre = await promptUser('    Nombre (e.g., "DL 3.500"): ');
		const fechaPre = await promptUser('    Fecha pre-reforma (YYYY-MM-DD): ');
		const fechaPost = await promptUser('    Fecha post-reforma (YYYY-MM-DD): ');

		normas.push({
			idNorma: parseInt(idNormaStr, 10),
			nombre,
			fechaPre,
			fechaPost
		});

		const more = await promptUser('    Add another norma? (y/n, default n): ');
		addMore = more.toLowerCase() === 'y';
	}

	return { normasModificadas: normas };
}

function promptUser(question: string): Promise<string> {
	return new Promise((resolve) => {
		const rl = createInterface({ input: process.stdin, output: process.stdout });
		rl.question(question, (answer) => {
			rl.close();
			resolve(answer.trim());
		});
	});
}

function waitForEnter(): Promise<void> {
	return new Promise((resolve) => {
		const rl = createInterface({ input: process.stdin, output: process.stdout });
		rl.question('', () => {
			rl.close();
			resolve();
		});
	});
}
