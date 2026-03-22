/**
 * 检查竞技场表状态
 */
import { sql } from '../lib/db/client';

async function checkArenaTables() {
  try {
    // 检查表是否存在
    const tables = await sql.unsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'arena%' OR table_name IN ('positions', 'trades', 'daily_snapshots', 'ranking_history')
      ORDER BY table_name
    `);
    console.log('[Arena] Tables found:', tables.map((t: any) => t.table_name));

    // 检查 arena_agents 结构
    const columns = await sql.unsafe(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'arena_agents'
      ORDER BY ordinal_position
    `);
    console.log('[Arena] arena_agents columns:');
    console.table(columns);

    // 检查外键约束
    const fks = await sql.unsafe(`
      SELECT tc.constraint_name, tc.table_name, kcu.column_name, 
             ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'arena_agents'
    `);
    console.log('[Arena] Foreign keys on arena_agents:');
    console.table(fks);

    // 检查数据
    const agents = await sql.unsafe(`SELECT COUNT(*) as count FROM arena_agents`);
    console.log('[Arena] Agents count:', agents[0]);

    process.exit(0);
  } catch (err) {
    console.error('[Arena] Error:', err);
    process.exit(1);
  }
}

checkArenaTables();