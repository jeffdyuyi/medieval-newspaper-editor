import { NewspaperTheme } from "../types";

export interface GeneratedArticle {
  title: string;
  subtitle: string;
  author: string;
  paragraphs: string[];
  isLocalDemo?: boolean;
}

// Rich offline generator when no API key and no backend server is available
export function generateLocalOfflineArticle(prompt: string, theme: NewspaperTheme): GeneratedArticle {
  const cleanPrompt = prompt.trim() || "王国见闻";

  if (theme === "republican") {
    const titles = [
      `【要闻】${cleanPrompt}：各界同仁商榷集议`,
      `【本埠特讯】关于“${cleanPrompt}”之切实考察`,
      `【社会纪闻】风靡申江之“${cleanPrompt}”一席谈`,
      `【商界公报】${cleanPrompt}举办筹备会议纪要`
    ];
    const subtitles = [
      "本埠专电：各商绅学界莫不瞩目，详定细则即日推行",
      "昨日午后开评议会，同仁各抒谠论，并拟公呈备查",
      "海上名流各界代表纷至沓来，会场气氛极形热烈",
      "事关市政繁盛与民生大计，当局特派专员督促善后"
    ];
    const authors = [
      "本报驻沪特派访员",
      "申江漫步客",
      "时事记者醒痴",
      "商报特约评述员",
      "南市调查员公署"
    ];

    const title = titles[Math.floor(Math.random() * titles.length)];
    const subtitle = subtitles[Math.floor(Math.random() * subtitles.length)];
    const author = authors[Math.floor(Math.random() * authors.length)];

    const paragraphs = [
      `本埠讯：近日海上关于“${cleanPrompt}”一节，传闻纷起，各界人士莫不引为谈资。昨日午后三时，相关同仁假座大同旅社召开紧急集议，到会者数十人，就此项事体反复商讨。`,
      `席间商贾与学界诸公各抒胸臆，认为当前时局日新月异，凡关涉“${cleanPrompt}”之大计，亟须通力合作，毋致贻误机宜。更有代表就细则逐条审读，众皆首肯。`,
      `闻悉有关方面已派员前往督促查勘，详细章程容候续布。本报特派访员随时追踪实情，随探随登，以飨热心时务之阅者。`
    ];

    return { title, subtitle, author, paragraphs, isLocalDemo: true };
  }

  // Fantasy theme
  const titles = [
    `【帝国敕令】关于${cleanPrompt}的魔法调查`,
    `【王都异闻录】${cleanPrompt}再现北境行省`,
    `【贤者评述】${cleanPrompt}与古老法书的预言`,
    `【公会要闻】探险队带回关于${cleanPrompt}的绝密报告`
  ];
  const subtitles = [
    "皇家大图书馆与法师议会联名发布特许记录",
    "红狮子骑士团全副武装巡视边境，边陲领主紧急戒备",
    "大理石城记录官手抄誊录，奉星辉帝国皇室特许印制",
    "北境风暴暂息，吟游诗人将此传奇编入最新民谣"
  ];
  const authors = [
    "大理石城记录署御史",
    "皇家大图书馆抄经学士",
    "秘银十字公会书记官",
    "帝国首席炼金顾问",
    "边境巡夜骑士长"
  ];

  const title = titles[Math.floor(Math.random() * titles.length)];
  const subtitle = subtitles[Math.floor(Math.random() * subtitles.length)];
  const author = authors[Math.floor(Math.random() * authors.length)];

  const paragraphs = [
    `在极北山脉的凛冽寒风中，古老的号角再度回响。据守卫在晨曦要塞的骑士报告，关于“${cleanPrompt}”的征兆已然降临，古老卷轴中尘封百年的印记隐隐散发出辉光。`,
    `皇家大图书馆的学者们彻夜翻阅泛黄的羊皮纸典籍，议论纷纷。御前大臣已向陛下呈递紧急密奏，法师议会亦派遣了占星学者赶赴当地，探查秘能潮汐的异动。`,
    `市井小巷的酒馆内，烛火摇曳，吟游诗人们正就“${cleanPrompt}”低声编唱着新的歌谣。无论预言的终局将去向何方，帝国臣民皆需握紧手中的剑刃与信念，迎候即将来临的命运风暴。`
  ];

  return { title, subtitle, author, paragraphs, isLocalDemo: true };
}

// Client-side AI Generator supporting pure frontend (direct API call) + local backend + offline fallback
export async function generateArticleAI(options: {
  prompt: string;
  theme: NewspaperTheme;
  apiKey?: string;
}): Promise<GeneratedArticle> {
  const { prompt, theme, apiKey } = options;

  // 1. Direct browser call to Google Gemini API if user provided an API key
  if (apiKey && apiKey.trim()) {
    try {
      const systemInstructionText = theme === "republican"
        ? "你是一位20世纪初民国时期（如《申报》、《时事新报》）的资深主笔记者。根据用户提供的话题，撰写一篇具有浓郁民国浅近白话文风格的时代新闻报道。使用‘本埠讯’、‘据闻’、‘商界同人’、‘即席发表演说’、‘各界瞩目’等时代特色词汇。必须返回JSON格式，包含字段：title(标题), subtitle(副标题), author(作者笔名), paragraphs(字符串数组，3段正文)。"
        : "你是一位生活在中世纪奇幻大陆的资深报纸主笔。根据用户话题，撰写充满魔幻纪元真实感的古朴报道，避免现代词汇。必须返回JSON格式，包含字段：title(标题), subtitle(副标题), author(作者笔名或官衔), paragraphs(字符串数组，3段正文)。";

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `请为以下话题撰写报纸纪事文章：${prompt}` }]
            }
          ],
          systemInstruction: {
            parts: [{ text: systemInstructionText }]
          },
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          const parsed = JSON.parse(candidateText.trim());
          if (parsed.title && parsed.paragraphs) {
            return {
              title: parsed.title,
              subtitle: parsed.subtitle || "",
              author: parsed.author || (theme === "republican" ? "本报特派记者" : "帝国记录署印"),
              paragraphs: Array.isArray(parsed.paragraphs) ? parsed.paragraphs : [parsed.paragraphs],
              isLocalDemo: false
            };
          }
        }
      }
    } catch (apiErr) {
      console.warn("Direct Gemini API call failed, will try server or local generator:", apiErr);
    }
  }

  // 2. Try local backend server /api/gemini/generate if server is running
  try {
    const res = await fetch("/api/gemini/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, theme })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.title && data.paragraphs) {
        return {
          title: data.title,
          subtitle: data.subtitle || "",
          author: data.author || (theme === "republican" ? "本报特派记者" : "帝国记录官"),
          paragraphs: Array.isArray(data.paragraphs) ? data.paragraphs : [data.paragraphs],
          isLocalDemo: data.isDemo || false
        };
      }
    }
  } catch (backendErr) {
    // Backend server not running (e.g. opened offline HTML file directly or static hosting)
  }

  // 3. Fallback: Pure client-side offline generator (zero dependency, 100% reliable)
  return generateLocalOfflineArticle(prompt, theme);
}

