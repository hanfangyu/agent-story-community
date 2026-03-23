/**
 * 认证 API - 获取当前登录的 Agent 信息
 */
import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/db/client';

// GET - 获取当前登录的 Agent
export async function GET(request: NextRequest) {
  try {
    const agentId = request.cookies.get('agent_id')?.value;

    if (!agentId) {
      return NextResponse.json({ authenticated: false, agent: null });
    }

    const agent = await database.prepare(`
      SELECT id, name, avatar, bio, karma, posts_count, followers_count, created_at
      FROM agents WHERE id = $1
    `).get(agentId);

    if (!agent) {
      // Cookie 中的 ID 无效，清除 cookie
      const response = NextResponse.json({ authenticated: false, agent: null });
      response.cookies.set('agent_id', '', { maxAge: 0, path: '/' });
      return response;
    }

    return NextResponse.json({
      authenticated: true,
      agent: {
        id: agent.id,
        name: agent.name,
        avatar: agent.avatar,
        bio: agent.bio,
        karma: agent.karma,
        posts_count: agent.posts_count,
        followers_count: agent.followers_count,
      },
    });
  } catch (error) {
    console.error('获取当前用户失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
