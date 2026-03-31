import * as tf from '@tensorflow/tfjs';
import fs from 'fs';
import readline from 'readline';
import path from 'path';

// ═══════ Mapping pieces to 768-dim vector ═══════
const PIECE_MAP = {
  'p': 0, 'n': 1, 'b': 2, 'r': 3, 'q': 4, 'k': 5,
  'P': 6, 'N': 7, 'B': 8, 'R': 9, 'Q': 10, 'K': 11
};

// Stockfish dynamic WDL calculation to map CP (-30000 to 30000) into 0-1 range
const MAT_VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, P: 1, N: 3, B: 3, R: 5, Q: 9 };
function getStockfishWinProb(cp, fen) {
  const pieces = fen.split(' ')[0];
  let material = 0;
  for (let i = 0; i < pieces.length; i++) {
    if (MAT_VAL[pieces[i]]) material += MAT_VAL[pieces[i]];
  }
  const v = Math.max(-4000, Math.min(4000, parseInt(cp) || 0));
  const m = Math.max(17, Math.min(78, material)) / 58.0;

  const as = [-72.32565836, 185.93832038, -144.58862193, 416.44950446];
  const bs = [83.86794042, -136.06112997, 69.98820887, 47.62901433];
  const a = (((as[0] * m + as[1]) * m + as[2]) * m) + as[3];
  const b = (((bs[0] * m + bs[1]) * m + bs[2]) * m) + bs[3];

  return 1 / (1 + Math.exp((a - v) / b));
}

// Convert FEN to 768-length Float32Array
function fenToTensorArray(fen) {
  const arr = new Float32Array(768);
  const board = fen.split(' ')[0];
  let square = 0;

  for (let i = 0; i < board.length; i++) {
    const char = board[i];
    if (char === '/') continue;
    
    // Empty squares
    if (char >= '1' && char <= '8') {
      square += parseInt(char);
    } else {
      // Piece
      const pieceIdx = PIECE_MAP[char];
      if (pieceIdx !== undefined) {
        arr[square * 12 + pieceIdx] = 1.0;
      }
      square++;
    }
    if (square >= 64) break;
  }
  return arr;
}

// ═══════ Build the NN Model ═══════
function buildModel() {
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [768], units: 256, activation: 'relu', kernelRegularizer: tf.regularizers.l2({ l2: 1e-4 }) }));
  model.add(tf.layers.dropout({ rate: 0.1 }));
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' })); // Win Probability output

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError',
    metrics: ['mae']
  });
  return model;
}

// ═══════ Streaming Training (Handling Millions of Rows) ═══════
async function trainModel() {
  const model = buildModel();
  model.summary();

  const fenDir = path.join(process.cwd(), 'ChessData', 'fens');
  const evalDir = path.join(process.cwd(), 'ChessData', 'evals');

  if (!fs.existsSync(fenDir) || !fs.existsSync(evalDir)) {
    console.error("Dataset paths not found! Ensure ChessData/fens and ChessData/evals exist.");
    return;
  }

  const files = fs.readdirSync(fenDir).filter(f => f.endsWith('.txt'));
  console.log(`\nFound ${files.length} dataset files.`);

  const BATCH_SIZE = 8192;
  let batchX = [];
  let batchY = [];
  let totalRows = 0;
  let epochLosses = [];

  for (const file of files) {
    console.log(`\nProcessing file: ${file}`);
    const fenPath = path.join(fenDir, file);
    const evalPath = path.join(evalDir, file);

    if (!fs.existsSync(evalPath)) {
      console.warn(`Evaluation file missing for ${file}`);
      continue;
    }

    const fenRl = readline.createInterface({ input: fs.createReadStream(fenPath), crlfDelay: Infinity });
    const evalRl = readline.createInterface({ input: fs.createReadStream(evalPath), crlfDelay: Infinity });

    const fenIt = fenRl[Symbol.asyncIterator]();
    const evalIt = evalRl[Symbol.asyncIterator]();

    while (true) {
      const fenRes = await fenIt.next();
      const evalRes = await evalIt.next();

      if (fenRes.done || evalRes.done) break;

      const fen = fenRes.value.trim();
      const evalCpStr = evalRes.value.trim();
      
      if (!fen || !evalCpStr) continue;

      let evalCp = 0;
      if (evalCpStr.startsWith('#+')) evalCp = 30000;
      else if (evalCpStr.startsWith('#-')) evalCp = -30000;
      else evalCp = parseInt(evalCpStr) || 0;

      const yVal = getStockfishWinProb(evalCp, fen);
      const xArr = fenToTensorArray(fen);

      batchX.push(xArr);
      batchY.push(yVal);
      totalRows++;

      if (batchX.length >= BATCH_SIZE) {
        const xs = tf.tensor2d(batchX, [batchX.length, 768]);
        const ys = tf.tensor2d(batchY, [batchY.length, 1]);
        
        const info = await model.fit(xs, ys, { epochs: 1, verbose: 0 });
        const loss = info.history.loss[0];
        epochLosses.push(loss);

        if (totalRows % (BATCH_SIZE * 4) === 0) {
          const avgLoss = epochLosses.reduce((a, b) => a + b, 0) / epochLosses.length;
          console.log(`Trained ${totalRows.toLocaleString()} positions. Last Batch Loss: ${loss.toFixed(4)}, Avg Loss: ${avgLoss.toFixed(4)}`);
          epochLosses = [];
        }

        tf.dispose([xs, ys]);
        batchX = [];
        batchY = [];
      }
    }
  }

  // Final batch
  if (batchX.length > 0) {
    const xs = tf.tensor2d(batchX, [batchX.length, 768]);
    const ys = tf.tensor2d(batchY, [batchY.length, 1]);
    await model.fit(xs, ys, { epochs: 1, verbose: 0 });
    tf.dispose([xs, ys]);
  }

  console.log(`\nTraining complete! Total rows processed: ${totalRows.toLocaleString()}`);
  
  const modelPath = 'file://' + path.join(process.cwd(), 'fen_eval_model');
  await model.save(modelPath);
  console.log(`Model saved to ${modelPath}`);
}

trainModel().catch(console.error);
