/**
 * Generic EU Regulation Viewer XML Generator
 *
 * Reads AKN source files and transforms them into the viewer-compatible
 * format used by diff.parlamento.ai. Auto-detects chapter/section structure.
 *
 * Config JSON format:
 *   {
 *     "slug": "ai-act-regulation",
 *     "sourcesDir": "../ai-act/sources",
 *     "outputDir": "../ai-act/akn",
 *     "billFile": "52021PC0206-bill-akn.xml",
 *     "finalFile": "32024R1689-akn.xml",
 *     "changesetFile": "changeset-ai-act.xml",
 *     "epAmendmentsFile": "ep-amendments-ai-act.xml",
 *     "proposal": { "celex": "52021PC0206", "comYear": 2021, "comNum": 206, "date": "2021-04-21", "title": "..." },
 *     "final": { "celex": "32024R1689", "regYear": 2024, "regNum": 1689, "date": "2024-07-12", "pubDate": "2024-07-12", "title": "..." },
 *     "legislativeProcedure": { "procedure": "2021/0106(COD)", "voteDate": "2024-03-13", "voteFor": 523, "voteAgainst": 46, "voteAbstain": 49 }
 *   }
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';

export function generateViewerXmls(configPath: string): void {
	const require = createRequire(join(process.cwd(), 'package.json'));
	const { XMLParser } = require('fast-xml-parser');

	const resolvedConfigPath = resolve(configPath);
	const config = JSON.parse(readFileSync(resolvedConfigPath, 'utf-8'));
	const SCRIPT_DIR = dirname(resolvedConfigPath);
	const SOURCES_DIR = resolve(SCRIPT_DIR, config.sourcesDir || 'sources');
	const OUTPUT_DIR = resolve(SCRIPT_DIR, config.outputDir || 'akn');

	mkdirSync(OUTPUT_DIR, { recursive: true });

	// --- XML Parser ---
	const parser = new XMLParser({
		ignoreAttributes: false,
		attributeNamePrefix: '@_',
		removeNSPrefix: false,
		preserveOrder: false,
		trimValues: false,
		isArray: (name: string) => ['chapter', 'section', 'article', 'paragraph', 'citation', 'recital', 'p', 'point'].includes(name),
	});

	// --- Helpers ---

	function extractText(node: unknown): string {
		if (typeof node === 'string') return node.trim();
		if (typeof node === 'number') return String(node);
		if (!node || typeof node !== 'object') return '';

		if (Array.isArray(node)) {
			return node.map(extractText).filter(Boolean).join(' ');
		}

		const obj = node as Record<string, unknown>;

		if ('#text' in obj) {
			const parts: string[] = [String(obj['#text'])];
			for (const [key, val] of Object.entries(obj)) {
				if (key !== '#text' && !key.startsWith('@_')) {
					parts.push(extractText(val));
				}
			}
			return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
		}

		const texts: string[] = [];
		for (const [key, val] of Object.entries(obj)) {
			if (!key.startsWith('@_')) {
				texts.push(extractText(val));
			}
		}
		return texts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
	}

	function escapeXml(s: string): string {
		return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}

	interface ArticleData {
		eId: string;
		heading: string;
		content: string;
	}

	interface SectionData {
		eId: string;
		heading: string;
		articles: ArticleData[];
	}

	function extractArticle(art: Record<string, unknown>): ArticleData {
		const eId = (art['@_eId'] as string) || '';

		let heading = '';
		if (art.num) heading = extractText(art.num);
		if (art.heading) {
			const h = extractText(art.heading);
			heading = heading ? `${heading} ${h}` : h;
		}

		let content = '';
		if (art.paragraph) {
			const paragraphs = Array.isArray(art.paragraph) ? art.paragraph : [art.paragraph];
			content = paragraphs.map((p: Record<string, unknown>) => {
				const parts: string[] = [];
				const num = p.num ? extractText(p.num) : '';

				// Extract intro text (before points)
				if (p.intro) parts.push(extractText(p.intro));
				// Extract content (simple paragraph text)
				if (p.content) parts.push(extractText(p.content));

				// Extract points within the paragraph
				if (p.point) {
					const points = Array.isArray(p.point) ? p.point : [p.point];
					for (const pt of points) {
						parts.push(extractText(pt as Record<string, unknown>));
					}
				}

				// Fallback: extract all text from paragraph if no structured content found
				if (parts.length === 0) parts.push(extractText(p));

				const text = parts.join(' ');
				return num ? `${num} ${text}` : text;
			}).join(' ');
		} else if (art.content) {
			content = extractText(art.content);
		}

		// Fallback: <intro> + <point> (e.g. definitions article in bill AKN)
		if (!content || content.trim() === '') {
			const parts: string[] = [];
			if (art.intro) parts.push(extractText(art.intro));
			if (art.point) {
				const points = Array.isArray(art.point) ? art.point : [art.point];
				for (const pt of points) {
					parts.push(extractText(pt as Record<string, unknown>));
				}
			}
			if (parts.length > 0) content = parts.join(' ');
		}

		return { eId, heading: heading.replace(/\s+/g, ' ').trim(), content: content.replace(/\s+/g, ' ').trim() };
	}

	function artNum(eId: string): number {
		const m = eId.match(/art_(\d+)/);
		return m ? parseInt(m[1], 10) : 0;
	}

	/** Auto-detect chapter/section structure from AKN body */
	function autoDetectSections(body: Record<string, unknown>): SectionData[] {
		const sections: SectionData[] = [];

		if (body.chapter) {
			const chapters = Array.isArray(body.chapter) ? body.chapter : [body.chapter];
			for (const chap of chapters) {
				const c = chap as Record<string, unknown>;
				const eId = (c['@_eId'] as string) || '';
				let heading = '';
				if (c.num) heading = extractText(c.num);
				if (c.heading) {
					const h = extractText(c.heading);
					heading = heading ? `${heading} – ${h}` : h;
				}

				// Collect articles directly under chapter
				const articles: ArticleData[] = [];
				if (c.article) {
					const arts = Array.isArray(c.article) ? c.article : [c.article];
					for (const art of arts) {
						articles.push(extractArticle(art as Record<string, unknown>));
					}
				}

				// Collect articles from sections within chapter
				if (c.section) {
					const secs = Array.isArray(c.section) ? c.section : [c.section];
					for (const sec of secs) {
						const s = sec as Record<string, unknown>;
						if (s.article) {
							const arts = Array.isArray(s.article) ? s.article : [s.article];
							for (const art of arts) {
								articles.push(extractArticle(art as Record<string, unknown>));
							}
						}
					}
				}

				if (articles.length > 0) {
					articles.sort((a, b) => artNum(a.eId) - artNum(b.eId));
					sections.push({ eId, heading, articles });
				}
			}
		} else {
			// No chapters — flat article list
			const articles: ArticleData[] = [];
			if (body.article) {
				const arts = Array.isArray(body.article) ? body.article : [body.article];
				for (const art of arts) {
					articles.push(extractArticle(art as Record<string, unknown>));
				}
			}
			if (articles.length > 0) {
				articles.sort((a, b) => artNum(a.eId) - artNum(b.eId));
				sections.push({ eId: 'body', heading: '', articles });
			}
		}

		return sections;
	}

	function serializeArticle(art: ArticleData): string {
		return `      <article eId="${escapeXml(art.eId)}">
        <heading>${escapeXml(art.heading)}</heading>
        <content>
        <p>${escapeXml(art.content)}</p>
        </content>
      </article>`;
	}

	function serializeSections(sections: SectionData[]): string {
		return sections.map(sec => {
			const arts = sec.articles.map(serializeArticle).join('\n');
			return `    <section eId="${escapeXml(sec.eId)}">
      <heading>${escapeXml(sec.heading)}</heading>
${arts}
    </section>`;
		}).join('\n');
	}

	function parseFile(filename: string): Record<string, unknown> {
		const xml = readFileSync(join(SOURCES_DIR, filename), 'utf-8');
		return parser.parse(xml);
	}

	// --- Generate 01-act-original.xml ---

	function generateActOriginal() {
		console.log('Generating 01-act-original.xml (COM proposal)...');

		const parsed = parseFile(config.billFile);
		const root = parsed.akomaNtoso as Record<string, unknown>;
		const bill = root.bill as Record<string, unknown>;
		const body = bill.body as Record<string, unknown>;

		const sections = autoDetectSections(body);
		const totalArticles = sections.reduce((sum, s) => sum + s.articles.length, 0);
		console.log(`  Extracted ${totalArticles} articles in ${sections.length} sections`);

		const p = config.proposal;
		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
  <act name="${escapeXml(config.slug)}-com-proposal">
    <meta>
      <identification source="#parlamento-ai">
        <FRBRWork>
          <FRBRthis value="http://data.europa.eu/eli/comProposal/${p.comYear}/${p.comNum}"/>
          <FRBRuri value="http://data.europa.eu/eli/comProposal/${p.comYear}/${p.comNum}"/>
          <FRBRdate date="${p.date}" name="proposal"/>
          <FRBRauthor href="http://publications.europa.eu/resource/authority/corporate-body/COM"/>
          <FRBRcountry value="eu"/>
        </FRBRWork>
        <FRBRExpression>
          <FRBRthis value="http://data.europa.eu/eli/comProposal/${p.comYear}/${p.comNum}/en"/>
          <FRBRuri value="http://data.europa.eu/eli/comProposal/${p.comYear}/${p.comNum}/en"/>
          <FRBRdate date="${p.date}" name="version"/>
          <FRBRlanguage language="en"/>
        </FRBRExpression>
        <FRBRManifestation>
          <FRBRthis value="http://data.europa.eu/eli/comProposal/${p.comYear}/${p.comNum}/en/akn"/>
          <FRBRuri value="http://data.europa.eu/eli/comProposal/${p.comYear}/${p.comNum}/en/akn"/>
          <FRBRdate date="${new Date().toISOString().slice(0, 10)}" name="generation"/>
        </FRBRManifestation>
      </identification>
      <references>
        <TLCOrganization eId="com" href="http://publications.europa.eu/resource/authority/corporate-body/COM" showAs="European Commission"/>
      </references>
    </meta>
    <preface>
      <longTitle>
        <p><docTitle>${escapeXml(p.title)}</docTitle></p>
      </longTitle>
    </preface>
    <body>
${serializeSections(sections)}
    </body>
  </act>
</akomaNtoso>`;

		const outPath = join(OUTPUT_DIR, '01-act-original.xml');
		writeFileSync(outPath, xml, 'utf-8');
		console.log(`  Written: ${outPath} (${(xml.length / 1024).toFixed(0)} KB)`);
	}

	// --- Generate 03-act-final.xml ---

	function generateActFinal() {
		console.log('Generating 03-act-final.xml (Final Regulation)...');

		const parsed = parseFile(config.finalFile);
		const root = parsed.akomaNtoso as Record<string, unknown>;
		const act = root.act as Record<string, unknown>;
		const body = act.body as Record<string, unknown>;

		const sections = autoDetectSections(body);
		const totalArticles = sections.reduce((sum, s) => sum + s.articles.length, 0);
		console.log(`  Extracted ${totalArticles} articles in ${sections.length} sections`);

		const f = config.final;
		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
  <act name="${escapeXml(config.slug)}-${f.regYear}-${f.regNum}">
    <meta>
      <identification source="#parlamento-ai">
        <FRBRWork>
          <FRBRthis value="http://data.europa.eu/eli/reg/${f.regYear}/${f.regNum}/oj"/>
          <FRBRuri value="http://data.europa.eu/eli/reg/${f.regYear}/${f.regNum}/oj"/>
          <FRBRdate date="${f.pubDate}" name="publication"/>
          <FRBRauthor href="http://publications.europa.eu/resource/authority/corporate-body/CONSILIUM"/>
          <FRBRcountry value="eu"/>
        </FRBRWork>
        <FRBRExpression>
          <FRBRthis value="http://data.europa.eu/eli/reg/${f.regYear}/${f.regNum}/oj/en"/>
          <FRBRuri value="http://data.europa.eu/eli/reg/${f.regYear}/${f.regNum}/oj/en"/>
          <FRBRdate date="${f.pubDate}" name="publication"/>
          <FRBRlanguage language="en"/>
        </FRBRExpression>
        <FRBRManifestation>
          <FRBRthis value="http://data.europa.eu/eli/reg/${f.regYear}/${f.regNum}/oj/en/akn"/>
          <FRBRuri value="http://data.europa.eu/eli/reg/${f.regYear}/${f.regNum}/oj/en/akn"/>
          <FRBRdate date="${new Date().toISOString().slice(0, 10)}" name="generation"/>
        </FRBRManifestation>
      </identification>
      <references>
        <TLCOrganization eId="council" href="http://publications.europa.eu/resource/authority/corporate-body/CONSILIUM" showAs="Council of the European Union"/>
      </references>
    </meta>
    <preface>
      <longTitle>
        <p><docTitle>${escapeXml(f.title)}</docTitle></p>
      </longTitle>
    </preface>
    <body>
${serializeSections(sections)}
    </body>
  </act>
</akomaNtoso>`;

		const outPath = join(OUTPUT_DIR, '03-act-final.xml');
		writeFileSync(outPath, xml, 'utf-8');
		console.log(`  Written: ${outPath} (${(xml.length / 1024).toFixed(0)} KB)`);
	}

	// --- Enrich 02-amendment-1.xml (EP amendments with voter names) ---

	interface VoteIndexEntry {
		index: number;
		label: string;
		outcome: string;
		forCount: number;
		againstCount: number;
		abstainCount: number;
		voters: {
			for: { href: string; showAs: string }[];
			against: { href: string; showAs: string }[];
			abstain: { href: string; showAs: string }[];
		};
	}

	// Build voter XML elements for each category
	function voterElements(voters: { href: string; showAs: string }[]): string {
		return voters.map(v =>
			`        <akndiff:voter href="${escapeXml(v.href)}" showAs="${escapeXml(v.showAs)}"/>`
		).join('\n');
	}

	function findVoteMatch(voteIndex: VoteIndexEntry[]): VoteIndexEntry | undefined {
		const lp = config.legislativeProcedure;
		const targetFor = lp.voteFor as number;
		const targetAgainst = lp.voteAgainst as number;
		const targetAbstain = lp.voteAbstain as number;
		return voteIndex.find((d: VoteIndexEntry) =>
			d.forCount === targetFor &&
			d.againstCount === targetAgainst &&
			d.abstainCount === targetAbstain
		);
	}

	function loadVoteIndex(): { index: VoteIndexEntry[]; match: VoteIndexEntry | undefined } | null {
		const lp = config.legislativeProcedure;
		if (!lp?.voteDate) return null;
		const meetingId = `MTG-PL-${lp.voteDate}`;
		const indexPath = join(SOURCES_DIR, `eu-votes-${meetingId}-index.json`);
		if (!existsSync(indexPath)) return null;
		const index: VoteIndexEntry[] = JSON.parse(readFileSync(indexPath, 'utf-8'));
		return { index, match: findVoteMatch(index) };
	}

	function buildTlcPersonElements(voters: { href: string; showAs: string }[]): string {
		return voters.map(v => {
			const id = v.href.split('/').pop() || '';
			return `        <TLCPerson eId="mep-${escapeXml(id)}" href="${escapeXml(v.href)}" showAs="${escapeXml(v.showAs)}"/>`;
		}).join('\n');
	}

	function enrichEpAmendments() {
		const lp = config.legislativeProcedure;

		if (!config.epAmendmentsFile) {
			// No EP amendments file (trilogue) — generate amendment by diffing bill vs final
			if (!lp?.voteDate || !lp?.voteFor) {
				console.log('Skipping 02-amendment-1.xml (no epAmendmentsFile and no vote data)');
				return;
			}

			console.log('Generating 02-amendment-1.xml (trilogue — diffing bill vs final)...');

			// Parse bill and final to extract articles for comparison
			const billPath = join(SOURCES_DIR, config.billFile);
			const finalPath = join(SOURCES_DIR, config.finalFile);

			if (!existsSync(billPath) || !existsSync(finalPath)) {
				console.log('  Warning: bill or final file missing, cannot generate diff');
				return;
			}

			const billParsed = parser.parse(readFileSync(billPath, 'utf-8'));
			const finalParsed = parser.parse(readFileSync(finalPath, 'utf-8'));

			const billBody = billParsed?.akomaNtoso?.act?.body || billParsed?.akomaNtoso?.bill?.body;
			const finalBody = finalParsed?.akomaNtoso?.act?.body || finalParsed?.akomaNtoso?.bill?.body;

			const billSections = billBody ? autoDetectSections(billBody) : [];
			const finalSections = finalBody ? autoDetectSections(finalBody) : [];

			// Flatten all articles from sections
			const billArticles: ArticleData[] = billSections.flatMap(s => s.articles);
			const finalArticles: ArticleData[] = finalSections.flatMap(s => s.articles);

			// Build maps by article number
			const billByNum = new Map<number, ArticleData>();
			for (const art of billArticles) billByNum.set(artNum(art.eId), art);
			const finalByNum = new Map<number, ArticleData>();
			for (const art of finalArticles) finalByNum.set(artNum(art.eId), art);

			// Compare articles
			const allNums = new Set([...billByNum.keys(), ...finalByNum.keys()]);
			const sortedNums = [...allNums].sort((a, b) => a - b);

			const articleChanges: string[] = [];
			let substitutes = 0, inserts = 0, repeals = 0;

			for (const num of sortedNums) {
				const bill = billByNum.get(num);
				const final = finalByNum.get(num);

				if (bill && final) {
					// Both exist — check if content changed
					if (bill.content !== final.content || bill.heading !== final.heading) {
						const oldText = bill.heading ? `${bill.heading} ${bill.content}` : bill.content;
						const newText = final.heading ? `${final.heading} ${final.content}` : final.content;
						articleChanges.push(`      <akndiff:articleChange article="art_${num}" type="substitute">
        <akndiff:old>${escapeXml(oldText)}</akndiff:old>
        <akndiff:new>${escapeXml(newText)}</akndiff:new>
      </akndiff:articleChange>`);
						substitutes++;
					}
				} else if (final && !bill) {
					// Only in final — inserted
					const newText = final.heading ? `${final.heading} ${final.content}` : final.content;
					const afterNum = num > 1 ? num - 1 : 0;
					articleChanges.push(`      <akndiff:articleChange article="art_${num}" type="insert"${afterNum > 0 ? ` after="art_${afterNum}"` : ''}>
        <akndiff:new>${escapeXml(newText)}</akndiff:new>
      </akndiff:articleChange>`);
					inserts++;
				} else if (bill && !final) {
					// Only in bill — repealed
					articleChanges.push(`      <akndiff:articleChange article="art_${num}" type="repeal">
        <akndiff:old>${escapeXml(bill.heading ? `${bill.heading} ${bill.content}` : bill.content)}</akndiff:old>
      </akndiff:articleChange>`);
					repeals++;
				}
			}

			console.log(`  Diff: ${substitutes} substituted, ${inserts} inserted, ${repeals} repealed (of ${sortedNums.length} total articles)`);

			// Build vote XML
			const voteData = loadVoteIndex();
			const match = voteData?.match;

			let forXml = `<akndiff:for count="${lp.voteFor}"/>`;
			let againstXml = `<akndiff:against count="${lp.voteAgainst}"/>`;
			let abstainXml = `<akndiff:abstain count="${lp.voteAbstain}"/>`;
			let tlcPersons = '';

			if (match) {
				forXml = `<akndiff:for count="${match.forCount}">\n${voterElements(match.voters.for)}\n      </akndiff:for>`;
				againstXml = `<akndiff:against count="${match.againstCount}">\n${voterElements(match.voters.against)}\n      </akndiff:against>`;
				abstainXml = `<akndiff:abstain count="${match.abstainCount}">\n${voterElements(match.voters.abstain)}\n      </akndiff:abstain>`;
				const allVoters = [...match.voters.for, ...match.voters.against, ...match.voters.abstain];
				tlcPersons = allVoters.length > 0 ? '\n' + buildTlcPersonElements(allVoters) : '';
				console.log(`  Enriched with ${allVoters.length} voter names from decision #${match.index}`);
			}

			const taRef = config.proposal?.celex ? `ta-${lp.voteDate.replace(/-/g, '')}-${config.proposal.celex}` : `ta-${lp.voteDate.replace(/-/g, '')}`;
			const title = config.proposal?.title || config.final?.title || '';
			const baseUri = config.proposal?.celex ? `http://data.europa.eu/eli/comProposal/${config.proposal.comYear}/${config.proposal.comNum}/en` : '';
			const today = new Date().toISOString().slice(0, 10);

			const articleChangesXml = articleChanges.length > 0 ? '\n' + articleChanges.join('\n') : '';

			const xml = `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
  <amendment name="EP legislative resolution - ${escapeXml(title)}">
    <meta>
      <identification source="#ep">
        <FRBRWork>
          <FRBRthis value="/akn/eu/amendment/ep/${lp.voteDate}/${taRef}/main"/>
          <FRBRuri value="/akn/eu/amendment/ep/${lp.voteDate}/${taRef}/main"/>
          <FRBRdate date="${lp.voteDate}" name="EP First Reading"/>
          <FRBRauthor href="https://www.europarl.europa.eu"/>
          <FRBRcountry value="eu"/>
        </FRBRWork>
        <FRBRExpression>
          <FRBRthis value="/akn/eu/amendment/ep/${lp.voteDate}/${taRef}/eng@${lp.voteDate}"/>
          <FRBRuri value="/akn/eu/amendment/ep/${lp.voteDate}/${taRef}/eng@${lp.voteDate}"/>
          <FRBRdate date="${lp.voteDate}" name="EP First Reading"/>
          <FRBRlanguage language="en"/>
        </FRBRExpression>
        <FRBRManifestation>
          <FRBRthis value="/akn/eu/amendment/ep/${lp.voteDate}/${taRef}/eng@${lp.voteDate}/akn"/>
          <FRBRuri value="/akn/eu/amendment/ep/${lp.voteDate}/${taRef}/eng@${lp.voteDate}/akn"/>
          <FRBRdate date="${today}" name="generation"/>
        </FRBRManifestation>
      </identification>
      <references>
        <TLCOrganization eId="ep" href="https://www.europarl.europa.eu" showAs="European Parliament"/>${tlcPersons}
      </references>
    </meta>
    <preface>
      <p class="title"><docTitle>${escapeXml(title)}</docTitle></p>
    </preface>
    <amendmentBody>
      <amendmentContent>
        <block name="provisionalagreement"><p>Trilogue procedure — changes derived by comparing COM proposal with final regulation.</p></block>
      </amendmentContent>
    </amendmentBody>
    <akndiff:changeSet base="${escapeXml(baseUri)}" result="/akn/eu/amendment/ep/${lp.voteDate}/${taRef}/eng@${lp.voteDate}">
      <akndiff:vote date="${lp.voteDate}" result="approved" source="https://www.europarl.europa.eu">
        ${forXml}
        ${againstXml}
        ${abstainXml}
      </akndiff:vote>${articleChangesXml}
    </akndiff:changeSet>
  </amendment>
</akomaNtoso>`;

			const outPath = join(OUTPUT_DIR, '02-amendment-1.xml');
			writeFileSync(outPath, xml, 'utf-8');
			console.log(`  Written: ${outPath} (${(xml.length / 1024).toFixed(0)} KB)`);
			return;
		}

		const srcPath = join(SOURCES_DIR, config.epAmendmentsFile);
		if (!existsSync(srcPath)) {
			console.log(`Warning: EP amendments file not found: ${srcPath}`);
			return;
		}

		if (!lp?.voteDate) {
			console.log('No legislativeProcedure.voteDate in config, copying file as-is');
			copyFileSync(srcPath, join(OUTPUT_DIR, '02-amendment-1.xml'));
			return;
		}

		const voteData = loadVoteIndex();

		if (!voteData) {
			console.log(`Vote index not found, copying amendment file as-is`);
			copyFileSync(srcPath, join(OUTPUT_DIR, '02-amendment-1.xml'));
			return;
		}

		const match = voteData.match;

		if (!match) {
			console.log(`No matching decision found for ${lp.voteFor}-${lp.voteAgainst}-${lp.voteAbstain}, copying as-is`);
			copyFileSync(srcPath, join(OUTPUT_DIR, '02-amendment-1.xml'));
			return;
		}

		console.log(`Enriching 02-amendment-1.xml with ${match.voters.for.length + match.voters.against.length + match.voters.abstain.length} voter names from decision #${match.index}`);

		let xml = readFileSync(srcPath, 'utf-8');

		// Replace self-closing <akndiff:for count="N"/> with open/close tags containing voters
		xml = xml.replace(
			/<akndiff:for count="\d+"\/>/,
			`<akndiff:for count="${match.forCount}">\n${voterElements(match.voters.for)}\n      </akndiff:for>`
		);
		xml = xml.replace(
			/<akndiff:against count="\d+"\/>/,
			`<akndiff:against count="${match.againstCount}">\n${voterElements(match.voters.against)}\n      </akndiff:against>`
		);
		xml = xml.replace(
			/<akndiff:abstain count="\d+"\/>/,
			`<akndiff:abstain count="${match.abstainCount}">\n${voterElements(match.voters.abstain)}\n      </akndiff:abstain>`
		);

		// Collect all unique person hrefs for TLCPerson references
		const allVoters = [...match.voters.for, ...match.voters.against, ...match.voters.abstain];
		const tlcPersons = buildTlcPersonElements(allVoters);

		// Inject TLCPerson refs into <references> section (before </references>)
		xml = xml.replace(
			/<\/references>/,
			`${tlcPersons}\n      </references>`
		);

		const outPath = join(OUTPUT_DIR, '02-amendment-1.xml');
		writeFileSync(outPath, xml, 'utf-8');
		console.log(`  Written enriched: ${outPath} (${(xml.length / 1024).toFixed(0)} KB, ${allVoters.length} voters)`);
	}

	// --- Generate 00-metadata.json (supplementary data for viewer) ---

	function generateMetadata() {
		const lp = config.legislativeProcedure;
		if (!lp?.voteDate) {
			console.log('Skipping metadata.json (no legislativeProcedure in config)');
			return;
		}

		console.log('Generating 00-metadata.json...');

		const meetingId = `MTG-PL-${lp.voteDate}`;
		const procedure = lp.procedure as string | undefined;

		const metadata: Record<string, unknown> = {};

		if (procedure) {
			metadata.procedure = procedure;
			const procMatch = procedure.match(/\((\w+)\)$/);
			if (procMatch) metadata.procedureType = procMatch[1];
		}

		// Rapporteur: use config value (reliable), fall back to citation XML extraction (best effort)
		if (lp.rapporteur) {
			metadata.rapporteur = lp.rapporteur;
		}

		// Parse citation XML for debate time (and rapporteur fallback if not in config)
		const citationPath = join(SOURCES_DIR, `eu-citation-${meetingId}.xml`);
		if (existsSync(citationPath)) {
			const citationXml = readFileSync(citationPath, 'utf-8');
			const sectionRegex = /<section eId="[^"]*">\s*<num>\d+<\/num>\s*<heading>(.*?)<\/heading>\s*<content[^>]*>([\s\S]*?)<\/content>\s*<\/section>/g;
			let sectionMatch;

			// Build search terms from regulation title in config
			const titleWords = (config.proposal?.title || '').toLowerCase()
				.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((w: string) => w.length > 4);

			// Score all sections and pick the best match (multiple regulations may share the same plenary session)
			let bestScore = 0;
			let bestHeading = '';
			let bestContent = '';

			while ((sectionMatch = sectionRegex.exec(citationXml)) !== null) {
				const heading = sectionMatch[1];
				const content = sectionMatch[2];
				const headingLower = heading.toLowerCase();

				const score = titleWords.filter((w: string) => headingLower.includes(w)).length;
				if (score > bestScore) {
					bestScore = score;
					bestHeading = heading;
					bestContent = content;
				}
			}

			if (bestScore >= 2) {
				// Rapporteur fallback: extract from heading if not in config
				// Heading format: "Title - A9-NNNN/YYYY - Rapporteur Name - ..."
				// Normalize en-dash – and em-dash — to regular hyphen -
				if (!metadata.rapporteur) {
					const normalizedHeading = bestHeading.replace(/\s[–—]\s/g, ' - ');
					const parts = normalizedHeading.split(' - ');
					if (parts.length >= 3) {
						const rapporteur = parts[2].trim();
						if (rapporteur && !rapporteur.match(/^A\d/) && !rapporteur.match(/^\d/)) {
							metadata.rapporteur = rapporteur;
						}
					}
				}

				// Extract debate time from content
				const timeMatch = bestContent.match(/<time datetime="[^"]*">(\d{2}:\d{2})/);
				if (timeMatch) {
					metadata.debateTime = timeMatch[1];
				}
			}
		}

		// Parse communication XML for procedure events
		const procId = (procedure || '').replace(/\(.*\)/, '').replace(/\//g, '-');
		const procType = (procedure || '').match(/\((\w+)\)/)?.[1] ?? 'COD';
		const commRef = `${procId}-${procType}`;
		const commPath = join(SOURCES_DIR, `eu-communication-${commRef}.xml`);

		if (existsSync(commPath)) {
			const commXml = readFileSync(commPath, 'utf-8');

			// Extract lifecycle eventRefs
			const events: { date: string; title: string; institution: string; type?: string }[] = [];

			// Parse section headings and dates from mainBody
			const evtSectionRegex = /<section eId="[^"]*">\s*<num>\d+<\/num>\s*<heading>(.*?)<\/heading>\s*<content[^>]*>([\s\S]*?)<\/content>\s*<\/section>/g;
			let evtMatch;
			while ((evtMatch = evtSectionRegex.exec(commXml)) !== null) {
				const heading = evtMatch[1];
				const content = evtMatch[2];

				// Extract date
				const dateMatch = content.match(/<date date="(\d{4}-\d{2}-\d{2})">/);
				const date = dateMatch?.[1] || '';

				// Extract institution
				const orgMatch = content.match(/<organization refersTo="#(\w+)">/);
				const institution = orgMatch?.[1]?.toUpperCase() || '';

				if (date && heading) {
					events.push({ date, title: heading, institution });
				}
			}

			if (events.length > 0) {
				// Prepend COM proposal as first procedure event
				if (config.proposal?.date) {
					events.unshift({ date: config.proposal.date, title: 'Commission Proposal', institution: 'COM' });
				}
				events.sort((a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date));
				metadata.procedureEvents = events;
			}
		}

		if (Object.keys(metadata).length > 0) {
			const outPath = join(OUTPUT_DIR, '00-metadata.json');
			writeFileSync(outPath, JSON.stringify(metadata, null, 2), 'utf-8');
			console.log(`  Written: ${outPath}`);
		} else {
			console.log('  No metadata extracted, skipping');
		}
	}

	// --- Quality checks ---

	function qualityCheck() {
		console.log('\n--- Quality Check ---');
		let issues = 0;

		for (const file of ['01-act-original.xml', '03-act-final.xml']) {
			const path = join(OUTPUT_DIR, file);
			if (!existsSync(path)) continue;
			const xml = readFileSync(path, 'utf-8');

			// Check for empty articles
			const emptyArticles = [...xml.matchAll(/<article eId="([^"]+)">\s*<heading>([^<]*)<\/heading>\s*<content>\s*<p><\/p>\s*<\/content>\s*<\/article>/g)];
			if (emptyArticles.length > 0) {
				console.log(`  WARNING: ${file} has ${emptyArticles.length} empty articles: ${emptyArticles.map(m => m[1]).join(', ')}`);
				issues++;
			}

			// Check for articles without headings
			const noHeading = [...xml.matchAll(/<article eId="([^"]+)">\s*<heading><\/heading>/g)];
			if (noHeading.length > 0) {
				console.log(`  WARNING: ${file} has ${noHeading.length} articles without headings`);
				issues++;
			}
		}

		if (issues === 0) {
			console.log('  All checks passed!');
		}
	}

	// --- Main ---

	console.log(`=== Viewer XML Generator (${config.slug}) ===\n`);

	generateActOriginal();
	enrichEpAmendments();
	generateActFinal();
	generateMetadata();
	qualityCheck();

	console.log(`\nDone! Generated viewer XMLs in ${OUTPUT_DIR}`);
}
