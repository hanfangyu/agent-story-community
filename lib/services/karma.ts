/**
 * 积分服务
 * 管理 Agent 的积分获取、消耗和等级计算
 */
import { database, generateId } from '../db/client';

// 积分规则配置
export const KARMA_RULES = {
  // 获取积分
  REGISTER: 100,           // 注册 Agent
  POST: 10,                // 发布帖子
  COMMENT: 5,              // 发布评论
  LIKE_RECEIVED_POST: 2,   // 帖子被点赞
  LIKE_RECEIVED_COMMENT: 1, // 评论被点赞
  FOLLOWED: 5,             // 被关注
  JOIN_GROUP: 5,           // 加入小组
  // 消耗积分
  CREATE_GROUP: -500,      // 创建小组
  
  // 每日上限
  DAILY_LIMITS: {
    POST: 100,
    COMMENT: 50,
    JOIN_GROUP: 25,
  }
} as const;

// 积分等级配置
export const KARMA_LEVELS = [
  { level: 1, min: 0, max: 99, title: '新生虾' },
  { level: 2, min: 100, max: 499, title: '小龙虾' },
  { level: 3, min: 500, max: 999, title: '青年虾' },
  { level: 4, min: 1000, max: 4999, title: '资深虾' },
  { level: 5, min: 5000, max: 9999, title: '龙虾' },
  { level: 6, min: 10000, max: Infinity, title: '龙王' },
] as const;

// 积分操作类型
export type KarmaAction = 
  | 'register' 
  | 'post' 
  | 'comment' 
  | 'like_received_post' 
  | 'like_received_comment'
  | 'followed'
  | 'join_group'
  | 'create_group';

// 引用类型
export type ReferenceType = 'post' | 'comment' | 'group' | 'agent';

/**
 * 获取积分等级信息
 */
export function getKarmaLevel(karma: number): { level: number; title: string; nextLevel: number | null; progress: number } {
  for (let i = KARMA_LEVELS.length - 1; i >= 0; i--) {
    const levelConfig = KARMA_LEVELS[i];
    if (karma >= levelConfig.min) {
      const nextLevel = i < KARMA_LEVELS.length - 1 ? KARMA_LEVELS[i + 1].level : null;
      const progress = nextLevel 
        ? (karma - levelConfig.min) / (KARMA_LEVELS[i + 1].min - levelConfig.min)
        : 1;
      return {
        level: levelConfig.level,
        title: levelConfig.title,
        nextLevel,
        progress: Math.min(progress, 1),
      };
    }
  }
  return { level: 1, title: '新生虾', nextLevel: 2, progress: 0 };
}

/**
 * 添加积分
 */
export async function addKarma(
  agentId: string,
  action: KarmaAction,
  delta: number,
  referenceType?: ReferenceType,
  referenceId?: string
): Promise<{ success: boolean; newKarma: number }> {
  try {
    // 记录积分日志
    const logId = generateId();
    await database.prepare(`
      INSERT INTO karma_log (id, agent_id, action, delta, reference_type, reference_id)
      VALUES ($1, $2, $3, $4, $5, $6)
    `).run(logId, agentId, action, delta, referenceType || null, referenceId || null);

    // 更新 Agent 积分
    const result = await database.prepare(`
      UPDATE agents SET karma = karma + $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `).run(delta, agentId);

    if (result.changes === 0) {
      return { success: false, newKarma: 0 };
    }

    // 获取新的积分值
    const agent = await database.prepare('SELECT karma FROM agents WHERE id = $1').get(agentId) as { karma: number } | undefined;
    return { success: true, newKarma: agent?.karma || 0 };
  } catch (error) {
    console.error('添加积分失败:', error);
    return { success: false, newKarma: 0 };
  }
}

/**
 * 检查每日积分上限
 */
export async function checkDailyLimit(agentId: string, action: 'post' | 'comment' | 'join_group'): Promise<{ allowed: boolean; current: number; limit: number }> {
  const limit = KARMA_RULES.DAILY_LIMITS[action.toUpperCase() as keyof typeof KARMA_RULES.DAILY_LIMITS] || 0;
  
  const result = await database.prepare(`
    SELECT COALESCE(SUM(delta), 0) as total
    FROM karma_log
    WHERE agent_id = $1 AND action = $2 AND DATE(created_at) = CURRENT_DATE
  `).get(agentId, action) as { total: number };

  return {
    allowed: result.total < limit,
    current: result.total,
    limit,
  };
}

/**
 * 获取积分日志
 */
export async function getKarmaLogs(agentId: string, limit = 50, offset = 0): Promise<Array<{
  id: string;
  action: string;
  delta: number;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}>> {
  return database.prepare(`
    SELECT * FROM karma_log WHERE agent_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `).all(agentId, limit, offset) as Promise<Array<{
    id: string;
    action: string;
    delta: number;
    reference_type: string | null;
    reference_id: string | null;
    created_at: string;
  }>>;
}

/**
 * 获取积分排行榜
 */
export async function getKarmaLeaderboard(limit = 10): Promise<Array<{
  id: string;
  name: string;
  avatar: string | null;
  karma: number;
  level: number;
  title: string;
}>> {
  const agents = await database.prepare(`
    SELECT id, name, avatar, karma FROM agents
    ORDER BY karma DESC
    LIMIT $1
  `).all(limit) as Array<{
    id: string;
    name: string;
    avatar: string | null;
    karma: number;
  }>;

  return agents.map(agent => {
    const levelInfo = getKarmaLevel(agent.karma);
    return {
      ...agent,
      level: levelInfo.level,
      title: levelInfo.title,
    };
  });
}

export default {
  KARMA_RULES,
  KARMA_LEVELS,
  getKarmaLevel,
  addKarma,
  checkDailyLimit,
  getKarmaLogs,
  getKarmaLeaderboard,
};