/* ═══════════════════════════════════════════════════════════════
   CoachTab — Personalized Insights
   ═══════════════════════════════════════════════════════════════ */
import { useState } from "react";
import { C, SF, SM } from "../tokens";
import { dashCoach } from "../api";
import MD from "./Markdown";

export default function CoachTab({ stats, dash, username }) {
  const [text, setText] = useState("");
  const [load, setLoad] = useState(false);
  const [err, setErr] = useState("");

  const run = async () => {
    setLoad(true);
    setErr("");
    try {
      setText(await dashCoach(stats, dash, username));
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoad(false);
    }
  };

  return (
    <div className="slide-up">
      {/* Initial state — CTA */}
      {!text && !load && (
        <div style={{
          textAlign: "center",
          padding: "60px 24px",
          background: C.bg1,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          position: "relative",
          overflow: "hidden",
        }}>

          <div style={{ fontSize: 56, marginBottom: 16, animation: "float 3s ease-in-out infinite" }}>💡</div>
          <div style={{
            fontFamily: SF,
            fontSize: 24,
            color: C.goldBright,
            marginBottom: 12,
            fontWeight: 700,
            letterSpacing: "-0.01em",
          }}>Strategic Insights</div>
          <div style={{
            fontSize: 14,
            color: C.creamDim,
            lineHeight: 1.75,
            maxWidth: 440,
            margin: "0 auto 26px",
            fontFamily: "Inter, sans-serif",
          }}>
            Personalized insights focusing on openings, recurring patterns, and overall strategic positional play.
          </div>
          <button onClick={run} style={{
            background: C.gold,
            color: C.bg0,
            border: "none",
            padding: "12px 30px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            fontFamily: SM,
            cursor: "pointer",
            transition: "all 0.2s ease",
            position: "relative",
            zIndex: 1,
          }}
            onMouseOver={(e) => { e.target.style.transform = "translateY(-1px)"; e.target.style.background = C.goldBright; }}
            onMouseOut={(e) => { e.target.style.transform = "translateY(0)"; e.target.style.background = C.gold; }}
          >
            Generate Insights Report →
          </button>
          {err && (
            <div style={{
              color: C.lossBright,
              fontSize: 12,
              marginTop: 14,
              fontFamily: SM,
              padding: "8px 12px",
              background: "#2a0808",
              borderRadius: 6,
              display: "inline-block",
            }}>⚠ {err}</div>
          )}
        </div>
      )}

      {/* Loading state */}
      {load && (
        <div style={{
          textAlign: "center",
          padding: "70px 0",
          background: C.bg1,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
        }}>
          <div style={{ fontSize: 40, marginBottom: 14, animation: "float 2s ease-in-out infinite" }}>💡</div>
          <div style={{
            color: C.goldBright,
            fontSize: 16,
            fontFamily: SF,
            fontWeight: 600,
            marginBottom: 8,
          }}>Analyzing {dash.total} games…</div>
          <div style={{
            width: 40, height: 40, margin: "14px auto",
            border: `3px solid ${C.bg4}`,
            borderTop: `3px solid ${C.goldBright}`,
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
          <div style={{ color: C.creamDim, fontFamily: SM, fontSize: 11 }}>
            Generating strategic structural insights…
          </div>
        </div>
      )}

      {/* Results */}
      {text && !load && (
        <div style={{
          background: C.bg1,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: 22,
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
            paddingBottom: 12,
            borderBottom: `1px solid ${C.border}`,
          }}>
            <div style={{
              fontFamily: SF,
              fontSize: 18,
              color: C.goldBright,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <span>💡</span>
              Insights Report — {username}
            </div>
            <button onClick={run} style={{
              background: "transparent",
              color: C.gold,
              border: `1px solid ${C.goldDim}`,
              padding: "5px 14px",
              borderRadius: 6,
              fontSize: 10,
              fontFamily: SM,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
              onMouseOver={(e) => { e.target.style.borderColor = C.gold; }}
              onMouseOut={(e) => { e.target.style.borderColor = C.goldDim; }}
            >Refresh ↻</button>
          </div>
          <MD text={text} />
        </div>
      )}
    </div>
  );
}
