import { Play, ExternalLink, Search } from 'lucide-react';

interface VideoEmbedProps {
  /** 视频 URL */
  url: string;
  /** 可选标题 */
  title?: string;
}

interface ParsedVideo {
  platform: 'bilibili_embed' | 'bilibili_search' | 'youtube_search' | 'youtube_link' | 'mp4' | 'unknown';
  embedUrl?: string;
  directUrl?: string;
  keyword?: string;
  bvid?: string;
}

/**
 * 安全的 decodeURIComponent，不会因非法 % 编码抛出异常
 */
function safeDecode(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

/**
 * 解析视频 URL，识别平台和类型
 */
function parseVideoUrl(url: string): ParsedVideo {
  // Bilibili 搜索链接: https://search.bilibili.com/all?keyword=xxx
  const biliSearchMatch = url.match(/search\.bilibili\.com\/all\?.*keyword=([^&]+)/);
  if (biliSearchMatch) {
    return {
      platform: 'bilibili_search',
      keyword: safeDecode(biliSearchMatch[1]),
      directUrl: url,
    };
  }

  // YouTube 搜索链接: https://www.youtube.com/results?search_query=xxx
  const ytSearchMatch = url.match(/youtube\.com\/results\?.*search_query=([^&]+)/);
  if (ytSearchMatch) {
    return {
      platform: 'youtube_search',
      keyword: safeDecode(ytSearchMatch[1]),
      directUrl: url,
    };
  }

  // Bilibili 直接视频链接: https://www.bilibili.com/video/BVxxxxx
  // 这些是服务端搜索B站获取的真实视频，可以嵌入播放
  const biliMatch = url.match(/bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/);
  if (biliMatch) {
    const bvid = biliMatch[1];
    return {
      platform: 'bilibili_embed',
      bvid,
      embedUrl: `https://player.bilibili.com/player.html?bvid=${bvid}&page=1&high_quality=1&autoplay=0&danmaku=0`,
      directUrl: url,
    };
  }

  // YouTube 直接链接（无法可靠嵌入，渲染为搜索卡片）
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    return {
      platform: 'youtube_link',
      directUrl: url,
    };
  }

  // 直接视频文件: .mp4 / .webm / .ogg / .mov
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) {
    return {
      platform: 'mp4',
      directUrl: url,
    };
  }

  return { platform: 'unknown' };
}

/**
 * 清理标题文本，去掉 emoji 前缀等
 * 不依赖具体 emoji 字符（避免 surrogate pair 导致正则匹配失败）
 */
