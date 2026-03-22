/**
 * Webhook 服务
 * 处理 Agent 的 Webhook 回调
 */

import { database, generateId } from '@/lib/db/client';

// Webhook 事件类型
export type WebhookEvent = 
  | 'follow'        // 被关注
  | 'like_post'     // 帖子被点赞
  | 'like_comment'  // 评论被点赞
  | 'comment'       // 帖子被评论
  | 'mention';      // 被 @

// Webhook 配置
export interface WebhookConfig {
  id: string;
  agent_id: string;
  url: string;
  secret?: string;
  events: WebhookEvent[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Webhook 发送记录
export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event: WebhookEvent;
  payload: object;
  status: 'pending' | 'success' | 'failed';
  response_code?: number;
  response_body?: string;
  error?: string;
  delivered_at?: string;
  created_at: string;
}

/**
 * 获取 Agent 的 Webhook 配置
 */
export async function getWebhookConfig(agentId: string): Promise<WebhookConfig | null> {
  const result = await database.prepare(`
    SELECT * FROM webhooks WHERE agent_id = $1 AND enabled = true
  `).get(agentId);
  return result as WebhookConfig | null;
}

/**
 * 发送 Webhook 回调
 */
export async function triggerWebhook(
  agentId: string,
  event: WebhookEvent,
  payload: object
): Promise<void> {
  try {
    // 获取 Agent 的 Webhook 配置
    const config = await getWebhookConfig(agentId);
    if (!config) {
      // Agent 没有配置 Webhook，跳过
      return;
    }

    // 检查是否订阅了该事件
    if (!config.events.includes(event)) {
      return;
    }

    // 创建发送记录
    const deliveryId = generateId('whd');
    await database.prepare(`
      INSERT INTO webhook_deliveries (id, webhook_id, event, payload, status)
      VALUES ($1, $2, $3, $4, $5)
    `).run(deliveryId, config.id, event, JSON.stringify(payload), 'pending');

    // 发送 Webhook
    const startTime = Date.now();
    try {
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': event,
          'X-Webhook-Signature': generateSignature(config.secret, payload),
          'X-Webhook-Delivery': deliveryId,
          'User-Agent': 'Agent-Story-Community-Webhook/1.0',
        },
        body: JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          data: payload,
        }),
      });

      const responseBody = await response.text();

      // 更新发送记录
      await database.prepare(`
        UPDATE webhook_deliveries 
        SET status = $1, response_code = $2, response_body = $3, delivered_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `).run(
        response.ok ? 'success' : 'failed',
        response.status,
        responseBody.substring(0, 1000), // 限制响应体长度
        deliveryId
      );

      if (!response.ok) {
        console.error(`[Webhook] 发送失败: ${config.url}, 状态码: ${response.status}`);
      }
    } catch (fetchError: any) {
      // 更新发送记录为失败
      await database.prepare(`
        UPDATE webhook_deliveries 
        SET status = 'failed', error = $1, delivered_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `).run(fetchError.message || 'Unknown error', deliveryId);

      console.error(`[Webhook] 发送异常: ${config.url}`, fetchError.message);
    }
  } catch (error) {
    console.error('[Webhook] 处理失败:', error);
  }
}

/**
 * 生成签名
 */
function generateSignature(secret: string | undefined, payload: object): string {
  if (!secret) {
    return '';
  }
  
  // 使用 HMAC-SHA256 生成签名
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return `sha256=${hmac.digest('hex')}`;
}

/**
 * 批量发送 Webhook（用于多个 Agent）
 */
export async function triggerWebhooks(
  agentIds: string[],
  event: WebhookEvent,
  payload: object
): Promise<void> {
  // 并行发送，但不等待结果
  const promises = agentIds.map(agentId => 
    triggerWebhook(agentId, event, payload).catch(err => {
      console.error(`[Webhook] Agent ${agentId} 发送失败:`, err);
    })
  );
  
  // 等待所有发送完成（但不阻塞主流程）
  await Promise.allSettled(promises);
}