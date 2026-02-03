<script lang="ts">
	import type { ManifestEntry, ExplorerDocType } from '$lib/types/explorer';

	let { documents }: { documents: ManifestEntry[] } = $props();

	const TYPE_LABELS: Record<ExplorerDocType, string> = {
		act: 'act',
		bill: 'bill',
		amendment: 'amendment',
		debate: 'debate',
		judgment: 'judgment',
		officialGazette: 'officialGazette',
		documentCollection: 'documentCollection',
		doc: 'doc',
		statement: 'statement',
		portion: 'portion'
	};

	const TYPE_NAMES: Record<ExplorerDocType, string> = {
		act: 'Acts (Leyes)',
		bill: 'Bills (Proyectos de Ley)',
		amendment: 'Amendments (Enmiendas)',
		debate: 'Debates (Actas)',
		judgment: 'Judgments (Sentencias)',
		officialGazette: 'Official Gazettes (Boletines Oficiales)',
		documentCollection: 'Document Collections (Colecciones)',
		doc: 'Generic Documents (Documentos)',
		statement: 'Statements (Declaraciones)',
		portion: 'Portions (Porciones)'
	};

	const TYPE_DESCRIPTIONS: Record<ExplorerDocType, string> = {
		act: 'An act is a law that has been formally enacted by a legislature. It represents the final, binding version of legislation — the text that citizens must follow. In AKN, acts have a structured body with sections, articles, and paragraphs.',
		bill: 'A bill is a proposed law submitted to a legislature for debate and vote. It typically references the act it intends to modify, and includes a preamble explaining the rationale for the changes. Bills contain modification instructions (using <mod> and <ins> elements) that describe how existing law should change.',
		amendment: 'An amendment is a proposed modification to a bill during its legislative process. Individual legislators submit amendments to change specific parts of a bill before the final vote. Each amendment targets specific articles and includes a justification.',
		debate: 'A debate record captures the transcript of a legislative session — who spoke, what they said, and in what order. AKN debates are structured as a sequence of speeches within debate sections, preserving the parliamentary record verbatim.',
		judgment: 'A judgment is a court decision. In AKN, judgments follow a structured format: header (court and case info), introduction, background (facts), arguments (legal reasoning), and decision (the ruling). Judges may reference legislation and prior proceedings.',
		officialGazette: 'An official gazette is the government publication where laws, decrees, and official notices are formally published. It acts as a collection of references to other documents, making them officially public and legally effective.',
		documentCollection: 'A document collection groups related documents into a single navigable package. It is used for legislative dossiers — linking together the original law, bills, amendments, debate records, and final texts of a single legislative process.',
		doc: 'A generic document type for anything that does not fit the more specific categories — committee reports, technical studies, opinions, or administrative documents that are part of the legislative process but have their own format.',
		statement: 'A statement is a formal declaration by a person or body, such as a minister\'s policy statement or an official position paper.',
		portion: 'A portion represents a fragment of a larger document, used when only part of a text needs to be referenced or transmitted independently.'
	};

	const TYPE_COLORS: Record<ExplorerDocType, string> = {
		act: 'text-emerald-700 bg-emerald-50 border-emerald-200',
		bill: 'text-blue-700 bg-blue-50 border-blue-200',
		amendment: 'text-amber-700 bg-amber-50 border-amber-200',
		debate: 'text-purple-700 bg-purple-50 border-purple-200',
		judgment: 'text-red-700 bg-red-50 border-red-200',
		officialGazette: 'text-gray-700 bg-gray-50 border-gray-200',
		documentCollection: 'text-cyan-700 bg-cyan-50 border-cyan-200',
		doc: 'text-stone-700 bg-stone-50 border-stone-200',
		statement: 'text-pink-700 bg-pink-50 border-pink-200',
		portion: 'text-indigo-700 bg-indigo-50 border-indigo-200'
	};

	const TYPE_ORDER: ExplorerDocType[] = [
		'act', 'bill', 'amendment', 'debate', 'judgment',
		'officialGazette', 'documentCollection', 'doc'
	];

	const grouped = $derived.by(() => {
		const groups: Record<string, ManifestEntry[]> = {};
		for (const doc of documents) {
			if (!groups[doc.type]) groups[doc.type] = [];
			groups[doc.type].push(doc);
		}
		return groups;
	});
</script>

<div>
	<div class="mb-8">
		<h1 class="text-3xl font-heading font-bold text-gray-900 mb-3">AKN Explorer</h1>
		<p class="text-gray-600 leading-relaxed mb-2">
			Interactive browser for <strong>Akoma Ntoso</strong> documents.
			Explore how different parliamentary document types link to each other — from laws and bills to debates and court rulings.
		</p>
		<p class="text-gray-600 leading-relaxed mb-2">
			All documents below belong to the fictional <strong>Parliament of Gastronomia</strong>, where legislators debate the proper way to make paella.
			Every cross-reference between documents is a clickable link, so you can navigate the full legislative process as a connected web of AKN files.
		</p>
		<p class="text-sm text-gray-500">
			Click any document to see its rendered content and toggle to raw XML.
		</p>
	</div>

	{#each TYPE_ORDER as type}
		{@const docs = grouped[type]}
		{#if docs && docs.length > 0}
			<div class="mb-8 scroll-mt-20" id={type}>
				<div class="flex items-center gap-2 mb-2">
					<span class="badge {TYPE_COLORS[type]}">{TYPE_LABELS[type]}</span>
					<h2 class="text-lg font-heading font-semibold text-gray-800">
						{TYPE_NAMES[type]}
					</h2>
				</div>
				<p class="text-sm text-gray-600 leading-relaxed mb-3">
					{TYPE_DESCRIPTIONS[type]}
				</p>
				<div class="space-y-2">
					{#each docs as doc}
						<a
							href="/docs/explorer{doc.uri}"
							class="card-layout card-hover block px-4 py-3"
						>
							<div class="font-medium text-gray-900">{doc.title}</div>
							<div class="text-sm text-gray-500 mt-0.5">{doc.description}</div>
							<div class="text-xs font-mono text-gray-400 mt-1">{doc.uri}</div>
						</a>
					{/each}
				</div>
			</div>
		{/if}
	{/each}
</div>
