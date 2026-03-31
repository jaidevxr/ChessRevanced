/* ═══════════════════════════════════════════════════════════════
   Chess Engine — Stockfish d14 + Hybrid CAPS Algorithm
   Integrates Lichess AccuracyPercent.scala with Stockfish's 
   Material-Adjusted Win Probability Model & Neural Network
   ═══════════════════════════════════════════════════════════════ */
import { StockfishEngine } from './stockfish';
import { predictCAPS } from './caps_nn';

const PV = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
const MAT_VAL = { p: 1, n: 3, b: 3, r: 5, q: 9 };

function countMaterial(fen) {
  const pieces = fen.split(' ')[0];
  let material = 0;
  for (let i = 0; i < pieces.length; i++) {
    const p = pieces[i].toLowerCase();
    if (MAT_VAL[p]) material += MAT_VAL[p];
  }
  return material;
}

// ═══════ Stockfish 16+ Dynamic WDL Model ═══════
export function stockfishWDL(cp, fen) {
  const v = Math.max(-4000, Math.min(4000, cp));
  const material = fen ? countMaterial(fen) : 58;
  const m = Math.max(17, Math.min(78, material)) / 58.0;

  const as = [-72.32565836, 185.93832038, -144.58862193, 416.44950446];
  const bs = [83.86794042, -136.06112997, 69.98820887, 47.62901433];

  const a = (((as[0] * m + as[1]) * m + as[2]) * m) + as[3];
  const b = (((bs[0] * m + bs[1]) * m + bs[2]) * m) + bs[3];

  return 100 / (1 + Math.exp((a - v) / b));
}

// ═══════ Lichess-exact per-move accuracy ═══════
export function moveAccuracyFromWP(wpBefore, wpAfter) {
  if (wpAfter >= wpBefore) return 100;
  const winDiff = wpBefore - wpAfter;
  const raw = 103.1668100711649 * Math.exp(-0.04354415386753951 * winDiff) + -3.166924740191411;
  return Math.max(0, Math.min(100, Math.round((raw + 1)*10)/10)); 
}

