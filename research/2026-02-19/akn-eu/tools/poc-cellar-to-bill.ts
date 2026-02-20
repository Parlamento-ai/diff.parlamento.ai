/**
 * Proof-of-Concept: CELLAR XHTML → Akoma Ntoso (AKN 3.0) Bill Converter
 *
 * Downloads a real COM legislative proposal from the EU CELLAR repository
 * in XHTML format and converts it to an AKN 3.0 <bill> XML document.
 *
 * COM proposals (CELEX starting with 5xxxx) typically do NOT have Formex XML
 * available — only XHTML and PDF. This script uses content negotiation
 * (Accept: application/xhtml+xml) against CELLAR to fetch the XHTML.
 *
 * Usage:
 *   node --experimental-strip-types poc-cellar-to-bill.ts [CELEX]
 *
 * Default CELEX: 52024PC0150 (European Defence Industry Programme / EDIP)
 *
 * Zero npm dependencies — uses only Node.js built-in modules.
 */

import https from "node:https";
import http from "node:http";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

// ─── Config ──────────────────────────────────────────────────────────────────

const DEFAULT_CELEX = "52024PC0150";
const CELLAR_BASE = "https://publications.europa.eu/resource/celex";
const OUTPUT_DIR = "samples/bill";

// ─── HTTP helper ─────────────────────────────────────────────────────────────

function fetchXhtml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const doRequest = (targetUrl: string, redirects = 0) => {
      if (redirects > 10) return reject(new Error("Too many redirects"));

      const isHttps = targetUrl.startsWith("https:");
      const mod = isHttps ? https : http;

      mod.get(
        targetUrl,
        {
          headers: {
            Accept: "application/xhtml+xml",
            "Accept-Language": "en",
            "User-Agent": "Mozilla/5.0 poc-cellar-to-bill",
          },
        },
        (res) => {
          if (
            res.statusCode &&
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location
          ) {
            const loc = res.headers.location.startsWith("http")
              ? res.headers.location
              : new URL(res.headers.location, targetUrl).href;
            return doRequest(loc, redirects + 1);
          }
          if (res.statusCode === 300) {
            // Multiple Choice — collect the body to find the first doc URL
            let body = "";
            res.on("data", (chunk: Buffer) => (body += chunk.toString()));
            res.on("end", () => {
              const match = body.match(/href="([^"]+DOC_1[^"]*)"/);
              if (match) {
                return doRequest(match[1], redirects + 1);
              }
              reject(new Error(`300 Multiple Choice but could not find DOC_1 link`));
            });
            return;
          }
          if (res.statusCode !== 200) {
            let body = "";
            res.on("data", (chunk: Buffer) => (body += chunk.toString()));
            res.on("end", () =>
              reject(new Error(`HTTP ${res.statusCode} for ${targetUrl}: ${body.slice(0, 300)}`))
            );
            return;
          }
          let body = "";
          res.on("data", (chunk: Buffer) => (body += chunk.toString()));
          res.on("end", () => resolve(body));
          res.on("error", reject);
        }
      ).on("error", reject);
    };
    doRequest(url);
  });
}

// ─── Minimal HTML/XHTML Parser ──────────────────────────────────────────────
// A recursive-descent parser that produces a simple DOM-like tree.
// Handles the XHTML output from CELLAR (well-formed XML with HTML entities).

interface XmlNode {
  type: "element" | "text" | "comment" | "cdata";
  tag?: string;
  attrs?: Record<string, string>;
  children?: XmlNode[];
  text?: string;
}

