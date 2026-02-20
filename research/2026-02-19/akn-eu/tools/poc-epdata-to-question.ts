/**
 * PoC: EP Open Data → Akoma Ntoso (question)
 *
 * Downloads a real parliamentary question from the European Parliament Open Data API
 * and converts it to a valid AKN 3.0 XML document with <doc name="question"> structure.
 *
 * Usage:
 *   node --experimental-strip-types poc-epdata-to-question.ts
 *
 * Zero npm dependencies — uses only Node.js built-in modules.
 */

import https from "node:https";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

// ─── Config ──────────────────────────────────────────────────────────────────

const QUESTION_ID = process.argv[2] || "E-10-2026-000002";
const QUESTION_URL = `https://data.europarl.europa.eu/api/v2/parliamentary-questions/${QUESTION_ID}?format=application%2Fld%2Bjson`;
const OUTPUT_PATH = `samples/question/eu-question-${QUESTION_ID}.xml`;

// ─── HTTP helper ─────────────────────────────────────────────────────────────

function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const doRequest = (targetUrl: string, redirects = 0) => {
      if (redirects > 5) return reject(new Error("Too many redirects"));
      https.get(targetUrl, { headers: { Accept: "application/ld+json", "User-Agent": "Mozilla/5.0 poc-epdata-to-akn" } }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
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
      }).on("error", reject);
    };
    doRequest(url);
  });
}

// ─── XML helpers ─────────────────────────────────────────────────────────────

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
  toString() {
    return this.lines.join("\n");
  }
}

// ─── Fetch MEP name ──────────────────────────────────────────────────────────

async function fetchMepName(personRef: string): Promise<{ label: string; givenName: string; familyName: string; id: string }> {
  // personRef looks like "person/256941"
  const personId = personRef.replace("person/", "");
  const url = `https://data.europarl.europa.eu/api/v2/meps/${personId}?format=application%2Fld%2Bjson`;
  try {
    const json = await fetchJson(url);
    const mep = json.data?.[0] ?? json.data ?? json;
    return {
      label: mep.label ?? `MEP ${personId}`,
      givenName: mep.givenName ?? "",
      familyName: mep.familyName ?? "",
      id: personId,
    };
  } catch {
    return { label: `MEP ${personId}`, givenName: "", familyName: "", id: personId };
  }
}

// ─── Main converter ──────────────────────────────────────────────────────────

