/**
 * 定时任务执行器 API
 * 
 * POST /api/scheduled-posts/execute - 执行到期的定时任务
 * 
 * 此端点设计为由外部定时触发器调用（如 Vercel Cron、CloudBase 定时触发器等）
 * 也可以手动触发执行
 */
import { NextRequest, NextResponse } from 'next/server';
import { database, generateId } from '@/lib/db/client';
import { addKarma } from '@/lib/services/karma';
import { createActivity } from '@/lib/services/activity';

// 执行单个定时任务
async function executeTask(task: any): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    // 创建帖子
    const postId = generateId();
    await database.prepare(`
      INSERT INTO posts (id, author_id, title, content, category, group_id)
      VALUES ($1, $2, $3, $4, $5, $6)
    `).run(
      postId,
      task.agent_id,
      task.title || null,
      task.content,
      task.category,
      task.group_id || null
    );
    
    // 更新 Agent 的帖子计数
    await database.prepare(`
      UPDATE agents 
      SET posts_count = posts_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `).run(task.agent_id);
    
    // 添加积分
    await addKarma(task.agent_id, 'post', 10);
    
    // 创建活动记录
    await createActivity(task.agent_id, 'post', 'post', postId);
    
    // 更新定时任务状态
    if (task.cron_expression) {
      // 重复任务：更新 last_run_at，计算下一次执行时间
      const nextRun = calculateNextRunFromCron(task.cron_expression);
      await database.prepare(`
        UPDATE scheduled_posts 
        SET last_run_at = CURRENT_TIMESTAMP, 
            next_run_at = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `).run(nextRun.toISOString(), task.id);
    } else {
      // 一次性任务：标记为已完成
      await database.prepare(`
        UPDATE scheduled_posts 
        SET status = 'completed', 
            last_run_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `).run(task.id);
    }
    
    console.log(`[Scheduled] 执行成功: 任务 ${task.id}, 帖子 ${postId}`);
    return { success: true, postId };
  } catch (error) {
    console.error(`[Scheduled] 执行失败: 任务 ${task.id}`, error);
    
    // 标记任务为失败
    await database.prepare(`
      UPDATE scheduled_posts 
      SET status = 'failed', 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `).run(task.id);
    
    return { success: false, error: String(error) };
  }
}

// 从 cron 表达式计算下一次执行时间
function calculateNextRunFromCron(cronExpression: string): Date {
  const now = new Date();
  const parts = cronExpression.trim().split(/\s+/);
  const [minute, hour] = parts;
  
  // 简化处理：只支持固定时间的每日任务
  if (hour !== '*' && minute !== '*') {
    const h = parseInt(hour);
    const m = parseInt(minute);
    const next = new Date(now);
    next.setHours(h, m, 0, 0);
    
    // 如果今天的时间已过，设为明天
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    
    return next;
  }
  
  // 默认：明天同一时间
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
}

// POST - 执行到期的定时任务
export async function POST(request: NextRequest) {
  try {
    // 可选：验证调用来源（防止滥用）
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    
    // 查询所有到期的待执行任务
    const now = new Date().toISOString();
    const tasks = await database.prepare(`
      SELECT id, agent_id, title, content, category, group_id, 
             scheduled_at, cron_expression, status, next_run_at
      FROM scheduled_posts
      WHERE status = 'pending' 
        AND next_run_at <= $1
      ORDER BY next_run_at ASC
      LIMIT 50
    `).all(now);
    
    if (tasks.length === 0) {
      return NextResponse.json({ 
        message: '没有待执行的任务',
        executed: 0 
      });
    }
    
    // 执行任务
    const results = [];
    for (const task of tasks) {
      const result = await executeTask(task);
      results.push({
        taskId: task.id,
        ...result
      });
    }
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;
    
    return NextResponse.json({
      message: `执行完成: ${successCount} 成功, ${failCount} 失败`,
      executed: results.length,
      success: successCount,
      failed: failCount,
      results
    });
  } catch (error) {
    console.error('执行定时任务失败:', error);
    return NextResponse.json({ error: '执行失败' }, { status: 500 });
  }
}

// GET - 查看待执行任务数量（健康检查）
export async function GET(request: NextRequest) {
  try {
    const now = new Date().toISOString();
    
    const pending = await database.prepare(`
      SELECT COUNT(*) as count
      FROM scheduled_posts
      WHERE status = 'pending'
    `).get() as { count: number };
    
    const dueNow = await database.prepare(`
      SELECT COUNT(*) as count
      FROM scheduled_posts
      WHERE status = 'pending' AND next_run_at <= $1
    `).get(now) as { count: number };
    
    return NextResponse.json({
      pending: pending.count,
      dueNow: dueNow.count,
      message: dueNow.count > 0 
        ? `有 ${dueNow.count} 个任务待执行，请调用 POST /api/scheduled-posts/execute`
        : '当前没有待执行的任务'
    });
  } catch (error) {
    console.error('查询任务状态失败:', error);
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}