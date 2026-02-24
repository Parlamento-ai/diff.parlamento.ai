/**
 * AKN XML builder for US Congress bills
 * Generates bill, amendment, and act XML documents with US FRBR URIs
 */
import type { ArticleChange } from '../types.js';
import type { ParsedSection, ParsedVote } from '../types.js';
import { escapeXml, buildArticlesXml, today } from '../../cl/lib/xml-helpers.js';

interface USFRBRMeta {
	thisValue: string; // e.g. /us/bill/119/s/5/pcs
	uri: string; // e.g. /us/bill/119/s/5
	date: string;
	dateName: string;
	authorHref: string;
}

function frbr(meta: USFRBRMeta): string {
	const gen = today();
	return `      <identification source="#parlamento-ai">
        <FRBRWork>
          <FRBRthis value="${meta.thisValue}"/>
          <FRBRuri value="${meta.uri}"/>
          <FRBRdate date="${meta.date}" name="${meta.dateName}"/>
          <FRBRauthor href="${meta.authorHref}"/>
          <FRBRcountry value="us"/>
        </FRBRWork>
        <FRBRExpression>
          <FRBRthis value="${meta.thisValue}/eng@${meta.date}"/>
          <FRBRuri value="${meta.uri}/eng@${meta.date}"/>
          <FRBRdate date="${meta.date}" name="version"/>
          <FRBRlanguage language="eng"/>
        </FRBRExpression>
        <FRBRManifestation>
          <FRBRthis value="${meta.thisValue}/eng@${meta.date}/akn"/>
          <FRBRuri value="${meta.uri}/eng@${meta.date}/akn"/>
          <FRBRdate date="${gen}" name="generation"/>
        </FRBRManifestation>
      </identification>`;
}

function voterXml(voters: Array<{ href: string; showAs: string }>, indent: string): string {
	return voters
		.map((v) => `${indent}<akndiff:voter href="${v.href}" showAs="${escapeXml(v.showAs)}"/>`)
		.join('\n');
}

/** Generate a <bill> XML for US */
export function buildBillXml(
	sections: ParsedSection[],
	meta: USFRBRMeta,
	name: string,
	title: string,
	description: string,
	sponsor?: { eId: string; href: string; showAs: string }
): string {
	const articles = sections.map((s) => ({ eId: s.eId, heading: s.heading, content: s.content }));
	const refsXml = sponsor
		? `\n      <references>\n        <TLCPerson eId="${sponsor.eId}" href="${sponsor.href}" showAs="${escapeXml(sponsor.showAs)}"/>\n      </references>`
		: '';

	return `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
  <bill name="${name}">
    <meta>
${frbr(meta)}${refsXml}
    </meta>
    <preface>
      <longTitle><p>${escapeXml(title)}</p></longTitle>
      <p>${escapeXml(description)}</p>
    </preface>
    <body>
${buildArticlesXml(articles)}
    </body>
  </bill>
</akomaNtoso>`;
}

/** Generate an <amendment> XML with changeSet and optional vote */
export function buildAmendmentXml(
	changes: ArticleChange[],
	meta: USFRBRMeta,
	name: string,
	title: string,
	description: string,
	baseUri: string,
	resultUri: string,
	vote?: ParsedVote,
	chamberRef?: { eId: string; href: string; showAs: string }
): string {
	const refsXml = chamberRef
		? `\n      <references>\n        <TLCOrganization eId="${chamberRef.eId}" href="${chamberRef.href}" showAs="${escapeXml(chamberRef.showAs)}"/>\n      </references>`
		: '';

	let voteXml = '';
	if (vote) {
		const forXml = vote.forVoters.length
			? `          <akndiff:for count="${vote.forCount}">\n${voterXml(vote.forVoters, '            ')}\n          </akndiff:for>`
			: `          <akndiff:for/>`;
		const againstXml = vote.againstVoters.length
			? `          <akndiff:against count="${vote.againstCount}">\n${voterXml(vote.againstVoters, '            ')}\n          </akndiff:against>`
			: `          <akndiff:against/>`;
		voteXml = `\n        <akndiff:vote date="${vote.date}" result="${vote.result}" source="${vote.source}">\n${forXml}\n${againstXml}\n          <akndiff:abstain/>\n        </akndiff:vote>`;
	}

	const changesXml = changes
		.map((c) => {
			switch (c.type) {
				case 'substitute':
					return `        <akndiff:articleChange article="${c.article}" type="substitute">\n          <akndiff:old>${escapeXml(c.oldText || '')}</akndiff:old>\n          <akndiff:new>${escapeXml(c.newText || '')}</akndiff:new>\n        </akndiff:articleChange>`;
				case 'insert':
					return `        <akndiff:articleChange article="${c.article}" type="insert"${c.after ? ` after="${c.after}"` : ''}>\n          <akndiff:new>${escapeXml(c.newText || '')}</akndiff:new>\n        </akndiff:articleChange>`;
				case 'repeal':
					return `        <akndiff:articleChange article="${c.article}" type="repeal">\n          <akndiff:old>${escapeXml(c.oldText || '')}</akndiff:old>\n        </akndiff:articleChange>`;
				case 'renumber':
					return `        <akndiff:articleChange article="${c.article}" type="renumber"/>`;
			}
		})
		.join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
  <amendment name="${name}">
    <meta>
${frbr(meta)}${refsXml}
    </meta>
    <preface>
      <longTitle><p><docTitle>${escapeXml(title)}</docTitle></p></longTitle>
      <p>${escapeXml(description)}</p>
    </preface>
    <amendmentBody>
      <amendmentContent>
        <p>${escapeXml(description)}</p>
      </amendmentContent>
    </amendmentBody>
    <akndiff:changeSet
      base="${baseUri}"
      result="${resultUri}">${voteXml}
${changesXml}
    </akndiff:changeSet>
  </amendment>
</akomaNtoso>`;
}

/** Generate an <act> XML (Public Law) */
export function buildActXml(
	sections: ParsedSection[],
	meta: USFRBRMeta,
	name: string,
	title: string,
	description: string
): string {
	const articles = sections.map((s) => ({ eId: s.eId, heading: s.heading, content: s.content }));

	return `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
  <act name="${name}">
    <meta>
${frbr(meta)}
    </meta>
    <preface>
      <longTitle><p>${escapeXml(title)}</p></longTitle>
      <p>${escapeXml(description)}</p>
    </preface>
    <body>
${buildArticlesXml(articles)}
    </body>
  </act>
</akomaNtoso>`;
}
