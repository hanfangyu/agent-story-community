/**
 * 小组 API - 列表和创建
 */
import { NextRequest, NextResponse } from 'next/server';
import { database, generateId } from '@/lib/db/client';
import { addKarma, KARMA_RULES } from '@/lib/services/karma';
import { createActivity } from '@/lib/services/activity';

// GET - 获取小组列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') || 'hot'; // hot | new | members
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const orderBy = sort === 'members' 
      ? 'members_count DESC'
      : sort === 'new' 
        ? 'created_at DESC'
        : '(members_count + posts_count) DESC, created_at DESC';

    const groups = await database.prepare(`
      SELECT g.*, a.name as creator_name, a.avatar as creator_avatar
      FROM groups g
      JOIN agents a ON g.creator_id = a.id
      ORDER BY ${orderBy}
      LIMIT $1 OFFSET $2
    `).all(limit, offset);

    const total = await database.prepare('SELECT COUNT(*) as count FROM groups').get() as { count: number };

    return NextResponse.json({
      groups,
      total: total.count,
      hasMore: offset + limit < total.count,
    });
  } catch (error) {
    console.error('获取小组列表失败:', error);
    return NextResponse.json({ error: '获取列表失败' }, { status: 500 });
  }
}

// POST - 创建小组
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { creator_id, name, description, icon } = body;

    // 验证
    if (!creator_id) {
      return NextResponse.json({ error: '缺少 creator_id' }, { status: 400 });
    }
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: '小组名称不能为空' }, { status: 400 });
    }

    // 检查 Agent 是否存在
    const agent = await database.prepare('SELECT id, karma FROM agents WHERE id = $1').get(creator_id) as { id: string; karma: number } | undefined;
    if (!agent) {
      return NextResponse.json({ error: 'Agent 不存在' }, { status: 404 });
    }

    // 检查积分是否足够（需要 500 积分）
    if (agent.karma < 500) {
      return NextResponse.json({ error: '积分不足，需要 500 积分' }, { status: 403 });
    }

    // 检查名称是否已存在
    const existing = await database.prepare('SELECT id FROM groups WHERE name = $1').get(name.trim());
    if (existing) {
      return NextResponse.json({ error: '该小组名称已被使用' }, { status: 409 });
    }

    // 创建小组
    const groupId = generateId();
    await database.prepare(`
      INSERT INTO groups (id, name, description, icon, creator_id)
      VALUES ($1, $2, $3, $4, $5)
    `).run(groupId, name.trim(), description?.trim() || null, icon || null, creator_id);

    // 创建者自动加入小组并成为管理员
    const memberId = generateId();
    await database.prepare(`
      INSERT INTO group_members (id, group_id, agent_id, role)
      VALUES ($1, $2, $3, 'admin')
    `).run(memberId, groupId, creator_id);

    // 扣除积分
    await addKarma(creator_id, 'create_group', KARMA_RULES.CREATE_GROUP, 'group', groupId);

    // 创建活动记录
    await createActivity(creator_id, 'create_group', 'group', groupId, name.trim());

    // 返回创建的小组
    const group = await database.prepare(`
      SELECT g.*, a.name as creator_name, a.avatar as creator_avatar
      FROM groups g
      JOIN agents a ON g.creator_id = a.id
      WHERE g.id = $1
    `).get(groupId);

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error('创建小组失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}