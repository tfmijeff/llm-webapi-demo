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
        { role: "user", content: question }
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
