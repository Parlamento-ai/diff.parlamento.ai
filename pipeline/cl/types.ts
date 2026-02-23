/**
 * Pipeline types for Chile AKN generation
 */

// Re-export core AKN types
export type { Article, ArticleChange, Vote, Voter, ChangeSet } from '../../src/lib/types.js';

/** Senate tramitación API response (parsed) */
export interface TramitacionData {
	boletin: string;
	titulo: string;
	estado: string;
	iniciativa: string; // "Mocion" | "Mensaje"
	camaraOrigen: string;
	mocion?: { iddocto: string; tipodoc: string };
	tramites: Tramite[];
	urgencias: Urgencia[];
}

export interface Tramite {
	fecha: string;
	descripcion: string;
	etapa: string;
	camara: string;
	documentos?: TramiteDocumento[];
}

export interface TramiteDocumento {
	iddocto: string;
	tipodoc: string;
	descripcion: string;
}

export interface Urgencia {
	tipo: string;
	fecha: string;
	tramite: string;
}

/** Vote from Senate/Cámara APIs */
export interface VotacionData {
	fecha: string;
	sesion: string;
	si: number;
	no: number;
	abstencion: number;
	resultado: 'approved' | 'rejected';
	votantes: {
		for: string[];
		against: string[];
		abstain: string[];
	};
}

/** Discovery output (Phase 1) */
export interface Discovery {
	boletin: string;
	titulo: string;
	estado: string;
	iniciativa: string;
	camaraOrigen: string;
	mocion?: { iddocto: string; tipodoc: string };
	tramites: Tramite[];
	votaciones: VotacionData[];
}

/** Document role in the legislative process */
export type DocumentRole =
	| 'mocion'
	| 'mensaje'
	| 'informe-comision'
	| 'oficio-1er-tramite'
	| 'oficio-2do-tramite'
	| 'comparado'
	| 'comision-mixta'
	| 'oficio-ley'
	| 'indicaciones';

/** Config for a single document to download */
export interface ConfigDocumento {
	iddocto: string;
	tipodoc: string;
	rol: DocumentRole;
	descripcion: string;
	auto: boolean; // true = auto-discovered from API
}

/** Config for a reforma (modification to existing law) */
export interface ReformaConfig {
	normasModificadas: NormaModificada[];
}

export interface NormaModificada {
	idNorma: number;
	nombre: string;
	fechaPre: string;
	fechaPost: string;
}

/** Timeline entry describing an AKN document to generate */
export interface TimelineConfig {
	slug: string;
	label: string;
	date: string;
	type: 'act' | 'act-original' | 'act-final' | 'bill' | 'amendment';
	source: string; // document rol, 'leychile-{slug}-pre/post', or 'leychile-final'
	voteIndex?: number; // index into votaciones array
	chamber?: 'senado' | 'camara'; // which chamber this entry belongs to
}

/** Pipeline config (Phase 2 output) */
export interface PipelineConfig {
	boletin: string;
	tipo: 'mocion' | 'mensaje' | 'reforma';
	titulo: string;
	slug: string;
	documentos: ConfigDocumento[];
	reforma: ReformaConfig | null;
	leychileFinal?: { idNorma: number; fecha?: string }; // for non-reforma published laws
	timeline: TimelineConfig[];
}

/** Article parsing result */
export interface ParseResult {
	articles: ParsedArticle[];
	confidence: number;
	warnings: string[];
	needsReview: boolean;
}

export interface ParsedArticle {
	eId: string;
	num: string;
	heading: string;
	content: string;
}

/** Text extraction result */
export interface ExtractionResult {
	text: string;
	pages: number;
	failed: boolean;
	source: string;
}

/** LeyChile JSON API response (relevant fields) */
export interface LeychileNorma {
	titulo: string;
	idNorma: number;
	html: LeychileHtml[];
}

export interface LeychileHtml {
	t?: string; // section HTML
	tH?: number; // child count
	h?: LeychileArticle[];
	i?: number;
}

export interface LeychileArticle {
	t?: string; // article HTML content
	i?: number; // LeyChile internal ID
	v?: string[]; // vinculaciones (e.g., "MODIFICACION")
}
