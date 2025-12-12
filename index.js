import path from "path";
import express from "express";

import { retrieve } from "./rag/retriever.js";
import { isConfident } from "./rag/confidence.js";
import { buildPrompt } from "./rag/prompt.js";
import { askOpenAI } from "./llm/openai.js";

const app = express();
app.use(express.json());
app.use(express.static(path.resolve("./")));

app.post("/ask", async (req, res) => {
  try {
    const question = req.body.question;

    if (!question) {
      return res.status(400).json({ error: "question is required" });
    }

    // ① R：檢索
    const results = retrieve(question);

    // ② 信心判斷
    if (!isConfident(results)) {
      return res.json({
        answer: "本次查無參考資料，請洽相關單位確認。",
        confidence: 0
      });
    }

    // ③ A：組 Prompt
    const prompt = buildPrompt(question, results);

    // ④ G：LLM
    const answer = await askOpenAI(prompt);

res.json({
  answer,
  confidence: results[0].score,
  source: results[0].doc.title,
  retrieval: results.map(r => ({
    title: r.doc.title,
    score: Number(r.score.toFixed(2))
  }))
});


  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
