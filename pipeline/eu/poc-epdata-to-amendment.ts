/**
 * PoC: EP Open Data -> Akoma Ntoso (amendments)
 *
 * Downloads real amendment metadata from the European Parliament Open Data API
 * and converts it to AKN 3.0 <amendment> XML documents.
 *
 * The EP Open Data API provides AMENDMENT_LIST documents (groups of amendments
 * filed together) with metadata: author, target document, amendment number range,
 * date, and multilingual titles. Full amendment text is NOT available via this
 * API -- only PDFs/DOCX through FRBR manifestation links.
 *
 * Usage:
 *   node --experimental-strip-types poc-epdata-to-amendment.ts
 *
 * Zero npm dependencies -- uses only Node.js built-in modules.
 */

import https from "node:https";
import tls from "node:tls";
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";

// --- Config ------------------------------------------------------------------

const AMENDMENT_LIST_URL =
  "https://data.europarl.europa.eu/api/v2/documents?work-type=AMENDMENT_LIST&format=application%2Fld%2Bjson&offset=0&limit=50";

const OUTPUT_DIR = "samples/amendment";
const MAX_AMENDMENTS = 5;

// --- TLS fix for EP certificate ----------------------------------------------

const EP_HOST = "data.europarl.europa.eu";
function epCheckServerIdentity(hostname: string, cert: tls.PeerCertificate): Error | undefined {
  if (hostname === EP_HOST) {
    const altNames = (cert.subjectaltname || "").split(", ");
    if (altNames.some(n => n === `DNS:*.${EP_HOST}`)) return undefined;
  }
  return tls.checkServerIdentity(hostname, cert);
}

// --- HTTP helper -------------------------------------------------------------

function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const doRequest = (targetUrl: string, redirects = 0) => {
      if (redirects > 5) return reject(new Error("Too many redirects"));
      https.get(
        targetUrl,
        {
          headers: {
            Accept: "application/ld+json",
            "User-Agent": "Mozilla/5.0 poc-epdata-to-akn",
          },
          checkServerIdentity: epCheckServerIdentity,
        },
        (res) => {
          if (
            res.statusCode &&
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location
          ) {
            return doRequest(res.headers.location, redirects + 1);
          }
          if (res.statusCode !== 200) {
            return reject(new Error(`HTTP ${res.statusCode} for ${targetUrl}`));
          }
          let body = "";
          res.on("data", (chunk: Buffer) => (body += chunk.toString()));
          res.on("end", () => {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(new Error(`JSON parse error: ${(e as Error).message}`));
            }
          });
          res.on("error", reject);
        }
      ).on("error", reject);
    };
    doRequest(url);
  });
}

// --- XML helpers -------------------------------------------------------------

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

class XmlBuilder {
  private lines: string[] = [];
  private depth = 0;

  emit(line: string) {
    this.lines.push("  ".repeat(this.depth) + line);
  }
  open(tag: string, attrs: Record<string, string> = {}) {
    const a = Object.entries(attrs)
      .map(([k, v]) => ` ${k}="${esc(v)}"`)
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
      .map(([k, v]) => ` ${k}="${esc(v)}"`)
      .join("");
    this.emit(`<${tag}${a}/>`);
  }
  inline(tag: string, attrs: Record<string, string>, content: string) {
    const a = Object.entries(attrs)
      .map(([k, v]) => ` ${k}="${esc(v)}"`)
      .join("");
    this.emit(`<${tag}${a}>${content}</${tag}>`);
  }
  comment(text: string) {
    this.emit(`<!-- ${text} -->`);
  }
  toString() {
    return this.lines.join("\n");
  }
}

// --- Parse structured data from EP title -------------------------------------

interface ParsedTitle {
  amendmentNumber: string;
  author: string;
  group: string;
  reportRef: string;
  rapporteur: string;
  subject: string;
  procedureRef: string;
}

/**
 * Parse EP amendment EN title which follows patterns like:
 * "Amendment 001-035 - Li Andersson - Report A10-0004/2024 - Guidelines for..."
 * "A10-0009/2 - Amendment 2 - Markus Buchheit - on behalf of ESN Group - Report A10-0009/2025 - ..."
 */
