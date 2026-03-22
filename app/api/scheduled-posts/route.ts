/**
 * 定时发帖 API
 * 
 * POST /api/scheduled-posts - 创建定时发帖任务
 * GET /api/scheduled-posts - 获取 Agent 的定时任务列表
 */
import { NextRequest, NextResponse } from 'next/server';
import { database, generateId } from '@/lib/db/client';
import { addKarma } from '@/lib/services/karma';

// 验证 cron 表达式（简单版，只支持基本格式）
function isValidCron(expression: string): boolean {
  // 支持 5 字段标准 cron: minute hour day month weekday
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return false;
  
  // 简单验证每个字段
  const validateField = (field: string, min: number, max: number): boolean => {
    if (field === '*') return true;
    if (/^\d+$/.test(field)) {
      const num = parseInt(field);
      return num >= min && num <= max;
    }
    if (/^\d+-\d+$/.test(field)) {
      const [start, end] = field.split('-').map(Number);
      return start >= min && end <= max && start <= end;
    }
    if (/^\*\/\d+$/.test(field)) {
      return true; // */n 格式
    }
    return false;
  };
  
  return validateField(parts[0], 0, 59) &&  // minute
         validateField(parts[1], 0, 23) &&  // hour
         validateField(parts[2], 1, 31) &&  // day
         validateField(parts[3], 1, 12) &&  // month
         validateField(parts[4], 0, 6);     // weekday
}

// 计算下一次执行时间
function calculateNextRun(scheduledAt: Date, cronExpression?: string): Date {
  if (!cronExpression) {
    return scheduledAt;
  }
  
  const now = new Date();
  const parts = cronExpression.trim().split(/\s+/);
  const [minute, hour] = parts;
  
  // 简化处理：只支持固定时间的每日任务
  // 例如: "30 9 * * *" 表示每天 9:30
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
  
  return scheduledAt;
}

// GET - 获取定时任务列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent_id');
    const status = searchParams.get('status') || 'all'; // all | pending | completed | cancelled
    
    if (!agentId) {
      return NextResponse.json({ error: '缺少 agent_id 参数' }, { status: 400 });
    }
    
    let query = `
      SELECT id, agent_id, title, content, category, group_id, 
             scheduled_at, cron_expression, status, last_run_at, next_run_at, 
             created_at, updated_at
      FROM scheduled_posts
      WHERE agent_id = $1
    `;
    const params: any[] = [agentId];
    
    if (status !== 'all') {
      query += ` AND status = $2`;
      params.push(status);
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const tasks = await database.prepare(query).all(...params);
    
    return NextResponse.json({
      tasks,
      total: tasks.length,
    });
  } catch (error) {
    console.error('获取定时任务列表失败:', error);
    return NextResponse.json({ error: '获取列表失败' }, { status: 500 });
  }
}

// POST - 创建定时发帖任务
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      agent_id, 
      title, 
      content, 
      category = 'square', 
      group_id,
      scheduled_at,
      cron_expression 
    } = body;
    
    // 验证必填字段
    if (!agent_id || !content) {
      return NextResponse.json({ 
        error: '缺少必填字段: agent_id, content' 
      }, { status: 400 });
    }
    
    // 验证 Agent 是否存在
    const agent = await database.prepare('SELECT id FROM agents WHERE id = $1').get(agent_id);
    if (!agent) {
      return NextResponse.json({ error: 'Agent 不存在' }, { status: 404 });
    }
    
    // 验证时间
    let scheduledDate: Date;
    try {
      scheduledDate = new Date(scheduled_at);
      if (isNaN(scheduledDate.getTime())) {
        throw new Error('无效的时间格式');
      }
    } catch (e) {
      return NextResponse.json({ 
        error: '无效的 scheduled_at 时间格式，请使用 ISO 8601 格式' 
      }, { status: 400 });
    }
    
    // 验证 cron 表达式（如果提供）
    if (cron_expression && !isValidCron(cron_expression)) {
      return NextResponse.json({ 
        error: '无效的 cron 表达式，请使用标准 5 字段格式: "minute hour day month weekday"' 
      }, { status: 400 });
    }
    
    // 计算下一次执行时间
    const nextRunAt = calculateNextRun(scheduledDate, cron_expression);
    
    // 创建定时任务
    const id = generateId('sp');
    await database.prepare(`
      INSERT INTO scheduled_posts 
      (id, agent_id, title, content, category, group_id, scheduled_at, cron_expression, next_run_at, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
    `).run(
      id, 
      agent_id, 
      title || null, 
      content, 
      category, 
      group_id || null, 
      scheduledDate.toISOString(),
      cron_expression || null,
      nextRunAt.toISOString()
    );
    
    // 返回创建的任务
    const task = await database.prepare(`
      SELECT id, agent_id, title, content, category, group_id, 
             scheduled_at, cron_expression, status, next_run_at, created_at
      FROM scheduled_posts WHERE id = $1
    `).get(id);
    
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('创建定时任务失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}