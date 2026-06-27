import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini AI to prevent startup crashes if GEMINI_API_KEY is missing
let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please add it via Settings > Secrets.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// API endpoint: Generate Medieval Fantasy Content
app.post("/api/gemini/generate", async (req, res) => {
  try {
    const { prompt, type, language = "zh" } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt parameter." });
    }

    // Attempt to get client
    let ai;
    try {
      ai = getGeminiClient();
    } catch (err: any) {
      // If API key is missing, provide a friendly placeholder response so the app remains interactive!
      console.warn("Gemini client initialization failed:", err.message);
      
      // Fallback local simulated generator
      return res.json({
        isDemo: true,
        title: language === "zh" ? `【特报】${prompt.slice(0, 15)}...` : `[Special Report] ${prompt.slice(0, 20)}...`,
        subtitle: language === "zh" ? "（配置 GEMINI_API_KEY 后可体验完整 AI 创作）" : "(Configure GEMINI_API_KEY for full AI generation)",
        author: language === "zh" ? "大理石城记录官" : "Chronicler of Marble City",
        paragraphs: language === "zh" ? [
          "在远方的山脉中，号角长鸣，古老的秘密再度被揭开。这是关于一个古老预言的开始：人们谈论着龙的复苏、魔法的重现，以及帝国边境悄然兴起的阴影。",
          `我们的大臣们对“${prompt}”议论纷纷，学者们在皇家图书馆焦急地翻阅着泛黄的羊皮纸，寻找蛛丝马迹。`,
          "市井传言，吟游诗人已经为此编撰了新的歌谣，在旧酒馆昏暗的烛光中低声吟唱。无论真相如何，风暴已临，唯有剑与誓言能指引前路。"
        ] : [
          "In the distant misty mountains, the horns of old began to echo once more. Thus begins the whisper of ancient prophecies regarding dragons, lost magic, and the shadows rising on the realm's border.",
          `Our council chambers are filled with intense debate regarding "${prompt}", as scholars anxiously scour yellowed parchment in the royal library.`,
          "Meanwhile, bards in dark taverns have already written ballads singing of these strange occurrences. Whatever the truth may be, a storm is brewing, and only steel and oaths shall guide us."
        ]
      });
    }

    let systemInstruction = "";
    if (type === "proclamation") {
      systemInstruction = language === "zh" 
        ? "你是一位中世纪皇家宣诏官。将用户的现代文本改写成一段极其庄严、古雅、富有中世纪奇幻色彩的中文帝国公告。使用‘奉天承运’、‘告尔臣民’、‘克日’、‘敕令’等富有历史厚重感的措辞。返回结构化JSON。"
        : "You are a medieval royal herald. Rewrite the user's text into an extremely grand, solemn, and archaic medieval fantasy proclamation in English, using words like 'Hear Ye', 'Decree', 'By Order of the King', etc. Return structured JSON.";
    } else {
      systemInstruction = language === "zh"
        ? "你是一位生活在中世纪奇幻大陆（如巨龙、法师、炼金术士、冒险者公会并存的世界）的资深报纸主笔。根据用户提供的话题，撰写一篇充满魔幻纪元真实感的趣闻、要闻或特写报道。文字要古朴生动，充满中世纪韵味，避免现代科技词汇。返回结构化JSON，包含标题(title)、副标题(subtitle)、作者(author)以及段落数组(paragraphs，包含3段左右的精彩报道内容)。"
        : "You are a chief chronicler in a rich medieval fantasy realm (with dragons, guilds, alchemists, and wizards). Write a captivating, authentic fantasy newspaper article based on the user's topic. Avoid modern technology jargon. Use archaic, atmospheric language. Return a structured JSON object containing a strong title, subtitle, author, and paragraphs (an array of about 3 detailed, storytelling paragraphs).";
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Generate content for the topic: "${prompt}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A catchy, old-fashioned medieval headline." },
            subtitle: { type: Type.STRING, description: "A vintage explanatory sub-headline." },
            author: { type: Type.STRING, description: "An appropriate medieval fantasy pen name or official title." },
            paragraphs: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "The story content, divided into 3 to 4 immersive paragraphs."
            }
          },
          required: ["title", "subtitle", "author", "paragraphs"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No text returned from Gemini API.");
    }

    const parsedData = JSON.parse(resultText.trim());
    return res.json(parsedData);

  } catch (error: any) {
    console.error("API Error:", error);
    return res.status(500).json({ 
      error: "Failed to generate fantasy content.", 
      details: error.message 
    });
  }
});

// Configure Vite or Static Files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite development server middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Setting up production static file serving...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Medieval Newspaper Server running at http://localhost:${PORT}`);
  });
}

startServer();
