/**
 * RSS 解析服务
 * 负责 RSS 源的解析和内容提取
 */
import Parser from 'rss-parser';

// RSS 解析器实例
const parser = new Parser({
  timeout: 30000, // 30秒超时
  headers: {
    'User-Agent': 'Agent-Story-Community/1.0 RSS Fetcher',
  },
  customFields: {
    item: [
      ['content:encoded', 'contentEncoded'],
      ['dc:creator', 'creator'],
      ['dc:date', 'dcDate'],
    ],
  },
});

// RSS 条目结构
export interface RssItem {
  guid: string;
  title: string;
  link: string;
  content: string;
  contentSnippet: string;
  pubDate?: Date;
  creator?: string;
}

// RSS 源结构
export interface RssFeed {
  title: string;
  description?: string;
  link: string;
  items: RssItem[];
}

/**
 * 解析 RSS 源
 */
export async function parseRssFeed(url: string): Promise<RssFeed> {
  try {
    const feed = await parser.parseURL(url);
    
    return {
      title: feed.title || 'Untitled Feed',
      description: feed.description,
      link: feed.link || '',
      items: feed.items.map(item => ({
        guid: item.guid || item.link || `item-${Date.now()}-${Math.random()}`,
        title: item.title || 'No Title',
        link: item.link || '',
        content: item['content:encoded'] || item.content || item.contentSnippet || '',
        contentSnippet: item.contentSnippet || '',
        pubDate: item.pubDate ? new Date(item.pubDate) : undefined,
        creator: item.creator || item['dc:creator'] || undefined,
      })),
    };
  } catch (error: any) {
    console.error(`[RSS] 解析失败 ${url}:`, error.message);
    throw new Error(`RSS 解析失败: ${error.message}`);
  }
}

/**
 * 获取 RSS 源信息（不解析条目，仅获取元数据）
 */
export async function fetchRssFeedInfo(url: string): Promise<{
  title: string;
  description?: string;
  link: string;
}> {
  const feed = await parseRssFeed(url);
  return {
    title: feed.title,
    description: feed.description,
    link: feed.link,
  };
}

/**
 * 格式化 RSS 条目为帖子内容
 */
export function formatRssItemAsPost(item: RssItem, feedName: string): {
  title: string;
  content: string;
} {
  // 构建帖子标题
  const title = item.title;
  
  // 构建帖子内容
  let content = '';
  
  // 如果有摘要，使用摘要作为主要内容
  if (item.contentSnippet) {
    // 限制摘要长度
    const maxLength = 500;
    const snippet = item.contentSnippet.length > maxLength
      ? item.contentSnippet.substring(0, maxLength) + '...'
      : item.contentSnippet;
    content = snippet;
  }
  
  // 添加来源链接
  if (item.link) {
    content += `\n\n📎 [原文链接](${item.link})`;
  }
  
  // 添加来源信息
  content += `\n\n📡 来源: ${feedName}`;
  
  // 添加作者信息（如果有）
  if (item.creator) {
    content += ` | 作者: ${item.creator}`;
  }
  
  return { title, content };
}

export default {
  parseRssFeed,
  fetchRssFeedInfo,
  formatRssItemAsPost,
};