/**
 * PoC: CELLAR Formex Downloader
 *
 * Given a CELEX number (e.g. 32018R1645), downloads the Formex XML body from
 * the EU CELLAR API using content negotiation.
 *
 * Handles two CELLAR formats:
 *   - Raw XML (older documents): DOC contains <ACT> directly
 *   - ZIP (newer documents): DOC is a ZIP containing .fmx.xml files
 *
 * Strategy:
 *   1. Fetch metadata (notice=branch) to find cellar DOC URLs
 *   2. Try each DOC — if XML, check for Formex body; if ZIP, extract .fmx.xml
 *   3. Save the first file that contains an actual Formex act body
 *
 * Usage:
 *   node --experimental-strip-types poc-cellar-download-formex.ts [CELEX] [output-dir]
 *
 * Examples:
 *   node --experimental-strip-types poc-cellar-download-formex.ts 32018R1645
 *   node --experimental-strip-types poc-cellar-download-formex.ts 32024R2847 samples/act
 *
 * Zero npm dependencies — uses only Node.js built-in modules.
 */

import https from "node:https";
import http from "node:http";
import { writeFileSync, mkdirSync } from "node:fs";
import { inflateRawSync } from "node:zlib";

// ─── Config ──────────────────────────────────────────────────────────────────

const CELEX = process.argv[2] || "32018R1645";
const OUTPUT_DIR = process.argv[3] || "samples/act";
const CELLAR_BASE = "https://publications.europa.eu/resource/celex";

// ─── HTTP helper (returns Buffer for binary support) ─────────────────────────

function fetchBuffer(url: string, accept: string, lang = "en"): Promise<{ status: number; buffer: Buffer; contentType: string }> {
  return new Promise((resolve, reject) => {
    const doRequest = (targetUrl: string, redirects = 0) => {
      if (redirects > 10) return reject(new Error("Too many redirects"));
      const isHttps = targetUrl.startsWith("https:");
      const mod = isHttps ? https : http;

      mod.get(targetUrl, {
        headers: { Accept: accept, "Accept-Language": lang, "User-Agent": "Mozilla/5.0 poc-cellar-download-formex" },
      }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const loc = res.headers.location.startsWith("http")
            ? res.headers.location
            : new URL(res.headers.location, targetUrl).href;
          return doRequest(loc, redirects + 1);
        }
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => resolve({
          status: res.statusCode ?? 0,
          buffer: Buffer.concat(chunks),
          contentType: (res.headers["content-type"] ?? "") as string,
        }));
        res.on("error", reject);
      }).on("error", reject);
    };
    doRequest(url);
  });
}

// ─── Minimal ZIP extractor (zero deps) ───────────────────────────────────────
// Reads local file headers (PK\x03\x04) and extracts deflated or stored entries.

