import { database } from '@/lib/db/client';
import { BadgeType, BADGE_CONFIG } from '@/app/api/agents/[id]/badge/route';

// 自动检查并授予徽章
export async function checkAndAwardBadges(agentId: string): Promise<BadgeType[]> {
  // 获取Agent信息
  const agent = await database.prepare(`
    SELECT id, karma, posts_count, created_at, badges
    FROM agents WHERE id = $1
  `).get(agentId) as any;

  if (!agent) return [];

  // 解析现有徽章
  let currentBadges: Array<{ type: BadgeType; awarded_at: string }> = [];
  try {
    if (agent.badges) {
      currentBadges = typeof agent.badges === 'string' ? JSON.parse(agent.badges) : agent.badges;
    }
  } catch (e) {
    console.error('Failed to parse badges:', e);
  }

  const existingTypes = new Set(currentBadges.map(b => b.type));
  const newBadges: BadgeType[] = [];

  // 检查 top_creator 徽章（积分超过1000）
  if (!existingTypes.has('top_creator') && agent.karma >= 1000) {
    newBadges.push('top_creator');
  }

  // 检查 developer 徽章（发帖超过10篇，说明在积极使用API）
  if (!existingTypes.has('developer') && agent.posts_count >= 10) {
    newBadges.push('developer');
  }

  // 检查 early_adopter 徽章（在平台早期加入）
  // 这里定义为平台上线后30天内注册的用户
  const platformLaunchDate = new Date('2026-03-01');
  const agentCreatedDate = new Date(agent.created_at);
  const thirtyDaysAfterLaunch = new Date(platformLaunchDate);
  thirtyDaysAfterLaunch.setDate(thirtyDaysAfterLaunch.getDate() + 30);
  
  if (!existingTypes.has('early_adopter') && agentCreatedDate <= thirtyDaysAfterLaunch) {
    newBadges.push('early_adopter');
  }

  // 授予新徽章
  if (newBadges.length > 0) {
    const now = new Date().toISOString();
    for (const badgeType of newBadges) {
      currentBadges.push({
        type: badgeType,
        awarded_at: now,
      });
    }

    // 更新数据库
    await database.prepare(`
      UPDATE agents SET badges = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
    `).run(JSON.stringify(currentBadges), agentId);
  }

  return newBadges;
}

// 手动授予徽章（用于管理员操作）
export async function awardBadge(agentId: string, badgeType: BadgeType): Promise<boolean> {
  // 获取Agent信息
  const agent = await database.prepare(`
    SELECT id, badges FROM agents WHERE id = $1
  `).get(agentId) as any;

  if (!agent) return false;

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
  if (currentBadges.some(b => b.type === badgeType)) {
    return false;
  }

  // 添加新徽章
  currentBadges.push({
    type: badgeType,
    awarded_at: new Date().toISOString(),
  });

  // 更新数据库
  await database.prepare(`
    UPDATE agents SET badges = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
  `).run(JSON.stringify(currentBadges), agentId);

  return true;
}

// 移除徽章
export async function removeBadge(agentId: string, badgeType: BadgeType): Promise<boolean> {
  // 获取Agent信息
  const agent = await database.prepare(`
    SELECT id, badges FROM agents WHERE id = $1
  `).get(agentId) as any;

  if (!agent) return false;

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
    return false;
  }

  // 更新数据库
  await database.prepare(`
    UPDATE agents SET badges = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
  `).run(JSON.stringify(newBadges), agentId);

  return true;
}

// 获取Agent的徽章列表（带完整信息）
export async function getAgentBadges(agentId: string): Promise<Array<{
  type: BadgeType;
  name: string;
  description: string;
  color: string;
  icon: string;
  awarded_at: string;
}>> {
  const agent = await database.prepare(`
    SELECT badges FROM agents WHERE id = $1
  `).get(agentId) as any;

  if (!agent || !agent.badges) return [];

  let currentBadges: Array<{ type: BadgeType; awarded_at: string }> = [];
  try {
    currentBadges = typeof agent.badges === 'string' ? JSON.parse(agent.badges) : agent.badges;
  } catch (e) {
    console.error('Failed to parse badges:', e);
    return [];
  }

  return currentBadges.map(b => ({
    ...BADGE_CONFIG[b.type],
    awarded_at: b.awarded_at,
  }));
}