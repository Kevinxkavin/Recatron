import { useState } from "react";
import { MODULES, THEME as T } from "../constants";

function ResultLine({ line }) {
  if (/^──|^╔|^╚/.test(line)) {
    return (
      <div style={{
        fontSize: 11, fontFamily: T.mono, color: "rgba(167,139,250,0.7)",
        margin: "10px 0 4px", borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 3,
      }}>{line}</div>
    );
  }
  if (line.trim() === "") return <div style={{ height: 5 }} />;

  const colonIdx = line.indexOf(" : ");
  if (colonIdx > -1) {
    const key = line.substring(0, colonIdx).trim();
    const val = line.substring(colonIdx + 3).trim();
    let valColor = "rgba(255,255,255,0.75)";
    if (/malicious|⚠/i.test(val))    valColor = "#f87171";
    if (/✅|clean|benign/i.test(val)) valColor = "#34d399";
    if (/^n\/a$|^none$|^0$/i.test(val)) valColor = "rgba(255,255,255,0.25)";
    return (
      <div style={{ display: "flex", marginBottom: 3 }}>
        <span style={{ fontFamily: T.mono, fontSize: 12, color: "rgba(255,255,255,0.3)", minWidth: 140, flexShrink: 0 }}>{key}</span>
        <span style={{ color: "rgba(255,255,255,0.15)", marginRight: 8, fontFamily: T.mono, fontSize: 12 }}>:</span>
        <span style={{ fontFamily: T.mono, fontSize: 12, color: valColor, wordBreak: "break-all", lineHeight: 1.55 }}>{val}</span>
      </div>
    );
  }
  return (
    <div style={{ fontFamily: T.mono, fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.65, marginBottom: 1 }}>
      {line}
    </div>
  );
}

export default function ResultCard({ modId, data }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const mod = MODULES.find(m => m.id === modId);
  if (!mod) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(data.join("\n")).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: `1px solid ${open ? "rgba(167,139,250,0.25)" : "rgba(255,255,255,0.08)"}`,
      borderRadius: 12, overflow: "hidden",
      transition: "border-color 0.15s",
    }}>
      {/* header row */}
      <div
        onClick={() => setOpen(p => !p)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "11px 14px", cursor: "pointer",
          background: open ? "rgba(167,139,250,0.06)" : "transparent",
          userSelect: "none",
        }}
      >
        <span style={{
          width: 26, height: 26, borderRadius: 7, flexShrink: 0,
          background: open ? "#a78bfa" : "rgba(255,255,255,0.06)",
          border: `1px solid ${open ? "#a78bfa" : "rgba(255,255,255,0.1)"}`,
          color: open ? "#fff" : "rgba(255,255,255,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, fontFamily: T.font,
          transition: "all 0.15s",
        }}>{mod.icon}</span>

        <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: open ? "#fff" : "rgba(255,255,255,0.7)", fontFamily: T.font }}>
          {mod.label}
        </span>

        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: T.font, marginRight: 8 }}>
          {data.length} lines
        </span>

        {open && (
          <button
            onClick={e => { e.stopPropagation(); handleCopy(); }}
            style={{
              padding: "3px 10px", borderRadius: 6, fontSize: 11, fontFamily: T.font,
              background: copied ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.06)",
              border: `1px solid ${copied ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.1)"}`,
              color: copied ? "#34d399" : "rgba(255,255,255,0.4)",
              marginRight: 6,
            }}
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
        )}

        <span style={{
          color: "rgba(255,255,255,0.25)", fontSize: 11,
          transform: open ? "rotate(90deg)" : "rotate(0deg)",
          display: "inline-block", transition: "transform 0.18s",
        }}>▶</span>
      </div>

      {/* expanded content */}
      {open && (
        <>
          <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />
          <div style={{
            padding: "12px 14px", maxHeight: 460, overflowY: "auto",
            background: "#050508",
          }}>
            {data.length === 0
              ? <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontFamily: T.font }}>No data returned.</div>
              : data.map((line, i) => <ResultLine key={i} line={line} />)
            }
          </div>
        </>
      )}
    </div>
  );
}
