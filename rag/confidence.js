const { SCORE_THRESHOLD } = require("../config/default");

function isConfident(results) {
  if (!results || results.length === 0) return false;
  return results[0].score >= SCORE_THRESHOLD;
}

module.exports = { isConfident };