async function main() {
  console.log(`Fetching question ${QUESTION_ID}...`);
  const json = await fetchJson(QUESTION_URL);
  const work = json.data?.[0] ?? json.data;

  // Extract basic fields
  const identifier: string = work.identifier ?? QUESTION_ID;
  const docDate: string = work.document_date ?? "";
  const workType: string = work.work_type ?? "";

  // Get English expression for title
  const expressions: any[] = work.is_realized_by ?? [];
  const enExpr = expressions.find((e: any) => e.language?.includes("ENG")) ?? expressions[0];
  const titleEn: string = enExpr?.title?.en ?? work.title_dcterms?.en ?? identifier;
  const titleAltEn: string = enExpr?.title_alternative?.en ?? "";

  // Get author from participation
  const participations: any[] = work.workHadParticipation ?? [];
  const authorPart = participations.find((p: any) => p.participation_role?.includes("AUTHOR"));
  const addresseePart = participations.find((p: any) => p.participation_role?.includes("ADDRESSEE"));

  const authorRefs: string[] = authorPart?.had_participant_person ?? [];
  const addresseeRefs: string[] = addresseePart?.had_participant_organization ?? [];

  // Fetch MEP name
  let authorName = "Unknown MEP";
  let authorId = "unknown";
  if (authorRefs.length > 0) {
    const mep = await fetchMepName(authorRefs[0]);
    authorName = mep.label;
    authorId = mep.id;
    console.log(`  Author: ${authorName}`);
  }

  // Addressee
  const addresseeOrg = addresseeRefs[0] ?? "org/COM";
  const addresseeName = addresseeOrg.includes("COM") ? "European Commission" : addresseeOrg;

  console.log(`  Title: ${titleEn}`);
  console.log(`  Date: ${docDate}`);

  // Build AKN
  const AKN_NS = "http://docs.oasis-open.org/legaldocml/ns/akn/3.0";
  const eli = `https://data.europarl.europa.eu/${work.id ?? `eli/dl/doc/${identifier}`}`;
  const x = new XmlBuilder();

  x.emit(`<?xml version="1.0" encoding="UTF-8"?>`);
  x.open("akomaNtoso", { xmlns: AKN_NS });
  x.open("doc", { name: "question" });

  // ── meta
  x.open("meta");
  x.open("identification", { source: "#ep-opendata" });

  x.open("FRBRWork");
  x.selfClose("FRBRthis", { value: eli });
  x.selfClose("FRBRuri", { value: eli });
  x.selfClose("FRBRdate", { date: docDate, name: "tabling" });
  x.selfClose("FRBRauthor", { href: `#mep-${authorId}` });
  x.selfClose("FRBRcountry", { value: "eu" });
  x.selfClose("FRBRnumber", { value: identifier });
  x.close("FRBRWork");

  x.open("FRBRExpression");
  x.selfClose("FRBRthis", { value: `${eli}/en` });
  x.selfClose("FRBRuri", { value: `${eli}/en` });
  x.selfClose("FRBRdate", { date: docDate, name: "tabling" });
  x.selfClose("FRBRauthor", { href: `#mep-${authorId}` });
  x.selfClose("FRBRlanguage", { language: "en" });
  x.close("FRBRExpression");

  x.open("FRBRManifestation");
  x.selfClose("FRBRthis", { value: `${eli}/en/xml` });
  x.selfClose("FRBRuri", { value: `${eli}/en/xml` });
  x.selfClose("FRBRdate", { date: new Date().toISOString().slice(0, 10), name: "transformation" });
  x.selfClose("FRBRauthor", { href: "#poc-epdata-to-question" });
  x.close("FRBRManifestation");

  x.close("identification");

  // references
  x.open("references", { source: "#ep-opendata" });
  x.selfClose("TLCOrganization", {
    eId: "ep-opendata",
    href: "https://data.europarl.europa.eu",
    showAs: "European Parliament Open Data Portal",
  });
  x.selfClose("TLCPerson", {
    eId: `mep-${authorId}`,
    href: `https://data.europarl.europa.eu/person/${authorId}`,
    showAs: authorName,
  });
  x.selfClose("TLCOrganization", {
    eId: "addressee",
    href: `https://data.europarl.europa.eu/${addresseeOrg}`,
    showAs: addresseeName,
  });
  x.selfClose("TLCOrganization", {
    eId: "ep",
    href: "https://data.europarl.europa.eu/org/EU_PARLIAMENT",
    showAs: "European Parliament",
  });
  x.close("references");

  x.close("meta");

  // ── preface
  x.open("preface", { eId: "preface" });
  x.open("longTitle", { eId: "longTitle" });
  x.inline("p", {}, `<docType>Question for written answer</docType> ${esc(identifier)}`);
  x.inline("p", {}, `to the <organization refersTo="#addressee">${esc(addresseeName)}</organization>`);
  x.inline("p", {}, `<docTitle>${esc(titleEn)}</docTitle>`);
  x.close("longTitle");
  x.open("container", { name: "authors", eId: "preface__container_1" });
  x.inline("p", {}, `<person refersTo="#mep-${esc(authorId)}">${esc(authorName)}</person>`);
  x.close("container");
  x.close("preface");

  // ── mainBody
  x.open("mainBody");

  x.open("section", { eId: "sec_question" });
  x.inline("heading", {}, "Question");
  x.open("content", { eId: "sec_question__content" });
  x.inline("p", {}, esc(titleEn));
  if (titleAltEn) {
    x.inline("p", { class: "reference" }, esc(titleAltEn));
  }
  // Include document type info
  const typeLabel = workType.split("/").pop() ?? workType;
  x.inline("p", { class: "metadata" }, `Type: ${esc(typeLabel)} | Date: ${esc(docDate)} | EP Number: ${esc(work.epNumber ?? "")}`);
  x.close("content");
  x.close("section");

  // Available manifestations
  if (enExpr?.is_embodied_by?.length) {
    x.open("section", { eId: "sec_manifestations" });
    x.inline("heading", {}, "Available Documents");
    x.open("content", { eId: "sec_manifestations__content" });
    for (const manif of enExpr.is_embodied_by) {
      const format = manif.format?.split("/").pop() ?? "unknown";
      const downloadUrl = manif.is_exemplified_by
        ? `https://data.europarl.europa.eu/${manif.is_exemplified_by}`
        : "";
      x.inline("p", {}, `<ref href="${esc(downloadUrl)}">${esc(format)} (${esc(manif.byteSize ?? "?")} bytes)</ref>`);
    }
    x.close("content");
    x.close("section");
  }

  x.close("mainBody");

  x.close("doc");
  x.close("akomaNtoso");

  // Write output
  const outputDir = dirname(OUTPUT_PATH);
  mkdirSync(outputDir, { recursive: true });
  const xml = x.toString();
  writeFileSync(OUTPUT_PATH, xml, "utf-8");
  console.log(`\nWritten: ${OUTPUT_PATH} (${xml.length} bytes)`);

  // Preview
  const preview = xml.split("\n").slice(0, 30);
  console.log("\n--- Preview (first 30 lines) ---");
  console.log(preview.join("\n"));
  console.log("--- ... ---");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
