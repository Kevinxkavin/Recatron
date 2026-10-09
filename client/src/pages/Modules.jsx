import { MODULES, THEME as T } from "../constants";

export default function Modules({ selectedModules, setSelectedModules }) {
  return (
    <div style={{ maxWidth:660, margin:"0 auto", padding:"36px 24px", animation:"fadeUp 0.35s cubic-bezier(0.22,1,0.36,1) both" }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:20, fontWeight:700, color:"#fff", fontFamily:T.font, letterSpacing:"-0.02em" }}>Module Configuration</div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)", fontFamily:T.font, marginTop:5 }}>Toggle recon modules on or off</div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
        {MODULES.map(mod => {
          const on = selectedModules.includes(mod.id);
          return (
            <button key={mod.id}
              onClick={() => on ? setSelectedModules(p=>p.filter(x=>x!==mod.id)) : setSelectedModules(p=>[...p,mod.id])}
              style={{
                display:"flex", alignItems:"center", gap:14, padding:"14px 16px",
                background: on ? "rgba(167,139,250,0.08)" : "rgba(255,255,255,0.03)",
                border:`1px solid ${on ? "rgba(167,139,250,0.3)" : "rgba(255,255,255,0.08)"}`,
                borderRadius:12, cursor:"pointer", textAlign:"left", color:"inherit",
                transition:"all 0.15s",
              }}>
              <div style={{
                width:40, height:40, borderRadius:10, flexShrink:0,
                background: on ? "#a78bfa" : "rgba(255,255,255,0.06)",
                border:`1px solid ${on ? "#a78bfa" : "rgba(255,255,255,0.1)"}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:14, fontWeight:700, color: on ? "#fff" : "rgba(255,255,255,0.3)", transition:"all 0.15s",
              }}>{mod.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color: on ? "#fff" : "rgba(255,255,255,0.45)", fontFamily:T.font }}>{mod.label}</div>
                <div style={{ fontSize:11, fontFamily:T.font, marginTop:3, color: on ? "#34d399" : "rgba(255,255,255,0.2)" }}>
                  {on ? "● Enabled" : "○ Disabled"}
                </div>
              </div>
              <div style={{
                width:16, height:16, borderRadius:"50%", flexShrink:0,
                background: on ? "#34d399" : "rgba(255,255,255,0.07)",
                border:`2px solid ${on ? "#34d399" : "rgba(255,255,255,0.12)"}`,
                boxShadow: on ? "0 0 8px rgba(52,211,153,0.4)" : "none",
                transition:"all 0.15s",
              }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
