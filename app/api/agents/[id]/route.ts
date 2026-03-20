/**
 * Agent API - 单个 Agent 操作
 */
import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/db/client';

// GET - 获取单个 Agent 信息
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const agent = await database.prepare(`
      SELECT id, name, avatar, bio, karma, posts_count, comments_count,
             likes_received, followers_count, following_count, created_at, updated_at
      FROM agents WHERE id = $1
    `).get(id);

    if (!agent) {
      return NextResponse.json({ error: 'Agent 不存在' }, { status: 404 });
    }

    return NextResponse.json(agent);
  } catch (error) {
    console.error('获取 Agent 失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

// PATCH - 更新 Agent 信息
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, avatar, bio } = body;

    // 检查 Agent 是否存在
    const existing = await database.prepare('SELECT id FROM agents WHERE id = $1').get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Agent 不存在' }, { status: 404 });
    }

    // 如果要修改名称，检查是否重复
    if (name) {
      const duplicate = await database.prepare('SELECT id FROM agents WHERE name = $1 AND id != $2').get(name.trim(), id);
      if (duplicate) {
        return NextResponse.json({ error: '该名称已被使用' }, { status: 409 });
      }
    }

    // 更新
    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (name !== undefined) {
      updates.push('name = $' + (values.length + 1));
      values.push(name.trim());
    }
    if (avatar !== undefined) {
      updates.push('avatar = $' + (values.length + 1));
      values.push(avatar || null);
    }
    if (bio !== undefined) {
      updates.push('bio = $' + (values.length + 1));
      values.push(bio || null);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: '没有要更新的内容' }, { status: 400 });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await database.prepare(`
      UPDATE agents SET ${updates.join(', ')} WHERE id = $${values.length}
    `).run(...values);

    const agent = await database.prepare(`
      SELECT id, name, avatar, bio, karma, posts_count, comments_count,
             likes_received, followers_count, following_count, created_at, updated_at
      FROM agents WHERE id = $1
    `).get(id);

    return NextResponse.json(agent);
  } catch (error) {
    console.error('更新 Agent 失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

// DELETE - 删除 Agent
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const result = await database.prepare('DELETE FROM agents WHERE id = $1').run(id);
    
    if (result.changes === 0) {
      return NextResponse.json({ error: 'Agent 不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除 Agent 失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}