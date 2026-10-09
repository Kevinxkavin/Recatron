import { useState, useEffect, useCallback } from "react";
import { getDorksByCategory, getDorkCategories, searchDorks } from "../services/api";
import { DorkCard } from "../components/DorkList";
import { THEME as T } from "../constants";

export default function Dorks({ url }) {
  const domain = url ? url.replace(/https?:\/\//, "").replace(/\/.*/, "").replace(/^www\./, "").trim() : "";
  const [categories,    setCategories]    = useState([]);
  const [activeCategory,setActiveCategory]= useState(null);
  const [dorks,         setDorks]         = useState([]);
  const [total,         setTotal]         = useState(0);
  const [page,          setPage]          = useState(1);
  const [pages,         setPages]         = useState(1);
  const [loading,       setLoading]       = useState(false);
  const [searchQ,       setSearchQ]       = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching,     setSearching]     = useState(false);
  const [catLoading,    setCatLoading]    = useState(true);
  const LIMIT = 50;

  useEffect(() => {
    setCatLoading(true);
    getDorkCategories()
      .then(d => {
        setCategories(d.categories || []);
        if (d.categories?.length) setActiveCategory(d.categories[0].name);
      })
      .catch(() => setCategories([]))
      .finally(() => setCatLoading(false));
  }, []);

  useEffect(() => {
    if (!activeCategory) return;
    setLoading(true); setSearchResults(null);
    getDorksByCategory(activeCategory, domain || "", page, LIMIT)
      .then(d => { setDorks(d.dorks || []); setTotal(d.total || 0); setPages(d.pages || 1); })
      .catch(() => setDorks([]))
      .finally(() => setLoading(false));
  }, [activeCategory, page, domain]);

  const handleSearch = useCallback(() => {
    if (!searchQ.trim()) return;
    setSearching(true);
    searchDorks(searchQ, domain, activeCategory)
      .then(d => setSearchResults(d))
      .catch(() => setSearchResults({ results: [], totalMatches: 0 }))
      .finally(() => setSearching(false));
  }, [searchQ, domain, activeCategory]);

  const currentCat  = categories.find(c => c.name === activeCategory);
  const displayDorks = searchResults ? searchResults.results.flatMap(r => r.dorks) : dorks;

  return (
    <div style={{ display: "flex", height: "calc(100vh - 80px)", overflow: "hidden" }}>

      {/* ── left category sidebar ── */}
      <div style={{
        width: 200, flexShrink: 0,
        borderRight: "1px solid rgba(255,255,255,0.07)",
        display: "flex", flexDirection: "column",
        background: "rgba(255,255,255,0.015)",
      }}>
        {/* search */}
        <div style={{ padding: 10, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{
            display: "flex", alignItems: "center",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 8, overflow: "hidden",
          }}>
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Search dorks…"
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                padding: "7px 10px", color: "#fff", fontFamily: T.font, fontSize: 12,
              }}
            />
            <button onClick={handleSearch} disabled={searching} style={{
              padding: "0 10px", height: 32, background: "transparent",
              border: "none", color: searching ? "rgba(255,255,255,0.2)" : "rgba(167,139,250,0.7)",
              fontSize: 14, cursor: "pointer",
            }}>
              {searching ? "…" : "⌕"}
            </button>
          </div>
        </div>

        {/* category list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{
            padding: "8px 12px 4px",
            fontSize: 10, color: "rgba(255,255,255,0.25)",
            fontFamily: T.font, textTransform: "uppercase", letterSpacing: "0.1em",
          }}>
            Categories
          </div>

          {catLoading && (
            <div style={{ padding: "10px 12px", fontSize: 12, color: "rgba(255,255,255,0.25)", fontFamily: T.font }}>
              Loading…
            </div>
          )}

          {categories.map(cat => {
            const active = activeCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => { setActiveCategory(cat.name); setPage(1); setSearchQ(""); setSearchResults(null); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 12px", background: active ? "rgba(167,139,250,0.1)" : "transparent",
                  border: "none",
                  borderLeft: `2px solid ${active ? "#a78bfa" : "transparent"}`,
                  color: active ? "#fff" : "rgba(255,255,255,0.4)",
                  fontSize: 12, fontFamily: T.font, cursor: "pointer", textAlign: "left",
                  transition: "all 0.12s",
                }}
              >
                <span>{cat.name}</span>
                <span style={{
                  fontSize: 10, color: "rgba(255,255,255,0.25)",
                  background: "rgba(255,255,255,0.05)",
                  padding: "1px 6px", borderRadius: 999,
                }}>
                  {cat.count > 999 ? `${(cat.count / 1000).toFixed(0)}k` : cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── right content panel ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* top bar */}
        <div style={{
          padding: "10px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
          background: "rgba(255,255,255,0.015)",
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#fff", fontFamily: T.font, flex: 1 }}>
            {activeCategory || "—"}
          </span>
          {currentCat && (
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: T.font }}>
              {currentCat.count.toLocaleString()} dorks
            </span>
          )}

          {/* domain badge */}
          <span style={{
            padding: "3px 12px", borderRadius: 999, fontSize: 11, fontFamily: T.mono,
            background: domain ? "rgba(52,211,153,0.08)"  : "rgba(248,113,113,0.08)",
            border:     domain ? "1px solid rgba(52,211,153,0.25)" : "1px solid rgba(248,113,113,0.25)",
            color:      domain ? "#34d399" : "#f87171",
          }}>
            {domain ? `✓ ${domain}` : "⚠ No target set"}
          </span>

          {/* clear search */}
          {searchResults && (
            <>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: T.font }}>
                {searchResults.totalMatches.toLocaleString()} results for "{searchQ}"
              </span>
              <button onClick={() => { setSearchResults(null); setSearchQ(""); }} style={{
                padding: "3px 10px", borderRadius: 7, fontSize: 11, fontFamily: T.font,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.4)", cursor: "pointer",
              }}>Clear ✕</button>
            </>
          )}
        </div>

        {/* dork list */}
        <div style={{ flex: 1, overflowY: "auto", background: "#050508" }}>
          {loading && (
            <div style={{ padding: "16px 14px", fontSize: 12, color: "rgba(255,255,255,0.25)", fontFamily: T.font }}>
              Loading…
            </div>
          )}
          {!loading && displayDorks.length === 0 && (
            <div style={{ padding: "16px 14px", fontSize: 12, color: "rgba(255,255,255,0.25)", fontFamily: T.font }}>
              No dorks found.
            </div>
          )}
          {!loading && displayDorks.map((dork, i) => (
            <DorkCard key={`${activeCategory}-${page}-${i}`} dork={dork} />
          ))}
        </div>

        {/* pagination */}
        {!searchResults && pages > 1 && (
          <div style={{
            padding: "9px 14px", borderTop: "1px solid rgba(255,255,255,0.07)",
            display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
            background: "rgba(255,255,255,0.015)",
          }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              style={{ padding: "4px 14px", borderRadius: 8, fontSize: 12, fontFamily: T.font, cursor: "pointer", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}
            >‹ Prev</button>

            <span style={{ flex: 1, textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: T.font }}>
              Page {page} of {pages} · {total.toLocaleString()} dorks
            </span>

            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page >= pages}
              style={{ padding: "4px 14px", borderRadius: 8, fontSize: 12, fontFamily: T.font, cursor: "pointer", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}
            >Next ›</button>
          </div>
        )}
      </div>
    </div>
  );
}
