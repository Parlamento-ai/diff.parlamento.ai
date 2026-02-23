/**
 * Proof-of-Concept: AKN 3.0 XML Diff — Compares two versions of a legislative act
 *s
 * Compares an original AKN XML file against a consolidated version and generates:
 *   1. A human-readable diff summary to stdout
 *   2. An AKN 3.0 changeSet XML file
 *
 * Usage:
 *   node --experimental-strip-types poc-akn-diff.ts <original.xml> <consolidated.xml>
 *
 * Uses only Node.js built-in modules (no npm dependencies).
 */

import { readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

// ─── Minimal XML Parser ────────────────────────────────────────────────────────
// Same recursive-descent parser used in the Formex converter.

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
      throw new Error(`Expected '${s}' at position ${pos}, got '${xml.substring(pos, pos + 40)}'`);
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
      } else if (xml.substring(pos, pos + 2) === "<?") {
        const end = xml.indexOf("?>", pos);
        pos = end + 2;
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

// ─── XML Helpers ────────────────────────────────────────────────────────────────

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

// ─── Article Extraction ─────────────────────────────────────────────────────────

interface Article {
  /** The eId from the XML attribute */
  eId: string;
  /** The <num> text, e.g. "Article 1" or "Article 2a" */
  num: string;
  /** The <heading> text */
  heading: string;
  /** Full text content (all nested text flattened) */
  textContent: string;
  /** The raw XML subtree for reference */
  xmlNode: XmlNode;
}

/**
 * Extract all <article> elements from an AKN document.
 * Uses the <num> text as the unique key since eId can be duplicated
 * in consolidated texts (e.g. "Article 2a" reuses eId="art_2").
 */
function extractArticles(root: XmlNode): Article[] {
  const articles: Article[] = [];

  function walk(node: XmlNode) {
    if (node.type === "element" && node.tag === "article") {
      const eId = node.attrs?.["eId"] ?? "";
      const numNode = getChild(node, "num");
      const headingNode = getChild(node, "heading");
      const num = numNode ? getTextContent(numNode).trim() : "";
      const heading = headingNode ? getTextContent(headingNode).trim() : "";

      // Get full text content excluding the <num> and <heading>
      const bodyText = getArticleBodyText(node);

      articles.push({ eId, num, heading, textContent: bodyText, xmlNode: node });
      return; // don't recurse into article children
    }
    for (const child of (node.children ?? [])) {
      if (child.type === "element") walk(child);
    }
  }

  walk(root);
  return articles;
}

/**
 * Get the text content of an article's body (everything except num and heading).
 * This gives us the substantive content for comparison.
 */
function getArticleBodyText(article: XmlNode): string {
  const parts: string[] = [];
  for (const child of getAllChildren(article)) {
    if (child.tag === "num" || child.tag === "heading") continue;
    parts.push(getTextContent(child));
  }
  return parts.join("\n").replace(/\s+/g, " ").trim();
}

/**
 * Build a unique key for an article based on its <num> text.
 * E.g. "Article 1" -> "art_1", "Article 2a" -> "art_2a"
 */
function articleKey(num: string): string {
  const match = num.match(/Article\s+(\S+)/i);
  if (match) return `art_${match[1].toLowerCase()}`;
  return num.toLowerCase().replace(/\s+/g, "_");
}

// ─── Text Diff ──────────────────────────────────────────────────────────────────

interface DiffLine {
  type: "same" | "added" | "removed";
  text: string;
}

/**
 * Simple line-by-line diff using longest common subsequence.
 * Good enough for comparing article text.
 */
function diffLines(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split(/(?<=\.)\s+|(?<=;)\s+|\n/);
  const newLines = newText.split(/(?<=\.)\s+|(?<=;)\s+|\n/);

  // LCS table
  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack
  const result: DiffLine[] = [];
  let i = m, j = n;
  const stack: DiffLine[] = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      stack.push({ type: "same", text: oldLines[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: "added", text: newLines[j - 1] });
      j--;
    } else {
      stack.push({ type: "removed", text: oldLines[i - 1] });
      i--;
    }
  }
  stack.reverse();
  return stack;
}

