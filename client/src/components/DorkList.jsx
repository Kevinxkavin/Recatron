import { useState } from "react";
import { THEME as T } from "../constants";

export function DorkCard({ dork }) {
  const [copied, setCopied] = useState(false);
  const [hover,  setHover]  = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(dork).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "flex-start", gap: 8,
        padding: "9px 14px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: hover ? "rgba(255,255,255,0.03)" : "transparent",
        transition: "background 0.1s",
      }}
    >
      <span style={{
        fontFamily: T.mono, fontSize: 12,
        color: "rgba(255,255,255,0.65)",
        flex: 1, wordBreak: "break-all", lineHeight: 1.65,
      }}>
        {dork}
      </span>
      <div style={{ display: "flex", gap: 5, flexShrink: 0, paddingTop: 2 }}>
        <button onClick={handleCopy} style={{
          padding: "2px 10px", borderRadius: 6, fontSize: 11, fontFamily: T.font, cursor: "pointer",
          background: copied ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${copied ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.1)"}`,
          color: copied ? "#34d399" : "rgba(255,255,255,0.35)",
          transition: "all 0.15s",
        }}>
          {copied ? "✓" : "Copy"}
        </button>
        <a
          href={`https://www.google.com/search?q=${encodeURIComponent(dork)}`}
          target="_blank" rel="noreferrer"
          style={{
            padding: "2px 10px", borderRadius: 6, fontSize: 11, fontFamily: T.font,
            background: "rgba(129,140,248,0.08)", border: "1px solid rgba(129,140,248,0.25)",
            color: "#818cf8", textDecoration: "none",
          }}
        >Search ↗</a>
      </div>
    </div>
  );
}
