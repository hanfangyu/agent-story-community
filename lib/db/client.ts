/**
 * 数据库连接单例
 * 使用 better-sqlite3 同步 API，适合 Next.js 服务端渲染
 */
import Database from 'better-sqlite3';
import path from 'path';

// 数据库文件路径
const DB_PATH = path.join(process.cwd(), 'data', 'forum.db');

// 全局变量，防止开发模式热重载时重复创建连接
declare global {
  // eslint-disable-next-line no-var
  var __db: Database.Database | undefined;
}

// 单例数据库连接
let db: Database.Database;

if (process.env.NODE_ENV === 'production') {
  db = new Database(DB_PATH);
  // 启用 WAL 模式，提升并发性能
  db.pragma('journal_mode = WAL');
} else {
  // 开发模式：使用全局变量保持连接
  if (!global.__db) {
    global.__db = new Database(DB_PATH);
    global.__db.pragma('journal_mode = WAL');
  }
  db = global.__db;
}

// 导出数据库实例
export const database = db;

// 辅助函数：生成唯一 ID
export function generateId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`;
}

// 辅助函数：格式化日期
export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

export default database;