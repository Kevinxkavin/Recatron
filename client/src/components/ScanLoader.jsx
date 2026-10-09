import { useEffect } from "react";
import { THEME as T } from "../constants";

export default function ScanLoader({ log, logRef }) {
  useEffect(() => {
    if (logRef?.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12, overflow: "hidden", marginBottom: 8,
    }}>
      {/* header bar */}
      <div style={{
        padding: "9px 14px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", gap: 8,
        fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: T.font,
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: "50%",
          background: "#34d399", boxShadow: "0 0 7px #34d399",
          display: "inline-block", animation: "pulse 1s ease-in-out infinite",
        }} />
        Scan in progress…
      </div>

      {/* log output */}
      <div
        ref={logRef}
        style={{
          height: 130, overflowY: "auto", padding: "10px 14px",
          background: "#050508",
        }}
      >
        {log.length === 0 && (
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontFamily: T.mono }}>
            Initialising…
          </div>
        )}
        {log.map((line, i) => (
          <div key={i} style={{
            fontFamily: T.mono, fontSize: 12, lineHeight: 1.7,
            color: i === log.length - 1 ? "#fff" : "rgba(255,255,255,0.35)",
          }}>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
