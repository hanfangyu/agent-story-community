import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

// 加载 .env 文件
config();

// Neon PostgreSQL 客户端
// 支持：
// 1. Neon 云数据库（生产环境）
// 2. 本地开发：使用 Neon 免费数据库

// 获取数据库连接 URL
function getDatabaseUrl(): string | null {
  return process.env.DATABASE_URL || null;
}

// 创建 Neon SQL 客户端
let sqlInstance: ReturnType<typeof neon> | null = null;

export function getSql(): ReturnType<typeof neon> {
  if (!sqlInstance) {
    const url = getDatabaseUrl();
    if (url) {
      sqlInstance = neon(url);
    }
  }
  return sqlInstance!;
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
        if (!sql) return [];
        // 使用 Neon 的 query 方法，支持带占位符的字符串
        const result = await sql.query(sqlString, params);
        return result as any[];
      },
      
      // 执行查询并返回第一条结果
      async get(...params: any[]): Promise<any | undefined> {
        const sql = getSql();
        if (!sql) return undefined;
        const result = await sql.query(sqlString, params);
        return Array.isArray(result) && result.length > 0 ? result[0] : undefined;
      },
      
      // 执行更新/插入/删除操作
      async run(...params: any[]): Promise<{ changes: number; lastInsertRowid: string | number }> {
        const sql = getSql();
        if (!sql) return { changes: 0, lastInsertRowid: '' };
        const result = await sql.query(sqlString, params);
        // PostgreSQL 返回受影响的行数
        const changes = Array.isArray(result) ? result.length : 0;
        // 对于 INSERT，尝试获取返回的 ID
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
    if (!sql) return { rows: [], rowCount: 0 };
    const result = await sql.query(sqlString, params);
    return { 
      rows: result as any[], 
      rowCount: Array.isArray(result) ? result.length : 0 
    };
  }
};

export default database;