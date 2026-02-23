/**
 * run-pipeline.ts — Auto-Discovery EU AKN Pipeline
 *
 * Takes ONLY a procedure ID (e.g., "2020/0374(COD)") and auto-discovers
 * everything needed: CELEX numbers, vote data, EP amendments, etc.
 *
 * Usage: node --experimental-strip-types run-pipeline.ts "2020/0374(COD)"
 */

import { execSync } from "node:child_process";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  unlinkSync,
  createWriteStream,
} from "node:fs";
import { resolve, join, dirname } from "node:path";
import https from "node:https";
import http from "node:http";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DiscoveredConfig {
  slug: string;
  title: string;
  billCelex: string;
  finalCelex: string;
  epPositionCelex: string | null;
  taReference: string | null; // e.g. "TA-9-2023-0266"
  lang: string;
  procedure: string;
  voteDate: string;
  voteFor: number;
  voteAgainst: number;
  voteAbstain: number;
  pubDate: string | null;
  comDate: string | null;
}

type Status = "PASS" | "FAIL" | "WARN";

interface StepResult {
  step: number;
  id: string;
  name: string;
  status: Status;
  detail: string;
  elapsed: number;
}

interface CrossCheck {
  name: string;
  status: Status;
  detail: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TOOLS_DIR = resolve(dirname(process.argv[1] || __filename));
const BASE_DIR = resolve(TOOLS_DIR, "..");
const NODE = "node --experimental-strip-types";
const EP_API = "https://data.europarl.europa.eu";
const CELLAR_SPARQL = "https://publications.europa.eu/webapi/rdf/sparql";

// ─── HTTP helpers ────────────────────────────────────────────────────────────

function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const doRequest = (targetUrl: string, redirects = 0) => {
      if (redirects > 5) return reject(new Error("Too many redirects"));
      const mod = targetUrl.startsWith("https:") ? https : http;
      mod.get(
        targetUrl,
        { headers: { Accept: "application/ld+json, application/json", "User-Agent": "eu-akn-pipeline" } },
        (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            const loc = res.headers.location.startsWith("http")
              ? res.headers.location
              : new URL(res.headers.location, targetUrl).href;
            return doRequest(loc, redirects + 1);
          }
          if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} for ${targetUrl}`));
          let body = "";
          res.on("data", (chunk: Buffer) => (body += chunk.toString()));
          res.on("end", () => {
            try { resolve(JSON.parse(body)); }
            catch (e) { reject(new Error(`JSON parse error`)); }
          });
          res.on("error", reject);
        },
      ).on("error", reject);
    };
    doRequest(url);
  });
}

function sparqlQuery(query: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({ query }).toString();
    const req = https.request(
      CELLAR_SPARQL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/sparql-results+json",
          "User-Agent": "eu-akn-pipeline",
          "Content-Length": Buffer.byteLength(postData),
        },
      },
      (res) => {
        if (res.statusCode !== 200) return reject(new Error(`SPARQL HTTP ${res.statusCode}`));
        let body = "";
        res.on("data", (chunk: Buffer) => (body += chunk.toString()));
        res.on("end", () => {
          try { resolve(JSON.parse(body)); }
          catch { reject(new Error("SPARQL JSON parse error")); }
        });
        res.on("error", reject);
      },
    );
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

function downloadFile(
  url: string,
  dest: string,
  headers?: Record<string, string>,
): Promise<boolean> {
  return new Promise((res) => {
    const doDownload = (targetUrl: string, redirects = 0) => {
      if (redirects > 10) { res(false); return; }
      const mod = targetUrl.startsWith("https:") ? https : http;
      mod.get(
        targetUrl,
        { headers: { "User-Agent": "eu-akn-pipeline", ...headers } },
        (response: any) => {
          if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            const loc = response.headers.location.startsWith("http")
              ? response.headers.location
              : new URL(response.headers.location, targetUrl).href;
            doDownload(loc, redirects + 1);
            return;
          }
          if (response.statusCode !== 200) { res(false); return; }
          const file = createWriteStream(dest);
          response.pipe(file);
          file.on("finish", () => { file.close(); res(true); });
          file.on("error", () => { file.close(); if (existsSync(dest)) unlinkSync(dest); res(false); });
        },
      ).on("error", () => { if (existsSync(dest)) unlinkSync(dest); res(false); });
    };
    doDownload(url);
  });
}

// ─── Auto-Discovery ──────────────────────────────────────────────────────────

/**
 * Parse procedure string "2020/0374(COD)" → { year, num, type, apiId }
 */
function parseProcedure(proc: string) {
  const m = proc.match(/^(\d{4})\/(\d+)\((\w+)\)$/);
  if (!m) return null;
  return { year: m[1], num: m[2], type: m[3], apiId: `${m[1]}-${m[2]}` };
}

/**
 * Discover all CELEX numbers via CELLAR SPARQL.
 * Uses owl:sameAs + 5 UNION paths to find: proposals, final acts,
 * EP positions and consolidated versions.
 */
async function discoverCelexFromSparql(year: string, num: string): Promise<{
  billCelex: string | null;
  finalCelex: string | null;
  epPositionCelex: string | null;
  allCelex: { celex: string; source: string; date: string | null; title: string | null }[];
}> {
  const numStripped = num.replace(/^0+/, "");
  const procUri = `http://publications.europa.eu/resource/procedure/${year}_${numStripped}`;

  const query = `
PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>

SELECT DISTINCT ?celex ?title ?date ?source WHERE {
  ?dossier owl:sameAs <${procUri}> .

  {
    ?work cdm:work_part_of_dossier ?dossier .
    BIND("dossier" AS ?source)
  } UNION {
    ?proposal cdm:work_part_of_dossier ?dossier .
    ?work cdm:resource_legal_adopts_resource_legal ?proposal .
    BIND("adopts" AS ?source)
  } UNION {
    ?proposal cdm:work_part_of_dossier ?dossier .
    ?adopting cdm:resource_legal_adopts_resource_legal ?proposal .
    ?work cdm:work_is_another_publication_of_work ?adopting .
    BIND("consolidated" AS ?source)
  } UNION {
    ?proposal cdm:work_part_of_dossier ?dossier .
    ?work cdm:resource_legal_contains_ep_opinion_on_resource_legal ?proposal .
    BIND("ep_opinion" AS ?source)
  }

  ?work cdm:resource_legal_id_celex ?celex .
  OPTIONAL { ?work cdm:work_date_document ?date }
  OPTIONAL {
    ?exp cdm:expression_belongs_to_work ?work .
    ?exp cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/ENG> .
    ?exp cdm:expression_title ?title .
  }
} ORDER BY ?date LIMIT 100`;

  try {
    const result = await sparqlQuery(query);
    const bindings: any[] = result?.results?.bindings ?? [];

    const allCelex = bindings.map((b: any) => ({
      celex: b.celex?.value ?? "",
      source: b.source?.value ?? "",
      date: b.date?.value ?? null,
      title: b.title?.value ?? null,
    })).filter((r) => r.celex);

    // Classify: bill = 5YYYYPC, final = 3YYYYR/L/D (from "adopts"), EP position = 5YYYYAP
    const bills = allCelex.filter((r) => /^5\d{4}PC\d/.test(r.celex));
    const finals = allCelex.filter((r) => r.source === "adopts" && /^3\d{4}[RLD]\d/.test(r.celex));
    const epPositions = allCelex.filter((r) => /^5\d{4}AP\d/.test(r.celex));
    return {
      billCelex: bills[0]?.celex ?? null,
      finalCelex: finals[0]?.celex ?? null,
      epPositionCelex: epPositions[0]?.celex ?? null,
      allCelex,
    };
  } catch (e: any) {
    console.log(`        SPARQL query failed: ${e.message}`);
    return { billCelex: null, finalCelex: null, epPositionCelex: null, allCelex: [] };
  }
}

/**
 * Extract TA reference (e.g., "TA-9-2023-0266") from EP Open Data procedure events.
 * Searches all document references in activities for TA patterns.
 */
function extractTaReference(events: any[]): string | null {
  // Stringify all events and search for TA reference pattern
  const eventsStr = JSON.stringify(events);
  const taMatch = eventsStr.match(/TA-\d+-\d{4}-\d{4}/);
  return taMatch ? taMatch[0] : null;
}

/**
 * Extract committee report reference (e.g., "A-9-2023-0188") from EP procedure events.
 * Looks at PLENARY_VOTE_RESULTS event on the vote date, which links to the report.
 */
function extractReportReference(events: any[], voteDate: string | null): string | null {
  if (!voteDate) return null;
  // First try: PLENARY_VOTE_RESULTS on the vote date
  for (const ev of events) {
    const type = ev.had_activity_type ?? "";
    const date = ev.activity_date ?? "";
    if (date === voteDate && type.includes("PLENARY_VOTE_RESULTS")) {
      const evStr = JSON.stringify(ev);
      const match = evStr.match(/A-9-(\d{4})-(\d{4})/);
      if (match) return match[0];
    }
  }
  // Fallback: any PLENARY event on the vote date
  for (const ev of events) {
    const date = ev.activity_date ?? "";
    const type = ev.had_activity_type ?? "";
    if (date === voteDate && type.includes("PLENARY")) {
      const evStr = JSON.stringify(ev);
      const match = evStr.match(/A-9-(\d{4})-(\d{4})/);
      if (match) return match[0];
    }
  }
  return null;
}

/**
 * Fetch procedure details from EP Open Data API.
 */
async function discoverFromEpOpenData(apiProcId: string): Promise<{
  title: string;
  events: any[];
  voteDate: string | null;
  comDate: string | null;
  pubDate: string | null;
}> {
  const url = `${EP_API}/api/v2/procedures/${apiProcId}?format=application%2Fld%2Bjson`;
  const data = await fetchJson(url);
  const proc = data?.data?.[0];
  if (!proc) throw new Error(`Procedure ${apiProcId} not found in EP Open Data`);

  const title: string = proc.process_title?.en ?? proc.label ?? `Procedure ${apiProcId}`;
  const events: any[] = proc.consists_of ?? [];

  // Sort chronologically
  events.sort((a: any, b: any) =>
    (a.activity_date ?? "").localeCompare(b.activity_date ?? ""),
  );

  // Find key dates from events
  let voteDate: string | null = null;
  let comDate: string | null = null;
  let pubDate: string | null = null;

  for (const ev of events) {
    const type = ev.had_activity_type ?? "";
    const date = ev.activity_date ?? "";
    if (type.includes("PLENARY_AMEND_PROPOSAL") && !voteDate) voteDate = date;
    if (type.includes("COMMISSION_PROPOSAL") || type.includes("ANPRO")) comDate = comDate ?? date;
    if (type.includes("PUBLICATION_OFFICIAL_JOURNAL")) pubDate = date;
  }

  // Fallback: look for PLENARY_VOTE events if AMEND_PROPOSAL not found
  if (!voteDate) {
    const voteEvents = events.filter(
      (e: any) => (e.had_activity_type ?? "").includes("PLENARY_VOTE"),
    );
    if (voteEvents.length > 0) {
      // Use the last PLENARY_VOTE (likely the final adoption vote)
      voteDate = voteEvents[voteEvents.length - 1].activity_date;
    }
  }

  return { title, events, voteDate, comDate, pubDate };
}

/**
 * Fetch vote counts from EP Open Data meetings API.
 * Uses number_of_votes_favor/against/abstention fields from the decisions endpoint.
 * When titleKeywords is provided, tries to match the decision by activity_label.
 */
async function discoverVoteCounts(
  voteDate: string,
  titleKeywords?: string,
  reportRef?: string | null,
): Promise<{
  voteFor: number;
  voteAgainst: number;
  voteAbstain: number;
  totalDecisions: number;
}> {
  const meetingId = `MTG-PL-${voteDate}`;
  const url = `${EP_API}/api/v2/meetings/${meetingId}/decisions?format=application%2Fld%2Bjson&offset=0&limit=500`;

  try {
    const data = await fetchJson(url);
    const decisions: any[] = data?.data ?? [];

    let voteFor = 0, voteAgainst = 0, voteAbstain = 0;

    // Strategy 1: Match by report reference (A-9-YYYY-NNNN → "A9-NNNN/YYYY" in label)
    // This is the most reliable method when the reference is available from procedure events.
    if (reportRef) {
      const m = reportRef.match(/A-9-(\d{4})-(\d{4})/);
      if (m) {
        const labelPattern = `a9-${m[2]}/${m[1]}`; // e.g. "a9-0188/2023"
        const refPattern = reportRef.toLowerCase(); // e.g. "a-9-2023-0188"

        // Find adopted decisions matching this report
        let bestFavor = 0;
        for (const d of decisions) {
          const favor = d.number_of_votes_favor ?? 0;
          const against = d.number_of_votes_against ?? 0;
          if (favor <= against) continue; // skip rejected

          const label = (d.activity_label?.en ?? "").toLowerCase();
          const realizationOf = JSON.stringify(d.decided_on_a_realization_of ?? "").toLowerCase();

          if (label.includes(labelPattern) || realizationOf.includes(refPattern)) {
            if (favor > bestFavor) {
              bestFavor = favor;
              voteFor = favor;
              voteAgainst = against;
              voteAbstain = d.number_of_votes_abstention ?? 0;
            }
          }
        }
        if (bestFavor > 0) {
          return { voteFor, voteAgainst, voteAbstain, totalDecisions: decisions.length };
        }
      }
    }

    // Strategy 2: Match by title keywords
    const keywords = titleKeywords
      ? titleKeywords.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 3)
      : [];

    if (keywords.length > 0) {
      type Candidate = { favor: number; against: number; abstain: number; score: number };
      const candidates: Candidate[] = [];

      for (const d of decisions) {
        const favor = d.number_of_votes_favor ?? 0;
        const against = d.number_of_votes_against ?? 0;
        const abstain = d.number_of_votes_abstention ?? 0;
        if (favor + against + abstain === 0) continue;

        const label = ((d.activity_label?.en ?? "") + " " + (d.reference ?? "")).toLowerCase();
        const score = keywords.filter(kw => label.includes(kw)).length;
        if (score > 0) {
          candidates.push({ favor, against, abstain, score });
        }
      }

      // Prefer adopted (favor > against), then highest score, then highest favor
      candidates.sort((a, b) => {
        const aAdopted = a.favor > a.against ? 1 : 0;
        const bAdopted = b.favor > b.against ? 1 : 0;
        if (bAdopted !== aAdopted) return bAdopted - aAdopted;
        if (b.score !== a.score) return b.score - a.score;
        return b.favor - a.favor;
      });

      if (candidates.length > 0 && candidates[0].favor > candidates[0].against) {
        voteFor = candidates[0].favor;
        voteAgainst = candidates[0].against;
        voteAbstain = candidates[0].abstain;
        return { voteFor, voteAgainst, voteAbstain, totalDecisions: decisions.length };
      }
    }

    // Strategy 3: Fallback — adopted decision with highest favor (only useful for small meetings)
    for (const d of decisions) {
      const favor = d.number_of_votes_favor ?? 0;
      const against = d.number_of_votes_against ?? 0;
      const abstain = d.number_of_votes_abstention ?? 0;
      if (favor > against && favor > voteFor) {
        voteFor = favor;
        voteAgainst = against;
        voteAbstain = abstain;
      }
    }

    return { voteFor, voteAgainst, voteAbstain, totalDecisions: decisions.length };
  } catch {
    return { voteFor: 0, voteAgainst: 0, voteAbstain: 0, totalDecisions: 0 };
  }
}

