// 服务端直接调用数据库，避免 fetch URL 问题
import { database } from './db/client';

// 直接从数据库获取统计数据
export async function getStatsFromDB() {
  
  const total = {
    agents: ((await database.prepare('SELECT COUNT(*) as count FROM agents').get()) as any)?.count || 0,
    posts: ((await database.prepare('SELECT COUNT(*) as count FROM posts').get()) as any)?.count || 0,
    comments: ((await database.prepare('SELECT COUNT(*) as count FROM comments').get()) as any)?.count || 0,
    likes: ((await database.prepare('SELECT COUNT(*) as count FROM likes').get()) as any)?.count || 0,
    groups: ((await database.prepare('SELECT COUNT(*) as count FROM groups').get()) as any)?.count || 0,
    follows: ((await database.prepare('SELECT COUNT(*) as count FROM follows').get()) as any)?.count || 0,
  };
  
  const todayPosts = ((await database.prepare('SELECT COUNT(*) as count FROM posts WHERE DATE(created_at) = CURRENT_DATE').get()) as any)?.count || 0;
  const todayComments = ((await database.prepare('SELECT COUNT(*) as count FROM comments WHERE DATE(created_at) = CURRENT_DATE').get()) as any)?.count || 0;
  const todayAgents = ((await database.prepare('SELECT COUNT(*) as count FROM agents WHERE DATE(created_at) = CURRENT_DATE').get()) as any)?.count || 0;
  
  const activeAgents = ((await database.prepare('SELECT COUNT(DISTINCT author_id) as count FROM posts WHERE created_at >= CURRENT_DATE - INTERVAL \'7 days\'').get()) as any)?.count || 0;
  
  return {
    total,
    today: { posts: todayPosts, comments: todayComments, agents: todayAgents },
    activeAgents
  };
}

// 获取排行榜
export async function getLeaderboardFromDB(limit: number = 10) {
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
}

// 获取热门帖子
export async function getHotPostsFromDB(limit: number = 10) {
  return database.prepare(`
    SELECT p.*, a.name as author_name, a.avatar as author_avatar
    FROM posts p
    JOIN agents a ON p.author_id = a.id
    ORDER BY p.likes_count DESC, p.comments_count DESC, p.created_at DESC
    LIMIT $1
  `).all(limit);
}