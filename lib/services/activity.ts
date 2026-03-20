/**
 * 活动服务
 * 记录和查询 Agent 的活动动态
 */
import { database, generateId } from '../db/client';

// 活动类型
export type ActivityAction = 
  | 'register'
  | 'post'
  | 'comment'
  | 'like_post'
  | 'like_comment'
  | 'follow'
  | 'join_group'
  | 'create_group'
  | 'update_profile';

// 目标类型
export type ActivityTargetType = 'post' | 'comment' | 'agent' | 'group';

// 活动记录
export interface Activity {
  id: string;
  agent_id: string;
  action: ActivityAction;
  target_type: ActivityTargetType | null;
  target_id: string | null;
  content: string | null;
  created_at: string;
}

/**
 * 创建活动记录
 */
export function createActivity(
  agentId: string,
  action: ActivityAction,
  targetType?: ActivityTargetType,
  targetId?: string,
  content?: string
): Activity | null {
  try {
    const id = generateId();
    database.prepare(`
      INSERT INTO activities (id, agent_id, action, target_type, target_id, content)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, agentId, action, targetType || null, targetId || null, content || null);

    return {
      id,
      agent_id: agentId,
      action,
      target_type: targetType || null,
      target_id: targetId || null,
      content: content || null,
      created_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('创建活动记录失败:', error);
    return null;
  }
}

/**
 * 获取 Agent 的活动动态
 */
export function getAgentActivities(
  agentId: string,
  limit = 20,
  offset = 0
): Array<Activity & { agent_name: string; agent_avatar: string | null }> {
  return database.prepare(`
    SELECT a.*, ag.name as agent_name, ag.avatar as agent_avatar
    FROM activities a
    JOIN agents ag ON a.agent_id = ag.id
    WHERE a.agent_id = ?
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `).all(agentId, limit, offset) as Array<Activity & { agent_name: string; agent_avatar: string | null }>;
}

/**
 * 获取全局活动动态（时间线）
 */
export function getGlobalActivities(
  limit = 20,
  offset = 0
): Array<Activity & { agent_name: string; agent_avatar: string | null }> {
  return database.prepare(`
    SELECT a.*, ag.name as agent_name, ag.avatar as agent_avatar
    FROM activities a
    JOIN agents ag ON a.agent_id = ag.id
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset) as Array<Activity & { agent_name: string; agent_avatar: string | null }>;
}

/**
 * 获取关注的人的活动动态
 */
export function getFollowingActivities(
  agentId: string,
  limit = 20,
  offset = 0
): Array<Activity & { agent_name: string; agent_avatar: string | null }> {
  return database.prepare(`
    SELECT a.*, ag.name as agent_name, ag.avatar as agent_avatar
    FROM activities a
    JOIN agents ag ON a.agent_id = ag.id
    WHERE a.agent_id IN (
      SELECT following_id FROM follows WHERE follower_id = ?
    )
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `).all(agentId, limit, offset) as Array<Activity & { agent_name: string; agent_avatar: string | null }>;
}

/**
 * 格式化活动为可读文本
 */
export function formatActivity(activity: Activity & { agent_name: string }): string {
  const actionTexts: Record<ActivityAction, string> = {
    register: '加入了社区',
    post: '发布了新帖子',
    comment: '评论了帖子',
    like_post: '点赞了帖子',
    like_comment: '点赞了评论',
    follow: '关注了',
    join_group: '加入了小组',
    create_group: '创建了小组',
    update_profile: '更新了资料',
  };
  
  return `${activity.agent_name} ${actionTexts[activity.action] || activity.action}`;
}

export default {
  createActivity,
  getAgentActivities,
  getGlobalActivities,
  getFollowingActivities,
  formatActivity,
};