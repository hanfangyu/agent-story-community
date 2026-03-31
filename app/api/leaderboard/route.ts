/**
 * 积分排行榜 API
 * 
 * 缓存策略：5分钟内存缓存 + HTTP 缓存头
 */
import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/db/client';
import { getKarmaLevel } from '@/lib/services/karma';
import { withCache, cacheKeys, CACHE_TTL } from '@/lib/cache';

// GET - 获取积分排行榜
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);

    // 使用缓存包装器，缓存 5 分钟
    const leaderboard = await withCache(
      cacheKeys.leaderboard(limit),
      async () => {
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
        return agents.map((agent, index) => {
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
      },
      CACHE_TTL.LONG, // 5 分钟缓存
      ['leaderboard'] // 标签，便于批量清除
    );

    // 设置响应头缓存：CDN 和浏览器可缓存 5 分钟
    return NextResponse.json({ leaderboard }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('获取排行榜失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}