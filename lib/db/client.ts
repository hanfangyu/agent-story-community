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
  // 连接超时（增加到 60s，适应 CloudBase 网络环境）
  connect_timeout: 60,
  // 空闲超时（增加到 30s，减少频繁重连）
  idle_timeout: 30,
  // 最大连接数（适合 serverless 环境）
  max: 10,
  // SSL 配置
  ssl: 'require',
  // 连接错误处理
  onnotice: (notice) => {
    console.log('[DB Notice]', notice.message);
  },
  // 连接状态变化
  onclose: () => {
    console.log('[DB] Connection closed');
  },
});

// 健康检查函数
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    console.error('[DB] Connection check failed:', error);
    return false;
  }
}

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

// 重试配置
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,  // 基础延迟 1 秒
  maxDelayMs: 10000,  // 最大延迟 10 秒
};

// 重试包装函数
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string = 'query'
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.error(`[DB] ${operationName} failed (attempt ${attempt}/${RETRY_CONFIG.maxRetries}):`, error.message);
      
      // 如果是连接错误，等待后重试
      if (attempt < RETRY_CONFIG.maxRetries) {
        const delay = Math.min(
          RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt - 1),
          RETRY_CONFIG.maxDelayMs
        );
        console.log(`[DB] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// 兼容旧代码的数据库接口
export const database = {
  // 准备语句（返回一个可链式调用的对象）
  prepare(sqlString: string) {
    return {
      // 执行查询并返回所有结果（带重试）
      async all(...params: any[]): Promise<any[]> {
        return withRetry(async () => {
          const result = await sql.unsafe(sqlString, params);
          return Array.isArray(result) ? result : [result];
        }, 'prepare.all');
      },
      
      // 执行查询并返回第一条结果（带重试）
      async get(...params: any[]): Promise<any | undefined> {
        return withRetry(async () => {
          const result = await sql.unsafe(sqlString, params);
          const arr = Array.isArray(result) ? result : [result];
          return arr.length > 0 ? arr[0] : undefined;
        }, 'prepare.get');
      },
      
      // 执行更新/插入/删除操作（带重试）
      async run(...params: any[]): Promise<{ changes: number; lastInsertRowid: string | number }> {
        return withRetry(async () => {
          const result = await sql.unsafe(sqlString, params);
          const changes = Array.isArray(result) ? result.length : 0;
          let lastInsertRowid = '';
          if (Array.isArray(result) && result.length > 0 && (result[0] as any).id) {
            lastInsertRowid = (result[0] as any).id;
          }
          return { changes, lastInsertRowid };
        }, 'prepare.run');
      }
    };
  },
  
  // 执行单条 SQL 语句（带重试）
  async execute(sqlString: string, params: any[] = []): Promise<{ rows: any[]; rowCount: number }> {
    return withRetry(async () => {
      const result = await sql.unsafe(sqlString, params);
      const rows = Array.isArray(result) ? result : [result];
      return { rows, rowCount: rows.length };
    }, 'execute');
  }
};

export default database;