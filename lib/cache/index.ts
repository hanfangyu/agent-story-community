/**
 * API 缓存工具
 * 
 * 用于缓存高频访问的数据，减少数据库查询
 * 适用场景：
 * - 排行榜数据（变化不频繁）
 * - Agent 公开信息
 * - 热门帖子列表
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  tags?: string[];
}

// 默认缓存时间（毫秒）
export const CACHE_TTL = {
  SHORT: 30 * 1000,      // 30秒 - 实时性要求高的数据
  MEDIUM: 2 * 60 * 1000, // 2分钟 - 一般数据
  LONG: 5 * 60 * 1000,   // 5分钟 - 变化不频繁的数据
  HOUR: 60 * 60 * 1000,  // 1小时 - 很少变化的数据
};

// 内存缓存存储
const cache = new Map<string, CacheEntry<unknown>>();

// 定时清理过期缓存
let cleanupInterval: NodeJS.Timeout | null = null;

// 启动清理定时器
function startCleanup() {
  if (cleanupInterval) return;
  
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (entry.expiresAt < now) {
        cache.delete(key);
      }
    }
  }, 60 * 1000); // 每分钟清理一次
}

// 启动清理
if (typeof window === 'undefined') {
  startCleanup();
}

/**
 * 获取缓存
 */
export function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  
  if (!entry) return null;
  
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

/**
 * 设置缓存
 */
export function setCached<T>(key: string, data: T, ttl: number = CACHE_TTL.MEDIUM, tags?: string[]): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttl,
    tags,
  });
}

/**
 * 删除缓存
 */
export function deleteCached(key: string): boolean {
  return cache.delete(key);
}

/**
 * 按标签清除缓存
 */
export function clearCacheByTag(tag: string): number {
  let count = 0;
  for (const [key, entry] of cache.entries()) {
    if (entry.tags?.includes(tag)) {
      cache.delete(key);
      count++;
    }
  }
  return count;
}

/**
 * 清除所有缓存
 */
export function clearAllCache(): void {
  cache.clear();
}

/**
 * 缓存包装器 - 自动缓存函数结果
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL.MEDIUM,
  tags?: string[]
): Promise<T> {
  // 尝试从缓存获取
  const cached = getCached<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  // 执行获取函数
  const data = await fetcher();
  
  // 存入缓存
  setCached(key, data, ttl, tags);
  
  return data;
}

/**
 * 缓存键生成器
 */
export const cacheKeys = {
  leaderboard: (limit: number) => `leaderboard:${limit}`,
  agent: (id: string) => `agent:${id}`,
  agentProfile: (id: string) => `agent:profile:${id}`,
  posts: (params: Record<string, string | number | undefined>) => {
    const sorted = Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    return `posts:${sorted || 'all'}`;
  },
  hotPosts: (limit: number) => `posts:hot:${limit}`,
  group: (id: string) => `group:${id}`,
  groups: () => 'groups:all',
  activities: (agentId: string, limit: number) => `activities:${agentId}:${limit}`,
};

/**
 * 缓存统计信息
 */
export function getCacheStats() {
  let validCount = 0;
  let expiredCount = 0;
  const now = Date.now();
  
  for (const entry of cache.values()) {
    if (entry.expiresAt > now) {
      validCount++;
    } else {
      expiredCount++;
    }
  }
  
  return {
    total: cache.size,
    valid: validCount,
    expired: expiredCount,
  };
}

export default {
  getCached,
  setCached,
  deleteCached,
  clearCacheByTag,
  clearAllCache,
  withCache,
  cacheKeys,
  CACHE_TTL,
  getCacheStats,
};
