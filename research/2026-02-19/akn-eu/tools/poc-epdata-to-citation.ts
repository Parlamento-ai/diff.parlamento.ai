/**
 * PoC: EP Open Data → Akoma Ntoso (citation / plenary agenda)
 *
 * Downloads a real plenary meeting agenda from the European Parliament Open Data API
 * and converts it to a valid AKN 3.0 XML document with <doc name="citation"> structure.
 *
 * Usage:
 *   node --experimental-strip-types poc-epdata-to-citation.ts
 *
 * Zero npm dependencies — uses only Node.js built-in modules.
 */

import https from "node:https";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

// ─── Config ──────────────────────────────────────────────────────────────────

const year = process.argv[2] || "2025";
const MEETINGS_URL = `https://data.europarl.europa.eu/api/v2/meetings?year=${year}&format=application%2Fld%2Bjson&offset=0&limit=3`;
const OUTPUT_PATH = `samples/citation/eu-citation-plenary-${year}.xml`;

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

// ─── Extract meeting ID from the URI ─────────────────────────────────────────

function meetingIdFromUri(uri: string): string {
  // e.g. "eli/dl/event/MTG-PL-2025-01-20" → "MTG-PL-2025-01-20"
  const parts = uri.split("/");
  return parts[parts.length - 1];
}

// ─── Main converter ──────────────────────────────────────────────────────────

async function main() {
  // Step 1: fetch meetings list
  console.log("Fetching meetings list (2025)...");
  const meetingsJson = await fetchJson(MEETINGS_URL);
  const meetings: any[] = meetingsJson.data ?? [];

  if (meetings.length === 0) {
    console.error("No meetings found");
    process.exit(1);
  }

  const meeting = meetings[0];
  const meetingId = meetingIdFromUri(meeting.id);
  const meetingDate: string = meeting.activity_date ?? "";
  const meetingLabel: string = meeting.activity_label?.en ?? meetingId;
  const attendees: number = meeting.number_of_attendees ?? 0;

  console.log(`  Meeting: ${meetingLabel} (${meetingId})`);
  console.log(`  Date: ${meetingDate}, Attendees: ${attendees}`);

  // Step 2: fetch agenda (foreseen activities)
  const agendaUrl = `https://data.europarl.europa.eu/api/v2/meetings/${meetingId}/foreseen-activities?format=application%2Fld%2Bjson`;
  console.log(`Fetching agenda for ${meetingId}...`);
  const agendaJson = await fetchJson(agendaUrl);
  const agendaItems: any[] = agendaJson.data ?? [];

  console.log(`  Agenda items: ${agendaItems.length}`);

  // Build AKN
  const AKN_NS = "http://docs.oasis-open.org/legaldocml/ns/akn/3.0";
  const eli = `https://data.europarl.europa.eu/${meeting.id}`;
  const x = new XmlBuilder();

  x.emit(`<?xml version="1.0" encoding="UTF-8"?>`);
  x.open("akomaNtoso", { xmlns: AKN_NS });
  x.open("doc", { name: "citation" });

  // ── meta
  x.open("meta");
  x.open("identification", { source: "#ep-opendata" });

  x.open("FRBRWork");
  x.selfClose("FRBRthis", { value: eli });
  x.selfClose("FRBRuri", { value: eli });
  x.selfClose("FRBRdate", { date: meetingDate, name: "meeting" });
  x.selfClose("FRBRauthor", { href: "#ep" });
  x.selfClose("FRBRcountry", { value: "eu" });
  x.close("FRBRWork");

  x.open("FRBRExpression");
  x.selfClose("FRBRthis", { value: `${eli}/mul` });
  x.selfClose("FRBRuri", { value: `${eli}/mul` });
  x.selfClose("FRBRdate", { date: meetingDate, name: "meeting" });
  x.selfClose("FRBRauthor", { href: "#ep" });
  x.selfClose("FRBRlanguage", { language: "mul" });
  x.close("FRBRExpression");

  x.open("FRBRManifestation");
  x.selfClose("FRBRthis", { value: `${eli}/mul/xml` });
  x.selfClose("FRBRuri", { value: `${eli}/mul/xml` });
  x.selfClose("FRBRdate", { date: new Date().toISOString().slice(0, 10), name: "transformation" });
  x.selfClose("FRBRauthor", { href: "#poc-epdata-to-citation" });
  x.close("FRBRManifestation");

  x.close("identification");

  // references
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
  x.close("references");

  x.close("meta");

  // ── preface
  x.open("preface", { eId: "preface" });
  x.open("longTitle", { eId: "longTitle" });
  x.inline("p", {}, `<docType>Plenary Session Agenda</docType>`);
  x.inline("p", {}, `<docTitle>${esc(meetingLabel)}</docTitle>`);
  x.inline("p", {}, `<date date="${esc(meetingDate)}">${esc(meetingDate)}</date>`);
  if (attendees > 0) {
    x.inline("p", {}, `Attendees: ${attendees}`);
  }
  x.close("longTitle");
  x.close("preface");

  // ── mainBody: agenda items as sections
  x.open("mainBody");

  for (let i = 0; i < agendaItems.length; i++) {
    const item = agendaItems[i];
    const itemId = meetingIdFromUri(item.id);
    const sectionEId = `sec_${i + 1}`;

    // Get label — prefer agendaLabel, fall back to activity_label
    const label: string =
      item.agendaLabel?.en ?? item.activity_label?.en ?? itemId;
    const startTime: string = item.activity_start_date ?? "";
    const endTime: string = item.activity_end_date ?? "";
    const activityType: string = item.had_activity_type ?? "";
    const subItems: string[] = item.consists_of ?? [];
    const room: string = item.hasRoom?.officeAddress ?? "";

    x.open("section", { eId: sectionEId });
    x.inline("num", {}, String(i + 1));
    x.inline("heading", {}, esc(label));

    x.open("content", { eId: `${sectionEId}__content` });

    // Time info
    if (startTime) {
      const timeStr = startTime.includes("T") ? startTime.split("T")[1].slice(0, 5) : startTime;
      const endStr = endTime && endTime.includes("T") ? endTime.split("T")[1].slice(0, 5) : "";
      const timeLine = endStr ? `${timeStr} - ${endStr}` : timeStr;
      x.inline("p", { class: "time" }, `<time datetime="${esc(startTime)}">${esc(timeLine)}</time>`);
    }

    // Activity type
    if (activityType) {
      const typeLabel = activityType.split("/").pop() ?? activityType;
      x.inline("p", { class: "activityType" }, esc(typeLabel));
    }

    // Room
    if (room) {
      x.inline("p", { class: "room" }, `Room: ${esc(room)}`);
    }

    // Sub-items (referenced agenda points)
    if (subItems.length > 0) {
      x.inline("p", { class: "subItems" }, `Sub-items: ${subItems.length}`);
      for (const sub of subItems) {
        const subLabel = meetingIdFromUri(sub);
        x.inline("p", { class: "subItem" }, `<ref href="https://data.europarl.europa.eu/${esc(sub)}">${esc(subLabel)}</ref>`);
      }
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
