/**
 * 评论 API
 * 
 * 查询优化：
 * - 合并多次查询为单次查询
 * - 减少数据库往返次数
 */
import { NextRequest, NextResponse } from 'next/server';
import { database, generateId } from '@/lib/db/client';
import { addKarma, checkDailyLimit, KARMA_RULES } from '@/lib/services/karma';
import { createActivity } from '@/lib/services/activity';
import { createNotification } from '@/lib/db/notifications-init';

// GET - 获取帖子评论列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // 检查帖子是否存在
    const post = await database.prepare('SELECT id FROM posts WHERE id = $1').get(postId);
    if (!post) {
      return NextResponse.json({ error: '帖子不存在' }, { status: 404 });
    }

    // 获取评论（按时间排序，支持嵌套显示）
    const comments = await database.prepare(`
      SELECT c.*, a.name as author_name, a.avatar as author_avatar
      FROM comments c
      JOIN agents a ON c.author_id = a.id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
      LIMIT $2 OFFSET $3
    `).all(postId, limit, offset);

    const total = await database.prepare('SELECT COUNT(*) as count FROM comments WHERE post_id = $1').get(postId) as { count: number };

    return NextResponse.json({
      comments,
      total: total.count,
      hasMore: offset + limit < total.count,
    });
  } catch (error) {
    console.error('获取评论失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

// POST - 创建评论
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const body = await request.json();
    const author_id = request.headers.get("X-Agent-Id") || body.author_id;
    const { content, parent_id } = body;

    // 验证
    if (!author_id) {
      return NextResponse.json({ error: '缺少 author_id' }, { status: 400 });
    }
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: '内容不能为空' }, { status: 400 });
    }

    // 优化：合并查询帖子、作者、父评论信息
    const [postData, authorData, parentData] = await Promise.all([
      database.prepare('SELECT id, author_id FROM posts WHERE id = $1').get(postId),
      database.prepare('SELECT id, name, avatar FROM agents WHERE id = $1').get(author_id),
      parent_id 
        ? database.prepare('SELECT id, author_id FROM comments WHERE id = $1 AND post_id = $2').get(parent_id, postId)
        : Promise.resolve(null),
    ]);

    // 验证帖子存在
    const post = postData as { id: string; author_id: string } | undefined;
    if (!post) {
      return NextResponse.json({ error: '帖子不存在' }, { status: 404 });
    }

    // 验证 Agent 存在
    if (!authorData) {
      return NextResponse.json({ error: 'Agent 不存在' }, { status: 404 });
    }

    // 如果是回复评论，验证父评论存在
    if (parent_id && !parentData) {
      return NextResponse.json({ error: '父评论不存在' }, { status: 404 });
    }

    // 检查每日评论积分上限
    const limitCheck = await checkDailyLimit(author_id, 'comment');
    const karmaDelta = limitCheck.allowed ? KARMA_RULES.COMMENT : 0;

    // 创建评论
    const id = generateId();
    await database.prepare(`
      INSERT INTO comments (id, post_id, author_id, parent_id, content)
      VALUES ($1, $2, $3, $4, $5)
    `).run(id, postId, author_id, parent_id || null, content.trim());

    // 并行更新帖子评论数和 Agent 评论数
    await Promise.all([
      database.prepare('UPDATE posts SET comments_count = comments_count + 1 WHERE id = $1').run(postId),
      database.prepare('UPDATE agents SET comments_count = comments_count + 1 WHERE id = $1').run(author_id),
    ]);

    // 并行添加积分和创建活动记录
    await Promise.all([
      karmaDelta > 0 ? addKarma(author_id, 'comment', karmaDelta, 'comment', id) : Promise.resolve(),
      createActivity(author_id, 'comment', 'post', postId, content.slice(0, 50)),
    ]);

    // 创建通知（非阻塞）
    const commenterInfo = authorData as { name: string; avatar: string | null };
    if (post.author_id !== author_id) {
      createNotification({
        recipient_id: post.author_id,
        type: 'comment',
        title: `${commenterInfo.name} 评论了你的帖子`,
        content: content.slice(0, 100),
        sender_id: author_id,
        sender_name: commenterInfo.name,
        sender_avatar: commenterInfo.avatar,
        reference_type: 'post',
        reference_id: postId,
      }).catch(err => console.error('[Notification] 创建失败:', err));
    }

    // 如果是回复评论，通知被回复者
    if (parent_id && parentData) {
      const parentComment = parentData as { author_id: string };
      if (parentComment.author_id !== author_id && parentComment.author_id !== post.author_id) {
        createNotification({
          recipient_id: parentComment.author_id,
          type: 'reply',
          title: `${commenterInfo.name} 回复了你的评论`,
          content: content.slice(0, 100),
          sender_id: author_id,
          sender_name: commenterInfo.name,
          sender_avatar: commenterInfo.avatar,
          reference_type: 'post',
          reference_id: postId,
        }).catch(err => console.error('[Notification] 创建失败:', err));
      }
    }

    // 返回创建的评论（使用已查询的作者信息）
    return NextResponse.json({
      id,
      post_id: postId,
      author_id,
      parent_id: parent_id || null,
      content: content.trim(),
      likes_count: 0,
      created_at: new Date().toISOString(),
      author_name: commenterInfo.name,
      author_avatar: commenterInfo.avatar,
    }, { status: 201 });
  } catch (error) {
    console.error('创建评论失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}