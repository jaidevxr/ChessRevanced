/* ═══════════════════════════════════════════════════════════════
   Stockfish Engine — Local Worker Wrapper
   ═══════════════════════════════════════════════════════════════ */

export class StockfishEngine {
  constructor() {
    this.worker = null;
    this.ready = false;
    this._resolve = null;
    this._readyResolve = null;
    this._info = {};
  }

  async init() {
    try {
      this.worker = new Worker('/stockfish.js');
    } catch (e) {
      throw new Error('Failed to load local Stockfish worker');
    }

    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('Stockfish init timeout')), 10000);
      this.worker.onmessage = (e) => {
        const line = typeof e.data === 'string' ? e.data : '';
        if (line === 'uciok') {
          this.worker.postMessage('setoption name Hash value 32');
          this.worker.postMessage('isready');
        } else if (line === 'readyok') {
          if (!this.ready) {
            this.ready = true;
            clearTimeout(t);
            resolve();
          } else if (this._readyResolve) {
            this._readyResolve();
            this._readyResolve = null;
          }
        } else {
          this._parse(line);
        }
      };
      this.worker.postMessage('uci');
    });
  }

  _parse(line) {
    if (typeof line !== 'string') return;
    if (line.startsWith('info') && line.includes(' score ')) {
      const dm = line.match(/\bdepth (\d+)/);
      const sm = line.match(/\bscore (cp|mate) (-?\d+)/);
      if (sm) {
        const d = dm ? +dm[1] : 0;
        if (d >= (this._info.depth || 0)) {
          const type = sm[1], val = +sm[2];
          this._info = {
            depth: d,
            score: type === 'mate' ? (val > 0 ? 30000 - val * 10 : -30000 + Math.abs(val) * 10) : val,
            isMate: type === 'mate',
            mateIn: type === 'mate' ? val : null,
          };
        }
      }
    }
    if (line.startsWith('bestmove')) {
      const bm = line.split(' ')[1] || '';
      if (this._resolve) {
        const r = this._resolve;
        this._resolve = null;
        r({ ...this._info, bestMove: bm });
      }
    }
  }

  analyze(initialFen, moves = [], depth = 10) {
    return new Promise((resolve) => {
      // 10-second timeout to prevent hanging on slow browsers
      const timeout = setTimeout(() => {
        if (this._resolve) {
          const r = this._resolve;
          this._resolve = null;
          r({ ...this._info, bestMove: this._info.bestMove || '0000' });
        }
      }, 10000);

      this._resolve = (result) => {
        clearTimeout(timeout);
        resolve(result);
      };
      
      this._info = { score: 0, depth: 0, isMate: false, bestMove: '' };
      
      const moveStr = moves.length > 0 ? ' moves ' + moves.join(' ') : '';
      const startParam = (initialFen && initialFen !== 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') 
          ? 'fen ' + initialFen 
          : 'startpos';
      this.worker.postMessage('position ' + startParam + moveStr);
      this.worker.postMessage('go depth ' + depth);
    });
  }

  async newGame() {
    this.worker.postMessage('ucinewgame');
    return new Promise((r) => {
      this._readyResolve = r;
      this.worker.postMessage('isready');
    });
  }

  destroy() {
    if (this.worker) {
      this.worker.postMessage('stop');
      this.worker.postMessage('quit');
      this.worker.terminate();
      this.worker = null;
    }
  }
}
