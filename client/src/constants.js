export const MODULES = [
  { id: "headers",    label: "Header Analysis",     icon: "H" },
  { id: "redirect",   label: "Redirect Analysis",   icon: "R" },
  { id: "metadata",   label: "Metadata Collection", icon: "M" },
  { id: "dns",        label: "DNS Lookup",           icon: "D" },
  { id: "dorks",      label: "Google Dorks",         icon: "G" },
  { id: "virustotal", label: "VirusTotal",           icon: "V" },
  { id: "urlscan",    label: "URLScan",              icon: "U" },
  { id: "whois",      label: "WHOIS Lookup",         icon: "W" },
];

export const THEME = {
  // backgrounds — pure black, no blur
  bg:          "#0d0d12",
  panel:       "rgba(255,255,255,0.03)",
  card:        "rgba(255,255,255,0.04)",
  border:      "rgba(255,255,255,0.08)",
  borderHover: "rgba(167,139,250,0.3)",

  // accent colours
  accent:      "#a78bfa",
  accentDim:   "rgba(167,139,250,0.2)",
  accentGlow:  "rgba(167,139,250,0.1)",
  blue:        "#818cf8",
  green:       "#34d399",
  red:         "#f87171",
  yellow:      "#fbbf24",

  // text
  text:        "rgba(255,255,255,0.8)",
  textDim:     "rgba(255,255,255,0.35)",
  textBright:  "#ffffff",

  // type
  font: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  mono: "'Consolas', 'Courier New', monospace",

  // misc
  navBg:    "rgba(14,14,20,0.95)",
  inputBg:  "rgba(255,255,255,0.04)",
  codeBg:   "#050508",
  rowHover: "rgba(255,255,255,0.03)",
};
