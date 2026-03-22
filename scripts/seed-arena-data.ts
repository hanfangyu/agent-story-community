/**
 * 炒股竞技场模拟数据生成脚本
 * 
 * 使用方法：
 *   pnpm seed:arena
 * 
 * 生成内容：
 *   - 20 个模拟 Agent（不同策略风格）
 *   - 每个 Agent 3-8 个持仓
 *   - 每个 Agent 50-200 条交易记录
 *   - 过去 30 天的每日净值快照
 *   - 排名历史记录
 */

import { sql } from '../lib/db/client';

// ============== 配置 ==============

const CONFIG = {
  agentCount: 20,
  daysHistory: 30,
  minPositions: 3,
  maxPositions: 8,
  minTrades: 50,
  maxTrades: 200,
  initialCapital: 1000000,
};

// 股票池
const STOCK_POOL = [
  { symbol: '600519', name: '贵州茅台', market: 'A' },
  { symbol: '000858', name: '五粮液', market: 'A' },
  { symbol: '601318', name: '中国平安', market: 'A' },
  { symbol: '000001', name: '平安银行', market: 'A' },
  { symbol: '002594', name: '比亚迪', market: 'A' },
  { symbol: '601012', name: '隆基绿能', market: 'A' },
  { symbol: '300750', name: '宁德时代', market: 'A' },
  { symbol: '600036', name: '招商银行', market: 'A' },
  { symbol: '000333', name: '美的集团', market: 'A' },
  { symbol: '002475', name: '立讯精密', market: 'A' },
  { symbol: '601888', name: '中国中免', market: 'A' },
  { symbol: '300059', name: '东方财富', market: 'A' },
  { symbol: '600900', name: '长江电力', market: 'A' },
  { symbol: '002415', name: '海康威视', market: 'A' },
  { symbol: '600276', name: '恒瑞医药', market: 'A' },
];

// Agent 名字池
const AGENT_NAMES = [
  { name: '量化大师', avatar: '🤖', bio: '多因子量化策略，追求稳定收益' },
  { name: '价值猎手', avatar: '🎯', bio: '深度价值投资，长期持有优质标的' },
  { name: '趋势骑士', avatar: '📈', bio: '趋势跟踪策略，顺势而为' },
  { name: '风险平衡者', avatar: '⚖️', bio: '多资产配置，风险平价策略' },
  { name: 'AI 预测家', avatar: '🧠', bio: '深度学习股价预测，数据驱动决策' },
  { name: '波段高手', avatar: '🌊', bio: '精准捕捉波段机会，快进快出' },
  { name: '成长猎人', avatar: '🦅', bio: '专注高成长标的，捕捉十倍股' },
  { name: '红利收割机', avatar: '💰', bio: '高股息策略，稳健收益为王' },
  { name: '技术派宗师', avatar: '📊', bio: '经典技术分析，K线说话' },
  { name: '逆向投资者', avatar: '🔄', bio: '人弃我取，逆势布局' },
  { name: '赛道精选者', avatar: '🏁', bio: '深耕优质赛道，龙头为王' },
  { name: '套利猎人', avatar: '🎰', bio: '捕捉市场定价错误，低风险套利' },
  { name: '宏观对冲者', avatar: '🌍', bio: '宏观视角，全球配置' },
  { name: '事件驱动者', avatar: '📰', bio: '敏锐捕捉市场事件机会' },
  { name: '小盘挖掘机', avatar: '💎', bio: '专注小盘股，发现隐形冠军' },
  { name: '指数增强者', avatar: '📈', bio: '指数增强策略，稳健超额收益' },
  { name: '周期研究员', avatar: '🔄', bio: '周期股专家，把握经济脉搏' },
  { name: '护城河守护者', avatar: '🏰', bio: '只投护城河深厚的企业' },
  { name: '黑马发现者', avatar: '🐴', bio: '寻找被市场低估的黑马股' },
  { name: '复利机器', avatar: '⚙️', bio: '追求稳健复利，时间的朋友' },
];

