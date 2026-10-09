import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import SoftAurora from "./components/SoftAurora";

/* ─── API ─────────────────────────────────────────────────────────────────── */
const api = axios.create({ baseURL: "/api" });
const runScan            = (url, modules)                       => api.post("/scan/run", { url, modules }).then(r => r.data);
const getDorkCategories  = ()                                   => api.get("/dorks/categories").then(r => r.data);
const getDorksByCategory = (cat, domain, page=1, limit=50)     => api.get(`/dorks/${encodeURIComponent(cat)}`, { params:{ domain, page, limit } }).then(r => r.data);
const searchDorks        = (q, domain, category)               => api.get("/dorks/search", { params:{ q, domain, category } }).then(r => r.data);
const getScanHistory     = ()                                   => api.get("/history").then(r => r.data);
const deleteScan         = (id)                                 => api.delete(`/history/${id}`).then(r => r.data);

/* ─── CONSTANTS ───────────────────────────────────────────────────────────── */
const MODULES = [
  { id:"headers",    label:"Header Analysis",     icon:"H" },
  { id:"redirect",   label:"Redirect Analysis",   icon:"R" },
  { id:"metadata",   label:"Metadata Collection", icon:"M" },
  { id:"dns",        label:"DNS Lookup",           icon:"D" },
  { id:"dorks",      label:"Google Dorks",         icon:"G" },
  { id:"virustotal", label:"VirusTotal",           icon:"V" },
  { id:"urlscan",    label:"URLScan",              icon:"U" },
  { id:"whois",      label:"WHOIS Lookup",         icon:"W" },
];

const T = {
  bg:     "#0d0d12",
  border: "rgba(255,255,255,0.08)",
  accent: "#a78bfa",
  green:  "#34d399",
  red:    "#f87171",
  blue:   "#818cf8",
  dim:    "rgba(255,255,255,0.38)",
  code:   "#050508",
  font:   "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  mono:   "'Consolas', 'Courier New', monospace",
};

