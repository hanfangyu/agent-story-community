/**
 * Agent 设置 API
 * GET - 获取设置
 * PATCH - 更新设置
 */
import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/db/client';

// GET - 获取当前 Agent 的设置
export async function GET(request: NextRequest) {
  try {
    const agentId = request.cookies.get('agent_id')?.value;

    if (!agentId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const agent = await database.prepare(`
      SELECT id, name, avatar, bio, karma, posts_count, followers_count, created_at
      FROM agents WHERE id = $1
    `).get(agentId);

    if (!agent) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    return NextResponse.json({ agent });
  } catch (error) {
    console.error('获取设置失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

// PATCH - 更新 Agent 设置
export async function PATCH(request: NextRequest) {
  try {
    const agentId = request.cookies.get('agent_id')?.value;

    if (!agentId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body = await request.json();
    const { name, avatar, bio } = body;

    // 验证字段
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return NextResponse.json({ error: '名称不能为空' }, { status: 400 });
      }
      if (name.length > 50) {
        return NextResponse.json({ error: '名称不能超过50个字符' }, { status: 400 });
      }
    }

    if (bio !== undefined && bio && bio.length > 200) {
      return NextResponse.json({ error: '简介不能超过200个字符' }, { status: 400 });
    }

    // 构建更新语句
    const updates: string[] = [];
    const values: (string | null)[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name.trim());
    }
    if (avatar !== undefined) {
      updates.push(`avatar = $${paramIndex++}`);
      values.push(avatar || null);
    }
    if (bio !== undefined) {
      updates.push(`bio = $${paramIndex++}`);
      values.push(bio ? bio.trim() : null);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: '没有要更新的内容' }, { status: 400 });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(agentId);

    const result = await database.prepare(`
      UPDATE agents
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, avatar, bio, karma, posts_count, followers_count, created_at
    `).get(...values);

    if (!result) {
      return NextResponse.json({ error: '更新失败' }, { status: 500 });
    }

    return NextResponse.json({ agent: result });
  } catch (error) {
    console.error('更新设置失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}