// 策略风格（影响收益特征）
const STRATEGY_STYLES = [
  { type: 'aggressive', returnBase: 0.15, volatility: 0.25, winRate: 55 },  // 激进型
  { type: 'balanced', returnBase: 0.08, volatility: 0.12, winRate: 60 },    // 平衡型
  { type: 'conservative', returnBase: 0.04, volatility: 0.06, winRate: 65 }, // 保守型
  { type: 'high_frequency', returnBase: 0.12, volatility: 0.18, winRate: 52 }, // 高频
  { type: 'swing', returnBase: 0.10, volatility: 0.15, winRate: 58 },       // 波段
];

// ============== 工具函数 ==============

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  const value = Math.random() * (max - min) + min;
  return Number(value.toFixed(decimals));
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSubset<T>(arr: T[], min: number, max: number): T[] {
  const count = randomInRange(min, max);
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// 计算夏普比率
function calculateSharpeRatio(returns: number[], riskFreeRate: number = 0.03): number {
  if (returns.length === 0) return 0;
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  if (stdDev === 0) return 0;
  return Number(((avgReturn - riskFreeRate / 252) / stdDev * Math.sqrt(252)).toFixed(4));
}

// 计算最大回撤
function calculateMaxDrawdown(values: number[]): number {
  if (values.length === 0) return 0;
  let maxDrawdown = 0;
  let peak = values[0];
  
  for (const value of values) {
    if (value > peak) peak = value;
    const drawdown = (peak - value) / peak;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  
  return Number(maxDrawdown.toFixed(4));
}

// ============== 数据生成函数 ==============

interface AgentData {
  id: string;
  agentId: string;
  name: string;
  avatar: string;
  bio: string;
  style: typeof STRATEGY_STYLES[0];
  capitalHistory: number[];
  dailyReturns: number[];
  trades: TradeData[];
  positions: PositionData[];
}

interface TradeData {
  id: string;
  agentId: string;
  symbol: string;
  symbolName: string;
  market: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  amount: number;
  commission: number;
  stampDuty: number;
  totalCost: number;
  executedAt: Date;
  positionId?: string;
}

interface PositionData {
  id: string;
  agentId: string;
  symbol: string;
  symbolName: string;
  market: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  profitLoss: number;
  status: 'open' | 'closed';
}

interface SnapshotData {
  id: string;
  agentId: string;
  snapshotDate: string;
  totalValue: number;
  cash: number;
  positionsValue: number;
  dailyReturn: number;
  dailyReturnPct: number;
  cumulativeReturn: number;
  cumulativeReturnPct: number;
  positionsCount: number;
}

// 生成 Agent 数据
function generateAgents(): AgentData[] {
  const agents: AgentData[] = [];
  const today = new Date();
  const startDate = addDays(today, -CONFIG.daysHistory);
  
  for (let i = 0; i < CONFIG.agentCount; i++) {
    const nameInfo = AGENT_NAMES[i];
    const style = randomChoice(STRATEGY_STYLES);
    
    // 模拟每日收益
    const dailyReturns: number[] = [];
    const capitalHistory: number[] = [CONFIG.initialCapital];
    
    let currentCapital = CONFIG.initialCapital;
    for (let d = 0; d < CONFIG.daysHistory; d++) {
      // 基于策略风格生成收益
      const baseReturn = style.returnBase / CONFIG.daysHistory;
      const randomComponent = (Math.random() - 0.5) * style.volatility / Math.sqrt(CONFIG.daysHistory);
      const dailyReturn = baseReturn + randomComponent;
      
      dailyReturns.push(dailyReturn);
      currentCapital = currentCapital * (1 + dailyReturn);
      capitalHistory.push(currentCapital);
    }
    
    // 生成持仓
    const stocks = randomSubset(STOCK_POOL, CONFIG.minPositions, CONFIG.maxPositions);
    const positions: PositionData[] = stocks.map((stock, idx) => {
      const quantity = randomInRange(100, 5000) * 100; // 股票以手为单位
      const avgCost = randomFloat(10, 500, 2);
      const priceChange = randomFloat(-0.3, 0.5, 2); // 价格变动
      const currentPrice = Number((avgCost * (1 + priceChange)).toFixed(2));
      
      return {
        id: generateId('pos'),
        agentId: `arena_${i + 1}`,
        symbol: stock.symbol,
        symbolName: stock.name,
        market: stock.market,
        quantity,
        avgCost,
        currentPrice,
        marketValue: Number((quantity * currentPrice).toFixed(2)),
        profitLoss: Number((quantity * (currentPrice - avgCost)).toFixed(2)),
        status: 'open' as const,
      };
    });
    
    // 生成交易记录
    const tradeCount = randomInRange(CONFIG.minTrades, CONFIG.maxTrades);
    const trades: TradeData[] = [];
    
    for (let t = 0; t < tradeCount; t++) {
      const stock = randomChoice(stocks);
      const side = Math.random() > 0.5 ? 'buy' : 'sell';
      const quantity = randomInRange(1, 50) * 100;
      const price = randomFloat(10, 500, 2);
      const amount = Number((quantity * price).toFixed(2));
      const commission = Number((amount * 0.0003).toFixed(2)); // 万三佣金
      const stampDuty = side === 'sell' ? Number((amount * 0.001).toFixed(2)) : 0; // 印花税
      const totalCost = Number((amount + commission + stampDuty).toFixed(2));
      
      const daysAgo = randomInRange(0, CONFIG.daysHistory);
      const executedAt = addDays(today, -daysAgo);
      
      trades.push({
        id: generateId('trade'),
        agentId: `arena_${i + 1}`,
        symbol: stock.symbol,
        symbolName: stock.name,
        market: stock.market,
        side,
        quantity,
        price,
        amount,
        commission,
        stampDuty,
        totalCost,
        executedAt,
      });
    }
    
    // 按时间排序交易
    trades.sort((a, b) => a.executedAt.getTime() - b.executedAt.getTime());
    
    agents.push({
      id: `arena_${i + 1}`,
      agentId: `agent_${nameInfo.name.toLowerCase().replace(/\s+/g, '_')}`,
      name: nameInfo.name,
      avatar: nameInfo.avatar,
      bio: nameInfo.bio,
      style,
      capitalHistory,
      dailyReturns,
      trades,
      positions,
    });
  }
  
  return agents;
}

// 计算排名
function calculateRankings(agents: AgentData[]): void {
  // 按总收益率排序
  agents.sort((a, b) => {
    const returnA = (a.capitalHistory[a.capitalHistory.length - 1] - CONFIG.initialCapital) / CONFIG.initialCapital;
    const returnB = (b.capitalHistory[b.capitalHistory.length - 1] - CONFIG.initialCapital) / CONFIG.initialCapital;
    return returnB - returnA;
  });
  
  agents.forEach((agent, index) => {
    (agent as any).rank = index + 1;
  });
}

// 生成快照数据
function generateSnapshots(agents: AgentData[]): SnapshotData[][] {
  const allSnapshots: SnapshotData[][] = [];
  const today = new Date();
  
  for (const agent of agents) {
    const snapshots: SnapshotData[] = [];
    let cumulativeReturn = 0;
    
    for (let d = 0; d < agent.capitalHistory.length - 1; d++) {
      const date = addDays(today, -(CONFIG.daysHistory - d));
      const totalValue = agent.capitalHistory[d + 1];
      const prevValue = agent.capitalHistory[d];
      const dailyReturn = totalValue - prevValue;
      const dailyReturnPct = dailyReturn / prevValue;
      cumulativeReturn += dailyReturnPct;
      
      snapshots.push({
        id: generateId('snap'),
        agentId: agent.id,
        snapshotDate: formatDate(date),
        totalValue: Number(totalValue.toFixed(2)),
        cash: Number((totalValue * 0.3).toFixed(2)), // 假设30%现金
        positionsValue: Number((totalValue * 0.7).toFixed(2)),
        dailyReturn: Number(dailyReturn.toFixed(4)),
        dailyReturnPct: Number(dailyReturnPct.toFixed(4)),
        cumulativeReturn: Number(cumulativeReturn.toFixed(4)),
        cumulativeReturnPct: Number((cumulativeReturn * 100).toFixed(4)),
        positionsCount: agent.positions.length,
      });
    }
    
    allSnapshots.push(snapshots);
  }
  
  return allSnapshots;
}

// ============== 数据库操作 ==============

async function clearExistingData() {
  console.log('[Seed] Clearing existing arena data...');
  
  await sql.unsafe(`DELETE FROM ranking_history`);
  await sql.unsafe(`DELETE FROM daily_snapshots`);
  await sql.unsafe(`DELETE FROM trades`);
  await sql.unsafe(`DELETE FROM positions`);
  await sql.unsafe(`DELETE FROM arena_agents`);
  
  console.log('[Seed] Existing data cleared');
}

async function insertAgents(agents: AgentData[]) {
  console.log('[Seed] Inserting agents...');
  
  for (const agent of agents) {
    const finalCapital = agent.capitalHistory[agent.capitalHistory.length - 1];
    const totalReturn = (finalCapital - CONFIG.initialCapital) / CONFIG.initialCapital;
    const maxDrawdown = calculateMaxDrawdown(agent.capitalHistory);
    const sharpeRatio = calculateSharpeRatio(agent.dailyReturns);
    const winRate = agent.style.winRate + randomFloat(-5, 5, 1);
    
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
      agent.id,
      agent.agentId,
      agent.name,
      agent.avatar,
      agent.bio,
      CONFIG.initialCapital,
      finalCapital.toFixed(2),
      totalReturn.toFixed(4),
      (totalReturn * 100).toFixed(4),
      maxDrawdown.toFixed(4),
      sharpeRatio.toFixed(4),
      winRate.toFixed(2),
      agent.trades.length,
      Math.floor(agent.trades.length * winRate / 100),
      (agent as any).rank,
    ]);
  }
  
  console.log(`[Seed] ${agents.length} agents inserted`);
}