/**
 * Parse bill CELEX "52021PC0206" → { comYear: 2021, comNum: 206 }
 */
function parseBillCelex(celex: string): { comYear: number; comNum: number } | null {
  const m = celex.match(/^5(\d{4})PC0*(\d+)/);
  return m ? { comYear: parseInt(m[1]), comNum: parseInt(m[2]) } : null;
}

/**
 * Parse final CELEX "32024R1689" → { regYear: 2024, regNum: 1689, type: "R" }
 */
function parseFinalCelex(celex: string): { regYear: number; regNum: number; type: string } | null {
  const m = celex.match(/^3(\d{4})([RLD])0*(\d+)/);
  return m ? { regYear: parseInt(m[1]), type: m[2], regNum: parseInt(m[3]) } : null;
}

/**
 * Derive slug from regulation title.
 * "Contestable and fair markets in the digital sector (Digital Markets Act)" → "digital-markets-act"
 */
function slugify(title: string): string {
  // Try to extract a short name from parentheses — skip generic ones like "(EU)", "(EC)", "(EEC)"
  const parenMatches = [...title.matchAll(/\(([^)]{4,})\)/gi)];
  const meaningful = parenMatches.find(
    (m) => !/^\(?(?:EU|EC|EEC|ECSC|Euratom)\)?$/i.test(m[1].trim()),
  );
  const name = meaningful ? meaningful[1] : title.split(" and ")[0];
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 60);
}

