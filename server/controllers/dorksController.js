const fs   = require("fs");
const path = require("path");

const DORKS_DIR = path.join(__dirname, "../dorks");

// ── Category metadata ─────────────────────────────────────────
const CATEGORIES = {
  "Bug Bounty":      { file: "bugbounty.txt",      icon: "⊛", desc: "Bug bounty program discovery dorks" },
  "SQLi":            { file: "sqli.txt",            icon: "⬡", desc: "SQL injection vulnerability dorks" },
  "XSS":             { file: "xss.txt",             icon: "◈", desc: "Cross-site scripting dorks" },
  "LFI":             { file: "lfi.txt",             icon: "⬢", desc: "Local file inclusion dorks" },
  "RFI":             { file: "rfi.txt",             icon: "◉", desc: "Remote file inclusion dorks" },
  "CCTV":            { file: "cctv.txt",            icon: "⊕", desc: "Open CCTV & webcam dorks" },
  "Shodan":          { file: "shodan.txt",           icon: "◍", desc: "Shodan search engine dorks" },
  "Censys":          { file: "censys.txt",           icon: "⬟", desc: "Censys intelligence dorks" },
  "GitHub":          { file: "github.txt",           icon: "◈", desc: "GitHub secret & credential dorks" },
  "Cloud":           { file: "cloud.txt",            icon: "⊙", desc: "AWS, Azure, GCP cloud exposure dorks" },
  "CMS":             { file: "cms.txt",              icon: "⬡", desc: "WordPress, Joomla, Laravel, Magento dorks" },
  "Admin Panels":    { file: "admin.txt",            icon: "⊛", desc: "Admin panel & login discovery" },
  "Login Portals":   { file: "login_portals.txt",   icon: "◉", desc: "Login portal discovery dorks" },
  "Sensitive Files": { file: "sensitive_files.txt", icon: "⬢", desc: "Exposed sensitive files & passwords" },
  "Sensitive Dirs":  { file: "sensitive_dirs.txt",  icon: "◍", desc: "Exposed sensitive directories" },
  "Vuln Servers":    { file: "vuln_servers.txt",    icon: "⬟", desc: "Vulnerable server & file dorks" },
  "Log Files":       { file: "log_files.txt",       icon: "◈", desc: "Exposed log file dorks" },
  "IoT Devices":     { file: "iot.txt",             icon: "⊕", desc: "Internet-of-Things device dorks" },
  "Error Messages":  { file: "error_messages.txt",  icon: "⬡", desc: "Error message disclosure dorks" },
  "Network & Vuln":  { file: "network_vuln.txt",    icon: "◉", desc: "Network & vulnerability data dorks" },
};

// ── Category type sets ────────────────────────────────────────
const SHODAN_CATS = new Set(["Shodan"]);
const CENSYS_CATS = new Set(["Censys"]);
const GITHUB_CATS = new Set(["GitHub"]);

// Lines that are skipped (not actual dorks — metadata/headers/refs)
function isSkippableLine(line) {
  const l = line.trim();
  // EDB references
  if (/^EDB \d+/i.test(l)) return true;
  // Numbered section headers like "1. General File Searches"
  if (/^\d+\.\s+[A-Z]/.test(l)) return true;
  // Pure emoji/arrow lines
  if (/^[🔎→\s]+$/.test(l)) return true;
  // Tab-separated description columns (GitHub file has "Search : Description" headers)
  if (/^Search\s*:\s*Description/i.test(l)) return true;
  // Section dividers like "---"
  if (/^[-=]{3,}$/.test(l)) return true;
  // Credits line
  if (/^credits$/i.test(l)) return true;
  return false;
}