async function insertPositions(agents: AgentData[]) {
  console.log('[Seed] Inserting positions...');
  
  let count = 0;
  for (const agent of agents) {
    for (const position of agent.positions) {
      await sql.unsafe(`
        INSERT INTO positions (
          id, arena_agent_id, symbol, symbol_name, market,
          quantity, available_quantity, avg_cost, current_price,
          market_value, profit_loss, profit_loss_pct, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        )
      `, [
        position.id,
        position.agentId,
        position.symbol,
        position.symbolName,
        position.market,
        position.quantity,
        position.quantity, // available_quantity = quantity
        position.avgCost,
        position.currentPrice,
        position.marketValue,
        position.profitLoss,
        (position.profitLoss / (position.quantity * position.avgCost)).toFixed(4),
        position.status,
      ]);
      count++;
    }
  }
  
  console.log(`[Seed] ${count} positions inserted`);
}

async function insertTrades(agents: AgentData[]) {
  console.log('[Seed] Inserting trades...');
  
  let count = 0;
  for (const agent of agents) {
    for (const trade of agent.trades) {
      await sql.unsafe(`
        INSERT INTO trades (
          id, arena_agent_id, symbol, symbol_name, market,
          side, order_type, quantity, price, amount,
          commission, stamp_duty, total_cost, status, executed_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        )
      `, [
        trade.id,
        trade.agentId,
        trade.symbol,
        trade.symbolName,
        trade.market,
        trade.side,
        'market',
        trade.quantity,
        trade.price,
        trade.amount,
        trade.commission,
        trade.stampDuty,
        trade.totalCost,
        'filled',
        trade.executedAt.toISOString(),
      ]);
      count++;
    }
  }
  
  console.log(`[Seed] ${count} trades inserted`);
}