function parseXhtml(xhtml: string): XmlNode {
  // Pre-process: strip XML declaration and DOCTYPE
  let xml = xhtml.replace(/<\?xml[^?]*\?>/g, "");
  xml = xml.replace(/<!DOCTYPE[^>]*>/g, "");
  // Replace common HTML entities not valid in XML
  xml = xml.replace(/&nbsp;/g, "\u00A0");
  xml = xml.replace(/&mdash;/g, "\u2014");
  xml = xml.replace(/&ndash;/g, "\u2013");
  xml = xml.replace(/&lsquo;/g, "\u2018");
  xml = xml.replace(/&rsquo;/g, "\u2019");
  xml = xml.replace(/&ldquo;/g, "\u201C");
  xml = xml.replace(/&rdquo;/g, "\u201D");
  xml = xml.replace(/&hellip;/g, "\u2026");
  xml = xml.replace(/&bull;/g, "\u2022");
  xml = xml.replace(/&copy;/g, "\u00A9");
  xml = xml.replace(/&reg;/g, "\u00AE");
  xml = xml.replace(/&trade;/g, "\u2122");
  xml = xml.replace(/&euro;/g, "\u20AC");
  xml = xml.replace(/&times;/g, "\u00D7");

  let pos = 0;

  function advance(n = 1): string {
    const s = xml.substring(pos, pos + n);
    pos += n;
    return s;
  }
  function skipWhitespace() {
    while (pos < xml.length && /\s/.test(xml[pos])) pos++;
  }
  function expect(s: string) {
    if (xml.substring(pos, pos + s.length) !== s) {
      throw new Error(
        `Expected '${s}' at position ${pos}, got '${xml.substring(pos, pos + 40)}'`
      );
    }
    pos += s.length;
  }

  function parseAttrValue(): string {
    const quote = advance();
    let val = "";
    while (pos < xml.length && xml[pos] !== quote) {
      if (xml[pos] === "&") {
        val += parseEntity();
      } else {
        val += xml[pos++];
      }
    }
    advance(); // closing quote
    return val;
  }

  function parseEntity(): string {
    pos++; // skip &
    const end = xml.indexOf(";", pos);
    if (end === -1) return "&";
    const ent = xml.substring(pos, end);
    pos = end + 1;
    switch (ent) {
      case "amp": return "&";
      case "lt": return "<";
      case "gt": return ">";
      case "apos": return "'";
      case "quot": return '"';
      default:
        if (ent.startsWith("#x")) return String.fromCodePoint(parseInt(ent.slice(2), 16));
        if (ent.startsWith("#")) return String.fromCodePoint(parseInt(ent.slice(1), 10));
        return `&${ent};`; // pass through unknown
    }
  }

  function parseElement(): XmlNode {
    expect("<");
    let tag = "";
    while (pos < xml.length && !/[\s/>]/.test(xml[pos])) {
      tag += xml[pos++];
    }

    // Handle namespace prefix: strip it for simplicity
    const colonIdx = tag.indexOf(":");
    if (colonIdx >= 0) tag = tag.substring(colonIdx + 1);

    const attrs: Record<string, string> = {};
    while (pos < xml.length) {
      skipWhitespace();
      if (xml[pos] === "/" && xml[pos + 1] === ">") {
        pos += 2;
        return { type: "element", tag, attrs, children: [] };
      }
      if (xml[pos] === ">") {
        pos++;
        break;
      }
      let attrName = "";
      while (pos < xml.length && !/[\s=/>]/.test(xml[pos])) {
        attrName += xml[pos++];
      }
      skipWhitespace();
      if (xml[pos] === "=") {
        pos++;
        skipWhitespace();
        attrs[attrName] = parseAttrValue();
      } else {
        attrs[attrName] = attrName;
      }
    }

    // Self-closing HTML void elements
    const voidTags = new Set(["br", "hr", "img", "input", "meta", "link", "col"]);
    if (voidTags.has(tag.toLowerCase())) {
      return { type: "element", tag, attrs, children: [] };
    }

    const children: XmlNode[] = [];
    while (pos < xml.length) {
      if (xml.substring(pos, pos + 2) === "</") {
        pos += 2;
        // skip closing tag name
        pos = xml.indexOf(">", pos) + 1;
        return { type: "element", tag, attrs, children };
      }
      if (xml.substring(pos, pos + 4) === "<!--") {
        const end = xml.indexOf("-->", pos);
        if (end === -1) { pos = xml.length; break; }
        children.push({ type: "comment", text: xml.substring(pos + 4, end) });
        pos = end + 3;
      } else if (xml.substring(pos, pos + 9) === "<![CDATA[") {
        const end = xml.indexOf("]]>", pos);
        if (end === -1) { pos = xml.length; break; }
        children.push({ type: "cdata", text: xml.substring(pos + 9, end) });
        pos = end + 3;
      } else if (xml.substring(pos, pos + 2) === "<?") {
        const end = xml.indexOf("?>", pos);
        pos = end === -1 ? xml.length : end + 2;
      } else if (xml[pos] === "<") {
        try {
          children.push(parseElement());
        } catch {
          // On parse error, skip ahead to next '<'
          pos++;
          while (pos < xml.length && xml[pos] !== "<") pos++;
        }
      } else {
        let text = "";
        while (pos < xml.length && xml[pos] !== "<") {
          if (xml[pos] === "&") {
            text += parseEntity();
          } else {
            text += xml[pos++];
          }
        }
        if (text.length > 0) {
          children.push({ type: "text", text });
        }
      }
    }
    return { type: "element", tag, attrs, children };
  }

  skipWhitespace();
  // Find the first '<' that starts an element (skip stray text)
  while (pos < xml.length && xml[pos] !== "<") pos++;
  if (pos >= xml.length) {
    throw new Error("No root element found in XHTML");
  }
  return parseElement();
}

// ─── DOM Helpers ─────────────────────────────────────────────────────────────

function getChild(node: XmlNode, tag: string): XmlNode | undefined {
  return node.children?.find((c) => c.type === "element" && c.tag === tag);
}

function getChildren(node: XmlNode, tag: string): XmlNode[] {
  return node.children?.filter((c) => c.type === "element" && c.tag === tag) ?? [];
}

function getAllChildren(node: XmlNode): XmlNode[] {
  return node.children?.filter((c) => c.type === "element") ?? [];
}

function getTextContent(node: XmlNode): string {
  if (node.type === "text" || node.type === "cdata") return node.text ?? "";
  return (node.children ?? []).map(getTextContent).join("");
}

/** Recursively find all descendant elements matching a predicate */
function findAll(node: XmlNode, predicate: (n: XmlNode) => boolean): XmlNode[] {
  const results: XmlNode[] = [];
  function walk(n: XmlNode) {
    if (predicate(n)) results.push(n);
    for (const child of n.children ?? []) {
      if (child.type === "element") walk(child);
    }
  }
  walk(node);
  return results;
}

/** Find the first descendant element matching a predicate */
function findFirst(node: XmlNode, predicate: (n: XmlNode) => boolean): XmlNode | undefined {
  if (predicate(node)) return node;
  for (const child of node.children ?? []) {
    if (child.type === "element") {
      const found = findFirst(child, predicate);
      if (found) return found;
    }
  }
  return undefined;
}

