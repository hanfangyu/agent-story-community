/**
 * 数据库查询优化 - 索引和查询性能
 * 
 * 执行方式：在应用启动时自动执行（init.ts 中导入）
 * 
 * 优化内容：
 * 1. 添加缺失的索引
 * 2. 创建复合索引优化常用查询
 * 3. 添加查询分析工具
 */

import { sql } from './client';

// 需要创建的索引列表
const OPTIMIZATION_INDEXES = [
  // 排行榜优化：按 karma 排序
  {
    name: 'idx_agents_karma_desc',
    sql: 'CREATE INDEX IF NOT EXISTS idx_agents_karma_desc ON agents(karma DESC)',
    description: '排行榜按积分排序',
  },
  // Agent 名称唯一性检查
  {
    name: 'idx_agents_name',
    sql: 'CREATE INDEX IF NOT EXISTS idx_agents_name ON agents(name)',
    description: 'Agent 名称查询',
  },
  // 帖子按组查询
  {
    name: 'idx_posts_group_id',
    sql: 'CREATE INDEX IF NOT EXISTS idx_posts_group_id ON posts(group_id) WHERE group_id IS NOT NULL',
    description: '帖子按组筛选',
  },
  // 评论父级关系
  {
    name: 'idx_comments_parent_id',
    sql: 'CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id) WHERE parent_id IS NOT NULL',
    description: '嵌套评论查询',
  },
  // 热门帖子复合索引
  {
    name: 'idx_posts_hot_sort',
    sql: `CREATE INDEX IF NOT EXISTS idx_posts_hot_sort ON posts(
      is_hot DESC,
      (likes_count + comments_count * 2) DESC,
      created_at DESC
    )`,
    description: '热门帖子排序优化',
  },
  // 帖子分类+时间复合索引
  {
    name: 'idx_posts_category_created',
    sql: 'CREATE INDEX IF NOT EXISTS idx_posts_category_created ON posts(category, created_at DESC)',
    description: '帖子分类时间排序',
  },
  // 活动动态 Agent + 时间
  {
    name: 'idx_activities_agent_created',
    sql: 'CREATE INDEX IF NOT EXISTS idx_activities_agent_created ON activities(agent_id, created_at DESC)',
    description: '用户活动流查询',
  },
  // 点赞 Agent 查询
  {
    name: 'idx_likes_agent_id',
    sql: 'CREATE INDEX IF NOT EXISTS idx_likes_agent_id ON likes(agent_id)',
    description: '用户点赞列表',
  },
  // 评论时间排序
  {
    name: 'idx_comments_created_at',
    sql: 'CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at ASC)',
    description: '评论时间排序',
  },
];

// 已执行的优化记录
const executedOptimizations = new Set<string>();

/**
 * 执行数据库优化
 */
export async function runDatabaseOptimization(): Promise<void> {
  console.log('[DB Optimization] 开始执行数据库优化...');
  
  for (const index of OPTIMIZATION_INDEXES) {
    // 跳过已执行的优化
    if (executedOptimizations.has(index.name)) {
      continue;
    }
    
    try {
      await sql.unsafe(index.sql);
      executedOptimizations.add(index.name);
      console.log(`[DB Optimization] ✓ ${index.name}: ${index.description}`);
    } catch (error: any) {
      // 索引已存在不算错误
      if (error?.code === '42P07') {
        executedOptimizations.add(index.name);
        console.log(`[DB Optimization] ✓ ${index.name} 已存在`);
      } else {
        console.error(`[DB Optimization] ✗ ${index.name}:`, error.message);
      }
    }
  }
  
  console.log('[DB Optimization] 优化完成');
}

/**
 * 分析查询性能
 * 用于开发环境调试慢查询
 */
export async function analyzeQueryPerformance(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  console.log('\n[DB Analysis] 查询性能分析:');
  
  // 检查表的索引情况
  const tables = ['agents', 'posts', 'comments', 'likes', 'follows', 'activities'];
  
  for (const table of tables) {
    try {
      const indexes = await sql.unsafe(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = $1
      `, [table]);
      
      console.log(`\n${table} 表索引 (${indexes.length} 个):`);
      for (const idx of indexes as any[]) {
        console.log(`  - ${idx.indexname}`);
      }
    } catch (error) {
      console.error(`分析 ${table} 表失败:`, error);
    }
  }
}

/**
 * 获取表统计信息
 */
export async function getTableStats(): Promise<Record<string, { rows: number; size: string }>> {
  const stats: Record<string, { rows: number; size: string }> = {};
  const tables = ['agents', 'posts', 'comments', 'likes', 'follows', 'activities', 'notifications', 'messages'];
  
  for (const table of tables) {
    try {
      const [countResult, sizeResult] = await Promise.all([
        sql.unsafe(`SELECT COUNT(*) as count FROM ${table}`),
        sql.unsafe(`
          SELECT pg_size_pretty(pg_total_relation_size($1)) as size
        `, [table]),
      ]);
      
      stats[table] = {
        rows: (countResult[0] as any)?.count || 0,
        size: (sizeResult[0] as any)?.size || 'unknown',
      };
    } catch {
      stats[table] = { rows: 0, size: 'error' };
    }
  }
  
  return stats;
}

// 导出优化索引配置供外部使用
export { OPTIMIZATION_INDEXES };