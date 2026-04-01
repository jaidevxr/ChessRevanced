/* ═══════════════════════════════════════════════════════════════
   OverviewTab — Ratings, Win/Loss pie, Monthly bar chart, Radar
   ═══════════════════════════════════════════════════════════════ */
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { C, SF, SM } from "../tokens";
import ChartTooltip from "./ChartTooltip";

export default function OverviewTab({ dash, stats }) {
  const pie = [
    { name: "Wins", value: dash.wins, color: C.win },
    { name: "Losses", value: dash.losses, color: C.loss },
    { name: "Draws", value: dash.draws, color: C.draw },
  ].filter((d) => d.value > 0);

  const rtgs = [
    { l: "RAPID", d: stats?.chess_rapid, icon: "🏰", gradient: C.bg2 },
    { l: "BLITZ", d: stats?.chess_blitz, icon: "⚡", gradient: C.bg2 },
    { l: "BULLET", d: stats?.chess_bullet, icon: "🔥", gradient: C.bg2 },
  ];

  return (
    <div className="slide-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Rating cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {rtgs.map(({ l, d, icon, gradient }) => (
          <div key={l} style={{
            background: gradient,
            border: `1px solid ${C.borderHover}`,
            borderRadius: 14,
            padding: "20px 20px",
            textAlign: "center",
            transition: "all 0.3s ease",
            cursor: "default",
            position: "relative",
            overflow: "hidden",
          }}
            onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3)`; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
            <div style={{
              fontSize: 10,
              color: C.gold,
              fontFamily: SM,
              letterSpacing: "0.12em",
              marginBottom: 8,
            }}>{l}</div>
            <div style={{
              fontSize: 32,
              color: C.cream,
              fontFamily: SF,
              fontWeight: 800,
              lineHeight: 1,
            }}>{d?.last?.rating ?? "—"}</div>
            <div style={{
              fontSize: 10,
              color: C.creamDim,
              marginTop: 6,
              fontFamily: SM,
            }}>Best: {d?.best?.rating ?? "—"}</div>
            {d?.record && (
              <div style={{
                fontSize: 9,
                color: C.creamDim,
                marginTop: 4,
                fontFamily: SM,
                display: "flex",
                justifyContent: "center",
                gap: 8,
              }}>
                <span style={{ color: C.winBright }}>{d.record.win}W</span>
                <span style={{ color: C.lossBright }}>{d.record.loss}L</span>
                <span style={{ color: C.drawBright }}>{d.record.draw}D</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pie + Monthly bar */}
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 14 }}>
        {/* Win rate pie */}
        <div style={{
          background: C.bg1,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
          <div style={{
            fontSize: 10,
            color: C.creamDim,
            fontFamily: SM,
            letterSpacing: "0.08em",
            marginBottom: 8,
            textTransform: "uppercase",
          }}>Record</div>
          <PieChart width={140} height={140}>
            <Pie data={pie} cx={70} cy={70} innerRadius={42} outerRadius={65}
              paddingAngle={3} dataKey="value" strokeWidth={0}>
              {pie.map((d) => <Cell key={d.name} fill={d.color} />)}
            </Pie>
          </PieChart>
          <div style={{ textAlign: "center", marginTop: -2 }}>
            <div style={{
              fontSize: 22,
              fontWeight: 800,
              color: C.goldBright,
              fontFamily: SF,
              lineHeight: 1,
            }}>{dash.winRate}%</div>
            <div style={{ fontSize: 9, color: C.creamDim, fontFamily: SM, marginTop: 2 }}>WIN RATE</div>
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
            {[
              ["W", dash.wins, C.winBright],
              ["L", dash.losses, C.lossBright],
              ["D", dash.draws, C.drawBright],
            ].map(([l, v, c]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: c, fontFamily: SF }}>{v}</div>
                <div style={{ fontSize: 8, color: C.creamDim, fontFamily: SM }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly results chart */}
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
            marginBottom: 10,
            textTransform: "uppercase",
          }}>Monthly Results</div>
          {dash.monthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={dash.monthData} barSize={16} barGap={3}>
                <CartesianGrid strokeDasharray="2 4" stroke={C.bg4} vertical={false} />
                <XAxis dataKey="label"
                  tick={{ fill: C.creamDim, fontSize: 10, fontFamily: SM }}
                  axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: C.creamDim, fontSize: 10, fontFamily: SM }}
                  axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="wins" name="Wins" fill={C.win} radius={[4, 4, 0, 0]} />
                <Bar dataKey="losses" name="Losses" fill={C.loss} radius={[4, 4, 0, 0]} />
                <Bar dataKey="draws" name="Draws" fill={C.draw} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{
              color: C.creamDim,
              fontSize: 12,
              textAlign: "center",
              padding: 50,
              fontFamily: SM,
            }}>No monthly data available</div>
          )}
        </div>
      </div>

      {/* Radar + Time Controls */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Skill radar */}
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
            marginBottom: 6,
            textTransform: "uppercase",
          }}>Skill Profile</div>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={dash.radarData}>
              <PolarGrid stroke={C.bg4} />
              <PolarAngleAxis dataKey="skill"
                tick={{ fill: C.creamDim, fontSize: 10, fontFamily: SM }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="value"
                stroke={C.gold} fill={C.gold}
                fillOpacity={0.22} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Time controls breakdown */}
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
            marginBottom: 14,
            textTransform: "uppercase",
          }}>Time Controls</div>
          {dash.tcData.map(({ name, value }) => {
            const p = Math.round((value / dash.total) * 100);
            const cols = {
              Bullet: C.lossBright,
              Blitz: C.goldBright,
              Rapid: C.winBright,
              Classical: "#8888dd",
              Other: C.creamDim,
            };
            return (
              <div key={name} style={{ marginBottom: 12 }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}>
                  <span style={{ fontSize: 12, color: C.cream, fontFamily: SM, fontWeight: 500 }}>
                    {name}
                  </span>
                  <span style={{ fontSize: 10, color: C.creamDim, fontFamily: SM }}>
                    {value} ({p}%)
                  </span>
                </div>
                <div style={{
                  height: 6,
                  background: C.bg4,
                  borderRadius: 3,
                  overflow: "hidden",
                }}>
                  <div style={{
                    width: `${p}%`,
                    height: "100%",
                    background: cols[name] || C.creamDim,
                    borderRadius: 3,
                    transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