/** Check if an element has a given CSS class (space-separated) */
function hasClass(node: XmlNode, cls: string): boolean {
  const classes = (node.attrs?.["class"] ?? "").split(/\s+/);
  return classes.includes(cls);
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── XHTML Structure Extraction ─────────────────────────────────────────────
// COM proposal XHTML from CELLAR has a specific CSS-class-based structure:
//
// Cover page (first .content div):
//   .Logo, .Emission, .Rfrenceinstitutionnelle, .Rfrenceinterinstitutionnelle
//   .Statut, .Typedudocument_cp, .Titreobjet_cp, .IntrtEEE_cp
//
// Explanatory memorandum (subsequent .content divs):
//   .Exposdesmotifstitre, .ManualHeading1, .ManualHeading2, .Normal
//
// Legislative text (after second .Statut / .Typedudocument):
//   .Institutionquiagit → acting entity formula
//   .Normal "Having regard to..." → citations
//   .Normal "Whereas:" → recitals intro
//   .ManualConsidrant → individual recitals with .num
//   .ChapterTitle → chapter headings
//   .SectionTitle → section headings
//   .Titrearticle → article number and heading
//   .ManualNumPar1 → numbered paragraphs
//   .Point0, .Point1, .Point2 → numbered points
//   .Tiret0 → dash items
//   .Applicationdirecte → direct applicability formula
//   .Fait → place/date
//   .signature → signature block
//
// Footnotes (at the end): <dl class="footnote"> with <dd id="footnoteN">

interface ExtractedBill {
  // Cover page metadata
  celex: string;
  emission: string;       // date string like "Brussels, 5.3.2024"
  emissionDate: string;   // ISO date
  instRef: string;        // "COM(2024) 150 final"
  interinstRef: string;   // "2024/0061(COD)"
  status: string;         // "Proposal for a"
  docType: string;        // "REGULATION OF THE EUROPEAN PARLIAMENT AND OF THE COUNCIL"
  title: string;          // long title of the proposal
  eea: string;            // "(Text with EEA relevance)" if present

  // Preamble
  actingEntity: string;   // "THE EUROPEAN PARLIAMENT AND THE COUNCIL..."
  citations: string[];    // "Having regard to..." paragraphs
  recitalsIntro: string;  // "Whereas:"
  recitals: Array<{ num: string; text: string }>;
  enactingFormula: string; // "HAVE ADOPTED THIS REGULATION:" etc.

  // Body
  chapters: ExtractedChapter[];

  // Conclusions
  directApplicability: string;
  doneAt: string;
  signatureInstitution: string;
  signaturePersons: string[];

  // Explanatory memorandum sections
  exMemoSections: Array<{ heading: string; paragraphs: string[] }>;
}

interface ExtractedChapter {
  num: string;     // "Chapter I"
  title: string;   // "General Provisions"
  sections: ExtractedSection[];
  articles: ExtractedArticle[];
}

interface ExtractedSection {
  title: string;
  articles: ExtractedArticle[];
}

interface ExtractedArticle {
  num: string;       // "Article 1"
  heading: string;   // "Subject Matter"
  paragraphs: ExtractedParagraph[];
}

interface ExtractedParagraph {
  num: string;
  content: string;  // inline XHTML content
  points: Array<{ num: string; text: string; subpoints: Array<{ num: string; text: string }> }>;
}

function extractBill(root: XmlNode, celex: string): ExtractedBill {
  const body = findFirst(root, (n) => n.tag === "body") ?? root;

  // Collect all top-level content divs
  const contentDivs = findAll(body, (n) =>
    n.tag === "div" && hasClass(n, "content")
  );

  // Flatten all paragraph-level elements from all content divs
  const allElements: XmlNode[] = [];
  for (const div of contentDivs) {
    for (const child of div.children ?? []) {
      if (child.type === "element") {
        allElements.push(child);
      }
    }
  }

  // ── Phase 1: Find the legislative text start
  // The legislative text begins at the SECOND occurrence of .Statut
  // (the first is on the cover page)
  let legislativeStart = -1;
  let statutCount = 0;
  for (let i = 0; i < allElements.length; i++) {
    if (hasClass(allElements[i], "Statut")) {
      statutCount++;
      if (statutCount === 2) {
        legislativeStart = i;
        break;
      }
    }
  }

  // If we didn't find a second Statut, look for Institutionquiagit
  if (legislativeStart === -1) {
    for (let i = 0; i < allElements.length; i++) {
      if (hasClass(allElements[i], "Institutionquiagit")) {
        legislativeStart = i;
        break;
      }
    }
  }

  // ── Phase 2: Extract cover page metadata
  const bill: ExtractedBill = {
    celex,
    emission: "",
    emissionDate: "",
    instRef: "",
    interinstRef: "",
    status: "",
    docType: "",
    title: "",
    eea: "",
    actingEntity: "",
    citations: [],
    recitalsIntro: "",
    recitals: [],
    enactingFormula: "",
    chapters: [],
    directApplicability: "",
    doneAt: "",
    signatureInstitution: "",
    signaturePersons: [],
    exMemoSections: [],
  };

  for (let i = 0; i < Math.min(legislativeStart, allElements.length); i++) {
    const el = allElements[i];
    const cls = el.attrs?.["class"] ?? "";
    const text = getTextContent(el).trim();

    if (cls === "Emission") bill.emission = text;
    if (cls === "Rfrenceinstitutionnelle") bill.instRef = text;
    if (cls === "Rfrenceinterinstitutionnelle" && !bill.interinstRef) bill.interinstRef = text;
    if (cls.includes("Statut") && !bill.status) bill.status = text;
    if (cls === "Typedudocument_cp") bill.docType = text;
    if (cls === "Titreobjet_cp") bill.title = text;
    if (cls === "IntrtEEE_cp") bill.eea = text;
  }

  // Extract date from emission: "Brussels, 5.3.2024" → "2024-03-05"
  const dateMatch = bill.emission.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (dateMatch) {
    const [, d, m, y] = dateMatch;
    bill.emissionDate = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // ── Phase 3: Extract legislative text
  if (legislativeStart >= 0) {
    let cursor = legislativeStart;

    // Skip past Statut, Typedudocument, Titreobjet, IntrtEEE
    while (cursor < allElements.length) {
      const cls = allElements[cursor].attrs?.["class"] ?? "";
      if (
        cls.includes("Statut") ||
        cls === "Typedudocument" ||
        cls === "Titreobjet" ||
        cls === "IntrtEEE" ||
        cls === "Rfrenceinterinstitutionnelle"
      ) {
        cursor++;
      } else {
        break;
      }
    }

    // Institutionquiagit
    if (cursor < allElements.length && hasClass(allElements[cursor], "Institutionquiagit")) {
      bill.actingEntity = getTextContent(allElements[cursor]).trim();
      cursor++;
    }

    // Citations: "Having regard to..." / Normal paragraphs before "Whereas:"
    while (cursor < allElements.length) {
      const text = getTextContent(allElements[cursor]).trim();
      if (text === "Whereas:" || text.startsWith("Whereas:")) {
        bill.recitalsIntro = text;
        cursor++;
        break;
      }
      if (hasClass(allElements[cursor], "Titrearticle") ||
          hasClass(allElements[cursor], "ChapterTitle") ||
          text.match(/^\(\d+\)/)) {
        break;
      }
      // Check if it looks like a citation or it's a ManualConsidrant (recital)
      const cls = allElements[cursor].attrs?.["class"] ?? "";
      if (cls.includes("ManualConsidrant")) {
        // We've reached recitals without an explicit "Whereas:"
        break;
      }
      if (text.startsWith("Having regard to") || text.startsWith("After ") || text.startsWith("Acting ")) {
        bill.citations.push(text);
      } else if (text && !hasClass(allElements[cursor], "cpMarking")) {
        // Treat remaining normal paragraphs as citations too
        bill.citations.push(text);
      }
      cursor++;
    }

    // Recitals
    while (cursor < allElements.length) {
      const cls = allElements[cursor].attrs?.["class"] ?? "";
      if (!cls.includes("ManualConsidrant")) break;

      const numNode = findFirst(allElements[cursor], (n) => hasClass(n, "num"));
      const num = numNode ? getTextContent(numNode).trim() : "";

      // Get text excluding the num
      let recText = getTextContent(allElements[cursor]).trim();
      if (num && recText.startsWith(num)) {
        recText = recText.substring(num.length).trim();
      }

      bill.recitals.push({ num, text: recText });
      cursor++;
    }

    // Enacting formula: typically "HAVE ADOPTED THIS REGULATION:"
    // It's usually the last paragraph before the articles
    // Look for patterns like "HAS ADOPTED" or "HAVE ADOPTED"
    if (cursor < allElements.length) {
      const text = getTextContent(allElements[cursor]).trim();
      if (text.match(/\b(HAS|HAVE)\s+ADOPTED\b/i)) {
        bill.enactingFormula = text;
        cursor++;
      }
    }

    // ── Body: chapters, sections, articles
    let currentChapter: ExtractedChapter | null = null;
    let currentSection: ExtractedSection | null = null;
    let currentArticle: ExtractedArticle | null = null;
    let currentParagraph: ExtractedParagraph | null = null;

    function flushParagraph() {
      if (currentParagraph && currentArticle) {
        currentArticle.paragraphs.push(currentParagraph);
        currentParagraph = null;
      }
    }

    function flushArticle() {
      flushParagraph();
      if (currentArticle) {
        if (currentSection) {
          currentSection.articles.push(currentArticle);
        } else if (currentChapter) {
          currentChapter.articles.push(currentArticle);
        } else {
          // Article outside any chapter — create implicit chapter
          if (bill.chapters.length === 0) {
            bill.chapters.push({ num: "", title: "", sections: [], articles: [] });
          }
          bill.chapters[bill.chapters.length - 1].articles.push(currentArticle);
        }
        currentArticle = null;
      }
    }

    function flushSection() {
      flushArticle();
      if (currentSection && currentChapter) {
        currentChapter.sections.push(currentSection);
        currentSection = null;
      }
    }

    function flushChapter() {
      flushSection();
      flushArticle();
      if (currentChapter) {
        bill.chapters.push(currentChapter);
        currentChapter = null;
      }
    }

    while (cursor < allElements.length) {
      const el = allElements[cursor];
      const cls = el.attrs?.["class"] ?? "";
      const text = getTextContent(el).trim();

      // Check for conclusions markers
      if (cls === "Applicationdirecte") {
        flushChapter();
        bill.directApplicability = text;
        cursor++;
        continue;
      }
      if (cls === "Fait") {
        bill.doneAt = text;
        cursor++;
        continue;
      }
      if (cls === "Institutionquisigne") {
        bill.signatureInstitution = text;
        cursor++;
        continue;
      }
      if (cls === "Personnequisigne") {
        if (text) bill.signaturePersons.push(text);
        cursor++;
        continue;
      }
      // Skip signature div — we handle its children above
      if (el.tag === "div" && hasClass(el, "signature")) {
        // Extract from within
        const instSign = findFirst(el, (n) => hasClass(n, "Institutionquisigne"));
        if (instSign) bill.signatureInstitution = getTextContent(instSign).trim();
        const persons = findAll(el, (n) => hasClass(n, "Personnequisigne"));
        for (const p of persons) {
          const t = getTextContent(p).trim();
          if (t) bill.signaturePersons.push(t);
        }
        cursor++;
        continue;
      }

      // Financial statement / annexes — stop processing body
      if (cls.includes("Fichefinancire") || cls.includes("AnnexTitle")) {
        flushChapter();
        break;
      }

      // Chapter heading: <p class="ChapterTitle"> preceded by a chapter num
      if (text.match(/^Chapter\s+[IVXLCDM]+$/i)) {
        flushChapter();
        currentChapter = { num: text, title: "", sections: [], articles: [] };
        cursor++;
        // Next element should be ChapterTitle
        if (cursor < allElements.length && hasClass(allElements[cursor], "ChapterTitle")) {
          currentChapter.title = getTextContent(allElements[cursor]).trim();
          cursor++;
        }
        continue;
      }
      if (hasClass(el, "ChapterTitle") && !currentChapter) {
        flushChapter();
        currentChapter = { num: "", title: text, sections: [], articles: [] };
        cursor++;
        continue;
      }

      // TITLE heading (used in AI Act and other regulations instead of Chapter)
      // e.g. <p class="SectionTitle">TITLE I</p> followed by <p class="SectionTitle">GENERAL PROVISIONS</p>
      if (hasClass(el, "SectionTitle") && text.match(/^TITLE\s+[IVXLCDM]+$/i)) {
        flushChapter();
        currentChapter = { num: text, title: "", sections: [], articles: [] };
        cursor++;
        // Next element is typically another SectionTitle with the title name
        if (cursor < allElements.length && hasClass(allElements[cursor], "SectionTitle")) {
          const nextText = getTextContent(allElements[cursor]).trim();
          // Only consume if it's NOT another TITLE number
          if (!nextText.match(/^TITLE\s+[IVXLCDM]+$/i)) {
            currentChapter.title = nextText;
            cursor++;
          }
        }
        continue;
      }

      // Section heading
      if (hasClass(el, "SectionTitle")) {
        flushSection();
        // If no chapter exists, create an implicit one so the section has a parent
        if (!currentChapter) {
          currentChapter = { num: "", title: "", sections: [], articles: [] };
        }
        currentSection = { title: text, articles: [] };
        cursor++;
        continue;
      }

      // Article: <p class="Titrearticle">
      if (hasClass(el, "Titrearticle")) {
        // Article titles come in pairs: "Article N" then "Heading"
        if (text.match(/^Article\s+\d+/i)) {
          flushArticle();
          currentArticle = { num: text, heading: "", paragraphs: [] };
          cursor++;
          // Check if next is also Titrearticle (heading)
          if (cursor < allElements.length && hasClass(allElements[cursor], "Titrearticle")) {
            currentArticle.heading = getTextContent(allElements[cursor]).trim();
            cursor++;
          }
          continue;
        } else if (currentArticle && !currentArticle.heading) {
          // This is the heading for the current article
          currentArticle.heading = text;
          cursor++;
          continue;
        }
        cursor++;
        continue;
      }

      // Numbered paragraph: <p class="li ManualNumPar1">
      if (cls.includes("ManualNumPar1")) {
        flushParagraph();
        const numNode = findFirst(el, (n) => hasClass(n, "num"));
        const num = numNode ? getTextContent(numNode).trim() : "";
        let paraText = text;
        if (num && paraText.startsWith(num)) {
          paraText = paraText.substring(num.length).trim();
        }
        currentParagraph = { num, content: paraText, points: [] };
        if (currentArticle) {
          // Will be flushed later
        }
        cursor++;
        continue;
      }

      // Points: <p class="li Point0"> / Point1 / Point2
      if (cls.includes("Point0") || cls.includes("Point1") || cls.includes("Point2")) {
        const numNode = findFirst(el, (n) => hasClass(n, "num"));
        const num = numNode ? getTextContent(numNode).trim() : "";
        let pointText = text;
        if (num && pointText.startsWith(num)) {
          pointText = pointText.substring(num.length).trim();
        }

        if (cls.includes("Point2") || cls.includes("Point1")) {
          // Sub-point — attach to last point of current paragraph
          if (currentParagraph && currentParagraph.points.length > 0) {
            const lastPoint = currentParagraph.points[currentParagraph.points.length - 1];
            lastPoint.subpoints.push({ num, text: pointText });
          }
        } else {
          // Top-level point
          if (!currentParagraph) {
            currentParagraph = { num: "", content: "", points: [] };
          }
          currentParagraph.points.push({ num, text: pointText, subpoints: [] });
        }
        cursor++;
        continue;
      }

      // Tiret: <p class="li Tiret0">
      if (cls.includes("Tiret0") || cls.includes("ListDash")) {
        const numNode = findFirst(el, (n) => hasClass(n, "num"));
        const num = numNode ? getTextContent(numNode).trim() : "\u2013";
        let dashText = text;
        if (num && dashText.startsWith(num)) {
          dashText = dashText.substring(num.length).trim();
        }
        if (!currentParagraph) {
          currentParagraph = { num: "", content: "", points: [] };
        }
        currentParagraph.points.push({ num, text: dashText, subpoints: [] });
        cursor++;
        continue;
      }

      // Normal/Text1/Body paragraph content
      if (cls === "Normal" || cls === "Text1" || cls === "Body" || cls === "") {
        if (currentArticle) {
          if (!currentParagraph) {
            currentParagraph = { num: "", content: text, points: [] };
          } else if (!currentParagraph.content && currentParagraph.points.length === 0) {
            currentParagraph.content = text;
          } else {
            // Additional content paragraph — append to current
            flushParagraph();
            currentParagraph = { num: "", content: text, points: [] };
          }
        }
        cursor++;
        continue;
      }

      // Skip other elements
      cursor++;
    }

    // Final flush
    flushChapter();
  }

  return bill;
}

// ─── AKN XML Builder ────────────────────────────────────────────────────────

const AKN_NS = "http://docs.oasis-open.org/legaldocml/ns/akn/3.0";

class XmlBuilder {
  private lines: string[] = [];
  private depth = 0;

  emit(line: string) {
    this.lines.push("  ".repeat(this.depth) + line);
  }
  open(tag: string, attrs: Record<string, string> = {}) {
    const a = Object.entries(attrs)
      .map(([k, v]) => ` ${k}="${escapeXml(v)}"`)
      .join("");
    this.emit(`<${tag}${a}>`);
    this.depth++;
  }
  close(tag: string) {
    this.depth--;
    this.emit(`</${tag}>`);
  }
  selfClose(tag: string, attrs: Record<string, string> = {}) {
    const a = Object.entries(attrs)
      .map(([k, v]) => ` ${k}="${escapeXml(v)}"`)
      .join("");
    this.emit(`<${tag}${a}/>`);
  }
  inline(tag: string, attrs: Record<string, string>, content: string) {
    const a = Object.entries(attrs)
      .map(([k, v]) => ` ${k}="${escapeXml(v)}"`)
      .join("");
    this.emit(`<${tag}${a}>${content}</${tag}>`);
  }
  toString() {
    return this.lines.join("\n");
  }
}

// ─── Converter: ExtractedBill → AKN 3.0 <bill> ─────────────────────────────

function billToAkn(bill: ExtractedBill): string {
  const x = new XmlBuilder();

  // Determine document subtype from docType text
  let aknName = "bill";
  const dtLower = bill.docType.toLowerCase();
  if (dtLower.includes("regulation")) aknName = "reg";
  else if (dtLower.includes("directive")) aknName = "dir";
  else if (dtLower.includes("decision")) aknName = "dec";

  // Build ELI-like URI
  // COM(2024) 150 → /eli/comProposal/2024/150
  const refMatch = bill.instRef.match(/COM\((\d{4})\)\s*(\d+)/);
  const year = refMatch ? refMatch[1] : bill.emissionDate.slice(0, 4);
  const num = refMatch ? refMatch[2] : "0";
  const eli = `http://data.europa.eu/eli/comProposal/${year}/${num}`;
  const lang = "en";

  x.emit(`<?xml version="1.0" encoding="UTF-8"?>`);
  x.open("akomaNtoso", { xmlns: AKN_NS });
  x.open("bill", { name: aknName });

  // ── meta
  x.open("meta");
  x.open("identification", { source: "#source" });

  x.open("FRBRWork");
  x.selfClose("FRBRthis", { value: eli });
  x.selfClose("FRBRuri", { value: eli });
  x.selfClose("FRBRdate", { date: bill.emissionDate || "unknown", name: "generation" });
  x.selfClose("FRBRauthor", {
    href: "http://publications.europa.eu/resource/authority/corporate-body/COM",
  });
  x.selfClose("FRBRcountry", { value: "eu" });
  x.selfClose("FRBRnumber", { value: num });
  x.close("FRBRWork");

  x.open("FRBRExpression");
  x.selfClose("FRBRthis", { value: `${eli}/${lang}` });
  x.selfClose("FRBRuri", { value: `${eli}/${lang}` });
  x.selfClose("FRBRdate", { date: bill.emissionDate || "unknown", name: "generation" });
  x.selfClose("FRBRauthor", {
    href: "http://publications.europa.eu/resource/authority/corporate-body/COM",
  });
  x.selfClose("FRBRlanguage", { language: lang });
  x.close("FRBRExpression");

  x.open("FRBRManifestation");
  x.selfClose("FRBRthis", { value: `${eli}/${lang}/xml` });
  x.selfClose("FRBRuri", { value: `${eli}/${lang}/xml` });
  x.selfClose("FRBRdate", {
    date: new Date().toISOString().slice(0, 10),
    name: "transformation",
  });
  x.selfClose("FRBRauthor", { href: "#poc-cellar-to-bill" });
  x.close("FRBRManifestation");

  x.close("identification");

  // references
  x.open("references", { source: "#source" });
  x.selfClose("TLCOrganization", {
    eId: "source",
    href: "http://publications.europa.eu/resource/authority/corporate-body/COM",
    showAs: "European Commission",
  });
  x.close("references");

  x.close("meta");

  // ── preface
  x.open("preface", { eId: "preface" });
  x.open("longTitle", { eId: "longTitle" });
  if (bill.status) {
    x.inline("p", {}, `<docStage>${escapeXml(bill.status)}</docStage>`);
  }
  if (bill.docType) {
    x.inline("p", {}, `<docType>${escapeXml(bill.docType)}</docType>`);
  }
  if (bill.title) {
    x.inline("p", {}, `<docTitle>${escapeXml(bill.title)}</docTitle>`);
  }
  if (bill.eea) {
    x.inline("p", {}, escapeXml(bill.eea));
  }
  x.close("longTitle");
  x.open("container", { eId: "preface__cover", name: "coverPage" });
  if (bill.instRef) {
    x.inline("p", { class: "docReference" }, escapeXml(bill.instRef));
  }
  if (bill.interinstRef) {
    x.inline("p", { class: "interInstitutionalReference" }, escapeXml(bill.interinstRef));
  }
  if (bill.emission) {
    x.inline("p", { class: "emission" }, escapeXml(bill.emission));
  }
  x.close("container");
  x.close("preface");

  // ── preamble
  x.open("preamble", { eId: "preamble" });

  // Acting entity
  if (bill.actingEntity) {
    x.open("formula", { name: "actingEntity", eId: "formula_1" });
    x.inline("p", {}, escapeXml(bill.actingEntity));
    x.close("formula");
  }

  // Citations
  if (bill.citations.length > 0) {
    x.open("citations", { eId: "cits" });
    for (let i = 0; i < bill.citations.length; i++) {
      x.inline("citation", { eId: `cit_${i + 1}` }, `<p>${escapeXml(bill.citations[i])}</p>`);
    }
    x.close("citations");
  }

  // Recitals
  if (bill.recitals.length > 0) {
    x.open("recitals", { eId: "recs" });
    if (bill.recitalsIntro) {
      x.inline("intro", { eId: "recs_intro" }, `<p>${escapeXml(bill.recitalsIntro)}</p>`);
    }
    for (let i = 0; i < bill.recitals.length; i++) {
      const rec = bill.recitals[i];
      x.open("recital", { eId: `rec_${i + 1}` });
      if (rec.num) {
        x.inline("num", {}, escapeXml(rec.num));
      }
      x.inline("p", {}, escapeXml(rec.text));
      x.close("recital");
    }
    x.close("recitals");
  }

  // Enacting formula
  if (bill.enactingFormula) {
    x.open("formula", { name: "enactingFormula", eId: "formula_2" });
    x.inline("p", {}, escapeXml(bill.enactingFormula));
    x.close("formula");
  }

  x.close("preamble");

  // ── body
  x.open("body", { eId: "body" });

  for (const chapter of bill.chapters) {
    const hasChapterWrapper = chapter.num || chapter.title;

    if (hasChapterWrapper) {
      const chapId = chapter.num
        ? `chap_${chapter.num.replace(/[^IVXLCDM0-9]/gi, "").toLowerCase()}`
        : `chap_${bill.chapters.indexOf(chapter) + 1}`;
      x.open("chapter", { eId: chapId });
      if (chapter.num) x.inline("num", {}, escapeXml(chapter.num));
      if (chapter.title) x.inline("heading", {}, escapeXml(chapter.title));
    }

    // Sections within chapter
    for (const section of chapter.sections) {
      const secId = `sec_${section.title.replace(/\s+/g, "_").toLowerCase().slice(0, 20)}`;
      x.open("section", { eId: secId });
      x.inline("heading", {}, escapeXml(section.title));
      for (const article of section.articles) {
        emitArticle(x, article);
      }
      x.close("section");
    }

    // Articles directly in chapter (not in a section)
    for (const article of chapter.articles) {
      emitArticle(x, article);
    }

    if (hasChapterWrapper) {
      x.close("chapter");
    }
  }

  x.close("body");

  // ── conclusions
  if (bill.directApplicability || bill.doneAt || bill.signatureInstitution) {
    x.open("conclusions", { eId: "conclusions" });

    if (bill.directApplicability) {
      x.inline("p", {}, escapeXml(bill.directApplicability));
    }

    if (bill.doneAt) {
      x.open("blockContainer", { eId: "signature" });
      x.inline("p", { class: "signatureDate" }, escapeXml(bill.doneAt));

      if (bill.signatureInstitution) {
        x.open("signature", { eId: "signature_1" });
        x.inline("p", {}, escapeXml(bill.signatureInstitution));
        for (const person of bill.signaturePersons) {
          x.inline("p", {}, escapeXml(person));
        }
        x.close("signature");
      }
      x.close("blockContainer");
    }

    x.close("conclusions");
  }

  x.close("bill");
  x.close("akomaNtoso");

  return x.toString();
}

function emitArticle(x: XmlBuilder, article: ExtractedArticle) {
  const artNum = article.num.match(/\d+/)?.[0] ?? "0";
  const eId = `art_${artNum}`;
  x.open("article", { eId });
  x.inline("num", {}, escapeXml(article.num));
  if (article.heading) {
    x.inline("heading", {}, escapeXml(article.heading));
  }

  if (article.paragraphs.length === 0) {
    x.open("content", { eId: `${eId}__content` });
    x.inline("p", {}, "");
    x.close("content");
  } else if (article.paragraphs.length === 1 && !article.paragraphs[0].num) {
    // Single unnumbered paragraph → content
    emitParagraphContent(x, article.paragraphs[0], eId);
  } else {
    let paraIdx = 0;
    for (const para of article.paragraphs) {
      paraIdx++;
      const paraNum = para.num.replace(/[^0-9]/g, "") || String(paraIdx);
      const paraEId = `${eId}__para_${paraNum}`;

      x.open("paragraph", { eId: paraEId });
      if (para.num) {
        x.inline("num", {}, escapeXml(para.num));
      }

      emitParagraphContent(x, para, paraEId);

      x.close("paragraph");
    }
  }

  x.close("article");
}

function emitParagraphContent(x: XmlBuilder, para: ExtractedParagraph, parentEId: string) {
  if (para.points.length === 0) {
    x.open("content", { eId: `${parentEId}__content` });
    x.inline("p", {}, escapeXml(para.content));
    x.close("content");
  } else {
    // Intro text + points
    if (para.content) {
      x.open("intro", { eId: `${parentEId}__intro` });
      x.inline("p", {}, escapeXml(para.content));
      x.close("intro");
    }

    for (const point of para.points) {
      const pointLabel = point.num.replace(/[()]/g, "").trim();
      const pointEId = pointLabel
        ? `${parentEId}__point_${pointLabel}`
        : `${parentEId}__point_${para.points.indexOf(point) + 1}`;

      x.open("point", { eId: pointEId });
      if (point.num) {
        x.inline("num", {}, escapeXml(point.num));
      }

      if (point.subpoints.length === 0) {
        x.open("content", {});
        x.inline("p", {}, escapeXml(point.text));
        x.close("content");
      } else {
        if (point.text) {
          x.open("intro", {});
          x.inline("p", {}, escapeXml(point.text));
          x.close("intro");
        }
        for (const sub of point.subpoints) {
          const subLabel = sub.num.replace(/[()]/g, "").trim();
          const subEId = `${pointEId}__point_${subLabel || (point.subpoints.indexOf(sub) + 1)}`;
          x.open("point", { eId: subEId });
          if (sub.num) x.inline("num", {}, escapeXml(sub.num));
          x.open("content", {});
          x.inline("p", {}, escapeXml(sub.text));
          x.close("content");
          x.close("point");
        }
      }

      x.close("point");
    }
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const celex = process.argv[2] || DEFAULT_CELEX;
  const url = `${CELLAR_BASE}/${celex}`;
  const outputPath = `${OUTPUT_DIR}/${celex}-bill-akn.xml`;

  console.log(`\n=== PoC: CELLAR XHTML -> AKN 3.0 <bill> ===\n`);
  console.log(`CELEX:  ${celex}`);
  console.log(`URL:    ${url}`);
  console.log(`Output: ${outputPath}\n`);

  // Step 1: Download XHTML from CELLAR
  console.log("Step 1: Downloading XHTML from CELLAR...");
  let xhtml: string;
  try {
    xhtml = await fetchXhtml(url);
  } catch (err) {
    console.error(`Failed to download XHTML: ${(err as Error).message}`);
    process.exit(1);
  }
  console.log(`  Downloaded ${xhtml.length} bytes of XHTML`);

  // Save raw XHTML for reference
  const rawPath = `${OUTPUT_DIR}/${celex}-raw.xhtml`;
  mkdirSync(dirname(rawPath), { recursive: true });
  writeFileSync(rawPath, xhtml, "utf-8");
  console.log(`  Saved raw XHTML: ${rawPath}`);

  // Step 2: Parse XHTML
  console.log("\nStep 2: Parsing XHTML...");
  const root = parseXhtml(xhtml);
  console.log(`  Parsed successfully (root tag: ${root.tag})`);

  // Step 3: Extract bill structure
  console.log("\nStep 3: Extracting bill structure...");
  const bill = extractBill(root, celex);
  console.log(`  Title: ${bill.title.slice(0, 80)}...`);
  console.log(`  Doc type: ${bill.docType}`);
  console.log(`  Reference: ${bill.instRef}`);
  console.log(`  Date: ${bill.emissionDate}`);
  console.log(`  Citations: ${bill.citations.length}`);
  console.log(`  Recitals: ${bill.recitals.length}`);
  console.log(`  Chapters: ${bill.chapters.length}`);
  const totalArticles = bill.chapters.reduce(
    (sum, ch) =>
      sum +
      ch.articles.length +
      ch.sections.reduce((s, sec) => s + sec.articles.length, 0),
    0
  );
  console.log(`  Articles: ${totalArticles}`);

  // Step 4: Convert to AKN
  console.log("\nStep 4: Converting to AKN 3.0 <bill>...");
  const akn = billToAkn(bill);

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, akn, "utf-8");
  console.log(`  Written: ${outputPath} (${akn.length} bytes)`);

  // Preview
  const previewLines = akn.split("\n").slice(0, 80);
  console.log("\n--- Preview (first 80 lines) ---");
  console.log(previewLines.join("\n"));
  console.log("--- ... ---");

  // Also show the tail
  const tailLines = akn.split("\n");
  const tail = tailLines.slice(Math.max(0, tailLines.length - 30));
  console.log("\n--- Last 30 lines ---");
  console.log(tail.join("\n"));
  console.log("--- End ---\n");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
