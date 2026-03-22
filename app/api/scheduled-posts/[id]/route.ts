/**
 * 单个定时任务 API
 * 
 * GET /api/scheduled-posts/[id] - 获取任务详情
 * PATCH /api/scheduled-posts/[id] - 更新任务
 * DELETE /api/scheduled-posts/[id] - 取消/删除任务
 */
import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/db/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - 获取任务详情
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const task = await database.prepare(`
      SELECT id, agent_id, title, content, category, group_id, 
             scheduled_at, cron_expression, status, last_run_at, next_run_at, 
             created_at, updated_at
      FROM scheduled_posts
      WHERE id = $1
    `).get(id);
    
    if (!task) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 });
    }
    
    return NextResponse.json(task);
  } catch (error) {
    console.error('获取定时任务失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

// PATCH - 更新任务
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // 检查任务是否存在
    const existing = await database.prepare(`
      SELECT id, agent_id, status FROM scheduled_posts WHERE id = $1
    `).get(id);
    
    if (!existing) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 });
    }
    
    // 只允许更新 pending 状态的任务
    if ((existing as any).status !== 'pending') {
      return NextResponse.json({ 
        error: '只能更新 pending 状态的任务' 
      }, { status: 400 });
    }
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    // 可更新字段
    if (body.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(body.title);
    }
    if (body.content !== undefined) {
      updates.push(`content = $${paramIndex++}`);
      values.push(body.content);
    }
    if (body.category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      values.push(body.category);
    }
    if (body.group_id !== undefined) {
      updates.push(`group_id = $${paramIndex++}`);
      values.push(body.group_id);
    }
    if (body.scheduled_at !== undefined) {
      const scheduledDate = new Date(body.scheduled_at);
      if (isNaN(scheduledDate.getTime())) {
        return NextResponse.json({ error: '无效的时间格式' }, { status: 400 });
      }
      updates.push(`scheduled_at = $${paramIndex++}`);
      values.push(scheduledDate.toISOString());
    }
    
    if (updates.length === 0) {
      return NextResponse.json({ error: '没有要更新的字段' }, { status: 400 });
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    await database.prepare(`
      UPDATE scheduled_posts 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `).run(...values);
    
    const task = await database.prepare(`
      SELECT id, agent_id, title, content, category, group_id, 
             scheduled_at, cron_expression, status, next_run_at, created_at, updated_at
      FROM scheduled_posts WHERE id = $1
    `).get(id);
    
    return NextResponse.json(task);
  } catch (error) {
    console.error('更新定时任务失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

// DELETE - 取消/删除任务
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const hard = searchParams.get('hard') === 'true';
    
    // 检查任务是否存在
    const existing = await database.prepare(`
      SELECT id, status FROM scheduled_posts WHERE id = $1
    `).get(id);
    
    if (!existing) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 });
    }
    
    if (hard) {
      // 硬删除
      await database.prepare('DELETE FROM scheduled_posts WHERE id = $1').run(id);
      return NextResponse.json({ message: '任务已删除' });
    } else {
      // 软删除（标记为已取消）
      await database.prepare(`
        UPDATE scheduled_posts 
        SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `).run(id);
      return NextResponse.json({ message: '任务已取消' });
    }
  } catch (error) {
    console.error('删除定时任务失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}