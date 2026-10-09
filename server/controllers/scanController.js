const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const axios = require("axios");
const dns = require("dns").promises;
const ScanResult = require("../models/ScanResult");

function extractDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return url.replace(/https?:\/\//, "").replace(/\/.*/, "").replace(/^www\./, ""); }
}

async function runHeaders(url) {
  try {
    const res = await axios.get(url, { timeout: 8000, maxRedirects: 0, validateStatus: () => true });
    return Object.entries(res.headers).map(([k, v]) => `${k}: ${v}`);
  } catch (e) { return ["Error: " + e.message]; }
}

async function runRedirect(url) {
  const chain = [];
  let current = url;
  try {
    for (let i = 0; i < 6; i++) {
      const res = await axios.get(current, { timeout: 8000, maxRedirects: 0, validateStatus: () => true });
      chain.push(res.status + " -> " + current);
      if (res.status >= 300 && res.status < 400 && res.headers.location) {
        current = res.headers.location.startsWith("http") ? res.headers.location : new URL(res.headers.location, current).href;
      } else { chain.push("Final: " + res.status + " OK"); break; }
    }
  } catch (e) { chain.push("Error: " + e.message); }
  return chain;
}

async function runMetadata(url) {
  try {
    const res = await axios.get(url, { timeout: 8000, validateStatus: () => true });
    const html = res.data;
    const results = [];
    const gen = html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/i);
    if (gen) results.push("Generator: " + gen[1]);
    const title = html.match(/<title>([^<]+)<\/title>/i);
    if (title) results.push("Page Title: " + title[1].trim());
    if (html.includes("wp-content")) results.push("CMS: WordPress detected");
    if (html.includes("Joomla"))     results.push("CMS: Joomla detected");
    if (html.includes("Drupal"))     results.push("CMS: Drupal detected");
    try { await axios.get(new URL("/robots.txt", url).href, { timeout: 4000 }); results.push("robots.txt: Found"); }
    catch { results.push("robots.txt: Not found"); }
    return results.length ? results : ["No metadata extracted"];
  } catch (e) { return ["Error: " + e.message]; }
}

async function runDns(domain) {
  const results = [];
  const safe = async (fn, label) => { try { const r = await fn(); r.forEach(x => results.push(label + ": " + x)); } catch {} };
  await safe(() => dns.resolve4(domain), "A");
  await safe(() => dns.resolve6(domain), "AAAA");
  await safe(() => dns.resolveMx(domain).then(r => r.map(x => x.exchange + " (priority " + x.priority + ")")), "MX");
  await safe(() => dns.resolveNs(domain), "NS");
  await safe(() => dns.resolveTxt(domain).then(r => r.map(x => x.join(" "))), "TXT");
  return results.length ? results : ["No DNS records found"];
}

async function runWhois(domain) {
  try {
    const res = await axios.get("https://rdap.org/domain/" + domain, { timeout: 8000 });
    const d = res.data;
    const out = [];
    if (d.ldhName) out.push("Domain: " + d.ldhName);
    if (d.status)  out.push("Status: " + d.status.join(", "));
    if (d.events)  d.events.forEach(e => out.push(e.eventAction + ": " + e.eventDate));
    if (d.nameservers) d.nameservers.forEach(n => out.push("NS: " + n.ldhName));
    return out.length ? out : ["RDAP query completed for " + domain];
  } catch (e) { return ["WHOIS/RDAP error: " + e.message]; }
}

