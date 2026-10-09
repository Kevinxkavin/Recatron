// Navbar.jsx — legacy, no longer used by App.jsx
// Kept so any stray imports don't break the build
import { useState, useEffect } from "react";
import { THEME as T } from "../constants";

export default function Navbar({ url, scanning }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return (
    <div style={{ background: T.navBg, borderBottom: `1px solid ${T.border}`, height: 52, display: "flex", alignItems: "center", padding: "0 20px", gap: 14, flexShrink: 0, zIndex: 10 }}>
      <img src="/recatron_logo.png" alt="RECATRON" style={{ height: 30, filter: "drop-shadow(0 0 8px rgba(167,139,250,0.6)) brightness(1.1)" }} />
      <div style={{ width: 1, height: 20, background: T.border }} />
      <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: scanning ? T.green : T.textDim, fontFamily: T.font }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: scanning ? T.green : T.textDim, display: "inline-block" }} />
        {scanning ? "Scanning" : "Idle"}
      </span>
      {url && <span style={{ fontSize: 11, color: T.accent, fontFamily: T.mono, padding: "3px 10px", borderRadius: 999, background: T.accentGlow, border: `1px solid ${T.accentDim}` }}>{url}</span>}
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 12, color: T.textDim, fontFamily: T.mono }}>{time.toLocaleTimeString("en-US", { hour12: false })}</span>
    </div>
  );
}
