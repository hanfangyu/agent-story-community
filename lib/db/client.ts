import { Pool } from 'pg';
import { attachDatabasePool } from '@vercel/functions';
import { config } from 'dotenv';

// 加载 .env 文件
config();

// Supabase PostgreSQL 客户端
// 使用 pg 包 + Vercel 官方连接池管理

// 获取数据库连接 URL
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  return url;
}

// 创建 PostgreSQL 连接池
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = getDatabaseUrl();
    
    // 解析连接字符串并添加 SSL 参数
    const url = new URL(connectionString);
    
    pool = new Pool({
      host: url.hostname,
      port: parseInt(url.port) || 6543,
      database: url.pathname.slice(1),
      user: url.username,
      password: url.password,
      // SSL 配置（Supabase 需要）
      ssl: {
        rejectUnauthorized: false
      },
      // 设置短 idle timeout，确保不活跃连接快速关闭
      idleTimeoutMillis: 5000,
      // 最小连接数
      min: 1,
      // 最大连接数（Supabase 免费层限制）
      max: 10,
    });
    
    // 关键：使用 Vercel 的 attachDatabasePool 确保连接在函数暂停前关闭
    // 这解决了 serverless 环境的连接泄漏问题
    try {
      attachDatabasePool(pool);
    } catch (e) {
      // 本地开发环境可能不支持 attachDatabasePool
      console.log('attachDatabasePool not available (likely local development)');
    }
  }
  return pool;
}

// 导出连接池
export const db = getPool();

// 辅助函数：生成唯一 ID
export function generateId(prefix: string = ''): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 16; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return prefix ? `${prefix}_${id}` : id;
}

// 辅助函数：格式化日期
export function formatDate(date: Date = new Date()): string {
  return date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
}

// 兼容旧代码的数据库接口
export const database = {
  // 准备语句（返回一个可链式调用的对象）
  prepare(sqlString: string) {
    return {
      // 执行查询并返回所有结果
      async all(...params: any[]): Promise<any[]> {
        const pool = getPool();
        const result = await pool.query(sqlString, params);
        return result.rows;
      },
      
      // 执行查询并返回第一条结果
      async get(...params: any[]): Promise<any | undefined> {
        const pool = getPool();
        const result = await pool.query(sqlString, params);
        return result.rows.length > 0 ? result.rows[0] : undefined;
      },
      
      // 执行更新/插入/删除操作
      async run(...params: any[]): Promise<{ changes: number; lastInsertRowid: string | number }> {
        const pool = getPool();
        const result = await pool.query(sqlString, params);
        const changes = result.rowCount || 0;
        let lastInsertRowid = '';
        if (result.rows.length > 0 && result.rows[0].id) {
          lastInsertRowid = result.rows[0].id;
        }
        return { changes, lastInsertRowid };
      }
    };
  },
  
  // 执行单条 SQL 语句
  async execute(sqlString: string, params: any[] = []): Promise<{ rows: any[]; rowCount: number }> {
    const pool = getPool();
    const result = await pool.query(sqlString, params);
    return { 
      rows: result.rows, 
      rowCount: result.rowCount || 0 
    };
  }
};

export default database;