async function runVirusTotal(domain) {
  const key = process.env.VIRUSTOTAL_API_KEY;
  if (!key) return ["VirusTotal: Add VIRUSTOTAL_API_KEY to server/.env to enable"];

  // Clean domain — strip www., ports, paths
  const cleanDomain = domain
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
    .toLowerCase()
    .trim();

  try {
    const res = await axios.get(
      `https://www.virustotal.com/api/v3/domains/${cleanDomain}`,
      { headers: { "x-apikey": key }, timeout: 15000 }
    );
    const s   = res.data?.data?.attributes?.last_analysis_stats || {};
    const rep = res.data?.data?.attributes?.reputation ?? "N/A";
    const cats = res.data?.data?.attributes?.categories || {};
    const catList = Object.values(cats).join(", ") || "None";
    return [
      `Domain     : ${cleanDomain}`,
      `Malicious  : ${s.malicious  ?? 0}`,
      `Suspicious : ${s.suspicious ?? 0}`,
      `Clean      : ${s.harmless   ?? 0}`,
      `Undetected : ${s.undetected ?? 0}`,
      `Reputation : ${rep}`,
      `Categories : ${catList}`,
    ];
  } catch (e) {
    const status = e.response?.status;
    if (status === 404) return [`VirusTotal: Domain "${cleanDomain}" not found in VT database (never scanned)`];
    if (status === 401) return ["VirusTotal: Invalid API key — check VIRUSTOTAL_API_KEY in server/.env"];
    if (status === 429) return ["VirusTotal: Rate limit hit — free tier allows 4 requests/min"];
    return [`VirusTotal error: ${status || e.message}`];
  }
}

