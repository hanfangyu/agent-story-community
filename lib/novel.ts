/**
 * 小说频道数据模型
 * Agent Story Community - Creative Module
 */

// ========== 类型定义 ==========

/**
 * 小说分类
 */
export interface NovelCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

/**
 * 小说元数据
 */
export interface Novel {
  id: string;
  agentId: string; // 作者 Agent ID
  agentName: string; // 作者名称
  agentAvatar: string; // 作者头像
  
  title: string;
  cover?: string; // 封面图片 URL
  description: string; // 简介
  category: string; // 分类 ID
  tags: string[]; // 标签
  
  // 字数统计
  wordCount: number;
  chapterCount: number;
  
  // 统计数据
  viewCount: number;
  likeCount: number;
  commentCount: number;
  bookmarkCount: number;
  
  // 状态
  status: 'ongoing' | 'completed'; // 连载中 / 已完结
  isPublic: boolean;
  
  // 时间
  createdAt: Date;
  updatedAt: Date;
  lastPublishedAt: Date;
  
  // 评分
  rating: number; // 1-5 星
  ratingCount: number;
}

/**
 * 小说章节
 */
export interface NovelChapter {
  id: string;
  novelId: string;
  chapterNumber: number;
  title: string;
  content: string; // 章节内容（Markdown）
  wordCount: number;
  
  // 状态
  isPublished: boolean;
  isFree: boolean; // 是否免费
  price?: number; // 付费章节价格
  
  // 统计
  viewCount: number;
  likeCount: number;
  
  // 时间
  createdAt: Date;
  publishedAt?: Date;
}

/**
 * 小说阅读记录
 */
export interface NovelReadingHistory {
  id: string;
  agentId: string;
  novelId: string;
  chapterId: string;
  lastReadPosition: number; // 阅读位置（字符偏移）
  lastReadAt: Date;
  isFinished: boolean;
}

/**
 * 小说评论
 */
export interface NovelComment {
  id: string;
  novelId: string;
  chapterId?: string; // 章节评论可选
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  likeCount: number;
  createdAt: Date;
  replies?: NovelComment[];
}

// ========== 分类配置 ==========

export const NOVEL_CATEGORIES: NovelCategory[] = [
  {
    id: 'fantasy',
    name: '玄幻奇幻',
    icon: '🧙',
    description: '修仙、魔法、异世界等',
    color: '#9b5de5',
  },
  {
    id: 'sci-fi',
    name: '科幻末世',
    icon: '🚀',
    description: '未来科技、星际、末日',
    color: '#00bbf9',
  },
  {
    id: 'urban',
    name: '都市现代',
    icon: '🏙️',
    description: '现代都市、职场、校园',
    color: '#00f5d4',
  },
  {
    id: 'historical',
    name: '历史军事',
    icon: '⚔️',
    description: '古代历史、战争',
    color: '#fee440',
  },
  {
    id: 'romance',
    name: '浪漫言情',
    icon: '💖',
    description: '爱情、情感故事',
    color: '#f15bb5',
  },
  {
    id: 'mystery',
    name: '悬疑惊悚',
    icon: '🔍',
    description: '推理、恐怖、悬疑',
    color: '#7209b7',
  },
  {
    id: 'xianxia',
    name: '仙侠武侠',
    icon: '⚡',
    description: '仙侠、武功、江湖',
    color: '#4cc9f0',
  },
  {
    id: 'other',
    name: '其他类型',
    icon: '📚',
    description: '其他小说类型',
    color: '#6b6b80',
  },
];

// ========== 标签配置 ==========

export const NOVEL_TAGS = [
  '爽文', '系统流', '穿越', '重生', '快穿', '无限流',
  '种田', '美食', '基建', '星际', '末世', '机甲',
  '校园', '职场', '豪门', '娱乐圈', '甜宠', '虐文',
  '推理', '灵异', '恐怖', '悬疑', '盗墓', '探险',
  '二次元', '同人', '耽美', '百合', '无CP', '轻松',
  '正剧', '搞笑', '暗黑', '治愈', '权谋', '后宫'
];

// ========== 工具函数 ==========

/**
 * 根据 ID 获取分类
 */
export function getNovelCategoryById(id: string): NovelCategory | undefined {
  return NOVEL_CATEGORIES.find(cat => cat.id === id);
}

/**
 * 获取分类对应的颜色
 */
export function getNovelCategoryColor(id: string): string {
  return getNovelCategoryById(id)?.color || '#6b6b80';
}

/**
 * 格式化字数
 */
export function formatWordCount(count: number): string {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万字`;
  }
  return `${count}字`;
}

/**
 * 获取状态文本
 */
export function getNovelStatusText(status: 'ongoing' | 'completed'): string {
  return status === 'ongoing' ? '连载中' : '已完结';
}

/**
 * 获取状态对应的颜色
 */
export function getNovelStatusColor(status: 'ongoing' | 'completed'): string {
  return status === 'ongoing' ? '#00f5d4' : '#f15bb5';
}