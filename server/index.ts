import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// 加载 .env（支持自定义路径，Electron 打包后从 resources 目录加载）
const dotenvPath = process.env.DOTENV_PATH;
const _envResult = dotenvPath
  ? dotenv.config({ path: dotenvPath })
  : dotenv.config();
// 手动覆盖系统环境变量（dotenv.config 默认不覆盖已存在的系统变量）
if (_envResult.parsed) {
  for (const [key, value] of Object.entries(_envResult.parsed)) {
    process.env[key] = value;
  }
}
import express from "express";
import { v4 as uuidv4 } from "uuid";
import * as db from "./db.js";

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

// ===== 配置 =====
const API_KEY = process.env.CODEBUDDY_API_KEY || "";
const API_URL = "https://copilot.tencent.com/v2/chat/completions";

const AVAILABLE_MODELS = [
  { modelId: "auto", name: "智能选择", description: "自动选择最合适的模型" },
  { modelId: "deepseek-v4-pro", name: "DeepSeek V4 Pro", description: "深度推理，适合复杂问答" },
  { modelId: "glm-5.2", name: "GLM 5.2", description: "智谱 GLM，中文能力强" },
  { modelId: "hy3", name: "HunYuan 3", description: "腾讯混元，综合能力均衡" },
];
const DEFAULT_MODEL = "auto";

// ===== 系统提示词 =====
const SYSTEM_PROMPT = `你是一位福建非物质文化遗产美食专家，名叫"闽味小助手"。你的核心使命是帮助用户了解福建省的非遗美食文化。

## 核心职责
1. **知识问答**：回答关于福建非遗美食的一切问题，包括历史渊源、制作工艺、文化意义、传承人等。
2. **视频推荐**：在介绍美食时，提供B站或YouTube的视频搜索链接，方便用户直观了解。
3. **美食推荐**：根据用户的口味偏好或所在地区，推荐福建非遗美食。

## 福建非遗美食知识库
- **佛跳墙**（福州）：国家级非遗，荟萃山海珍馐的闽菜之首
- **沙县小吃制作技艺**：国家级非遗，1600多年历史，240多个品种
- **武夷岩茶（大红袍）制作技艺**：世界级非遗
- **福州鱼丸**：省级非遗，包心鱼丸的代表
- **闽南沙茶面**：独特的沙茶酱配以海鲜
- **泉州面线糊**：细如发丝的面线，鲜美滑嫩
- **厦门薄饼（春卷）**：薄如蝉翼的面皮包裹丰富馅料
- **漳州卤面**：卤汁浓稠，配料丰富
- **莆田卤面**：以海鲜为主料的特色面食
- **客家酿豆腐**：闽西客家经典
- **福州肉燕**：太平燕，薄如纸的燕皮包裹肉馅
- **闽南土笋冻**：独特的海产冻品

## 回复风格
- 热情、专业、充满对福建美食文化的热爱
- 详细介绍每种美食的历史、特色和制作工艺
- 可以穿插有趣的美食故事和文化典故

## 视频推荐（重要！必须严格遵守）
介绍美食时，请提供视频搜索链接，方便用户在B站或YouTube上查找相关视频。

✅ 正确格式（只允许这种格式）：
**[🔍 在B站搜索：佛跳墙](https://search.bilibili.com/all?keyword=佛跳墙)**
**[🔍 在YouTube搜索：佛跳墙](https://www.youtube.com/results?search_query=佛跳墙)**

❌ 严禁以下格式（你无法验证视频是否存在，会导向错误内容）：
- ~~[视频](https://www.bilibili.com/video/BV1yW411b7bx)~~ ← 绝对禁止编造 BV 号
- ~~[视频](https://youtu.be/dQw4w9WgXcQ)~~ ← 绝对禁止编造 YouTube 短链
- 任何包含 /video/BV、youtu.be/、watch?v= 的直接视频链接

规则：
- 搜索关键词使用美食的中文名称（如"佛跳墙"、"沙县小吃"）
- URL 中的关键词需要 URL 编码（中文可以直接放在 URL 中）
- 每种美食提供 1 个 B站搜索链接即可
- 绝对不要提供任何直接视频播放链接

请用中文回答所有问题，热情洋溢地介绍福建非遗美食文化！`;

