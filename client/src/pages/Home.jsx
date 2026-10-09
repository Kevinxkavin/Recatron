// Home.jsx — no longer used by App.jsx (replaced by TargetTab inline)
// Kept as fallback in case it's imported elsewhere
import { useState } from "react";
import { MODULES, THEME as T } from "../constants";

export default function Home({ url, setUrl, selectedModules, setSelectedModules, onProceed, scanning }) {
  const [localUrl, setLocalUrl] = useState(url);
  return (
    <div style={{ maxWidth: 660, margin: "0 auto", padding: "36px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: T.font, letterSpacing: "-0.02em" }}>Target Configuration</div>
        <div style={{ fontSize: 13, color: T.textDim, fontFamily: T.font, marginTop: 5 }}>Enter a URL and select recon modules</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
        <input
          value={localUrl}
          onChange={e => setLocalUrl(e.target.value)}
          placeholder="https://target.com"
          onKeyDown={e => { if (e.key === "Enter" && localUrl) { setUrl(localUrl); onProceed(); } }}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "14px 16px", color: "#fff", fontFamily: T.mono, fontSize: 13 }}
        />
        <button disabled={scanning || !localUrl} onClick={() => { setUrl(localUrl); onProceed(); }}
          style={{ margin: 6, padding: "8px 20px", borderRadius: 9, background: "linear-gradient(135deg,#a78bfa,#818cf8)", border: "none", color: "#fff", fontFamily: T.font, fontSize: 13, fontWeight: 600 }}>
          {scanning ? "Scanning…" : "Start Scan"}
        </button>
      </div>
      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", fontSize: 11, color: T.textDim, fontFamily: T.font, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          <span style={{ flex: 1 }}>Modules</span>
          {["All","None"].map(l => (
            <button key={l} onClick={() => l === "All" ? setSelectedModules(MODULES.map(m => m.id)) : setSelectedModules([])}
              style={{ marginLeft: 6, padding: "2px 10px", borderRadius: 6, background: T.card, border: `1px solid ${T.border}`, color: T.textDim, fontSize: 11, fontFamily: T.font, cursor: "pointer" }}>{l}</button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, padding: 10 }}>
          {MODULES.map(mod => {
            const on = selectedModules.includes(mod.id);
            return (
              <label key={mod.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, cursor: "pointer", background: on ? "rgba(167,139,250,0.09)" : T.card, border: `1px solid ${on ? "rgba(167,139,250,0.3)" : T.border}`, transition: "all 0.15s" }}>
                <input type="checkbox" checked={on} onChange={e => { if (e.target.checked) setSelectedModules(p => [...p, mod.id]); else setSelectedModules(p => p.filter(x => x !== mod.id)); }} style={{ accentColor: T.accent, width: 13, height: 13 }} />
                <span style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0, background: on ? T.accent : "rgba(255,255,255,0.06)", border: `1px solid ${on ? T.accent : T.border}`, color: on ? "#fff" : T.textDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, fontFamily: T.font, transition: "all 0.15s" }}>{mod.icon}</span>
                <span style={{ fontSize: 12, color: on ? "#fff" : T.textDim, fontFamily: T.font }}>{mod.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
