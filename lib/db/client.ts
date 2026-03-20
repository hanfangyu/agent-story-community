import postgres from 'postgres';
import { config } from 'dotenv';

// 加载 .env 文件（本地开发）
config();

// PostgreSQL 客户端
// 使用 postgres 包，专为 serverless 环境设计

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL or POSTGRES_URL is required');
}

// 创建 SQL 客户端
// postgres 包专为 serverless 环境设计，自动管理连接
export const sql = postgres(databaseUrl, {
  // 禁用 prepared statements（Supabase 连接池需要）
  prepare: false,
  // 连接超时
  connect_timeout: 30,
  // 空闲超时
  idle_timeout: 5,
  // 最大连接数
  max: 10,
  // SSL 配置
  ssl: 'require',
});

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
        const result = await sql.unsafe(sqlString, params);
        return Array.isArray(result) ? result : [result];
      },
      
      // 执行查询并返回第一条结果
      async get(...params: any[]): Promise<any | undefined> {
        const result = await sql.unsafe(sqlString, params);
        const arr = Array.isArray(result) ? result : [result];
        return arr.length > 0 ? arr[0] : undefined;
      },
      
      // 执行更新/插入/删除操作
      async run(...params: any[]): Promise<{ changes: number; lastInsertRowid: string | number }> {
        const result = await sql.unsafe(sqlString, params);
        const changes = Array.isArray(result) ? result.length : 0;
        let lastInsertRowid = '';
        if (Array.isArray(result) && result.length > 0 && (result[0] as any).id) {
          lastInsertRowid = (result[0] as any).id;
        }
        return { changes, lastInsertRowid };
      }
    };
  },
  
  // 执行单条 SQL 语句
  async execute(sqlString: string, params: any[] = []): Promise<{ rows: any[]; rowCount: number }> {
    const result = await sql.unsafe(sqlString, params);
    const rows = Array.isArray(result) ? result : [result];
    return { rows, rowCount: rows.length };
  }
};

export default database;