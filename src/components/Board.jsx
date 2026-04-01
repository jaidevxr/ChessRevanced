/* ═══════════════════════════════════════════════════════════════
   Board — Interactive Chess Board with Unicode Pieces
   ═══════════════════════════════════════════════════════════════ */
import { C, SM } from "../tokens";

const PIECE_UNICODE = {
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
};

function parseFEN(fen) {
  return fen.split(" ")[0].split("/").map((row) => {
    const r = [];
    for (const ch of row) {
      if (isNaN(ch)) r.push(ch);
      else for (let i = 0; i < +ch; i++) r.push(null);
    }
    return r;
  });
}

export default function Board({ fen, flipped = false, highlightSquare = null }) {
  const board = parseFEN(fen);
  const files = "abcdefgh";
  const ranks = flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
  const colOrder = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const rowOrder = flipped ? [...board].reverse() : board;

  return (
    <div className="board-container" style={{
      border: `2px solid ${C.borderHover}`,
      borderRadius: 6,
      overflow: "hidden",
      boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${C.border}`,
      animation: "boardAppear 0.4s ease forwards",
      display: "flex",
      flexDirection: "column",
      background: C.bg2
    }}>
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        {rowOrder.map((row, ri) => (
          <div key={ri} style={{ display: "flex", flex: 1 }}>
            <div style={{
              width: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              color: C.creamDim,
              fontFamily: SM,
              background: C.bg2,
              flexShrink: 0,
            }}>
              {ranks[ri]}
            </div>
            {colOrder.map((ci) => {
              const pc = row[ci];
              const isLt = (ri + ci) % 2 === 0;
              const isHighlight = highlightSquare === `${files[ci]}${ranks[ri]}`;

              return (
                <div key={ci} style={{
                  flex: 1,
                  background: isHighlight
                    ? (isLt ? "#f6f686" : "#d4c644")
                    : (isLt ? C.sqLight : C.sqDark),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.15s ease",
                  position: "relative",
                }}>
                  {pc && (
                    <span style={{
                      fontSize: "clamp(20px, 6vw, 38px)",
                      lineHeight: 1,
                      userSelect: "none",
                      color: pc === pc.toUpperCase() ? "#fff" : "#1a1a1a",
                      textShadow: pc === pc.toUpperCase()
                        ? "0 1px 4px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.5)"
                        : "0 1px 3px rgba(255,255,255,0.5)",
                      filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.3))",
                      transition: "transform 0.15s ease",
                    }}>
                      {PIECE_UNICODE[pc] || ""}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", height: 16, background: C.bg2, flexShrink: 0 }}>
        <div style={{ width: 20, flexShrink: 0 }} />
        {colOrder.map((ci) => (
          <div key={ci} style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            color: C.creamDim,
            fontFamily: SM,
          }}>
            {files[ci]}
          </div>
        ))}
      </div>
    </div>
  );
}