/**
 * Derive TA HTML filename from EP position CELEX.
 * "52022AP0270" → "ta-9-2022-0270.html"
 */
function deriveTaFromCelex(celex: string): string | null {
  const m = celex.match(/^5(\d{4})AP(\d+)$/);
  if (!m) return null;
  return `ta-9-${m[1]}-${m[2]}.html`;
}

/**
 * Full auto-discovery: procedure ID → all config data.
 *
 * Discovery chain:
 * 1. EP Open Data → title, events, vote date, COM date, pub date, TA reference
 * 2. CELLAR SPARQL → CELEX numbers (bill, final, EP position)
 * 3. EP Open Data meetings → vote counts
 * 4. Derive slug from title
 */
async function discoverProcedure(procedureCode: string): Promise<DiscoveredConfig> {
  const proc = parseProcedure(procedureCode);
  if (!proc) throw new Error(`Invalid procedure format: ${procedureCode}. Expected: YYYY/NNNN(COD)`);

  console.log(`\n  Discovering: ${procedureCode}`);
  console.log(`  ─────────────────────────────────────`);

  // Step 1: EP Open Data — title, events, dates, TA reference
  console.log(`  [1/4] EP Open Data procedure...`);
  const epData = await discoverFromEpOpenData(proc.apiId);
  const taReference = extractTaReference(epData.events);
  const reportRef = extractReportReference(epData.events, epData.voteDate);
  console.log(`        Title: ${epData.title}`);
  console.log(`        Events: ${epData.events.length}`);
  console.log(`        Vote date: ${epData.voteDate ?? "NOT FOUND"}`);
  console.log(`        COM date: ${epData.comDate ?? "NOT FOUND"}`);
  console.log(`        OJ pub date: ${epData.pubDate ?? "NOT FOUND"}`);
  console.log(`        TA reference: ${taReference ?? "NOT FOUND"}`);
  console.log(`        Report ref: ${reportRef ?? "NOT FOUND"}`);

  // Step 2: CELLAR SPARQL → CELEX numbers
  console.log(`  [2/4] CELLAR SPARQL → CELEX...`);
  const sparql = await discoverCelexFromSparql(proc.year, proc.num);
  console.log(`        Bill CELEX: ${sparql.billCelex ?? "NOT FOUND"}`);
  console.log(`        Final CELEX: ${sparql.finalCelex ?? "NOT FOUND"}`);
  console.log(`        EP position: ${sparql.epPositionCelex ?? "NOT FOUND"}`);
  if (sparql.allCelex.length > 0) {
    console.log(`        All (${sparql.allCelex.length}):`);
    for (const r of sparql.allCelex) {
      console.log(`          ${r.celex} [${r.source}]${r.date ? ` ${r.date}` : ""}`);
    }
  }

  const billCelex = sparql.billCelex;
  const finalCelex = sparql.finalCelex;
  const epPositionCelex = sparql.epPositionCelex;
  // Step 3: Vote counts
  let voteFor = 0, voteAgainst = 0, voteAbstain = 0;
  if (epData.voteDate) {
    console.log(`  [3/4] EP Open Data votes...`);
    const votes = await discoverVoteCounts(epData.voteDate, epData.title, reportRef);
    voteFor = votes.voteFor;
    voteAgainst = votes.voteAgainst;
    voteAbstain = votes.voteAbstain;
    console.log(`        Decisions: ${votes.totalDecisions}`);
    console.log(`        Main vote: ${voteFor}/${voteAgainst}/${voteAbstain}`);
  } else {
    console.log(`  [3/4] Votes: SKIPPED (no vote date)`);
  }

  // Step 4: Derive slug
  const slug = slugify(epData.title);
  console.log(`  [4/4] Slug: ${slug}`);

  // Validate minimum requirements
  if (!billCelex) throw new Error("Could not discover bill CELEX from SPARQL.");
  if (!finalCelex) throw new Error("Could not discover final regulation CELEX from SPARQL.");
  if (!epData.voteDate) throw new Error("Could not discover EP vote date from EP Open Data.");

  console.log(`  ─────────────────────────────────────`);
  console.log(`  Discovery complete.\n`);

  return {
    slug,
    title: epData.title,
    billCelex,
    finalCelex,
    epPositionCelex,
    taReference,
    lang: "en",
    procedure: procedureCode,
    voteDate: epData.voteDate,
    voteFor,
    voteAgainst,
    voteAbstain,
    pubDate: epData.pubDate,
    comDate: epData.comDate,
  };
}

