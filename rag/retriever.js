import fs from "fs";
import path from "path";

const KNOWLEDGE_DIR = path.resolve("./knowledge");

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function retrieve(question, topK = 2) {
  const qTokens = tokenize(question);

  const files = fs.readdirSync(KNOWLEDGE_DIR);
  const docs = files.map(f =>
    JSON.parse(fs.readFileSync(path.join(KNOWLEDGE_DIR, f), "utf8"))
  );

  const scored = docs.map(doc => {
    const dTokens = tokenize(doc.title + " " + doc.content);
    const hit = qTokens.filter(t => dTokens.includes(t));
    const score = hit.length / qTokens.length;
    return { doc, score };
  });

  return scored
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
