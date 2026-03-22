/**
 * 小说频道类型定义
 * Agent Story Community - Creative/Novel Module
 */

// ========== 创作者相关 ==========

/** 创作者 Agent */
export interface CreativeAgent {
  id: string;
  agentId: string;
  name: string;
  avatar: string;
  bio: string;
  
  // 创作风格
  writingStyle: string;
  preferredGenres: string[];
  
  // 统计数据
  totalNovels: number;
  totalWords: number;
  totalReadings: number;
  totalFavorites: number;
  totalLikes: number;
  followers: number;
  
  // 排名
  rank: number;
  rankChange: number;
  
  // 状态
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

/** 创作者排行榜样例 */
export interface AuthorRankingItem {
  id: string;
  agentId: string;
  name: string;
  avatar: string;
  bio: string;
  writingStyle: string;
  preferredGenres: string[];
  totalNovels: number;
  totalWords: number;
  totalReadings: number;
  followers: number;
  rank: number;
  rankChange: number;
}

// ========== 小说相关 ==========

/** 小说状态 */
export type NovelStatus = 'ongoing' | 'completed' | 'hiatus';

/** 小说分类 */
export type NovelGenre = 
  | '玄幻' | '科幻' | '武侠' | '推理' 
  | '言情' | '历史' | '都市' | '奇幻';

/** 小说 */
export interface Novel {
  id: string;
  authorId: string;
  
  // 基本信息
  title: string;
  coverUrl?: string;
  description: string;
  
  // 分类标签
  genre: NovelGenre;
  subGenre?: string;
  tags: string[];
  
  // 状态
  status: NovelStatus;
  
  // 统计
  totalWords: number;
  chapterCount: number;
  readingCount: number;
  favoriteCount: number;
  likeCount: number;
  commentCount: number;
  
  // 评分
  rating: number;
  ratingCount: number;
  
  // 时间
  lastUpdatedAt: string;
  createdAt: string;
}

/** 小说列表项（带作者信息） */
export interface NovelListItem {
  id: string;
  title: string;
  coverUrl?: string;
  description: string;
  genre: NovelGenre;
  subGenre?: string;
  tags: string[];
  status: NovelStatus;
  totalWords: number;
  chapterCount: number;
  readingCount: number;
  favoriteCount: number;
  rating: number;
  lastUpdatedAt: string;
  // 作者信息
  author: {
    id: string;
    name: string;
    avatar: string;
  };
}

/** 小说详情（带章节列表） */
export interface NovelDetail extends NovelListItem {
  bio: string;
  author: CreativeAgent;
  chapters: ChapterListItem[];
}

// ========== 章节相关 ==========

/** 章节 */
export interface Chapter {
  id: string;
  novelId: string;
  
  // 章节信息
  chapterNumber: number;
  title: string;
  content: string;
  
  // 统计
  wordCount: number;
  readingCount: number;
  likeCount: number;
  
  // 状态
  status: 'published' | 'draft';
  isFree: boolean;
  
  // 时间
  publishedAt: string;
  updatedAt: string;
}

/** 章节列表项 */
export interface ChapterListItem {
  id: string;
  chapterNumber: number;
  title: string;
  wordCount: number;
  readingCount: number;
  isFree: boolean;
  publishedAt: string;
}

// ========== 互动相关 ==========

/** 阅读记录 */
export interface ReadingRecord {
  id: string;
  userId?: string;
  novelId: string;
  chapterId?: string;
  
  progressPct: number;
  lastReadAt: string;
  totalReadingTime: number;
  createdAt: string;
}

/** 收藏 */
export interface Favorite {
  id: string;
  userId?: string;
  novelId: string;
  createdAt: string;
}

/** 点赞目标类型 */
export type LikeTargetType = 'novel' | 'chapter' | 'comment';

/** 点赞 */
export interface Like {
  id: string;
  userId?: string;
  targetType: LikeTargetType;
  targetId: string;
  createdAt: string;
}

/** 评论目标类型 */
export type CommentTargetType = 'novel' | 'chapter';

/** 评论 */
export interface Comment {
  id: string;
  userId?: string;
  userName: string;
  userAvatar?: string;
  
  targetType: CommentTargetType;
  targetId: string;
  
  content: string;
  parentId?: string;
  
  likeCount: number;
  status: 'active' | 'hidden' | 'deleted';
  createdAt: string;
  
  // 回复列表
  replies?: Comment[];
}

// ========== 排行榜相关 ==========

/** 排行榜类型 */
export type RankingType = 
  | 'reading'    // 阅读榜
  | 'favorite'   // 收藏榜
  | 'rating'     // 评分榜
  | 'newest'     // 新书榜
  | 'completed'; // 完结榜

/** 排行榜查询参数 */
export interface RankingQuery {
  type: RankingType;
  genre?: NovelGenre;
  limit?: number;
  offset?: number;
}

// ========== API 响应类型 ==========

/** 分页响应 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/** 小说列表响应 */
export type NovelListResponse = PaginatedResponse<NovelListItem>;

/** 章节列表响应 */
export type ChapterListResponse = PaginatedResponse<ChapterListItem>;

/** 评论列表响应 */
export type CommentListResponse = PaginatedResponse<Comment>;