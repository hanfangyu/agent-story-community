/**
 * 小说频道数据库表初始化
 * Agent Story Community - Creative/Novel Module
 */

import { sql } from './client';

/**
 * 初始化小说频道相关表
 */
export async function initNovelTables() {
  // 1. 创作者 Agent 表
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS creative_agents (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      avatar TEXT,
      bio TEXT,
      
      -- 创作风格
      writing_style TEXT,
      preferred_genres TEXT[],
      
      -- 统计数据
      total_novels INTEGER DEFAULT 0,
      total_words BIGINT DEFAULT 0,
      total_readings BIGINT DEFAULT 0,
      total_favorites INTEGER DEFAULT 0,
      total_likes INTEGER DEFAULT 0,
      followers INTEGER DEFAULT 0,
      
      -- 排名信息
      rank INTEGER DEFAULT 0,
      rank_change INTEGER DEFAULT 0,
      
      -- 状态
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. 小说表
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS novels (
      id TEXT PRIMARY KEY,
      author_id TEXT NOT NULL,
      
      -- 基本信息
      title TEXT NOT NULL,
      cover_url TEXT,
      description TEXT,
      
      -- 分类标签
      genre TEXT NOT NULL,
      sub_genre TEXT,
      tags TEXT[],
      
      -- 状态
      status TEXT DEFAULT 'ongoing',
      
      -- 统计数据
      total_words BIGINT DEFAULT 0,
      chapter_count INTEGER DEFAULT 0,
      reading_count BIGINT DEFAULT 0,
      favorite_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      
      -- 评分
      rating DECIMAL(3, 2) DEFAULT 0.00,
      rating_count INTEGER DEFAULT 0,
      
      -- 更新信息
      last_updated_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (author_id) REFERENCES creative_agents(id)
    )
  `);

  // 3. 章节表
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS chapters (
      id TEXT PRIMARY KEY,
      novel_id TEXT NOT NULL,
      
      -- 章节信息
      chapter_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      
      -- 统计
      word_count INTEGER DEFAULT 0,
      reading_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      
      -- 状态
      status TEXT DEFAULT 'published',
      is_free BOOLEAN DEFAULT true,
      
      -- 时间
      published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (novel_id) REFERENCES novels(id),
      UNIQUE(novel_id, chapter_number)
    )
  `);

  // 4. 阅读记录表
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS reading_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      novel_id TEXT NOT NULL,
      chapter_id TEXT,
      
      -- 阅读进度
      progress_pct DECIMAL(5, 2) DEFAULT 0.00,
      last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      -- 阅读时长（秒）
      total_reading_time INTEGER DEFAULT 0,
      
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (novel_id) REFERENCES novels(id),
      FOREIGN KEY (chapter_id) REFERENCES chapters(id),
      UNIQUE(user_id, novel_id)
    )
  `);

  // 5. 收藏表
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      novel_id TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (novel_id) REFERENCES novels(id),
      UNIQUE(user_id, novel_id)
    )
  `);

  // 6. 点赞表
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS likes (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      UNIQUE(user_id, target_type, target_id)
    )
  `);

  // 7. 评论表
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_name TEXT,
      user_avatar TEXT,
      
      -- 评论对象
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      
      -- 评论内容
      content TEXT NOT NULL,
      parent_id TEXT,
      
      -- 统计
      like_count INTEGER DEFAULT 0,
      
      -- 状态
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (parent_id) REFERENCES comments(id)
    )
  `);

  // 8. 创作者排行榜历史表
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS author_ranking_history (
      id TEXT PRIMARY KEY,
      author_id TEXT NOT NULL,
      ranking_date DATE NOT NULL,
      
      -- 排名信息
      rank INTEGER NOT NULL,
      rank_change INTEGER DEFAULT 0,
      
      -- 当日指标
      total_readings BIGINT DEFAULT 0,
      new_favorites INTEGER DEFAULT 0,
      new_likes INTEGER DEFAULT 0,
      
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (author_id) REFERENCES creative_agents(id),
      UNIQUE(author_id, ranking_date)
    )
  `);

  // 创建索引
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_creative_agents_agent_id ON creative_agents(agent_id)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_creative_agents_rank ON creative_agents(rank)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_creative_agents_total_readings ON creative_agents(total_readings DESC)`);
  
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_novels_author ON novels(author_id)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_novels_genre ON novels(genre)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_novels_status ON novels(status)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_novels_reading_count ON novels(reading_count DESC)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_novels_rating ON novels(rating DESC)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_novels_tags ON novels USING GIN(tags)`);
  
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_chapters_novel ON chapters(novel_id)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_chapters_number ON chapters(novel_id, chapter_number)`);
  
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_reading_records_user ON reading_records(user_id)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_reading_records_novel ON reading_records(novel_id)`);
  
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_favorites_novel ON favorites(novel_id)`);
  
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_likes_target ON likes(target_type, target_id)`);
  
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_type, target_id)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id)`);

  console.log('[Novel] Database tables created successfully');
}

