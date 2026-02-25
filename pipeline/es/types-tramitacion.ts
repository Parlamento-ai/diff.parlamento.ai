/**
 * Types for the ES Tramitación pipeline — bills in parliamentary process
 *
 * Unlike the BOE pipeline (published laws), this handles projects still
 * being debated in Congress, sourced from Congreso Open Data + BOCG PDFs.
 */
export type { ParsedArticle } from './types.js';

/** A BOCG URL with its phase number and label */
export interface BocgUrl {
	url: string;
	phase: number; // 1=original, 2=enmiendas, 3=índice, 4=ponencia, 5=dictamen, etc.
	label: string; // "A-36-1" or human-readable
}

/** Discovery output — metadata from Congreso JSON */
export interface TramitacionDiscovery {
	expediente: string; // "121/000036"
	titulo: string;
	situacion: string; // "En tramitación en el Senado"
	comision: string;
	fechaPresentacion: string; // YYYY-MM-DD
	bocgUrls: BocgUrl[];
	tramitacion: string; // Raw tramitación text
}

/** Pipeline configuration for a tramitación project */
export interface TramitacionConfig {
	expediente: string;
	slug: string; // "121-000036-economia-social"
	titulo: string;
	timeline: TramitacionTimelineEntry[];
}

/** A single step in the tramitación timeline */
export interface TramitacionTimelineEntry {
	slug: string; // "bill-original", "amendment-ponencia"
	label: string; // "Texto Original", "Informe de Ponencia"
	date: string; // YYYY-MM-DD (from BOCG publication)
	type: 'bill' | 'amendment';
	bocgPhase: number;
	sourceUrl: string;
}