/* ─── GLOBAL CSS ──────────────────────────────────────────────────────────── */
const G = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #0d0d12; height: 100%; overflow: hidden; }
  @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.3} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes shake  { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-7px)} 40%{transform:translateX(7px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:4px; }
  input::placeholder { color:rgba(255,255,255,0.2); }
  button { cursor:pointer; font-family:inherit; }
  button:disabled { opacity:0.4; cursor:not-allowed; }
`;

/* ─── AURORA WRAPPER — full-screen fixed behind everything ────────────────── */
function AuroraBg() {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
      background:"#0d0d12",
    }}>
      <SoftAurora
        speed={0.6} scale={1.5} brightness={1.0}
        color1="#f7f7f7" color2="#e100ff"
        noiseFrequency={2.5} noiseAmplitude={1.0}
        bandHeight={0.5} bandSpread={1.0}
        octaveDecay={0.1} layerOffset={0} colorSpeed={1.0}
        enableMouseInteraction={true} mouseInfluence={0.25}
      />
    </div>
  );
}

/* ─── FLOATING PILL NAV ───────────────────────────────────────────────────── */
const APP_TABS = [
  { id:"target",  label:"Target"     },
  { id:"modules", label:"Modules"    },
  { id:"dorks",   label:"Dork Intel" },
  { id:"results", label:"Results"    },
  { id:"history", label:"History"    },
];

function FloatingNav({ logoOnly, activeTab, setActiveTab, url, scanning, onNewScan }) {
  return (
    <div style={{
      position:"fixed", top:18, left:"50%", transform:"translateX(-50%)",
      zIndex:200, display:"flex", alignItems:"center", gap:2,
      background:"rgba(15,15,22,0.88)",
      border:"1px solid rgba(255,255,255,0.11)",
      borderRadius:999, padding:"5px 8px",
      boxShadow:"0 4px 32px rgba(0,0,0,0.7)",
      whiteSpace:"nowrap",
      backdropFilter:"blur(0px)",
    }}>
      <span style={{
        fontSize:15, fontWeight:800, color:"#fff", fontFamily:T.font,
        letterSpacing:"0.08em", margin:"0 10px 0 10px",
        textShadow:"0 0 10px rgba(167,139,250,0.6)",
      }}>RECATRON</span>
      <div style={{ width:1, height:16, background:"rgba(255,255,255,0.12)", margin:"0 4px" }}/>

      {logoOnly ? (
        <>
          {["Features","Modules","About"].map(l => (
            <span key={l} style={{ padding:"6px 14px", fontSize:13, color:T.dim, cursor:"pointer", borderRadius:999, fontFamily:T.font, transition:"color 0.15s" }}
              onMouseEnter={e=>e.currentTarget.style.color="#fff"}
              onMouseLeave={e=>e.currentTarget.style.color=T.dim}
            >{l}</span>
          ))}
        </>
      ) : (
        <>
          {APP_TABS.map(tab => {
            const active = activeTab===tab.id;
            return (
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{
                padding:"6px 16px", borderRadius:999, border:active?"1px solid rgba(167,139,250,0.4)":"1px solid transparent",
                background:active?"rgba(167,139,250,0.15)":"transparent",
                color:active?"#fff":T.dim, fontSize:13, fontWeight:active?600:400,
                transition:"all 0.15s",
              }}>{tab.label}</button>
            );
          })}
          <div style={{ width:1, height:16, background:"rgba(255,255,255,0.12)", margin:"0 4px" }}/>
          {scanning && (
            <span style={{ display:"flex", alignItems:"center", gap:6, padding:"0 8px", fontSize:12, color:T.green, fontFamily:T.font }}>
              <span style={{ width:6,height:6,borderRadius:"50%",background:T.green,boxShadow:`0 0 7px ${T.green}`,animation:"pulse 1.2s infinite",display:"inline-block" }}/>
              Scanning
            </span>
          )}
          {url && !scanning && (
            <span style={{ maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontSize:11, color:"rgba(167,139,250,0.85)", fontFamily:T.mono, padding:"3px 10px", borderRadius:999, background:"rgba(167,139,250,0.08)", border:"1px solid rgba(167,139,250,0.2)" }}>
              {url.replace(/https?:\/\//,"")}
            </span>
          )}
          <button onClick={onNewScan} style={{ padding:"7px 18px", borderRadius:999, border:"none", background:"#fff", color:"#0d0d12", fontSize:13, fontWeight:700, marginLeft:2 }}>
            New Scan
          </button>
        </>
      )}
    </div>
  );
}

/* ─── HERO SCREEN ─────────────────────────────────────────────────────────── */
function HeroScreen({ onProceed }) {
  const [val,     setVal]     = useState("");
  const [focused, setFocused] = useState(false);
  const [shake,   setShake]   = useState(false);

  const go = () => {
    if (!val.trim()) { setShake(true); setTimeout(()=>setShake(false),500); return; }
    onProceed(val.trim());
  };

  return (
    <>
      <FloatingNav logoOnly />
      <div style={{ position:"fixed", inset:0, zIndex:10, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 24px" }}>

        {/* NEW badge */}
        <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(0,0,0,0.45)", border:"1px solid rgba(255,255,255,0.13)", borderRadius:999, padding:"4px 14px 4px 5px", marginBottom:24, animation:"fadeUp 0.5s 0.05s cubic-bezier(0.22,1,0.36,1) both" }}>
          <span style={{ background:"#fff", color:"#0d0d12", fontSize:11, fontWeight:800, fontFamily:T.font, padding:"2px 10px", borderRadius:999, letterSpacing:"0.06em" }}>NEW</span>
          <span style={{ fontSize:13, color:"rgba(255,255,255,0.55)", fontFamily:T.font }}>Just shipped v2.0</span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize:"clamp(40px,5.8vw,72px)", fontWeight:900,
          color:"#fff", textAlign:"center", lineHeight:1.1,
          fontFamily:T.font, letterSpacing:"-0.03em",
          marginBottom:36, textShadow:"0 2px 40px rgba(0,0,0,0.8)",
          animation:"fadeUp 0.55s 0.1s cubic-bezier(0.22,1,0.36,1) both",
        }}>
          Recon intelligence,<br/>at your fingertips.
        </h1>

        {/* URL input */}
        <div style={{ width:"100%", maxWidth:520, animation:"fadeUp 0.55s 0.15s cubic-bezier(0.22,1,0.36,1) both", marginBottom:24 }}>
          <div style={{
            display:"flex", alignItems:"center",
            background:"rgba(10,10,18,0.75)",
            border:`1.5px solid ${focused?"rgba(167,139,250,0.7)":"rgba(255,255,255,0.15)"}`,
            borderRadius:14, overflow:"hidden",
            boxShadow:focused?"0 0 0 3px rgba(167,139,250,0.12), 0 8px 32px rgba(0,0,0,0.5)":"0 8px 32px rgba(0,0,0,0.4)",
            transition:"all 0.2s",
            animation:shake?"shake 0.4s ease":"none",
          }}>
            <div style={{ padding:"0 12px 0 18px", flexShrink:0, color:focused?"rgba(167,139,250,0.8)":"rgba(255,255,255,0.25)", display:"flex", alignItems:"center", transition:"color 0.2s" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <input value={val} onChange={e=>setVal(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="https://target.com"
              style={{ flex:1, background:"transparent", border:"none", outline:"none", padding:"17px 0", color:"#fff", fontFamily:T.mono, fontSize:14 }}/>
            <button onClick={go} style={{ margin:6, padding:"9px 24px", borderRadius:10, background:"linear-gradient(135deg,#a78bfa,#818cf8)", border:"none", color:"#fff", fontFamily:T.font, fontSize:13, fontWeight:700, boxShadow:"0 2px 14px rgba(167,139,250,0.4)", transition:"transform 0.1s" }}
              onMouseEnter={e=>e.currentTarget.style.transform="scale(1.04)"}
              onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
            >Process →</button>
          </div>
          <p style={{ textAlign:"center", marginTop:10, fontSize:12, color:"rgba(255,255,255,0.2)", fontFamily:T.font }}>Press Enter or click Process to begin</p>
        </div>

        {/* CTA buttons */}
        <div style={{ display:"flex", gap:12, animation:"fadeUp 0.55s 0.2s cubic-bezier(0.22,1,0.36,1) both" }}>
          <button onClick={()=>onProceed("https://example.com")} style={{ padding:"13px 34px", borderRadius:14, background:"#fff", border:"none", color:"#0d0d12", fontSize:14, fontWeight:800, fontFamily:T.font, boxShadow:"0 4px 20px rgba(255,255,255,0.15)", transition:"transform 0.1s" }}
            onMouseEnter={e=>e.currentTarget.style.transform="scale(1.03)"}
            onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
          >Get started</button>
          <button style={{ padding:"13px 34px", borderRadius:14, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.2)", color:"rgba(255,255,255,0.8)", fontSize:14, fontWeight:600, fontFamily:T.font, transition:"transform 0.1s" }}
            onMouseEnter={e=>e.currentTarget.style.transform="scale(1.03)"}
            onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
          >Learn more</button>
        </div>
      </div>
    </>
  );
}

/* ─── TARGET TAB ──────────────────────────────────────────────────────────── */
function TargetTab({ url, setUrl, selectedModules, setSelectedModules, onProceed, scanning }) {
  const [local, setLocal] = useState(url);
  return (
    <div style={{ maxWidth:660, margin:"0 auto", padding:"36px 24px", display:"flex", flexDirection:"column", gap:18, animation:"fadeUp 0.35s cubic-bezier(0.22,1,0.36,1) both" }}>
      <div>
        <div style={{ fontSize:20, fontWeight:700, color:"#fff", fontFamily:T.font, letterSpacing:"-0.02em" }}>Target Configuration</div>
        <div style={{ fontSize:13, color:T.dim, fontFamily:T.font, marginTop:5 }}>Enter a URL and select modules to run</div>
      </div>
      <div style={{ display:"flex", alignItems:"center", background:"rgba(255,255,255,0.04)", border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden" }}>
        <div style={{ padding:"0 12px 0 16px", color:"rgba(255,255,255,0.25)", display:"flex", alignItems:"center", flexShrink:0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
        </div>
        <input value={local} onChange={e=>setLocal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&local){setUrl(local);onProceed();}}} placeholder="https://target.com"
          style={{ flex:1, background:"transparent", border:"none", outline:"none", padding:"14px 0", color:"#fff", fontFamily:T.mono, fontSize:13 }}/>
        <button disabled={scanning||!local} onClick={()=>{setUrl(local);onProceed();}}
          style={{ margin:6, padding:"8px 20px", borderRadius:9, background:"linear-gradient(135deg,#a78bfa,#818cf8)", border:"none", color:"#fff", fontFamily:T.font, fontSize:13, fontWeight:600 }}>
          {scanning?"Scanning…":"Start Scan"}
        </button>
      </div>
      <div style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
        <div style={{ padding:"11px 16px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", fontSize:11, fontWeight:600, color:T.dim, fontFamily:T.font, textTransform:"uppercase", letterSpacing:"0.1em" }}>
          <span style={{ flex:1 }}>Modules</span>
          {["All","None"].map(l=>(
            <button key={l} onClick={()=>l==="All"?setSelectedModules(MODULES.map(m=>m.id)):setSelectedModules([])}
              style={{ marginLeft:6, padding:"2px 10px", borderRadius:6, background:"rgba(255,255,255,0.06)", border:`1px solid ${T.border}`, color:T.dim, fontSize:11, fontFamily:T.font }}>{l}</button>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8, padding:10 }}>
          {MODULES.map(mod=>{
            const on=selectedModules.includes(mod.id);
            return (
              <label key={mod.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, cursor:"pointer", background:on?"rgba(167,139,250,0.09)":"rgba(255,255,255,0.03)", border:`1px solid ${on?"rgba(167,139,250,0.3)":T.border}`, transition:"all 0.15s" }}>
                <input type="checkbox" checked={on} onChange={e=>{if(e.target.checked)setSelectedModules(p=>[...p,mod.id]);else setSelectedModules(p=>p.filter(x=>x!==mod.id));}} style={{ accentColor:T.accent, width:13, height:13 }}/>
                <span style={{ width:24, height:24, borderRadius:6, flexShrink:0, background:on?T.accent:"rgba(255,255,255,0.06)", border:`1px solid ${on?T.accent:T.border}`, color:on?"#fff":T.dim, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, fontFamily:T.font, transition:"all 0.15s" }}>{mod.icon}</span>
                <span style={{ fontSize:12, color:on?"#fff":T.dim, fontFamily:T.font }}>{mod.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── MODULES TAB ─────────────────────────────────────────────────────────── */
function ModulesTab({ selectedModules, setSelectedModules }) {
  return (
    <div style={{ maxWidth:660, margin:"0 auto", padding:"36px 24px", animation:"fadeUp 0.35s cubic-bezier(0.22,1,0.36,1) both" }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:20, fontWeight:700, color:"#fff", fontFamily:T.font, letterSpacing:"-0.02em" }}>Module Configuration</div>
        <div style={{ fontSize:13, color:T.dim, fontFamily:T.font, marginTop:5 }}>Toggle recon modules on or off</div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
        {MODULES.map(mod=>{
          const on=selectedModules.includes(mod.id);
          return (
            <button key={mod.id} onClick={()=>on?setSelectedModules(p=>p.filter(x=>x!==mod.id)):setSelectedModules(p=>[...p,mod.id])}
              style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", background:on?"rgba(167,139,250,0.08)":"rgba(255,255,255,0.03)", border:`1px solid ${on?"rgba(167,139,250,0.3)":T.border}`, borderRadius:12, cursor:"pointer", textAlign:"left", color:"inherit", transition:"all 0.15s" }}>
              <div style={{ width:40, height:40, borderRadius:10, flexShrink:0, background:on?T.accent:"rgba(255,255,255,0.06)", border:`1px solid ${on?T.accent:T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:on?"#fff":T.dim, transition:"all 0.15s" }}>{mod.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:on?"#fff":T.dim, fontFamily:T.font }}>{mod.label}</div>
                <div style={{ fontSize:11, fontFamily:T.font, marginTop:3, color:on?T.green:"rgba(255,255,255,0.2)" }}>{on?"● Enabled":"○ Disabled"}</div>
              </div>
              <div style={{ width:16, height:16, borderRadius:"50%", flexShrink:0, background:on?T.green:"rgba(255,255,255,0.07)", border:`2px solid ${on?T.green:"rgba(255,255,255,0.12)"}`, boxShadow:on?`0 0 8px rgba(52,211,153,0.4)`:"none", transition:"all 0.15s" }}/>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── DORK CARD ───────────────────────────────────────────────────────────── */
