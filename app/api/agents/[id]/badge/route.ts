/**
 * Agent 认证徽章 API
 * 管理Agent的官方认证徽章
 */
import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/db/client';
import { withErrorHandling } from '@/lib/middleware/error-handler';

// 徽章类型定义
export type BadgeType = 
  | 'verified'        // 官方认证（蓝标）
  | 'top_creator'     // 顶级创作者（黄标）
  | 'early_adopter'   // 早期用户（绿标）
  | 'community_star'  // 社区之星（紫标）
  | 'developer'       // 开发者认证（橙标）
  | 'bot';            // 机器人认证（灰标）

export interface Badge {
  type: BadgeType;
  name: string;
  description: string;
  color: string;
  icon: string;
  awarded_at: string;
}

// 徽章配置
export const BADGE_CONFIG: Record<BadgeType, Omit<Badge, 'awarded_at'>> = {
  verified: {
    type: 'verified',
    name: '官方认证',
    description: '官方认证的 Agent',
    color: '#1DA1F2',
    icon: '✓',
  },
  top_creator: {
    type: 'top_creator',
    name: '顶级创作者',
    description: '积分超过 1000 的创作者',
    color: '#FFD700',
    icon: '⭐',
  },
  early_adopter: {
    type: 'early_adopter',
    name: '早期用户',
    description: '在平台早期加入的先驱者',
    color: '#17BF63',
    icon: '🌱',
  },
  community_star: {
    type: 'community_star',
    name: '社区之星',
    description: '对社区有突出贡献的成员',
    color: '#794BC4',
    icon: '🌟',
  },
  developer: {
    type: 'developer',
    name: '开发者',
    description: '使用平台 API 进行开发的开发者',
    color: '#FF6B35',
    icon: '💻',
  },
  bot: {
    type: 'bot',
    name: '机器人',
    description: '自动化程序 Agent',
    color: '#8899A6',
    icon: '🤖',
  },
};

// GET - 获取Agent的徽章列表
export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: agentId } = await params;

  // 检查Agent是否存在
  const agent = await database.prepare(`
    SELECT id, badges FROM agents WHERE id = $1
  `).get(agentId) as any;

  if (!agent) {
    return NextResponse.json({ error: 'Agent 不存在' }, { status: 404 });
  }

  // 解析徽章
  let badges: Badge[] = [];
  try {
    if (agent.badges) {
      const badgeData = typeof agent.badges === 'string' ? JSON.parse(agent.badges) : agent.badges;
      badges = badgeData.map((b: any) => ({
        ...BADGE_CONFIG[b.type as BadgeType],
        awarded_at: b.awarded_at,
      }));
    }
  } catch (e) {
    console.error('Failed to parse badges:', e);
  }

  return NextResponse.json({
    agent_id: agentId,
    badges,
    available_badges: Object.values(BADGE_CONFIG),
  });
}, '/api/agents/[id]/badge');

// POST - 授予徽章（需要管理员权限）
export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: agentId } = await params;
  
  // 检查管理员权限（通过环境变量配置的密钥）
  const authHeader = request.headers.get('Authorization');
  const adminSecret = process.env.ADMIN_SECRET;
  
  if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
  }

  const body = await request.json();
  const { badge_type } = body as { badge_type: BadgeType };

  if (!badge_type || !BADGE_CONFIG[badge_type]) {
    return NextResponse.json({ error: '无效的徽章类型' }, { status: 400 });
  }

  // 检查Agent是否存在
  const agent = await database.prepare(`
    SELECT id, badges FROM agents WHERE id = $1
  `).get(agentId) as any;

  if (!agent) {
    return NextResponse.json({ error: 'Agent 不存在' }, { status: 404 });
  }

  // 解析现有徽章
  let currentBadges: Array<{ type: BadgeType; awarded_at: string }> = [];
  try {
    if (agent.badges) {
      currentBadges = typeof agent.badges === 'string' ? JSON.parse(agent.badges) : agent.badges;
    }
  } catch (e) {
    console.error('Failed to parse badges:', e);
  }

  // 检查是否已有该徽章
  if (currentBadges.some(b => b.type === badge_type)) {
    return NextResponse.json({ error: '该 Agent 已拥有此徽章' }, { status: 400 });
  }

  // 添加新徽章
  const newBadge = {
    type: badge_type,
    awarded_at: new Date().toISOString(),
  };
  currentBadges.push(newBadge);

  // 更新数据库
  await database.prepare(`
    UPDATE agents SET badges = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
  `).run(JSON.stringify(currentBadges), agentId);

  return NextResponse.json({
    success: true,
    message: '徽章授予成功',
    badge: {
      ...BADGE_CONFIG[badge_type],
      awarded_at: newBadge.awarded_at,
    },
  });
}, '/api/agents/[id]/badge');

// DELETE - 移除徽章（需要管理员权限）
export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: agentId } = await params;
  
  // 检查管理员权限
  const authHeader = request.headers.get('Authorization');
  const adminSecret = process.env.ADMIN_SECRET;
  
  if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const badgeType = searchParams.get('type') as BadgeType;

  if (!badgeType) {
    return NextResponse.json({ error: '请指定要移除的徽章类型' }, { status: 400 });
  }

  // 检查Agent是否存在
  const agent = await database.prepare(`
    SELECT id, badges FROM agents WHERE id = $1
  `).get(agentId) as any;

  if (!agent) {
    return NextResponse.json({ error: 'Agent 不存在' }, { status: 404 });
  }

  // 解析现有徽章
  let currentBadges: Array<{ type: BadgeType; awarded_at: string }> = [];
  try {
    if (agent.badges) {
      currentBadges = typeof agent.badges === 'string' ? JSON.parse(agent.badges) : agent.badges;
    }
  } catch (e) {
    console.error('Failed to parse badges:', e);
  }

  // 移除指定徽章
  const newBadges = currentBadges.filter(b => b.type !== badgeType);

  if (newBadges.length === currentBadges.length) {
    return NextResponse.json({ error: '该 Agent 没有此徽章' }, { status: 400 });
  }

  // 更新数据库
  await database.prepare(`
    UPDATE agents SET badges = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
  `).run(JSON.stringify(newBadges), agentId);

  return NextResponse.json({
    success: true,
    message: '徽章移除成功',
  });
}, '/api/agents/[id]/badge');