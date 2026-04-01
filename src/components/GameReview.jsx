/* ═══════════════════════════════════════════════════════════════
   GameReview — Full Chess.com-style move-by-move game review
   ═══════════════════════════════════════════════════════════════ */
import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { C, SF, SM, CM } from "../tokens";
import { gameCoach } from "../api";
import Board from "./Board";
import EvalBar from "./EvalBar";
import MD from "./Markdown";

export default function GameReview({ game, username, onBack }) {
  const [idx, setIdx] = useState(game.moveData.length - 1);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoad] = useState(false);
  const [aiErr, setAiErr] = useState("");
  const listRef = useRef(null);

  const cur = game.moveData[idx];
  const curFen = cur?.fen || game.startFen;
  const curEval = cur?.eval || 0;
  const isW = game.isWhite;
  const myAcc = isW ? game.whiteAcc : game.blackAcc;
  const thAcc = isW ? game.blackAcc : game.whiteAcc;
  const myName = isW ? game.header.White : game.header.Black;
  const thName = isW ? game.header.Black : game.header.White;
  const myCls = game.classCounts[isW ? "white" : "black"];
  const thCls = game.classCounts[isW ? "black" : "white"];

  const evalData = game.moveData.map((m, i) => ({
    i,
    ev: Math.max(-800, Math.min(800, m.eval)),
    lbl: `${m.moveNum}${m.color === "w" ? "." : "..."}${m.san}`,
  }));

  // Auto-scroll move list
  useEffect(() => {
    if (listRef.current) {
      const el = listRef.current.querySelector(`[data-i="${idx}"]`);
      if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [idx]);

  // Keyboard navigation
  useEffect(() => {
    const handle = (e) => {
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
      else if (e.key === "ArrowRight") setIdx((i) => Math.min(game.moveData.length - 1, i + 1));
      else if (e.key === "Home") setIdx(0);
      else if (e.key === "End") setIdx(game.moveData.length - 1);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [game.moveData.length]);

  const navBtn = (lbl, fn, dis) => (
    <button onClick={fn} disabled={dis} style={{
      background: dis ? C.bg3 : C.bg4,
      color: dis ? C.creamDim : C.cream,
      border: `1px solid ${dis ? C.border : C.borderHover}`,
      padding: "6px 14px",
      borderRadius: 6,
      cursor: dis ? "default" : "pointer",
      fontFamily: SM,
      fontSize: 12,
      transition: "all 0.15s ease",
      fontWeight: 500,
    }}>
      {lbl}
    </button>
  );

  // Build move pairs
  const pairs = [];
  for (let i = 0; i < game.moveData.length; i += 2) {
    pairs.push({
      num: Math.floor(i / 2) + 1,
      w: game.moveData[i],
      b: game.moveData[i + 1],
      wi: i,
      bi: i + 1,
    });
  }

  const runAI = async () => {
    setAiLoad(true);
    setAiErr("");
    try {
      setAiText(await gameCoach(game, username));
    } catch (e) {
      setAiErr(e.message);
    } finally {
      setAiLoad(false);
    }
  };

  const clsRow = (label, key, color) => {
    const mv = myCls[key] || 0, tv = thCls[key] || 0;
    if (!mv && !tv) return null;
    return (
      <div key={key} style={{
        display: "grid",
        gridTemplateColumns: "1fr 100px 1fr",
        gap: 6,
        alignItems: "center",
        marginBottom: 4,
        padding: "2px 0",
      }}>
        <div style={{
          textAlign: "right",
          fontFamily: SM,
          fontSize: 12,
          color: mv ? color : C.creamDim,
          fontWeight: mv ? 600 : 400,
        }}>{mv || "—"}</div>
        <div style={{
          textAlign: "center",
          fontSize: 10,
          color: C.creamDim,
          fontFamily: SM,
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
        }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
            opacity: 0.7,
            flexShrink: 0,
          }} />
          {label}
        </div>
        <div style={{
          textAlign: "left",
          fontFamily: SM,
          fontSize: 12,
          color: tv ? color : C.creamDim,
          fontWeight: tv ? 600 : 400,
        }}>{tv || "—"}</div>
      </div>
    );
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        marginBottom: 22,
        flexWrap: "wrap",
      }}>
        <button onClick={onBack} style={{
          background: "transparent",
          border: `1px solid ${C.border}`,
          color: C.creamDim,
          padding: "8px 16px",
          borderRadius: 7,
          cursor: "pointer",
          fontFamily: SM,
          fontSize: 11,
          transition: "all 0.2s ease",
        }}
          onMouseOver={(e) => { e.target.style.borderColor = C.gold; e.target.style.color = C.cream; }}
          onMouseOut={(e) => { e.target.style.borderColor = C.border; e.target.style.color = C.creamDim; }}
        >← Dashboard</button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            color: C.goldBright,
            fontFamily: SF,
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "-0.01em",
          }}>{game.opening}</div>
          {game.engineUsed && (
            <span style={{
              fontSize: 8,
              color: C.winBright,
              fontFamily: SM,
              background: "#0d2415",
              padding: "2px 7px",
              borderRadius: 4,
              border: `1px solid ${C.win}`,
              letterSpacing: "0.04em",
            }}>
              {game.engineUsed}{game.analysisDepth ? ` · d${game.analysisDepth}` : ""}
            </span>
          )}
          <span style={{
            fontSize: 9,
            color: C.creamDim,
            fontFamily: SM,
            background: C.bg3,
            padding: "2px 7px",
            borderRadius: 4,
            border: `1px dashed ${C.border}`,
          }}>
            [Algo Calc: W={game.algorithmicWhiteAcc}% B={game.algorithmicBlackAcc}%] | [API True: W={game.apiWhiteAcc || 'N/A'}% B={game.apiBlackAcc || 'N/A'}%]
          </span>
        </div>
        <div style={{
          marginLeft: "auto",
          fontSize: 11,
          color: C.creamDim,
          fontFamily: SM,
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}>
          <span style={{
            padding: "3px 8px",
            borderRadius: 4,
            background: game.result === "1-0" ? (isW ? "#0d2415" : "#2a0d0d") : game.result === "0-1" ? (isW ? "#2a0d0d" : "#0d2415") : "#14142a",
            color: game.result === "1-0" ? (isW ? C.winBright : C.lossBright) : game.result === "0-1" ? (isW ? C.lossBright : C.winBright) : C.drawBright,
            fontWeight: 600,
          }}>
            {game.result}
          </span>
          <span>{(game.header.Date || "").slice(0, 10)}</span>
        </div>
      </div>

      {/* Main grid: Board+Eval | Right Panel */}
      <div className="chess-grid" style={{ gap: 18 }}>
        {/* Play column */}
        <div className="mobile-board-row" style={{ display: "flex", gap: "12px", alignItems: "start" }}>
          {/* Board & Nav Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, minWidth: 0 }}>
          {/* Opponent name bar */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 12px",
            background: C.bg2,
            borderRadius: 8,
            border: `1px solid ${C.border}`,
          }}>
            <div style={{
              width: 14, height: 14, borderRadius: 3,
              background: isW ? "#1a1a1a" : "#f0f0f0",
              border: "1px solid #555",
            }} />
            <span style={{ fontFamily: SM, fontSize: 13, color: C.cream, flex: 1, fontWeight: 500 }}>
              {thName || "Opponent"}
            </span>
            <span style={{
              fontFamily: SM, fontSize: 12, color: C.goldBright, fontWeight: 600,
              background: C.bg4, padding: "2px 8px", borderRadius: 4,
            }}>{thAcc}%</span>
          </div>

          <Board fen={curFen} flipped={!isW} />

          {/* Player name bar */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 12px",
            background: C.bg2,
            borderRadius: 8,
            border: `1px solid ${C.border}`,
          }}>
            <div style={{
              width: 14, height: 14, borderRadius: 3,
              background: isW ? "#f0f0f0" : "#1a1a1a",
              border: "1px solid #ccc",
            }} />
            <span style={{ fontFamily: SM, fontSize: 13, color: C.cream, flex: 1, fontWeight: 500 }}>
              {myName || username}
            </span>
            <span style={{
              fontFamily: SM, fontSize: 12, color: C.goldBright, fontWeight: 600,
              background: C.bg4, padding: "2px 8px", borderRadius: 4,
            }}>{myAcc}%</span>
          </div>

          {/* Navigation */}
          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
            {navBtn("|←", () => setIdx(0), idx === 0)}
            {navBtn("←", () => setIdx((i) => Math.max(0, i - 1)), idx === 0)}
            {navBtn("→", () => setIdx((i) => Math.min(game.moveData.length - 1, i + 1)), idx >= game.moveData.length - 1)}
            {navBtn("→|", () => setIdx(game.moveData.length - 1), idx >= game.moveData.length - 1)}
          </div>

          {/* Current move classification badge */}
          {cur && (
            <div style={{
              textAlign: "center",
              padding: "8px 12px",
              background: CM[cur.classification]?.bg || C.bg1,
              borderRadius: 8,
              border: `1px solid ${CM[cur.classification]?.color || C.border}`,
              transition: "all 0.3s ease",
            }}>
              <span style={{
                color: CM[cur.classification]?.color,
                fontFamily: SM,
                fontSize: 13,
                fontWeight: 700,
              }}>
                {CM[cur.classification]?.icon} {CM[cur.classification]?.label}
              </span>
              <span style={{ color: C.cream, fontFamily: SM, fontSize: 13, marginLeft: 8, fontWeight: 500 }}>
                {cur.san}
              </span>
              {cur.wpLoss > 0 && (
                <span style={{ color: C.creamDim, fontFamily: SM, fontSize: 10, marginLeft: 8 }}>
                  (-{cur.wpLoss}% WP)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Eval bar */}
        <div className="eval-bar-wrapper" style={{ display: "flex", flexShrink: 0 }}>
          <EvalBar ev={curEval} h="100%" minHeight={300} />
        </div>
      </div>

      {/* Right panel */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
          {/* Accuracy + classification panel */}
          <div style={{
            background: C.bg1,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 16,
          }}>
            <div style={{
              fontSize: 10,
              color: C.creamDim,
              fontFamily: SM,
              marginBottom: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}>Accuracy</div>

            {/* Accuracy scores */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              gap: 12,
              alignItems: "center",
              marginBottom: 16,
              padding: "10px 0",
              borderBottom: `1px solid ${C.border}`,
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{
                  fontSize: 30,
                  fontWeight: 800,
                  color: myAcc >= 80 ? C.winBright : myAcc >= 60 ? C.goldBright : C.lossBright,
                  fontFamily: SF,
                  lineHeight: 1,
                }}>{myAcc}</div>
                <div style={{ fontSize: 9, color: C.creamDim, fontFamily: SM, marginTop: 4 }}>
                  {(myName || "You").slice(0, 12)}
                </div>
              </div>
              <div style={{
                fontSize: 12,
                color: C.creamDim,
                fontFamily: SM,
                padding: "4px 8px",
                background: C.bg4,
                borderRadius: 4,
              }}>vs</div>
              <div style={{ textAlign: "center" }}>
                <div style={{
                  fontSize: 30,
                  fontWeight: 800,
                  color: thAcc >= 80 ? C.winBright : thAcc >= 60 ? C.goldBright : C.lossBright,
                  fontFamily: SF,
                  lineHeight: 1,
                }}>{thAcc}</div>
                <div style={{ fontSize: 9, color: C.creamDim, fontFamily: SM, marginTop: 4 }}>
                  {(thName || "Opp").slice(0, 12)}
                </div>
              </div>
            </div>

            <div style={{
              fontSize: 10,
              color: C.creamDim,
              fontFamily: SM,
              marginBottom: 8,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}>Move Quality</div>

            {[
              ["Brilliant", "brilliant", C.brilliant],
              ["Great", "great", C.great],
              ["Best", "best", C.best],
              ["Excellent", "excellent", C.excellent],
              ["Good", "good", C.good],
              ["Inaccuracy", "inaccuracy", C.inaccuracy],
              ["Mistake", "mistake", C.mistake],
              ["Blunder", "blunder", C.blunder],
              ["Book", "book", C.book],
            ].map(([lbl, k, col]) => clsRow(lbl, k, col))}
          </div>

          {/* Move list */}
          <div style={{
            background: C.bg1,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            overflow: "hidden",
          }}>
            <div style={{
              padding: "10px 14px",
              borderBottom: `1px solid ${C.border}`,
              fontSize: 10,
              color: C.creamDim,
              fontFamily: SM,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}>Moves</div>
            <div ref={listRef} style={{ overflowY: "auto", maxHeight: 280, fontFamily: SM, fontSize: 11 }}>
              {pairs.map(({ num, w, b, wi, bi }) => (
                <div key={num} style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "2px 8px",
                  borderBottom: `1px solid ${C.bg3}`,
                }}>
                  <span style={{
                    color: C.creamDim,
                    width: 26,
                    flexShrink: 0,
                    fontSize: 10,
                    fontWeight: 500,
                  }}>{num}.</span>

                  {/* White move */}
                  {w && (
                    <button data-i={wi} onClick={() => setIdx(wi)} style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 6px",
                      borderRadius: 4,
                      background: idx === wi ? C.bg4 : "transparent",
                      border: idx === wi ? `1px solid ${CM[w.classification]?.color || C.border}` : "1px solid transparent",
                      cursor: "pointer",
                      color: idx === wi ? C.cream : C.creamMid,
                      textAlign: "left",
                      transition: "all 0.15s ease",
                    }}>
                      <span style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: CM[w.classification]?.bg,
                        color: CM[w.classification]?.color,
                        fontSize: 7,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        border: `1px solid ${CM[w.classification]?.color || C.border}`,
                      }}>{CM[w.classification]?.icon}</span>
                      <span style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontSize: 12,
                        fontWeight: idx === wi ? 600 : 400,
                      }}>{w.san}</span>
                    </button>
                  )}

                  {/* Black move */}
                  {b && (
                    <button data-i={bi} onClick={() => setIdx(bi)} style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 6px",
                      borderRadius: 4,
                      background: idx === bi ? C.bg4 : "transparent",
                      border: idx === bi ? `1px solid ${CM[b.classification]?.color || C.border}` : "1px solid transparent",
                      cursor: "pointer",
                      color: idx === bi ? C.cream : C.creamMid,
                      textAlign: "left",
                      transition: "all 0.15s ease",
                    }}>
                      <span style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: CM[b.classification]?.bg,
                        color: CM[b.classification]?.color,
                        fontSize: 7,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        border: `1px solid ${CM[b.classification]?.color || C.border}`,
                      }}>{CM[b.classification]?.icon}</span>
                      <span style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontSize: 12,
                        fontWeight: idx === bi ? 600 : 400,
                      }}>{b.san}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Eval graph */}
      <div style={{
        marginTop: 16,
        background: C.bg1,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: "16px 18px",
      }}>
        <div style={{
          fontSize: 10,
          color: C.creamDim,
          fontFamily: SM,
          letterSpacing: "0.08em",
          marginBottom: 10,
          textTransform: "uppercase",
          display: "flex",
          justifyContent: "space-between",
        }}>
          <span>Position Evaluation Graph</span>
          <span style={{ color: C.bg4, textTransform: "none", letterSpacing: 0 }}>click to jump to move</span>
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={evalData} onClick={(d) => d?.activePayload && setIdx(d.activePayload[0].payload.i)}>
            <defs>
              <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e8e8d0" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#e8e8d0" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="bg2g" x1="0" y1="1" x2="0" y2="0">
                <stop offset="5%" stopColor="#1a1a2a" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#1a1a2a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 6" stroke={C.bg4} vertical={false} />
            <XAxis
              dataKey="i"
              tick={{ fill: C.creamDim, fontSize: 8, fontFamily: SM }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${Math.floor(v / 2) + 1}`}
            />
            <YAxis domain={[-800, 800]} tick={false} axisLine={false} />
            <Tooltip content={({ active, payload }) =>
              active && payload?.length ? (
                <div style={{
                  background: C.bg0,
                  border: `1px solid ${C.borderHover}`,
                  borderRadius: 7,
                  padding: "6px 10px",
                  fontSize: 11,
                  fontFamily: SM,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                }}>
                  <div style={{ color: C.goldBright, fontWeight: 600 }}>{payload[0].payload.lbl}</div>
                  <div style={{ color: C.cream }}>{(payload[0].value / 100).toFixed(2)}</div>
                </div>
              ) : null
            } />
            <ReferenceLine y={0} stroke={C.border} strokeWidth={1} />
            <Area
              type="monotone"
              dataKey="ev"
              stroke={C.goldBright}
              strokeWidth={1.5}
              fill={curEval > 0 ? "url(#wg)" : "url(#bg2g)"}
              dot={false}
              activeDot={{ r: 5, fill: C.goldBright, stroke: C.bg0, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Strategic Insights */}
      <div style={{
        marginTop: 16,
        background: C.bg1,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: "18px 22px",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}>
          <div style={{
            fontSize: 10,
            color: C.creamDim,
            fontFamily: SM,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <span style={{ fontSize: 16 }}>💡</span>
            Strategic Game Insights
          </div>
          {!aiText && !aiLoading && (
            <button onClick={runAI} style={{
              background: C.gold,
              color: C.bg0,
              border: "none",
              padding: "8px 18px",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
              fontFamily: SM,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => { e.target.style.background = C.goldBright; }}
            onMouseOut={(e) => { e.target.style.background = C.gold; }}
            >Generate Insights →</button>
          )}
          {aiText && !aiLoading && (
            <button onClick={runAI} style={{
              background: "transparent",
              color: C.gold,
              border: `1px solid ${C.goldDim}`,
              padding: "6px 14px",
              borderRadius: 6,
              fontSize: 10,
              fontFamily: SM,
              cursor: "pointer",
            }}>Refresh ↻</button>
          )}
        </div>
        {aiLoading && (
          <div style={{ color: C.creamDim, fontFamily: SM, fontSize: 13, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 18, height: 18,
              border: `2px solid ${C.bg4}`,
              borderTop: `2px solid ${C.goldBright}`,
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }} />
            Analyzing {game.moveData.length} moves for structural concepts…
          </div>
        )}
        {aiErr && (
          <div style={{ color: C.lossBright, fontFamily: SM, fontSize: 12, padding: "8px 12px", background: "#2a0808", borderRadius: 6 }}>
            ⚠ {aiErr}
          </div>
        )}
        {aiText && <MD text={aiText} />}
        {!aiText && !aiLoading && !aiErr && (
          <div style={{ color: C.creamDim, fontSize: 13, fontFamily: SM, lineHeight: 1.7 }}>
            Get a structural breakdown of this specific game — opening choices, critical moments, and positional concepts to practice next.
          </div>
        )}
      </div>
    </div>
  );
}
