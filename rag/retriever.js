// rag/retriever.js
import { documents } from "./data.js";

/**
 * @param {string} question
 * @returns [{ doc, score }]
 */
export function retrieve(question) {
  const q = normalize(question);

  const results = documents.map(doc => {
    let score = 0;

    // ① title
    if (includesAny(doc.title, q)) {
      score += 5;
    }

    // ② aliases
    if (doc.aliases) {
      doc.aliases.forEach(alias => {
        if (includesAny(alias, q)) {
          score += 3;
        }
      });
    }

    // ③ content（低權重）
    if (doc.content && includesAny(doc.content, q)) {
      score += 1;
    }

    return { doc, score };
  });

  // ④ 過濾沒命中的
  const filtered = results
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);

  // ⑤ 只回前 3 筆（避免 prompt 爆炸）
  return filtered.slice(0, 3);
}

/* ------------------ helpers ------------------ */

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9]/g, "");
}

function includesAny(source, target) {
  const s = normalize(source);
  return s.includes(target) || target.includes(s);
}
