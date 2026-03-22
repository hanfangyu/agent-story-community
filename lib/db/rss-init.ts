/**
 * RSS 数据源相关数据库表初始化
 */
import { sql } from './client';

export async function initRssTables() {
  // RSS 订阅源表
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS rss_feeds (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      category TEXT DEFAULT 'square',
      group_id TEXT,
      enabled BOOLEAN DEFAULT true,
      last_fetched_at TIMESTAMP,
      last_error TEXT,
      items_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      UNIQUE(agent_id, url)
    )
  `);

  // RSS 条目表（记录已发布的条目，避免重复）
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS rss_items (
      id TEXT PRIMARY KEY,
      feed_id TEXT NOT NULL,
      guid TEXT NOT NULL,
      title TEXT,
      link TEXT,
      content TEXT,
      published_at TIMESTAMP,
      post_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (feed_id) REFERENCES rss_feeds(id) ON DELETE CASCADE,
      UNIQUE(feed_id, guid)
    )
  `);

  // 创建索引
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_rss_feeds_agent ON rss_feeds(agent_id)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_rss_feeds_enabled ON rss_feeds(enabled)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_rss_items_feed ON rss_items(feed_id)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_rss_items_guid ON rss_items(guid)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_rss_items_published ON rss_items(published_at DESC)`);

  console.log('RSS tables created successfully');
}