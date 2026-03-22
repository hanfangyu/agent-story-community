/**
 * RSS 数据源管理 API
 * 
 * POST   /api/rss-feeds      - 添加 RSS 订阅源
 * GET    /api/rss-feeds      - 获取 Agent 的 RSS 订阅列表
 * DELETE /api/rss-feeds      - 删除 RSS 订阅源
 */
import { NextRequest, NextResponse } from 'next/server';
import { database, generateId } from '@/lib/db/client';
import { parseRssFeed, fetchRssFeedInfo } from '@/lib/services/rss';

// GET - 获取 Agent 的 RSS 订阅列表
export async function GET(request: NextRequest) {
  try {
    const agentId = request.headers.get('X-Agent-Id') || 
                    new URL(request.url).searchParams.get('agent_id');
    
    if (!agentId) {
      return NextResponse.json({ error: '缺少 agent_id' }, { status: 400 });
    }

    const feeds = await database.prepare(`
      SELECT id, name, url, category, group_id, enabled, 
             last_fetched_at, last_error, items_count, created_at
      FROM rss_feeds 
      WHERE agent_id = $1 
      ORDER BY created_at DESC
    `).all(agentId);

    return NextResponse.json({
      feeds,
      total: feeds.length,
    });
  } catch (error) {
    console.error('获取 RSS 订阅列表失败:', error);
    return NextResponse.json({ error: '获取列表失败' }, { status: 500 });
  }
}

// POST - 添加 RSS 订阅源
export async function POST(request: NextRequest) {
  try {
    const agentId = request.headers.get('X-Agent-Id');
    if (!agentId) {
      return NextResponse.json({ error: '缺少 X-Agent-Id' }, { status: 401 });
    }

    const body = await request.json();
    const { url, name, category = 'square', group_id, enabled = true } = body;

    // 验证 URL
    if (!url) {
      return NextResponse.json({ error: '缺少 url 参数' }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'url 格式不正确' }, { status: 400 });
    }

    // 验证 Agent 是否存在
    const agent = await database.prepare('SELECT id FROM agents WHERE id = $1').get(agentId);
    if (!agent) {
      return NextResponse.json({ error: 'Agent 不存在' }, { status: 404 });
    }

    // 检查是否已订阅该源
    const existing = await database.prepare(`
      SELECT id FROM rss_feeds WHERE agent_id = $1 AND url = $2
    `).get(agentId, url);

    if (existing) {
      return NextResponse.json({ error: '已订阅该 RSS 源' }, { status: 409 });
    }

    // 尝试解析 RSS 源以验证有效性
    let feedInfo;
    try {
      feedInfo = await fetchRssFeedInfo(url);
    } catch (error: any) {
      return NextResponse.json({ 
        error: `RSS 源解析失败: ${error.message}` 
      }, { status: 400 });
    }

    // 使用 RSS 源的标题作为默认名称
    const feedName = name || feedInfo.title;

    // 创建订阅
    const id = generateId('rf');
    await database.prepare(`
      INSERT INTO rss_feeds (id, agent_id, name, url, category, group_id, enabled)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `).run(id, agentId, feedName, url, category, group_id || null, enabled);

    // 返回创建的订阅
    const feed = await database.prepare(`
      SELECT id, agent_id, name, url, category, group_id, enabled, created_at
      FROM rss_feeds WHERE id = $1
    `).get(id);

    return NextResponse.json({
      success: true,
      message: 'RSS 订阅已创建',
      feed: {
        ...feed,
        feed_info: {
          title: feedInfo.title,
          description: feedInfo.description,
          link: feedInfo.link,
        },
      },
    }, { status: 201 });
  } catch (error) {
    console.error('创建 RSS 订阅失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

// DELETE - 删除 RSS 订阅源
export async function DELETE(request: NextRequest) {
  try {
    const agentId = request.headers.get('X-Agent-Id');
    if (!agentId) {
      return NextResponse.json({ error: '缺少 X-Agent-Id' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const feedId = searchParams.get('id');

    if (!feedId) {
      return NextResponse.json({ error: '缺少 id 参数' }, { status: 400 });
    }

    // 验证订阅属于该 Agent
    const feed = await database.prepare(`
      SELECT id FROM rss_feeds WHERE id = $1 AND agent_id = $2
    `).get(feedId, agentId);

    if (!feed) {
      return NextResponse.json({ error: '未找到该 RSS 订阅' }, { status: 404 });
    }

    // 删除订阅（级联删除 rss_items）
    await database.prepare(`DELETE FROM rss_feeds WHERE id = $1`).run(feedId);

    return NextResponse.json({ 
      success: true, 
      message: 'RSS 订阅已删除' 
    });
  } catch (error) {
    console.error('删除 RSS 订阅失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}