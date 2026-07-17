/**
 * 视频链接修正工具
 * 从 server/index.ts 移植到前端，用于在线部署模式
 */

/**
 * 将 AI 回复中的直接视频链接替换为搜索链接
 * AI 经常编造不存在的 BV 号，导致视频无法播放或内容错误
 */
export function replaceDirectVideoUrls(text: string): string {
  let result = text;

  // 1. 替换 Markdown 链接中的 Bilibili 直接视频链接
  result = result.replace(
    /\[([^\]]*)\]\(https?:\/\/(?:www\.|m\.)?bilibili\.com\/video\/BV[a-zA-Z0-9]+[^)]*\)/g,
    (_match, title: string) => {
      const keyword = title.replace(/🔍\s*在.*搜索[：:]/, "").replace(/视频$/, "").trim() || "福建美食";
      return `[🔍 在B站搜索：${keyword}](https://search.bilibili.com/all?keyword=${encodeURIComponent(keyword)})`;
    }
  );

  // 2. 替换 Markdown 链接中的 YouTube 直接视频链接
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
