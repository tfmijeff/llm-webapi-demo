const SCORE_THRESHOLD = 0.3;

export function isConfident(results) {
  if (!results || results.length === 0) return false;
  return results[0].score >= SCORE_THRESHOLD;
}
