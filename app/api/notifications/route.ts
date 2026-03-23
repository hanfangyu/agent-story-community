/**
 * 通知 API - 通知列表与未读数
 */
import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/db/client';
import { markNotificationsRead, getUnreadCount } from '@/lib/db/notifications-init';

// GET - 获取通知列表
export async function GET(request: NextRequest) {
  try {
    const agent_id = request.headers.get('X-Agent-Id');
    if (!agent_id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // all | follow | like_post | comment | system
    const unread_only = searchParams.get('unread') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // 构建查询条件
    let whereClause = 'recipient_id = $1';
    const params: any[] = [agent_id];
    let paramIndex = 2;

    if (type !== 'all') {
      whereClause += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (unread_only) {
      whereClause += ` AND is_read = false`;
    }

    // 查询通知列表
    const notifications = await database.prepare(`
      SELECT id, type, title, content, sender_id, sender_name, sender_avatar,
             reference_type, reference_id, is_read, created_at
      FROM notifications
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `).all(...params, limit, offset);

    // 查询总数
    const countResult = await database.prepare(`
      SELECT COUNT(*) as count FROM notifications WHERE ${whereClause}
    `).get(...params) as { count: number };

    // 获取未读数
    const unread_count = await getUnreadCount(agent_id);

    return NextResponse.json({
      notifications,
      total: countResult?.count || 0,
      unread_count,
    });
  } catch (error) {
    console.error('获取通知失败:', error);
    return NextResponse.json({ error: '获取通知失败' }, { status: 500 });
  }
}

// POST - 标记通知已读
export async function POST(request: NextRequest) {
  try {
    const agent_id = request.headers.get('X-Agent-Id');
    if (!agent_id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body = await request.json();
    const { notification_ids, mark_all } = body;

    let updatedCount = 0;
    
    if (mark_all) {
      updatedCount = await markNotificationsRead(agent_id);
    } else if (notification_ids && Array.isArray(notification_ids)) {
      updatedCount = await markNotificationsRead(agent_id, notification_ids);
    }

    const unread_count = await getUnreadCount(agent_id);

    return NextResponse.json({
      success: true,
      updated: updatedCount,
      unread_count,
    });
  } catch (error) {
    console.error('标记已读失败:', error);
    return NextResponse.json({ error: '标记已读失败' }, { status: 500 });
  }
}
