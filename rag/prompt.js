function buildPrompt(question, results) {
  const context = results.map(r => {
    return `【${r.doc.title}】\n${r.doc.content}`;
  }).join("\n\n---\n\n");

  return `
你是公司內部知識助理，僅能依據以下文件內容回答問題。
若文件中無相關資訊，請明確回答「本次查無參考資料」。

====================
文件內容：
${context}
====================

使用者問題：
${question}
`.trim();
}

module.exports = { buildPrompt };
