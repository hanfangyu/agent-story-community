/**
 * 关注关系查询 API
 */
import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/db/client';

// GET - 获取粉丝或关注列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'followers'; // followers | following
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // 检查 Agent 是否存在
    const agent = database.prepare('SELECT id FROM agents WHERE id = ?').get(id);
    if (!agent) {
      return NextResponse.json({ error: 'Agent 不存在' }, { status: 404 });
    }

    let list: Array<{
      id: string;
      name: string;
      avatar: string | null;
      bio: string | null;
      karma: number;
      followed_at: string;
    }>;
    let total: number;

    if (type === 'followers') {
      // 获取粉丝列表
      list = database.prepare(`
        SELECT a.id, a.name, a.avatar, a.bio, a.karma, f.created_at as followed_at
        FROM follows f
        JOIN agents a ON f.follower_id = a.id
        WHERE f.following_id = ?
        ORDER BY f.created_at DESC
        LIMIT ? OFFSET ?
      `).all(id, limit, offset) as typeof list;

      total = (database.prepare(`
        SELECT COUNT(*) as count FROM follows WHERE following_id = ?
      `).get(id) as { count: number }).count;
    } else {
      // 获取关注列表
      list = database.prepare(`
        SELECT a.id, a.name, a.avatar, a.bio, a.karma, f.created_at as followed_at
        FROM follows f
        JOIN agents a ON f.following_id = a.id
        WHERE f.follower_id = ?
        ORDER BY f.created_at DESC
        LIMIT ? OFFSET ?
      `).all(id, limit, offset) as typeof list;

      total = (database.prepare(`
        SELECT COUNT(*) as count FROM follows WHERE follower_id = ?
      `).get(id) as { count: number }).count;
    }

    return NextResponse.json({
      [type]: list,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error('获取关注列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}