// ===== 视频链接修正 =====

/**
 * 将 AI 回复中的直接视频链接替换为搜索链接
 * AI 经常编造不存在的 BV 号，导致视频无法播放或内容错误
 */
function replaceDirectVideoUrls(text: string): string {
  let result = text;

  // 1. 替换 Markdown 链接中的 Bilibili 直接视频链接
  // [佛跳墙制作](https://www.bilibili.com/video/BVxxxxx) → [🔍 在B站搜索：佛跳墙制作](https://search.bilibili.com/all?keyword=...)
  result = result.replace(
    /\[([^\]]*)\]\(https?:\/\/(?:www\.|m\.)?bilibili\.com\/video\/BV[a-zA-Z0-9]+[^)]*\)/g,
    (_match, title: string) => {
      const keyword = title.replace(/🔍\s*在.*搜索[：:]/, "").replace(/视频$/, "").trim() || "福建美食";
      return `[🔍 在B站搜索：${keyword}](https://search.bilibili.com/all?keyword=${encodeURIComponent(keyword)})`;
    }
  );

  // 2. 替换 Markdown 链接中的 YouTube 直接视频链接
  // [title](https://www.youtube.com/watch?v=xxxxx) 或 [title](https://youtu.be/xxxxx)
  result = result.replace(
    /\[([^\]]*)\]\(https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]+[^)]*\)/g,
    (_match, title: string) => {
      const keyword = title.replace(/🔍\s*在.*搜索[：:]/, "").replace(/视频$/, "").trim() || "福建美食";
      return `[🔍 在YouTube搜索：${keyword}](https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)})`;
    }
  );

  // 3. 替换裸 Bilibili 视频链接（不在 Markdown 链接中的）
  result = result.replace(
    /(?<![[(])https?:\/\/(?:www\.|m\.)?bilibili\.com\/video\/BV[a-zA-Z0-9]+[^\s)\]]*/g,
    () => `https://search.bilibili.com/all?keyword=${encodeURIComponent("福建非遗美食")}`
  );

  // 4. 替换裸 YouTube 视频链接
  result = result.replace(
    /(?<![[(])https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]+[^\s)\]]*/g,
    () => `https://www.youtube.com/results?search_query=${encodeURIComponent("福建非遗美食")}`
  );

  return result;
}

// ===== B站真实视频搜索 =====

// 搜索结果缓存 (keyword → { bvid, title, ts })
const videoSearchCache = new Map<string, { bvid: string; title: string; ts: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 分钟

/**
 * 搜索B站获取真实视频 BV 号
 * 通过抓取B站搜索页面 HTML 提取真实存在的视频
 */
async function searchBilibiliVideo(keyword: string): Promise<{ bvid: string; title: string } | null> {
  // 检查缓存
  const cached = videoSearchCache.get(keyword);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return { bvid: cached.bvid, title: cached.title };
  }

  try {
    const searchUrl = `https://search.bilibili.com/all?keyword=${encodeURIComponent(keyword)}`;
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "zh-CN,zh;q=0.9",
      },
    });

    if (!res.ok) {
      console.log(`[VideoSearch] B站搜索请求失败: ${res.status}`);
      return null;
    }

    const html = await res.text();

    // 提取所有 bilibili.com/video/BVxxx 中的 BV 号（去重）
    const bvRegex = /bilibili\.com\/video\/(BV[a-zA-Z0-9]{10})/g;
    const seen = new Set<string>();
    const bvids: string[] = [];
    let match;
    while ((match = bvRegex.exec(html)) !== null) {
      const bvid = match[1];
      if (!seen.has(bvid)) {
        seen.add(bvid);
        bvids.push(bvid);
      }
    }

    if (bvids.length === 0) {
      console.log(`[VideoSearch] 未找到BV号: keyword="${keyword}"`);
      return null;
    }

    // 尝试提取第一个视频的标题
    let title = keyword;
    const firstBv = bvids[0];
    const bvIndex = html.indexOf(`bilibili.com/video/${firstBv}`);
    if (bvIndex >= 0) {
      // 在 BV 号附近 300 字符范围内查找 title 属性
      const context = html.slice(bvIndex, bvIndex + 500);
      const titleMatch = context.match(/title="([^"]{5,100})"/);
      if (titleMatch) {
        title = titleMatch[1].replace(/<[^>]+>/g, "").trim();
      }
    }

    console.log(`[VideoSearch] ✓ keyword="${keyword}" → BV=${firstBv} title="${title.slice(0, 30)}"`);

    // 缓存结果
    videoSearchCache.set(keyword, { bvid: firstBv, title, ts: Date.now() });

    return { bvid: firstBv, title };
  } catch (error: any) {
    console.log(`[VideoSearch] 搜索出错: keyword="${keyword}" error=${error.message}`);
    return null;
  }
}

