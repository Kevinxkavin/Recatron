// Minimal shared primitives — pure black theme, no blur/glass
import { THEME as T } from "../constants";

export function Panel({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12,
      transition: "border-color 0.15s",
      ...style,
    }}>
      {children}
    </div>
  );
}

export function PanelHeader({ children, style = {} }) {
  return (
    <div style={{
      padding: "10px 14px",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      borderRadius: "12px 12px 0 0",
      fontSize: 11, fontWeight: 600,
      color: "rgba(255,255,255,0.35)",
      fontFamily: T.font,
      display: "flex", alignItems: "center", gap: 8,
      letterSpacing: "0.08em", textTransform: "uppercase",
      ...style,
    }}>
      {children}
    </div>
  );
}

export function Btn({ children, onClick, variant = "default", disabled, style = {} }) {
  const base = {
    padding: "5px 13px", borderRadius: 8, fontSize: 12,
    fontFamily: T.font, cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1, transition: "all 0.15s", border: "none",
  };
  const variants = {
    default: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)" },
    primary: { background: "linear-gradient(135deg,#a78bfa,#818cf8)", color: "#fff", boxShadow: "0 2px 10px rgba(167,139,250,0.25)" },
    danger:  { background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171" },
    ghost:   { background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant] || variants.default, ...style }}>
      {children}
    </button>
  );
}

export function Badge({ children, color = "default" }) {
  const colors = {
    default: { bg: "rgba(255,255,255,0.06)",  text: "rgba(255,255,255,0.4)", border: "rgba(255,255,255,0.1)" },
    green:   { bg: "rgba(52,211,153,0.1)",    text: "#34d399",               border: "rgba(52,211,153,0.25)" },
    red:     { bg: "rgba(248,113,113,0.1)",   text: "#f87171",               border: "rgba(248,113,113,0.25)" },
    orange:  { bg: "rgba(251,191,36,0.1)",    text: "#fbbf24",               border: "rgba(251,191,36,0.25)" },
    blue:    { bg: "rgba(129,140,248,0.1)",   text: "#818cf8",               border: "rgba(129,140,248,0.25)" },
  };
  const c = colors[color] || colors.default;
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 999,
      fontSize: 11, fontFamily: T.font,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
    }}>
      {children}
    </span>
  );
}

export function StatusDot({ active }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: active ? "#34d399" : "rgba(255,255,255,0.2)",
        boxShadow: active ? "0 0 7px #34d399" : "none",
        animation: active ? "pulse 1.5s ease-in-out infinite" : "none",
        display: "inline-block",
      }} />
      <span style={{ fontSize: 12, color: active ? "#34d399" : "rgba(255,255,255,0.3)", fontFamily: T.font }}>
        {active ? "Scanning" : "Idle"}
      </span>
    </span>
  );
}
