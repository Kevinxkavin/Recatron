import { useRef } from "react";
import ResultCard from "../components/ResultCard";
import ScanLoader from "../components/ScanLoader";
import { THEME as T } from "../constants";

export default function Results({ url, selectedModules, scanData, scanLog, scanning }) {
  const logRef = useRef(null);
  if (!scanData && !scanning) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 24px", textAlign:"center", animation:"fadeUp 0.35s cubic-bezier(0.22,1,0.36,1) both" }}>
        <div style={{ fontSize:44, marginBottom:14 }}>📋</div>
        <div style={{ fontSize:15, fontWeight:600, color:"rgba(255,255,255,0.4)", fontFamily:T.font }}>No results yet</div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.25)", fontFamily:T.font, marginTop:6 }}>Run a scan from the Target tab</div>
      </div>
    );
  }
  return (
    <div style={{ maxWidth:840, margin:"0 auto", padding:"36px 24px", display:"flex", flexDirection:"column", gap:10, animation:"fadeUp 0.35s cubic-bezier(0.22,1,0.36,1) both" }}>
      {scanning && <ScanLoader log={scanLog} logRef={logRef}/>}
      {scanData && (
        <>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
            <div style={{ fontSize:20, fontWeight:700, color:"#fff", fontFamily:T.font, letterSpacing:"-0.02em" }}>Scan Results</div>
            <span style={{ fontSize:11, color:"rgba(167,139,250,0.8)", fontFamily:T.mono, padding:"3px 12px", borderRadius:999, background:"rgba(167,139,250,0.08)", border:"1px solid rgba(167,139,250,0.2)" }}>{url}</span>
          </div>
          {selectedModules.map(modId => <ResultCard key={modId} modId={modId} data={scanData[modId]||[]}/>)}
        </>
      )}
    </div>
  );
}