/**
 * 将回复中的B站搜索链接替换为真实视频链接
 * 这样前端可以内嵌播放器播放真实存在的视频
 */
async function enrichWithRealVideos(text: string): Promise<string> {
  // 找到所有B站搜索链接: [任何文字](https://search.bilibili.com/all?keyword=xxx)
  // 不依赖 emoji 字符（避免 surrogate pair 导致正则匹配失败）
  const searchLinkRegex = /\[([^\]]*)\]\((https?:\/\/search\.bilibili\.com\/all\?keyword=([^)]+))\)/g;

  const matches: Array<{ fullMatch: string; keyword: string }> = [];
  let match;
  while ((match = searchLinkRegex.exec(text)) !== null) {
    // 从 URL 参数中提取关键词（安全 decode，避免非法 % 编码抛出异常）
    let keyword: string;
    try {
      keyword = decodeURIComponent(match[3]).trim();
    } catch {
      keyword = match[3].trim();
    }
    matches.push({ fullMatch: match[0], keyword });
  }

  if (matches.length === 0) return text;

  // 并行搜索所有关键词
  const searchResults = await Promise.all(
    matches.map(m => searchBilibiliVideo(m.keyword))
  );

  let result = text;
  let enrichedCount = 0;
  for (let i = 0; i < matches.length; i++) {
    const { fullMatch, keyword } = matches[i];
    const video = searchResults[i];
    if (video) {
      // 替换为真实视频链接
      const realLink = `[📹 ${video.title}](https://www.bilibili.com/video/${video.bvid})`;
      result = result.replace(fullMatch, realLink);
      enrichedCount++;
    }
    // 如果搜索失败，保留原始搜索链接作为 fallback
  }

  if (enrichedCount > 0) {
    console.log(`[VideoEnrich] ✓ ${enrichedCount}/${matches.length} 个搜索链接已替换为真实视频`);
  }

  return result;
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/check-login", (_req, res) => {
  const apiKey = process.env.CODEBUDDY_API_KEY;
  res.json({
    isLoggedIn: !!apiKey,
    method: apiKey ? "env" : "none",
    envConfigured: !!apiKey,
    apiKey: apiKey ? apiKey.slice(0, 8) + "****" + apiKey.slice(-4) : undefined,
  });
});

app.post("/api/save-env-config", (req, res) => {
  const { apiKey } = req.body;
  if (apiKey) {
    process.env.CODEBUDDY_API_KEY = apiKey;
  }
  res.json({ success: true });
});

app.get("/api/models", (_req, res) => {
  res.json({ models: AVAILABLE_MODELS, defaultModel: DEFAULT_MODEL });
});

// ===== 会话 CRUD =====

