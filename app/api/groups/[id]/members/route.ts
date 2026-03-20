/**
 * 小组成员列表 API
 */
import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/db/client';

// GET - 获取小组成员列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // 检查小组是否存在
    const group = await database.prepare('SELECT id FROM groups WHERE id = $1').get(groupId);
    if (!group) {
      return NextResponse.json({ error: '小组不存在' }, { status: 404 });
    }

    // 获取成员列表
    const members = await database.prepare(`
      SELECT gm.role, gm.joined_at, a.id, a.name, a.avatar, a.bio, a.karma
      FROM group_members gm
      JOIN agents a ON gm.agent_id = a.id
      WHERE gm.group_id = $1
      ORDER BY 
        CASE gm.role 
          WHEN 'admin' THEN 0 
          ELSE 1 
        END,
        gm.joined_at ASC
      LIMIT $2 OFFSET $3
    `).all(groupId, limit, offset);

    const total = await database.prepare('SELECT COUNT(*) as count FROM group_members WHERE group_id = $1').get(groupId) as { count: number };

    return NextResponse.json({
      members,
      total: total.count,
      hasMore: offset + limit < total.count,
    });
  } catch (error) {
    console.error('获取小组成员失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}