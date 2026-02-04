import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseGenericAkn } from './akn-parser';
import type { GenericAknDocument } from '$lib/types/explorer';
import type {
	ParliamentMeta,
	ParliamentManifest,
	ParliamentManifestEntry,
	UpcomingSession,
	RecentActivity,
	BillInProgress,
	QuestionSummary,
	PublishedAct,
	BillDetail,
	TimelineEvent
} from '$lib/types/parliament';
import { findNode, findAllNodes, extractTextFromNode } from '$lib/utils/akn-helpers';

const BASE_DIR = join(process.cwd(), 'research/2026-02-04/fake-parliament');

export async function loadParliamentMeta(id: string): Promise<ParliamentMeta> {
	const raw = await readFile(join(BASE_DIR, '_parliament.json'), 'utf-8');
	const meta = JSON.parse(raw) as ParliamentMeta;
	if (meta.id !== id) {
		throw new Error(`Parliament not found: ${id}`);
	}
	return meta;
}

export async function loadParliamentManifest(): Promise<ParliamentManifest> {
	const raw = await readFile(join(BASE_DIR, '_index.json'), 'utf-8');
	return JSON.parse(raw) as ParliamentManifest;
}

export async function loadDocument(entry: ParliamentManifestEntry): Promise<GenericAknDocument> {
	const filePath = join(BASE_DIR, entry.filePath);
	const xml = await readFile(filePath, 'utf-8');
	return parseGenericAkn(xml);
}

export async function loadAllDocuments(
	manifest: ParliamentManifest
): Promise<Map<string, GenericAknDocument>> {
	const docs = new Map<string, GenericAknDocument>();
	await Promise.all(
		manifest.documents.map(async (entry) => {
			const doc = await loadDocument(entry);
			docs.set(entry.uri, doc);
		})
	);
	return docs;
}

function resolveShowAs(root: GenericAknDocument, ref: string): string {
	if (!ref) return '';
	const normalized = ref.startsWith('#') ? ref.slice(1) : ref;
	const allRefs = [
		...findAllNodes(root.root, 'TLCPerson'),
		...findAllNodes(root.root, 'TLCOrganization')
	];
	const match = allRefs.find((node) => node.attributes['eId'] === normalized);
	return match?.attributes['showAs'] || normalized;
}

export function getUpcomingSessions(
	docs: Map<string, GenericAknDocument>,
	manifest: ParliamentManifest
): UpcomingSession[] {
	const now = new Date();
	const sessions: UpcomingSession[] = [];

	for (const entry of manifest.documents) {
		if (entry.type !== 'citation') continue;
		const doc = docs.get(entry.uri);
		if (!doc) continue;

		const citationBody = findNode(doc.root, 'citationBody');
		if (!citationBody) continue;

		const session = findNode(citationBody, 'session');
		if (!session) continue;

		const dateStr = session.attributes['date'] || '';
		if (!dateStr) continue;

		const sessionDate = new Date(dateStr);
		if (sessionDate <= now) continue;

		const agenda = findNode(citationBody, 'agenda');
		const agendaItems: { heading: string; status: string }[] = [];
		if (agenda) {
			for (const item of findAllNodes(agenda, 'agendaItem')) {
				const heading = findNode(item, 'heading');
				agendaItems.push({
					heading: heading ? extractTextFromNode(heading) : '',
					status: item.attributes['status'] || ''
				});
			}
		}

		const bodyNode = findNode(session, 'body');
		sessions.push({
			uri: entry.uri,
			title: entry.title,
			date: dateStr,
			time: session.attributes['time'] || '',
			place: session.attributes['place'] || '',
			chamber: entry.chamber,
			body: bodyNode ? extractTextFromNode(bodyNode) : '',
			agendaItems
		});
	}

	sessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
	return sessions;
}

export function getRecentActivity(
	docs: Map<string, GenericAknDocument>,
	manifest: ParliamentManifest
): RecentActivity[] {
	const activities: RecentActivity[] = [];
	const relevantTypes = ['communication', 'debate', 'question', 'judgment', 'citation'];

	for (const entry of manifest.documents) {
		if (!relevantTypes.includes(entry.type)) continue;
		const doc = docs.get(entry.uri);
		if (!doc) continue;

		let summary = entry.description;
		const date = doc.frbr.date || '';

		activities.push({
			uri: entry.uri,
			title: entry.title,
			type: entry.type,
			date,
			chamber: entry.chamber,
			summary
		});
	}

	activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
	return activities;
}

