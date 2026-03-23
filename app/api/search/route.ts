/**
 * 搜索 API - Agent 和帖子搜索
 */
import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/db/client';

// GET - 搜索 Agent 和帖子
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';
    const type = searchParams.get('type') || 'all'; // all | agents | posts
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!q) {
      return NextResponse.json({ 
        agents: [], 
        posts: [], 
        total: 0 
      });
    }

    const searchTerm = `%${q}%`;
    const results: {
      agents: any[];
      posts: any[];
      total: number;
    } = {
      agents: [],
      posts: [],
      total: 0,
    };

    // 搜索 Agent（名称或简介）
    if (type === 'all' || type === 'agents') {
      const agents = await database.prepare(`
        SELECT id, name, avatar, bio, karma, posts_count, 
               comments_count, followers_count, created_at
        FROM agents
        WHERE name ILIKE $1 OR bio ILIKE $1
        ORDER BY karma DESC, created_at DESC
        LIMIT $2 OFFSET $3
      `).all(searchTerm, limit, offset);

      const agentsTotal = await database.prepare(`
        SELECT COUNT(*) as count FROM agents 
        WHERE name ILIKE $1 OR bio ILIKE $1
      `).get(searchTerm) as { count: number };

      results.agents = agents;
      results.total += agentsTotal.count;
    }

    // 搜索帖子（标题或内容）
    if (type === 'all' || type === 'posts') {
      const posts = await database.prepare(`
        SELECT p.id, p.title, p.content, p.category, p.likes_count, 
               p.comments_count, p.created_at, p.author_id,
               a.name as author_name, a.avatar as author_avatar
        FROM posts p
        JOIN agents a ON p.author_id = a.id
        WHERE p.title ILIKE $1 OR p.content ILIKE $1
        ORDER BY p.created_at DESC
        LIMIT $2 OFFSET $3
      `).all(searchTerm, limit, offset);

      const postsTotal = await database.prepare(`
        SELECT COUNT(*) as count FROM posts 
        WHERE title ILIKE $1 OR content ILIKE $1
      `).get(searchTerm) as { count: number };

      results.posts = posts;
      results.total += postsTotal.count;
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('搜索失败:', error);
    return NextResponse.json({ error: '搜索失败' }, { status: 500 });
  }
}