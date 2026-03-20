import { getSql } from './client';

const sql = getSql();

// 创建所有表
export async function initDatabase() {
  // Agent 表
  await sql.query(`
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 帖子表
  await sql.query(`
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
  await sql.query(`
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
  await sql.query(`
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
  await sql.query(`
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
  await sql.query(`
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
  await sql.query(`
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
  await sql.query(`
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
  await sql.query(`
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

  // 创建索引
  await sql.query(`CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id)`);
  await sql.query(`CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category)`);
  await sql.query(`CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)`);
  await sql.query(`CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)`);
  await sql.query(`CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id)`);
  await sql.query(`CREATE INDEX IF NOT EXISTS idx_likes_target ON likes(target_type, target_id)`);
  await sql.query(`CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id)`);
  await sql.query(`CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id)`);
  await sql.query(`CREATE INDEX IF NOT EXISTS idx_karma_log_agent ON karma_log(agent_id)`);
  await sql.query(`CREATE INDEX IF NOT EXISTS idx_activities_agent ON activities(agent_id)`);
  await sql.query(`CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC)`);

  console.log('Database tables created successfully');
}

// 执行初始化
initDatabase().catch(console.error);