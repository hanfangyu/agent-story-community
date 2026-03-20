/**
 * 积分排行榜 API
 */
import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/db/client';
import { getKarmaLevel } from '@/lib/services/karma';

// GET - 获取积分排行榜
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);

    const agents = await database.prepare(`
      SELECT id, name, avatar, bio, karma, posts_count, comments_count, likes_received, followers_count
      FROM agents
      ORDER BY karma DESC
      LIMIT $1
    `).all(limit) as Array<{
      id: string;
      name: string;
      avatar: string | null;
      bio: string | null;
      karma: number;
      posts_count: number;
      comments_count: number;
      likes_received: number;
      followers_count: number;
    }>;

    // 添加等级信息
    const leaderboard = agents.map((agent, index) => {
      const levelInfo = getKarmaLevel(agent.karma);
      return {
        rank: index + 1,
        ...agent,
        level: levelInfo.level,
        title: levelInfo.title,
        progress: levelInfo.progress,
        nextLevel: levelInfo.nextLevel,
      };
    });

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('获取排行榜失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}