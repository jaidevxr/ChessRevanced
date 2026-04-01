/* ═══════════════════════════════════════════════════════════════
   GamesTab — Recent games list with Stockfish-powered Review
   ═══════════════════════════════════════════════════════════════ */
import { useState } from "react";
import { C, SF, SM } from "../tokens";
import { analyzeGame } from "../engine";

export default function GamesTab({ dash, ChessClass, onSelectGame }) {
  const [busy, setBusy] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handle = async (g) => {
    if (!ChessClass) {
      alert("Chess engine loading, please wait a moment.");
      return;
    }
    setBusy(g.url || g.date);
    setProgress({ current: 0, total: 0 });

    await new Promise((r) => setTimeout(r, 50));

    try {
      const res = await analyzeGame(
        g.pgn,
        g.isWhite ? g.white : g.black,
        ChessClass,
        { elo: 1500 },
        (current, total) => setProgress({ current, total }),
        g.accuracies
      );
      if (res) onSelectGame(res);
      else alert("Could not parse game PGN.");
    } catch (e) {
      console.error(e);
      alert("Analysis error: " + e.message);
    } finally {
      setBusy(null);
      setProgress({ current: 0, total: 0 });
    }
  };

  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="slide-up" style={{
      background: C.bg1,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 18px",
        borderBottom: `1px solid ${C.border}`,
        fontSize: 10,
        color: C.creamDim,
        fontFamily: SM,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span>Recent Games · Engine Evaluation</span>
        {!ChessClass && (
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.goldBright, fontSize: 9 }}>
            <span style={{ width: 10, height: 10, border: `2px solid ${C.bg4}`, borderTop: `2px solid ${C.goldBright}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
            loading engine…
          </span>
        )}
      </div>

      {/* Analysis progress bar */}
      {busy && progress.total > 0 && (
        <div style={{
          padding: "14px 18px",
          borderBottom: `1px solid ${C.border}`,
          background: C.bg2,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: C.goldBright, fontFamily: SM, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 12, height: 12, border: `2px solid ${C.bg4}`, borderTop: `2px solid ${C.goldBright}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
              Engine analyzing move {progress.current}/{progress.total}…
            </span>
            <span style={{ fontSize: 10, color: C.cream, fontFamily: SM, fontWeight: 600 }}>{pct}%</span>
          </div>
          <div style={{ height: 6, background: C.bg4, borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              width: `${pct}%`,
              height: "100%",
              background: C.gold,
              borderRadius: 3,
              transition: "width 0.3s ease",
              boxShadow: `0 0 8px rgba(200,150,30,0.3)`,
            }} />
          </div>
          <div style={{ fontSize: 9, color: C.creamDim, fontFamily: SM, marginTop: 4 }}>
            Lichess Accuracy Math · Stockfish 10 depth 14 analysis / API True CAPS
          </div>
        </div>
      )}

      {/* Games list */}
      {dash.gameList.map((g, i) => (
        <div key={i} style={{
          display: "flex",
          alignItems: "center",
          padding: "12px 16px",
          gap: 12,
          borderBottom: `1px solid ${C.border}`,
          background: i % 2 === 0 ? C.bg2 : C.bg1,
          transition: "background 0.15s ease",
          opacity: busy && busy !== (g.url || g.date) ? 0.35 : 1,
        }}
          onMouseOver={(e) => { if (!busy) e.currentTarget.style.background = C.bg3; }}
          onMouseOut={(e) => { e.currentTarget.style.background = i % 2 === 0 ? C.bg2 : C.bg1; }}
        >
          {/* Color indicator */}
          <div style={{
            width: 14, height: 14, borderRadius: 3,
            background: g.isWhite ? "#f0f0f0" : C.goldBright,
            border: g.isWhite ? "1px solid #ccc" : `1px solid ${C.gold}`,
            flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }} />

          {/* Outcome badge */}
          <span style={{
            color: g.outcome === "win" ? C.winBright : g.outcome === "loss" ? C.lossBright : C.drawBright,
            fontFamily: SM, fontSize: 10, letterSpacing: "0.08em", flexShrink: 0, fontWeight: 700, textTransform: "uppercase",
          }}>{g.outcome}</span>

          {/* Game info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: C.cream, fontSize: 13, fontFamily: SM, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
              vs {g.opponent || "?"}{g.opponentElo && <span style={{ color: C.creamDim, fontSize: 10, marginLeft: 4 }}>({g.opponentElo})</span>}
            </div>
            <div style={{ color: C.creamDim, fontSize: 10, fontFamily: SM, marginTop: 2 }}>{g.opening} · {g.tc}</div>
          </div>

          {/* Date */}
          <div style={{ color: C.creamDim, fontSize: 9, fontFamily: SM, flexShrink: 0 }}>
            {(g.date || "").slice(0, 10).replace(/\./g, "-")}
          </div>

          {/* Review button */}
          <button onClick={() => handle(g)} disabled={!!busy} style={{
            background: busy === (g.url || g.date)
              ? C.goldDim
              : C.bg3,
            color: C.goldBright,
            border: `1px solid ${C.gold}`,
            padding: "6px 14px", borderRadius: 7,
            cursor: busy ? "wait" : "pointer",
            fontFamily: SM, fontSize: 11, flexShrink: 0,
            opacity: busy && busy !== (g.url || g.date) ? 0.4 : 1,
            fontWeight: 600, transition: "all 0.2s ease",
            boxShadow: busy ? "none" : "0 2px 8px rgba(200,150,30,0.1)",
          }}
            onMouseOver={(e) => { if (!busy) { e.target.style.background = C.gold; e.target.style.color = C.bg0; }}}
            onMouseOut={(e) => { e.target.style.background = C.bg3; e.target.style.color = C.goldBright; }}
          >
            {busy === (g.url || g.date) ? (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, border: `2px solid ${C.bg4}`, borderTop: `2px solid ${C.goldBright}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                {pct}%
              </span>
            ) : "Review ♟"}
          </button>

          {/* External link */}
          {g.url && (
            <a href={g.url} target="_blank" rel="noreferrer" style={{
              color: C.creamDim, fontSize: 11, fontFamily: SM, textDecoration: "none", flexShrink: 0,
            }}
              onMouseOver={(e) => { e.target.style.color = C.goldBright; }}
              onMouseOut={(e) => { e.target.style.color = C.creamDim; }}
            >↗</a>
          )}
        </div>
      ))}
    </div>
  );
}
