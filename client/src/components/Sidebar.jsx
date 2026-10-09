// Sidebar.jsx — legacy, no longer used by App.jsx
// Kept so any stray imports don't break the build
import { THEME as T } from "../constants";

const TABS = [
  { id: "home",    label: "Target",     icon: "🎯" },
  { id: "modules", label: "Modules",    icon: "⚙"  },
  { id: "dorks",   label: "Dork Intel", icon: "🔍" },
  { id: "results", label: "Results",    icon: "📋" },
  { id: "history", label: "History",    icon: "🕐" },
];

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <div style={{ width: 170, background: T.panel, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ padding: "10px 14px 6px", fontSize: 10, color: T.textDim, fontFamily: T.font, textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: `1px solid ${T.border}` }}>
        Navigation
      </div>
      <div style={{ flex: 1, paddingTop: 6 }}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", background: active ? "rgba(167,139,250,0.1)" : "transparent", border: "none", borderLeft: active ? `2px solid ${T.accent}` : "2px solid transparent", color: active ? "#fff" : T.textDim, fontSize: 13, fontFamily: T.font, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
              <span>{tab.icon}</span>{tab.label}
            </button>
          );
        })}
      </div>
      <div style={{ padding: "10px 14px", borderTop: `1px solid ${T.border}`, fontSize: 11, color: T.textDim, fontFamily: T.font }}>
        Recatron v2.0
      </div>
    </div>
  );
}
