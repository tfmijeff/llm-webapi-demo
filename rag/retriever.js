// rag/retriever.js
import fs from "fs";
import path from "path";

const KNOWLEDGE_DIR = path.resolve("./knowledge");

// 你想要 top-k 幾篇丟給 LLM（避免 token 爆）
const DEFAULT_TOP_K = 3;

// 權重（可調）
const WEIGHT_TITLE = 5;
const WEIGHT_ALIAS = 3;
const WEIGHT_CONTENT = 1;

/**
 * 從 knowledge/*.json 檢索最相關文件
 * 文件格式建議：
 * {
 *   "title": "...",
 *   "aliases": ["...","..."],   // 可選
 *   "content": "..."
 * }
 *
 * @param {string} question
 * @param {number} topK
 * @returns {{doc: any, score: number}[]}
 */
export function retrieve(question, topK = DEFAULT_TOP_K) {
  if (!question) return [];

  const qTokens = tokenize(question);

  // 沒 tokens 直接回空
  if (qTokens.length === 0) return [];

  // 讀 knowledge 資料夾所有 json
  let files = [];
  try {
    files = fs
      .readdirSync(KNOWLEDGE_DIR)
      .filter(f => f.toLowerCase().endsWith(".json"));
  } catch (e) {
    // knowledge 資料夾不存在/讀不到
    return [];
  }

  const docs = files
    .map(filename => {
      try {
        const raw = fs.readFileSync(path.join(KNOWLEDGE_DIR, filename), "utf8");
        const doc = JSON.parse(raw);

        // 兼容你之前「wiki.js 原樣 JSON」的格式：data.pages.single
        // 你如果是存整包 wiki.js 回來的 JSON，就會走這條
        const maybeWiki = doc?.data?.pages?.single;
        if (maybeWiki?.title && maybeWiki?.content) {
          return {
            title: maybeWiki.title,
            aliases: doc.aliases || [], // 若你把 aliases 放在最外層
            content: maybeWiki.content,
            _filename: filename
          };
        }

        // 一般格式
        return {
          title: doc.title,
          aliases: doc.aliases || [],
          content: doc.content,
          _filename: filename
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .filter(d => d.title && d.content);

  const scored = docs
    .map(doc => {
      const scoreTitle = overlapScore(qTokens, tokenize(doc.title)) * WEIGHT_TITLE;

      const scoreAliases =
        (doc.aliases || []).reduce((sum, a) => {
          return sum + overlapScore(qTokens, tokenize(a));
        }, 0) * WEIGHT_ALIAS;

      // content 太長會很慢，所以只取前 N 字做「粗略命中」
      const contentPreview = (doc.content || "").slice(0, 4000);
      const scoreContent =
        overlapScore(qTokens, tokenize(contentPreview)) * WEIGHT_CONTENT;

      const score = scoreTitle + scoreAliases + scoreContent;

      return { doc, score };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored;
}

/* ------------------ helpers ------------------ */

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
function overlapScore(qTokens, dTokens) {
  if (qTokens.length === 0 || dTokens.length === 0) return 0;

  const dSet = new Set(dTokens);
  let hit = 0;

  for (const t of new Set(qTokens)) {
    if (dSet.has(t)) hit++;
  }

  return hit / Math.max(1, new Set(qTokens).size);
}
