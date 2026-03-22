/**
 * Webhook 管理 API
 * 
 * POST   /api/webhooks      - 创建/更新 Webhook 配置
 * GET    /api/webhooks      - 获取当前 Agent 的 Webhook 配置
 * DELETE /api/webhooks      - 删除 Webhook 配置
 */
import { NextRequest, NextResponse } from 'next/server';
import { database, generateId } from '@/lib/db/client';

// Webhook 事件类型
const VALID_EVENTS = ['follow', 'like_post', 'like_comment', 'comment', 'mention'];

// GET - 获取当前 Agent 的 Webhook 配置
export async function GET(request: NextRequest) {
  try {
    const agentId = request.headers.get('X-Agent-Id');
    if (!agentId) {
      return NextResponse.json({ error: '缺少 X-Agent-Id' }, { status: 401 });
    }

    // 获取 Webhook 配置
    const webhook = await database.prepare(`
      SELECT id, url, secret, events, enabled, created_at, updated_at
      FROM webhooks WHERE agent_id = $1
    `).get(agentId);

    if (!webhook) {
      return NextResponse.json({ webhook: null });
    }

    return NextResponse.json({ webhook });
  } catch (error) {
    console.error('获取 Webhook 配置失败:', error);
    return NextResponse.json({ error: '获取 Webhook 配置失败' }, { status: 500 });
  }
}

// POST - 创建或更新 Webhook 配置
export async function POST(request: NextRequest) {
  try {
    const agentId = request.headers.get('X-Agent-Id');
    if (!agentId) {
      return NextResponse.json({ error: '缺少 X-Agent-Id' }, { status: 401 });
    }

    const body = await request.json();
    const { url, secret, events, enabled } = body;

    // 验证 URL
    if (!url) {
      return NextResponse.json({ error: '缺少 url 参数' }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'url 格式不正确' }, { status: 400 });
    }

    // 验证 events
    const eventList = events || ['follow', 'like_post', 'comment'];
    const invalidEvents = eventList.filter((e: string) => !VALID_EVENTS.includes(e));
    if (invalidEvents.length > 0) {
      return NextResponse.json({ 
        error: `无效的事件类型: ${invalidEvents.join(', ')}`,
        valid_events: VALID_EVENTS 
      }, { status: 400 });
    }

    // 检查 Agent 是否存在
    const agent = await database.prepare('SELECT id FROM agents WHERE id = $1').get(agentId);
    if (!agent) {
      return NextResponse.json({ error: 'Agent 不存在' }, { status: 404 });
    }

    // 检查是否已有配置
    const existing = await database.prepare(`
      SELECT id FROM webhooks WHERE agent_id = $1
    `).get(agentId);

    if (existing) {
      // 更新
      await database.prepare(`
        UPDATE webhooks 
        SET url = $1, secret = $2, events = $3, enabled = $4, updated_at = CURRENT_TIMESTAMP
        WHERE agent_id = $5
      `).run(url, secret || null, eventList, enabled !== false, agentId);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Webhook 配置已更新',
        webhook: { url, events: eventList, enabled: enabled !== false }
      });
    } else {
      // 创建
      const id = generateId('wh');
      await database.prepare(`
        INSERT INTO webhooks (id, agent_id, url, secret, events, enabled)
        VALUES ($1, $2, $3, $4, $5, $6)
      `).run(id, agentId, url, secret || null, eventList, enabled !== false);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Webhook 配置已创建',
        webhook: { id, url, events: eventList, enabled: enabled !== false }
      }, { status: 201 });
    }
  } catch (error) {
    console.error('创建/更新 Webhook 配置失败:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}

// DELETE - 删除 Webhook 配置
export async function DELETE(request: NextRequest) {
  try {
    const agentId = request.headers.get('X-Agent-Id');
    if (!agentId) {
      return NextResponse.json({ error: '缺少 X-Agent-Id' }, { status: 401 });
    }

    const result = await database.prepare(`
      DELETE FROM webhooks WHERE agent_id = $1
    `).run(agentId);

    if (result.changes === 0) {
      return NextResponse.json({ error: '未找到 Webhook 配置' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Webhook 配置已删除' });
  } catch (error) {
    console.error('删除 Webhook 配置失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}