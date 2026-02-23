/**
 * AKN XML builder — generates bill, amendment, and act XML documents
 * Consolidated from per-boletin generate-akn.mjs scripts
 */
import type { ArticleChange, ParsedArticle, VotacionData } from '../types.js';
import { escapeXml, buildVoterXml, buildArticlesXml, today } from './xml-helpers.js';

interface FRBRMeta {
	boletin: string;
	slug: string;
	date: string;
	dateName: string;
	authorHref: string;
	authorShowAs?: string;
	country?: string;
}

/** Generate a <bill> XML */
export function buildBillXml(
	articles: ParsedArticle[],
	meta: FRBRMeta,
	preface: string,
	authors?: Array<{ eId: string; href: string; showAs: string }>
): string {
	const gen = today();
	const refsXml = authors?.length
		? `      <references>
${authors.map((a) => `        <TLCPerson eId="${a.eId}" href="${a.href}" showAs="${escapeXml(a.showAs)}"/>`).join('\n')}
      </references>`
		: '';

	return `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
  <bill name="${meta.slug}">
    <meta>
      <identification source="#parlamento-ai">
        <FRBRWork>
          <FRBRthis value="/cl/boletin/${meta.boletin}/${meta.slug}"/>
          <FRBRuri value="/cl/boletin/${meta.boletin}"/>
          <FRBRdate date="${meta.date}" name="${meta.dateName}"/>
          <FRBRauthor href="${meta.authorHref}"/>
          <FRBRcountry value="${meta.country || 'cl'}"/>
        </FRBRWork>
        <FRBRExpression>
          <FRBRthis value="/cl/boletin/${meta.boletin}/${meta.slug}/esp@${meta.date}"/>
          <FRBRuri value="/cl/boletin/${meta.boletin}/esp@${meta.date}"/>
          <FRBRdate date="${meta.date}" name="versión"/>
          <FRBRlanguage language="spa"/>
        </FRBRExpression>
        <FRBRManifestation>
          <FRBRthis value="/cl/boletin/${meta.boletin}/${meta.slug}/esp@${meta.date}/akn"/>
          <FRBRuri value="/cl/boletin/${meta.boletin}/esp@${meta.date}/akn"/>
          <FRBRdate date="${gen}" name="generación"/>
        </FRBRManifestation>
      </identification>
${refsXml}
    </meta>
    <preface>
      <longTitle>
        <p>Proyecto de Ley: <docTitle>${escapeXml(meta.slug)}</docTitle></p>
      </longTitle>
      <p>${escapeXml(preface)}</p>
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
	meta: FRBRMeta,
	preface: string,
	baseUri: string,
	resultUri: string,
	vote?: VotacionData,
	chamber?: 'senador' | 'diputado'
): string {
	const gen = today();
	const voteXml = vote ? buildVoteXml(vote, chamber) : '';
	const changesXml = changes
		.map((c) => {
			switch (c.type) {
				case 'substitute':
					return `      <akndiff:articleChange article="${c.article}" type="substitute">
        <akndiff:old>${escapeXml(c.oldText || '')}</akndiff:old>
        <akndiff:new>${escapeXml(c.newText || '')}</akndiff:new>
      </akndiff:articleChange>`;
				case 'insert':
					return `      <akndiff:articleChange article="${c.article}" type="insert"${c.after ? ` after="${c.after}"` : ''}>
        <akndiff:new>${escapeXml(c.newText || '')}</akndiff:new>
      </akndiff:articleChange>`;
				case 'repeal':
					return `      <akndiff:articleChange article="${c.article}" type="repeal">
        <akndiff:old>${escapeXml(c.oldText || '')}</akndiff:old>
      </akndiff:articleChange>`;
				case 'renumber':
					return `      <akndiff:articleChange article="${c.article}" type="renumber"/>`;
			}
		})
		.join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
  <amendment name="${meta.slug}">
    <meta>
      <identification source="#parlamento-ai">
        <FRBRWork>
          <FRBRthis value="/cl/boletin/${meta.boletin}/${meta.slug}"/>
          <FRBRuri value="/cl/boletin/${meta.boletin}"/>
          <FRBRdate date="${meta.date}" name="${meta.dateName}"/>
          <FRBRauthor href="${meta.authorHref}"/>
          <FRBRcountry value="${meta.country || 'cl'}"/>
        </FRBRWork>
        <FRBRExpression>
          <FRBRthis value="/cl/boletin/${meta.boletin}/${meta.slug}/esp@${meta.date}"/>
          <FRBRuri value="/cl/boletin/${meta.boletin}/esp@${meta.date}"/>
          <FRBRdate date="${meta.date}" name="versión"/>
          <FRBRlanguage language="spa"/>
        </FRBRExpression>
        <FRBRManifestation>
          <FRBRthis value="/cl/boletin/${meta.boletin}/${meta.slug}/esp@${meta.date}/akn"/>
          <FRBRuri value="/cl/boletin/${meta.boletin}/esp@${meta.date}/akn"/>
          <FRBRdate date="${gen}" name="generación"/>
        </FRBRManifestation>
      </identification>
    </meta>
    <preface>
      <longTitle>
        <p><docTitle>${escapeXml(meta.slug)}</docTitle></p>
      </longTitle>
      <p>${escapeXml(preface)}</p>
    </preface>
    <amendmentBody>
      <amendmentContent>
        <p>Cambios al articulado.</p>
      </amendmentContent>
    </amendmentBody>
    <akndiff:changeSet
      base="${baseUri}"
      result="${resultUri}">
${voteXml}
${changesXml}
    </akndiff:changeSet>
  </amendment>
</akomaNtoso>`;
}