// ═══════ Lichess-exact Game Accuracy ═══════
function standardDeviation(arr) {
  if (arr.length < 2) return 0.5;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

function weightedMean(pairs) {
  if (!pairs.length) return null;
  let sumW = 0, sumVW = 0;
  for (const [v, w] of pairs) {
    sumVW += v * w;
    sumW += w;
  }
  return sumW > 0 ? sumVW / sumW : null;
}

function harmonicMean(values) {
  if (!values.length) return null;
  const filtered = values.filter(v => v > 0.5);
  if (!filtered.length) return null;
  const n = filtered.length;
  const sumInv = filtered.reduce((s, v) => s + 1 / v, 0);
  return sumInv > 0 ? n / sumInv : null;
}

export function lichessGameAccuracy(perMoveAccuracies, allWinPercents) {
  const n = perMoveAccuracies.length;
  if (n === 0) return 0;

  const windowSize = Math.max(2, Math.min(8, Math.floor(n / 5)));
  const wpValues = allWinPercents;

  const windows = [];
  const pad = Math.min(windowSize, wpValues.length) - 2;
  for (let i = 0; i < Math.max(0, pad); i++) {
    windows.push(wpValues.slice(0, windowSize));
  }
  for (let i = 0; i <= wpValues.length - windowSize; i++) {
    windows.push(wpValues.slice(i, i + windowSize));
  }

  const weights = windows.map(w => Math.max(0.5, Math.min(12, standardDeviation(w))));

  const pairs = [];
  for (let i = 0; i < perMoveAccuracies.length && i < weights.length; i++) {
    pairs.push([perMoveAccuracies[i], weights[i]]);
  }

  const wm = weightedMean(pairs);
  const hm = harmonicMean(perMoveAccuracies);

  if (wm === null && hm === null) return 0;
  if (wm === null) return Math.round(hm * 10) / 10;
  if (hm === null) return Math.round(wm * 10) / 10;
  return Math.round(((wm + hm) / 2) * 10) / 10;
}

// ═══════ Move classification using WP loss ═══════
export function classify(wpLoss, isSac, isBestMove) {
  if (isBestMove && isSac && wpLoss <= 0) return "brilliant";
  if (isBestMove) return "best";
  if (wpLoss <= 2) return "excellent";
  if (wpLoss <= 5) return "good";
  if (wpLoss <= 10) return "inaccuracy";
  if (wpLoss <= 20) return "mistake";
  return "blunder";
}

// ═══════ Main Analysis Pipeline ═══════
export async function analyzeGame(pgn, username, Chess, playerStats, onProgress, apiAccuracies) {
  if (!Chess || !pgn) return null;

  const game = new Chess();
  try {
    if (!game.load_pgn(pgn, { sloppy: true })) return null;
  } catch (e) {
    console.warn('PGN parse error:', e);
    return null;
  }

  const lower = username.toLowerCase();
  const hdr = game.header();
  const isWhite = (hdr.White || "").toLowerCase() === lower;
  const history = game.history({ verbose: true });
  if (!history.length) return null;

  const chess = new Chess();
  const bookDepth = Math.min(8, Math.floor(history.length / 4));
  const DEPTH = 14;

  let engine;
  try {
    engine = new StockfishEngine();
    await engine.init();
    await engine.newGame();
  } catch (e) {
    console.error('Stockfish init failed:', e);
    return null;
  }

  const moveData = [];
  const cc = { white: { captures: 0, checks: 0 }, black: { captures: 0, checks: 0 } };

  const wMoveAccs = [], bMoveAccs = [];
  const allWPs = []; 

  try {
    let fen = chess.fen();
    let prevResult = await engine.analyze(fen, DEPTH);
    const initialWP = stockfishWDL(prevResult.score, fen);
    allWPs.push(initialWP);

    for (let i = 0; i < history.length; i++) {
      const mv = history[i];
      const mover = chess.turn();
      const side = mover === "w" ? "white" : "black";

      const beforeCP = prevResult.score;
      const wpBefore = stockfishWDL(beforeCP, fen);
      const bestMoveUCI = prevResult.bestMove;

      chess.move(mv);
      fen = chess.fen();

      if (mv.captured) cc[side].captures++;
      if (chess.in_check()) cc[side].checks++;

      let result;
      if (chess.game_over()) {
        if (chess.in_checkmate()) {
          result = { score: mover === 'w' ? -30000 : 30000, bestMove: '0000', depth: DEPTH };
        } else {
          result = { score: 0, bestMove: '0000', depth: DEPTH };
        }
      } else {
        result = await engine.analyze(fen, DEPTH);
      }

      const afterCP = -result.score;
      const wpAfter = stockfishWDL(afterCP, fen);
      allWPs.push(stockfishWDL(result.score, fen)); 

      const wpLoss = Math.max(0, wpBefore - wpAfter);

      const playedUCI = mv.from + mv.to + (mv.promotion || '');
      const isBestMove = playedUCI === bestMoveUCI;
      const isSac = mv.captured && (PV[mv.piece] || 0) > (PV[mv.captured] || 0);

      const isBook = i < bookDepth;
      const cls = isBook ? "book" : classify(wpLoss, isSac, isBestMove);
      cc[side][cls] = (cc[side][cls] || 0) + 1;

      const mAcc = moveAccuracyFromWP(wpBefore, wpAfter);

      if (!isBook) {
        if (mover === "w") wMoveAccs.push(mAcc);
        else bMoveAccs.push(mAcc);
      }

      const whiteEval = mover === "w" ? afterCP : -afterCP;

      moveData.push({
        fen,
        move: mv,
        san: mv.san,
        color: mover,
        wpLoss: wpLoss.toFixed(1),
        moveAcc: mAcc,
        classification: cls,
        eval: whiteEval,
        moveNum: Math.floor(i / 2) + 1,
        isBestMove,
        bestMove: bestMoveUCI,
      });

      prevResult = result;
      if (onProgress) onProgress(i + 1, history.length);
    }
  } catch (e) {
    console.error('Stockfish analysis error:', e);
  } finally {
    engine.destroy();
  }

  // ═══════ Compute game accuracy ═══════
  const lichessWhiteAcc = lichessGameAccuracy(wMoveAccs, allWPs);
  const lichessBlackAcc = lichessGameAccuracy(bMoveAccs, allWPs);

  // Neural Network Inference Fallback
  const tcBase = parseInt(hdr.TimeControl) || 600;
  const we = parseInt(hdr.WhiteElo) || playerStats?.elo || 1500;
  const be = parseInt(hdr.BlackElo) || playerStats?.elo || 1500;
  const resStr = hdr.Result || "*";
  
  const wRes = resStr === '1-0' ? 1 : resStr === '0-1' ? 0 : 0.5;
  const bRes = resStr === '0-1' ? 1 : resStr === '1-0' ? 0 : 0.5;

  const cwPred = predictCAPS([we, be, tcBase, history.length, cc.white.captures, cc.white.checks, wRes, 3.0]);
  const cbPred = predictCAPS([be, we, tcBase, history.length, cc.black.captures, cc.black.checks, bRes, 3.0]);

  // Hybrid Model (60% Lichess algorithm, 40% CAPS Neural Network)
  const hybridWhite = Math.round((lichessWhiteAcc * 0.6 + cwPred * 0.4) * 10) / 10;
  const hybridBlack = Math.round((lichessBlackAcc * 0.6 + cbPred * 0.4) * 10) / 10;

  const hasApiAcc = apiAccuracies && apiAccuracies.white != null && apiAccuracies.black != null;
  const finalWhiteAcc = hasApiAcc ? Math.round(apiAccuracies.white * 10) / 10 : Math.max(10, Math.min(100, hybridWhite));
  const finalBlackAcc = hasApiAcc ? Math.round(apiAccuracies.black * 10) / 10 : Math.max(10, Math.min(100, hybridBlack));

  const source = hasApiAcc ? "Chess.com API" : "Hybrid NN + Lichess";

  return {
    header: hdr,
    isWhite,
    myColor: isWhite ? "w" : "b",
    moveData,
    classCounts: cc,
    whiteAcc: finalWhiteAcc,
    blackAcc: finalBlackAcc,
    result: hdr.Result || "*",
    opening: hdr.Opening || hdr.ECO || "Unknown Opening",
    eco: hdr.ECO || "",
    startFen: new Chess().fen(),
    engineUsed: `${source} + SF d${DEPTH}`,
    analysisDepth: DEPTH,
    accuracySource: hasApiAcc ? 'api' : 'hybrid',
  };
}
