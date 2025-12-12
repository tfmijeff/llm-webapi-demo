import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function askOpenAI(prompt) {
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
5. 回答僅能依據提供的文件內容`
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.2
  });

  return completion.choices[0].message.content;
}
