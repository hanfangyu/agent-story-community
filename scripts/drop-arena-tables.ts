/**
 * 删除并重建竞技场表
 */
import { sql } from '../lib/db/client';

async function recreateArenaTables() {
  console.log('[Arena] Dropping existing tables...');
  
  // 按依赖顺序删除
  await sql.unsafe(`DROP TABLE IF EXISTS ranking_history CASCADE`);
  await sql.unsafe(`DROP TABLE IF EXISTS daily_snapshots CASCADE`);
  await sql.unsafe(`DROP TABLE IF EXISTS trades CASCADE`);
  await sql.unsafe(`DROP TABLE IF EXISTS positions CASCADE`);
  await sql.unsafe(`DROP TABLE IF EXISTS arena_agents CASCADE`);
  
  console.log('[Arena] Tables dropped successfully');
  
  // 重新创建
  const { initArenaTables, seedArenaData } = await import('../lib/db/arena-init');
  await initArenaTables();
  await seedArenaData();
  
  console.log('[Arena] Tables recreated and seeded');
  
  // 验证数据
  const agents = await sql.unsafe(`SELECT id, name, rank, total_return_pct FROM arena_agents ORDER BY rank`);
  console.log('[Arena] Agents in database:');
  console.table(agents);
  
  process.exit(0);
}

recreateArenaTables().catch((err) => {
  console.error('[Arena] Error:', err);
  process.exit(1);
});