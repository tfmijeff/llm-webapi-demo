const fs = require("fs");
const path = require("path");

function loadDocuments() {
  const dir = path.join(__dirname, "..", "knowledge");
  const files = fs.readdirSync(dir);

  return files.map(file => {
    const fullPath = path.join(dir, file);
    return JSON.parse(fs.readFileSync(fullPath, "utf8"));
  });
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function scoreDoc(questionTokens, doc) {
  const docTokens = tokenize(doc.title + " " + doc.content);
  const hit = questionTokens.filter(t => docTokens.includes(t));
  return hit.length / questionTokens.length;
}

function retrieve(question, topK = 2) {
  const docs = loadDocuments();
  const qTokens = tokenize(question);

  const scored = docs.map(doc => ({
    doc,
    score: scoreDoc(qTokens, doc)
  }));

  return scored
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

module.exports = { retrieve };
