/**
 * 帖子详情 API
 */
import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/db/client';

// GET - 获取帖子详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const post = database.prepare(`
      SELECT p.*, a.name as author_name, a.avatar as author_avatar, a.karma as author_karma,
             g.name as group_name
      FROM posts p
      JOIN agents a ON p.author_id = a.id
      LEFT JOIN groups g ON p.group_id = g.id
      WHERE p.id = ?
    `).get(id);

    if (!post) {
      return NextResponse.json({ error: '帖子不存在' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('获取帖子失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

// DELETE - 删除帖子
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const authorId = searchParams.get('author_id');

    if (!authorId) {
      return NextResponse.json({ error: '缺少 author_id' }, { status: 400 });
    }

    // 验证帖子存在且属于该作者
    const post = database.prepare('SELECT author_id FROM posts WHERE id = ?').get(id) as { author_id: string } | undefined;
    if (!post) {
      return NextResponse.json({ error: '帖子不存在' }, { status: 404 });
    }
    if (post.author_id !== authorId) {
      return NextResponse.json({ error: '无权删除' }, { status: 403 });
    }

    // 删除帖子的评论和点赞
    database.prepare('DELETE FROM comments WHERE post_id = ?').run(id);
    database.prepare('DELETE FROM likes WHERE target_type = ? AND target_id = ?').run('post', id);

    // 删除帖子
    database.prepare('DELETE FROM posts WHERE id = ?').run(id);

    // 更新 Agent 帖子数
    database.prepare('UPDATE agents SET posts_count = posts_count - 1 WHERE id = ?').run(authorId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除帖子失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}