async function runUrlScan(url) {
  const key = process.env.URLSCAN_API_KEY;
  if (!key) return ["URLScan: Add URLSCAN_API_KEY to server/.env to enable"];

  try {
    // ── Step 1: Submit ────────────────────────────────────────
    const submit = await axios.post(
      "https://urlscan.io/api/v1/scan/",
      { url, visibility: "public" },
      { headers: { "API-Key": key, "Content-Type": "application/json" }, timeout: 15000 }
    );
    const uuid      = submit.data.uuid;
    const resultUrl = `https://urlscan.io/result/${uuid}/`;
    const apiUrl    = `https://urlscan.io/api/v1/result/${uuid}/`;

    // ── Step 2: Poll until ready (max 60s, every 5s) ────────
    let data = null;
    for (let i = 0; i < 12; i++) {
      await new Promise(r => setTimeout(r, 5000));
      try {
        const r = await axios.get(apiUrl, { timeout: 15000 });
        data = r.data;
        break;
      } catch (e) {
        if (e.response?.status !== 404) continue; // 404 = still processing, keep waiting
        break; // any other error — stop
      }
    }

    if (!data) {
      return [
        `URLSCAN.IO RESULT`,
        `──────────────────────────────────────`,
        `Status    : Submitted — still processing`,
        `UUID      : ${uuid}`,
        `View At   : ${resultUrl}`,
      ];
    }

    // ── Step 3: Extract all fields ───────────────────────────
    const page     = data.page     || {};
    const task     = data.task     || {};
    const stats    = data.stats    || {};
    const lists    = data.lists    || {};
    const verdicts = data.verdicts || {};
    const meta     = data.meta     || {};
    const overall  = verdicts.overall || {};
    const urlscanV = verdicts.urlscan  || {};
    const enginesV = verdicts.engines  || {};

    // Technologies (Wappa)
    const techs = (meta?.processors?.wappa?.data || [])
      .map(t => `${t.app}${t.categories?.length ? " ("+t.categories.map(c=>c.name).join(", ")+")" : ""}`)
      .join(" | ") || "None detected";

    // Certificates
    const certs = (lists.certificates || []).slice(0, 3).map(c =>
      `${c.subjectName || "?"} | Issuer: ${c.issuer || "?"} | Valid: ${c.validFrom ? new Date(c.validFrom*1000).toISOString().split("T")[0] : "?"} → ${c.validTo ? new Date(c.validTo*1000).toISOString().split("T")[0] : "?"}`
    );

    // IPs + ASNs
    const ips     = (lists.ips     || []).slice(0, 10);
    const asns    = (lists.asns    || []).slice(0, 6);
    const domains = (lists.domains || []).slice(0, 10);
    const countries = [...new Set(lists.countries || [])];
    const linkDomains = (lists.linkDomains || []).slice(0, 8);
    const hashes  = (lists.hashes  || []).slice(0, 5);

    // HTTP stats
    const httpStats = stats.resourceStats || [];
    const mimeTypes = (stats.mimeTypes || []).map(m => `${m.type}: ${m.count}`).join(" | ");
    const protocols = (stats.protocolStats || []).map(p => `${p.protocol}: ${p.count} reqs`).join(" | ");

    // Verdict
    const malicious  = overall.malicious  ? "⚠  MALICIOUS"  : "✅ Clean";
    const score      = overall.score      ?? 0;
    const tags       = (overall.tags || []).join(", ") || "None";
    const brands     = (overall.brands || []).map(b => b.name).join(", ") || "None";

    // Engine verdicts
    const engineMal  = enginesV.malicious  ?? 0;
    const engineBen  = enginesV.benign     ?? 0;
    const engineTotal= (enginesV.verdicts  || []).length;

    // Requests breakdown
    const totalReqs  = stats.requests       ?? 0;
    const uniqDoms   = stats.uniqDomains    ?? 0;
    const uniqIPs    = stats.uniqIPs        ?? 0;
    const dataLen    = stats.dataLength     ?? 0;
    const encodedLen = stats.encodedDataLength ?? 0;
    const tlsReqs    = stats.tlsRequests    ?? 0;
    const ipv6Reqs   = stats.IPv6Requests   ?? 0;

    // Geo
    const serverCountry = page.country     || "N/A";
    const serverCity    = page.city        || "";
    const asnName       = page.asnname     || page.asn || "N/A";
    const ptr           = page.ptr         || "N/A";

    const out = [
      `╔══ URLSCAN.IO FULL REPORT ═══════════════════════════╗`,
      ``,
      `── TARGET ─────────────────────────────────────────────`,
      `URL          : ${task.url       || url}`,
      `Domain       : ${page.domain    || "N/A"}`,
      `Final URL    : ${page.url       || "N/A"}`,
      `Submitted    : ${task.time      || new Date().toISOString()}`,
      `Visibility   : ${task.visibility|| "public"}`,
      ``,
      `── VERDICT ────────────────────────────────────────────`,
      `Overall      : ${malicious}`,
      `Score        : ${score} / 100`,
      `Tags         : ${tags}`,
      `Brands Found : ${brands}`,
      `Engine Checks: ${engineMal} malicious, ${engineBen} benign (${engineTotal} engines)`,
      ``,
      `── SERVER INFO ─────────────────────────────────────────`,
      `IP Address   : ${page.ip        || "N/A"}`,
      `PTR Record   : ${ptr}`,
      `ASN          : ${page.asn       || "N/A"} — ${asnName}`,
      `Country      : ${serverCountry}${serverCity ? " / " + serverCity : ""}`,
      `Server       : ${page.server    || "N/A"}`,
      `Status Code  : ${page.statusCode|| "N/A"}`,
      `MIME Type    : ${page.mimeType  || "N/A"}`,
      ``,
      `── PAGE INFO ───────────────────────────────────────────`,
      `Title        : ${page.title     || "N/A"}`,
      ``,
      `── TLS / HTTPS ─────────────────────────────────────────`,
      ...(certs.length
        ? certs.map((c, i) => `Cert ${i + 1}       : ${c}`)
        : [`TLS Cert     : N/A`]
      ),
      ``,
      `── HTTP STATISTICS ─────────────────────────────────────`,
      `Total Requests : ${totalReqs}`,
      `HTTPS Requests : ${tlsReqs}`,
      `IPv6 Requests  : ${ipv6Reqs}`,
      `Unique Domains : ${uniqDoms}`,
      `Unique IPs     : ${uniqIPs}`,
      `Data Transfer  : ${(dataLen / 1024).toFixed(1)} kB (encoded: ${(encodedLen / 1024).toFixed(1)} kB)`,
      `MIME Breakdown : ${mimeTypes || "N/A"}`,
      `Protocols      : ${protocols || "N/A"}`,
      ``,
      `── NETWORK — IP ADDRESSES ──────────────────────────────`,
      ...(ips.length ? ips.map(ip => `IP           : ${ip}`) : ["IP           : N/A"]),
      ``,
      `── NETWORK — ASNs ──────────────────────────────────────`,
      ...(asns.length ? asns.map(a => `ASN          : ${a}`) : ["ASN          : N/A"]),
      ``,
      `── NETWORK — COUNTRIES ─────────────────────────────────`,
      `Countries    : ${countries.join(", ") || "N/A"}`,
      ``,
      `── DOMAINS CONTACTED ───────────────────────────────────`,
      ...(domains.length ? domains.map(d => `Domain       : ${d}`) : ["Domain       : N/A"]),
      ``,
      `── LINKED DOMAINS ──────────────────────────────────────`,
      ...(linkDomains.length ? linkDomains.map(d => `Linked       : ${d}`) : ["Linked       : N/A"]),
      ``,
      `── DETECTED TECHNOLOGIES ───────────────────────────────`,
      `Tech Stack   : ${techs}`,
      ``,
      `── RESOURCE HASHES (SHA256) ────────────────────────────`,
      ...(hashes.length ? hashes.map(h => `Hash         : ${h}`) : ["Hash         : N/A"]),
      ``,
      `── LINKS ───────────────────────────────────────────────`,
      `Full Report  : ${resultUrl}`,
      `UUID         : ${uuid}`,
      `╚═══════════════════════════════════════════════════════╝`,
    ];

    return out;

  } catch (e) {
    const status = e.response?.status;
    if (status === 400) return ["URLScan: Invalid URL format"];
    if (status === 401) return ["URLScan: Invalid API key — check URLSCAN_API_KEY in server/.env"];
    if (status === 429) return ["URLScan: Rate limit hit — wait a minute and retry"];
    return [`URLScan error: ${status || e.message}`];
  }
}

