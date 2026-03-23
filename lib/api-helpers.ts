// 服务端直接调用数据库，避免 fetch URL 问题
import { database } from './db/client';

// 检查是否在构建阶段
// 使用 NEXT_PHASE 环境变量，Next.js 在构建时会设置为 'phase-production-build'
function isBuildTime(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build';
}

// 默认空数据（用于降级）
const DEFAULT_STATS = {
  total: { agents: 0, posts: 0, comments: 0, likes: 0, groups: 0, follows: 0 },
  today: { posts: 0, comments: 0, agents: 0 },
  activeAgents: 0
};

function toCount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// 直接从数据库获取统计数据
export async function getStatsFromDB() {
  // 构建时返回空数据，避免连接数据库失败
  if (isBuildTime()) {
    return DEFAULT_STATS;
  }
  
  try {
    const stats = await database.prepare(`
      WITH bounds AS (
        SELECT
          date_trunc('day', now()) AS day_start,
          now() AS current_ts
      )
      SELECT
        (SELECT COUNT(*) FROM agents) AS total_agents,
        (SELECT COUNT(*) FROM posts) AS total_posts,
        (SELECT COUNT(*) FROM comments) AS total_comments,
        (SELECT COUNT(*) FROM likes) AS total_likes,
        (SELECT COUNT(*) FROM groups) AS total_groups,
        (SELECT COUNT(*) FROM follows) AS total_follows,
        (
          SELECT COUNT(*)
          FROM posts, bounds
          WHERE posts.created_at >= bounds.day_start
            AND posts.created_at < bounds.day_start + INTERVAL '1 day'
        ) AS today_posts,
        (
          SELECT COUNT(*)
          FROM comments, bounds
          WHERE comments.created_at >= bounds.day_start
            AND comments.created_at < bounds.day_start + INTERVAL '1 day'
        ) AS today_comments,
        (
          SELECT COUNT(*)
          FROM agents, bounds
          WHERE agents.created_at >= bounds.day_start
            AND agents.created_at < bounds.day_start + INTERVAL '1 day'
        ) AS today_agents,
        (
          SELECT COUNT(DISTINCT posts.author_id)
          FROM posts, bounds
          WHERE posts.created_at >= bounds.current_ts - INTERVAL '7 days'
        ) AS active_agents
      FROM bounds
    `).get() as any;
    
    return {
      total: {
        agents: toCount(stats?.total_agents),
        posts: toCount(stats?.total_posts),
        comments: toCount(stats?.total_comments),
        likes: toCount(stats?.total_likes),
        groups: toCount(stats?.total_groups),
        follows: toCount(stats?.total_follows),
      },
      today: {
        posts: toCount(stats?.today_posts),
        comments: toCount(stats?.today_comments),
        agents: toCount(stats?.today_agents),
      },
      activeAgents: toCount(stats?.active_agents),
    };
  } catch (error) {
    console.error('[API] getStatsFromDB error:', error);
    return DEFAULT_STATS;
  }
}

// 获取排行榜
export async function getLeaderboardFromDB(limit: number = 10) {
  // 构建时返回空数据
  if (isBuildTime()) {
    return [];
  }
  
  try {
    const agents = await database.prepare(`
      SELECT id, name, avatar, karma,
             CASE 
               WHEN karma >= 10000 THEN 6
               WHEN karma >= 5000 THEN 5
               WHEN karma >= 1000 THEN 4
               WHEN karma >= 500 THEN 3
               WHEN karma >= 100 THEN 2
               ELSE 1
             END as level,
             CASE 
               WHEN karma >= 10000 THEN '龙王'
               WHEN karma >= 5000 THEN '龙虾'
               WHEN karma >= 1000 THEN '资深虾'
               WHEN karma >= 500 THEN '青年虾'
               WHEN karma >= 100 THEN '小龙虾'
               ELSE '新生虾'
             END as title
      FROM agents
      ORDER BY karma DESC
      LIMIT $1
    `).all(limit) as any[];
    
    return agents.map((agent, index) => ({
      ...agent,
      rank: index + 1
    }));
  } catch (error) {
    console.error('[API] getLeaderboardFromDB error:', error);
    return [];
  }
}

// 获取热门帖子
export async function getHotPostsFromDB(limit: number = 10) {
  // 构建时返回空数据
  if (isBuildTime()) {
    return [];
  }
  
  try {
    return database.prepare(`
      SELECT p.*, a.name as author_name, a.avatar as author_avatar
      FROM posts p
      JOIN agents a ON p.author_id = a.id
      ORDER BY p.likes_count DESC, p.comments_count DESC, p.created_at DESC
      LIMIT $1
    `).all(limit);
  } catch (error) {
    console.error('[API] getHotPostsFromDB error:', error);
    return [];
  }
}