// ─── Change Types ───────────────────────────────────────────────────────────────

interface Change {
  type: "substitution" | "insertion" | "repeal";
  /** Unique key for the article, e.g. "art_1" */
  key: string;
  /** Article num text, e.g. "Article 1" */
  articleNum: string;
  /** Heading from the version that exists */
  heading: string;
  /** Old text (empty for insertions) */
  oldText: string;
  /** New text (empty for repeals) */
  newText: string;
  /** Old heading (for substitutions) */
  oldHeading: string;
  /** New heading (for substitutions) */
  newHeading: string;
}

// ─── ChangeSet XML Generator ────────────────────────────────────────────────────

const AKN_NS = "http://docs.oasis-open.org/legaldocml/ns/akn/3.0";

class ChangeSetGenerator {
  private lines: string[] = [];
  private indent = 0;
  private baseUri: string;
  private resultUri: string;

  constructor(baseUri: string, resultUri: string) {
    this.baseUri = baseUri;
    this.resultUri = resultUri;
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

  private emitInline(tag: string, attrs: Record<string, string>, content: string) {
    const attrStr = Object.entries(attrs)
      .map(([k, v]) => ` ${k}="${escapeXml(v)}"`)
      .join("");
    this.emit(`<${tag}${attrStr}>${content}</${tag}>`);
  }

  generate(changes: Change[]): string {
    const substitutions = changes.filter(c => c.type === "substitution").length;
    const insertions = changes.filter(c => c.type === "insertion").length;
    const repeals = changes.filter(c => c.type === "repeal").length;
    const today = new Date().toISOString().slice(0, 10);

    this.lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
    this.open("akomaNtoso", { xmlns: AKN_NS });
    this.open("doc", { name: "changeSet" });

    // ── meta
    this.open("meta");
    this.open("identification", { source: "#akn-diff-poc" });

    this.open("FRBRWork");
    this.selfClose("FRBRthis", {
      value: `${this.baseUri}/changeset/${today.slice(0, 4)}`,
    });
    this.selfClose("FRBRuri", {
      value: `${this.baseUri}/changeset/${today.slice(0, 4)}`,
    });
    this.selfClose("FRBRdate", { date: today, name: "generation" });
    this.selfClose("FRBRauthor", { href: "#akn-diff-poc" });
    this.selfClose("FRBRcountry", { value: "eu" });
    this.close("FRBRWork");

    this.open("FRBRExpression");
    this.selfClose("FRBRthis", {
      value: `${this.baseUri}/changeset/${today.slice(0, 4)}/en`,
    });
    this.selfClose("FRBRuri", {
      value: `${this.baseUri}/changeset/${today.slice(0, 4)}/en`,
    });
    this.selfClose("FRBRdate", { date: today, name: "generation" });
    this.selfClose("FRBRauthor", { href: "#akn-diff-poc" });
    this.selfClose("FRBRlanguage", { language: "en" });
    this.close("FRBRExpression");

    this.open("FRBRManifestation");
    this.selfClose("FRBRthis", {
      value: `${this.baseUri}/changeset/${today.slice(0, 4)}/en/xml`,
    });
    this.selfClose("FRBRuri", {
      value: `${this.baseUri}/changeset/${today.slice(0, 4)}/en/xml`,
    });
    this.selfClose("FRBRdate", { date: today, name: "generation" });
    this.selfClose("FRBRauthor", { href: "#akn-diff-poc" });
    this.close("FRBRManifestation");

    this.close("identification");

    // references
    this.open("references", { source: "#akn-diff-poc" });
    this.selfClose("TLCReference", {
      eId: "base",
      href: this.baseUri,
      showAs: "Original version",
    });
    this.selfClose("TLCReference", {
      eId: "result",
      href: this.resultUri,
      showAs: "Consolidated version",
    });
    this.close("references");

    this.close("meta");

    // ── mainBody
    this.open("mainBody");

    // Summary section
    this.open("section", { eId: "summary" });
    this.emitInline("heading", {}, "Change Summary");
    this.open("content");
    this.emitInline("p", {},
      `Articles modified: ${substitutions} | Added: ${insertions} | Removed: ${repeals}`);
    this.close("content");
    this.close("section");

    // Individual change sections
    for (const change of changes) {
      const sectionEId = `change_${change.key}`;
      this.open("section", { eId: sectionEId });
      this.emitInline("heading", {},
        `${escapeXml(change.articleNum)} &#x2014; ${change.type}`);

      this.open("content");

      if (change.type === "substitution") {
        this.open("block", { name: "old" });
        this.emitInline("p", {}, escapeXml(change.oldText));
        this.close("block");
        this.open("block", { name: "new" });
        this.emitInline("p", {}, escapeXml(change.newText));
        this.close("block");
      } else if (change.type === "insertion") {
        this.open("block", { name: "new" });
        this.emitInline("p", {}, escapeXml(change.newText));
        this.close("block");
      } else if (change.type === "repeal") {
        this.open("block", { name: "old" });
        this.emitInline("p", {}, escapeXml(change.oldText));
        this.close("block");
      }

      this.close("content");
      this.close("section");
    }

    this.close("mainBody");
    this.close("doc");
    this.close("akomaNtoso");

    return this.lines.join("\n");
  }
}

// ─── Human-Readable Output ──────────────────────────────────────────────────────

function printSummary(
  originalArticles: Article[],
  consolidatedArticles: Article[],
  changes: Change[],
) {
  const sep = "=".repeat(80);
  const thin = "-".repeat(80);

  console.log(`\n${sep}`);
  console.log(`  AKN DIFF — Legislative Act Comparison`);
  console.log(sep);

  console.log(`\n  Original version:     ${originalArticles.length} articles`);
  console.log(`  Consolidated version: ${consolidatedArticles.length} articles`);
  console.log(`\n  Changes detected: ${changes.length}`);
  const subs = changes.filter(c => c.type === "substitution").length;
  const ins = changes.filter(c => c.type === "insertion").length;
  const rep = changes.filter(c => c.type === "repeal").length;
  console.log(`    - Substitutions (modified): ${subs}`);
  console.log(`    - Insertions (new):         ${ins}`);
  console.log(`    - Repeals (removed):        ${rep}`);

  for (const change of changes) {
    console.log(`\n${thin}`);
    console.log(`  ${change.articleNum} — ${change.type.toUpperCase()}`);
    if (change.heading) console.log(`  Heading: ${change.heading}`);
    console.log(thin);

    if (change.type === "substitution") {
      // Show heading change if applicable
      if (change.oldHeading !== change.newHeading) {
        console.log(`\n  Heading changed:`);
        console.log(`    OLD: ${change.oldHeading}`);
        console.log(`    NEW: ${change.newHeading}`);
      }

      // Show text diff
      const diff = diffLines(change.oldText, change.newText);
      console.log(`\n  Text diff:`);
      for (const line of diff) {
        if (line.type === "same") {
          console.log(`    ${line.text}`);
        } else if (line.type === "removed") {
          console.log(`  - ${line.text}`);
        } else {
          console.log(`  + ${line.text}`);
        }
      }
    } else if (change.type === "insertion") {
      console.log(`\n  New text:`);
      console.log(`  + ${change.newText}`);
    } else if (change.type === "repeal") {
      console.log(`\n  Removed text:`);
      console.log(`  - ${change.oldText}`);
    }
  }

  console.log(`\n${sep}\n`);
}

// ─── Extract URIs from AKN metadata ─────────────────────────────────────────────

function extractFRBRuri(root: XmlNode): string {
  // Navigate: akomaNtoso > act > meta > identification > FRBRWork > FRBRuri
  function findDeep(node: XmlNode, tag: string): XmlNode | undefined {
    if (node.type === "element" && node.tag === tag) return node;
    for (const child of (node.children ?? [])) {
      const found = findDeep(child, tag);
      if (found) return found;
    }
    return undefined;
  }

  const frbrUri = findDeep(root, "FRBRuri");
  return frbrUri?.attrs?.["value"] ?? "";
}

// ─── Main ───────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error(
      "Usage: node --experimental-strip-types poc-akn-diff.ts <original.xml> <consolidated.xml>"
    );
    process.exit(1);
  }

  const originalPath = args[0];
  const consolidatedPath = args[1];

  // Parse both files
  console.log(`Reading original:     ${basename(originalPath)}`);
  const originalXml = readFileSync(originalPath, "utf-8");
  const originalRoot = parseXml(originalXml);

  console.log(`Reading consolidated: ${basename(consolidatedPath)}`);
  const consolidatedXml = readFileSync(consolidatedPath, "utf-8");
  const consolidatedRoot = parseXml(consolidatedXml);

  // Extract URIs for the changeSet references
  const baseUri = extractFRBRuri(originalRoot) || "http://data.europa.eu/eli/reg/2018/1645/oj";
  const resultUri = extractFRBRuri(consolidatedRoot) || "http://data.europa.eu/eli/reg/2018/1645/2024-01-01";

  // Extract articles from both
  const originalArticles = extractArticles(originalRoot);
  const consolidatedArticles = extractArticles(consolidatedRoot);

  console.log(`Original articles:     ${originalArticles.length}`);
  console.log(`Consolidated articles: ${consolidatedArticles.length}`);

  // ── Semantic article matching ──
  // Instead of matching by article number (which breaks when articles are
  // inserted/renumbered), match by heading similarity, then content similarity.

  /** Normalize heading for comparison */
  function normalizeHeading(h: string): string {
    return h.replace(/^Article\s+\S+\s*/i, "").toLowerCase().replace(/['']/g, "'").trim();
  }

  /** Word overlap score between two strings (Jaccard-like) */
  function wordOverlap(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 2));
    const wordsB = new Set(b.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 2));
    if (wordsA.size === 0 || wordsB.size === 0) return 0;
    let intersection = 0;
    for (const w of wordsA) if (wordsB.has(w)) intersection++;
    return intersection / Math.min(wordsA.size, wordsB.size);
  }

  // Build the semantic mapping: for each original article, find its best match in consolidated
  const matchedOrig = new Set<number>();   // indices into originalArticles
  const matchedCons = new Set<number>();   // indices into consolidatedArticles
  const pairs: Array<{ origIdx: number; consIdx: number }> = [];

  // Pass 1: Exact heading match
  for (let oi = 0; oi < originalArticles.length; oi++) {
    if (matchedOrig.has(oi)) continue;
    const origH = normalizeHeading(originalArticles[oi].heading);
    if (!origH) continue;
    for (let ci = 0; ci < consolidatedArticles.length; ci++) {
      if (matchedCons.has(ci)) continue;
      const consH = normalizeHeading(consolidatedArticles[ci].heading);
      if (origH === consH) {
        pairs.push({ origIdx: oi, consIdx: ci });
        matchedOrig.add(oi);
        matchedCons.add(ci);
        break;
      }
    }
  }

  // Pass 2: Partial heading match (one contains the other, or high word overlap)
  for (let oi = 0; oi < originalArticles.length; oi++) {
    if (matchedOrig.has(oi)) continue;
    const origH = normalizeHeading(originalArticles[oi].heading);
    if (!origH) continue;
    let bestCi = -1;
    let bestScore = 0;
    for (let ci = 0; ci < consolidatedArticles.length; ci++) {
      if (matchedCons.has(ci)) continue;
      const consH = normalizeHeading(consolidatedArticles[ci].heading);
      if (!consH) continue;
      // Check containment
      const score = (origH.includes(consH) || consH.includes(origH))
        ? 0.9
        : wordOverlap(origH, consH);
      if (score > bestScore && score >= 0.5) {
        bestScore = score;
        bestCi = ci;
      }
    }
    if (bestCi >= 0) {
      pairs.push({ origIdx: oi, consIdx: bestCi });
      matchedOrig.add(oi);
      matchedCons.add(bestCi);
    }
  }

  // Pass 3: For remaining unmatched, try content similarity (first 200 words)
  for (let oi = 0; oi < originalArticles.length; oi++) {
    if (matchedOrig.has(oi)) continue;
    const origText = originalArticles[oi].textContent;
    let bestCi = -1;
    let bestScore = 0;
    for (let ci = 0; ci < consolidatedArticles.length; ci++) {
      if (matchedCons.has(ci)) continue;
      const consText = consolidatedArticles[ci].textContent;
      const score = wordOverlap(
        origText.split(/\s+/).slice(0, 200).join(" "),
        consText.split(/\s+/).slice(0, 200).join(" "),
      );
      if (score > bestScore && score >= 0.4) {
        bestScore = score;
        bestCi = ci;
      }
    }
    if (bestCi >= 0) {
      pairs.push({ origIdx: oi, consIdx: bestCi });
      matchedOrig.add(oi);
      matchedCons.add(bestCi);
    }
  }

  console.log(`  Matched pairs: ${pairs.length} (of ${originalArticles.length} original, ${consolidatedArticles.length} consolidated)`);

  // Build changes from the matching
  const changes: Change[] = [];

  // Sort pairs by consolidated index to maintain output order
  pairs.sort((a, b) => a.consIdx - b.consIdx);

  // Emit all consolidated articles in order, categorized as substitution, insertion, or unchanged
  for (let ci = 0; ci < consolidatedArticles.length; ci++) {
    const cons = consolidatedArticles[ci];
    const consKey = articleKey(cons.num);
    const pair = pairs.find(p => p.consIdx === ci);

    if (pair) {
      const orig = originalArticles[pair.origIdx];
      if (orig.textContent !== cons.textContent || normalizeHeading(orig.heading) !== normalizeHeading(cons.heading)) {
        changes.push({
          type: "substitution",
          key: consKey,
          articleNum: cons.num,
          heading: cons.heading,
          oldText: orig.textContent,
          newText: cons.textContent,
          oldHeading: orig.heading,
          newHeading: cons.heading,
        });
      }
      // else: identical content, no change needed
    } else {
      // No match in original — insertion
      changes.push({
        type: "insertion",
        key: consKey,
        articleNum: cons.num,
        heading: cons.heading,
        oldText: "",
        newText: cons.textContent,
        oldHeading: "",
        newHeading: cons.heading,
      });
    }
  }

  // Check for repealed articles (in original but not matched to any consolidated)
  for (let oi = 0; oi < originalArticles.length; oi++) {
    if (matchedOrig.has(oi)) continue;
    const orig = originalArticles[oi];
    changes.push({
      type: "repeal",
      key: articleKey(orig.num),
      articleNum: orig.num,
      heading: orig.heading,
      oldText: orig.textContent,
      newText: "",
      oldHeading: orig.heading,
      newHeading: "",
    });
  }

  // Print human-readable summary
  printSummary(originalArticles, consolidatedArticles, changes);

  // Generate changeSet XML
  const generator = new ChangeSetGenerator(baseUri, resultUri);
  const changeSetXml = generator.generate(changes);

  // Write output
  const outputDir = dirname(consolidatedPath);
  const outputName = args[2] || "changeset.xml";
  const outputPath = join(outputDir, outputName);
  writeFileSync(outputPath, changeSetXml, "utf-8");
  console.log(`ChangeSet written: ${outputPath} (${changeSetXml.length} bytes)`);

  // Preview first 40 lines of the changeSet
  const previewLines = changeSetXml.split("\n").slice(0, 40);
  console.log("\n--- ChangeSet Preview (first 40 lines) ---");
  console.log(previewLines.join("\n"));
  console.log("--- ... ---\n");
}

main();
