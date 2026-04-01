/* ═══════════════════════════════════════════════════════════════
   ChessRevanced — AI Chess Analysis Platform
   Main Application Component
   ═══════════════════════════════════════════════════════════════ */
import { useState, useCallback, useEffect } from "react";
import { C, SF, SM } from "./tokens";
import { fetchProfile, fetchStats, fetchGames, buildDash } from "./api";
import GameReview from "./components/GameReview";
import OverviewTab from "./components/OverviewTab";
import OpeningsTab from "./components/OpeningsTab";
import GamesTab from "./components/GamesTab";
import CoachTab from "./components/CoachTab";

const TABS = [
  { id: "overview", l: "Overview", icon: "📊" },
  { id: "openings", l: "Openings", icon: "♟" },
  { id: "games", l: "Games", icon: "⚔" },
  { id: "coach", l: "Insights", icon: "💡" },
];

export default function App() {
  const [inputVal, setInputVal] = useState("");
  const [username, setUsername] = useState("");
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview");
  const [gameReview, setGameReview] = useState(null);
  const [Chess, setChess] = useState(null);

  // chess.js from CDN
  useEffect(() => {
    if (window.Chess) {
      setChess(() => window.Chess);
      return;
    }
    // Fallback: try loading if not already in head
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js";
    s.onload = () => setChess(() => window.Chess);
    s.onerror = () => console.warn("chess.js unavailable");
    document.head.appendChild(s);
    return () => {
      if (document.head.contains(s)) document.head.removeChild(s);
    };
  }, []);

  const search = useCallback(async () => {
    let u = inputVal.trim();
    if (!u) return;

    // Auto-extract username if a full URL is pasted
    if (u.includes("/")) {
      u = u.split("/").filter(Boolean).pop().split("?")[0];
    }
    setLoading(true);
    setError("");
    setProfile(null);
    setStats(null);
    setDash(null);
    setGameReview(null);
    try {
      const [prof, st, games] = await Promise.all([
        fetchProfile(u),
        fetchStats(u),
        fetchGames(u),
      ]);
      setProfile(prof);
      setStats(st);
      setDash(buildDash(games, u));
      setUsername(u);
      setTab("overview");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [inputVal]);

  /* ═══════════ GAME REVIEW MODE ═══════════ */
  if (gameReview) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg0, color: C.cream }}>
        <div className="bg-chess-pattern" />
        {/* Header */}
        <div style={{
          borderBottom: `1px solid ${C.border}`,
          background: C.bg1,
          padding: "0 24px",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(12px)",
        }}>
          <div style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            height: 56,
            gap: 12,
          }}>
            <span style={{ fontSize: 22 }}>♜</span>
            <span style={{
              fontFamily: SF,
              fontSize: 18,
              color: C.goldBright,
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}>ChessRevanced</span>
            <span style={{
              fontSize: 9,
              color: C.creamDim,
              fontFamily: SM,
              background: C.bg3,
              padding: "2px 8px",
              borderRadius: 4,
              letterSpacing: "0.06em",
            }}>GAME REVIEW</span>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px 70px" }}>
          <GameReview game={gameReview} username={username} onBack={() => setGameReview(null)} />
        </div>
      </div>
    );
  }

  /* ═══════════ MAIN DASHBOARD ═══════════ */
  return (
    <div style={{ minHeight: "100vh", background: C.bg0, color: C.cream }}>
      <div className="bg-chess-pattern" />

      {/* Header */}
      <div style={{
        borderBottom: `1px solid ${C.border}`,
        background: C.bg1,
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 100,
        backdropFilter: "blur(12px)",
      }}>
        <div style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          height: 58,
          gap: 12,
        }}>
          <span style={{ fontSize: 22 }}>♜</span>
          <span style={{
            fontFamily: SF,
            fontSize: 18,
            color: C.goldBright,
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}>ChessRevanced</span>
          <span style={{
            fontSize: 9,
            color: C.creamDim,
            fontFamily: SM,
            background: C.bg3,
            padding: "2px 8px",
            borderRadius: 4,
            letterSpacing: "0.06em",
          }}>ANALYSIS</span>

          {/* User info in header */}
          {profile && (
            <div style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}>
              {profile.avatar && (
                <img src={profile.avatar} alt=""
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: `1px solid ${C.borderHover}`,
                  }}
                />
              )}
              <span style={{ color: C.cream, fontSize: 13, fontFamily: SM, fontWeight: 500 }}>
                {profile.username}
              </span>
              <button onClick={() => {
                setProfile(null);
                setStats(null);
                setDash(null);
                setUsername("");
                setInputVal("");
              }} style={{
                background: "transparent",
                border: `1px solid ${C.border}`,
                color: C.creamDim,
                padding: "4px 12px",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 10,
                fontFamily: SM,
                transition: "all 0.2s ease",
              }}
                onMouseOver={(e) => { e.target.style.borderColor = C.gold; e.target.style.color = C.cream; }}
                onMouseOut={(e) => { e.target.style.borderColor = C.border; e.target.style.color = C.creamDim; }}
              >← New</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 70px" }}>
        {/* ═══════════ LANDING / SEARCH ═══════════ */}
        {!profile && !loading && (
          <div className="fade-in" style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "75vh",
          }}>
            {/* Hero */}
            <div style={{ textAlign: "center", marginBottom: 44, position: "relative" }}>

              <div style={{
                fontSize: 68,
                lineHeight: 1,
                marginBottom: 20,
                animation: "float 4s ease-in-out infinite",
              }}>♔</div>
              <h1 id="hero-title" style={{
                fontFamily: SF,
                fontSize: 40,
                color: C.goldBright,
                fontWeight: 900,
                margin: "0 0 12px",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}>
                Chess Analysis
              </h1>
              <p style={{
                fontSize: 15,
                color: C.creamDim,
                maxWidth: 480,
                lineHeight: 1.75,
                margin: 0,
                fontFamily: "Inter, sans-serif",
              }}>
                Full game-by-game review with move classifications, eval graphing, accuracy scores, and strategic positional insights.
              </p>
            </div>

            {/* Search */}
            <div id="search-bar" style={{
              display: "flex",
              gap: 10,
              width: "100%",
              maxWidth: 440,
              position: "relative",
            }}>
              <input
                id="username-input"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
                placeholder="Chess.com username…"
                autoFocus
                style={{
                  flex: 1,
                  background: C.bg2,
                  border: `1px solid ${C.borderHover}`,
                  color: C.cream,
                  padding: "14px 18px",
                  borderRadius: 10,
                  fontSize: 15,
                  fontFamily: SM,
                  outline: "none",
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                }}
                onFocus={(e) => { e.target.style.borderColor = C.gold; e.target.style.boxShadow = `0 0 0 3px ${C.goldGlow}`; }}
                onBlur={(e) => { e.target.style.borderColor = C.borderHover; e.target.style.boxShadow = "none"; }}
              />
              <button
                id="analyze-btn"
                onClick={search}
                style={{
                  background: C.gold,
                  color: C.bg0,
                  border: "none",
                  padding: "14px 24px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: SM,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                }}
                onMouseOver={(e) => { e.target.style.background = C.goldBright; e.target.style.transform = "translateY(-1px)"; }}
                onMouseOut={(e) => { e.target.style.background = C.gold; e.target.style.transform = "translateY(0)"; }}
              >
                Analyze →
              </button>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                marginTop: 14,
                color: C.lossBright,
                fontSize: 13,
                fontFamily: SM,
                maxWidth: 440,
                textAlign: "center",
                padding: "10px 16px",
                background: "#2a0808",
                borderRadius: 8,
                border: `1px solid ${C.loss}`,
              }}>⚠ {error}</div>
            )}

            {!Chess && (
              <div style={{
                marginTop: 14,
                fontSize: 10,
                color: C.creamDim,
                fontFamily: SM,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}>
                <span style={{
                  width: 10, height: 10,
                  border: `2px solid ${C.bg4}`,
                  borderTop: `2px solid ${C.goldBright}`,
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  display: "inline-block",
                }} />
                Loading chess analysis engine…
              </div>
            )}

            {/* Feature badges */}
            <div style={{
              marginTop: 40,
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              justifyContent: "center",
              maxWidth: 600,
            }}>
              {[
                { icon: "♟", label: "Move Analysis", desc: "Blunder/Mistake/Inaccuracy detection" },
                { icon: "📈", label: "Eval Graph", desc: "Click any point to jump to that move" },
                { icon: "🎯", label: "Accuracy Score", desc: "Precision accuracy grading per player" },
                { icon: "💡", label: "Insights", desc: "Learn from positional concepts and patterns" },
              ].map(({ icon, label, desc }) => (
                <div key={label} style={{
                  background: C.bg1,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  padding: "14px 16px",
                  textAlign: "center",
                  width: 130,
                  transition: "all 0.2s ease",
                }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
                  <div style={{ fontSize: 11, color: C.cream, fontFamily: SM, fontWeight: 600, marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 9, color: C.creamDim, fontFamily: SM, lineHeight: 1.4 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════ LOADING ═══════════ */}
        {loading && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
            padding: "100px 0",
          }}>
            <div style={{
              width: 50,
              height: 50,
              border: `3px solid ${C.bg3}`,
              borderTop: `3px solid ${C.goldBright}`,
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }} />
            <div style={{
              color: C.goldBright,
              fontFamily: SF,
              fontSize: 16,
              fontWeight: 600,
            }}>Fetching from Chess.com…</div>
            <div style={{ color: C.creamDim, fontFamily: SM, fontSize: 11 }}>
              Loading profile, ratings, and recent games
            </div>
          </div>
        )}

        {/* ═══════════ DASHBOARD ═══════════ */}
        {profile && dash && !loading && (
          <div className="fade-in">
            {/* Profile header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 18,
              marginBottom: 22,
              padding: "18px 22px",
              background: C.bg1,
              borderRadius: 14,
              border: `1px solid ${C.border}`,
            }}>
              {profile.avatar && (
                <img src={profile.avatar} alt=""
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: "50%",
                    border: `1px solid ${C.border}`,
                  }}
                />
              )}
              <div>
                <div style={{
                  fontSize: 24,
                  fontFamily: SF,
                  color: C.goldBright,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                }}>{profile.username}</div>
                <div style={{
                  fontSize: 12,
                  color: C.creamDim,
                  fontFamily: SM,
                  marginTop: 4,
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                }}>
                  {profile.name && (
                    <span style={{ color: C.cream }}>{profile.name}</span>
                  )}
                  <span>{dash.total} games · last 3 months</span>
                </div>
              </div>
              <div style={{
                marginLeft: "auto",
                display: "flex",
                gap: 10,
              }}>
                {[
                  ["WIN RATE", `${dash.winRate}%`, dash.winRate >= 55 ? C.winBright : dash.winRate <= 40 ? C.lossBright : C.goldBright],
                  ["GAMES", dash.total, C.cream],
                ].map(([l, v, c]) => (
                  <div key={l} style={{
                    textAlign: "center",
                    padding: "10px 16px",
                    background: C.bg2,
                    borderRadius: 9,
                    border: `1px solid ${C.border}`,
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: c, fontFamily: SF }}>{v}</div>
                    <div style={{ fontSize: 8, color: C.creamDim, fontFamily: SM, letterSpacing: "0.08em" }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tab bar */}
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              marginBottom: 18,
              background: C.bg1,
              padding: 5,
              borderRadius: 10,
              border: `1px solid ${C.border}`,
            }}>
              {TABS.map(({ id, l, icon }) => (
                <button key={id} onClick={() => setTab(id)} style={{
                  flex: 1,
                  padding: "9px 0",
                  borderRadius: 7,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: SM,
                  transition: "all 0.2s ease",
                  background: tab === id
                    ? C.gold
                    : "transparent",
                  color: tab === id ? C.bg0 : C.creamDim,
                  fontWeight: tab === id ? 700 : 400,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}>
                  <span style={{ fontSize: 13 }}>{icon}</span>
                  {l}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {tab === "overview" && <OverviewTab dash={dash} stats={stats} />}
            {tab === "openings" && <OpeningsTab dash={dash} />}
            {tab === "games" && <GamesTab dash={dash} ChessClass={Chess} onSelectGame={setGameReview} />}
            {tab === "coach" && <CoachTab stats={stats} dash={dash} username={username} />}
          </div>
        )}
      </div>
    </div>
  );
}
