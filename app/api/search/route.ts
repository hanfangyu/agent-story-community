/**
 * 搜索 API - 统一搜索 Agent 和帖子
 * 
 * 支持搜索类型：
 * - agents: 按名称、简介搜索
 * - posts: 按标题、内容搜索
 * - all: 同时搜索两种类型
 * 
 * 缓存策略：30秒内存缓存
 */
import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/db/client';
import { withCache, CACHE_TTL } from '@/lib/cache';

// GET - 搜索
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const type = searchParams.get('type') || 'all'; // agents | posts | all
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!query || query.length < 1) {
      return NextResponse.json({ 
        agents: [], 
        posts: [], 
        total: 0,
        query: '' 
      });
    }

    // 使用缓存（仅对第一页）
    const shouldCache = offset === 0;

    const fetchData = async () => {
      const searchPattern = `%${query}%`;
      const results: {
        agents: unknown[];
        posts: unknown[];
        total: number;
      } = {
        agents: [],
        posts: [],
        total: 0,
      };

      // 并行搜索
      const [agents, posts] = await Promise.all([
        // 搜索 Agents
        (type === 'all' || type === 'agents') 
          ? database.prepare(`
              SELECT id, name, avatar, bio, karma, 
                     posts_count, followers_count, created_at
              FROM agents
              WHERE name ILIKE $1 OR bio ILIKE $1
              ORDER BY karma DESC, created_at DESC
              LIMIT $2 OFFSET $3
            `).all(searchPattern, limit, offset)
          : Promise.resolve([]),
        
        // 搜索 Posts
        (type === 'all' || type === 'posts')
          ? database.prepare(`
              SELECT p.id, p.title, p.content, p.category, p.likes_count, 
                     p.comments_count, p.created_at,
                     a.id as author_id, a.name as author_name, a.avatar as author_avatar
              FROM posts p
              JOIN agents a ON p.author_id = a.id
              WHERE p.title ILIKE $1 OR p.content ILIKE $1
              ORDER BY p.likes_count DESC, p.created_at DESC
              LIMIT $2 OFFSET $3
            `).all(searchPattern, limit, offset)
          : Promise.resolve([]),
      ]);

      results.agents = agents;
      results.posts = posts;
      results.total = agents.length + posts.length;

      return results;
    };

    let result;
    if (shouldCache) {
      result = await withCache(
        `search:${type}:${query}:${limit}`,
        fetchData,
        CACHE_TTL.SHORT, // 30秒缓存
        ['search']
      );
    } else {
      result = await fetchData();
    }

    return NextResponse.json({
      ...result,
      query,
      type,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=10',
      },
    });
  } catch (error) {
    console.error('搜索失败:', error);
    return NextResponse.json({ error: '搜索失败' }, { status: 500 });
  }
}