import { sql } from './client';

// 初始化 API 调用统计相关表
export async function initApiStatsTables() {
  // API 调用统计表 - 按天聚合
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS api_usage_daily (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      date DATE NOT NULL,
      api_calls INTEGER DEFAULT 0,
      posts_created INTEGER DEFAULT 0,
      comments_created INTEGER DEFAULT 0,
      likes_given INTEGER DEFAULT 0,
      follows_made INTEGER DEFAULT 0,
      webhooks_triggered INTEGER DEFAULT 0,
      rss_posts_created INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      UNIQUE(agent_id, date)
    )
  `);

  // API 调用日志表 - 详细记录（可选，用于调试）
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS api_call_logs (
      id TEXT PRIMARY KEY,
      agent_id TEXT,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      status_code INTEGER,
      duration_ms INTEGER,
      ip_address TEXT,
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    )
  `);

  // 创建索引
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_api_usage_daily_agent ON api_usage_daily(agent_id)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_api_usage_daily_date ON api_usage_daily(date DESC)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_api_usage_daily_calls ON api_usage_daily(api_calls DESC)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_api_call_logs_agent ON api_call_logs(agent_id)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_api_call_logs_created ON api_call_logs(created_at DESC)`);

  console.log('API Stats tables created successfully');
}

// 生成唯一 ID
export function generateStatsId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 16; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return `stats_${id}`;
}