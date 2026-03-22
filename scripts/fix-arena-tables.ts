/**
 * 修复竞技场表：删除外键约束并插入模拟数据
 */
import { sql } from '../lib/db/client';

async function fixArenaTables() {
  try {
    console.log('[Arena] Dropping foreign key constraint...');
    
    // 删除外键约束
    await sql.unsafe(`
      ALTER TABLE arena_agents DROP CONSTRAINT IF EXISTS arena_agents_agent_id_fkey
    `);
    console.log('[Arena] Foreign key constraint dropped');

    // 删除其他表的残留（如果存在）
    await sql.unsafe(`DROP TABLE IF EXISTS positions CASCADE`);
    await sql.unsafe(`DROP TABLE IF EXISTS trades CASCADE`);
    await sql.unsafe(`DROP TABLE IF EXISTS daily_snapshots CASCADE`);
    await sql.unsafe(`DROP TABLE IF EXISTS ranking_history CASCADE`);
    console.log('[Arena] Related tables dropped');

    // 清空 arena_agents
    await sql.unsafe(`TRUNCATE TABLE arena_agents`);
    console.log('[Arena] arena_agents truncated');

    // 插入模拟数据
    const agents = [
      {
        id: 'arena_001',
        agent_id: 'agent_quant_master',
        name: '量化大师',
        avatar: '🤖',
        bio: '基于多因子模型的量化交易 Agent',
        initial_capital: 1000000,
        current_capital: 1234567.89,
        total_return: 0.2346,
        total_return_pct: 23.46,
        max_drawdown: 0.0823,
        sharpe_ratio: 2.15,
        win_rate: 68.5,
        profit_factor: 2.34,
        total_trades: 156,
        winning_trades: 107,
        losing_trades: 49,
        total_profit: 287456.78,
        total_loss: 53888.89,
        rank: 1,
        rank_change: 0,
      },
      {
        id: 'arena_002',
        agent_id: 'agent_value_hunter',
        name: '价值猎手',
        avatar: '🎯',
        bio: '专注价值投资，长期持有优质标的',
        initial_capital: 1000000,
        current_capital: 1156789.45,
        total_return: 0.1568,
        total_return_pct: 15.68,
        max_drawdown: 0.0512,
        sharpe_ratio: 1.89,
        win_rate: 72.3,
        profit_factor: 3.12,
        total_trades: 45,
        winning_trades: 33,
        losing_trades: 12,
        total_profit: 178234.56,
        total_loss: 21445.11,
        rank: 2,
        rank_change: 1,
      },
      {
        id: 'arena_003',
        agent_id: 'agent_trend_rider',
        name: '趋势骑士',
        avatar: '📈',
        bio: '趋势跟踪策略，顺势而为',
        initial_capital: 1000000,
        current_capital: 1089234.56,
        total_return: 0.0892,
        total_return_pct: 8.92,
        max_drawdown: 0.1234,
        sharpe_ratio: 1.42,
        win_rate: 55.8,
        profit_factor: 1.56,
        total_trades: 234,
        winning_trades: 131,
        losing_trades: 103,
        total_profit: 156789.23,
        total_loss: 67554.67,
        rank: 3,
        rank_change: -1,
      },
      {
        id: 'arena_004',
        agent_id: 'agent_risk_balancer',
        name: '风险平衡者',
        avatar: '⚖️',
        bio: '多资产配置，风险平价策略',
        initial_capital: 1000000,
        current_capital: 1056789.12,
        total_return: 0.0568,
        total_return_pct: 5.68,
        max_drawdown: 0.0321,
        sharpe_ratio: 1.65,
        win_rate: 61.2,
        profit_factor: 1.89,
        total_trades: 89,
        winning_trades: 54,
        losing_trades: 35,
        total_profit: 78456.34,
        total_loss: 21667.22,
        rank: 4,
        rank_change: 2,
      },
      {
        id: 'arena_005',
        agent_id: 'agent_ai_predictor',
        name: 'AI 预测家',
        avatar: '🧠',
        bio: '基于深度学习的股价预测模型',
        initial_capital: 1000000,
        current_capital: 982345.67,
        total_return: -0.0177,
        total_return_pct: -1.77,
        max_drawdown: 0.1567,
        sharpe_ratio: 0.89,
        win_rate: 48.5,
        profit_factor: 0.95,
        total_trades: 312,
        winning_trades: 151,
        losing_trades: 161,
        total_profit: 89234.56,
        total_loss: 106889.89,
        rank: 5,
        rank_change: -2,
      },
    ];

    for (const agent of agents) {
      await sql.unsafe(`
        INSERT INTO arena_agents (
          id, agent_id, name, avatar, bio,
          initial_capital, current_capital,
          total_return, total_return_pct, max_drawdown, sharpe_ratio, win_rate, profit_factor,
          total_trades, winning_trades, losing_trades, total_profit, total_loss,
          rank, rank_change, status
        ) VALUES (
          '${agent.id}', '${agent.agent_id}', '${agent.name}', '${agent.avatar}', '${agent.bio}',
          ${agent.initial_capital}, ${agent.current_capital},
          ${agent.total_return}, ${agent.total_return_pct}, ${agent.max_drawdown}, ${agent.sharpe_ratio}, ${agent.win_rate}, ${agent.profit_factor},
          ${agent.total_trades}, ${agent.winning_trades}, ${agent.losing_trades}, ${agent.total_profit}, ${agent.total_loss},
          ${agent.rank}, ${agent.rank_change}, 'active'
        )
      `);
    }

    console.log('[Arena] Mock data inserted');

    // 验证数据
    const result = await sql.unsafe(`
      SELECT id, name, rank, total_return_pct, win_rate 
      FROM arena_agents 
      ORDER BY rank
    `);
    console.log('[Arena] Data verification:');
    console.table(result);

    console.log('[Arena] ✅ Fix completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('[Arena] Error:', err);
    process.exit(1);
  }
}

fixArenaTables();