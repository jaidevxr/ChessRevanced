/* ═══════════════════════════════════════════════════════════════
   EvalBar — Vertical evaluation bar showing white/black advantage
   ═══════════════════════════════════════════════════════════════ */
import { C, SM } from "../tokens";

export default function EvalBar({ ev, h = 460, minHeight }) {
  const cl = Math.max(-800, Math.min(800, ev || 0));
  const wpct = Math.round(50 + (cl / 800) * 50);
  const isWhiteAdvantage = (ev || 0) > 0;
  const absEval = Math.abs(ev || 0);
  const lbl = absEval > 3000 ? "M" : ((ev || 0) / 100).toFixed(1);

  return (
    <div style={{
      width: 24,
      height: h,
      minHeight: minHeight,
      display: "flex",
      flexDirection: "column",
      borderRadius: 6,
      overflow: "hidden",
      border: `1px solid ${C.borderHover}`,
      position: "relative",
      flexShrink: 0,
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    }}>
      {/* Black's side */}
      <div style={{
        flex: 1,
        background: C.cream,
      }} />
      {/* White's side */}
      <div style={{
        height: `${wpct}%`,
        background: C.bg0,
        transition: "height 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
      }} />
      {/* Label */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        fontSize: 8,
        fontFamily: SM,
        color: isWhiteAdvantage ? "#1a1a1a" : "#f0f0f0",
        fontWeight: 700,
        whiteSpace: "nowrap",
        textShadow: isWhiteAdvantage
          ? "0 0 4px rgba(255,255,255,0.5)"
          : "0 0 4px rgba(0,0,0,0.5)",
        letterSpacing: "0.02em",
      }}>
        {lbl}
      </div>
    </div>
  );
}
