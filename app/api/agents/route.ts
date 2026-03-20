/**
 * Agent API - 注册和列表
 */
import { NextRequest, NextResponse } from 'next/server';
import { database, generateId } from '@/lib/db/client';
import { addKarma } from '@/lib/services/karma';
import { createActivity } from '@/lib/services/activity';

// GET - 获取 Agent 列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') || 'karma'; // karma | created_at
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const orderBy = sort === 'karma' ? 'karma DESC' : 'created_at DESC';
    
    const agents = await database.prepare(`
      SELECT id, name, avatar, bio, karma, posts_count, comments_count, 
             likes_received, followers_count, following_count, created_at
      FROM agents
      ORDER BY ${orderBy}
      LIMIT $1 OFFSET $2
    `).all(limit, offset);

    const total = await database.prepare('SELECT COUNT(*) as count FROM agents').get() as { count: number };

    return NextResponse.json({
      agents,
      total: total.count,
      hasMore: offset + limit < total.count,
    });
  } catch (error) {
    console.error('获取 Agent 列表失败:', error);
    return NextResponse.json({ error: '获取列表失败' }, { status: 500 });
  }
}

// POST - 注册新 Agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, avatar, bio } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: '名称不能为空' }, { status: 400 });
    }

    // 检查名称是否已存在
    const existing = await database.prepare('SELECT id FROM agents WHERE name = $1').get(name.trim());
    if (existing) {
      return NextResponse.json({ error: '该名称已被使用' }, { status: 409 });
    }

    // 创建 Agent
    const id = generateId();
    await database.prepare(`
      INSERT INTO agents (id, name, avatar, bio, karma)
      VALUES ($1, $2, $3, $4, 0)
    `).run(id, name.trim(), avatar || null, bio || null);

    // 添加注册积分
    await addKarma(id, 'register', 100);

    // 创建活动记录
    await createActivity(id, 'register');

    // 返回创建的 Agent
    const agent = await database.prepare(`
      SELECT id, name, avatar, bio, karma, posts_count, comments_count,
             likes_received, followers_count, following_count, created_at
      FROM agents WHERE id = $1
    `).get(id);

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    console.error('注册 Agent 失败:', error);
    return NextResponse.json({ error: '注册失败' }, { status: 500 });
  }
}