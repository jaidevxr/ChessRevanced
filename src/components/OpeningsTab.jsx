/* ═══════════════════════════════════════════════════════════════
   OpeningsTab — Opening performance analysis
   ═══════════════════════════════════════════════════════════════ */
import {
  BarChart, Bar, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { C, SF, SM } from "../tokens";
import ChartTooltip from "./ChartTooltip";

export default function OpeningsTab({ dash }) {
  const od = dash.openingData;

  if (!od.length) {
    return (
      <div style={{
        color: C.creamDim,
        textAlign: "center",
        padding: 70,
        fontFamily: SM,
        fontSize: 13,
        background: C.bg1,
        borderRadius: 12,
        border: `1px solid ${C.border}`,
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>♟</div>
        Need ≥2 games per opening to show stats
      </div>
    );
  }

  return (
    <div className="slide-up" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Chart */}
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
          letterSpacing: "0.08em",
          marginBottom: 12,
          textTransform: "uppercase",
        }}>Win Rate by Opening</div>
        <ResponsiveContainer width="100%" height={Math.max(280, od.length * 38)}>
          <BarChart data={od} layout="vertical" barSize={12}>
            <CartesianGrid strokeDasharray="2 4" stroke={C.bg4} horizontal={false} />
            <XAxis type="number" domain={[0, 100]}
              tick={{ fill: C.creamDim, fontSize: 9, fontFamily: SM }}
              axisLine={false} tickLine={false}
              tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="name" width={180}
              tick={{ fill: C.cream, fontSize: 10, fontFamily: SM }}
              axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="winRate" name="Win %" radius={[0, 5, 5, 0]}>
              {od.map((o) => (
                <Cell key={o.name}
                  fill={o.winRate >= 55 ? C.win : o.winRate <= 35 ? C.loss : C.gold} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div style={{
        background: C.bg1,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        overflow: "hidden",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: SM }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {["Opening", "ECO", "G", "W", "L", "D", "Win%"].map((h) => (
                <th key={h} style={{
                  padding: "10px 14px",
                  textAlign: h === "Opening" ? "left" : "center",
                  color: C.gold,
                  fontSize: 9,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {od.map((o, i) => (
              <tr key={o.name} style={{
                borderBottom: `1px solid ${C.border}`,
                background: i % 2 === 0 ? C.bg2 : C.bg1,
                transition: "background 0.15s ease",
              }}
                onMouseOver={(e) => { e.currentTarget.style.background = C.bg3; }}
                onMouseOut={(e) => { e.currentTarget.style.background = i % 2 === 0 ? C.bg2 : C.bg1; }}
              >
                <td style={{
                  padding: "10px 14px",
                  color: C.cream,
                  maxWidth: 200,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontWeight: 500,
                }}>{o.name}</td>
                <td style={{ padding: "10px 14px", color: C.creamDim, textAlign: "center" }}>{o.eco || "—"}</td>
                <td style={{ padding: "10px 14px", color: C.cream, textAlign: "center" }}>{o.total}</td>
                <td style={{ padding: "10px 14px", color: C.winBright, textAlign: "center", fontWeight: 600 }}>{o.wins}</td>
                <td style={{ padding: "10px 14px", color: C.lossBright, textAlign: "center", fontWeight: 600 }}>{o.losses}</td>
                <td style={{ padding: "10px 14px", color: C.drawBright, textAlign: "center" }}>{o.draws}</td>
                <td style={{ padding: "10px 14px", textAlign: "center" }}>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: o.winRate >= 55 ? C.winBright : o.winRate <= 35 ? C.lossBright : C.goldBright,
                  }}>{o.winRate}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