/** Generate an <act> XML */
export function buildActXml(
	articles: ParsedArticle[],
	meta: FRBRMeta,
	preface: string
): string {
	const gen = today();

	return `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
  <act name="${meta.slug}">
    <meta>
      <identification source="#parlamento-ai">
        <FRBRWork>
          <FRBRthis value="/cl/boletin/${meta.boletin}/${meta.slug}"/>
          <FRBRuri value="/cl/boletin/${meta.boletin}"/>
          <FRBRdate date="${meta.date}" name="${meta.dateName}"/>
          <FRBRauthor href="${meta.authorHref}"/>
          <FRBRcountry value="${meta.country || 'cl'}"/>
        </FRBRWork>
        <FRBRExpression>
          <FRBRthis value="/cl/boletin/${meta.boletin}/${meta.slug}/esp@${meta.date}"/>
          <FRBRuri value="/cl/boletin/${meta.boletin}/esp@${meta.date}"/>
          <FRBRdate date="${meta.date}" name="versión"/>
          <FRBRlanguage language="spa"/>
        </FRBRExpression>
        <FRBRManifestation>
          <FRBRthis value="/cl/boletin/${meta.boletin}/${meta.slug}/esp@${meta.date}/akn"/>
          <FRBRuri value="/cl/boletin/${meta.boletin}/esp@${meta.date}/akn"/>
          <FRBRdate date="${gen}" name="generación"/>
        </FRBRManifestation>
      </identification>
    </meta>
    <preface>
      <longTitle>
        <p><docTitle>${escapeXml(preface)}</docTitle></p>
      </longTitle>
    </preface>
    <body>
${buildArticlesXml(articles)}
    </body>
  </act>
</akomaNtoso>`;
}

function buildVoteXml(vote: VotacionData, chamber: 'senador' | 'diputado' = 'senador'): string {
	const forXml = buildVoterXml(vote.votantes.for, 'for', chamber);
	const againstXml = buildVoterXml(vote.votantes.against, 'against', chamber);
	const abstainXml = buildVoterXml(vote.votantes.abstain, 'abstain', chamber);

	return `      <akndiff:vote date="${vote.fecha}" result="${vote.resultado}" source="/cl/senado/sesion/${vote.fecha}">
${forXml}
${againstXml}
${abstainXml}
      </akndiff:vote>`;
}
