/* ═══════════════════════════════════════════════════════════════
   Markdown — Simple markdown-to-JSX renderer
   ═══════════════════════════════════════════════════════════════ */
import { C, SF, SM } from "../tokens";

export default function MD({ text = "" }) {
  return (
    <div>
      {text.split("\n").map((line, i) => {
        // H2 headers
        if (line.startsWith("## ")) {
          return (
            <h3 key={i} style={{
              color: C.goldBright,
              fontFamily: SF,
              fontSize: 16,
              fontWeight: 600,
              margin: "18px 0 8px",
              paddingBottom: 6,
              borderBottom: `1px solid ${C.border}`,
              letterSpacing: "-0.01em",
            }}>
              {line.slice(3)}
            </h3>
          );
        }

        // Bullet points
        if (/^[-•]\s/.test(line)) {
          return (
            <div key={i} style={{
              display: "flex",
              gap: 8,
              margin: "5px 0",
              color: C.cream,
              fontSize: 13,
              lineHeight: 1.7,
            }}>
              <span style={{ color: C.gold, flexShrink: 0, fontSize: 10, marginTop: 3 }}>◆</span>
              <span>{line.replace(/^[-•]\s*/, "")}</span>
            </div>
          );
        }

        // Regular paragraphs
        if (line.trim()) {
          return (
            <p key={i} style={{
              color: C.cream,
              fontSize: 13,
              lineHeight: 1.75,
              margin: "5px 0",
            }}>
              {line}
            </p>
          );
        }

        return null;
      })}
    </div>
  );
}