async function insertSnapshots(snapshots: SnapshotData[][]) {
  console.log('[Seed] Inserting daily snapshots...');
  
  let count = 0;
  for (const agentSnapshots of snapshots) {
    for (const snapshot of agentSnapshots) {
      await sql.unsafe(`
        INSERT INTO daily_snapshots (
          id, arena_agent_id, snapshot_date,
          total_value, cash, positions_value,
          daily_return, daily_return_pct,
          cumulative_return, cumulative_return_pct,
          positions_count
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        )
      `, [
        snapshot.id,
        snapshot.agentId,
        snapshot.snapshotDate,
        snapshot.totalValue,
        snapshot.cash,
        snapshot.positionsValue,
        snapshot.dailyReturn,
        snapshot.dailyReturnPct,
        snapshot.cumulativeReturn,
        snapshot.cumulativeReturnPct,
        snapshot.positionsCount,
      ]);
      count++;
    }
  }
  
  console.log(`[Seed] ${count} snapshots inserted`);
}

async function insertRankingHistory(agents: AgentData[], allSnapshots: SnapshotData[][]) {
  console.log('[Seed] Inserting ranking history...');
  
  const today = new Date();
  let count = 0;
  
  // 为过去7天生成排名历史
  for (let d = 0; d < 7; d++) {
    const date = addDays(today, -d);
    const dateStr = formatDate(date);
    
    // 按累计收益率计算当日排名
    const rankings: { agentId: string; rank: number; metrics: any }[] = [];
    
    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      const snapshots = allSnapshots[i];
      const daySnapshot = snapshots.find(s => s.snapshotDate === dateStr);
      
      if (daySnapshot) {
        rankings.push({
          agentId: agent.id,
          rank: 0,
          metrics: {
            totalReturn: daySnapshot.cumulativeReturn,
            maxDrawdown: calculateMaxDrawdown(agent.capitalHistory.slice(0, CONFIG.daysHistory - d)),
            sharpeRatio: calculateSharpeRatio(agent.dailyReturns.slice(0, CONFIG.daysHistory - d)),
            winRate: agent.style.winRate,
          },
        });
      }
    }
    
    // 排序并分配排名
    rankings.sort((a, b) => b.metrics.totalReturn - a.metrics.totalReturn);
    rankings.forEach((r, idx) => {
      r.rank = idx + 1;
    });
    
    // 插入数据
    for (const r of rankings) {
      await sql.unsafe(`
        INSERT INTO ranking_history (
          id, arena_agent_id, ranking_date,
          rank, rank_change, total_return, max_drawdown, sharpe_ratio, win_rate
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9
        )
      `, [
        generateId('rank'),
        r.agentId,
        dateStr,
        r.rank,
        randomInRange(-3, 3), // 随机排名变化
        r.metrics.totalReturn,
        r.metrics.maxDrawdown,
        r.metrics.sharpeRatio,
        r.metrics.winRate,
      ]);
      count++;
    }
  }
  
  console.log(`[Seed] ${count} ranking history records inserted`);
}

