const MAT_VAL = { p: 1, n: 3, b: 3, r: 5, q: 9 };
function countMaterial(fen) { return 58; }

function stockfishWDL(cp, fen) {
  const v = Math.max(-4000, Math.min(4000, cp));
  const material = fen ? countMaterial(fen) : 58;
  const m = Math.max(17, Math.min(78, material)) / 58.0;
  const as = [-72.32565836, 185.93832038, -144.58862193, 416.44950446];
  const bs = [83.86794042, -136.06112997, 69.98820887, 47.62901433];
  const a = (((as[0] * m + as[1]) * m + as[2]) * m) + as[3];
  const b = (((bs[0] * m + bs[1]) * m + bs[2]) * m) + bs[3];
  return 100 / (1 + Math.exp((a - v) / b));
}

function moveAccuracyFromWP(wpBefore, wpAfter) {
  if (wpAfter >= wpBefore) return 100;
  const winDiff = wpBefore - wpAfter;
  const raw = 103.1668100711649 * Math.exp(-0.04354415386753951 * winDiff) + -3.166924740191411;
  return Math.max(0, Math.min(100, Math.round((raw + 1)*10)/10)); 
}

const scores = [0, 50, -50, -200, -900, -900];
// Mover: W, B, W, B, W
// W computes 0 -> W makes move, B sees 50 -> W after is -50
// WP Before W: WDL(0)=50. WP After W: WDL(-50)=~30. Loss = 20.
for(let i=0; i<scores.length-1; i++) {
  const beforeCP = scores[i];
  const wpBefore = stockfishWDL(beforeCP, null);
  const afterCP = -scores[i+1];
  const wpAfter = stockfishWDL(afterCP, null);
  console.log(`Move ${i+1}: beforeCP=${beforeCP} afterCP=${afterCP} -> wpBefore=${wpBefore.toFixed(1)} wpAfter=${wpAfter.toFixed(1)} loss=${(wpBefore - wpAfter).toFixed(1)} mAcc=${moveAccuracyFromWP(wpBefore, wpAfter)}`);
}
