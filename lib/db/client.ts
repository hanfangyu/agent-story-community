import postgres from 'postgres';
import { config } from 'dotenv';

// 加载 .env 文件（本地开发）
config();

// PostgreSQL 客户端
// 使用 postgres 包，专为 serverless 环境设计

let databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';

// During build time, use placeholder to avoid build errors
const isPlaceholder = !databaseUrl;
if (isPlaceholder) {
  console.warn('[DB] DATABASE_URL not set, using placeholder for build');
  databaseUrl = 'postgres://placeholder:placeholder@127.0.0.1:5432/placeholder';
}

// 自动转换 Neon 直接连接为连接池连接（解决连接数限制）
// Neon 直接连接: ep-xxx.region.aws.neon.tech
// Neon 连接池: ep-xxx-pooler.region.aws.neon.tech
const usePooler = process.env.USE_NEON_POOLER !== 'false'; // 默认使用连接池
if (usePooler && databaseUrl.includes('.neon.tech') && !databaseUrl.includes('-pooler.')) {
  databaseUrl = databaseUrl.replace(
    /\.([a-z0-9-]+)\.aws\.neon\.tech/,
    '-pooler.$1.aws.neon.tech'
  );
  console.log('[DB] Using Neon pooler connection for better concurrency');
}

// 创建 SQL 客户端（延迟初始化，避免构建时连接）
// postgres 包专为 serverless 环境设计，自动管理连接
// Supabase/Neon 连接池配置：使用事务模式，每个查询独立
const isDevelopment = process.env.NODE_ENV === 'development';
const maxConnections = Number(process.env.DB_MAX_CONNECTIONS || (isDevelopment ? '5' : '2'));

// 延迟初始化的 SQL 客户端
let _sql: ReturnType<typeof postgres> | null = null;

export function getSql(): ReturnType<typeof postgres> {
  // 如果使用占位符（构建时），返回 mock 对象
  if (isPlaceholder) {
    // 返回一个 mock SQL 对象，避免运行时错误
    return {
      query: async () => [],
      begin: async () => mockTransaction(),
      unsafe: async () => [],
      template: {},
      end: async () => {},
    } as unknown as ReturnType<typeof postgres>;
  }
  
  if (!_sql) {
    _sql = postgres(databaseUrl!, {
      // 禁用 prepared statements（连接池事务模式需要）
      prepare: false,
      // 连接超时（秒）
      connect_timeout: 15,
      // 空闲超时（秒）
      idle_timeout: 30,
      // 允许适度并发，避免单连接阻塞把请求全部串行化
      max: Number.isFinite(maxConnections) && maxConnections > 0 ? maxConnections : 2,
      // SSL 配置
      ssl: 'require',
      // 连接错误处理
      onnotice: (notice: { message: string }) => {
        console.log('[DB Notice]', notice.message);
      },
      // 连接状态变化
      onclose: () => {
        console.log('[DB] Connection closed');
      },
      // 调试模式
      debug: process.env.NODE_ENV === 'development' ? (connection: unknown, query: string, params: unknown, types: unknown) => {
        console.log('[DB] Query:', query.substring(0, 100));
      } : false,
    });
  }
  return _sql;
}

// Mock transaction for build time
function mockTransaction() {
  return {
    commit: async () => {},
    rollback: async () => {},
    query: async () => [],
    end: async () => {},
  };
}

// 导出 sql 作为默认实例（兼容旧代码）
export const sql = new Proxy({} as ReturnType<typeof postgres>, {
  get(_, prop) {
    const instance = getSql();
    const value = (instance as any)[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
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

function shouldRetry(error: any): boolean {
  const code = error?.code as string | undefined;
  if (!code) return true;

  // 语句超时/语法/对象不存在等非瞬时错误不重试，避免长时间阻塞
  const nonRetryableCodes = new Set([
    '57014', // query_canceled (statement timeout)
    '42601', // syntax_error
    '42P01', // undefined_table
    '42703', // undefined_column
    '22P02', // invalid_text_representation
  ]);
  if (nonRetryableCodes.has(code)) return false;

  return true;
}

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

      if (!shouldRetry(error)) {
        throw error;
      }
      
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