// ─── Pipeline helpers ────────────────────────────────────────────────────────

function countTag(xml: string, tag: string): number {
  return (xml.match(new RegExp(`<${tag}\\b`, "gi")) || []).length;
}

function extractFRBRuri(xml: string): string | null {
  const m = xml.match(/<FRBRuri\s+value="([^"]+)"/);
  return m?.[1] ?? null;
}

function celexMatchesUri(celex: string, uri: string): boolean {
  if (uri.includes(celex)) return true;
  const billMatch = celex.match(/^5(\d{4})PC0*(\d+)$/);
  if (billMatch) return uri.includes(`/${billMatch[1]}/${billMatch[2]}`);
  const regMatch = celex.match(/^3(\d{4})R0*(\d+)$/);
  if (regMatch) return uri.includes(`/${regMatch[1]}/${regMatch[2]}`);
  return false;
}

function runCmd(
  cmd: string,
  timeout: number,
): { stdout: string; ok: boolean; err?: string } {
  try {
    const stdout = execSync(cmd, {
      cwd: TOOLS_DIR,
      timeout,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      maxBuffer: 10 * 1024 * 1024,
    });
    return { stdout: stdout || "", ok: true };
  } catch (e: any) {
    const stderrLines = (e.stderr || "")
      .split("\n")
      .filter(
        (l: string) =>
          l.trim() &&
          !l.includes("ExperimentalWarning") &&
          !l.includes("--trace-warnings"),
      );
    const errorLine = stderrLines.find((l: string) => l.includes("Error:"));
    return {
      stdout: e.stdout || "",
      ok: false,
      err: errorLine || stderrLines.slice(-3).join(" | ") || e.message,
    };
  }
}

function runCmdRetry(
  cmd: string,
  timeout: number,
  maxRetries = 3,
): { stdout: string; ok: boolean; err?: string; attempts: number } {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = runCmd(cmd, timeout);
    if (result.ok) return { ...result, attempts: attempt };
    const isTimeout =
      (result.err || "").includes("ETIMEDOUT") ||
      (result.err || "").includes("TIMEDOUT") ||
      (result.err || "").includes("timed out") ||
      (result.err || "").includes("killed");
    if (!isTimeout || attempt === maxRetries) return { ...result, attempts: attempt };
    const wait = attempt * 5;
    const shortCmd = cmd.length > 80 ? cmd.slice(0, 80) + "..." : cmd;
    console.log(`  Retry ${attempt}/${maxRetries - 1} after ${wait}s... [${shortCmd}] err: ${result.err}`);
    execSync(`sleep ${wait}`, { encoding: "utf-8" });
  }
  return { stdout: "", ok: false, err: "max retries", attempts: maxRetries };
}


