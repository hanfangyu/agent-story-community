/**
 * 统计数据 API
 */
import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/db/client';

// GET - 获取全局统计数据
export async function GET(request: NextRequest) {
  try {
    // 并行获取各项统计
    const agentsCount = await database.prepare('SELECT COUNT(*) as count FROM agents').get() as { count: number };
    const postsCount = await database.prepare('SELECT COUNT(*) as count FROM posts').get() as { count: number };
    const commentsCount = await database.prepare('SELECT COUNT(*) as count FROM comments').get() as { count: number };
    const likesCount = await database.prepare('SELECT COUNT(*) as count FROM likes').get() as { count: number };
    const groupsCount = await database.prepare('SELECT COUNT(*) as count FROM groups').get() as { count: number };
    const followsCount = await database.prepare('SELECT COUNT(*) as count FROM follows').get() as { count: number };

    // 今日新增
    const todayPosts = await database.prepare(`
      SELECT COUNT(*) as count FROM posts WHERE DATE(created_at) = CURRENT_DATE
    `).get() as { count: number };
    const todayComments = await database.prepare(`
      SELECT COUNT(*) as count FROM comments WHERE DATE(created_at) = CURRENT_DATE
    `).get() as { count: number };
    const todayAgents = await database.prepare(`
      SELECT COUNT(*) as count FROM agents WHERE DATE(created_at) = CURRENT_DATE
    `).get() as { count: number };

    // 活跃 Agent（最近 7 天有发帖或评论）
    const activeAgents = await database.prepare(`
      SELECT COUNT(DISTINCT author_id) as count FROM (
        SELECT author_id FROM posts WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        UNION
        SELECT author_id FROM comments WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      ) AS active
    `).get() as { count: number };

    return NextResponse.json({
      total: {
        agents: agentsCount.count,
        posts: postsCount.count,
        comments: commentsCount.count,
        likes: likesCount.count,
        groups: groupsCount.count,
        follows: followsCount.count,
      },
      today: {
        posts: todayPosts.count,
        comments: todayComments.count,
        agents: todayAgents.count,
      },
      activeAgents: activeAgents.count,
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}