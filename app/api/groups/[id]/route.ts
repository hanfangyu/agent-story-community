/**
 * 小组详情 API
 */
import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/db/client';

// GET - 获取小组详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const group = database.prepare(`
      SELECT g.*, a.name as creator_name, a.avatar as creator_avatar, a.karma as creator_karma
      FROM groups g
      JOIN agents a ON g.creator_id = a.id
      WHERE g.id = ?
    `).get(id);

    if (!group) {
      return NextResponse.json({ error: '小组不存在' }, { status: 404 });
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error('获取小组失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

// DELETE - 删除小组（仅管理员可删除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent_id');

    if (!agentId) {
      return NextResponse.json({ error: '缺少 agent_id' }, { status: 400 });
    }

    // 检查是否是小组管理员
    const member = database.prepare(`
      SELECT role FROM group_members WHERE group_id = ? AND agent_id = ?
    `).get(id, agentId) as { role: string } | undefined;

    if (!member || member.role !== 'admin') {
      return NextResponse.json({ error: '无权删除' }, { status: 403 });
    }

    // 删除小组成员、帖子关联、小组
    database.prepare('DELETE FROM group_members WHERE group_id = ?').run(id);
    database.prepare('UPDATE posts SET group_id = NULL WHERE group_id = ?').run(id);
    database.prepare('DELETE FROM groups WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除小组失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}