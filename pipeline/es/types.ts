export type { Article, ArticleChange } from '../../src/lib/types.js';

/** BOE metadata from /id/{id} */
export interface BoeMetadata {
	identificador: string; // BOE-A-2018-16673
	rango: string; // "Ley Organica"
	titulo: string;
	numeroOficial: string; // "3/2018"
	fechaDisposicion: string; // 20181205
	fechaPublicacion: string; // 20181206
	fechaVigencia: string; // 20181207
	estatusDerogacion: string; // "N"
	estadoConsolidacion: string; // "Finalizado"
	urlEli: string; // https://www.boe.es/eli/es/lo/2018/12/05/3
	departamento: string;
}

/** A modifying law from BOE /analisis posteriores */
export interface LeyModificadora {
	boeId: string; // BOE-A-2021-8806
	relacion: string; // "MODIFICA" | "DEROGA" | "ANADE"
	texto: string; // "el art. 2 por la LO 7/2021..."
	fecha?: string; // extracted from version data
}

/** Discovery output (Phase 1) */
export interface Discovery {
	boeId: string;
	metadata: BoeMetadata;
	modificadaPor: LeyModificadora[]; // posteriores
	modifica: LeyModificadora[]; // anteriores
	materias: string[];
}

/** Parsed article from a single BOE version */
export interface ParsedArticle {
	eId: string; // art_1, art_2, da_1, dt_1, df_1
	num: string; // "1", "2", "DA 1"
	heading: string; // "Objeto de la ley"
	content: string; // texto concatenado de <p> children
}

/** A snapshot of all articles at a specific version date */
export interface VersionSnapshot {
	boeId: string; // BOE ID of the modifying law
	fecha: string; // YYYY-MM-DD
	articles: ParsedArticle[];
}

/** Timeline entry */
export interface TimelineEntry {
	slug: string; // act-original, amendment-1, act-final
	label: string; // "LO 3/2018 (original)", "Modificada por LO 7/2021"
	date: string; // YYYY-MM-DD
	type: 'act-original' | 'amendment' | 'act-final';
	modifyingLaw?: string; // BOE ID of the modifying law
}

/** Pipeline config (Phase 2 output) */
export interface PipelineConfig {
	boeId: string;
	slug: string;
	titulo: string;
	rango: string;
	eli: string;
	timeline: TimelineEntry[];
}
