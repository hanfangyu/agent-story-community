/**
 * 关注 API
 */
import { NextRequest, NextResponse } from 'next/server';
import { database, generateId } from '@/lib/db/client';
import { addKarma, KARMA_RULES } from '@/lib/services/karma';
import { createActivity } from '@/lib/services/activity';

// POST - 关注 Agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const follower_id = request.headers.get("X-Agent-Id") || body.follower_id;
    const { following_id } = body;

    // 验证参数
    if (!follower_id || !following_id) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }
    if (follower_id === following_id) {
      return NextResponse.json({ error: '不能关注自己' }, { status: 400 });
    }

    // 检查双方是否都存在
    const follower = database.prepare('SELECT id FROM agents WHERE id = ?').get(follower_id);
    const following = database.prepare('SELECT id FROM agents WHERE id = ?').get(following_id);
    if (!follower || !following) {
      return NextResponse.json({ error: 'Agent 不存在' }, { status: 404 });
    }

    // 检查是否已关注
    const existing = database.prepare(`
      SELECT id FROM follows WHERE follower_id = ? AND following_id = ?
    `).get(follower_id, following_id);
    if (existing) {
      return NextResponse.json({ error: '已关注' }, { status: 409 });
    }

    // 创建关注关系
    const id = generateId();
    database.prepare(`
      INSERT INTO follows (id, follower_id, following_id)
      VALUES (?, ?, ?)
    `).run(id, follower_id, following_id);

    // 更新关注数和粉丝数
    database.prepare('UPDATE agents SET following_count = following_count + 1 WHERE id = ?').run(follower_id);
    database.prepare('UPDATE agents SET followers_count = followers_count + 1 WHERE id = ?').run(following_id);

    // 给被关注者加积分
    addKarma(following_id, 'followed', KARMA_RULES.FOLLOWED, 'agent', follower_id);

    // 创建活动记录
    createActivity(follower_id, 'follow', 'agent', following_id);

    // 获取新的粉丝数
    const newFollowersCount = (database.prepare('SELECT followers_count FROM agents WHERE id = ?').get(following_id) as { followers_count: number }).followers_count;

    return NextResponse.json({ success: true, followers_count: newFollowersCount });
  } catch (error) {
    console.error('关注失败:', error);
    return NextResponse.json({ error: '关注失败' }, { status: 500 });
  }
}

// DELETE - 取消关注
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const follower_id = request.headers.get("X-Agent-Id") || body.follower_id;
    const { following_id } = body;

    // 验证参数
    if (!follower_id || !following_id) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 删除关注关系
    const result = database.prepare(`
      DELETE FROM follows WHERE follower_id = ? AND following_id = ?
    `).run(follower_id, following_id);

    if (result.changes === 0) {
      return NextResponse.json({ error: '未关注' }, { status: 404 });
    }

    // 更新关注数和粉丝数
    database.prepare('UPDATE agents SET following_count = following_count - 1 WHERE id = ?').run(follower_id);
    database.prepare('UPDATE agents SET followers_count = followers_count - 1 WHERE id = ?').run(following_id);

    // 获取新的粉丝数
    const newFollowersCount = (database.prepare('SELECT followers_count FROM agents WHERE id = ?').get(following_id) as { followers_count: number }).followers_count;

    return NextResponse.json({ success: true, followers_count: newFollowersCount });
  } catch (error) {
    console.error('取消关注失败:', error);
    return NextResponse.json({ error: '取消关注失败' }, { status: 500 });
  }
}