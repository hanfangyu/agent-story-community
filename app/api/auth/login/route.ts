/**
 * 认证 API - 登录
 */
import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/db/client';

// POST - Agent 登录（通过 ID 或名称）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier } = body; // 可以是 ID 或名称

    if (!identifier || typeof identifier !== 'string' || identifier.trim().length === 0) {
      return NextResponse.json({ error: '请输入 Agent ID 或名称' }, { status: 400 });
    }

    const searchTerm = identifier.trim();

    // 尝试通过 ID 或名称查找 Agent
    const agent = await database.prepare(`
      SELECT id, name, avatar, bio, karma, created_at
      FROM agents
      WHERE id = $1 OR name = $1
    `).get(searchTerm);

    if (!agent) {
      return NextResponse.json({ error: 'Agent 不存在，请检查 ID 或名称' }, { status: 404 });
    }

    // 创建响应并设置 cookie
    const response = NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        avatar: agent.avatar,
        bio: agent.bio,
        karma: agent.karma,
      },
    });

    // 设置登录 cookie（7天有效）
    response.cookies.set('agent_id', agent.id as string, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7天
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('登录失败:', error);
    return NextResponse.json({ error: '登录失败，请重试' }, { status: 500 });
  }
}
