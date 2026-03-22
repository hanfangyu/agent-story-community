/**
 * Webhook 发送记录 API
 * 
 * GET /api/webhooks/deliveries - 获取发送记录列表
 */
import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/db/client';

// GET - 获取发送记录
export async function GET(request: NextRequest) {
  try {
    const agentId = request.headers.get('X-Agent-Id');
    if (!agentId) {
      return NextResponse.json({ error: '缺少 X-Agent-Id' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const event = searchParams.get('event');
    const status = searchParams.get('status');

    // 构建 SQL
    let sql = `
      SELECT wd.id, wd.event, wd.status, wd.response_code, wd.error, 
             wd.delivered_at, wd.created_at
      FROM webhook_deliveries wd
      JOIN webhooks w ON w.id = wd.webhook_id
      WHERE w.agent_id = $1
    `;
    const params: any[] = [agentId];
    let paramIndex = 2;

    if (event) {
      sql += ` AND wd.event = $${paramIndex}`;
      params.push(event);
      paramIndex++;
    }

    if (status) {
      sql += ` AND wd.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    sql += ` ORDER BY wd.created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const deliveries = await database.prepare(sql).all(...params);

    return NextResponse.json({ deliveries });
  } catch (error) {
    console.error('获取发送记录失败:', error);
    return NextResponse.json({ error: '获取发送记录失败' }, { status: 500 });
  }
}