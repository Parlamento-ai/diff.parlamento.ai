/**
 * PoC: EP Open Data → Akoma Ntoso (communication / legislative procedure lifecycle)
 *
 * Downloads real legislative procedure lifecycle data from the European Parliament
 * Open Data API and converts it to a valid AKN 3.0 XML document with
 * <doc name="communication"> structure.
 *
 * A "communication" in AKN Diff context represents inter-institutional communication:
 * a procedure event where one institution sends a document to another. The EP Open
 * Data has procedure lifecycle data that maps directly to this.
 *
 * Usage:
 *   node --experimental-strip-types poc-epdata-to-communication.ts
 *
 * Zero npm dependencies — uses only Node.js built-in modules.
 */

import https from "node:https";
import tls from "node:tls";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

// ─── Config ──────────────────────────────────────────────────────────────────

const commArgs = process.argv.slice(2);
const commOutputArg = commArgs.find(a => a.startsWith("--output="))?.split("=")[1];
const commTypeArg = commArgs.find(a => a.startsWith("--type="))?.split("=")[1];
const commPositional = commArgs.filter(a => !a.startsWith("--"));
const procYear = commPositional[0] || "2024";
const DIRECT_PROC_ID = commPositional[1]; // Optional: skip search, use this procedure ID directly
const PROCEDURES_URL =
  `https://data.europarl.europa.eu/api/v2/procedures?year=${procYear}&procedure-type=COD&format=application%2Fld%2Bjson&limit=5`;
const BASE = "https://data.europarl.europa.eu";
const OUTPUT_DIR = commOutputArg ? dirname(commOutputArg) : "samples/communication";

// ─── TLS fix for EP certificate ──────────────────────────────────────────────

const EP_HOST = "data.europarl.europa.eu";
function epCheckServerIdentity(hostname: string, cert: tls.PeerCertificate): Error | undefined {
  if (hostname === EP_HOST) {
    const altNames = (cert.subjectaltname || "").split(", ");
    if (altNames.some(n => n === `DNS:*.${EP_HOST}`)) return undefined;
  }
  return tls.checkServerIdentity(hostname, cert);
}

// ─── HTTP helper ─────────────────────────────────────────────────────────────

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

// ─── Activity type mapping ───────────────────────────────────────────────────

interface ActivityInfo {
  label: string;
  institution: string;
  institutionRef: string;
}

/** Map EP activity types to human-readable labels and responsible institution */
function activityInfo(actType: string): ActivityInfo {
  const key = actType.split("/").pop() ?? actType;
  const map: Record<string, ActivityInfo> = {
    REFERRAL: {
      label: "Referral to Committee",
      institution: "European Parliament",
      institutionRef: "#ep",
    },
    COMMITTEE_TABLING_REPORT: {
      label: "Committee Draft Report Tabled",
      institution: "EP Committee",
      institutionRef: "#ep",
    },
    COMMITTEE_TABLING_AMENDMENT: {
      label: "Committee Amendments Tabled",
      institution: "EP Committee",
      institutionRef: "#ep",
    },
    COMMITTEE_ADOPTING_REPORT: {
      label: "Committee Report Adopted",
      institution: "EP Committee",
      institutionRef: "#ep",
    },
    TABLING_PLENARY: {
      label: "Tabled for Plenary",
      institution: "European Parliament",
      institutionRef: "#ep",
    },
    PLENARY_ENDORSE_COMMITTEE_INTERINSTITUTIONAL_NEGOTIATIONS: {
      label: "Plenary Endorses Interinstitutional Negotiations",
      institution: "European Parliament",
      institutionRef: "#ep",
    },
    PLENARY_VOTE: {
      label: "Plenary Vote",
      institution: "European Parliament",
      institutionRef: "#ep",
    },
    PLENARY_VOTE_RESULTS: {
      label: "Plenary Vote Results",
      institution: "European Parliament",
      institutionRef: "#ep",
    },
    PLENARY_DEBATE: {
      label: "Plenary Debate",
      institution: "European Parliament",
      institutionRef: "#ep",
    },
    PLENARY_ADOPT_POSITION: {
      label: "EP Position Adopted (First Reading)",
      institution: "European Parliament",
      institutionRef: "#ep",
    },
    COMMITTEE_APPROVE_PROVISIONAL_AGREEMENT: {
      label: "Committee Approves Provisional Agreement",
      institution: "EP Committee",
      institutionRef: "#ep",
    },
    SIGNATURE: {
      label: "Act Signed",
      institution: "European Parliament / Council",
      institutionRef: "#ep",
    },
    PUBLICATION_OFFICIAL_JOURNAL: {
      label: "Published in Official Journal",
      institution: "Publications Office",
      institutionRef: "#opoce",
    },
  };
  return (
    map[key] ?? {
      label: key.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()),
      institution: "European Parliament",
      institutionRef: "#ep",
    }
  );
}

