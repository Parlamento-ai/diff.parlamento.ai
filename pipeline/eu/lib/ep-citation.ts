/**
 * EP Open Data → Akoma Ntoso citation (plenary agenda)
 *
 * Downloads a plenary meeting agenda from the European Parliament Open Data API
 * and converts it to a valid AKN 3.0 XML document with <doc name="citation"> structure.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fetchJson, EP_API } from './http.js';
import { XmlBuilder, esc } from './xml-builder.js';

// ─── Extract meeting ID from the URI ─────────────────────────────────────────

function meetingIdFromUri(uri: string): string {
	// e.g. "eli/dl/event/MTG-PL-2025-01-20" → "MTG-PL-2025-01-20"
	const parts = uri.split('/');
	return parts[parts.length - 1];
}

// ─── Main converter ──────────────────────────────────────────────────────────

export async function buildCitation(meetingId: string, outputPath: string): Promise<void> {
	const meetingDate = meetingId.replace('MTG-PL-', '');
	const meetingLabel = `Plenary Session ${meetingDate}`;
	const attendees = 0;

	console.log(`  Meeting: ${meetingLabel} (${meetingId})`);
	console.log(`  Date: ${meetingDate}, Attendees: ${attendees}`);

	// Step 2: fetch agenda — try foreseen-activities (future meetings), fall back to decisions (past meetings)
	let agendaItems: any[] = [];
	const foreseenUrl = `${EP_API}/api/v2/meetings/${meetingId}/foreseen-activities?format=application%2Fld%2Bjson`;
	const decisionsUrl = `${EP_API}/api/v2/meetings/${meetingId}/decisions?format=application%2Fld%2Bjson&offset=0&limit=50`;

	console.log(`Fetching agenda for ${meetingId}...`);
	try {
		const agendaJson = await fetchJson(foreseenUrl);
		agendaItems = agendaJson.data ?? [];
		console.log(`  Foreseen activities: ${agendaItems.length}`);
	} catch {
		console.log(`  No foreseen activities, trying decisions...`);
		try {
			const decisionsJson = await fetchJson(decisionsUrl);
			agendaItems = decisionsJson.data ?? [];
			console.log(`  Decisions: ${agendaItems.length}`);
		} catch (e2: any) {
			console.error(`  Both endpoints failed: ${e2.message}`);
		}
	}

	if (agendaItems.length === 0) {
		console.error(`No agenda data found for ${meetingId}`);
		process.exit(1);
	}

	// Build AKN
	const AKN_NS = 'http://docs.oasis-open.org/legaldocml/ns/akn/3.0';
	const eli = `${EP_API}/eli/dl/event/${meetingId}`;
	const x = new XmlBuilder();

	x.emit(`<?xml version="1.0" encoding="UTF-8"?>`);
	x.open('akomaNtoso', { xmlns: AKN_NS });
	x.open('doc', { name: 'citation' });

	// ── meta
	x.open('meta');
	x.open('identification', { source: '#ep-opendata' });

	x.open('FRBRWork');
	x.selfClose('FRBRthis', { value: eli });
	x.selfClose('FRBRuri', { value: eli });
	x.selfClose('FRBRdate', { date: meetingDate, name: 'meeting' });
	x.selfClose('FRBRauthor', { href: '#ep' });
	x.selfClose('FRBRcountry', { value: 'eu' });
	x.close('FRBRWork');

	x.open('FRBRExpression');
	x.selfClose('FRBRthis', { value: `${eli}/mul` });
	x.selfClose('FRBRuri', { value: `${eli}/mul` });
	x.selfClose('FRBRdate', { date: meetingDate, name: 'meeting' });
	x.selfClose('FRBRauthor', { href: '#ep' });
	x.selfClose('FRBRlanguage', { language: 'mul' });
	x.close('FRBRExpression');

	x.open('FRBRManifestation');
	x.selfClose('FRBRthis', { value: `${eli}/mul/xml` });
	x.selfClose('FRBRuri', { value: `${eli}/mul/xml` });
	x.selfClose('FRBRdate', { date: new Date().toISOString().slice(0, 10), name: 'transformation' });
	x.selfClose('FRBRauthor', { href: '#poc-epdata-to-citation' });
	x.close('FRBRManifestation');

	x.close('identification');

	// references
	x.open('references', { source: '#ep-opendata' });
	x.selfClose('TLCOrganization', {
		eId: 'ep-opendata',
		href: 'https://data.europarl.europa.eu',
		showAs: 'European Parliament Open Data Portal',
	});
	x.selfClose('TLCOrganization', {
		eId: 'ep',
		href: 'https://data.europarl.europa.eu/org/EU_PARLIAMENT',
		showAs: 'European Parliament',
	});
	x.close('references');

	x.close('meta');

	// ── preface
	x.open('preface', { eId: 'preface' });
	x.open('longTitle', { eId: 'longTitle' });
	x.inline('p', {}, `<docType>Plenary Session Agenda</docType>`);
	x.inline('p', {}, `<docTitle>${esc(meetingLabel)}</docTitle>`);
	x.inline('p', {}, `<date date="${esc(meetingDate)}">${esc(meetingDate)}</date>`);
	if (attendees > 0) {
		x.inline('p', {}, `Attendees: ${attendees}`);
	}
	x.close('longTitle');
	x.close('preface');

	// ── mainBody: agenda items as sections
	x.open('mainBody');

	for (let i = 0; i < agendaItems.length; i++) {
		const item = agendaItems[i];
		const itemId = meetingIdFromUri(item.id);
		const sectionEId = `sec_${i + 1}`;

		// Get label — prefer agendaLabel, fall back to activity_label (decisions have different fields)
		const label: string =
			item.agendaLabel?.en ?? item.activity_label?.en ?? item.decision_about?.en ?? itemId;
		const startTime: string = item.activity_start_date ?? '';
		const endTime: string = item.activity_end_date ?? '';
		const activityType: string = item.had_activity_type ?? item.decision_method ?? '';
		const subItems: string[] = item.consists_of ?? [];
		const room: string = item.hasRoom?.officeAddress ?? '';

		x.open('section', { eId: sectionEId });
		x.inline('num', {}, String(i + 1));
		x.inline('heading', {}, esc(label));

		x.open('content', { eId: `${sectionEId}__content` });

		// Time info
		if (startTime) {
			const timeStr = startTime.includes('T') ? startTime.split('T')[1].slice(0, 5) : startTime;
			const endStr = endTime && endTime.includes('T') ? endTime.split('T')[1].slice(0, 5) : '';
			const timeLine = endStr ? `${timeStr} - ${endStr}` : timeStr;
			x.inline('p', { class: 'time' }, `<time datetime="${esc(startTime)}">${esc(timeLine)}</time>`);
		}

		// Activity type
		if (activityType) {
			const typeLabel = activityType.split('/').pop() ?? activityType;
			x.inline('p', { class: 'activityType' }, esc(typeLabel));
		}

		// Room
		if (room) {
			x.inline('p', { class: 'room' }, `Room: ${esc(room)}`);
		}

		// Sub-items (referenced agenda points)
		if (subItems.length > 0) {
			x.inline('p', { class: 'subItems' }, `Sub-items: ${subItems.length}`);
			for (const sub of subItems) {
				const subLabel = meetingIdFromUri(sub);
				x.inline('p', { class: 'subItem' }, `<ref href="${EP_API}/${esc(sub)}">${esc(subLabel)}</ref>`);
			}
		}

		x.close('content');
		x.close('section');
	}

	x.close('mainBody');

	x.close('doc');
	x.close('akomaNtoso');

	// Write output
	const outputDir = dirname(outputPath);
	mkdirSync(outputDir, { recursive: true });
	const xml = x.toString();
	writeFileSync(outputPath, xml, 'utf-8');
	console.log(`\nWritten: ${outputPath} (${xml.length} bytes)`);

	// Preview
	const preview = xml.split('\n').slice(0, 30);
	console.log('\n--- Preview (first 30 lines) ---');
	console.log(preview.join('\n'));
	console.log('--- ... ---');
}
