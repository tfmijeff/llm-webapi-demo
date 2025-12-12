export function buildPrompt(question, results) {
  const context = results.map(r => {
    return `【${r.doc.title}】\n${r.doc.content}`;
  }).join("\n\n---\n\n");

  return `
你必須僅根據以下文件內容回答問題。
若文件中沒有答案，請明確回答「本次查無參考資料」。

====================
文件內容：
${context}
====================

使用者問題：
${question}
`.trim();
}