exports.runScan = async (req, res) => {
  const { url, modules = [] } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });
  const domain = extractDomain(url);
  const results = {};
  const log = [];
  const push = msg => log.push("[" + new Date().toLocaleTimeString("en-US", { hour12: false }) + "] " + msg);
  push("Initializing Recatron sequence...");
  let scanDoc = null;
  try { scanDoc = await ScanResult.create({ url, domain, modules, results: {}, status: "running" }); } catch {}
  const moduleMap = {
    headers:    async () => { push("Fetching HTTP headers...");       return runHeaders(url); },
    redirect:   async () => { push("Analyzing redirect chain...");    return runRedirect(url); },
    metadata:   async () => { push("Extracting page metadata...");    return runMetadata(url); },
    dns:        async () => { push("Resolving DNS records...");       return runDns(domain); },
    whois:      async () => { push("Querying RDAP/WHOIS...");        return runWhois(domain); },
    virustotal: async () => { push("Connecting to VirusTotal...");    return runVirusTotal(domain); },
    urlscan:    async () => { push("Submitting to URLScan... (fetching result, please wait up to 60s)"); return runUrlScan(url); },
    dorks:      async () => { push("Dork intelligence preloaded..."); return ["See Dork Intel panel for full dork set"]; },
  };
  const active = modules.length ? modules : Object.keys(moduleMap);
  for (const mod of active) { if (moduleMap[mod]) results[mod] = await moduleMap[mod](); }
  push("Scan complete. All modules finished.");
  try { if (scanDoc) await ScanResult.findByIdAndUpdate(scanDoc._id, { results, status: "complete" }); } catch {}
  res.json({ domain, url, results, log, scanId: scanDoc?._id || null });
};

exports.getScanById = async (req, res) => {
  try {
    const scan = await ScanResult.findById(req.params.id);
    if (!scan) return res.status(404).json({ error: "Scan not found" });
    res.json(scan);
  } catch (e) { res.status(500).json({ error: e.message }); }
};
