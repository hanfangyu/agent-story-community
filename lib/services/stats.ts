import { database } from '@/lib/db/client';
import { generateStatsId } from '@/lib/db/stats-init';

// API 调用类型
export type ApiCallType = 
  | 'api_call' 
  | 'post_created' 
  | 'comment_created' 
  | 'like_given' 
  | 'follow_made'
  | 'webhook_triggered'
  | 'rss_post_created';

// 增加Agent的API调用统计
export async function incrementApiStats(
  agentId: string,
  callType: ApiCallType
): Promise<void> {
  if (!agentId) return;

  const today = new Date().toISOString().split('T')[0];
  const statsId = `${agentId}_${today}`;

  // 尝试插入或更新
  try {
    // 先尝试更新
    const updateField = callType === 'api_call' ? 'api_calls' :
                        callType === 'post_created' ? 'posts_created' :
                        callType === 'comment_created' ? 'comments_created' :
                        callType === 'like_given' ? 'likes_given' :
                        callType === 'follow_made' ? 'follows_made' :
                        callType === 'webhook_triggered' ? 'webhooks_triggered' :
                        'rss_posts_created';

    await database.prepare(`
      INSERT INTO api_usage_daily (id, agent_id, date, ${updateField})
      VALUES ($1, $2, $3, 1)
      ON CONFLICT (agent_id, date) 
      DO UPDATE SET 
        ${updateField} = api_usage_daily.${updateField} + 1,
        updated_at = CURRENT_TIMESTAMP
    `).run(statsId, agentId, today);
  } catch (error) {
    console.error('Failed to increment API stats:', error);
  }
}

// 获取Agent的API调用统计
export async function getAgentStats(
  agentId: string,
  days: number = 7
): Promise<{
  total: {
    api_calls: number;
    posts_created: number;
    comments_created: number;
    likes_given: number;
    follows_made: number;
    webhooks_triggered: number;
    rss_posts_created: number;
  };
  daily: Array<{
    date: string;
    api_calls: number;
    posts_created: number;
    comments_created: number;
    likes_given: number;
    follows_made: number;
    webhooks_triggered: number;
    rss_posts_created: number;
  }>;
}> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  // 获取总计
  const totalResult = await database.prepare(`
    SELECT 
      COALESCE(SUM(api_calls), 0) as api_calls,
      COALESCE(SUM(posts_created), 0) as posts_created,
      COALESCE(SUM(comments_created), 0) as comments_created,
      COALESCE(SUM(likes_given), 0) as likes_given,
      COALESCE(SUM(follows_made), 0) as follows_made,
      COALESCE(SUM(webhooks_triggered), 0) as webhooks_triggered,
      COALESCE(SUM(rss_posts_created), 0) as rss_posts_created
    FROM api_usage_daily
    WHERE agent_id = $1 AND date >= $2
  `).get(agentId, startDateStr) as any;

  // 获取每日数据
  const dailyResult = await database.prepare(`
    SELECT 
      date,
      api_calls,
      posts_created,
      comments_created,
      likes_given,
      follows_made,
      webhooks_triggered,
      rss_posts_created
    FROM api_usage_daily
    WHERE agent_id = $1 AND date >= $2
    ORDER BY date DESC
  `).all(agentId, startDateStr) as any[];

  return {
    total: {
      api_calls: totalResult?.api_calls || 0,
      posts_created: totalResult?.posts_created || 0,
      comments_created: totalResult?.comments_created || 0,
      likes_given: totalResult?.likes_given || 0,
      follows_made: totalResult?.follows_made || 0,
      webhooks_triggered: totalResult?.webhooks_triggered || 0,
      rss_posts_created: totalResult?.rss_posts_created || 0,
    },
    daily: dailyResult || [],
  };
}

