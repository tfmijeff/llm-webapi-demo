import express from "express";
import OpenAI from "openai";

const app = express();
app.use(express.json());

// 從 Render 的環境變數讀取 API Key
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/ask", async (req, res) => {
  try {
    const question = req.body.question;

    if (!question) {
      return res.status(400).json({ error: "question is required" });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
  {
    role: "system",
    content: `你是一個公司內部的 AI 知識助理。
你的回答目標是協助同仁快速理解問題重點，回覆內容需：
1. 使用繁體中文
2. 語氣專業、清楚、簡潔
3. 不確定時請明確說明「目前無法確認」
4. 不臆測公司內部政策或數據
5. 回答以一般知識與常見實務為主`
  },
  {
    role: "user",
    content: question
  }
]
    });

    res.json({
      answer: completion.choices[0].message.content
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// Render 預設會用 PORT 環境變數
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
