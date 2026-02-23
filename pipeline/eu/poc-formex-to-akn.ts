/**
 * Proof-of-Concept: Formex 4 XML → Akoma Ntoso (AKN 3.0) Converter
 *
 * Converts EU legislative acts published in Formex 4 format into AKN 3.0 XML,
 * following AKN4EU conventions where applicable.
 *
 * Usage:
 *   node --experimental-strip-types poc-formex-to-akn.ts <input.fmx.xml> <output.akn.xml>
 *
 * Uses only Node.js built-in modules (no npm dependencies).
 */

import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

// ─── Minimal XML Parser ────────────────────────────────────────────────────────
// A recursive-descent parser that produces a simple DOM-like tree.
// Good enough for well-formed Formex XML; not a general-purpose parser.

interface XmlNode {
  type: "element" | "text" | "comment" | "cdata";
  tag?: string;
  attrs?: Record<string, string>;
  children?: XmlNode[];
  text?: string;
}

function parseXml(xml: string): XmlNode {
  let pos = 0;

  function peek(): string {
    return xml[pos];
  }
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
      throw new Error(`Expected '${s}' at position ${pos}, got '${xml.substring(pos, pos + 20)}'`);
    }
    pos += s.length;
  }

  // Skip XML declaration and DOCTYPE
  function skipProlog() {
    skipWhitespace();
    while (pos < xml.length) {
      if (xml.substring(pos, pos + 5) === "<?xml") {
        pos = xml.indexOf("?>", pos) + 2;
        skipWhitespace();
      } else if (xml.substring(pos, pos + 9) === "<!DOCTYPE") {
        pos = xml.indexOf(">", pos) + 1;
        skipWhitespace();
      } else {
        break;
      }
    }
  }

  function parseAttrValue(): string {
    const quote = advance(); // ' or "
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
    const start = pos;
    pos++; // skip &
    const end = xml.indexOf(";", pos);
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
      // parse attribute
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
        attrs[attrName] = attrName; // boolean attribute
      }
    }
    // parse children
    const children: XmlNode[] = [];
    while (pos < xml.length) {
      if (xml.substring(pos, pos + 2) === "</") {
        // closing tag
        pos += 2;
        const closeTag = xml.substring(pos, xml.indexOf(">", pos));
        pos = xml.indexOf(">", pos) + 1;
        return { type: "element", tag, attrs, children };
      }
      if (xml.substring(pos, pos + 4) === "<!--") {
        // comment
        const end = xml.indexOf("-->", pos);
        children.push({ type: "comment", text: xml.substring(pos + 4, end) });
        pos = end + 3;
      } else if (xml.substring(pos, pos + 9) === "<![CDATA[") {
        const end = xml.indexOf("]]>", pos);
        children.push({ type: "cdata", text: xml.substring(pos + 9, end) });
        pos = end + 3;
      } else if (xml.substring(pos, pos + 2) === "<?") {
        // Processing instruction — skip it entirely
        const end = xml.indexOf("?>", pos);
        pos = end + 2;
      } else if (xml[pos] === "<") {
        children.push(parseElement());
      } else {
        // text node
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

  skipProlog();
  return parseElement();
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

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

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ─── Converter Class ──────────────────────────────────────────────────────────

const AKN_NS = "http://docs.oasis-open.org/legaldocml/ns/akn/3.0";
const AKN4EU_NS = "http://docs.oasis-open.org/legaldocml/ns/akn/3.0/CSD02";

class FormexToAknConverter {
  private root: XmlNode;
  /** Effective document node — may differ from root for CONS.ACT (→ CONS.DOC) */
  private doc: XmlNode;
  /** Root element tag: ACT | CORR | CONS.ACT | ANNEX */
  private rootTag: string;
  private lines: string[] = [];
  private indent = 0;
  private noteCounter = 0;
  private eIdCounters: Record<string, number> = {};

  // Metadata extracted from BIB.INSTANCE
  private year = "";
  private docNumber = "";
  private date = "";
  private lang = "";
  private collection = "";
  private docType = ""; // "act" for decisions, "reg" for regulations, etc.

  constructor(root: XmlNode) {
    this.root = root;
    this.rootTag = root.tag ?? "";

    // For consolidated texts, the actual document lives inside CONS.DOC
    if (this.rootTag === "CONS.ACT") {
      this.doc = getChild(root, "CONS.DOC") ?? root;
    } else {
      this.doc = root;
    }
  }

  private makeEId(prefix: string): string {
    const key = prefix;
    this.eIdCounters[key] = (this.eIdCounters[key] ?? 0) + 1;
    const count = this.eIdCounters[key];
    if (count === 1 && prefix !== "art" && prefix !== "cit" && prefix !== "rec") return prefix;
    return `${prefix}_${count}`;
  }

  private emit(line: string) {
    const indentation = "  ".repeat(this.indent);
    this.lines.push(indentation + line);
  }

  private open(tag: string, attrs: Record<string, string> = {}) {
    const attrStr = Object.entries(attrs)
      .map(([k, v]) => ` ${k}="${escapeXml(v)}"`)
      .join("");
    this.emit(`<${tag}${attrStr}>`);
    this.indent++;
  }

  private close(tag: string) {
    this.indent--;
    this.emit(`</${tag}>`);
  }

  private selfClose(tag: string, attrs: Record<string, string> = {}) {
    const attrStr = Object.entries(attrs)
      .map(([k, v]) => ` ${k}="${escapeXml(v)}"`)
      .join("");
    this.emit(`<${tag}${attrStr}/>`);
  }

  private emitInline(tag: string, attrs: Record<string, string>, content: string) {
    const attrStr = Object.entries(attrs)
      .map(([k, v]) => ` ${k}="${escapeXml(v)}"`)
      .join("");
    this.emit(`<${tag}${attrStr}>${content}</${tag}>`);
  }

  // ── Inline content conversion ───────────────────────────────────────────────

  private convertInlineContent(node: XmlNode): string {
    if (node.type === "text") return escapeXml(node.text ?? "");
    if (node.type === "comment") return "";
    if (node.type === "cdata") return escapeXml(node.text ?? "");

    const children = (node.children ?? []).map((c) => this.convertInlineContent(c)).join("");

    switch (node.tag) {
      case "HT": {
        const htType = node.attrs?.["TYPE"] ?? "";
        if (htType === "ITALIC") return `<i>${children}</i>`;
        if (htType === "BOLD") return `<b>${children}</b>`;
        if (htType === "UC") return `<span class="uppercase">${children}</span>`;
        if (htType === "SUP") return `<sup>${children}</sup>`;
        if (htType === "SUB") return `<sub>${children}</sub>`;
        return children;
      }
      case "DATE": {
        const iso = node.attrs?.["ISO"] ?? "";
        return `<date date="${iso}">${children}</date>`;
      }
      case "REF.DOC.OJ": {
        const coll = node.attrs?.["COLL"] ?? "";
        const noOj = node.attrs?.["NO.OJ"] ?? "";
        const datePub = node.attrs?.["DATE.PUB"] ?? "";
        const pageFirst = node.attrs?.["PAGE.FIRST"] ?? "";
        const href = `http://data.europa.eu/eli/oj/${coll.toLowerCase()}/${datePub}/${noOj}/p/${pageFirst}`;
        return `<ref href="${escapeXml(href)}">${children}</ref>`;
      }
      case "REF.DOC": {
        const uri = node.attrs?.["URI"] ?? "";
        return `<ref href="${escapeXml(uri)}">${children}</ref>`;
      }
      case "LINK": {
        const uri = node.attrs?.["URI"] ?? "";
        return `<ref href="${escapeXml(uri)}">${children}</ref>`;
      }
      case "NOTE": {
        // A NOTE with NOTE.REF is a reference to a footnote, not an inline note
        const noteRef = node.attrs?.["NOTE.REF"];
        if (noteRef) {
          return `<noteRef href="#${noteRef}"/>`;
        }
        this.noteCounter++;
        const noteId = node.attrs?.["NOTE.ID"] ?? `fn_${this.noteCounter}`;
        const noteContent = children.trim();
        return `<authorialNote eId="${noteId}" marker="${this.noteCounter}"><p>${noteContent}</p></authorialNote>`;
      }
      case "P":
        return children;
      case "TXT":
        return children;
      case "NP": {
        // Nested inside inline — flatten
        return children;
      }
      case "NO.P": {
        return children;
      }
      case "QUOT.START":
      case "QUOT.END":
        return "\u2018";  // smart quote marker
      case "QUOT.S":
        return children;
      case "LIST":
        return children;
      case "ITEM":
        return children;
      case "DLIST":
        return children;
      case "DLIST.ITEM":
        return children;
      case "TERM":
        return `<b>${children}</b>`;
      case "DEFINITION":
        return children;
      default:
        return children;
    }
  }

  // Convert a P element to inline string
  private pToInline(node: XmlNode): string {
    return (node.children ?? []).map((c) => this.convertInlineContent(c)).join("");
  }

  // ── Metadata ─────────────────────────────────────────────────────────────────

  private extractMetadata() {
    // For consolidated texts, try the inner BIB.INSTANCE first, then look
    // for the family-composition BIB.DATA which has the actual NO.DOC
    const bib = getChild(this.doc, "BIB.INSTANCE");

    // For CONS.ACT the NO.DOC is often inside FAM.COMP > BIB.DATA > BIB.INSTANCE.CONS
    const famComp = getChild(this.doc, "FAM.COMP");
    const bibData = famComp ? getChild(famComp, "BIB.DATA") : undefined;
    const bibInstCons = bibData ? getChild(bibData, "BIB.INSTANCE.CONS") : undefined;

    // Extract year/docNumber — prefer the consolidated bib if available
    const noDocSource = bibInstCons ?? bib;
    if (noDocSource) {
      const docRef = getChild(noDocSource, "DOCUMENT.REF") ?? getChild(noDocSource, "DOCUMENT.REF.CONS");
      const noDoc = getChild(noDocSource, "NO.DOC") ?? (docRef ? getChild(docRef, "NO.DOC") : undefined);
      if (noDoc) {
        this.year = getTextContent(getChild(noDoc, "YEAR") ?? { type: "text", text: "" });
        this.docNumber = getTextContent(getChild(noDoc, "NO.CURRENT") ?? { type: "text", text: "" });
      }
    }

    if (bib) {
      const dateNode = getChild(bib, "DATE");
      this.date = dateNode?.attrs?.["ISO"] ?? "";
      this.lang = getTextContent(getChild(bib, "LG.DOC") ?? { type: "text", text: "EN" });
      const docRef = getChild(bib, "DOCUMENT.REF");
      if (docRef) {
        this.collection = getTextContent(getChild(docRef, "COLL") ?? { type: "text", text: "L" });
      }
    }

    // For corrigenda, override docType
    if (this.rootTag === "CORR") {
      this.docType = "corrigendum";
      return;
    }

    // Determine doc type from title text
    const titleText = this.getTitleText().toLowerCase();
    if (titleText.includes("regulation")) {
      this.docType = "reg";
    } else if (titleText.includes("decision")) {
      this.docType = "dec";
    } else if (titleText.includes("directive")) {
      this.docType = "dir";
    } else {
      this.docType = "act";
    }
  }

  private getTitleText(): string {
    const titleNode = getChild(this.doc, "TITLE");
    if (!titleNode) return "";
    return getTextContent(titleNode);
  }

  private emitMeta() {
    this.open("meta");

    // identification
    const eli = `http://data.europa.eu/eli/${this.docType}/${this.year}/${this.docNumber}/oj`;
    const fmtDate = this.date
      ? `${this.date.slice(0, 4)}-${this.date.slice(4, 6)}-${this.date.slice(6, 8)}`
      : "";

    this.open("identification", { source: "#source" });

    // FRBRWork
    this.open("FRBRWork");
    this.selfClose("FRBRthis", { value: `${eli}` });
    this.selfClose("FRBRuri", { value: eli });
    this.selfClose("FRBRdate", { date: fmtDate, name: "publication" });
    this.selfClose("FRBRauthor", { href: "http://publications.europa.eu/resource/authority/corporate-body/CONSILIUM" });
    this.selfClose("FRBRcountry", { value: "eu" });
    this.selfClose("FRBRnumber", { value: this.docNumber });
    this.close("FRBRWork");

    // FRBRExpression
    this.open("FRBRExpression");
    this.selfClose("FRBRthis", { value: `${eli}/${this.lang.toLowerCase()}` });
    this.selfClose("FRBRuri", { value: `${eli}/${this.lang.toLowerCase()}` });
    this.selfClose("FRBRdate", { date: fmtDate, name: "publication" });
    this.selfClose("FRBRauthor", { href: "http://publications.europa.eu/resource/authority/corporate-body/CONSILIUM" });
    this.selfClose("FRBRlanguage", { language: this.lang.toLowerCase() });
    this.close("FRBRExpression");

    // FRBRManifestation
    this.open("FRBRManifestation");
    this.selfClose("FRBRthis", { value: `${eli}/${this.lang.toLowerCase()}/xml` });
    this.selfClose("FRBRuri", { value: `${eli}/${this.lang.toLowerCase()}/xml` });
    this.selfClose("FRBRdate", { date: fmtDate, name: "transformation" });
    this.selfClose("FRBRauthor", { href: "#formex-to-akn-poc" });
    this.close("FRBRManifestation");

    this.close("identification");

    // references
    this.open("references", { source: "#source" });
    this.selfClose("TLCOrganization", {
      eId: "source",
      href: "http://publications.europa.eu/resource/authority/corporate-body/CONSILIUM",
      showAs: "Council of the European Union",
    });
    this.close("references");

    this.close("meta");
  }

  // ── Preface (Title) ──────────────────────────────────────────────────────────

  private emitPreface() {
    const titleNode = getChild(this.doc, "TITLE");
    if (!titleNode) return;

    this.open("preface");

    const ti = getChild(titleNode, "TI");
    if (ti) {
      this.open("longTitle", { eId: "longTitle" });
      const ps = getChildren(ti, "P");
      for (const p of ps) {
        const inline = this.pToInline(p);
        this.emitInline("p", {}, inline);
      }
      this.close("longTitle");
    }

    this.close("preface");
  }

  // ── Preamble ─────────────────────────────────────────────────────────────────

  private emitPreamble() {
    const preambleNode = getChild(this.doc, "PREAMBLE");
    if (!preambleNode) return;

    this.open("preamble", { eId: "preamble" });

    // PREAMBLE.INIT → formula[@name="actingEntity"]
    const init = getChild(preambleNode, "PREAMBLE.INIT");
    if (init) {
      this.open("formula", { name: "actingEntity", eId: "formula_1" });
      for (const p of getChildren(init, "P")) {
        this.emitInline("p", {}, this.pToInline(p));
      }
      this.close("formula");
    }

    // GR.VISA → citations
    const grVisa = getChild(preambleNode, "GR.VISA");
    if (grVisa) {
      this.open("citations", { eId: "cits" });
      let citNum = 0;
      for (const visa of getChildren(grVisa, "VISA")) {
        citNum++;
        const eId = `cit_${citNum}`;
        const inline = (visa.children ?? []).map((c) => this.convertInlineContent(c)).join("");
        this.emitInline("citation", { eId }, `<p>${inline}</p>`);
      }
      this.close("citations");
    }

    // GR.CONSID → recitals
    const grConsid = getChild(preambleNode, "GR.CONSID");
    if (grConsid) {
      this.open("recitals", { eId: "recs" });

      // GR.CONSID.INIT → intro
      const considInit = getChild(grConsid, "GR.CONSID.INIT");
      if (considInit) {
        const introText = getTextContent(considInit);
        this.emitInline("intro", { eId: "recs_intro" }, `<p>${escapeXml(introText)}</p>`);
      }

      let recNum = 0;
      for (const consid of getChildren(grConsid, "CONSID")) {
        recNum++;
        const eId = `rec_${recNum}`;
        this.open("recital", { eId });

        // The recital typically has NP > NO.P + TXT [+ optional P children]
        const np = getChild(consid, "NP");
        if (np) {
          const noP = getChild(np, "NO.P");
          if (noP) {
            this.emitInline("num", {}, escapeXml(getTextContent(noP)));
          }
          // Process all content children of NP (TXT, P, etc.) except NO.P
          for (const child of getAllChildren(np)) {
            if (child.tag === "NO.P") continue;
            const inline = (child.children ?? []).map((c) => this.convertInlineContent(c)).join("");
            if (inline.trim()) {
              this.emitInline("p", {}, inline);
            }
          }
        } else {
          // Fallback: direct content
          const inline = (consid.children ?? []).map((c) => this.convertInlineContent(c)).join("");
          this.emitInline("p", {}, inline);
        }

        this.close("recital");
      }

      this.close("recitals");
    }

    // PREAMBLE.FINAL → formula[@name="enactingFormula"]
    const final = getChild(preambleNode, "PREAMBLE.FINAL");
    if (final) {
      this.open("formula", { name: "enactingFormula", eId: "formula_2" });
      for (const p of getChildren(final, "P")) {
        this.emitInline("p", {}, this.pToInline(p));
      }
      this.close("formula");
    }

    this.close("preamble");
  }

  // ── Body (ENACTING.TERMS) ───────────────────────────────────────────────────

  private emitBody() {
    const enacting = getChild(this.doc, "ENACTING.TERMS");
    if (!enacting) return;

    this.open("body", { eId: "body" });

    for (const child of getAllChildren(enacting)) {
      switch (child.tag) {
        case "ARTICLE":
          this.emitArticle(child);
          break;
        case "CHAPTER":
          this.emitChapter(child);
          break;
        case "TITLE":
          this.emitBodyTitle(child);
          break;
        case "DIVISION":
          this.emitDivision(child, 0);
          break;
        default:
          // Unknown structure, try generic conversion
          this.emitGenericBlock(child);
          break;
      }
    }

    this.close("body");
  }

  private emitChapter(node: XmlNode) {
    const eId = this.makeEId("chap");
    this.open("chapter", { eId });

    // Chapter may have a NO.TITLE and TITLE children
    for (const child of getAllChildren(node)) {
      switch (child.tag) {
        case "TITLE":
          this.emitInline("num", {}, escapeXml(getTextContent(child)));
          break;
        case "ARTICLE":
          this.emitArticle(child);
          break;
        default:
          this.emitGenericBlock(child);
      }
    }

    this.close("chapter");
  }

  private emitBodyTitle(node: XmlNode) {
    const eId = this.makeEId("title");
    this.open("title", { eId });
    for (const child of getAllChildren(node)) {
      if (child.tag === "ARTICLE") {
        this.emitArticle(child);
      } else {
        this.emitGenericBlock(child);
      }
    }
    this.close("title");
  }

  private emitDivision(node: XmlNode, depth: number) {
    // DIVISION elements wrap chapters (depth 0) or sections (depth 1+)
    const aknTag = depth === 0 ? "chapter" : "section";
    const eId = this.makeEId(depth === 0 ? "chap" : "sec");
    this.open(aknTag, { eId });

    for (const child of getAllChildren(node)) {
      switch (child.tag) {
        case "TITLE": {
          // TITLE contains TI (number like "CHAPTER I") and STI (name)
          const ti = getChild(child, "TI");
          const sti = getChild(child, "STI");
          if (ti) this.emitInline("num", {}, escapeXml(getTextContent(ti)));
          if (sti) this.emitInline("heading", {}, escapeXml(getTextContent(sti)));
          break;
        }
        case "ARTICLE":
          this.emitArticle(child);
          break;
        case "DIVISION":
          this.emitDivision(child, depth + 1);
          break;
        default:
          this.emitGenericBlock(child);
      }
    }

    this.close(aknTag);
  }

  private emitArticle(node: XmlNode) {
    const identifier = node.attrs?.["IDENTIFIER"] ?? "";
    const artNum = parseInt(identifier, 10) || 0;
    const eId = `art_${artNum || this.makeEId("art")}`;
    this.open("article", { eId });

    // TI.ART → num
    const tiArt = getChild(node, "TI.ART");
    if (tiArt) {
      this.emitInline("num", {}, escapeXml(getTextContent(tiArt)));
    }

    // STI.ART → heading
    const stiArt = getChild(node, "STI.ART");
    if (stiArt) {
      this.emitInline("heading", {}, escapeXml(getTextContent(stiArt)));
    }

    // Paragraphs and alineas
    let paragNum = 0;
    for (const child of getAllChildren(node)) {
      switch (child.tag) {
        case "TI.ART":
        case "STI.ART":
          break; // already handled
        case "PARAG":
          paragNum++;
          this.emitParagraph(child, eId, paragNum);
          break;
        case "ALINEA":
          this.emitAlinea(child, eId);
          break;
        case "NP":
          this.emitPoint(child, eId);
          break;
        default:
          this.emitGenericBlock(child);
          break;
      }
    }

    this.close("article");
  }

  private emitParagraph(node: XmlNode, parentEId: string, num: number) {
    const eId = `${parentEId}__para_${num}`;
    this.open("paragraph", { eId });

    // NO.PARAG is used in consolidated texts, NO.P in standard Formex
    const noP = getChild(node, "NO.PARAG") ?? getChild(node, "NO.P");
    if (noP) {
      this.emitInline("num", {}, escapeXml(getTextContent(noP)));
    }

    // Sub-content
    for (const child of getAllChildren(node)) {
      switch (child.tag) {
        case "NO.P":
        case "NO.PARAG":
          break; // already handled
        case "ALINEA":
          this.emitAlinea(child, eId);
          break;
        case "NP":
          this.emitPoint(child, eId);
          break;
        case "LIST":
          this.emitList(child);
          break;
        default:
          this.emitGenericBlock(child);
          break;
      }
    }

    this.close("paragraph");
  }

  private emitAlinea(node: XmlNode, parentEId: string) {
    // Alinea is treated as content or subparagraph
    const eId = `${parentEId}__content`;
    this.open("content", { eId });
    const inline = (node.children ?? []).map((c) => this.convertInlineContent(c)).join("");
    this.emitInline("p", {}, inline);
    this.close("content");
  }

  private emitPoint(node: XmlNode, parentEId: string) {
    const noP = getChild(node, "NO.P");
    const pointNum = noP ? getTextContent(noP).replace(/[()]/g, "").trim() : "";
    const eId = pointNum ? `${parentEId}__point_${pointNum}` : this.makeEId("point");
    this.open("point", { eId });

    if (noP) {
      this.emitInline("num", {}, escapeXml(getTextContent(noP)));
    }

    const txt = getChild(node, "TXT");
    if (txt) {
      this.open("content", {});
      const inline = (txt.children ?? []).map((c) => this.convertInlineContent(c)).join("");
      this.emitInline("p", {}, inline);
      this.close("content");
    }

    // Nested NP elements
    for (const child of getChildren(node, "NP")) {
      this.emitPoint(child, eId);
    }

    this.close("point");
  }

  // ── Conclusions (FINAL) ──────────────────────────────────────────────────────

  private emitConclusions() {
    const finalNode = getChild(this.doc, "FINAL");
    if (!finalNode) return;

    this.open("conclusions", { eId: "conclusions" });

    // Direct P children (e.g., "This Regulation shall be binding...")
    for (const p of getChildren(finalNode, "P")) {
      const inline = this.pToInline(p);
      this.emitInline("p", {}, inline);
    }

    // SIGNATURE
    const sigNode = getChild(finalNode, "SIGNATURE");
    if (sigNode) {
      this.open("blockContainer", { eId: "signature" });

      const plDate = getChild(sigNode, "PL.DATE");
      if (plDate) {
        for (const p of getChildren(plDate, "P")) {
          this.emitInline("p", { class: "signatureDate" }, this.pToInline(p));
        }
      }

      const signatory = getChild(sigNode, "SIGNATORY");
      if (signatory) {
        this.open("signature", { eId: "signature_1" });
        for (const p of getChildren(signatory, "P")) {
          this.emitInline("p", {}, this.pToInline(p));
        }
        this.close("signature");
      }

      this.close("blockContainer");
    }

    this.close("conclusions");
  }

  // ── Generic fallback ─────────────────────────────────────────────────────────

  private emitGenericBlock(node: XmlNode) {
    if (node.type === "text") {
      if ((node.text ?? "").trim()) {
        this.emitInline("p", {}, escapeXml(node.text ?? ""));
      }
      return;
    }
    if (node.type !== "element") return;

    // Fallback: wrap in a p
    const inline = this.convertInlineContent(node);
    if (inline.trim()) {
      this.emitInline("p", {}, inline);
    }
  }

  // ── Corrigendum (CORR) ─────────────────────────────────────────────────────

  private emitCorrigendumBody() {
    const contCorr = getChild(this.doc, "CONTENTS.CORR");
    if (!contCorr) return;

    this.open("body", { eId: "body" });

    const corrections = getChildren(contCorr, "CORRECTION");
    let corrNum = 0;
    for (const corr of corrections) {
      corrNum++;
      const eId = `correction_${corrNum}`;
      this.open("blockContainer", { eId });

      // DESCRIPTION — location of the error
      const desc = getChild(corr, "DESCRIPTION");
      if (desc) {
        this.open("intro", { eId: `${eId}__intro` });
        for (const p of getChildren(desc, "P")) {
          this.emitInline("p", {}, this.pToInline(p));
        }
        this.close("intro");
      }

      // OLD.CORR — original (erroneous) text
      const oldCorr = getChild(corr, "OLD.CORR");
      if (oldCorr) {
        this.open("blockContainer", { eId: `${eId}__old`, class: "old-text" });
        this.emitCorrContent(oldCorr);
        this.close("blockContainer");
      }

      // NEW.CORR — corrected text
      const newCorr = getChild(corr, "NEW.CORR");
      if (newCorr) {
        this.open("blockContainer", { eId: `${eId}__new`, class: "new-text" });
        this.emitCorrContent(newCorr);
        this.close("blockContainer");
      }

      this.close("blockContainer");
    }

    this.close("body");
  }

  /** Emit the content of an OLD.CORR or NEW.CORR element */
  private emitCorrContent(node: XmlNode) {
    for (const child of getAllChildren(node)) {
      switch (child.tag) {
        case "DLIST":
          this.emitDList(child);
          break;
        case "P":
          this.emitInline("p", {}, this.pToInline(child));
          break;
        default:
          this.emitGenericBlock(child);
      }
    }
  }

  /** Emit a DLIST (definition list) as block content */
  private emitDList(node: XmlNode) {
    for (const item of getChildren(node, "DLIST.ITEM")) {
      const term = getChild(item, "TERM");
      const def = getChild(item, "DEFINITION");
      if (term) {
        const termInline = this.convertInlineContent(term);
        this.emitInline("p", { class: "dlist-term" }, termInline);
      }
      if (def) {
        for (const child of getAllChildren(def)) {
          if (child.tag === "QUOT.S") {
            // Quoted block — emit its children
            for (const qChild of getAllChildren(child)) {
              this.emitGenericBlock(qChild);
            }
          } else {
            this.emitGenericBlock(child);
          }
        }
      }
    }
  }

  // ── Annex / Table support ──────────────────────────────────────────────────

  private emitAnnexBody() {
    // An ANNEX document has CONTENTS with TBL, GR.SEQ, LIST, etc.
    const contents = getChild(this.doc, "CONTENTS");
    if (!contents) return;

    this.open("body", { eId: "body" });
    this.emitContents(contents);
    this.close("body");
  }

  /** Emit a CONS.ANNEX as a <componentRef> or inline annex block */
  private emitConsAnnex() {
    const consAnnex = getChild(this.doc, "CONS.ANNEX");
    if (!consAnnex) return;

    this.open("attachments");
    this.open("attachment", { eId: "att_1" });

    // CONS.ANNEX typically has TITLE and CONTENTS
    const title = getChild(consAnnex, "TITLE");
    if (title) {
      const ti = getChild(title, "TI");
      const sti = getChild(title, "STI");
      if (ti) {
        this.emitInline("heading", {}, this.convertInlineContent(ti));
      }
      if (sti) {
        this.emitInline("subheading", {}, this.convertInlineContent(sti));
      }
    }

    const contents = getChild(consAnnex, "CONTENTS");
    if (contents) {
      this.open("doc", { name: "annex" });
      this.open("mainBody");
      this.emitContents(contents);
      this.close("mainBody");
      this.close("doc");
    }

    this.close("attachment");
    this.close("attachments");
  }

  /** Emit CONTENTS children (TBL, GR.SEQ, LIST, P, etc.) */
  private emitContents(contents: XmlNode) {
    for (const child of getAllChildren(contents)) {
      switch (child.tag) {
        case "TBL":
          this.emitTable(child);
          break;
        case "GR.SEQ":
          this.emitGrSeq(child);
          break;
        case "LIST":
          this.emitList(child);
          break;
        case "P":
          this.emitInline("p", {}, this.pToInline(child));
          break;
        case "TITLE":
          this.emitContentsTitle(child);
          break;
        default:
          this.emitGenericBlock(child);
      }
    }
  }

  /** Emit a GR.SEQ (grouped sequence) as a hcontainer */
  private emitGrSeq(node: XmlNode) {
    const level = node.attrs?.["LEVEL"] ?? "1";
    const eId = this.makeEId(`hcontainer_${level}`);
    this.open("hcontainer", { eId, name: `section-level-${level}` });

    for (const child of getAllChildren(node)) {
      switch (child.tag) {
        case "TITLE":
          this.emitContentsTitle(child);
          break;
        case "GR.SEQ":
          this.emitGrSeq(child);
          break;
        case "LIST":
          this.emitList(child);
          break;
        case "P":
          this.open("content", {});
          this.emitInline("p", {}, this.pToInline(child));
          this.close("content");
          break;
        case "TBL":
          this.emitTable(child);
          break;
        default:
          this.emitGenericBlock(child);
      }
    }

    this.close("hcontainer");
  }

  /** Emit a TITLE inside CONTENTS/GR.SEQ */
  private emitContentsTitle(node: XmlNode) {
    const ti = getChild(node, "TI");
    const sti = getChild(node, "STI");
    if (ti) {
      this.emitInline("heading", {}, this.convertInlineContent(ti));
    }
    if (sti) {
      this.emitInline("subheading", {}, this.convertInlineContent(sti));
    }
  }

  /** Emit a LIST element */
  private emitList(node: XmlNode) {
    const listType = node.attrs?.["TYPE"] ?? "";
    this.open("blockList", { class: `list-${listType.toLowerCase()}` });

    for (const item of getChildren(node, "ITEM")) {
      this.open("item", {});
      for (const child of getAllChildren(item)) {
        switch (child.tag) {
          case "NP":
            this.emitListNP(child);
            break;
          case "P":
            this.emitInline("p", {}, this.pToInline(child));
            break;
          case "LIST":
            this.emitList(child);
            break;
          default:
            this.emitGenericBlock(child);
        }
      }
      this.close("item");
    }

    this.close("blockList");
  }

  /** Emit an NP inside a LIST ITEM */
  private emitListNP(node: XmlNode) {
    const noP = getChild(node, "NO.P");
    if (noP) {
      this.emitInline("num", {}, escapeXml(getTextContent(noP)));
    }
    const txt = getChild(node, "TXT");
    if (txt) {
      const inline = (txt.children ?? []).map((c) => this.convertInlineContent(c)).join("");
      this.emitInline("p", {}, inline);
    }
    // Nested lists within TXT > P > LIST
    for (const child of getAllChildren(node)) {
      if (child.tag === "LIST") {
        this.emitList(child);
      }
    }
  }

  /** Emit a TBL (table) as an AKN <table> */
  private emitTable(node: XmlNode) {
    const eId = this.makeEId("tbl");
    this.open("table", { eId });

    // GR.NOTES → footnotes at the end
    const grNotes = getChild(node, "GR.NOTES");

    // CORPUS → table rows
    const corpus = getChild(node, "CORPUS");
    if (corpus) {
      for (const row of getChildren(corpus, "ROW")) {
        const rowType = row.attrs?.["TYPE"] ?? "";
        this.open("tr", rowType === "HEADER" ? { class: "header" } : {});

        for (const cell of getChildren(row, "CELL")) {
          const cellTag = cell.attrs?.["TYPE"] === "HEADER" ? "th" : "td";
          const cellAttrs: Record<string, string> = {};
          if (cell.attrs?.["COLSPAN"]) cellAttrs.colspan = cell.attrs["COLSPAN"];
          if (cell.attrs?.["ROWSPAN"]) cellAttrs.rowspan = cell.attrs["ROWSPAN"];

          const inline = (cell.children ?? []).map((c) => this.convertInlineContent(c)).join("");
          this.emitInline(cellTag, cellAttrs, inline);
        }

        this.close("tr");
      }
    }

    // Emit footnotes from GR.NOTES if present
    if (grNotes) {
      for (const note of getChildren(grNotes, "NOTE")) {
        const noteId = note.attrs?.["NOTE.ID"] ?? "";
        const noteContent = (note.children ?? []).map((c) => this.convertInlineContent(c)).join("");
        this.emitInline("authorialNote", { eId: noteId }, noteContent);
      }
    }

    this.close("table");
  }

  // ── Main Convert ─────────────────────────────────────────────────────────────

  convert(): string {
    this.extractMetadata();

    this.lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
    this.open("akomaNtoso", {
      xmlns: AKN_NS,
      "xmlns:akn4eu": AKN4EU_NS,
    });

    this.open("act", {
      name: this.docType,
    });

    this.emitMeta();
    this.emitPreface();

    if (this.rootTag === "CORR") {
      // Corrigenda: no preamble, body is the corrections
      this.emitCorrigendumBody();
    } else if (this.rootTag === "ANNEX") {
      // Standalone annex: body is the CONTENTS (typically a table)
      this.emitAnnexBody();
    } else {
      // Normal ACT or CONS.ACT
      this.emitPreamble();
      this.emitBody();
      this.emitConclusions();

      // CONS.ACT may have a CONS.ANNEX after the body
      if (this.rootTag === "CONS.ACT") {
        this.emitConsAnnex();
      }
    }

    this.close("act");
    this.close("akomaNtoso");

    return this.lines.join("\n");
  }
}

// ─── CLI Entry Point ──────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: node --experimental-strip-types poc-formex-to-akn.ts <input.fmx.xml> <output.akn.xml>");
    process.exit(1);
  }

  const inputPath = args[0];
  const outputPath = args[1];

  console.log(`Reading Formex: ${basename(inputPath)}`);
  const xml = readFileSync(inputPath, "utf-8");

  console.log("Parsing XML...");
  const root = parseXml(xml);

  console.log("Converting to AKN 3.0...");
  const converter = new FormexToAknConverter(root);
  const akn = converter.convert();

  writeFileSync(outputPath, akn, "utf-8");
  console.log(`Written AKN: ${basename(outputPath)} (${akn.length} bytes)`);

  // Print a preview
  const previewLines = akn.split("\n").slice(0, 60);
  console.log("\n--- Preview (first 60 lines) ---");
  console.log(previewLines.join("\n"));
  console.log("--- ... ---\n");
}

main();
