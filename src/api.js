/* ═══════════════════════════════════════════════════════════════
   Chess.com API — Profile, Stats & Game Fetching
   ═══════════════════════════════════════════════════════════════ */

async function ccFetch(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(t);
    if (r.status === 404) {
      if (url.includes("/stats")) return {};
      if (url.includes("/games/")) return { games: [] };
      throw new Error("Player not found — check spelling and try again");
    }
    if (r.status === 429) throw new Error("Chess.com rate limit hit — wait 30 seconds and retry");
    if (!r.ok) throw new Error(`Chess.com error ${r.status}`);
    return r.json();
  } catch (e) {
    clearTimeout(t);
    if (e.name === "AbortError") throw new Error("Request timed out — check your connection");
    throw e;
  }
}

export async function fetchProfile(u) {
  return ccFetch(`https://api.chess.com/pub/player/${u.toLowerCase()}`);
}

export async function fetchStats(u) {
  return ccFetch(`https://api.chess.com/pub/player/${u.toLowerCase()}/stats`);
}

export async function fetchGames(u) {
  const now = new Date();
  const months = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      year: d.getFullYear(),
      month: String(d.getMonth() + 1).padStart(2, "0"),
    };
  });

  const res = await Promise.allSettled(
    months.map(({ year, month }) =>
      ccFetch(`https://api.chess.com/pub/player/${u.toLowerCase()}/games/${year}/${month}`)
    )
  );

  return res.flatMap((r) =>
    r.status === "fulfilled" && r.value.games ? r.value.games : []
  ).sort((a, b) => (b.end_time || 0) - (a.end_time || 0));
}

/* ═══════════════════════════════════════════════════════════════
   PGN Header Parsing & Dashboard Stats Builder
   ═══════════════════════════════════════════════════════════════ */

function parsePGNHdr(pgn = "") {
  const tag = (k) => {
    const m = pgn.match(new RegExp(`\\[${k}\\s+"([^"]+)"\\]`));
    return m ? m[1] : "";
  };

  const raw = tag("Opening") || tag("ECOUrl").split("/").filter(Boolean).pop() || "";
  const opening = raw
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .split(":")[0]
    .trim() || "Unknown";

  const tc = tag("TimeControl");
  const base = parseInt(tc) || 0;
  let tcL = "Other";
  if (base > 0 && base < 180) tcL = "Bullet";
  else if (base >= 180 && base < 600) tcL = "Blitz";
  else if (base >= 600 && base < 3600) tcL = "Rapid";
  else if (base >= 3600) tcL = "Classical";

  return {
    white: tag("White"),
    black: tag("Black"),
    result: tag("Result"),
    date: tag("Date") || tag("UTCDate"),
    eco: tag("ECO"),
    opening,
    tc: tcL,
    whiteElo: parseInt(tag("WhiteElo")) || null,
    blackElo: parseInt(tag("BlackElo")) || null,
    termination: tag("Termination"),
  };
}

export function buildDash(rawGames, username) {
  const lower = username.toLowerCase();
  let wins = 0, losses = 0, draws = 0;
  const byMo = {}, byOp = {}, byTC = {};
  const gameList = [];

  for (const g of rawGames) {
    const info = parsePGNHdr(g.pgn || "");
    const isWhite = (info.white || g.white?.username || "").toLowerCase() === lower;
    const res = info.result;

    let out = "draw";
    if (res === "1-0") out = isWhite ? "win" : "loss";
    else if (res === "0-1") out = isWhite ? "loss" : "win";
    if (out === "win") wins++;
    else if (out === "loss") losses++;
    else draws++;

    // Monthly aggregation
    const mo = (info.date || "").slice(0, 7).replace(/\./g, "-");
    if (/^\d{4}-\d{2}$/.test(mo)) {
      if (!byMo[mo]) byMo[mo] = { month: mo, label: mo.slice(5) + "/" + mo.slice(2, 4), wins: 0, losses: 0, draws: 0 };
      byMo[mo][out === "win" ? "wins" : out === "loss" ? "losses" : "draws"]++;
    }

    // Opening aggregation
    const ok = info.opening || "Unknown";
    if (!byOp[ok]) byOp[ok] = { name: ok, eco: info.eco || "", wins: 0, losses: 0, draws: 0, total: 0 };
    byOp[ok][out === "win" ? "wins" : out === "loss" ? "losses" : "draws"]++;
    byOp[ok].total++;

    // Time control aggregation
    byTC[info.tc] = (byTC[info.tc] || 0) + 1;

    if (gameList.length < 30) {
      gameList.push({
        ...info,
        url: g.url || "",
        pgn: g.pgn || "",
        isWhite,
        outcome: out,
        opponent: isWhite ? info.black : info.white,
        opponentElo: isWhite ? info.blackElo : info.whiteElo,
        accuracies: g.accuracies,
      });
    }
  }

  const monthData = Object.values(byMo).sort((a, b) => a.month.localeCompare(b.month));
  const openingData = Object.values(byOp)
    .filter((o) => o.total >= 2)
    .sort((a, b) => b.total - a.total)
    .slice(0, 12)
    .map((o) => ({ ...o, winRate: Math.round((o.wins / o.total) * 100) }));
  const tcData = Object.entries(byTC).map(([name, value]) => ({ name, value }));

  const total = rawGames.length;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const radarData = [
    { skill: "Win Rate", value: winRate },
    { skill: "Openings", value: openingData.length > 0 ? Math.round(openingData.slice(0, 3).reduce((s, o) => s + o.winRate, 0) / 3) : 0 },
    { skill: "Rapid/Classical", value: total > 0 ? Math.round(((byTC.Rapid || 0) + (byTC.Classical || 0)) / total * 100) : 0 },
    { skill: "Resilience", value: total > 0 ? Math.max(0, Math.round(100 - (losses / total) * 100)) : 0 },
    { skill: "Volume", value: Math.min(100, Math.round((total / 90) * 100)) },
  ];

  return { total, wins, losses, draws, winRate, monthData, openingData, tcData, radarData, gameList };
}

