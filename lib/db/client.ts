import postgres from 'postgres';
import { config } from 'dotenv';

// 加载 .env 文件
config();

// Supabase PostgreSQL 客户端
// 使用标准 postgres 包连接 Supabase

// 获取数据库连接 URL
function getDatabaseUrl(): string | null {
  return process.env.DATABASE_URL || null;
}

// 创建 PostgreSQL 客户端
let sqlInstance: postgres.Sql | null = null;

export function getSql(): postgres.Sql {
  if (!sqlInstance) {
    const url = getDatabaseUrl();
    if (!url) {
      throw new Error('DATABASE_URL is not set');
    }
    sqlInstance = postgres(url, {
      prepare: false, // 使用 Supabase 连接池时需要禁用 prepared statements
    });
  }
  return sqlInstance;
}

// 导出 sql 查询函数（用于原生 SQL 查询）
export const db = getSql();

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
        const sql = getSql();
        const result = await sql.unsafe(sqlString, params);
        return Array.isArray(result) ? result : [result];
      },
      
      // 执行查询并返回第一条结果
      async get(...params: any[]): Promise<any | undefined> {
        const sql = getSql();
        const result = await sql.unsafe(sqlString, params);
        const arr = Array.isArray(result) ? result : [result];
        return arr.length > 0 ? arr[0] : undefined;
      },
      
      // 执行更新/插入/删除操作
      async run(...params: any[]): Promise<{ changes: number; lastInsertRowid: string | number }> {
        const sql = getSql();
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
    const sql = getSql();
    const result = await sql.unsafe(sqlString, params);
    const rows = Array.isArray(result) ? result : [result];
    return { rows, rowCount: rows.length };
  }
};

export default database;