// ── Smart domain injector ─────────────────────────────────────
function injectDomain(rawLine, domain, category) {
  if (!domain) return rawLine;

  const line = rawLine.trim();
  const lo   = line.toLowerCase();

  // Skip non-dork lines
  if (isSkippableLine(line)) return line;

  // Already targets this exact domain — no-op
  if (lo.includes(`site:${domain}`) || lo.includes(`hostname:${domain}`)) return line;

  // ── SHODAN ───────────────────────────────────────────────
  if (SHODAN_CATS.has(category)) {
    // Skip plain-text description lines (no Shodan operator)
    const shodanOps = /^(city:|country:|geo:|hostname:|net:|org:|port:|product:|server:|title:|os:|http\.|ssl\.|asn:|vuln:|has_screenshot|before:|after:)/i;
    if (!shodanOps.test(line) && !lo.includes("title:") && !lo.includes("port:")) return line;
    return `hostname:${domain} ${line}`;
  }

  // ── CENSYS ───────────────────────────────────────────────
  if (CENSYS_CATS.has(category)) {
    // Only actual Censys query lines (start with services., same_service, or http.)
    if (!/^(services\.|same_service|http\.|parsed\.|not same_service)/i.test(line)) return line;
    return `${line} and parsed.names: "${domain}"`;
  }

  // ── GITHUB ───────────────────────────────────────────────
  if (GITHUB_CATS.has(category)) {
    // Only lines with actual GitHub search operators
    const ghOps = /^(filename:|extension:|language:|path:|org:|user:|repo:)/i;
    const hasQuotedString = /^"[^"]/.test(line);
    if (!ghOps.test(line) && !hasQuotedString) return line;
    // Skip if tab-separated description (has \t)
    if (line.includes("\t")) return line.split("\t")[0].trim() + ` "${domain}"`;
    if (line.includes(domain)) return line;
    return `${line} "${domain}"`;
  }

  // ── GOOGLE DORKS (all remaining categories) ───────────────

  // 1. Already has site: pointing at another domain → prepend ours
  if (/\bsite:[^\s]+/.test(lo)) {
    // Handle "* site:..." cloud patterns (strip leading *)
    const clean = line.replace(/^\*\s*/, "").trim();
    return `site:${domain} ${clean}`;
  }

  // 2. Standard Google operators: inurl:, intitle:, filetype:, intext:, allin*:
  if (/^(inurl:|intitle:|filetype:|intext:|allinurl:|allintitle:|allintext:|allinurl:)/i.test(line)) {
    return `site:${domain} ${line}`;
  }

  // 3. allintitle:*.php?page=* style wildcards
  if (/^allintitle:/i.test(line)) {
    return `site:${domain} ${line}`;
  }

  // 4. Path starting with / → wrap in inurl:"..."
  if (line.startsWith("/")) {
    return `site:${domain} inurl:"${line}"`;
  }

  // 5. Bare filename like avatar.asp?id= or index.php?page=
  if (/^[\w\-]+\.(php|asp|aspx|cfm|jsp|html?|cgi|pl|txt|xml|json)\?/i.test(line)) {
    return `site:${domain} inurl:"${line}"`;
  }

  // 6. index.php?var= (no extension match above catches these)
  if (/^[\w\-]+\.php\?/i.test(line) || /^[\w\-]+\.asp\?/i.test(line)) {
    return `site:${domain} inurl:"${line}"`;
  }

  // 7. Bare filename/path without query string (admin/, login.html)
  if (/^[\w\-\.\/]+\/$/.test(line) || /^[\w\-]+\.(htm|html|php|asp|aspx|cfm|cgi|pl|txt|xml|log|sql|env|bak|json|yml|yaml|ini|conf|config)$/i.test(line)) {
    return `site:${domain} inurl:"${line}"`;
  }

  // 8. Quoted strings starting with "
  if (line.startsWith('"')) {
    return `site:${domain} ${line}`;
  }

  // 9. index.of.secret / index.of.private style dir dorks
  if (/^index\.of\./i.test(line)) {
    return `site:${domain} intitle:"${line.replace(/\./g, " ")}"`;
  }

  // 10. Template percent patterns like admin.%XT% (wildcard placeholders)
  if (/%[A-Z]+%/.test(line)) {
    // Strip placeholder, use as inurl keyword
    const stripped = line.replace(/%[A-Z]+%/g, "").trim();
    if (stripped) return `site:${domain} inurl:"${stripped}"`;
    return line;
  }

  // 11. Shodan-style inurl spaced (IoT / CCTV category lines like title:"X")
  if (/^title:/i.test(line) || /^server:/i.test(line) || /^product:/i.test(line)) {
    // These are Shodan operators appearing in CCTV/IoT — wrap for Google
    return `site:${domain} intitle:${line.replace(/^title:/i, "").trim()}`;
  }

  // 12. XSS payloads / script tags — don't inject site:, they're raw payloads
  if (/^<script|^<img|^javascript:|^document\[/i.test(line)) return line;

  // 13. Full URLs — use as-is or extract path
  if (/^https?:\/\//i.test(line)) return line;

  // 14. inurl with spaces like "inurl /bug bounty" or "inurl : / security"
  if (/^inurl\s*[:/ ]/i.test(line)) {
    const cleaned = line.replace(/^inurl\s*[: \/]*/i, "").trim();
    return `site:${domain} inurl:"${cleaned}"`;
  }

  // 15. Pure keyword phrases (responsible disclosure, white hat, etc.)
  if (/^[a-zA-Z0-9 '\-_:\.]+$/.test(line) && line.length > 3 && line.length < 80) {
    return `site:${domain} ${line}`;
  }

  // 16. Bare path segments without leading slash (wp-content/plugins/...)
  if (/^[\w\-]+\//.test(line)) {
    return `site:${domain} inurl:"${line}"`;
  }

  // Default fallback — prepend site:
  return `site:${domain} ${line}`;
}

// ── File read + in-memory cache ───────────────────────────────
const cache = {};
function readDorks(file) {
  if (cache[file]) return cache[file];
  const fpath = path.join(DORKS_DIR, file);
  if (!fs.existsSync(fpath)) return [];
  const lines = fs.readFileSync(fpath, "utf8")
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 2);
  cache[file] = lines;
  return lines;
}

function applyDomain(dorks, domain, category) {
  if (!domain) return dorks;
  return dorks.map(d => injectDomain(d, domain, category));
}

// ── Route handlers ────────────────────────────────────────────

exports.getCategories = (req, res) => {
  const cats = Object.entries(CATEGORIES).map(([name, meta]) => ({
    name, icon: meta.icon, desc: meta.desc,
    count: readDorks(meta.file).length,
  }));
  res.json({ categories: cats });
};

exports.getDorksByCategory = (req, res) => {
  const { category } = req.params;
  const { domain, page = 1, limit = 50 } = req.query;

  const meta = CATEGORIES[category];
  if (!meta) return res.status(404).json({ error: "Category not found" });

  const allDorks  = readDorks(meta.file);
  const resolved  = applyDomain(allDorks, domain, category);

  const pageNum   = parseInt(page);
  const pageSize  = parseInt(limit);
  const start     = (pageNum - 1) * pageSize;

  res.json({
    category,
    domain: domain || null,
    dorks: resolved.slice(start, start + pageSize),
    total: allDorks.length,
    page: pageNum,
    pages: Math.ceil(allDorks.length / pageSize),
    hasMore: start + pageSize < allDorks.length,
  });
};

exports.searchDorks = (req, res) => {
  const { q, domain, category } = req.query;
  if (!q) return res.status(400).json({ error: "q query param required" });

  const results  = [];
  const searchIn = category ? { [category]: CATEGORIES[category] } : CATEGORIES;

  for (const [cat, meta] of Object.entries(searchIn)) {
    if (!meta) continue;
    const dorks   = readDorks(meta.file);
    const matched = dorks.filter(d => d.toLowerCase().includes(q.toLowerCase()));
    if (matched.length) {
      results.push({
        category: cat,
        dorks: applyDomain(matched.slice(0, 20), domain, cat),
        total: matched.length,
      });
    }
  }

  res.json({ query: q, results, totalMatches: results.reduce((a, r) => a + r.total, 0) });
};
