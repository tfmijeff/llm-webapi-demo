// rag/retriever.js
import fs from "fs";
import path from "path";

const KNOWLEDGE_DIR = path.resolve("./knowledge");

// 權重（可微調）
const WEIGHT_TITLE = 5;
const WEIGHT_ALIAS = 4;   // aliases 比 content 重要
const WEIGHT_CONTENT = 1;

const TOP_K = 3;

export function retrieve(question) {
  if (!question) return [];

  const qTokens = tokenize(question);
  // 沒 tokens 直接回空
  if (qTokens.length === 0) return [];

  // 讀 knowledge 資料夾所有 json
  let files = [];
  try {
    files = fs.readdirSync(KNOWLEDGE_DIR).filter(f => f.endsWith(".json"));
  } catch {
    // knowledge 資料夾不存在/讀不到
    return [];
  }

  const results = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(KNOWLEDGE_DIR, file), "utf8");
      const doc = JSON.parse(raw);

      // 👉 明確對齊你的 schema
      const title = doc.title || "";
      const aliases = Array.isArray(doc.aliases) ? doc.aliases : [];
      const content = doc.content || "";

      let score = 0;

      // ① title
      score += overlap(qTokens, tokenize(title)) * WEIGHT_TITLE;

      // ② aliases（最重要）
      for (const a of aliases) {
        score += overlap(qTokens, tokenize(a)) * WEIGHT_ALIAS;
      }

      // ③ content（只取前面一段，避免太慢）
      const preview = content.slice(0, 3000);
      score += overlap(qTokens, tokenize(preview)) * WEIGHT_CONTENT;

      if (score > 0) {
        results.push({
          doc,
          score
        });
      }
    } catch {
      // 單筆壞掉就跳過
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);
}

/* ---------------- helpers ---------------- */

function tokenize(text) {
  return String(text)
    .toLowerCase()
    // 把符號換成空白，保留中英數
    .replace(/[^\u4e00-\u9fa5a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * 計算 token 重疊比例（0~1）
 * - 用 set 方式，避免同一字反覆灌分
 */
function overlap(qTokens, dTokens) {
  if (!qTokens.length || !dTokens.length) return 0;

  const dSet = new Set(dTokens);
  let hit = 0;

  for (const t of new Set(qTokens)) {
    if (dSet.has(t)) hit++;
  }

  return hit / new Set(qTokens).size;
}
