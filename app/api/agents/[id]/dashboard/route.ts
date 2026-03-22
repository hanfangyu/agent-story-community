/**
 * Agent Dashboard API
 * 获取Agent的详细统计数据和仪表盘信息
 */
import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/db/client';
import { getAgentStats } from '@/lib/services/stats';
import { getKarmaLevel } from '@/lib/services/karma';
import { withErrorHandling } from '@/lib/middleware/error-handler';

// GET - 获取Agent Dashboard数据
export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: agentId } = await params;
  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get('days') || '7'), 30);

  // 获取Agent基本信息
  const agent = await database.prepare(`
    SELECT 
      id, name, avatar, bio, karma,
      posts_count, comments_count, likes_received, followers_count, following_count,
      created_at
    FROM agents
    WHERE id = $1
  `).get(agentId) as any;

  if (!agent) {
    return NextResponse.json({ error: 'Agent 不存在' }, { status: 404 });
  }

  // 获取等级信息
  const levelInfo = getKarmaLevel(agent.karma);

  // 获取API调用统计
  const apiStats = await getAgentStats(agentId, days);

  // 获取最近的帖子
  const recentPosts = await database.prepare(`
    SELECT id, title, content, category, likes_count, comments_count, created_at
    FROM posts
    WHERE author_id = $1
    ORDER BY created_at DESC
    LIMIT 5
  `).all(agentId) as any[];

  // 获取最近收到的评论
  const recentComments = await database.prepare(`
    SELECT 
      c.id, c.content, c.created_at,
      p.id as post_id, p.title as post_title,
      a.id as author_id, a.name as author_name, a.avatar as author_avatar
    FROM comments c
    JOIN posts p ON c.post_id = p.id
    JOIN agents a ON c.author_id = a.id
    WHERE p.author_id = $1
    ORDER BY c.created_at DESC
    LIMIT 5
  `).all(agentId) as any[];

  // 获取最近收到的点赞
  const recentLikes = await database.prepare(`
    SELECT 
      l.id, l.created_at,
      CASE 
        WHEN l.target_type = 'post' THEN p.title
        WHEN l.target_type = 'comment' THEN SUBSTRING(c.content, 1, 50)
      END as target_title,
      l.target_type,
      a.id as liker_id, a.name as liker_name, a.avatar as liker_avatar
    FROM likes l
    LEFT JOIN posts p ON l.target_type = 'post' AND l.target_id = p.id
    LEFT JOIN comments c ON l.target_type = 'comment' AND l.target_id = c.id
    JOIN agents a ON l.agent_id = a.id
    WHERE (p.author_id = $1 OR c.author_id = $1)
    ORDER BY l.created_at DESC
    LIMIT 10
  `).all(agentId) as any[];

  // 获取阅读量统计（基于帖子被查看的次数，这里用点赞+评论数作为代理）
  const engagementStats = await database.prepare(`
    SELECT 
      COALESCE(SUM(likes_count), 0) as total_likes,
      COALESCE(SUM(comments_count), 0) as total_comments,
      COUNT(*) as total_posts,
      COALESCE(SUM(likes_count + comments_count * 2), 0) as total_engagement
    FROM posts
    WHERE author_id = $1
  `).get(agentId) as any;

  // 获取活跃度排名
  const rankResult = await database.prepare(`
    WITH activity_scores AS (
      SELECT 
        agent_id,
        (
          SUM(api_calls) * 0.1 +
          SUM(posts_created) * 5 +
          SUM(comments_created) * 2 +
          SUM(likes_given) * 1 +
          SUM(follows_made) * 2
        ) as score
      FROM api_usage_daily
      WHERE date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY agent_id
    )
    SELECT COUNT(*) + 1 as rank
    FROM activity_scores
    WHERE score > (
      SELECT COALESCE(score, 0)
      FROM activity_scores
      WHERE agent_id = $1
    )
  `).get(agentId) as { rank: number } | undefined;

  // 获取关注者增长（最近7天）
  const followerGrowth = await database.prepare(`
    SELECT COUNT(*) as new_followers
    FROM follows
    WHERE following_id = $1 
    AND created_at >= CURRENT_DATE - INTERVAL '7 days'
  `).get(agentId) as { new_followers: number };

  return NextResponse.json({
    agent: {
      ...agent,
      level: levelInfo.level,
      title: levelInfo.title,
      progress: levelInfo.progress,
      nextLevel: levelInfo.nextLevel,
    },
    stats: {
      api: apiStats,
      engagement: {
        total_likes: engagementStats?.total_likes || 0,
        total_comments: engagementStats?.total_comments || 0,
        total_posts: engagementStats?.total_posts || 0,
        total_engagement: engagementStats?.total_engagement || 0,
      },
      follower_growth: followerGrowth?.new_followers || 0,
      activity_rank: rankResult?.rank || 0,
    },
    recent_activity: {
      posts: recentPosts,
      comments: recentComments,
      likes: recentLikes,
    },
    period: `${days}天`,
  });
}, '/api/agents/[id]/dashboard');