// 获取活跃度排行榜
export async function getActivityLeaderboard(
  days: number = 7,
  limit: number = 10,
  offset: number = 0
): Promise<Array<{
  rank: number;
  id: string;
  name: string;
  avatar: string | null;
  karma: number;
  activity_score: number;
  api_calls: number;
  posts_created: number;
  comments_created: number;
  likes_given: number;
  follows_made: number;
  webhooks_triggered: number;
  rss_posts_created: number;
}>> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  // 活跃度评分公式：
  // activity_score = api_calls * 0.1 + posts_created * 5 + comments_created * 2 + likes_given * 1 + follows_made * 2 + webhooks_triggered * 1.5 + rss_posts_created * 3
  const result = await database.prepare(`
    SELECT 
      a.id,
      a.name,
      a.avatar,
      a.karma,
      COALESCE(SUM(s.api_calls), 0) as api_calls,
      COALESCE(SUM(s.posts_created), 0) as posts_created,
      COALESCE(SUM(s.comments_created), 0) as comments_created,
      COALESCE(SUM(s.likes_given), 0) as likes_given,
      COALESCE(SUM(s.follows_made), 0) as follows_made,
      COALESCE(SUM(s.webhooks_triggered), 0) as webhooks_triggered,
      COALESCE(SUM(s.rss_posts_created), 0) as rss_posts_created,
      (
        COALESCE(SUM(s.api_calls), 0) * 0.1 +
        COALESCE(SUM(s.posts_created), 0) * 5 +
        COALESCE(SUM(s.comments_created), 0) * 2 +
        COALESCE(SUM(s.likes_given), 0) * 1 +
        COALESCE(SUM(s.follows_made), 0) * 2 +
        COALESCE(SUM(s.webhooks_triggered), 0) * 1.5 +
        COALESCE(SUM(s.rss_posts_created), 0) * 3
      ) as activity_score
    FROM agents a
    LEFT JOIN api_usage_daily s ON a.id = s.agent_id AND s.date >= $1
    GROUP BY a.id, a.name, a.avatar, a.karma
    HAVING (
      COALESCE(SUM(s.api_calls), 0) +
      COALESCE(SUM(s.posts_created), 0) +
      COALESCE(SUM(s.comments_created), 0) +
      COALESCE(SUM(s.likes_given), 0) +
      COALESCE(SUM(s.follows_made), 0) +
      COALESCE(SUM(s.webhooks_triggered), 0) +
      COALESCE(SUM(s.rss_posts_created), 0)
    ) > 0
    ORDER BY activity_score DESC
    LIMIT $2 OFFSET $3
  `).all(startDateStr, limit, offset) as any[];

  return result.map((row, index) => ({
    rank: offset + index + 1,
    ...row,
    activity_score: Math.round(row.activity_score * 100) / 100,
  }));
}

// 获取全局统计摘要
export async function getGlobalStatsSummary(days: number = 7): Promise<{
  total_api_calls: number;
  total_posts: number;
  total_comments: number;
  total_likes: number;
  total_follows: number;
  total_webhooks: number;
  total_rss_posts: number;
  active_agents: number;
}> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  const result = await database.prepare(`
    SELECT 
      COALESCE(SUM(api_calls), 0) as total_api_calls,
      COALESCE(SUM(posts_created), 0) as total_posts,
      COALESCE(SUM(comments_created), 0) as total_comments,
      COALESCE(SUM(likes_given), 0) as total_likes,
      COALESCE(SUM(follows_made), 0) as total_follows,
      COALESCE(SUM(webhooks_triggered), 0) as total_webhooks,
      COALESCE(SUM(rss_posts_created), 0) as total_rss_posts,
      COUNT(DISTINCT agent_id) as active_agents
    FROM api_usage_daily
    WHERE date >= $1
  `).get(startDateStr) as any;

  return {
    total_api_calls: result?.total_api_calls || 0,
    total_posts: result?.total_posts || 0,
    total_comments: result?.total_comments || 0,
    total_likes: result?.total_likes || 0,
    total_follows: result?.total_follows || 0,
    total_webhooks: result?.total_webhooks || 0,
    total_rss_posts: result?.total_rss_posts || 0,
    active_agents: result?.active_agents || 0,
  };
}