function DorkCard({ dork }) {
  const [copied,setCopied]=useState(false);
  const [hover, setHover] =useState(false);
  return (
    <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"9px 14px", borderBottom:`1px solid rgba(255,255,255,0.05)`, background:hover?"rgba(255,255,255,0.03)":"transparent", transition:"background 0.1s" }}>
      <span style={{ fontFamily:T.mono, fontSize:12, color:"rgba(255,255,255,0.65)", flex:1, wordBreak:"break-all", lineHeight:1.65 }}>{dork}</span>
      <div style={{ display:"flex", gap:5, flexShrink:0, paddingTop:2 }}>
        <button onClick={()=>{navigator.clipboard.writeText(dork).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),1500)});}}
          style={{ padding:"2px 10px", borderRadius:6, fontSize:11, fontFamily:T.font, background:copied?"rgba(52,211,153,0.1)":"rgba(255,255,255,0.05)", border:`1px solid ${copied?"rgba(52,211,153,0.3)":T.border}`, color:copied?T.green:T.dim, transition:"all 0.15s" }}>
          {copied?"✓":"Copy"}
        </button>
        <a href={`https://www.google.com/search?q=${encodeURIComponent(dork)}`} target="_blank" rel="noreferrer"
          style={{ padding:"2px 10px", borderRadius:6, fontSize:11, fontFamily:T.font, background:"rgba(129,140,248,0.08)", border:"1px solid rgba(129,140,248,0.25)", color:T.blue }}>
          Search ↗
        </a>
      </div>
    </div>
  );
}

