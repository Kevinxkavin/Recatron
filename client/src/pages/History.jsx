import { useState, useEffect } from "react";
import { getScanHistory, deleteScan } from "../services/api";
import { THEME as T } from "../constants";

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = () => { setLoading(true); getScanHistory().then(d=>setHistory(d)).catch(()=>setHistory([])).finally(()=>setLoading(false)); };
  useEffect(() => { load(); }, []);
  const del = async id => { await deleteScan(id).catch(()=>{}); setHistory(h=>h.filter(s=>s._id!==id)); };

  return (
    <div style={{ maxWidth:760, margin:"0 auto", padding:"36px 24px", animation:"fadeUp 0.35s cubic-bezier(0.22,1,0.36,1) both" }}>
      <div style={{ display:"flex", alignItems:"center", marginBottom:24 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, color:"#fff", fontFamily:T.font, letterSpacing:"-0.02em" }}>Scan History</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)", fontFamily:T.font, marginTop:5 }}>Previous reconnaissance operations</div>
        </div>
        <div style={{ flex:1 }}/>
        <button onClick={load} style={{ padding:"7px 16px", borderRadius:8, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.45)", fontSize:12, fontFamily:T.font }}>↻ Refresh</button>
      </div>
      {loading && <div style={{ fontSize:13, color:"rgba(255,255,255,0.3)", fontFamily:T.font }}>Loading...</div>}
      {!loading && history.length===0 && (
        <div style={{ textAlign:"center", padding:"48px 24px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14 }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🕐</div>
          <div style={{ fontSize:14, color:"rgba(255,255,255,0.3)", fontFamily:T.font }}>No scan history yet.</div>
        </div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {history.map((scan,i) => (
          <div key={scan._id} style={{
            display:"flex", alignItems:"center", gap:12, padding:"12px 16px",
            background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)",
            borderRadius:12, transition:"border-color 0.15s",
          }}
            onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(167,139,250,0.2)"}
            onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.08)"}
          >
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.25)", fontFamily:T.mono, minWidth:24 }}>{String(i+1).padStart(2,"0")}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, color:"#fff", fontFamily:T.mono, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{scan.url}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:T.font, marginTop:3 }}>{scan.modules?.join(" · ")} — {new Date(scan.createdAt).toLocaleString()}</div>
            </div>
            <span style={{
              padding:"3px 10px", borderRadius:999, fontSize:11, fontFamily:T.font,
              background: scan.status==="complete" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)",
              color: scan.status==="complete" ? "#34d399" : "#f87171",
              border:`1px solid ${scan.status==="complete" ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)"}`,
            }}>{scan.status}</span>
            <button onClick={() => del(scan._id)} style={{ padding:"4px 12px", borderRadius:7, background:"rgba(248,113,113,0.07)", border:"1px solid rgba(248,113,113,0.2)", color:"#f87171", fontSize:11, fontFamily:T.font }}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
