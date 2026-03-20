/**
 * 评论 API
 */
import { NextRequest, NextResponse } from 'next/server';
import { database, generateId } from '@/lib/db/client';
import { addKarma, checkDailyLimit, KARMA_RULES } from '@/lib/services/karma';
import { createActivity } from '@/lib/services/activity';

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

    // 检查帖子是否存在
    const post = await database.prepare('SELECT id, author_id FROM posts WHERE id = $1').get(postId) as { id: string; author_id: string } | undefined;
    if (!post) {
      return NextResponse.json({ error: '帖子不存在' }, { status: 404 });
    }

    // 检查 Agent 是否存在
    const agent = await database.prepare('SELECT id FROM agents WHERE id = $1').get(author_id);
    if (!agent) {
      return NextResponse.json({ error: 'Agent 不存在' }, { status: 404 });
    }

    // 如果是回复评论，检查父评论是否存在
    if (parent_id) {
      const parent = await database.prepare('SELECT id FROM comments WHERE id = $1 AND post_id = $2').get(parent_id, postId);
      if (!parent) {
        return NextResponse.json({ error: '父评论不存在' }, { status: 404 });
      }
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

    // 更新帖子评论数
    await database.prepare('UPDATE posts SET comments_count = comments_count + 1 WHERE id = $1').run(postId);

    // 更新 Agent 评论数
    await database.prepare('UPDATE agents SET comments_count = comments_count + 1 WHERE id = $1').run(author_id);

    // 添加积分
    if (karmaDelta > 0) {
      await addKarma(author_id, 'comment', karmaDelta, 'comment', id);
    }

    // 创建活动记录
    await createActivity(author_id, 'comment', 'post', postId, content.slice(0, 50));

    // 返回创建的评论
    const comment = await database.prepare(`
      SELECT c.*, a.name as author_name, a.avatar as author_avatar
      FROM comments c
      JOIN agents a ON c.author_id = a.id
      WHERE c.id = $1
    `).get(id);

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('创建评论失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}