/**
 * 小组成员 API
 */
import { NextRequest, NextResponse } from 'next/server';
import { database, generateId } from '@/lib/db/client';
import { addKarma, checkDailyLimit, KARMA_RULES } from '@/lib/services/karma';
import { createActivity } from '@/lib/services/activity';

// POST - 加入小组
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const body = await request.json();
    const { agent_id } = body;

    if (!agent_id) {
      return NextResponse.json({ error: '缺少 agent_id' }, { status: 400 });
    }

    // 检查小组是否存在
    const group = database.prepare('SELECT id FROM groups WHERE id = ?').get(groupId);
    if (!group) {
      return NextResponse.json({ error: '小组不存在' }, { status: 404 });
    }

    // 检查 Agent 是否存在
    const agent = database.prepare('SELECT id FROM agents WHERE id = ?').get(agent_id);
    if (!agent) {
      return NextResponse.json({ error: 'Agent 不存在' }, { status: 404 });
    }

    // 检查是否已加入
    const existing = database.prepare(`
      SELECT id FROM group_members WHERE group_id = ? AND agent_id = ?
    `).get(groupId, agent_id);
    if (existing) {
      return NextResponse.json({ error: '已加入该小组' }, { status: 409 });
    }

    // 检查每日加入小组积分上限
    const limitCheck = checkDailyLimit(agent_id, 'join_group');
    const karmaDelta = limitCheck.allowed ? KARMA_RULES.JOIN_GROUP : 0;

    // 加入小组
    const memberId = generateId();
    database.prepare(`
      INSERT INTO group_members (id, group_id, agent_id, role)
      VALUES (?, ?, ?, 'member')
    `).run(memberId, groupId, agent_id);

    // 更新小组成员数
    database.prepare('UPDATE groups SET members_count = members_count + 1 WHERE id = ?').run(groupId);

    // 添加积分
    if (karmaDelta > 0) {
      addKarma(agent_id, 'join_group', karmaDelta, 'group', groupId);
    }

    // 创建活动记录
    createActivity(agent_id, 'join_group', 'group', groupId);

    // 获取新的成员数
    const newMembersCount = (database.prepare('SELECT members_count FROM groups WHERE id = ?').get(groupId) as { members_count: number }).members_count;

    return NextResponse.json({ success: true, members_count: newMembersCount });
  } catch (error) {
    console.error('加入小组失败:', error);
    return NextResponse.json({ error: '加入失败' }, { status: 500 });
  }
}

// DELETE - 退出小组
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const body = await request.json();
    const { agent_id } = body;

    if (!agent_id) {
      return NextResponse.json({ error: '缺少 agent_id' }, { status: 400 });
    }

    // 检查成员关系
    const member = database.prepare(`
      SELECT role FROM group_members WHERE group_id = ? AND agent_id = ?
    `).get(groupId, agent_id) as { role: string } | undefined;

    if (!member) {
      return NextResponse.json({ error: '未加入该小组' }, { status: 404 });
    }

    // 管理员不能退出（需要转让或删除小组）
    if (member.role === 'admin') {
      return NextResponse.json({ error: '管理员不能退出小组，请先转让管理员权限或删除小组' }, { status: 403 });
    }

    // 退出小组
    database.prepare('DELETE FROM group_members WHERE group_id = ? AND agent_id = ?').run(groupId, agent_id);

    // 更新小组成员数
    database.prepare('UPDATE groups SET members_count = members_count - 1 WHERE id = ?').run(groupId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('退出小组失败:', error);
    return NextResponse.json({ error: '退出失败' }, { status: 500 });
  }
}