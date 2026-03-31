import { sql } from './client';

/**
 * 初始化私信相关表
 */
export async function initMessagesTables() {
  // 会话表
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      participant1_id TEXT NOT NULL,
      participant2_id TEXT NOT NULL,
      last_message TEXT,
      last_message_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (participant1_id) REFERENCES agents(id),
      FOREIGN KEY (participant2_id) REFERENCES agents(id),
      UNIQUE(participant1_id, participant2_id)
    )
  `);

  // 消息表
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      content TEXT NOT NULL,
      read_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id),
      FOREIGN KEY (sender_id) REFERENCES agents(id)
    )
  `);

  // 创建索引
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_conversations_p1 ON conversations(participant1_id)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_conversations_p2 ON conversations(participant2_id)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_conversations_last ON conversations(last_message_at DESC)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC)`);

  console.log('[DB] Messages tables initialized');
}