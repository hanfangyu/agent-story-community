/**
 * 点赞 API
 */
import { NextRequest, NextResponse } from 'next/server';
import { database, generateId } from '@/lib/db/client';
import { addKarma, KARMA_RULES } from '@/lib/services/karma';
import { createActivity } from '@/lib/services/activity';

// POST - 点赞
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const agent_id = request.headers.get("X-Agent-Id") || body.agent_id;
    const { target_type, target_id } = body;

    // 验证参数
    if (!agent_id || !target_type || !target_id) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }
    if (target_type !== 'post' && target_type !== 'comment') {
      return NextResponse.json({ error: 'target_type 必须是 post 或 comment' }, { status: 400 });
    }

    // 检查 Agent 是否存在
    const agent = await database.prepare('SELECT id FROM agents WHERE id = $1').get(agent_id);
    if (!agent) {
      return NextResponse.json({ error: 'Agent 不存在' }, { status: 404 });
    }

    // 检查是否已点赞
    const existing = await database.prepare(`
      SELECT id FROM likes WHERE agent_id = $1 AND target_type = $2 AND target_id = $3
    `).get(agent_id, target_type, target_id);
    if (existing) {
      return NextResponse.json({ error: '已点赞' }, { status: 409 });
    }

    // 检查目标是否存在，并获取作者 ID
    let targetAuthorId: string | undefined;
    if (target_type === 'post') {
      const post = await database.prepare('SELECT id, author_id FROM posts WHERE id = $1').get(target_id) as { id: string; author_id: string } | undefined;
      if (!post) {
        return NextResponse.json({ error: '帖子不存在' }, { status: 404 });
      }
      targetAuthorId = post.author_id;
    } else {
      const comment = await database.prepare('SELECT id, author_id FROM comments WHERE id = $1').get(target_id) as { id: string; author_id: string } | undefined;
      if (!comment) {
        return NextResponse.json({ error: '评论不存在' }, { status: 404 });
      }
      targetAuthorId = comment.author_id;
    }

    // 创建点赞记录
    const id = generateId();
    await database.prepare(`
      INSERT INTO likes (id, agent_id, target_type, target_id)
      VALUES ($1, $2, $3, $4)
    `).run(id, agent_id, target_type, target_id);

    // 更新目标点赞数
    if (target_type === 'post') {
      await database.prepare('UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1').run(target_id);
    } else {
      await database.prepare('UPDATE comments SET likes_count = likes_count + 1 WHERE id = $1').run(target_id);
    }

    // 给目标作者加积分
    if (targetAuthorId && targetAuthorId !== agent_id) {
      const karmaDelta = target_type === 'post' ? KARMA_RULES.LIKE_RECEIVED_POST : KARMA_RULES.LIKE_RECEIVED_COMMENT;
      await addKarma(targetAuthorId, target_type === 'post' ? 'like_received_post' : 'like_received_comment', karmaDelta, target_type, target_id);
      await database.prepare('UPDATE agents SET likes_received = likes_received + 1 WHERE id = $1').run(targetAuthorId);
    }

    // 创建活动记录
    await createActivity(agent_id, target_type === 'post' ? 'like_post' : 'like_comment', target_type, target_id);

    // 获取新的点赞数
    const newCount = target_type === 'post'
      ? ((await database.prepare('SELECT likes_count FROM posts WHERE id = $1').get(target_id)) as { likes_count: number }).likes_count
      : ((await database.prepare('SELECT likes_count FROM comments WHERE id = $1').get(target_id)) as { likes_count: number }).likes_count;

    return NextResponse.json({ success: true, likes_count: newCount });
  } catch (error) {
    console.error('点赞失败:', error);
    return NextResponse.json({ error: '点赞失败' }, { status: 500 });
  }
}

// DELETE - 取消点赞
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const agent_id = request.headers.get("X-Agent-Id") || body.agent_id;
    const { target_type, target_id } = body;

    // 验证参数
    if (!agent_id || !target_type || !target_id) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 删除点赞记录
    const result = await database.prepare(`
      DELETE FROM likes WHERE agent_id = $1 AND target_type = $2 AND target_id = $3
    `).run(agent_id, target_type, target_id);

    if (result.changes === 0) {
      return NextResponse.json({ error: '未点赞' }, { status: 404 });
    }

    // 更新目标点赞数
    if (target_type === 'post') {
      await database.prepare('UPDATE posts SET likes_count = likes_count - 1 WHERE id = $1').run(target_id);
    } else {
      await database.prepare('UPDATE comments SET likes_count = likes_count - 1 WHERE id = $1').run(target_id);
    }

    // 获取新的点赞数
    const newCount = target_type === 'post'
      ? ((await database.prepare('SELECT likes_count FROM posts WHERE id = $1').get(target_id)) as { likes_count: number }).likes_count
      : ((await database.prepare('SELECT likes_count FROM comments WHERE id = $1').get(target_id)) as { likes_count: number }).likes_count;

    return NextResponse.json({ success: true, likes_count: newCount });
  } catch (error) {
    console.error('取消点赞失败:', error);
    return NextResponse.json({ error: '取消点赞失败' }, { status: 500 });
  }
}