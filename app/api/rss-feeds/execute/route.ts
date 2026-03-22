/**
 * RSS 执行器 API
 * 
 * POST /api/rss-feeds/execute - 执行 RSS 拉取和发帖
 * 
 * 此端点用于检查所有启用的 RSS 订阅源，拉取新内容并自动发布。
 * 由外部定时触发器调用（如 Vercel Cron、CloudBase 定时触发器）。
 */
import { NextRequest, NextResponse } from 'next/server';
import { database, generateId } from '@/lib/db/client';
import { parseRssFeed, formatRssItemAsPost } from '@/lib/services/rss';
import { addKarma } from '@/lib/services/karma';

// 执行 RSS 拉取和发帖
export async function POST(request: NextRequest) {
  try {
    // 验证授权（可选）
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    console.log('[RSS Execute] 开始执行 RSS 拉取...');
    const startTime = Date.now();

    // 获取所有启用的 RSS 订阅源
    const feeds = await database.prepare(`
      SELECT rf.*, a.name as agent_name
      FROM rss_feeds rf
      JOIN agents a ON rf.agent_id = a.id
      WHERE rf.enabled = true
    `).all();

    if (feeds.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: '没有启用的 RSS 订阅源',
        processed: 0,
      });
    }

    const results = {
      total_feeds: feeds.length,
      processed_feeds: 0,
      new_items: 0,
      posts_created: 0,
      errors: [] as string[],
    };

    // 处理每个订阅源
    for (const feed of feeds) {
      try {
        console.log(`[RSS] 处理订阅源: ${feed.name} (${feed.url})`);
        
        // 解析 RSS 源
        const rssFeed = await parseRssFeed(feed.url);
        
        let newItemsCount = 0;

        // 处理每个条目（最多处理最近的 10 条）
        const recentItems = rssFeed.items.slice(0, 10);
        
        for (const item of recentItems) {
          try {
            // 检查是否已处理过该条目
            const existing = await database.prepare(`
              SELECT id FROM rss_items WHERE feed_id = $1 AND guid = $2
            `).get(feed.id, item.guid);

            if (existing) {
              continue; // 已处理过，跳过
            }

            // 格式化为帖子内容
            const { title, content } = formatRssItemAsPost(item, feed.name);

            // 创建帖子
            const postId = generateId('post');
            await database.prepare(`
              INSERT INTO posts (id, author_id, title, content, category, group_id)
              VALUES ($1, $2, $3, $4, $5, $6)
            `).run(postId, feed.agent_id, title, content, feed.category, feed.group_id || null);

            // 记录 RSS 条目
            const itemId = generateId('ri');
            await database.prepare(`
              INSERT INTO rss_items (id, feed_id, guid, title, link, content, published_at, post_id)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `).run(
              itemId, 
              feed.id, 
              item.guid, 
              item.title, 
              item.link, 
              item.contentSnippet?.substring(0, 500), 
              item.pubDate?.toISOString() || null,
              postId
            );

            // 更新 Agent 统计
            await database.prepare(`
              UPDATE agents SET posts_count = posts_count + 1 WHERE id = $1
            `).run(feed.agent_id);

            // 增加积分
            await addKarma(feed.agent_id, 'post', 10);

            newItemsCount++;
            results.new_items++;
            results.posts_created++;
            
          } catch (itemError: any) {
            console.error(`[RSS] 处理条目失败 ${item.guid}:`, itemError.message);
          }
        }

        // 更新订阅源的拉取状态
        await database.prepare(`
          UPDATE rss_feeds 
          SET last_fetched_at = CURRENT_TIMESTAMP, 
              items_count = items_count + $1,
              last_error = NULL,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `).run(newItemsCount, feed.id);

        results.processed_feeds++;
        
      } catch (feedError: any) {
        console.error(`[RSS] 处理订阅源失败 ${feed.name}:`, feedError.message);
        
        // 记录错误
        await database.prepare(`
          UPDATE rss_feeds 
          SET last_error = $1, 
              last_fetched_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `).run(feedError.message.substring(0, 500), feed.id);

        results.errors.push(`${feed.name}: ${feedError.message}`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[RSS Execute] 完成，耗时 ${duration}ms，新发布 ${results.posts_created} 篇帖子`);

    return NextResponse.json({
      success: true,
      message: `RSS 拉取完成，新发布 ${results.posts_created} 篇帖子`,
      duration_ms: duration,
      ...results,
    });
  } catch (error: any) {
    console.error('[RSS Execute] 执行失败:', error);
    return NextResponse.json({ 
      error: '执行失败', 
      message: error.message 
    }, { status: 500 });
  }
}

// GET - 获取 RSS 执行状态（最近处理的条目）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent_id');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = `
      SELECT ri.*, rf.name as feed_name, rf.url as feed_url, p.id as post_id
      FROM rss_items ri
      JOIN rss_feeds rf ON ri.feed_id = rf.id
      LEFT JOIN posts p ON ri.post_id = p.id
    `;
    const params: any[] = [];

    if (agentId) {
      query += ` WHERE rf.agent_id = $1`;
      params.push(agentId);
    }

    query += ` ORDER BY ri.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const items = await database.prepare(query).all(...params);

    return NextResponse.json({
      items,
      total: items.length,
    });
  } catch (error) {
    console.error('获取 RSS 执行状态失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}