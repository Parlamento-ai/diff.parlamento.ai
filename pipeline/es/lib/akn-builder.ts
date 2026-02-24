/**
 * AKN XML builder for Spanish legislation.
 *
 * Uses ELI URIs from BOE as FRBR base.
 * FRBR URIs follow the pattern:
 *   Work:          /es/lo/2018/12/05/3
 *   Expression:    /es/lo/2018/12/05/3/spa@2018-12-07
 *   Manifestation: /es/lo/2018/12/05/3/spa@2018-12-07/akn
 */
import { escapeXml, buildArticlesXml, today } from '../../shared/xml.js';
import type { ArticleChange } from '../../../src/lib/types.js';
import type { ParsedArticle } from '../types.js';

export interface ESFRBRMeta {
	eli: string; // /es/lo/2018/12/05/3
	date: string;
	dateName: string;
	authorHref: string;
}

function frbr(meta: ESFRBRMeta): string {
	const gen = today();
	return `      <identification source="#parlamento-ai">
        <FRBRWork>
          <FRBRthis value="${meta.eli}"/>
          <FRBRuri value="${meta.eli}"/>
          <FRBRdate date="${meta.date}" name="${meta.dateName}"/>
          <FRBRauthor href="${meta.authorHref}"/>
          <FRBRcountry value="es"/>
        </FRBRWork>
        <FRBRExpression>
          <FRBRthis value="${meta.eli}/spa@${meta.date}"/>
          <FRBRuri value="${meta.eli}/spa@${meta.date}"/>
          <FRBRdate date="${meta.date}" name="version"/>
          <FRBRlanguage language="spa"/>
        </FRBRExpression>
        <FRBRManifestation>
          <FRBRthis value="${meta.eli}/spa@${meta.date}/akn"/>
          <FRBRuri value="${meta.eli}/spa@${meta.date}/akn"/>
          <FRBRdate date="${gen}" name="generacion"/>
        </FRBRManifestation>
      </identification>`;
}

export function buildActXml(
	articles: ParsedArticle[],
	meta: ESFRBRMeta,
	name: string,
	title: string
): string {
	const mapped = articles.map((a) => ({
		eId: a.eId,
		heading: a.heading,
		content: a.content
	}));

	return `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
  <act name="${escapeXml(name)}">
    <meta>
${frbr(meta)}
    </meta>
    <preface>
      <longTitle><p><docTitle>${escapeXml(title)}</docTitle></p></longTitle>
    </preface>
    <body>
${buildArticlesXml(mapped)}
    </body>
  </act>
</akomaNtoso>`;
}

export function buildAmendmentXml(
	changes: ArticleChange[],
	meta: ESFRBRMeta,
	name: string,
	title: string,
	description: string,
	baseUri: string,
	resultUri: string
): string {
	const changesXml = changes
		.map((c) => {
			switch (c.type) {
				case 'substitute':
					return `        <akndiff:articleChange article="${c.article}" type="substitute">
          <akndiff:old>${escapeXml(c.oldText || '')}</akndiff:old>
          <akndiff:new>${escapeXml(c.newText || '')}</akndiff:new>
        </akndiff:articleChange>`;
				case 'insert':
					return `        <akndiff:articleChange article="${c.article}" type="insert"${c.after ? ` after="${c.after}"` : ''}>
          <akndiff:new>${escapeXml(c.newText || '')}</akndiff:new>
        </akndiff:articleChange>`;
				case 'repeal':
					return `        <akndiff:articleChange article="${c.article}" type="repeal">
          <akndiff:old>${escapeXml(c.oldText || '')}</akndiff:old>
        </akndiff:articleChange>`;
				case 'renumber':
					return `        <akndiff:articleChange article="${c.article}" type="renumber"/>`;
			}
		})
		.join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
  <amendment name="${escapeXml(name)}">
    <meta>
${frbr(meta)}
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
      result="${resultUri}">
${changesXml}
    </akndiff:changeSet>
  </amendment>
</akomaNtoso>`;
}