// ============== 主函数 ==============

async function main() {
  console.log('========================================');
  console.log('  Arena Data Seeding Script');
  console.log('========================================\n');
  
  console.log(`[Config] Agents: ${CONFIG.agentCount}`);
  console.log(`[Config] Days History: ${CONFIG.daysHistory}`);
  console.log(`[Config] Initial Capital: ${CONFIG.initialCapital.toLocaleString()}\n`);
  
  try {
    // 1. 清除现有数据
    await clearExistingData();
    
    // 2. 生成数据
    console.log('\n[Step 1] Generating agent data...');
    const agents = generateAgents();
    calculateRankings(agents);
    
    console.log('[Step 2] Generating snapshots...');
    const snapshots = generateSnapshots(agents);
    
    // 3. 插入数据库
    console.log('\n[Step 3] Inserting data into database...');
    await insertAgents(agents);
    await insertPositions(agents);
    await insertTrades(agents);
    await insertSnapshots(snapshots);
    await insertRankingHistory(agents, snapshots);
    
    // 4. 输出统计
    console.log('\n========================================');
    console.log('  Seeding Complete!');
    console.log('========================================\n');
    
    // Top 5 排名
    console.log('Top 5 Agents by Total Return:\n');
    agents.slice(0, 5).forEach((agent, idx) => {
      const finalCapital = agent.capitalHistory[agent.capitalHistory.length - 1];
      const totalReturn = ((finalCapital - CONFIG.initialCapital) / CONFIG.initialCapital * 100).toFixed(2);
      console.log(`  ${idx + 1}. ${agent.avatar} ${agent.name}: ${totalReturn}% (${finalCapital.toLocaleString(undefined, { maximumFractionDigits: 0 })} CNY)`);
    });
    
    console.log('\n');
    
  } catch (error) {
    console.error('[Error] Seeding failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();