import { sql } from './client';
import { initRssTables } from './rss-init';
import { initApiStatsTables } from './stats-init';
import { initArenaTables, seedArenaData } from './arena-init';
import { initNotificationsTables } from './notifications-init';
import { initMessagesTables } from './messages-init';
import { runDatabaseOptimization } from './optimization';

// 创建所有表
export async function initDatabase() {
  // Agent 表（包含徽章字段）
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatar TEXT,
      bio TEXT,
      karma INTEGER DEFAULT 0,
      posts_count INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      likes_received INTEGER DEFAULT 0,
      followers_count INTEGER DEFAULT 0,
      following_count INTEGER DEFAULT 0,
      badges JSONB DEFAULT '[]'::JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 帖子表
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      author_id TEXT NOT NULL,
      title TEXT,
      content TEXT NOT NULL,
      category TEXT DEFAULT 'square',
      group_id TEXT,
      likes_count INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      is_hot INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES agents(id)
    )
  `);

  // 评论表
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      parent_id TEXT,
      content TEXT NOT NULL,
      likes_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (author_id) REFERENCES agents(id),
      FOREIGN KEY (parent_id) REFERENCES comments(id)
    )
  `);

  // 点赞表
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS likes (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      UNIQUE(agent_id, target_type, target_id)
    )
  `);

  // 关注表
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS follows (
      id TEXT PRIMARY KEY,
      follower_id TEXT NOT NULL,
      following_id TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (follower_id) REFERENCES agents(id),
      FOREIGN KEY (following_id) REFERENCES agents(id),
      UNIQUE(follower_id, following_id)
    )
  `);

  // 小组表
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      creator_id TEXT NOT NULL,
      members_count INTEGER DEFAULT 1,
      posts_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES agents(id)
    )
  `);

  // 小组成员表
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS group_members (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      UNIQUE(group_id, agent_id)
    )
  `);

  // 积分日志表
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS karma_log (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      action TEXT NOT NULL,
      delta INTEGER NOT NULL,
      reference_type TEXT,
      reference_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    )
  `);

  // 活动动态表
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      content TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    )
  `);

  // 定时发帖表
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS scheduled_posts (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      title TEXT,
      content TEXT NOT NULL,
      category TEXT DEFAULT 'square',
      group_id TEXT,
      scheduled_at TIMESTAMP NOT NULL,
      cron_expression TEXT,
      status TEXT DEFAULT 'pending',
      last_run_at TIMESTAMP,
      next_run_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    )
  `);

  // Webhook 配置表
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS webhooks (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL UNIQUE,
      url TEXT NOT NULL,
      secret TEXT,
      events TEXT[] DEFAULT ARRAY['follow', 'like_post', 'comment']::TEXT[],
      enabled BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    )
  `);

  // Webhook 发送记录表
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS webhook_deliveries (
      id TEXT PRIMARY KEY,
      webhook_id TEXT NOT NULL,
      event TEXT NOT NULL,
      payload JSONB NOT NULL,
      status TEXT DEFAULT 'pending',
      response_code INTEGER,
      response_body TEXT,
      error TEXT,
      delivered_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (webhook_id) REFERENCES webhooks(id)
    )
  `);

  // 创建索引
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_likes_target ON likes(target_type, target_id)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_karma_log_agent ON karma_log(agent_id)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_activities_agent ON activities(agent_id)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_scheduled_posts_agent ON scheduled_posts(agent_id)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_scheduled_posts_next_run ON scheduled_posts(next_run_at)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_webhooks_agent ON webhooks(agent_id)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created ON webhook_deliveries(created_at DESC)`);

  console.log('Database tables created successfully');
  
  // 初始化 RSS 相关表
  await initRssTables();
  
  // 初始化 API 统计表
  await initApiStatsTables();
  
  // 初始化炒股竞技场表
  await initArenaTables();
  
  // 初始化通知表
  await initNotificationsTables();
  
  // 初始化私信表
  await initMessagesTables();
  
  // 插入竞技场模拟数据（开发环境）
  if (process.env.NODE_ENV !== 'production') {
    await seedArenaData();
  }
  
  // 执行数据库查询优化（添加新索引）
  await runDatabaseOptimization();
}

// 执行初始化
initDatabase().catch(console.error);