export function getBillsInProgress(
	docs: Map<string, GenericAknDocument>,
	manifest: ParliamentManifest
): BillInProgress[] {
	const bills: BillInProgress[] = [];

	for (const entry of manifest.documents) {
		if (entry.type !== 'bill') continue;
		const doc = docs.get(entry.uri);
		if (!doc) continue;

		const relatedDocs: { uri: string; title: string; type: string }[] = [];
		let lastAction = 'Submitted';
		let lastActionDate = doc.frbr.date;

		// Find related documents by scanning refs
		for (const otherEntry of manifest.documents) {
			if (otherEntry.uri === entry.uri) continue;
			const otherDoc = docs.get(otherEntry.uri);
			if (!otherDoc) continue;

			const refs = findAllNodes(otherDoc.root, 'ref');
			const transmissions = findAllNodes(otherDoc.root, 'transmission');
			const hasRef = refs.some((r) => r.attributes['href'] === entry.uri);
			const hasTransmission = transmissions.some(
				(t) => t.attributes['refersTo'] === entry.uri
			);

			if (hasRef || hasTransmission) {
				relatedDocs.push({
					uri: otherEntry.uri,
					title: otherEntry.title,
					type: otherEntry.type
				});

				// Track latest action
				const otherDate = otherDoc.frbr.date;
				if (otherDate && otherDate > lastActionDate) {
					lastActionDate = otherDate;
					if (otherEntry.type === 'communication') {
						const transmission = findNode(otherDoc.root, 'transmission');
						const tType = transmission?.attributes['type'] || '';
						if (tType === 'promulgation-request') {
							lastAction = 'Sent to promulgation';
						} else if (tType === 'bill-transmission') {
							lastAction = 'Transmitted to Senado';
						} else {
							lastAction = 'Communication received';
						}
					} else if (otherEntry.type === 'debate') {
						lastAction = 'Debated in plenary';
					} else if (otherEntry.type === 'amendment') {
						lastAction = 'Amendment submitted';
					} else if (otherEntry.type === 'citation') {
						lastAction = 'Session scheduled';
					}
				}
			}
		}

		// Also find amendments that reference the bill
		for (const otherEntry of manifest.documents) {
			if (otherEntry.type !== 'amendment') continue;
			const otherDoc = docs.get(otherEntry.uri);
			if (!otherDoc) continue;
			const refs = findAllNodes(otherDoc.root, 'ref');
			if (refs.some((r) => r.attributes['href'] === entry.uri)) {
				if (!relatedDocs.some((d) => d.uri === otherEntry.uri)) {
					relatedDocs.push({
						uri: otherEntry.uri,
						title: otherEntry.title,
						type: otherEntry.type
					});
				}
			}
		}

		bills.push({
			uri: entry.uri,
			title: entry.title,
			chamber: entry.chamber,
			date: doc.frbr.date,
			author: doc.frbr.authorLabel || '',
			lastAction,
			lastActionDate,
			relatedDocs: relatedDocs as BillInProgress['relatedDocs']
		});
	}

	bills.sort((a, b) => new Date(b.lastActionDate).getTime() - new Date(a.lastActionDate).getTime());
	return bills;
}

export function getQuestionsSummary(
	docs: Map<string, GenericAknDocument>,
	manifest: ParliamentManifest
): QuestionSummary[] {
	const questions: QuestionSummary[] = [];

	for (const entry of manifest.documents) {
		if (entry.type !== 'question') continue;
		const doc = docs.get(entry.uri);
		if (!doc) continue;

		const questionBody = findNode(doc.root, 'questionBody');
		if (!questionBody) continue;

		const questionStatus = findNode(questionBody, 'questionStatus');
		if (!questionStatus) continue;

		const status = questionStatus.attributes['status'] === 'answered' ? 'answered' : 'pending';

		questions.push({
			uri: entry.uri,
			title: entry.title,
			chamber: entry.chamber,
			status: status as 'pending' | 'answered',
			askedBy: resolveShowAs(doc, questionStatus.attributes['askedBy'] || ''),
			addressedTo: resolveShowAs(doc, questionStatus.attributes['addressedTo'] || ''),
			dateAsked: questionStatus.attributes['dateAsked'] || '',
			dateAnswered: questionStatus.attributes['dateAnswered'] || undefined
		});
	}

	return questions;
}