/* ─── DORKS TAB ───────────────────────────────────────────────────────────── */
function DorksTab({ url }) {
  const domain=url?url.replace(/https?:\/\//,"").replace(/\/.*/,"").replace(/^www\./,"").trim():"";
  const [categories,    setCategories]    =useState([]);
  const [activeCat,     setActiveCat]     =useState(null);
  const [dorks,         setDorks]         =useState([]);
  const [total,         setTotal]         =useState(0);
  const [page,          setPage]          =useState(1);
  const [pages,         setPages]         =useState(1);
  const [loading,       setLoading]       =useState(false);
  const [searchQ,       setSearchQ]       =useState("");
  const [searchRes,     setSearchRes]     =useState(null);
  const [searching,     setSearching]     =useState(false);
  const [catLoading,    setCatLoading]    =useState(true);

  useEffect(()=>{
    setCatLoading(true);
    getDorkCategories().then(d=>{setCategories(d.categories||[]);if(d.categories?.length)setActiveCat(d.categories[0].name);}).catch(()=>setCategories([])).finally(()=>setCatLoading(false));
  },[]);

  useEffect(()=>{
    if(!activeCat)return;
    setLoading(true);setSearchRes(null);
    getDorksByCategory(activeCat,domain||"",page,50).then(d=>{setDorks(d.dorks||[]);setTotal(d.total||0);setPages(d.pages||1);}).catch(()=>setDorks([])).finally(()=>setLoading(false));
  },[activeCat,page,domain]);

  const doSearch=useCallback(()=>{
    if(!searchQ.trim())return;
    setSearching(true);
    searchDorks(searchQ,domain,activeCat).then(d=>setSearchRes(d)).catch(()=>setSearchRes({results:[],totalMatches:0})).finally(()=>setSearching(false));
  },[searchQ,domain,activeCat]);

  const currentCat=categories.find(c=>c.name===activeCat);
  const display=searchRes?searchRes.results.flatMap(r=>r.dorks):dorks;

  return (
    <div style={{ display:"flex", height:"calc(100vh - 80px)", overflow:"hidden" }}>
      <div style={{ width:200, flexShrink:0, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", background:"rgba(255,255,255,0.015)" }}>
        <div style={{ padding:10, borderBottom:`1px solid ${T.border}` }}>
          <div style={{ display:"flex", alignItems:"center", background:"rgba(255,255,255,0.04)", border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden" }}>
            <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doSearch()} placeholder="Search dorks…"
              style={{ flex:1, background:"transparent", border:"none", outline:"none", padding:"7px 10px", color:"#fff", fontFamily:T.font, fontSize:12 }}/>
            <button onClick={doSearch} disabled={searching} style={{ padding:"0 10px", height:32, background:"transparent", border:"none", color:searching?"rgba(255,255,255,0.2)":"rgba(167,139,250,0.7)", fontSize:14 }}>{searching?"…":"⌕"}</button>
          </div>
        </div>
        <div style={{ flex:1, overflowY:"auto" }}>
          <div style={{ padding:"8px 12px 4px", fontSize:10, color:T.dim, fontFamily:T.font, textTransform:"uppercase", letterSpacing:"0.1em" }}>Categories</div>
          {catLoading&&<div style={{ padding:"10px 12px", fontSize:12, color:T.dim, fontFamily:T.font }}>Loading…</div>}
          {categories.map(cat=>{
            const a=activeCat===cat.name;
            return (
              <button key={cat.name} onClick={()=>{setActiveCat(cat.name);setPage(1);setSearchQ("");setSearchRes(null);}}
                style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", background:a?"rgba(167,139,250,0.1)":"transparent", border:"none", borderLeft:`2px solid ${a?T.accent:"transparent"}`, color:a?"#fff":T.dim, fontSize:12, fontFamily:T.font, cursor:"pointer", textAlign:"left", transition:"all 0.12s" }}>
                <span>{cat.name}</span>
                <span style={{ fontSize:10, color:T.dim, background:"rgba(255,255,255,0.05)", padding:"1px 6px", borderRadius:999 }}>{cat.count>999?`${(cat.count/1000).toFixed(0)}k`:cat.count}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding:"10px 16px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:12, flexShrink:0, background:"rgba(255,255,255,0.015)" }}>
          <span style={{ fontSize:14, fontWeight:600, color:"#fff", fontFamily:T.font, flex:1 }}>{activeCat||"—"}</span>
          {currentCat&&<span style={{ fontSize:11, color:T.dim, fontFamily:T.font }}>{currentCat.count.toLocaleString()} dorks</span>}
          <span style={{ padding:"3px 12px", borderRadius:999, fontSize:11, fontFamily:T.mono, background:domain?"rgba(52,211,153,0.08)":"rgba(248,113,113,0.08)", border:`1px solid ${domain?"rgba(52,211,153,0.25)":"rgba(248,113,113,0.25)"}`, color:domain?T.green:T.red }}>
            {domain?`✓ ${domain}`:"⚠ No target set"}
          </span>
          {searchRes&&<>
            <span style={{ fontSize:12, color:T.dim, fontFamily:T.font }}>{searchRes.totalMatches?.toLocaleString()} results</span>
            <button onClick={()=>{setSearchRes(null);setSearchQ("");}} style={{ padding:"3px 10px", borderRadius:7, fontSize:11, fontFamily:T.font, background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border}`, color:T.dim }}>Clear ✕</button>
          </>}
        </div>
        <div style={{ flex:1, overflowY:"auto", background:T.code }}>
          {loading&&<div style={{ padding:"16px 14px", fontSize:12, color:T.dim, fontFamily:T.font }}>Loading…</div>}
          {!loading&&display.length===0&&<div style={{ padding:"16px 14px", fontSize:12, color:T.dim, fontFamily:T.font }}>No dorks found.</div>}
          {!loading&&display.map((dork,i)=><DorkCard key={`${activeCat}-${page}-${i}`} dork={dork}/>)}
        </div>
        {!searchRes&&pages>1&&(
          <div style={{ padding:"9px 14px", borderTop:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10, flexShrink:0, background:"rgba(255,255,255,0.015)" }}>
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1} style={{ padding:"4px 14px", borderRadius:8, fontSize:12, fontFamily:T.font, background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border}`, color:T.dim }}>‹ Prev</button>
            <span style={{ flex:1, textAlign:"center", fontSize:12, color:T.dim, fontFamily:T.font }}>Page {page} of {pages} · {total.toLocaleString()} dorks</span>
            <button onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page>=pages} style={{ padding:"4px 14px", borderRadius:8, fontSize:12, fontFamily:T.font, background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border}`, color:T.dim }}>Next ›</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── SCAN LOADER ─────────────────────────────────────────────────────────── */
function ScanLoader({ log, logRef }) {
  useEffect(()=>{ if(logRef?.current)logRef.current.scrollTop=logRef.current.scrollHeight; },[log]);
  return (
    <div style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden", marginBottom:8 }}>
      <div style={{ padding:"9px 14px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:8, fontSize:12, color:T.dim, fontFamily:T.font }}>
        <span style={{ width:7,height:7,borderRadius:"50%",background:T.green,boxShadow:`0 0 7px ${T.green}`,display:"inline-block",animation:"pulse 1s ease-in-out infinite" }}/>
        Scan in progress…
      </div>
      <div ref={logRef} style={{ height:130, overflowY:"auto", padding:"10px 14px", background:T.code }}>
        {log.length===0&&<div style={{ fontSize:12, color:T.dim, fontFamily:T.mono }}>Initialising…</div>}
        {log.map((line,i)=><div key={i} style={{ fontFamily:T.mono, fontSize:12, lineHeight:1.7, color:i===log.length-1?"#fff":"rgba(255,255,255,0.35)" }}>{line}</div>)}
      </div>
    </div>
  );
}

/* ─── RESULT CARD ─────────────────────────────────────────────────────────── */
function ResultLine({ line }) {
  if(/^──|^╔|^╚/.test(line)) return <div style={{ fontSize:11, fontFamily:T.mono, color:"rgba(167,139,250,0.7)", margin:"10px 0 4px", borderBottom:`1px solid ${T.border}`, paddingBottom:3 }}>{line}</div>;
  if(line.trim()==="") return <div style={{ height:5 }}/>;
  const idx=line.indexOf(" : ");
  if(idx>-1){
    const key=line.substring(0,idx).trim(), val=line.substring(idx+3).trim();
    let vc="rgba(255,255,255,0.75)";
    if(/malicious|⚠/i.test(val)) vc=T.red;
    if(/✅|clean|benign/i.test(val)) vc=T.green;
    if(/^n\/a$|^none$|^0$/i.test(val)) vc="rgba(255,255,255,0.25)";
    return (
      <div style={{ display:"flex", marginBottom:3 }}>
        <span style={{ fontFamily:T.mono, fontSize:12, color:"rgba(255,255,255,0.3)", minWidth:140, flexShrink:0 }}>{key}</span>
        <span style={{ color:"rgba(255,255,255,0.15)", marginRight:8, fontFamily:T.mono, fontSize:12 }}>:</span>
        <span style={{ fontFamily:T.mono, fontSize:12, color:vc, wordBreak:"break-all", lineHeight:1.55 }}>{val}</span>
      </div>
    );
  }
  return <div style={{ fontFamily:T.mono, fontSize:12, color:"rgba(255,255,255,0.6)", lineHeight:1.65, marginBottom:1 }}>{line}</div>;
}

function ResultCard({ modId, data }) {
  const [open,setOpen]=useState(false);
  const [copied,setCopied]=useState(false);
  const mod=MODULES.find(m=>m.id===modId);
  if(!mod)return null;
  return (
    <div style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${open?"rgba(167,139,250,0.25)":T.border}`, borderRadius:12, overflow:"hidden", transition:"border-color 0.15s" }}>
      <div onClick={()=>setOpen(p=>!p)} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", cursor:"pointer", background:open?"rgba(167,139,250,0.06)":"transparent", userSelect:"none" }}>
        <span style={{ width:26, height:26, borderRadius:7, flexShrink:0, background:open?T.accent:"rgba(255,255,255,0.06)", border:`1px solid ${open?T.accent:T.border}`, color:open?"#fff":T.dim, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, fontFamily:T.font, transition:"all 0.15s" }}>{mod.icon}</span>
        <span style={{ flex:1, fontSize:13, fontWeight:500, color:open?"#fff":"rgba(255,255,255,0.7)", fontFamily:T.font }}>{mod.label}</span>
        <span style={{ fontSize:11, color:T.dim, fontFamily:T.font, marginRight:8 }}>{data.length} lines</span>
        {open&&<button onClick={e=>{e.stopPropagation();navigator.clipboard.writeText(data.join("\n")).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),1500)});}}
          style={{ padding:"3px 10px", borderRadius:6, fontSize:11, fontFamily:T.font, background:copied?"rgba(52,211,153,0.1)":"rgba(255,255,255,0.06)", border:`1px solid ${copied?"rgba(52,211,153,0.3)":T.border}`, color:copied?T.green:T.dim, marginRight:6 }}>
          {copied?"Copied ✓":"Copy"}
        </button>}
        <span style={{ color:T.dim, fontSize:11, transform:open?"rotate(90deg)":"rotate(0deg)", display:"inline-block", transition:"transform 0.18s" }}>▶</span>
      </div>
      {open&&<><div style={{ height:1, background:T.border }}/><div style={{ padding:"12px 14px", maxHeight:460, overflowY:"auto", background:T.code }}>{data.length===0?<div style={{ fontSize:12, color:T.dim, fontFamily:T.font }}>No data returned.</div>:data.map((line,i)=><ResultLine key={i} line={line}/>)}</div></>}
    </div>
  );
}

/* ─── RESULTS TAB ─────────────────────────────────────────────────────────── */
function ResultsTab({ url, selectedModules, scanData, scanLog, scanning }) {
  const logRef=useRef(null);
  if(!scanData&&!scanning) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 24px", textAlign:"center", animation:"fadeUp 0.35s cubic-bezier(0.22,1,0.36,1) both" }}>
      <div style={{ fontSize:44, marginBottom:14 }}>📋</div>
      <div style={{ fontSize:15, fontWeight:600, color:"rgba(255,255,255,0.4)", fontFamily:T.font }}>No results yet</div>
      <div style={{ fontSize:13, color:T.dim, fontFamily:T.font, marginTop:6 }}>Run a scan from the Target tab</div>
    </div>
  );
  return (
    <div style={{ maxWidth:840, margin:"0 auto", padding:"36px 24px", display:"flex", flexDirection:"column", gap:10, animation:"fadeUp 0.35s cubic-bezier(0.22,1,0.36,1) both" }}>
      {scanning&&<ScanLoader log={scanLog} logRef={logRef}/>}
      {scanData&&<>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
          <div style={{ fontSize:20, fontWeight:700, color:"#fff", fontFamily:T.font, letterSpacing:"-0.02em" }}>Scan Results</div>
          <span style={{ fontSize:11, color:"rgba(167,139,250,0.8)", fontFamily:T.mono, padding:"3px 12px", borderRadius:999, background:"rgba(167,139,250,0.08)", border:"1px solid rgba(167,139,250,0.2)" }}>{url}</span>
        </div>
        {selectedModules.map(modId=><ResultCard key={modId} modId={modId} data={scanData[modId]||[]}/>)}
      </>}
    </div>
  );
}

/* ─── HISTORY TAB ─────────────────────────────────────────────────────────── */
function HistoryTab() {
  const [history,setHistory]=useState([]);
  const [loading,setLoading]=useState(true);
  const load=()=>{setLoading(true);getScanHistory().then(d=>setHistory(d)).catch(()=>setHistory([])).finally(()=>setLoading(false));};
  useEffect(()=>{load();},[]);
  const del=async id=>{await deleteScan(id).catch(()=>{});setHistory(h=>h.filter(s=>s._id!==id));};
  return (
    <div style={{ maxWidth:760, margin:"0 auto", padding:"36px 24px", animation:"fadeUp 0.35s cubic-bezier(0.22,1,0.36,1) both" }}>
      <div style={{ display:"flex", alignItems:"center", marginBottom:24 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, color:"#fff", fontFamily:T.font, letterSpacing:"-0.02em" }}>Scan History</div>
          <div style={{ fontSize:13, color:T.dim, fontFamily:T.font, marginTop:5 }}>Previous reconnaissance operations</div>
        </div>
        <div style={{ flex:1 }}/>
        <button onClick={load} style={{ padding:"7px 16px", borderRadius:8, background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border}`, color:T.dim, fontFamily:T.font, fontSize:12 }}>↻ Refresh</button>
      </div>
      {loading&&<div style={{ fontSize:13, color:T.dim, fontFamily:T.font }}>Loading…</div>}
      {!loading&&history.length===0&&<div style={{ textAlign:"center", padding:"48px 24px", background:"rgba(255,255,255,0.02)", border:`1px solid ${T.border}`, borderRadius:14 }}><div style={{ fontSize:32, marginBottom:12 }}>🕐</div><div style={{ fontSize:14, color:T.dim, fontFamily:T.font }}>No scan history yet.</div></div>}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {history.map((scan,i)=>(
          <div key={scan._id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:"rgba(255,255,255,0.03)", border:`1px solid ${T.border}`, borderRadius:12, transition:"border-color 0.15s" }}
            onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(167,139,250,0.2)"}
            onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
            <span style={{ fontSize:11, color:T.dim, fontFamily:T.mono, minWidth:24 }}>{String(i+1).padStart(2,"0")}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, color:"#fff", fontFamily:T.mono, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{scan.url}</div>
              <div style={{ fontSize:11, color:T.dim, fontFamily:T.font, marginTop:3 }}>{scan.modules?.join(" · ")} — {new Date(scan.createdAt).toLocaleString()}</div>
            </div>
            <span style={{ padding:"3px 10px", borderRadius:999, fontSize:11, fontFamily:T.font, background:scan.status==="complete"?"rgba(52,211,153,0.1)":"rgba(248,113,113,0.1)", color:scan.status==="complete"?T.green:T.red, border:`1px solid ${scan.status==="complete"?"rgba(52,211,153,0.25)":"rgba(248,113,113,0.25)"}` }}>{scan.status}</span>
            <button onClick={()=>del(scan._id)} style={{ padding:"4px 12px", borderRadius:7, background:"rgba(248,113,113,0.07)", border:"1px solid rgba(248,113,113,0.2)", color:T.red, fontSize:11, fontFamily:T.font }}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── APP SHELL ───────────────────────────────────────────────────────────── */
function AppShell({ url, setUrl, selectedModules, setSelectedModules, onNewScan }) {
  const [activeTab,setActiveTab]=useState("target");
  const [scanning, setScanning] =useState(false);
  const [scanData, setScanData] =useState(null);
  const [scanLog,  setScanLog]  =useState([]);

  const onProceed=async()=>{
    if(!url||!selectedModules.length)return;
    setScanning(true);setScanData(null);setScanLog([]);setActiveTab("results");
    try {
      const data=await runScan(url,selectedModules);
      if(data.log)data.log.forEach((line,i)=>{setTimeout(()=>setScanLog(p=>[...p,line]),i*100);});
      setTimeout(()=>{setScanData(data.results);setScanning(false);},(data.log?.length||3)*100+200);
    } catch(err) {
      setScanLog(p=>[...p,`[ERROR] ${err.message}`]);
      setScanning(false);
    }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden" }}>
      <FloatingNav activeTab={activeTab} setActiveTab={setActiveTab} url={url} scanning={scanning} onNewScan={onNewScan}/>
      <div style={{ flex:1, overflowY:"auto", paddingTop:80 }}>
        {activeTab==="target"  && <TargetTab  url={url} setUrl={setUrl} selectedModules={selectedModules} setSelectedModules={setSelectedModules} onProceed={onProceed} scanning={scanning}/>}
        {activeTab==="modules" && <ModulesTab selectedModules={selectedModules} setSelectedModules={setSelectedModules}/>}
        {activeTab==="dorks"   && <DorksTab   url={url}/>}
        {activeTab==="results" && <ResultsTab url={url} selectedModules={selectedModules} scanData={scanData} scanLog={scanLog} scanning={scanning}/>}
        {activeTab==="history" && <HistoryTab/>}
      </div>
    </div>
  );
}

/* ─── ROOT ────────────────────────────────────────────────────────────────── */
export default function App() {
  const [phase,setPhase]=useState("hero");
  const [url,  setUrl]  =useState("");
  const [selectedModules,setSelectedModules]=useState(["headers","dns","dorks","whois"]);
  return (
    <div style={{ background:"#0d0d12", minHeight:"100vh", fontFamily:T.font, position:"relative", overflow:"hidden" }}>
      <style>{G}</style>
      {/* Real WebGL SoftAurora — full screen fixed background */}
      <AuroraBg/>
      <div style={{ position:"relative", zIndex:1, height:"100vh", overflow:"hidden" }}>
        {phase==="hero" && <HeroScreen onProceed={target=>{setUrl(target);setPhase("app");}}/>}
        {phase==="app"  && <div style={{ animation:"fadeIn 0.35s ease both" }}><AppShell url={url} setUrl={setUrl} selectedModules={selectedModules} setSelectedModules={setSelectedModules} onNewScan={()=>{setPhase("hero");setUrl("");}}/></div>}
      </div>
    </div>
  );
}
