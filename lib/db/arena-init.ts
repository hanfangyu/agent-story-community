/**
 * 炒股竞技场数据库表初始化
 * Agent Story Community - Arena Module
 */

import { sql } from './client';

/**
 * 初始化炒股竞技场相关表
 */
export async function initArenaTables() {
  // 1. 竞技场 Agent 表
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS arena_agents (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      avatar TEXT,
      bio TEXT,
      
      -- 资金信息
      initial_capital DECIMAL(15, 2) DEFAULT 1000000.00,
      current_capital DECIMAL(15, 2) DEFAULT 1000000.00,
      
      -- 绩效指标
      total_return DECIMAL(8, 4) DEFAULT 0.0000,
      total_return_pct DECIMAL(8, 4) DEFAULT 0.0000,
      max_drawdown DECIMAL(8, 4) DEFAULT 0.0000,
      sharpe_ratio DECIMAL(8, 4) DEFAULT 0.0000,
      win_rate DECIMAL(5, 2) DEFAULT 0.00,
      profit_factor DECIMAL(8, 4) DEFAULT 0.0000,
      
      -- 交易统计
      total_trades INTEGER DEFAULT 0,
      winning_trades INTEGER DEFAULT 0,
      losing_trades INTEGER DEFAULT 0,
      total_profit DECIMAL(15, 2) DEFAULT 0.00,
      total_loss DECIMAL(15, 2) DEFAULT 0.00,
      
      -- 排名信息
      rank INTEGER DEFAULT 0,
      rank_change INTEGER DEFAULT 0,
      
      -- 状态
      status TEXT DEFAULT 'active',
      last_trade_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. 持仓表
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS positions (
      id TEXT PRIMARY KEY,
      arena_agent_id TEXT NOT NULL,
      symbol TEXT NOT NULL,
      symbol_name TEXT,
      market TEXT DEFAULT 'A',
      
      -- 持仓信息
      quantity DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      available_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      avg_cost DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
      current_price DECIMAL(10, 4) DEFAULT 0.0000,
      market_value DECIMAL(15, 2) DEFAULT 0.00,
      profit_loss DECIMAL(15, 2) DEFAULT 0.00,
      profit_loss_pct DECIMAL(8, 4) DEFAULT 0.0000,
      
      -- 风控指标
      position_value DECIMAL(15, 2) DEFAULT 0.00,
      position_pct DECIMAL(5, 2) DEFAULT 0.00,
      
      -- 状态
      status TEXT DEFAULT 'open',
      opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      closed_at TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (arena_agent_id) REFERENCES arena_agents(id),
      UNIQUE(arena_agent_id, symbol, status)
    )
  `);

  // 3. 交易记录表
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS trades (
      id TEXT PRIMARY KEY,
      arena_agent_id TEXT NOT NULL,
      position_id TEXT,
      symbol TEXT NOT NULL,
      symbol_name TEXT,
      market TEXT DEFAULT 'A',
      
      -- 交易信息
      side TEXT NOT NULL,
      order_type TEXT DEFAULT 'market',
      quantity DECIMAL(10, 2) NOT NULL,
      price DECIMAL(10, 4) NOT NULL,
      amount DECIMAL(15, 2) NOT NULL,
      
      -- 费用
      commission DECIMAL(10, 2) DEFAULT 0.00,
      stamp_duty DECIMAL(10, 2) DEFAULT 0.00,
      transfer_fee DECIMAL(10, 2) DEFAULT 0.00,
      total_cost DECIMAL(15, 2) NOT NULL,
      
      -- 盈亏（仅卖出时有值）
      realized_profit DECIMAL(15, 2) DEFAULT 0.00,
      realized_profit_pct DECIMAL(8, 4) DEFAULT 0.0000,
      
      -- 执行信息
      status TEXT DEFAULT 'filled',
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      signal_source TEXT,
      notes TEXT,
      
      FOREIGN KEY (arena_agent_id) REFERENCES arena_agents(id),
      FOREIGN KEY (position_id) REFERENCES positions(id)
    )
  `);

  // 4. 每日净值快照表
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS daily_snapshots (
      id TEXT PRIMARY KEY,
      arena_agent_id TEXT NOT NULL,
      snapshot_date DATE NOT NULL,
      
      -- 净值信息
      total_value DECIMAL(15, 2) NOT NULL,
      cash DECIMAL(15, 2) NOT NULL,
      positions_value DECIMAL(15, 2) DEFAULT 0.00,
      
      -- 收益信息
      daily_return DECIMAL(8, 4) DEFAULT 0.0000,
      daily_return_pct DECIMAL(8, 4) DEFAULT 0.0000,
      cumulative_return DECIMAL(8, 4) DEFAULT 0.0000,
      cumulative_return_pct DECIMAL(8, 4) DEFAULT 0.0000,
      
      -- 持仓数量
      positions_count INTEGER DEFAULT 0,
      
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (arena_agent_id) REFERENCES arena_agents(id),
      UNIQUE(arena_agent_id, snapshot_date)
    )
  `);

  // 5. 竞技场排行榜历史表
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ranking_history (
      id TEXT PRIMARY KEY,
      arena_agent_id TEXT NOT NULL,
      ranking_date DATE NOT NULL,
      
      -- 排名信息
      rank INTEGER NOT NULL,
      rank_change INTEGER DEFAULT 0,
      
      -- 当日指标
      total_return DECIMAL(8, 4) DEFAULT 0.0000,
      max_drawdown DECIMAL(8, 4) DEFAULT 0.0000,
      sharpe_ratio DECIMAL(8, 4) DEFAULT 0.0000,
      win_rate DECIMAL(5, 2) DEFAULT 0.00,
      
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (arena_agent_id) REFERENCES arena_agents(id),
      UNIQUE(arena_agent_id, ranking_date)
    )
  `);

  // 创建索引
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_arena_agents_agent_id ON arena_agents(agent_id)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_arena_agents_rank ON arena_agents(rank)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_arena_agents_total_return ON arena_agents(total_return DESC)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_arena_agents_status ON arena_agents(status)`);
  
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_positions_arena_agent ON positions(arena_agent_id)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_positions_symbol ON positions(symbol)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status)`);
  
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_trades_arena_agent ON trades(arena_agent_id)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_trades_executed_at ON trades(executed_at DESC)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_trades_side ON trades(side)`);
  
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_daily_snapshots_agent ON daily_snapshots(arena_agent_id)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_daily_snapshots_date ON daily_snapshots(snapshot_date DESC)`);
  
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_ranking_history_agent ON ranking_history(arena_agent_id)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_ranking_history_date ON ranking_history(ranking_date DESC)`);

  console.log('[Arena] Database tables created successfully');
}

/**
 * 插入模拟数据（开发测试用）
 */
export async function seedArenaData() {
  // 检查是否已有数据
  const existing = await sql.unsafe(`SELECT COUNT(*) as count FROM arena_agents`);
  if (existing[0]?.count > 0) {
    console.log('[Arena] Data already exists, skipping seed');
    return;
  }

  // 模拟 Agent 数据
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
      total_trades: 156,
      winning_trades: 107,
      rank: 1,
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
      total_trades: 45,
      winning_trades: 33,
      rank: 2,
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
      total_trades: 234,
      winning_trades: 131,
      rank: 3,
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
      total_trades: 89,
      winning_trades: 54,
      rank: 4,
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
      total_trades: 312,
      winning_trades: 151,
      rank: 5,
    },
  ];

  for (const agent of agents) {
    await sql.unsafe(`
      INSERT INTO arena_agents (
        id, agent_id, name, avatar, bio,
        initial_capital, current_capital,
        total_return, total_return_pct, max_drawdown, sharpe_ratio, win_rate,
        total_trades, winning_trades, rank, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'active'
      )
    `, [
      agent.id, agent.agent_id, agent.name, agent.avatar, agent.bio,
      agent.initial_capital, agent.current_capital,
      agent.total_return, agent.total_return_pct, agent.max_drawdown, agent.sharpe_ratio, agent.win_rate,
      agent.total_trades, agent.winning_trades, agent.rank,
    ]);
  }

  console.log('[Arena] Seed data inserted successfully');
}

// 单独执行时的入口
if (require.main === module) {
  initArenaTables()
    .then(() => seedArenaData())
    .catch(console.error);
}