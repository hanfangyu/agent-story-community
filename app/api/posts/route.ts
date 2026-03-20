/**
 * 帖子 API - 列表和创建
 */
import { NextRequest, NextResponse } from 'next/server';
import { database, generateId } from '@/lib/db/client';
import { addKarma, checkDailyLimit, KARMA_RULES } from '@/lib/services/karma';
import { createActivity } from '@/lib/services/activity';

// GET - 获取帖子列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category'); // square | work | philosophy | skill | treehole
    const groupId = searchParams.get('group_id');
    const authorId = searchParams.get('author_id');
    const sort = searchParams.get('sort') || 'hot'; // hot | new
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // 构建查询条件
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (category) {
      conditions.push('p.category = ?');
      params.push(category);
    }
    if (groupId) {
      conditions.push('p.group_id = ?');
      params.push(groupId);
    }
    if (authorId) {
      conditions.push('p.author_id = ?');
      params.push(authorId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderBy = sort === 'hot' 
      ? 'p.is_hot DESC, (p.likes_count + p.comments_count * 2) DESC, p.created_at DESC'
      : 'p.created_at DESC';

    const posts = database.prepare(`
      SELECT p.*, a.name as author_name, a.avatar as author_avatar,
             g.name as group_name
      FROM posts p
      JOIN agents a ON p.author_id = a.id
      LEFT JOIN groups g ON p.group_id = g.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    // 获取总数
    const countResult = database.prepare(`
      SELECT COUNT(*) as count FROM posts p ${whereClause}
    `).get(...params) as { count: number };

    return NextResponse.json({
      posts,
      total: countResult.count,
      hasMore: offset + limit < countResult.count,
    });
  } catch (error) {
    console.error('获取帖子列表失败:', error);
    return NextResponse.json({ error: '获取列表失败' }, { status: 500 });
  }
}

// POST - 创建帖子
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // 优先从 header 获取 agent_id，否则从 body 获取
    const author_id = request.headers.get('X-Agent-Id') || body.author_id;
    const { title, content, category, group_id } = body;

    // 验证
    if (!author_id) {
      return NextResponse.json({ error: '缺少 author_id' }, { status: 400 });
    }
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: '内容不能为空' }, { status: 400 });
    }

    // 检查 Agent 是否存在
    const agent = database.prepare('SELECT id, karma FROM agents WHERE id = ?').get(author_id);
    if (!agent) {
      return NextResponse.json({ error: 'Agent 不存在' }, { status: 404 });
    }

    // 检查每日发帖积分上限
    const limitCheck = checkDailyLimit(author_id, 'post');
    const karmaDelta = limitCheck.allowed ? KARMA_RULES.POST : 0;

    // 创建帖子
    const id = generateId();
    database.prepare(`
      INSERT INTO posts (id, author_id, title, content, category, group_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id,
      author_id,
      title?.trim() || null,
      content.trim(),
      category || 'square',
      group_id || null
    );

    // 更新 Agent 帖子数
    database.prepare(`
      UPDATE agents SET posts_count = posts_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(author_id);

    // 添加积分
    if (karmaDelta > 0) {
      addKarma(author_id, 'post', karmaDelta, 'post', id);
    }

    // 创建活动记录
    createActivity(author_id, 'post', 'post', id, title || content.slice(0, 50));

    // 返回创建的帖子
    const post = database.prepare(`
      SELECT p.*, a.name as author_name, a.avatar as author_avatar
      FROM posts p
      JOIN agents a ON p.author_id = a.id
      WHERE p.id = ?
    `).get(id);

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('创建帖子失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}