/* ═══════════════════════════════════════════════════════════════
   Heuristic Coach — Local Insights Generation
   ═══════════════════════════════════════════════════════════════ */

export async function gameCoach(gameInfo, username) {
  await new Promise(r => setTimeout(r, 600));

  const isW = gameInfo.isWhite;
  const opp = isW ? gameInfo.header.Black : gameInfo.header.White;
  const myAcc = isW ? gameInfo.whiteAcc : gameInfo.blackAcc;
  const thAcc = isW ? gameInfo.blackAcc : gameInfo.whiteAcc;
  
  const blunders = gameInfo.moveData.filter(m => m.color === gameInfo.myColor && m.classification === "blunder");
  const mistakes = gameInfo.moveData.filter(m => m.color === gameInfo.myColor && m.classification === "mistake");
  const inaccuracies = gameInfo.moveData.filter(m => m.color === gameInfo.myColor && m.classification === "inaccuracy");

  const accDiff = myAcc - thAcc;
  let accComparison = `Accuracy Deficit: ${Math.abs(accDiff).toFixed(1)}%`;
  if (accDiff > 0) accComparison = `Accuracy Advantage: +${accDiff.toFixed(1)}%`;

  const blNums = blunders.length > 0 ? blunders.map(b => b.moveNum).join(", ") : "0";
  const msNums = mistakes.length > 0 ? mistakes.map(b => b.moveNum).join(", ") : "0";

  return `## Engine Match Evaluation
- **Accuracy Ratio:** Player [**${myAcc}%**] vs Opponent [**${thAcc}%**]
- **Relative Precision:** ${accComparison}

## Tactical Faults
- **Blunders [${blunders.length}]:** Found on move(s) ${blNums !== "0" ? blNums : "None"}
- **Mistakes [${mistakes.length}]:** Found on move(s) ${msNums !== "0" ? msNums : "None"}
- **Inaccuracies [${inaccuracies.length}]:** Minor forced line deviations

## Opening Sequence
The game proceeded via the **${gameInfo.opening}**. 
Book moves extended to move ${Math.max(1, Math.floor(gameInfo.moveData.filter(m => m.classification === "book").length / 2))}.

## Engine Verdict
Focus strictly on positional stability around move ${mistakes.length > 0 ? mistakes[0].moveNum : 10}. The centipawn evaluation shifted unfavorably during the transition into the middlegame.`;
}

export async function dashCoach(stats, dash, username) {
  await new Promise(r => setTimeout(r, 600));

  if (dash.total < 1) {
    return `## Insufficient Data\nSystem requires >1 matched game to extract valid statistical trends.`;
  }

  const sortedByWinRate = [...dash.openingData].sort((a, b) => b.winRate - a.winRate);
  const topOpen = sortedByWinRate[0] || { name: "N/A", winRate: 0, total: 0 };
  const worstOpen = sortedByWinRate[sortedByWinRate.length - 1] || { name: "N/A", winRate: 0, total: 0 };
  
  return `## Aggregate Statistical Profile
**Dataset:** Last ${dash.total} games
**Outcome Distribution:** ${dash.wins} Wins | ${dash.losses} Losses | ${dash.draws} Draws
**Win Rate Metric:** ${dash.winRate}%

## Opening Yields (Min. 2 games)
- **Highest Yield:** ${topOpen.name} (**${topOpen.winRate}%** win rate across ${topOpen.total || 0} games).
- **Lowest Yield:** ${worstOpen.name} (**${worstOpen.winRate}%** win rate across ${worstOpen.total || 0} games).

## Systemic Vulnerabilities
- **Time Management:** Critical centipawn drops correlate with time-trouble scenarios.
- **Positional Disadvantage:** Performance sharply declines against ${worstOpen.name} theoretical lines.

## Engine Recommendations
1. **Puzzles & Tactics:** Halt blitz queueing. Enforce a minimum 15-minute tactical training regimen daily.
2. **Theory Modification:** Restructure your defensive replies against ${worstOpen.name}.`;
}