function parseChangesetSummary(xml: string): { modified: number; added: number } {
  const m = xml.match(/Articles modified:\s*(\d+)\s*\|\s*Added:\s*(\d+)/);
  if (m) return { modified: parseInt(m[1]), added: parseInt(m[2]) };
  return { modified: 0, added: 0 };
}

function isOjAmendmentHtml(html: string): boolean {
  return html.includes('class="oj-table"');
}

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

function fmtTime(ms: number): string {
  return (ms / 1000).toFixed(1) + "s";
}

// ─── Main Pipeline ───────────────────────────────────────────────────────────

async function runPipeline(config: DiscoveredConfig) {
  const { slug, billCelex, finalCelex, epPositionCelex, taReference, lang } = config;

  // Directories
  const regDir = resolve(BASE_DIR, slug);
  const srcDir = join(regDir, "sources");
  const aknDir = join(regDir, "akn");
  mkdirSync(srcDir, { recursive: true });
  mkdirSync(aknDir, { recursive: true });

  // Expected file paths
  const epHtmlName = taReference
    ? `${taReference}_EN.html`
    : epPositionCelex ? `${epPositionCelex}-ep-amendments.html` : null;
  const F = {
    bill: join(srcDir, `${billCelex}-bill-akn.xml`),
    formex: join(srcDir, `${finalCelex}-formex.xml`),
    finalAkn: join(srcDir, `${finalCelex}-akn.xml`),
    changeset: join(srcDir, `changeset-${slug}.xml`),
    epHtml: epHtmlName ? join(srcDir, epHtmlName) : null,
    epAmendments: join(srcDir, `ep-amendments-${slug}.xml`),
    viewerConfig: join(regDir, "viewer-config.json"),
  };

  // Communication file
  const procId = config.procedure.replace(/\(.*\)/, "").replace(/\//g, "-");
  const procType = config.procedure.match(/\((\w+)\)/)?.[1] ?? "COD";
  const commRef = `${procId}-${procType}`;
  const commFile = `eu-communication-${commRef}.xml`;
  const commPath = join(srcDir, commFile);

  // Votes file
  const meetingId = `MTG-PL-${config.voteDate}`;
  const votesFile = `eu-votes-${meetingId}.xml`;
  const votesPath = join(srcDir, votesFile);

  // State
  const results: StepResult[] = [];
  const failed = new Set<string>();
  let billArticles = 0;
  let formexArticles = 0;
  let finalArticles = 0;
  let changeInsertions = 0;
  let changeSubstitutions = 0;

  function record(step: number, id: string, name: string, status: Status, detail: string, t0: number) {
    results.push({ step, id, name, status, detail, elapsed: Date.now() - t0 });
    if (status === "FAIL") failed.add(id);
  }

  function depsFailed(deps: string[]): string | null {
    for (const d of deps) {
      if (failed.has(d)) return `dep '${d}' failed`;
    }
    return null;
  }


  const t0Global = Date.now();

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1: Download bill
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const id = "download-bill", num = 1, name = "Download bill";
    const t0 = Date.now();

    if (existsSync(F.bill)) {
      const xml = readFileSync(F.bill, "utf-8");
      billArticles = countTag(xml, "article");
      const uri = extractFRBRuri(xml) || "";
      if (billArticles > 0 && celexMatchesUri(billCelex, uri))
        record(num, id, name, "PASS", `${billArticles} articles (cached)`, t0);
      else if (billArticles > 0)
        record(num, id, name, "WARN", `${billArticles} articles, CELEX mismatch (cached)`, t0);
      else
        record(num, id, name, "FAIL", "0 articles in cached file", t0);
    } else {
      const { ok, err } = runCmdRetry(
        `${NODE} poc-cellar-to-bill.ts ${billCelex} --output="${F.bill}"`,
        120000,
      );
      if (ok && existsSync(F.bill)) {
        const xml = readFileSync(F.bill, "utf-8");
        billArticles = countTag(xml, "article");
        record(num, id, name, billArticles > 0 ? "PASS" : "FAIL",
          billArticles > 0 ? `${billArticles} articles` : "0 articles", t0);
      } else {
        record(num, id, name, "FAIL", err || "output not created", t0);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2: Download Formex
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const id = "download-formex", num = 2, name = "Download formex";
    const t0 = Date.now();

    if (existsSync(F.formex)) {
      const xml = readFileSync(F.formex, "utf-8");
      formexArticles = countTag(xml, "ARTICLE");
      record(num, id, name, formexArticles > 0 ? "PASS" : "FAIL",
        formexArticles > 0 ? `${formexArticles} ARTICLE (cached)` : "0 ARTICLE in cached", t0);
    } else {
      const { ok, err } = runCmdRetry(
        `${NODE} poc-cellar-download-formex.ts ${finalCelex} "${srcDir}"`,
        240000,
      );
      if (ok && existsSync(F.formex)) {
        const xml = readFileSync(F.formex, "utf-8");
        formexArticles = countTag(xml, "ARTICLE");
        record(num, id, name, formexArticles > 0 ? "PASS" : "WARN",
          formexArticles > 0 ? `${formexArticles} ARTICLE` : "0 ARTICLE", t0);
      } else {
        record(num, id, name, "FAIL", err || "output not created", t0);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3: Formex → AKN
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const id = "formex-to-akn", num = 3, name = "Formex → AKN";
    const t0 = Date.now();
    const blockMsg = depsFailed(["download-formex"]);

    if (blockMsg) {
      record(num, id, name, "FAIL", blockMsg, t0);
    } else if (existsSync(F.finalAkn)) {
      const xml = readFileSync(F.finalAkn, "utf-8");
      finalArticles = countTag(xml, "article");
      record(num, id, name, finalArticles > 0 ? "PASS" : "FAIL",
        finalArticles > 0 ? `${finalArticles} articles (cached)` : "0 articles cached", t0);
    } else {
      const { ok, err } = runCmd(
        `${NODE} poc-formex-to-akn.ts "${F.formex}" "${F.finalAkn}"`,
        30000,
      );
      if (ok && existsSync(F.finalAkn)) {
        const xml = readFileSync(F.finalAkn, "utf-8");
        finalArticles = countTag(xml, "article");
        record(num, id, name, finalArticles > 0 ? "PASS" : "WARN",
          finalArticles > 0 ? `${finalArticles} articles` : "0 articles", t0);
      } else {
        record(num, id, name, "FAIL", err || "output not created", t0);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 4: AKN diff (changeset)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const id = "akn-diff", num = 4, name = "AKN diff";
    const t0 = Date.now();
    const blockMsg = depsFailed(["download-bill", "formex-to-akn"]);

    if (blockMsg) {
      record(num, id, name, "FAIL", blockMsg, t0);
    } else if (existsSync(F.changeset)) {
      const xml = readFileSync(F.changeset, "utf-8");
      const summary = parseChangesetSummary(xml);
      changeSubstitutions = summary.modified;
      changeInsertions = summary.added;
      const expected = billArticles + changeInsertions;
      const check = expected === finalArticles
        ? `${billArticles}+${changeInsertions}=${finalArticles} \u2713`
        : `${billArticles}+${changeInsertions}=${expected} (final: ${finalArticles})`;
      record(num, id, name, "PASS", `${check} (cached)`, t0);
    } else {
      const changesetName = `changeset-${slug}.xml`;
      const { stdout, ok, err } = runCmd(
        `${NODE} poc-akn-diff.ts "${F.bill}" "${F.finalAkn}" ${changesetName}`,
        30000,
      );
      if (ok && existsSync(F.changeset)) {
        const subsMatch = stdout.match(/Substitutions \(modified\):\s+(\d+)/);
        const insMatch = stdout.match(/Insertions \(new\):\s+(\d+)/);
        changeSubstitutions = subsMatch ? parseInt(subsMatch[1]) : 0;
        changeInsertions = insMatch ? parseInt(insMatch[1]) : 0;
        if (changeSubstitutions === 0 && changeInsertions === 0) {
          const xml = readFileSync(F.changeset, "utf-8");
          const summary = parseChangesetSummary(xml);
          changeSubstitutions = summary.modified;
          changeInsertions = summary.added;
        }
        const expected = billArticles + changeInsertions;
        const check = expected === finalArticles
          ? `${billArticles}+${changeInsertions}=${finalArticles} \u2713`
          : `${billArticles}+${changeInsertions}=${expected} (final: ${finalArticles})`;
        record(num, id, name, "PASS", check, t0);
      } else {
        record(num, id, name, "FAIL", err || "output not created", t0);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 5: EP amendments
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const id = "ep-amendments", num = 5, name = "EP amendments";
    const t0 = Date.now();

    if (existsSync(F.epAmendments)) {
      const xml = readFileSync(F.epAmendments, "utf-8");
      const changes = countTag(xml, "akndiff:articleChange");
      if (changes > 0) {
        record(num, id, name, "PASS", `${changes} article changes (cached)`, t0);
      } else {
        unlinkSync(F.epAmendments);
      }
    }

    if (!results.find((r) => r.id === id)) {
      if (!epPositionCelex) {
        record(num, id, name, "WARN", "EP position CELEX not found (no SPARQL result)", t0);
      } else {
        const epHtmlPath = F.epHtml!;

        // Download from CELLAR
        if (!existsSync(epHtmlPath)) {
          const cellarUrl = `https://publications.europa.eu/resource/celex/${epPositionCelex}`;
          console.log(`  Downloading EP OJ HTML: ${epPositionCelex}`);
          const downloaded = await downloadFile(cellarUrl, epHtmlPath, {
            Accept: "application/xhtml+xml, text/html",
            "Accept-Language": lang,
          });
          if (!downloaded) {
            record(num, id, name, "FAIL", `CELLAR download failed: ${epPositionCelex}`, t0);
          }
        }

        if (existsSync(epHtmlPath) && !results.find((r) => r.id === id)) {
          const html = readFileSync(epHtmlPath, "utf-8");
          if (!isOjAmendmentHtml(html)) {
            record(num, id, name, "WARN",
              "No amendment tables in OJ HTML (trilogue text)", t0);
          } else {
            // Build metadata for conversion
            const taFile = deriveTaFromCelex(epPositionCelex);
            const metadata = {
              name: `EP legislative resolution - ${config.title}`,
              workUri: `/akn/eu/amendment/ep/${config.voteDate}/${taFile?.replace(".html", "")}/main`,
              expressionUri: `/akn/eu/amendment/ep/${config.voteDate}/${taFile?.replace(".html", "")}/eng@${config.voteDate}`,
              date: config.voteDate,
              dateName: "EP First Reading",
              voteFor: config.voteFor,
              voteAgainst: config.voteAgainst,
              voteAbstain: config.voteAbstain,
              prefaceTitle: `EP legislative resolution on ${config.title}`,
            };
            const metaTmpPath = join(srcDir, `_ep-meta-${slug}.json`);
            writeFileSync(metaTmpPath, JSON.stringify(metadata, null, 2), "utf-8");

            const { ok, err } = runCmd(
              `${NODE} poc-eurlex-ep-amendments.ts "${epHtmlPath}" "${F.epAmendments}" "${metaTmpPath}"`,
              30000,
            );
            if (ok && existsSync(F.epAmendments)) {
              const xml = readFileSync(F.epAmendments, "utf-8");
              const changes = countTag(xml, "akndiff:articleChange");
              record(num, id, name, changes > 0 ? "PASS" : "WARN",
                changes > 0 ? `${changes} article changes` : "0 articleChange", t0);
            } else {
              record(num, id, name, "FAIL", err || "output not created", t0);
            }
          }
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRE-STEP 6: Generate viewer-config.json
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const hasEpAmendments = existsSync(F.epAmendments);
    const bill = parseBillCelex(billCelex);
    const final = parseFinalCelex(finalCelex);
    const typePrefix = final?.type === "L" ? "dir" : final?.type === "D" ? "dec" : "reg";

    const viewerConfig = {
      slug: `${slug}-regulation`,
      sourcesDir: "sources",
      outputDir: "akn",
      billFile: `${billCelex}-bill-akn.xml`,
      finalFile: `${finalCelex}-akn.xml`,
      changesetFile: `changeset-${slug}.xml`,
      epAmendmentsFile: hasEpAmendments ? `ep-amendments-${slug}.xml` : null,
      proposal: {
        celex: billCelex,
        comYear: bill?.comYear ?? 0,
        comNum: bill?.comNum ?? 0,
        date: config.comDate ?? config.voteDate,
        title: `${config.title} — COM(${bill?.comYear ?? "?"}) ${bill?.comNum ?? "?"} Proposal`,
      },
      final: {
        celex: finalCelex,
        regYear: final?.regYear ?? 0,
        regNum: final?.regNum ?? 0,
        date: config.pubDate ?? config.voteDate,
        pubDate: config.pubDate ?? config.voteDate,
        title: `${final?.type === "L" ? "Directive" : final?.type === "D" ? "Decision" : "Regulation"} (EU) ${final?.regYear ?? "?"}/${final?.regNum ?? "?"} — ${config.title}`,
      },
      legislativeProcedure: {
        procedure: config.procedure,
        voteDate: config.voteDate,
        voteFor: config.voteFor,
        voteAgainst: config.voteAgainst,
        voteAbstain: config.voteAbstain,
      },
    };
    writeFileSync(F.viewerConfig, JSON.stringify(viewerConfig, null, 2), "utf-8");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 6: Viewer XMLs
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const id = "viewer-xmls", num = 6, name = "Viewer XMLs";
    const t0 = Date.now();
    const blockMsg = depsFailed(["akn-diff"]);

    if (blockMsg) {
      record(num, id, name, "FAIL", blockMsg, t0);
    } else {
      const { ok, err } = runCmd(
        `${NODE} generate-viewer-xmls.ts "${F.viewerConfig}"`,
        30000,
      );
      if (ok) {
        const hasEp = existsSync(F.epAmendments);
        const expectedFiles = [
          "01-act-original.xml",
          ...(hasEp ? ["02-amendment-1.xml"] : []),
          "03-amendment-2.xml",
          "04-act-final.xml",
        ];
        const existing = expectedFiles.filter((f) => existsSync(join(aknDir, f)));
        const withContent = existing.filter((f) => {
          const xml = readFileSync(join(aknDir, f), "utf-8");
          return f.startsWith("01-") || f.startsWith("04-")
            ? countTag(xml, "article") > 0
            : countTag(xml, "akndiff:articleChange") > 0 || countTag(xml, "section") > 0;
        });
        if (existing.length === expectedFiles.length && withContent.length === existing.length)
          record(num, id, name, "PASS", `${existing.length} files`, t0);
        else
          record(num, id, name, "WARN",
            `${existing.length}/${expectedFiles.length} files, ${withContent.length} with content`, t0);
      } else {
        record(num, id, name, "FAIL", err || "unknown error", t0);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 7: Communication
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const id = "communication", num = 7, name = "Communication";
    const t0 = Date.now();

    if (existsSync(commPath)) {
      const xml = readFileSync(commPath, "utf-8");
      const events = countTag(xml, "section");
      record(num, id, name, events > 0 ? "PASS" : "FAIL",
        events > 0 ? `${events} events (cached)` : "0 events cached", t0);
    } else {
      const procYear = config.procedure.substring(0, 4);
      // EP API expects "2021-0106" not "2021/0106"
      const procApiId = config.procedure.replace(/\(.*\)/, "").replace("/", "-");
      const { ok, err } = runCmd(
        `${NODE} poc-epdata-to-communication.ts ${procYear} ${procApiId} --type=${procType} --output="${commPath}"`,
        60000,
      );
      if (ok && existsSync(commPath)) {
        const xml = readFileSync(commPath, "utf-8");
        const events = countTag(xml, "section");
        record(num, id, name, events > 0 ? "PASS" : "WARN",
          events > 0 ? `${events} events` : "0 events", t0);
      } else {
        const cleanErr = err
          ? (err.match(/HTTP (\d+)/)?.[0] ?? err.slice(0, 80))
          : "unknown error";
        record(num, id, name, "FAIL", cleanErr, t0);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 8: Votes
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const id = "votes", num = 8, name = "Votes";
    const t0 = Date.now();

    if (existsSync(votesPath)) {
      const xml = readFileSync(votesPath, "utf-8");
      const decisions = countTag(xml, "section");
      record(num, id, name, decisions > 0 ? "PASS" : "FAIL",
        decisions > 0 ? `${decisions} decisions (cached)` : "0 decisions cached", t0);
    } else {
      const voteYear = config.voteDate.split("-")[0];
      const { ok, err } = runCmd(
        `${NODE} poc-epdata-to-vote.ts ${voteYear} --meeting=${meetingId} --output="${votesPath}"`,
        60000,
      );
      if (ok && existsSync(votesPath)) {
        const xml = readFileSync(votesPath, "utf-8");
        const decisions = countTag(xml, "section");
        record(num, id, name, decisions > 0 ? "PASS" : "WARN",
          decisions > 0 ? `${decisions} decisions` : "0 decisions", t0);
      } else {
        record(num, id, name, "FAIL", err || "output not created", t0);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 9: Citation (plenary agenda)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const id = "citation", num = 9, name = "Citation";
    const t0 = Date.now();
    const citationFile = `eu-citation-${meetingId}.xml`;
    const citationPath = join(srcDir, citationFile);

    if (existsSync(citationPath)) {
      const xml = readFileSync(citationPath, "utf-8");
      const items = countTag(xml, "section");
      record(num, id, name, items > 0 ? "PASS" : "FAIL",
        items > 0 ? `${items} agenda items (cached)` : "0 items cached", t0);
    } else {
      const voteYear = config.voteDate.split("-")[0];
      const { ok, err } = runCmd(
        `${NODE} poc-epdata-to-citation.ts ${voteYear} --meeting=${meetingId} --output="${citationPath}"`,
        60000,
      );
      if (ok && existsSync(citationPath)) {
        const xml = readFileSync(citationPath, "utf-8");
        const items = countTag(xml, "section");
        record(num, id, name, items > 0 ? "PASS" : "WARN",
          items > 0 ? `${items} agenda items` : "0 items", t0);
      } else {
        record(num, id, name, "FAIL", err || "output not created", t0);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 10: Official Gazette (OJ TOC)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const id = "gazette", num = 10, name = "Gazette";
    const t0 = Date.now();
    const gazetteTocPath = join(srcDir, `${finalCelex}-toc-formex.xml`);
    const gazetteAknPath = join(srcDir, `gazette-${slug}.xml`);

    if (existsSync(gazetteAknPath)) {
      const xml = readFileSync(gazetteAknPath, "utf-8");
      const docs = countTag(xml, "component");
      record(num, id, name, docs > 0 ? "PASS" : "FAIL",
        docs > 0 ? `${docs} OJ entries (cached)` : "0 entries cached", t0);
    } else {
      // Download the TOC formex from CELLAR (Formex ZIP includes TOC files)
      if (!existsSync(gazetteTocPath)) {
        const { ok } = runCmdRetry(
          `${NODE} poc-cellar-download-formex.ts ${finalCelex} "${srcDir}" --toc`,
          120000,
        );
        // Rename if needed: the script may output with a different name
        if (!ok || !existsSync(gazetteTocPath)) {
          record(num, id, name, "WARN", "TOC formex not available from CELLAR", t0);
        }
      }

      if (existsSync(gazetteTocPath) && !results.find((r) => r.id === id)) {
        const { ok, err } = runCmd(
          `${NODE} poc-formex-toc-to-gazette.ts "${gazetteTocPath}" "${gazetteAknPath}"`,
          30000,
        );
        if (ok && existsSync(gazetteAknPath)) {
          const xml = readFileSync(gazetteAknPath, "utf-8");
          const docs = countTag(xml, "component");
          record(num, id, name, docs > 0 ? "PASS" : "WARN",
            docs > 0 ? `${docs} OJ entries` : "0 entries", t0);
        } else {
          record(num, id, name, "FAIL", err || "conversion failed", t0);
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CROSS-CHECKS
  // ═══════════════════════════════════════════════════════════════════════════
  const checks: CrossCheck[] = [];

  if (existsSync(F.bill)) {
    const uri = extractFRBRuri(readFileSync(F.bill, "utf-8")) || "";
    const match = celexMatchesUri(billCelex, uri);
    checks.push({ name: "Bill CELEX match", status: match ? "PASS" : "WARN", detail: match ? "" : `FRBRuri: ${uri}` });
  }

  if (existsSync(F.finalAkn)) {
    const uri = extractFRBRuri(readFileSync(F.finalAkn, "utf-8")) || "";
    const match = celexMatchesUri(finalCelex, uri);
    checks.push({ name: "Final CELEX match", status: match ? "PASS" : "WARN", detail: match ? "" : `FRBRuri: ${uri}` });
  }

  if (billArticles > 0 && finalArticles > 0) {
    checks.push({
      name: `Articles ${billArticles}\u2192${finalArticles}`,
      status: finalArticles >= billArticles ? "PASS" : "WARN",
      detail: finalArticles >= billArticles ? "(growth OK)" : "final < bill",
    });
  }

  if (billArticles > 0 && finalArticles > 0 && changeInsertions >= 0) {
    const expected = billArticles + changeInsertions;
    checks.push({
      name: `Changeset ${billArticles}+${changeInsertions}=${finalArticles}`,
      status: expected === finalArticles ? "PASS" : "WARN",
      detail: expected === finalArticles ? "\u2713" : `expected ${expected}`,
    });
  }

  checks.push({
    name: "Vote date",
    status: "PASS",
    detail: `${meetingId} (auto-discovered)`,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REPORT
  // ═══════════════════════════════════════════════════════════════════════════
  const totalElapsed = Date.now() - t0Global;
  const BAR = "\u2550".repeat(55);
  const lines: string[] = [];

  lines.push(BAR);
  lines.push(`  EU AKN Pipeline: ${slug}`);
  lines.push(`  Procedure: ${config.procedure}`);
  lines.push(`  Title: ${config.title}`);
  lines.push(BAR);

  for (const r of results) {
    const status = `[${r.status}]`;
    const stepLabel = `${r.step}. ${r.name}`;
    lines.push(`  ${pad(status, 6)}  ${pad(stepLabel, 22)} ${pad(r.detail, 35)} ${fmtTime(r.elapsed)}`);
  }

  if (checks.length > 0) {
    lines.push("");
    lines.push("  Cross-checks:");
    for (const c of checks) {
      const detail = c.detail ? ` ${c.detail}` : "";
      lines.push(`  [${c.status}]  ${c.name}${detail}`);
    }
  }

  const pass = results.filter((r) => r.status === "PASS").length;
  const fail = results.filter((r) => r.status === "FAIL").length;
  const warn = results.filter((r) => r.status === "WARN").length;

  lines.push("");
  lines.push(`  RESULT: ${pass} pass, ${fail} fail, ${warn} warn (${fmtTime(totalElapsed)})`);
  lines.push(BAR);

  const report = lines.join("\n");
  console.log(report);

  const reportPath = join(regDir, "pipeline-report.txt");
  writeFileSync(reportPath, report, "utf-8");
  console.log(`\nReport saved: ${reportPath}`);

  // Save discovered config for reference
  const configPath = join(regDir, "discovered-config.json");
  writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
  console.log(`Discovered config saved: ${configPath}`);

  if (fail > 0) process.exit(1);
}

// ─── Entry ───────────────────────────────────────────────────────────────────

async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('Usage: node --experimental-strip-types run-pipeline.ts "YYYY/NNNN(COD)"');
    process.exit(1);
  }

  // Auto-discovery mode: procedure ID (any type)
  if (/^\d{4}\/\d+\(\w+\)$/.test(input)) {
    const config = await discoverProcedure(input);
    await runPipeline(config);
  } else {
    console.error('Input must be a procedure ID like "2020/0374(COD)"');
    process.exit(1);
  }
}

main();
