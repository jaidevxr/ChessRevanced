/* ═══════════════════════════════════════════════════════════════
   ChartTooltip — Unified tooltip for Recharts
   ═══════════════════════════════════════════════════════════════ */
import { C, SM } from "../tokens";

export default function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: C.bg0,
      border: `1px solid ${C.borderHover}`,
      borderRadius: 8,
      padding: "10px 14px",
      fontSize: 12,
      fontFamily: SM,
      boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
    }}>
      <div style={{ color: C.goldBright, marginBottom: 5, fontWeight: 600, fontSize: 11 }}>
        {label}
      </div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || C.cream, fontSize: 11, lineHeight: 1.6 }}>
          {p.name}: <b>{p.value}</b>
        </div>
      ))}
    </div>
  );
}