export function getPublishedActs(
	docs: Map<string, GenericAknDocument>,
	manifest: ParliamentManifest
): PublishedAct[] {
	const acts: PublishedAct[] = [];

	for (const entry of manifest.documents) {
		if (entry.type !== 'act' && entry.type !== 'officialGazette') continue;
		const doc = docs.get(entry.uri);
		if (!doc) continue;

		acts.push({
			uri: entry.uri,
			title: entry.title,
			date: doc.frbr.date
		});
	}

	acts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
	return acts;
}

export async function loadBillDetail(
	billUri: string
): Promise<BillDetail> {
	const manifest = await loadParliamentManifest();
	const billEntry = manifest.documents.find((d) => d.uri === billUri);
	if (!billEntry || billEntry.type !== 'bill') {
		throw new Error(`Bill not found: ${billUri}`);
	}

	const docs = await loadAllDocuments(manifest);
	const bill = docs.get(billUri)!;

	const relatedDocs: BillDetail['relatedDocs'] = [];
	const timeline: TimelineEvent[] = [];

	// Bill submission
	timeline.push({
		date: bill.frbr.date,
		type: 'bill',
		title: 'Bill submitted',
		uri: billUri,
		chamber: billEntry.chamber,
		description: `Submitted by ${bill.frbr.authorLabel || 'Unknown'}`
	});

	// Find all related documents
	for (const otherEntry of manifest.documents) {
		if (otherEntry.uri === billUri) continue;
		const otherDoc = docs.get(otherEntry.uri);
		if (!otherDoc) continue;

		const refs = findAllNodes(otherDoc.root, 'ref');
		const transmissions = findAllNodes(otherDoc.root, 'transmission');
		const hasRef = refs.some((r) => r.attributes['href'] === billUri);
		const hasTransmission = transmissions.some(
			(t) => t.attributes['refersTo'] === billUri
		);

		if (hasRef || hasTransmission) {
			relatedDocs.push({ entry: otherEntry, doc: otherDoc });

			let description = otherEntry.description;
			if (otherEntry.type === 'communication') {
				const transmission = findNode(otherDoc.root, 'transmission');
				const from = resolveShowAs(otherDoc, transmission?.attributes['from'] || '');
				const to = resolveShowAs(otherDoc, transmission?.attributes['to'] || '');
				description = `${from} → ${to}`;
			}

			timeline.push({
				date: otherDoc.frbr.date,
				type: otherEntry.type,
				title: otherEntry.title,
				uri: otherEntry.uri,
				chamber: otherEntry.chamber,
				description
			});
		}
	}

	// Also find amendments targeting the original act that the bill modifies
	const actRefs = findAllNodes(bill.root, 'ref')
		.filter((r) => (r.attributes['href'] || '').includes('/act/'))
		.map((r) => r.attributes['href']);

	for (const otherEntry of manifest.documents) {
		if (otherEntry.type !== 'amendment') continue;
		if (relatedDocs.some((d) => d.entry.uri === otherEntry.uri)) continue;
		const otherDoc = docs.get(otherEntry.uri);
		if (!otherDoc) continue;

		const refs = findAllNodes(otherDoc.root, 'ref');
		const targetsThisBill = refs.some((r) => r.attributes['href'] === billUri);
		if (targetsThisBill) {
			relatedDocs.push({ entry: otherEntry, doc: otherDoc });
			timeline.push({
				date: otherDoc.frbr.date,
				type: 'amendment',
				title: otherEntry.title,
				uri: otherEntry.uri,
				chamber: otherEntry.chamber,
				description: `Amendment by ${otherDoc.frbr.authorLabel || 'Unknown'}`
			});
		}
	}

	timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

	return { bill, entry: billEntry, timeline, relatedDocs };
}

export async function loadDocumentByUri(uri: string): Promise<{
	doc: GenericAknDocument;
	entry: ParliamentManifestEntry;
	manifest: ParliamentManifest;
}> {
	const manifest = await loadParliamentManifest();
	const entry = manifest.documents.find((d) => d.uri === uri);
	if (!entry) {
		throw new Error(`Document not found: ${uri}`);
	}
	const doc = await loadDocument(entry);
	return { doc, entry, manifest };
}
