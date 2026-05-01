/** Shape of one node in the rendered schema tree (parser output). */
export type Cardinality = { min: number; max: number | 'unbounded' };

export type AttrInfo = {
	name: string;
	typeRef?: string;
	use: 'required' | 'optional';
	default?: string;
	doc?: string;
};

export type SchemaNode =
	| {
			kind: 'element';
			name: string;
			typeRef?: string;
			doc?: string;
			card: Cardinality;
			attributes: AttrInfo[];
			children: SchemaNode[];
			childMode: 'sequence' | 'choice' | 'all' | 'leaf';
	  }
	| {
			kind: 'cycle';
			name: string;
			typeRef: string;
			card: Cardinality;
			doc?: string;
	  }
	| { kind: 'text'; doc?: string };

export type ParsedSchema = {
	name: string;
	doc?: string;
	root: SchemaNode;
};

export type SchemaIndex = {
	generatedAt: string;
	source: string;
	topLevelTypes: readonly string[];
	types: { name: string; doc?: string; nodeCount: number }[];
};
