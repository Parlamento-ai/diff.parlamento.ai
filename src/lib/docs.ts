export interface DocEntry {
	slug: string;
	title: string;
	section: 'akndiff' | 'explorer' | 'akn';
}

export const docs: DocEntry[] = [
	// AKN Diff (on top)
	{ slug: 'akndiff/overview', title: 'Overview', section: 'akndiff' },
	{ slug: 'akndiff/changeset', title: 'The changeSet element', section: 'akndiff' },
	{ slug: 'akndiff/voting', title: 'The vote element', section: 'akndiff' },
	{ slug: 'akndiff/examples', title: 'Examples walkthrough', section: 'akndiff' },
	// Explorer
	{ slug: 'explorer/overview', title: 'Overview', section: 'explorer' },
	{ slug: 'explorer/act', title: 'act', section: 'explorer' },
	{ slug: 'explorer/bill', title: 'bill', section: 'explorer' },
	{ slug: 'explorer/amendment', title: 'amendment', section: 'explorer' },
	{ slug: 'explorer/debate', title: 'debate', section: 'explorer' },
	{ slug: 'explorer/judgment', title: 'judgment', section: 'explorer' },
	{ slug: 'explorer/officialGazette', title: 'officialGazette', section: 'explorer' },
	{ slug: 'explorer/documentCollection', title: 'documentCollection', section: 'explorer' },
	{ slug: 'explorer/doc', title: 'doc', section: 'explorer' },
	// AKN
	{ slug: 'akn/what-is-akn', title: 'What is Akoma Ntoso?', section: 'akn' },
	{ slug: 'akn/frbr', title: 'The FRBR model', section: 'akn' },
	{ slug: 'akn/document-types', title: 'Document types', section: 'akn' },
	{ slug: 'akn/structure', title: 'Common structure', section: 'akn' },
	{ slug: 'akn/metadata', title: 'Metadata', section: 'akn' },
	{ slug: 'akn/hierarchy', title: 'Legislative hierarchy', section: 'akn' },
	{ slug: 'akn/inline-elements', title: 'Inline elements', section: 'akn' },
	{ slug: 'akn/debates', title: 'Debates', section: 'akn' },
	{ slug: 'akn/naming-convention', title: 'Naming convention', section: 'akn' },
	{ slug: 'akn/national-profiles', title: 'National profiles', section: 'akn' }
];

/** Map from URL slug to actual filename on disk */
export const slugToFile: Record<string, string> = {
	'akndiff/overview': 'akndiff/01-overview.md',
	'akndiff/changeset': 'akndiff/02-changeset.md',
	'akndiff/voting': 'akndiff/03-voting.md',
	'akndiff/examples': 'akndiff/04-examples.md',
	'akn/what-is-akn': 'akn/01-what-is-akn.md',
	'akn/frbr': 'akn/02-frbr.md',
	'akn/document-types': 'akn/03-document-types.md',
	'akn/structure': 'akn/04-structure.md',
	'akn/metadata': 'akn/05-metadata.md',
	'akn/hierarchy': 'akn/06-hierarchy.md',
	'akn/inline-elements': 'akn/07-inline-elements.md',
	'akn/debates': 'akn/08-debates.md',
	'akn/naming-convention': 'akn/09-naming-convention.md',
	'akn/national-profiles': 'akn/10-national-profiles.md'
};