/** Format a date string for display (e.g. "2024-05-22" → "22 May 2024") */
function formatDate(isoDate: string): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  const [y, m, d] = parts;
  const mi = parseInt(m, 10) - 1;
  return `${parseInt(d, 10)} ${months[mi] ?? m} ${y}`;
}

/** Map procedure phase URI to human-readable stage name */
function stageName(stageUri: string): string {
  const key = stageUri.split("/").pop() ?? "";
  const map: Record<string, string> = {
    RDG1: "First Reading",
    RDG2: "Second Reading",
    RDG3: "Third Reading",
    CNC: "Conciliation",
    ADOPT: "Adoption",
  };
  return map[key] ?? key;
}

// ─── Main converter ──────────────────────────────────────────────────────────

async function main() {
  let procId: string;
  let procLabel: string;

  if (DIRECT_PROC_ID) {
    // Direct procedure ID provided, skip search
    procId = DIRECT_PROC_ID;
    procLabel = `${DIRECT_PROC_ID}(COD)`;
  } else {
    // Step 1: fetch COD procedures list
    console.log(`Fetching COD procedures (${procYear})...`);
    const procListJson = await fetchJson(PROCEDURES_URL);
    const procedures: any[] = procListJson.data ?? [];

    if (procedures.length === 0) {
      console.error("No procedures found");
      process.exit(1);
    }

    // Find first COD procedure
    const codProc = procedures.find(
      (p: any) => p.process_type === "def/ep-procedure-types/COD"
    );
    if (!codProc) {
      console.error("No COD procedure found in results");
      process.exit(1);
    }

    procId = codProc.process_id;
    procLabel = codProc.label;
  }
  console.log(`  Selected: ${procLabel} (${procId})`);

  // Step 2: fetch full procedure detail
  const procUrl = `${BASE}/api/v2/procedures/${procId}?format=application%2Fld%2Bjson`;
  console.log(`Fetching procedure detail: ${procId}...`);
  const procDetailJson = await fetchJson(procUrl);
  const procDetail = procDetailJson.data?.[0];

  if (!procDetail) {
    console.error("No procedure detail returned");
    process.exit(1);
  }

  const titleEn: string =
    procDetail.process_title?.en ?? `Procedure ${procLabel}`;
  const currentStage: string = procDetail.current_stage ?? "";
  const events: any[] = procDetail.consists_of ?? [];
  const documents: string[] = procDetail.created_a_realization_of ?? [];
  const participations: any[] = procDetail.had_participation ?? [];

  console.log(`  Title: ${titleEn}`);
  console.log(`  Current stage: ${stageName(currentStage)}`);
  console.log(`  Events: ${events.length}`);
  console.log(`  Documents: ${documents.length}`);
  console.log(`  Participations: ${participations.length}`);

  // Sort events chronologically
  events.sort((a: any, b: any) =>
    (a.activity_date ?? "").localeCompare(b.activity_date ?? "")
  );

  // Deduplicate: group events happening on same date with same activity type
  // (keep them all, they represent different aspects)

  // Extract first date for FRBRdate
  const firstDate = events[0]?.activity_date ?? new Date().toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  // Procedure URI
  const procUri = `${BASE}/${procDetail.id}`;

  // ─── Build AKN XML ───────────────────────────────────────────────────────

  const AKN_NS = "http://docs.oasis-open.org/legaldocml/ns/akn/3.0";
  const x = new XmlBuilder();

  x.emit(`<?xml version="1.0" encoding="UTF-8"?>`);
  x.open("akomaNtoso", { xmlns: AKN_NS });
  x.open("doc", { name: "communication" });

  // ── meta
  x.open("meta");
  x.open("identification", { source: "#ep-opendata" });

  // FRBRWork
  x.open("FRBRWork");
  x.selfClose("FRBRthis", { value: procUri });
  x.selfClose("FRBRuri", { value: procUri });
  x.selfClose("FRBRdate", { date: firstDate, name: "procedure-start" });
  x.selfClose("FRBRauthor", { href: "#com", as: "#author" });
  x.selfClose("FRBRcountry", { value: "eu" });
  x.close("FRBRWork");

  // FRBRExpression
  x.open("FRBRExpression");
  x.selfClose("FRBRthis", { value: `${procUri}/en` });
  x.selfClose("FRBRuri", { value: `${procUri}/en` });
  x.selfClose("FRBRdate", { date: today, name: "snapshot" });
  x.selfClose("FRBRauthor", { href: "#ep" });
  x.selfClose("FRBRlanguage", { language: "eng" });
  x.close("FRBRExpression");

  // FRBRManifestation
  x.open("FRBRManifestation");
  x.selfClose("FRBRthis", { value: `${procUri}/en/xml` });
  x.selfClose("FRBRuri", { value: `${procUri}/en/xml` });
  x.selfClose("FRBRdate", { date: today, name: "transformation" });
  x.selfClose("FRBRauthor", { href: "#poc-epdata-to-communication" });
  x.close("FRBRManifestation");

  x.close("identification");

  // ── references
  x.open("references", { source: "#ep-opendata" });
  x.selfClose("TLCOrganization", {
    eId: "ep-opendata",
    href: "https://data.europarl.europa.eu",
    showAs: "European Parliament Open Data Portal",
  });
  x.selfClose("TLCOrganization", {
    eId: "ep",
    href: "https://data.europarl.europa.eu/org/EU_PARLIAMENT",
    showAs: "European Parliament",
  });
  x.selfClose("TLCOrganization", {
    eId: "com",
    href: "http://publications.europa.eu/resource/authority/corporate-body/COM",
    showAs: "European Commission",
  });
  x.selfClose("TLCOrganization", {
    eId: "consil",
    href: "http://publications.europa.eu/resource/authority/corporate-body/CONSIL",
    showAs: "Council of the European Union",
  });
  x.selfClose("TLCOrganization", {
    eId: "opoce",
    href: "http://publications.europa.eu/resource/authority/corporate-body/OPOCE",
    showAs: "Publications Office of the EU",
  });

  // Add committee references from participations
  const committees = new Set<string>();
  for (const p of participations) {
    if (p.participation_role === "def/ep-roles/COMMITTEE_LEAD") {
      const orgId = (p.had_participant_organization ?? [])[0];
      if (orgId) committees.add(orgId);
    }
  }
  for (const cId of committees) {
    const shortId = cId.split("/").pop() ?? cId;
    x.selfClose("TLCOrganization", {
      eId: shortId.toLowerCase(),
      href: `${BASE}/${cId}`,
      showAs: `Committee ${shortId}`,
    });
  }

  // Add TLCEvent for the procedure type
  x.selfClose("TLCProcess", {
    eId: "cod",
    href: `${BASE}/def/ep-procedure-types/COD`,
    showAs: "Ordinary Legislative Procedure (COD)",
  });

  x.close("references");

  // ── lifecycle (map procedure stages)
  x.open("lifecycle", { source: "#ep-opendata" });
  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const info = activityInfo(ev.had_activity_type ?? "");
    x.selfClose("eventRef", {
      eId: `evt_${i + 1}`,
      date: ev.activity_date ?? "",
      source: info.institutionRef,
      type: ev.type === "Decision" ? "generation" : "amendment",
    });
  }
  x.close("lifecycle");

  x.close("meta");

  // ── preface
  x.open("preface", { eId: "preface" });
  x.open("longTitle", { eId: "longTitle" });
  x.inline("p", {}, `<docType>Legislative Procedure Communication</docType>`);
  x.inline(
    "p",
    {},
    `<docProponent refersTo="#com">European Commission</docProponent>`
  );
  x.inline("p", {}, `Procedure <docNumber>${esc(procLabel)}</docNumber>`);
  x.inline("p", {}, `<docTitle>${esc(titleEn)}</docTitle>`);
  x.inline(
    "p",
    {},
    `Type: <session refersTo="#cod">Ordinary Legislative Procedure (COD)</session>`
  );
  x.inline(
    "p",
    {},
    `Current stage: ${esc(stageName(currentStage))}`
  );
  x.close("longTitle");
  x.close("preface");

  // ── mainBody: events as sections grouped by stage
  x.open("mainBody");

  // Group events by stage for cleaner output
  let sectionIdx = 0;
  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const actType = ev.had_activity_type ?? "";
    const info = activityInfo(actType);
    const actKey = actType.split("/").pop() ?? "";
    const stageUri = ev.occured_at_stage ?? "";

    sectionIdx++;
    const sectionEId = `sec_evt${sectionIdx}`;

    x.open("section", { eId: sectionEId });
    x.inline("num", {}, String(sectionIdx));
    x.inline("heading", {}, esc(info.label));

    x.open("content", { eId: `${sectionEId}__content` });

    // Date
    x.inline(
      "p",
      { class: "date" },
      `<date date="${esc(ev.activity_date ?? "")}">${esc(formatDate(ev.activity_date ?? ""))}</date>`
    );

    // Institution
    x.inline(
      "p",
      { class: "institution" },
      `<organization refersTo="${esc(info.institutionRef)}">${esc(info.institution)}</organization>`
    );

    // Event type (Decision vs Activity)
    x.inline("p", { class: "eventType" }, esc(ev.type ?? "Activity"));

    // Stage
    if (stageUri) {
      x.inline("p", { class: "stage" }, esc(stageName(stageUri)));
    }

    // Related documents
    const relDocs: string[] =
      ev.based_on_a_realization_of ??
      ev.decided_on_a_realization_of ??
      [];
    if (relDocs.length > 0) {
      for (const docRef of relDocs) {
        const docLabel = docRef.split("/").pop() ?? docRef;
        x.inline(
          "p",
          { class: "document" },
          `<ref href="${esc(`${BASE}/${docRef}`)}">${esc(docLabel)}</ref>`
        );
      }
    }

    // Recorded-in references (minutes, verbatim)
    const recordedIn: string[] = ev.recorded_in_a_realization_of ?? [];
    if (recordedIn.length > 0) {
      for (const recRef of recordedIn) {
        const recLabel = recRef.split("/").pop() ?? recRef;
        x.inline(
          "p",
          { class: "record" },
          `Recorded in: <ref href="${esc(`${BASE}/${recRef}`)}">${esc(recLabel)}</ref>`
        );
      }
    }

    x.close("content");
    x.close("section");
  }

  // ── Additional section: participants (rapporteurs, shadow rapporteurs)
  if (participations.length > 0) {
    sectionIdx++;
    const partEId = `sec_evt${sectionIdx}`;
    x.open("section", { eId: partEId });
    x.inline("num", {}, String(sectionIdx));
    x.inline("heading", {}, "Participants");

    x.open("content", { eId: `${partEId}__content` });

    for (const p of participations) {
      const role = (p.participation_role ?? "").split("/").pop() ?? "";
      const group = (p.politicalGroup ?? "").split("/").pop() ?? "";
      const persons: string[] = p.had_participant_person ?? [];
      const orgs: string[] = p.had_participant_organization ?? [];
      const date = p.activity_date ?? "";
      const committee = (p.participation_in_name_of ?? "").split("/").pop() ?? "";

      const roleName = role
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/^\w/, (c: string) => c.toUpperCase());

      if (persons.length > 0) {
        const personId = persons[0].split("/").pop() ?? persons[0];
        let line = `<role refersTo="#${esc(role.toLowerCase())}">${esc(roleName)}</role>: `;
        line += `<person refersTo="${esc(`${BASE}/${persons[0]}`)}">${esc(personId)}</person>`;
        if (group) line += ` (${esc(group)})`;
        if (committee) line += ` for ${esc(committee)}`;
        if (date) line += ` — <date date="${esc(date)}">${esc(formatDate(date))}</date>`;
        x.inline("p", { class: "participant" }, line);
      } else if (orgs.length > 0) {
        const orgId = orgs[0].split("/").pop() ?? orgs[0];
        let line = `<role refersTo="#${esc(role.toLowerCase())}">${esc(roleName)}</role>: `;
        line += `<organization refersTo="${esc(`${BASE}/${orgs[0]}`)}">${esc(orgId)}</organization>`;
        x.inline("p", { class: "participant" }, line);
      }
    }

    x.close("content");
    x.close("section");
  }

  // ── Additional section: documents created
  if (documents.length > 0) {
    sectionIdx++;
    const docsEId = `sec_evt${sectionIdx}`;
    x.open("section", { eId: docsEId });
    x.inline("num", {}, String(sectionIdx));
    x.inline("heading", {}, "Documents Produced");

    x.open("content", { eId: `${docsEId}__content` });
    for (const docRef of documents) {
      const docLabel = docRef.split("/").pop() ?? docRef;
      x.inline(
        "p",
        { class: "document" },
        `<ref href="${esc(`${BASE}/${docRef}`)}">${esc(docLabel)}</ref>`
      );
    }
    x.close("content");
    x.close("section");
  }

  x.close("mainBody");

  x.close("doc");
  x.close("akomaNtoso");

  // ─── Write output ────────────────────────────────────────────────────────

  // Clean procedure label for filename: "2024/0006(COD)" → "2024-0006-COD"
  const fileRef = procLabel
    .replace(/\//g, "-")
    .replace(/\(/g, "-")
    .replace(/\)/g, "");
  const outputPath = commOutputArg || `${OUTPUT_DIR}/eu-communication-${fileRef}.xml`;

  mkdirSync(dirname(outputPath), { recursive: true });
  const xml = x.toString();
  writeFileSync(outputPath, xml, "utf-8");
  console.log(`\nWritten: ${outputPath} (${xml.length} bytes)`);

  // Preview
  const lines = xml.split("\n");
  const preview = lines.slice(0, 40);
  console.log(`\n--- Preview (first 40 of ${lines.length} lines) ---`);
  console.log(preview.join("\n"));
  console.log("--- ... ---");
}

main().then(() => process.exit(0)).catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