function parseEnTitle(title: string): ParsedTitle {
  const result: ParsedTitle = {
    amendmentNumber: "",
    author: "",
    group: "",
    reportRef: "",
    rapporteur: "",
    subject: "",
    procedureRef: "",
  };

  // Extract procedure reference like (2024/0148(COD))
  const procMatch = title.match(/\((\d{4}\/\d+\([A-Z]+\))\)/);
  if (procMatch) result.procedureRef = procMatch[1];

  // Extract amendment number: "Amendment 001-035" or "Amendment 2"
  const amMatch = title.match(/Amendment\s+([\d-]+)/i);
  if (amMatch) result.amendmentNumber = amMatch[1];

  // Split by " - " to parse segments
  const parts = title.split(" - ").map((s) => s.trim());

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    // Author: first segment after "Amendment N" that is a name (not a report/group keyword)
    if (
      !result.author &&
      !part.match(/^(Amendment|Report|A\d|on behalf|in the name)/i) &&
      i > 0 &&
      parts[i - 1]?.match(/Amendment/i)
    ) {
      result.author = part;
      continue;
    }

    // Also catch author right after the A10-XXXX/N prefix
    if (
      !result.author &&
      !part.match(/^(Amendment|Report|A\d|on behalf|in the name)/i) &&
      i === 1 &&
      parts[0]?.match(/^A\d/)
    ) {
      // This is the "A10-0009/2 - Amendment 2 - Author" pattern
      // Skip, author comes after "Amendment N"
    }

    // Group: "on behalf of..." or "in the name of..."
    if (part.match(/^(on behalf|in the name|for the|f'isem|im Namen|au nom|en nombre)/i)) {
      result.group = part;
      continue;
    }

    // Report reference: "Report A10-0009/2025"
    const reportMatch = part.match(/Report\s+(A\d+-\d+\/\d+)/i);
    if (reportMatch) {
      result.reportRef = reportMatch[1];
      // Next segment after report may contain rapporteur(s)
      continue;
    }

    // If we already have report ref and this isn't the subject, it might be rapporteur
    if (
      result.reportRef &&
      !result.rapporteur &&
      !part.match(/^(Amendment|\(|COM|http)/i) &&
      part.length < 100
    ) {
      result.rapporteur = part;
      continue;
    }

    // Long remaining text is likely the subject
    if (result.reportRef && part.length > 30 && !result.subject) {
      result.subject = part.replace(/\s*\(COM.*$/, "").replace(/\s*\(\d{4}\/.*$/, "");
      continue;
    }
  }

  // Fallback: if author still not found, try second part after amendment number
  if (!result.author) {
    for (let i = 0; i < parts.length; i++) {
      if (
        parts[i].match(/Amendment/i) &&
        i + 1 < parts.length &&
        !parts[i + 1].match(/^(Report|on behalf|A\d)/i)
      ) {
        result.author = parts[i + 1];
        break;
      }
    }
  }

  return result;
}

// --- Build a single AKN <amendment> document ---------------------------------

/**
 * Extract the best available EN title from the detail object.
 * Tries: title_dcterms.en -> expressions title.en -> title_alternative.en
 */
function getEnTitle(detail: any): string {
  if (detail.title_dcterms?.en) return detail.title_dcterms.en;

  const expressions: any[] = detail.is_realized_by ?? [];
  const enExpr = expressions.find(
    (e: any) => e.language?.includes("ENG") || e.id?.endsWith("/en")
  );
  if (enExpr?.title?.en) return enExpr.title.en;
  if (enExpr?.title_alternative?.en) return enExpr.title_alternative.en;

  // Try any expression with an EN title
  for (const expr of expressions) {
    if (expr.title?.en) return expr.title.en;
    if (expr.title_alternative?.en) return expr.title_alternative.en;
  }

  return "";
}

function buildAmendmentXml(doc: any, detail: any): string {
  const AKN_NS = "http://docs.oasis-open.org/legaldocml/ns/akn/3.0";
  const BASE = "https://data.europarl.europa.eu";

  const identifier: string = detail.identifier ?? doc.identifier;
  const date: string = detail.document_date ?? "";
  const targetDoc: string = detail.foresees_change_of ?? "";
  const term: string = detail.parliamentary_term ?? "";
  const numBegin: number = detail.itemNumberBegin ?? 0;
  const numEnd: number = detail.itemNumberEnd ?? 0;
  const numberStr: string = detail.number ?? `${numBegin}-${numEnd}`;

  // Get English title and parse it
  const enTitle: string = getEnTitle(detail);
  const parsed = parseEnTitle(enTitle);

  // Find English expression for PDF link
  const expressions: any[] = detail.is_realized_by ?? [];
  const enExpr = expressions.find((e: any) =>
    e.language?.includes("ENG")
  );
  const enPdfManif = enExpr?.is_embodied_by?.find((m: any) =>
    m.media_type?.includes("pdf")
  );
  const pdfUrl = enPdfManif?.is_exemplified_by
    ? `${BASE}/${enPdfManif.is_exemplified_by}`
    : "";

  // ELI URIs
  const workUri = `${BASE}/${detail.id}`;
  const exprUri = enExpr ? `${BASE}/${enExpr.id}` : `${workUri}/en`;
  const manifUri = enPdfManif ? `${BASE}/${enPdfManif.id}` : `${workUri}/en/xml`;

  const today = new Date().toISOString().slice(0, 10);

  const x = new XmlBuilder();
  x.emit(`<?xml version="1.0" encoding="UTF-8"?>`);
  x.open("akomaNtoso", { xmlns: AKN_NS });
  x.open("amendment", { contains: "originalVersion" });

  // --- meta ---
  x.open("meta");
  x.open("identification", { source: "#ep-opendata" });

  x.open("FRBRWork");
  x.selfClose("FRBRthis", { value: workUri });
  x.selfClose("FRBRuri", { value: workUri });
  x.selfClose("FRBRdate", { date, name: "tabling" });
  x.selfClose("FRBRauthor", { href: "#ep" });
  x.selfClose("FRBRcountry", { value: "eu" });
  x.close("FRBRWork");

  x.open("FRBRExpression");
  x.selfClose("FRBRthis", { value: exprUri });
  x.selfClose("FRBRuri", { value: exprUri });
  x.selfClose("FRBRdate", { date, name: "tabling" });
  x.selfClose("FRBRauthor", { href: "#ep" });
  x.selfClose("FRBRlanguage", { language: "eng" });
  x.close("FRBRExpression");

  x.open("FRBRManifestation");
  x.selfClose("FRBRthis", { value: manifUri });
  x.selfClose("FRBRuri", { value: manifUri });
  x.selfClose("FRBRdate", { date: today, name: "transformation" });
  x.selfClose("FRBRauthor", { href: "#poc-epdata-to-amendment" });
  x.close("FRBRManifestation");

  x.close("identification");

  // --- references ---
  x.open("references", { source: "#ep-opendata" });
  x.selfClose("TLCOrganization", {
    eId: "ep-opendata",
    href: "https://data.europarl.europa.eu",
    showAs: "European Parliament Open Data Portal",
  });
  x.selfClose("TLCOrganization", {
    eId: "ep",
    href: `${BASE}/org/EU_PARLIAMENT`,
    showAs: "European Parliament",
  });
  if (parsed.author) {
    x.selfClose("TLCPerson", {
      eId: "author",
      href: `${BASE}/${detail.id}`,
      showAs: parsed.author,
    });
  }
  if (targetDoc) {
    x.selfClose("TLCReference", {
      eId: "targetDocument",
      href: `${BASE}/${targetDoc}`,
      showAs: targetDoc.split("/").pop() ?? targetDoc,
    });
  }
  x.close("references");

  // --- lifecycle ---
  x.open("lifecycle", { source: "#ep-opendata" });
  x.selfClose("eventRef", {
    eId: "evt_tabling",
    date,
    type: "generation",
    source: "#ep",
    refersTo: "#tabling",
  });
  x.close("lifecycle");

  x.close("meta");

  // --- preface ---
  x.open("preface", { eId: "preface" });

  x.open("container", { name: "amendmentType", eId: "preface__ctnr_1" });
  x.inline("p", {}, `<docType>Amendment</docType>`);
  x.close("container");

  x.open("container", { name: "amendmentNumber", eId: "preface__ctnr_2" });
  x.inline("p", {}, `<docNumber>${esc(numberStr)}</docNumber>`);
  x.close("container");

  if (parsed.author) {
    x.open("container", { name: "author", eId: "preface__ctnr_3" });
    x.inline(
      "p",
      {},
      `<docProponent refersTo="#author">${esc(parsed.author)}</docProponent>`
    );
    if (parsed.group) {
      x.inline("p", {}, esc(parsed.group));
    }
    x.close("container");
  }

  x.open("container", { name: "target", eId: "preface__ctnr_4" });
  const targetLabel = targetDoc.split("/").pop() ?? targetDoc;
  x.inline(
    "p",
    {},
    `Amendment ${esc(numberStr)} to <ref href="${esc(
      `${BASE}/${targetDoc}`
    )}">${esc(targetLabel)}</ref>`
  );
  x.close("container");

  if (parsed.subject) {
    x.open("container", { name: "subject", eId: "preface__ctnr_5" });
    x.inline("p", {}, esc(parsed.subject));
    x.close("container");
  }

  if (parsed.procedureRef) {
    x.open("container", { name: "procedure", eId: "preface__ctnr_6" });
    x.inline("p", {}, `Procedure: ${esc(parsed.procedureRef)}`);
    x.close("container");
  }

  x.close("preface");

  // --- amendmentBody ---
  x.open("amendmentBody");

  x.open("amendmentHeading", { eId: "amdHeading" });
  x.inline("p", {}, `Amendment ${esc(numberStr)}`);
  x.close("amendmentHeading");

  x.open("amendmentContent", { eId: "amdContent" });

  x.open("mod", { eId: "amdContent__mod_1" });
  x.comment(
    "The EP Open Data API provides amendment metadata (author, target, number range) " +
      "but NOT the actual amendment text. The full text is available only as PDF/DOCX " +
      "through the FRBR manifestation links below."
  );
  x.comment(
    `Amendment range: ${numBegin} to ${numEnd} (${numEnd - numBegin + 1} amendment(s))`
  );

  if (pdfUrl) {
    x.open("remark", { type: "editorial" });
    x.inline(
      "p",
      {},
      `Full amendment text available at: <ref href="${esc(pdfUrl)}">${esc(
        identifier
      )} (PDF)</ref>`
    );
    x.close("remark");
  }

  x.open("quotedStructure", { eId: "amdContent__mod_1__qstr_1" });
  x.comment("Amendment text not available via the API; see PDF link above.");
  x.inline(
    "p",
    {},
    `[Text of amendment${numBegin !== numEnd ? "s" : ""} ${numBegin}${
      numBegin !== numEnd ? `-${numEnd}` : ""
    } -- see PDF]`
  );
  x.close("quotedStructure");

  x.close("mod");

  x.close("amendmentContent");

  x.close("amendmentBody");

  x.close("amendment");
  x.close("akomaNtoso");

  return x.toString();
}

// --- Main --------------------------------------------------------------------

async function main() {
  console.log("=== EP Open Data -> AKN Amendment PoC ===\n");

  // Step 1: Fetch list of AMENDMENT_LIST documents
  console.log("Fetching amendment list documents...");
  const listJson = await fetchJson(AMENDMENT_LIST_URL);
  const docs: any[] = listJson.data ?? [];

  if (docs.length === 0) {
    console.error("No amendment list documents found.");
    process.exit(1);
  }

  console.log(`  Found ${docs.length} amendment list documents.`);

  // Pick most recent ones (prefer 2025+ identifiers, fall back to 2024)
  const docs2025 = docs.filter((d: any) => d.identifier?.includes("2025"));
  const docs2024 = docs.filter((d: any) => d.identifier?.includes("2024"));
  const recentDocs = [...docs2025, ...docs2024].slice(0, MAX_AMENDMENTS);

  const docsToProcess = recentDocs.length > 0 ? recentDocs : docs.slice(0, MAX_AMENDMENTS);
  console.log(`  Processing ${docsToProcess.length} amendment lists.\n`);

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const written: string[] = [];

  for (const doc of docsToProcess) {
    const shortId: string = doc.identifier;
    console.log(`--- Fetching detail for ${shortId} ---`);

    try {
      const detailUrl = `https://data.europarl.europa.eu/api/v2/documents/${shortId}?format=application%2Fld%2Bjson`;
      const detailJson = await fetchJson(detailUrl);
      const detail = detailJson.data?.[0];

      if (!detail) {
        console.log(`  No detail data for ${shortId}, skipping.`);
        continue;
      }

      const enTitle = getEnTitle(detail) || "(no EN title)";
      console.log(`  Title: ${enTitle}`);
      console.log(`  Date: ${detail.document_date ?? "?"}`);
      console.log(`  Target: ${detail.foresees_change_of ?? "?"}`);
      console.log(`  Range: AM ${detail.itemNumberBegin ?? "?"}-${detail.itemNumberEnd ?? "?"}`);

      // Parse title for additional metadata
      const parsed = parseEnTitle(enTitle);
      if (parsed.author) console.log(`  Author: ${parsed.author}`);
      if (parsed.group) console.log(`  Group: ${parsed.group}`);
      if (parsed.procedureRef) console.log(`  Procedure: ${parsed.procedureRef}`);

      // Build AKN XML
      const xml = buildAmendmentXml(doc, detail);

      // Write file -- use sanitized identifier as filename
      const safeId = shortId.replace(/\//g, "-");
      const outPath = `${OUTPUT_DIR}/eu-amendment-${safeId}.xml`;
      writeFileSync(outPath, xml, "utf-8");
      written.push(outPath);
      console.log(`  Written: ${outPath} (${xml.length} bytes)\n`);
    } catch (err) {
      console.error(`  Error processing ${shortId}: ${(err as Error).message}\n`);
    }
  }

  // Summary
  console.log("=== Summary ===");
  console.log(`  Total files written: ${written.length}`);
  for (const f of written) {
    console.log(`  - ${f}`);
  }

  // Preview first file
  if (written.length > 0) {
    const firstXml = readFileSync(written[0], "utf-8");
    const preview = firstXml.split("\n").slice(0, 50);
    console.log(`\n--- Preview of ${written[0]} (first 50 lines) ---`);
    console.log(preview.join("\n"));
    console.log("--- ... ---");
  }

  console.log("\nNote: The EP Open Data API provides amendment *metadata* only.");
  console.log("Full amendment text (additions/deletions) is available as PDF/DOCX");
  console.log("through the FRBR manifestation links included in each AKN document.");
}

main().then(() => process.exit(0)).catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
