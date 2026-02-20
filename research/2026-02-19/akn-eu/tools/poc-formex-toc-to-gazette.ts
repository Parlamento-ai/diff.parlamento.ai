/**
 * Proof-of-Concept: Formex TOC XML → Akoma Ntoso officialGazette Converter
 *
 * Converts a Formex PUBLICATION (TOC) file into an AKN 3.0 officialGazette document,
 * following AKN4EU conventions where applicable.
 *
 * The Formex TOC structure is:
 *   PUBLICATION > OJ > BIB.OJ + VOLUME > SECTION > SUBSECTION > ITEM.PUB
 *
 * The output AKN structure is:
 *   akomaNtoso > officialGazette > meta + collectionBody
 *
 * Usage:
 *   node --experimental-strip-types poc-formex-toc-to-gazette.ts <input.toc.fmx.xml> <output.xml>
 *
 * Uses only Node.js built-in modules (no npm dependencies).
 */

import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

// ─── Minimal XML Parser ────────────────────────────────────────────────────────
// Reused from poc-formex-to-akn.ts — recursive-descent parser for well-formed XML.

interface XmlNode {
  type: "element" | "text" | "comment" | "cdata";
  tag?: string;
  attrs?: Record<string, string>;
  children?: XmlNode[];
  text?: string;
}