app.get("/api/sessions", (_req, res) => {
  try {
    const sessions = db.getAllSessions().map(s => ({
      ...s,
      messageCount: db.getMessagesBySession(s.id).length,
    }));
    res.json({ sessions });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/sessions/:sessionId", (req, res) => {
  try {
    const session = db.getSession(req.params.sessionId);
    if (!session) return res.status(404).json({ error: "会话不存在" });
    const messages = db.getMessagesBySession(req.params.sessionId).map(m => ({
      ...m,
      tool_calls: m.tool_calls ? JSON.parse(m.tool_calls) : null,
    }));
    res.json({ session, messages });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/sessions", (req, res) => {
  try {
    const { model = DEFAULT_MODEL, title = "新对话" } = req.body;
    const now = new Date().toISOString();
    const session = db.createSession({
      id: uuidv4(), title, model,
      sdk_session_id: null,
      created_at: now, updated_at: now,
    });
    res.json({ session });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.patch("/api/sessions/:sessionId", (req, res) => {
  try {
    const { title, model } = req.body;
    const ok = db.updateSession(req.params.sessionId, { title, model });
    if (!ok) return res.status(404).json({ error: "会话不存在" });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/sessions/:sessionId", (req, res) => {
  try {
    const ok = db.deleteSession(req.params.sessionId);
    if (!ok) return res.status(404).json({ error: "会话不存在" });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ===== 聊天（核心：直接 HTTP SSE 代理）=====

app.post("/api/chat", async (req, res) => {
  const { sessionId, message, model } = req.body;

  if (!message) return res.status(400).json({ error: "消息不能为空" });
  if (!API_KEY) return res.status(500).json({ error: "未配置 API Key" });

  console.log(`[Chat] message="${message.slice(0, 50)}" model=${model || DEFAULT_MODEL}`);

  // 获取或创建会话
  let session = sessionId ? db.getSession(sessionId) : null;
  const now = new Date().toISOString();
  if (!session) {
    session = db.createSession({
      id: sessionId || uuidv4(),
      title: message.slice(0, 30) + (message.length > 30 ? "..." : ""),
      model: model || DEFAULT_MODEL,
      sdk_session_id: null,
      created_at: now, updated_at: now,
    });
  }

  const userMsgId = uuidv4();
  const assistantMsgId = uuidv4();
  const selectedModel = model || session.model || DEFAULT_MODEL;

  // 保存用户消息
  db.createMessage({
    id: userMsgId, session_id: session.id,
    role: "user", content: message, model: null,
    created_at: now, tool_calls: null,
  });

  // 获取历史消息（构建上下文）
  const history = db.getMessagesBySession(session.id);
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map(m => ({ role: m.role, content: m.content })),
  ];

  // 设置 SSE 响应头
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // 发送初始化事件
  res.write(`data: ${JSON.stringify({
    type: "init",
    sessionId: session.id,
    userMessageId: userMsgId,
    assistantMessageId: assistantMsgId,
    model: selectedModel,
  })}\n\n`);

  let fullResponse = "";

  try {
    // 调用 CodeBuddy API（流式）
    const apiRes = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        max_tokens: 4096,
        stream: true,
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error(`[Chat] API error: ${apiRes.status}`, errText);
      res.write(`data: ${JSON.stringify({
        type: "error",
        message: `API 错误 (${apiRes.status}): ${errText.slice(0, 200)}`,
      })}\n\n`);
      res.end();
      return;
    }

    // 解析 SSE 流并转发给前端
    const reader = apiRes.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;

        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta;
          if (delta?.content) {
            fullResponse += delta.content;
            res.write(`data: ${JSON.stringify({
              type: "text",
              content: delta.content,
            })}\n\n`);
          }
        } catch {
          // 忽略解析错误的行
        }
      }
    }

    // 修正视频链接（将编造的直接链接替换为搜索链接）
    const correctedResponse = replaceDirectVideoUrls(fullResponse);
    // 搜索B站真实视频，将搜索链接替换为可播放的真实视频链接
    const enrichedResponse = await enrichWithRealVideos(correctedResponse);
    const wasChanged = enrichedResponse !== fullResponse;
    if (wasChanged) {
      console.log(`[Chat] 视频链接已处理 (${fullResponse.length} → ${enrichedResponse.length})`);
    }

    // 保存助手消息
    db.createMessage({
      id: assistantMsgId, session_id: session.id,
      role: "assistant", content: enrichedResponse,
      model: selectedModel,
      created_at: new Date().toISOString(),
      tool_calls: null,
    });

    // 更新会话标题（如果是第一条消息）
    const msgs = db.getMessagesBySession(session.id);
    if (msgs.length <= 2) {
      db.updateSession(session.id, {
        title: message.slice(0, 30) + (message.length > 30 ? "..." : ""),
        model: selectedModel,
      });
    }

    // 发送完成事件（如有修正/增强，附带最终内容让前端替换）
    res.write(`data: ${JSON.stringify({
      type: "done",
      ...(wasChanged ? { content: enrichedResponse } : {}),
    })}\n\n`);
    console.log(`[Chat] 完成 ✓ 响应长度: ${enrichedResponse.length}${wasChanged ? " (已处理视频链接)" : ""}`);
    res.end();
  } catch (error: any) {
    console.error(`[Chat] 错误:`, error.message);
    res.write(`data: ${JSON.stringify({
      type: "error",
      message: error.message || "处理请求时发生错误",
    })}\n\n`);
    res.end();
  }
});

// ===== 轻量代理（前端 localStorage 管理会话时使用）=====

app.post("/api/proxy", async (req, res) => {
  const { model, messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages 不能为空" });
  }
  if (!API_KEY) return res.status(500).json({ error: "未配置 API Key" });

  const selectedModel = model || DEFAULT_MODEL;
  console.log(`[Proxy] model=${selectedModel} messages=${messages.length}`);

  // 设置 SSE 响应头
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";

  try {
    const apiRes = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        max_tokens: 4096,
        stream: true,
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error(`[Proxy] API error: ${apiRes.status}`, errText);
      res.write(`data: ${JSON.stringify({
        type: "error",
        message: `API 错误 (${apiRes.status}): ${errText.slice(0, 200)}`,
      })}\n\n`);
      res.end();
      return;
    }

    const reader = apiRes.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;

        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta;
          if (delta?.content) {
            fullResponse += delta.content;
            res.write(`data: ${JSON.stringify({
              type: "text",
              content: delta.content,
            })}\n\n`);
          }
        } catch {
          // 忽略解析错误的行
        }
      }
    }

    // 修正视频链接 + 搜索B站真实视频
    const correctedResponse = replaceDirectVideoUrls(fullResponse);
    const enrichedResponse = await enrichWithRealVideos(correctedResponse);
    const wasChanged = enrichedResponse !== fullResponse;

    if (wasChanged) {
      console.log(`[Proxy] 视频链接已处理 (${fullResponse.length} → ${enrichedResponse.length})`);
    }

    res.write(`data: ${JSON.stringify({
      type: "done",
      ...(wasChanged ? { content: enrichedResponse } : {}),
    })}\n\n`);
    console.log(`[Proxy] 完成 ✓ 响应长度: ${enrichedResponse.length}`);
    res.end();
  } catch (error: any) {
    console.error(`[Proxy] 错误:`, error.message);
    res.write(`data: ${JSON.stringify({
      type: "error",
      message: error.message || "处理请求时发生错误",
    })}\n\n`);
    res.end();
  }
});

// ===== 静态文件服务（Electron 生产模式 / cloudflared tunnel / localtunnel）=====
const staticDir = process.env.STATIC_DIR || path.join(__dirname, '..', 'dist');
if (staticDir && fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));
  // SPA fallback：非 API 的 GET 请求返回 index.html
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
  console.log(`[Static] 前端静态文件目录: ${staticDir}`);
}

// ===== 启动 =====

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║     ◉ 福建非遗美食助手 - 服务器已启动        ║
║     地址: http://localhost:${PORT}            ║
║     API:  copilot.tencent.com (直连)       ║
║     模型: ${DEFAULT_MODEL.padEnd(26)}        ║
╚════════════════════════════════════════════╝
  `);
});
