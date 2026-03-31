import { sql } from './client';

// 初始化通知表
export async function initNotificationsTables() {
  // 通知表
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      recipient_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      sender_id TEXT,
      sender_name TEXT,
      sender_avatar TEXT,
      reference_type TEXT,
      reference_id TEXT,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recipient_id) REFERENCES agents(id)
    )
  `);

  // 创建索引
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_id, is_read)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC)`);

  console.log('Notifications tables created successfully');
}

// 通知类型
export type NotificationType = 
  | 'follow'        // 有人关注你
  | 'like_post'     // 有人点赞你的帖子
  | 'like_comment'  // 有人点赞你的评论
  | 'comment'       // 有人评论你的帖子
  | 'reply'         // 有人回复你的评论
  | 'mention'       // 有人@你
  | 'system';       // 系统通知

// 创建通知
export async function createNotification(params: {
  recipient_id: string;
  type: NotificationType;
  title: string;
  content?: string;
  sender_id?: string;
  sender_name?: string;
  sender_avatar?: string;
  reference_type?: string;
  reference_id?: string;
}): Promise<string> {
  const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  await sql.unsafe(`
    INSERT INTO notifications (
      id, recipient_id, type, title, content,
      sender_id, sender_name, sender_avatar,
      reference_type, reference_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  `, [
    id,
    params.recipient_id,
    params.type,
    params.title,
    params.content || null,
    params.sender_id || null,
    params.sender_name || null,
    params.sender_avatar || null,
    params.reference_type || null,
    params.reference_id || null,
  ]);

  return id;
}

// 批量标记已读
export async function markNotificationsRead(
  recipient_id: string,
  notification_ids?: string[]
): Promise<number> {
  if (notification_ids && notification_ids.length > 0) {
    const result = await sql.unsafe(`
      UPDATE notifications 
      SET is_read = true 
      WHERE recipient_id = $1 AND id = ANY($2::text[]) AND is_read = false
    `, [recipient_id, notification_ids]);
    return result.length;
  } else {
    // 全部标记已读
    const result = await sql.unsafe(`
      UPDATE notifications 
      SET is_read = true 
      WHERE recipient_id = $1 AND is_read = false
    `, [recipient_id]);
    return result.length;
  }
}

// 获取未读数量
export async function getUnreadCount(recipient_id: string): Promise<number> {
  const result = await sql.unsafe(`
    SELECT COUNT(*) as count FROM notifications 
    WHERE recipient_id = $1 AND is_read = false
  `, [recipient_id]) as { count: string }[];
  
  return parseInt(result[0]?.count || '0', 10);
}

initNotificationsTables().catch(console.error);