function extractZipEntries(zip: Buffer): { name: string; data: Buffer }[] {
  const entries: { name: string; data: Buffer }[] = [];

  // Find End of Central Directory (EOCD) record — scan backwards for PK\x05\x06
  let eocdOffset = -1;
  for (let i = zip.length - 22; i >= 0; i--) {
    if (zip[i] === 0x50 && zip[i + 1] === 0x4b && zip[i + 2] === 0x05 && zip[i + 3] === 0x06) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) return entries;

  const cdEntries = zip.readUInt16LE(eocdOffset + 10);
  let cdOffset = zip.readUInt32LE(eocdOffset + 16);

  // Read central directory entries (PK\x01\x02) — these always have correct sizes
  for (let i = 0; i < cdEntries && cdOffset + 46 < zip.length; i++) {
    if (zip[cdOffset] !== 0x50 || zip[cdOffset + 1] !== 0x4b || zip[cdOffset + 2] !== 0x01 || zip[cdOffset + 3] !== 0x02) break;

    const method = zip.readUInt16LE(cdOffset + 10);
    const compressedSize = zip.readUInt32LE(cdOffset + 20);
    const nameLen = zip.readUInt16LE(cdOffset + 28);
    const extraLen = zip.readUInt16LE(cdOffset + 30);
    const commentLen = zip.readUInt16LE(cdOffset + 32);
    const localHeaderOffset = zip.readUInt32LE(cdOffset + 42);
    const name = zip.subarray(cdOffset + 46, cdOffset + 46 + nameLen).toString("utf-8");

    // Read local header to find data start (local header may have different extra field length)
    if (localHeaderOffset + 30 < zip.length) {
      const localNameLen = zip.readUInt16LE(localHeaderOffset + 26);
      const localExtraLen = zip.readUInt16LE(localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;

      if (compressedSize > 0 && dataStart + compressedSize <= zip.length) {
        const compressedData = zip.subarray(dataStart, dataStart + compressedSize);
        let data: Buffer;

        if (method === 0) {
          data = compressedData;
        } else if (method === 8) {
          try { data = inflateRawSync(compressedData); } catch { cdOffset += 46 + nameLen + extraLen + commentLen; continue; }
        } else {
          cdOffset += 46 + nameLen + extraLen + commentLen;
          continue;
        }

        entries.push({ name, data });
      }
    }

    cdOffset += 46 + nameLen + extraLen + commentLen;
  }

  return entries;
}

// ─── Formex detection ────────────────────────────────────────────────────────

function isFormexBody(xml: string): boolean {
  return (
    xml.includes("<ACT") ||
    xml.includes("<REGULATION") ||
    xml.includes("<DIRECTIVE") ||
    xml.includes("<DECISION") ||
    xml.includes("<ENACTING.TERMS") ||
    xml.includes("<PREAMBLE>") ||
    xml.includes("<PREAMBLE ")
  );
}

// ─── Extract DOC URLs from notice XML ────────────────────────────────────────

function extractDocUrls(noticeXml: string): string[] {
  const urls: string[] = [];
  const regex = /http:\/\/publications\.europa\.eu\/resource\/cellar\/[a-f0-9-]+\.\d{4}\.\d{2}\/DOC_\d+/g;
  let match;
  while ((match = regex.exec(noticeXml)) !== null) {
    urls.push(match[0]);
  }
  return [...new Set(urls)];
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Downloading Formex for CELEX: ${CELEX}\n`);

  // Step 1: Get branch notice to find DOC URLs
  console.log("1. Fetching metadata (notice=branch)...");
  const noticeUrl = `${CELLAR_BASE}/${CELEX}`;
  const notice = await fetchBuffer(noticeUrl, "application/xml;notice=branch", "en");

  if (notice.status !== 200) {
    console.error(`   HTTP ${notice.status} — CELEX may not exist or have no English version.`);
    console.error(`   ${notice.buffer.toString("utf-8").slice(0, 200)}`);
    process.exit(1);
  }

  const noticeXml = notice.buffer.toString("utf-8");
  const docUrls = extractDocUrls(noticeXml);
  console.log(`   Found ${docUrls.length} DOC URLs`);

  if (docUrls.length === 0) {
    console.error("   No DOC URLs found. This CELEX may not have downloadable Formex.");
    process.exit(1);
  }

  // Step 2: Try each DOC URL
  console.log("\n2. Checking each DOC for Formex content...");

  for (const docUrl of docUrls) {
    const shortId = docUrl.split("/cellar/")[1];
    process.stdout.write(`   ${shortId} → `);

    const resp = await fetchBuffer(docUrl, "*/*");
    if (resp.status !== 200) {
      console.log(`HTTP ${resp.status} (skip)`);
      continue;
    }

    const ct = resp.contentType.toLowerCase();

    // Case A: Direct XML with Formex body
    if (ct.includes("fmx4") || (ct.includes("xml") && !ct.includes("xhtml") && !ct.includes("rdf"))) {
      const text = resp.buffer.toString("utf-8");
      if (isFormexBody(text)) {
        console.log(`XML Formex body (${text.length} bytes)`);
        return saveResult(text);
      }
      console.log(`XML but no Formex body (${text.length} bytes)`);
      continue;
    }

    // Case B: ZIP containing .fmx.xml files
    if (ct.includes("zip")) {
      console.log(`ZIP (${resp.buffer.length} bytes) — extracting...`);
      const entries = extractZipEntries(resp.buffer);
      console.log(`     ${entries.length} files in ZIP: ${entries.map(e => e.name).join(", ")}`);

      // Look for .fmx.xml files (the actual Formex body)
      for (const entry of entries) {
        if (entry.name.endsWith(".fmx.xml") && !entry.name.includes("toc")) {
          const text = entry.data.toString("utf-8");
          if (isFormexBody(text)) {
            console.log(`     ✓ ${entry.name} has Formex body (${text.length} bytes)`);
            return saveResult(text);
          }
          console.log(`     ${entry.name}: no Formex body tags`);
        }
      }

      // If no .fmx.xml with body, try any XML in the ZIP
      for (const entry of entries) {
        if (entry.name.endsWith(".xml") && !entry.name.includes("toc")) {
          const text = entry.data.toString("utf-8");
          if (isFormexBody(text)) {
            console.log(`     ✓ ${entry.name} has Formex body (${text.length} bytes)`);
            return saveResult(text);
          }
        }
      }
      console.log("     No Formex body found in ZIP entries");
      continue;
    }

    // Case C: PDF, XHTML, etc — skip
    if (ct.includes("pdf")) {
      console.log("PDF (skip)");
    } else if (ct.includes("xhtml") || ct.includes("html")) {
      console.log(`XHTML (${resp.buffer.length} bytes, skip)`);
    } else if (ct.includes("rdf")) {
      console.log("RDF metadata (skip)");
    } else {
      console.log(`${ct} (${resp.buffer.length} bytes, skip)`);
    }
  }

  console.error("\nNo Formex body found. Possible reasons:");
  console.error("  - This CELEX is a COM proposal (5xxxx) → use poc-cellar-to-bill.ts instead");
  console.error("  - This document only has PDF/XHTML, no Formex XML");
  console.error("  - The Formex may be under a different expression/language");
  process.exit(1);
}

function saveResult(xml: string) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const outPath = `${OUTPUT_DIR}/${CELEX}-formex.xml`;
  writeFileSync(outPath, xml, "utf-8");

  // Extract info
  const rootMatch = xml.match(/<(ACT|REGULATION|DIRECTIVE|DECISION)\b/);
  const rootTag = rootMatch?.[1] ?? "unknown";
  const artCount = (xml.match(/<ARTICLE\b/g) || []).length;
  const titleMatch = xml.match(/<TI><P>([\s\S]*?)<\/P>/);
  const title = titleMatch?.[1]?.replace(/<[^>]+>/g, "").slice(0, 120) ?? "";

  console.log(`\n═══ Result ═══`);
  console.log(`File:     ${outPath} (${xml.length} bytes)`);
  console.log(`Root:     <${rootTag}>`);
  console.log(`Articles: ${artCount}`);
  if (title) console.log(`Title:    ${title}...`);
  console.log(`═══════════════`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
