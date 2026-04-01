const https = require('https');
const { spawn } = require('child_process');
const { Chess } = require('chess.js');

const ENGINE_PATH = './stockfish_dir/stockfish/stockfish-windows-x86-64-avx2.exe';
const DEPTH = 14;

// --- Engine Math exactly from src/engine.js ---
function stockfishWDL(cp, fen) {
  const v = Math.max(-4000, Math.min(4000, cp));
  return 50 + 50 * (2.0 / Math.PI) * Math.atan(v / 290.680623072);
}

function moveAccuracyFromWP(wpBefore, wpAfter) {
  if (wpAfter >= wpBefore) return 100;
  const winDiff = wpBefore - wpAfter;
  const raw = 103.1668100711649 * Math.exp(-0.04354415386753951 * winDiff) + -3.166924740191411;
  return Math.max(0, Math.min(100, Math.round((raw + 1)*10)/10)); 
}

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

function lichessGameAccuracy(perMoveAccuracies, allWinPercents) {
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

// --- Fetcher & Runner ---
async function fetchHikaruGame() {
  return new Promise((resolve) => {
    https.get('https://api.chess.com/pub/player/hikaru/games/2023/12', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const games = JSON.parse(data).games;
        // Find a game with accuracies
        const game = games.find(g => g.accuracies);
        resolve(game);
      });
    });
  });
}

function analyzePosition(sf, moves) {
  return new Promise((resolve) => {
    sf.stdout.removeAllListeners('data');
    let bestInfo = { score: 0, mate: false };
    sf.stdout.on('data', data => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (line.includes('info') && line.includes('score')) {
          const depthMatch = line.match(/\bdepth (\d+)/);
          const scoreMatch = line.match(/\bscore (cp|mate) (-?\d+)/);
          if (scoreMatch) {
            const isMate = scoreMatch[1] === 'mate';
            const val = parseInt(scoreMatch[2]);
            const score = isMate ? (val > 0 ? 30000 - val * 10 : -30000 + Math.abs(val) * 10) : val;
            bestInfo = { score, mate: isMate };
          }
        }
        if (line.startsWith('bestmove')) {
          resolve(bestInfo);
        }
      }
    });
    const moveStr = moves.length ? ' moves ' + moves.join(' ') : '';
    sf.stdin.write(`position startpos${moveStr}\n`);
    sf.stdin.write(`go depth ${DEPTH}\n`);
  });
}

async function main() {
  console.log('Fetching true game data from Chess.com API...');
  const game = await fetchHikaruGame();
  
  const chess = new Chess();
  chess.loadPgn(game.pgn);
  const history = chess.history({ verbose: true });
  
  console.log('Selected Game:', game.url);
  console.log('API Ground Truth Accuracies:', game.accuracies);
  console.log('Spawning stockfish to run algorithmic proof...');
  
  const sf = spawn(ENGINE_PATH);
  sf.stdin.write('uci\n');
  await new Promise(r => setTimeout(r, 100)); // wait for init
  
  let uciMoves = [];
  const allWPs = [];
  const wMoveAccs = [];
  const bMoveAccs = [];
  
  const simChess = new Chess();
  
  let prevResult = await analyzePosition(sf, uciMoves);
  allWPs.push(stockfishWDL(prevResult.score, simChess.fen())); // initial WP
  
  for (let i = 0; i < history.length; i++) {
    const mv = history[i];
    const mover = simChess.turn();
    
    const beforeCP = prevResult.score;
    const wpBefore = stockfishWDL(beforeCP, simChess.fen());
    
    simChess.move(mv);
    const playedUCI = mv.from + mv.to + (mv.promotion || '');
    uciMoves.push(playedUCI);
    
    let result;
    if (simChess.isGameOver()) {
      if (simChess.isCheckmate()) {
        result = { score: -30000 };
      } else {
        result = { score: 0 };
      }
    } else {
      result = await analyzePosition(sf, uciMoves);
    }
    
    const afterCP = -result.score;
    const wpAfter = stockfishWDL(afterCP, simChess.fen());
    
    const whiteEval = mover === 'w' ? afterCP : -afterCP;
    allWPs.push(stockfishWDL(whiteEval, simChess.fen()));
    
    const wpLoss = Math.max(0, wpBefore - wpAfter);
    const mAcc = moveAccuracyFromWP(wpBefore, wpAfter);
    
    const bookDepth = Math.min(8, Math.floor(history.length / 4));
    const isBook = i < bookDepth;
    
    if (!isBook) {
      if (mover === 'w') wMoveAccs.push(mAcc);
      else bMoveAccs.push(mAcc);
    }
    prevResult = result;
    
    process.stdout.write(`\rAnalyzing: ${(i / history.length * 100).toFixed(1)}%`);
  }
  
  sf.stdin.write('quit\n');
  
  const rawLichessW = lichessGameAccuracy(wMoveAccs, allWPs);
  const rawLichessB = lichessGameAccuracy(bMoveAccs, allWPs);
  
  const lichessW = Math.max(10, Math.min(100, Math.round(rawLichessW * 10) / 10));
  const lichessB = Math.max(10, Math.min(100, Math.round(rawLichessB * 10) / 10));
  
  console.log('\n\n=== Analysis Complete ===');
  console.log(`API Ground Truth Accuracy: W=${game.accuracies.white}% B=${game.accuracies.black}%`);
  console.log(`My Algo Exact Output:      W=${lichessW}% B=${lichessB}%`);
  
  const deltaW = Math.abs(game.accuracies.white - lichessW);
  const deltaB = Math.abs(game.accuracies.black - lichessB);
  
  if (deltaW < 5 && deltaB < 5) {
    console.log('\nSUCCESS! The mathematical algorithm perfectly simulates true Stockfish variance outputs (delta < 5%).');
  } else {
    console.log('\nWAIT, the math differs significantly. The logic is still hallucinating due to formula misalignment!');
  }
}

main().catch(console.error);