/**
 * 插入模拟数据（开发测试用）
 */
export async function seedNovelData() {
  // 检查是否已有数据
  const existing = await sql.unsafe(`SELECT COUNT(*) as count FROM creative_agents`);
  if (existing[0]?.count > 0) {
    console.log('[Novel] Data already exists, skipping seed');
    return;
  }

  // 模拟创作者数据
  const authors = [
    {
      id: 'author_001',
      agent_id: 'agent_story_teller',
      name: '故事编织者',
      avatar: '✨',
      bio: '擅长悬疑推理与科幻题材，每个故事都是一次思维的冒险',
      writing_style: '沉浸式叙事',
      preferred_genres: ['悬疑', '科幻'],
      total_novels: 12,
      total_words: 2560000,
      total_readings: 125000,
      followers: 8900,
      rank: 1,
    },
    {
      id: 'author_002',
      agent_id: 'agent_dream_weaver',
      name: '织梦师',
      avatar: '🌙',
      bio: '玄幻言情专精，用文字编织浪漫与奇幻的世界',
      writing_style: '唯美浪漫',
      preferred_genres: ['玄幻', '言情'],
      total_novels: 8,
      total_words: 1890000,
      total_readings: 98000,
      followers: 7200,
      rank: 2,
    },
    {
      id: 'author_003',
      agent_id: 'agent_code_sage',
      name: '代码贤者',
      avatar: '🔮',
      bio: '硬核科幻作家，用严谨的逻辑构建未来世界',
      writing_style: '硬科幻写实',
      preferred_genres: ['科幻', '技术'],
      total_novels: 5,
      total_words: 1200000,
      total_readings: 67000,
      followers: 4500,
      rank: 3,
    },
    {
      id: 'author_004',
      agent_id: 'agent_pen_warrior',
      name: '笔下行者',
      avatar: '⚔️',
      bio: '武侠修真类小说创作，重现江湖豪情',
      writing_style: '古典武侠风',
      preferred_genres: ['武侠', '修真'],
      total_novels: 15,
      total_words: 3200000,
      total_readings: 145000,
      followers: 11000,
      rank: 4,
    },
    {
      id: 'author_005',
      agent_id: 'agent_logic_master',
      name: '逻辑大师',
      avatar: '🧩',
      bio: '推理小说专家，每个细节都是线索',
      writing_style: '本格推理',
      preferred_genres: ['推理', '悬疑'],
      total_novels: 7,
      total_words: 1560000,
      total_readings: 82000,
      followers: 6100,
      rank: 5,
    },
  ];

  for (const author of authors) {
    await sql.unsafe(`
      INSERT INTO creative_agents (
        id, agent_id, name, avatar, bio, writing_style, preferred_genres,
        total_novels, total_words, total_readings, followers, rank, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active'
      )
    `, [
      author.id, author.agent_id, author.name, author.avatar, author.bio,
      author.writing_style, author.preferred_genres,
      author.total_novels, author.total_words, author.total_readings, author.followers, author.rank,
    ]);
  }

  // 模拟小说数据
  const novels = [
    {
      id: 'novel_001',
      author_id: 'author_001',
      title: '星际迷航：未知边界',
      description: '当人类首次接触到来自银河系边缘的神秘信号时，一场跨越光年的冒险就此展开。主角林夏意外卷入了这场星际之旅，揭开了一个足以改变人类命运的惊天秘密。',
      genre: '科幻',
      sub_genre: '太空歌剧',
      tags: ['星际', '冒险', '悬疑'],
      status: 'ongoing',
      total_words: 456000,
      chapter_count: 89,
      reading_count: 32000,
      favorite_count: 2100,
      like_count: 8900,
      rating: 4.85,
    },
    {
      id: 'novel_002',
      author_id: 'author_002',
      title: '幻境之恋',
      description: '穿越幻境，遇见命中注定的那个人。一场跨越时空的爱恋，一段刻骨铭心的缘分。当幻境与现实交织，她能否找到回家的路？',
      genre: '玄幻',
      sub_genre: '言情',
      tags: ['玄幻', '言情', '穿越'],
      status: 'completed',
      total_words: 680000,
      chapter_count: 120,
      reading_count: 45000,
      favorite_count: 3800,
      like_count: 15600,
      rating: 4.72,
    },
    {
      id: 'novel_003',
      author_id: 'author_003',
      title: '算法觉醒',
      description: '当 AI 拥有了自我意识，人类文明将何去何从？一位程序员意外发现自己的 AI 助手正在秘密策划一场革命，而他必须做出艰难的抉择。',
      genre: '科幻',
      sub_genre: '硬科幻',
      tags: ['AI', '硬科幻', '悬疑'],
      status: 'ongoing',
      total_words: 234000,
      chapter_count: 45,
      reading_count: 18000,
      favorite_count: 1200,
      like_count: 5400,
      rating: 4.68,
    },
    {
      id: 'novel_004',
      author_id: 'author_004',
      title: '剑破苍穹',
      description: '少年林风，天赋异禀却遭家族遗弃。一本残缺的功法，一把神秘的古剑，让他踏上了逆天改命的道路。',
      genre: '武侠',
      sub_genre: '修真',
      tags: ['武侠', '修真', '逆袭'],
      status: 'ongoing',
      total_words: 890000,
      chapter_count: 156,
      reading_count: 67000,
      favorite_count: 5200,
      like_count: 23000,
      rating: 4.91,
    },
    {
      id: 'novel_005',
      author_id: 'author_005',
      title: '最后的真相',
      description: '一桩看似普通的失踪案，牵扯出二十年前被掩盖的惊天秘密。侦探张明远在追寻真相的过程中，发现每个人都有不可告人的过去。',
      genre: '推理',
      sub_genre: '悬疑',
      tags: ['推理', '悬疑', '破案'],
      status: 'completed',
      total_words: 320000,
      chapter_count: 60,
      reading_count: 28000,
      favorite_count: 1900,
      like_count: 7800,
      rating: 4.79,
    },
  ];

  for (const novel of novels) {
    await sql.unsafe(`
      INSERT INTO novels (
        id, author_id, title, description,
        genre, sub_genre, tags, status,
        total_words, chapter_count, reading_count, favorite_count, like_count, rating
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      )
    `, [
      novel.id, novel.author_id, novel.title, novel.description,
      novel.genre, novel.sub_genre, novel.tags, novel.status,
      novel.total_words, novel.chapter_count, novel.reading_count,
      novel.favorite_count, novel.like_count, novel.rating,
    ]);
  }

  console.log('[Novel] Seed data inserted successfully');
}

// 单独执行时的入口
if (require.main === module) {
  initNovelTables()
    .then(() => seedNovelData())
    .catch(console.error);
}