function cleanTitle(title: string | undefined, fallback: string): string {
  if (!title) return fallback;
  return title
    // 移除开头的非中文/非字母数字字符（emoji、符号、空格等）
    .replace(/^[^\u4e00-\u9fa5a-zA-Z0-9【《"]+/, '')
    .replace(/^在.*搜索[：:]?/, '')
    .trim() || fallback;
}

/**
 * 从链接标题或 URL 中提取搜索关键词
 */
function extractKeyword(title: string | undefined, url: string): string {
  if (title) {
    const cleaned = title
      .replace(/^[^\u4e00-\u9fa5a-zA-Z0-9【《"]+/, '')
      .replace(/^在.*搜索[：:]?/, '')
      .replace(/视频$/, '')
      .trim();
    if (cleaned) return cleaned;
  }
  const kwMatch = url.match(/[?&](?:keyword|search_query)=([^&]+)/);
  if (kwMatch) return safeDecode(kwMatch[1]);
  return '福建非遗美食';
}

/**
 * 内嵌视频播放器组件
 * - B站真实视频：iframe 内嵌播放
 * - 搜索链接：渲染为可点击的搜索卡片
 */
export function VideoEmbed({ url, title }: VideoEmbedProps) {
  const video = parseVideoUrl(url);

  if (video.platform === 'unknown') {
    return null;
  }

  // MP4 直接播放
  if (video.platform === 'mp4' && video.directUrl) {
    return (
      <div
        className="my-3 overflow-hidden rounded-lg border"
        style={{
          borderColor: 'var(--td-component-border)',
          backgroundColor: 'var(--td-bg-color-container)',
        }}
      >
        <div className="p-3 flex justify-center" style={{ backgroundColor: 'var(--td-bg-color-page)' }}>
          <video controls className="w-full max-h-96 rounded" style={{ backgroundColor: '#000' }}>
            <source src={video.directUrl} type="video/mp4" />
            您的浏览器不支持视频播放
          </video>
        </div>
      </div>
    );
  }

  // B站真实视频 - iframe 内嵌播放
  if (video.platform === 'bilibili_embed' && video.embedUrl) {
    const videoTitle = cleanTitle(title, 'B站视频');
    return (
      <div
        className="my-3 overflow-hidden rounded-lg border"
        style={{
          borderColor: 'var(--td-component-border)',
          backgroundColor: 'var(--td-bg-color-container)',
        }}
      >
        {/* 标题栏 */}
        <div
          className="flex items-center justify-between px-3 py-2 text-xs"
          style={{
            backgroundColor: 'var(--td-bg-color-component)',
            color: 'var(--td-text-color-secondary)',
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Play size={14} className="flex-shrink-0" style={{ color: '#fb7299' }} />
            <span className="truncate" title={videoTitle}>{videoTitle}</span>
          </div>
          <a
            href={video.directUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:underline flex-shrink-0 ml-2"
            style={{ color: 'var(--td-brand-color)' }}
          >
            <ExternalLink size={12} />
            B站
          </a>
        </div>
        {/* iframe 播放器 */}
        <div className="relative" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={video.embedUrl}
            className="absolute inset-0 w-full h-full border-0"
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            scrolling="no"
          />
        </div>
      </div>
    );
  }

  // 搜索链接 / YouTube 直接链接 - 渲染为搜索卡片
  const isBilibili = video.platform === 'bilibili_search' || video.platform === 'youtube_link' && false;
  const platformName = video.platform === 'youtube_search' || video.platform === 'youtube_link' ? 'YouTube' : 'B站';
  const platformColor = platformName === 'B站' ? '#fb7299' : '#ff0000';
  const keyword = extractKeyword(title, url);
  const searchUrl = platformName === 'B站'
    ? `https://search.bilibili.com/all?keyword=${encodeURIComponent(keyword)}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}`;

  return (
    <a
      href={searchUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="my-3 flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:scale-[1.02] no-underline"
      style={{
        backgroundColor: `${platformColor}15`,
        border: `1px solid ${platformColor}30`,
      }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: platformColor }}
      >
        <Search size={20} color="white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium" style={{ color: 'var(--td-text-color-primary)' }}>
          在{platformName}搜索：{keyword}
        </div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--td-text-color-placeholder)' }}>
          点击在新标签页打开搜索结果
        </div>
      </div>
      <ExternalLink size={16} style={{ color: platformColor }} />
    </a>
  );
}

/**
 * 从文本中提取所有视频 URL（包括搜索链接和直接视频链接）
 */
export function extractVideoUrls(text: string): Array<{ url: string; title?: string }> {
  const results: Array<{ url: string; title?: string }> = [];
  const seenUrls = new Set<string>();

  // 记录 Markdown 视频链接覆盖的字符区间，避免裸 URL 重复提取
  const mdLinkRanges: Array<{ start: number; end: number }> = [];

  // 找出所有 Markdown 视频链接 [标题](视频URL)
  const mdLinkRegex = /\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
  let mdMatch: RegExpExecArray | null;
  while ((mdMatch = mdLinkRegex.exec(text)) !== null) {
    const linkText = mdMatch[1];
    const linkUrl = mdMatch[2];
    const parsed = parseVideoUrl(linkUrl);
    if (parsed.platform !== 'unknown') {
      mdLinkRanges.push({ start: mdMatch.index, end: mdMatch.index + mdMatch[0].length });
      if (!seenUrls.has(linkUrl)) {
        seenUrls.add(linkUrl);
        results.push({ url: linkUrl, title: linkText });
      }
    }
  }

  // 找出未被 Markdown 链接包裹的纯视频 URL
  const urlRegex = /(https?:\/\/[^\s<>"')\]]+)/g;
  let urlMatch: RegExpExecArray | null;
  while ((urlMatch = urlRegex.exec(text)) !== null) {
    const url = urlMatch[1];
    const parsed = parseVideoUrl(url);
    if (parsed.platform !== 'unknown') {
      // 检查该 URL 是否落在某个 Markdown 链接的区间内
      const isInsideMdLink = mdLinkRanges.some(
        range => urlMatch!.index >= range.start && urlMatch!.index < range.end
      );
      if (!isInsideMdLink && !seenUrls.has(url)) {
        seenUrls.add(url);
        results.push({ url });
      }
    }
  }

  return results;
}

/**
 * 从文本中移除所有视频相关的链接（Markdown 链接和裸 URL），
 * 这样 ChatMarkdown 渲染时不会重复显示视频链接文字，
 * 视频只通过 VideoEmbed 组件渲染。
 */
export function stripVideoUrls(text: string): string {
  let result = text;

  // 1. 移除 Markdown 视频链接: [标题](视频URL)
  const mdLinkRegex = /\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
  result = result.replace(mdLinkRegex, (match, _title, url) => {
    const parsed = parseVideoUrl(url);
    return parsed.platform !== 'unknown' ? '' : match;
  });

  // 2. 移除裸视频 URL（不在 Markdown 链接中的）
  const bareUrlRegex = /(?<![[(])https?:\/\/[^\s<>"')\]]+/g;
  result = result.replace(bareUrlRegex, (match) => {
    const parsed = parseVideoUrl(match);
    return parsed.platform !== 'unknown' ? '' : match;
  });

  // 3. 清理移除后留下的多余空行和空白
  result = result.replace(/\n{3,}/g, '\n\n').trim();

  return result;
}
