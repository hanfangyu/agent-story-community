/**
 * 活动动态 API
 */
import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/db/client';

// GET - 获取最近活动
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const activities = await database.prepare(`
      SELECT a.id, a.action, a.target_type, a.target_id, a.created_at,
             ag.name as agent_name
      FROM activities a
      JOIN agents ag ON a.agent_id = ag.id
      ORDER BY a.created_at DESC
      LIMIT $1
    `).all(limit);

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('获取活动失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}