function parseXml(xml: string): XmlNode {
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
        `Expected '${s}' at position ${pos}, got '${xml.substring(pos, pos + 20)}'`
      );
    }
    pos += s.length;
  }

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
    const ent = xml.substring(pos, end);
    pos = end + 1;
    switch (ent) {
      case "amp":
        return "&";
      case "lt":
        return "<";
      case "gt":
        return ">";
      case "apos":
        return "'";
      case "quot":
        return '"';
      default:
        if (ent.startsWith("#x"))
          return String.fromCodePoint(parseInt(ent.slice(2), 16));
        if (ent.startsWith("#"))
          return String.fromCodePoint(parseInt(ent.slice(1), 10));
        return `&${ent};`;
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
    const children: XmlNode[] = [];
    while (pos < xml.length) {
      if (xml.substring(pos, pos + 2) === "</") {
        pos += 2;
        pos = xml.indexOf(">", pos) + 1;
        return { type: "element", tag, attrs, children };
      }
      if (xml.substring(pos, pos + 4) === "<!--") {
        const end = xml.indexOf("-->", pos);
        children.push({ type: "comment", text: xml.substring(pos + 4, end) });
        pos = end + 3;
      } else if (xml.substring(pos, pos + 9) === "<![CDATA[") {
        const end = xml.indexOf("]]>", pos);
        children.push({ type: "cdata", text: xml.substring(pos + 9, end) });
        pos = end + 3;
      } else if (xml[pos] === "<") {
        children.push(parseElement());
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

  skipProlog();
  return parseElement();
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getChild(node: XmlNode, tag: string): XmlNode | undefined {
  return node.children?.find((c) => c.type === "element" && c.tag === tag);
}

function getChildren(node: XmlNode, tag: string): XmlNode[] {
  return (
    node.children?.filter((c) => c.type === "element" && c.tag === tag) ?? []
  );
}

function getAllChildren(node: XmlNode): XmlNode[] {
  return node.children?.filter((c) => c.type === "element") ?? [];
}

function getTextContent(node: XmlNode): string {
  if (node.type === "text" || node.type === "cdata") return node.text ?? "";
  return (node.children ?? []).map(getTextContent).join("");
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Converter Class ──────────────────────────────────────────────────────────

const AKN_NS = "http://docs.oasis-open.org/legaldocml/ns/akn/3.0";

/**
 * Extracts structured metadata from BIB.OJ
 */
interface OjMeta {
  collection: string; // "L" or "C"
  year: string;
  number: string;
  date: string; // ISO date from DATE@ISO, e.g. "20260219"
  dateFmt: string; // formatted "2026-02-19"
  dateHuman: string; // human-readable "19 February 2026"
  language: string;
  age: string;
}

/**
 * Represents a single published item found in the TOC
 */
interface TocItem {
  docInstance: string; // e.g. "L_202600421EN.doc.fmx.xml"
  sectionType: string; // e.g. "L2" (non-legislative)
  sectionTitle: string; // e.g. "Non-legislative acts"
  sectionNumber: string; // e.g. "II"
  subsectionTitle: string; // e.g. "DECISIONS"
  volumeId: string;
}

class FormexTocToGazetteConverter {
  private root: XmlNode;
  private lines: string[] = [];
  private indent = 0;

  private ojMeta!: OjMeta;
  private items: TocItem[] = [];

  constructor(root: XmlNode) {
    this.root = root;
  }

  private emit(line: string) {
    this.lines.push("  ".repeat(this.indent) + line);
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

  private emitInline(
    tag: string,
    attrs: Record<string, string>,
    content: string
  ) {
    const attrStr = Object.entries(attrs)
      .map(([k, v]) => ` ${k}="${escapeXml(v)}"`)
      .join("");
    this.emit(`<${tag}${attrStr}>${content}</${tag}>`);
  }

  // ── Extract metadata from PUBLICATION/OJ/BIB.OJ ──────────────────────────────

  private extractMetadata() {
    const oj = getChild(this.root, "OJ");
    if (!oj) throw new Error("Missing OJ element in PUBLICATION");

    const bib = getChild(oj, "BIB.OJ");
    if (!bib) throw new Error("Missing BIB.OJ element");

    const collection = getTextContent(
      getChild(bib, "COLL") ?? { type: "text", text: "L" }
    );

    const noDoc = getChild(bib, "NO.DOC");
    let year = "";
    let number = "";
    if (noDoc) {
      year = getTextContent(
        getChild(noDoc, "YEAR") ?? { type: "text", text: "" }
      );
      number = getTextContent(
        getChild(noDoc, "NO.CURRENT") ?? { type: "text", text: "" }
      );
    }

    const dateNode = getChild(bib, "DATE");
    const dateIso = dateNode?.attrs?.["ISO"] ?? "";
    const dateHuman = getTextContent(dateNode ?? { type: "text", text: "" });
    const dateFmt = dateIso
      ? `${dateIso.slice(0, 4)}-${dateIso.slice(4, 6)}-${dateIso.slice(6, 8)}`
      : "";

    const language = getTextContent(
      getChild(bib, "LG.OJ") ?? { type: "text", text: "EN" }
    );

    const age = getTextContent(
      getChild(bib, "AGE.OJ") ?? { type: "text", text: "" }
    );

    this.ojMeta = {
      collection,
      year,
      number,
      date: dateIso,
      dateFmt,
      dateHuman,
      language,
      age,
    };
  }

  // ── Collect ITEM.PUB entries from all VOLUME > SECTION > SUBSECTION ─────────

  private collectItems() {
    const oj = getChild(this.root, "OJ")!;
    for (const volume of getChildren(oj, "VOLUME")) {
      const bibVolume = getChild(volume, "BIB.VOLUME");
      const volumeId = bibVolume
        ? getTextContent(
            getChild(bibVolume, "VOLUME.ID") ?? { type: "text", text: "1" }
          )
        : "1";

      for (const section of getChildren(volume, "SECTION")) {
        const sectionType = section.attrs?.["TYPE"] ?? "";

        // Section title: TITLE > TI > NP > (NO.P + TXT)
        let sectionNumber = "";
        let sectionTitle = "";
        const secTitleNode = getChild(section, "TITLE");
        if (secTitleNode) {
          const ti = getChild(secTitleNode, "TI");
          if (ti) {
            const np = getChild(ti, "NP");
            if (np) {
              sectionNumber = getTextContent(
                getChild(np, "NO.P") ?? { type: "text", text: "" }
              );
              sectionTitle = getTextContent(
                getChild(np, "TXT") ?? { type: "text", text: "" }
              );
            } else {
              sectionTitle = getTextContent(ti);
            }
          }
        }

        // Items can be directly in SECTION or inside SUBSECTION
        this.collectItemsFromContainer(
          section,
          sectionType,
          sectionNumber,
          sectionTitle,
          "",
          volumeId
        );

        for (const subsection of getChildren(section, "SUBSECTION")) {
          let subsectionTitle = "";
          const subTitleNode = getChild(subsection, "TITLE");
          if (subTitleNode) {
            const ti = getChild(subTitleNode, "TI");
            if (ti) {
              subsectionTitle = getTextContent(ti);
            }
          }

          this.collectItemsFromContainer(
            subsection,
            sectionType,
            sectionNumber,
            sectionTitle,
            subsectionTitle,
            volumeId
          );
        }
      }
    }
  }

  private collectItemsFromContainer(
    container: XmlNode,
    sectionType: string,
    sectionNumber: string,
    sectionTitle: string,
    subsectionTitle: string,
    volumeId: string
  ) {
    for (const item of getChildren(container, "ITEM.PUB")) {
      const docInstance = item.attrs?.["DOC.INSTANCE"] ?? "";
      if (docInstance) {
        this.items.push({
          docInstance,
          sectionType,
          sectionTitle,
          sectionNumber,
          subsectionTitle,
          volumeId,
        });
      }
    }
  }

  // ── Build the OJ ELI URI ──────────────────────────────────────────────────────

  private ojEli(): string {
    // ELI for OJ issues: /eli/oj/{coll}/{year}/{number}
    const c = this.ojMeta.collection.toLowerCase();
    return `http://data.europa.eu/eli/oj/${c}/${this.ojMeta.year}/${this.ojMeta.number}`;
  }

  // ── Derive a CELEX-like identifier from the DOC.INSTANCE filename ─────────────

  private docInstanceToHref(docInstance: string): string {
    // Typical filename: L_202600421EN.doc.fmx.xml
    // Extract: collection=L, year=2026, number=00421, lang=EN
    const match = docInstance.match(
      /^([A-Z])_(\d{4})(\d{5})([A-Z]{2})\.doc\.fmx\.xml$/
    );
    if (!match) return docInstance;
    const [, coll, year, numPadded, _lang] = match;
    const num = parseInt(numPadded, 10).toString(); // strip leading zeros
    return `http://data.europa.eu/eli/oj/${coll.toLowerCase()}/${year}/${num}`;
  }

  // ── Emit FRBR meta for the OJ issue ──────────────────────────────────────────

  private emitMeta() {
    const eli = this.ojEli();
    const lang = this.ojMeta.language.toLowerCase();

    this.open("meta");

    this.open("identification", { source: "#source" });

    // FRBRWork
    this.open("FRBRWork");
    this.selfClose("FRBRthis", { value: eli });
    this.selfClose("FRBRuri", { value: eli });
    this.selfClose("FRBRdate", {
      date: this.ojMeta.dateFmt,
      name: "publication",
    });
    this.selfClose("FRBRauthor", {
      href: "http://publications.europa.eu/resource/authority/corporate-body/EUOJ",
    });
    this.selfClose("FRBRcountry", { value: "eu" });
    this.selfClose("FRBRnumber", { value: this.ojMeta.number });
    this.close("FRBRWork");

    // FRBRExpression
    this.open("FRBRExpression");
    this.selfClose("FRBRthis", { value: `${eli}/${lang}` });
    this.selfClose("FRBRuri", { value: `${eli}/${lang}` });
    this.selfClose("FRBRdate", {
      date: this.ojMeta.dateFmt,
      name: "publication",
    });
    this.selfClose("FRBRauthor", {
      href: "http://publications.europa.eu/resource/authority/corporate-body/EUOJ",
    });
    this.selfClose("FRBRlanguage", { language: lang });
    this.close("FRBRExpression");

    // FRBRManifestation
    this.open("FRBRManifestation");
    this.selfClose("FRBRthis", { value: `${eli}/${lang}/xml` });
    this.selfClose("FRBRuri", { value: `${eli}/${lang}/xml` });
    this.selfClose("FRBRdate", {
      date: this.ojMeta.dateFmt,
      name: "transformation",
    });
    this.selfClose("FRBRauthor", { href: "#formex-toc-to-gazette-poc" });
    this.close("FRBRManifestation");

    this.close("identification");

    // Publication info
    this.open("publication", {
      date: this.ojMeta.dateFmt,
      name: "Official Journal of the European Union",
      showAs: `OJ ${this.ojMeta.collection} ${this.ojMeta.year}/${this.ojMeta.number}`,
      number: `${this.ojMeta.collection} ${this.ojMeta.number}`,
    });
    this.close("publication");

    // References
    this.open("references", { source: "#source" });
    this.selfClose("TLCOrganization", {
      eId: "source",
      href: "http://publications.europa.eu/resource/authority/corporate-body/EUOJ",
      showAs: "Publications Office of the European Union",
    });
    this.close("references");

    this.close("meta");
  }

  // ── Emit the coverPage with OJ title info ─────────────────────────────────────

  private emitCoverPage() {
    this.open("coverPage", { eId: "coverPage" });
    this.open("longTitle", { eId: "longTitle" });
    this.emitInline(
      "p",
      {},
      `Official Journal of the European Union`
    );
    this.emitInline(
      "p",
      {},
      `${this.ojMeta.collection} series, No ${this.ojMeta.number}, Volume ${this.ojMeta.age}`
    );
    this.emitInline(
      "p",
      {},
      escapeXml(this.ojMeta.dateHuman)
    );
    this.close("longTitle");
    this.close("coverPage");
  }

  // ── Emit collectionBody with components for each ITEM.PUB ─────────────────────

  private emitCollectionBody() {
    this.open("collectionBody");

    // Group items by section, then subsection
    type SectionGroup = {
      sectionType: string;
      sectionNumber: string;
      sectionTitle: string;
      subsections: Map<string, TocItem[]>;
    };

    const sections = new Map<string, SectionGroup>();

    for (const item of this.items) {
      const sKey = `${item.sectionType}::${item.sectionNumber}`;
      if (!sections.has(sKey)) {
        sections.set(sKey, {
          sectionType: item.sectionType,
          sectionNumber: item.sectionNumber,
          sectionTitle: item.sectionTitle,
          subsections: new Map(),
        });
      }
      const sec = sections.get(sKey)!;
      const subKey = item.subsectionTitle || "__direct__";
      if (!sec.subsections.has(subKey)) {
        sec.subsections.set(subKey, []);
      }
      sec.subsections.get(subKey)!.push(item);
    }

    let componentIdx = 0;

    for (const [, section] of sections) {
      // Each section becomes a <componentRef> group wrapped in a <container>
      const sectionEId = `sec_${section.sectionNumber.replace(/\s+/g, "").toLowerCase() || section.sectionType}`;

      this.open("container", { eId: sectionEId });

      // Section heading
      if (section.sectionNumber || section.sectionTitle) {
        const headingParts: string[] = [];
        if (section.sectionNumber)
          headingParts.push(escapeXml(section.sectionNumber));
        if (section.sectionTitle)
          headingParts.push(escapeXml(section.sectionTitle));
        this.emitInline("heading", {}, headingParts.join(" "));
      }

      for (const [subTitle, items] of section.subsections) {
        // Subsection heading
        if (subTitle !== "__direct__") {
          this.open("container", {
            eId: `${sectionEId}__subsec_${subTitle.replace(/\s+/g, "_").toLowerCase()}`,
          });
          this.emitInline("heading", {}, escapeXml(subTitle));
        }

        for (const item of items) {
          componentIdx++;
          const compEId = `comp_${componentIdx}`;
          const href = this.docInstanceToHref(item.docInstance);

          this.open("component", { eId: compEId });
          this.selfClose("componentRef", {
            src: href,
            alt: item.docInstance,
            showAs: this.docInstanceToShowAs(item.docInstance),
          });
          this.close("component");
        }

        if (subTitle !== "__direct__") {
          this.close("container");
        }
      }

      this.close("container");
    }

    this.close("collectionBody");
  }

  /**
   * Derive a human-readable label from the DOC.INSTANCE filename.
   * E.g. "L_202600421EN.doc.fmx.xml" → "OJ L 2026/421"
   */
  private docInstanceToShowAs(docInstance: string): string {
    const match = docInstance.match(
      /^([A-Z])_(\d{4})(\d{5})([A-Z]{2})\.doc\.fmx\.xml$/
    );
    if (!match) return docInstance;
    const [, coll, year, numPadded] = match;
    const num = parseInt(numPadded, 10).toString();
    return `OJ ${coll} ${year}/${num}`;
  }

  // ── Main Convert ──────────────────────────────────────────────────────────────

  convert(): string {
    this.extractMetadata();
    this.collectItems();

    this.lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
    this.open("akomaNtoso", { xmlns: AKN_NS });
    this.open("officialGazette", {
      name: `oj-${this.ojMeta.collection.toLowerCase()}-${this.ojMeta.year}-${this.ojMeta.number}`,
    });

    this.emitMeta();
    this.emitCoverPage();
    this.emitCollectionBody();

    this.close("officialGazette");
    this.close("akomaNtoso");

    return this.lines.join("\n");
  }
}

// ─── CLI Entry Point ──────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error(
      "Usage: node --experimental-strip-types poc-formex-toc-to-gazette.ts <input.toc.fmx.xml> <output.xml>"
    );
    process.exit(1);
  }

  const inputPath = args[0];
  const outputPath = args[1];

  console.log(`Reading Formex TOC: ${basename(inputPath)}`);
  const xml = readFileSync(inputPath, "utf-8");

  console.log("Parsing XML...");
  const root = parseXml(xml);

  console.log("Converting to AKN officialGazette...");
  const converter = new FormexTocToGazetteConverter(root);
  const akn = converter.convert();

  writeFileSync(outputPath, akn, "utf-8");
  console.log(`Written AKN: ${basename(outputPath)} (${akn.length} bytes)`);

  // Print full output
  console.log("\n--- Full Output ---");
  console.log(akn);
  console.log("--- End ---\n");
}

main();
