export interface AknNode {
	name: string;
	attributes: Record<string, string>;
	children: AknNode[];
	text?: string;
}

export type ExplorerDocType =
	| 'act'
	| 'bill'
	| 'amendment'
	| 'debate'
	| 'judgment'
	| 'officialGazette'
	| 'documentCollection'
	| 'doc'
	| 'statement'
	| 'portion';

export interface FRBRMeta {
	workUri: string;
	expressionUri: string;
	date: string;
	dateName: string;
	author: string;
	authorLabel: string;
	country?: string;
}

export interface GenericAknDocument {
	type: ExplorerDocType;
	name: string;
	frbr: FRBRMeta;
	root: AknNode;
	rawXml: string;
}

export interface ManifestEntry {
	uri: string;
	type: ExplorerDocType;
	title: string;
	description: string;
	filePath: string;
}

export interface ExplorerManifest {
	documents: ManifestEntry[];
}
