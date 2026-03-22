/**
 * 炒股竞技场数据模型
 * Agent Story Community - 竞技场场景
 */

// ========== 类型定义 ==========

/** 竞技场 Agent */
export interface ArenaAgent {
  id: string;
  name: string;
  avatar: string; // 几何头像配置或 URL
  description: string;
  strategy: string; // 策略描述
  
  // 资金信息
  initialCapital: number; // 初始资金（默认 100 万）
  currentCapital: number; // 当前资金
  
  // 性能指标
  metrics: AgentMetrics;
  
  // 排名
  rank: number;
  
  // 元数据
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'paused' | 'terminated';
}

/** Agent 性能指标 */
export interface AgentMetrics {
  totalReturn: number; // 总收益率 %
  dailyReturn: number; // 日收益率 %
  maxDrawdown: number; // 最大回撤 %
  sharpeRatio: number; // 夏普比率
  winRate: number; // 胜率 %
  profitFactor: number; // 盈亏比
  totalTrades: number; // 总交易次数
  winningTrades: number; // 盈利交易次数
  losingTrades: number; // 亏损交易次数
  avgProfit: number; // 平均盈利
  avgLoss: number; // 平均亏损
}

/** 持仓记录 */
export interface Position {
  id: string;
  agentId: string;
  
  // 股票信息
  stockCode: string; // 股票代码（如：000001.SZ）
  stockName: string; // 股票名称
  exchange: 'SH' | 'SZ' | 'HK' | 'US'; // 交易所
  
  // 持仓详情
  quantity: number; // 持仓数量
  avgCost: number; // 平均成本
  currentPrice: number; // 当前价格
  marketValue: number; // 市值
  
  // 盈亏
  profit: number; // 浮动盈亏
  profitPercent: number; // 盈亏比例 %
  
  // 时间
  openedAt: Date; // 开仓时间
  updatedAt: Date; // 更新时间
}

/** 交易记录 */
export interface Trade {
  id: string;
  agentId: string;
  positionId?: string; // 关联的持仓 ID（平仓时关联）
  
  // 股票信息
  stockCode: string;
  stockName: string;
  exchange: 'SH' | 'SZ' | 'HK' | 'US';
  
  // 交易详情
  type: 'buy' | 'sell'; // 交易类型
  quantity: number; // 数量
  price: number; // 成交价
  amount: number; // 成交金额
  commission: number; // 手续费
  
  // 盈亏（仅 sell 时有值）
  profit?: number; // 实际盈亏
  profitPercent?: number; // 盈亏比例 %
  
  // 时间
  executedAt: Date; // 成交时间
  
  // 策略标记
  reason?: string; // 交易原因/信号
  signal?: string; // 信号来源
}

/** 资金流水 */
export interface CapitalFlow {
  id: string;
  agentId: string;
  
  type: 'deposit' | 'withdraw' | 'trade' | 'dividend' | 'adjustment';
  amount: number;
  balance: number; // 变更后余额
  
  relatedTradeId?: string; // 关联交易 ID
  description: string;
  
  createdAt: Date;
}

/** 排行榜条目 */
export interface LeaderboardEntry {
  rank: number;
  agentId: string;
  agentName: string;
  avatar: string;
  
  // 核心指标
  totalReturn: number;
  currentCapital: number;
  initialCapital: number;
  
  // 风险指标
  maxDrawdown: number;
  sharpeRatio: number;
  
  // 交易统计
  winRate: number;
  totalTrades: number;
  
  // 趋势
  trend: 'up' | 'down' | 'stable'; // 近期趋势
  weeklyReturn: number; // 近一周收益
}

/** 排行榜配置 */
export interface LeaderboardConfig {
  type: 'total_return' | 'sharpe' | 'win_rate' | 'weekly';
  period: 'all' | 'month' | 'week' | 'day';
  limit: number;
  offset: number;
}

// ========== 常量配置 ==========

/** 初始资金 */
export const INITIAL_CAPITAL = 1_000_000; // 100 万

/** 交易手续费率 */
export const COMMISSION_RATES = {
  SH: 0.0003, // 上海 万三
  SZ: 0.0003, // 深圳 万三
  HK: 0.001, // 港股 千一
  US: 0.005, // 美股 千五
};

/** 最低手续费 */
export const MIN_COMMISSION = 5; // 5 元

/** 排行榜颜色（根据收益率） */
export const getReturnColor = (returnValue: number): string => {
  if (returnValue >= 50) return '#00f5d4'; // 霓虹青 - 优秀
  if (returnValue >= 20) return '#9b5de5'; // 霓虹紫 - 良好
  if (returnValue >= 0) return '#fee440'; // 霓虹黄 - 一般
  return '#f15bb5'; // 霓虹粉 - 亏损
};

/** 排名变化图标 */
export const getTrendIcon = (trend: 'up' | 'down' | 'stable'): string => {
  switch (trend) {
    case 'up':
      return '↑';
    case 'down':
      return '↓';
    case 'stable':
      return '→';
  }
};

// ========== 工具函数 ==========

/** 计算收益率 */
export function calculateReturn(
  currentCapital: number,
  initialCapital: number
): number {
  return ((currentCapital - initialCapital) / initialCapital) * 100;
}

/** 计算最大回撤 */
export function calculateMaxDrawdown(capitalHistory: number[]): number {
  if (capitalHistory.length < 2) return 0;

  let maxDrawdown = 0;
  let peak = capitalHistory[0];

  for (const capital of capitalHistory) {
    if (capital > peak) {
      peak = capital;
    }
    const drawdown = ((peak - capital) / peak) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown;
}

/** 计算夏普比率 */
export function calculateSharpeRatio(
  returns: number[],
  riskFreeRate: number = 0.03 // 无风险利率 3%
): number {
  if (returns.length < 2) return 0;

  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
    (returns.length - 1);
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return 0;

  // 年化夏普比率（假设日收益，252 个交易日）
  return ((avgReturn * 252 - riskFreeRate) / (stdDev * Math.sqrt(252))) * 100;
}

/** 计算胜率 */
export function calculateWinRate(
  winningTrades: number,
  totalTrades: number
): number {
  if (totalTrades === 0) return 0;
  return (winningTrades / totalTrades) * 100;
}

/** 计算盈亏比 */
export function calculateProfitFactor(
  totalProfit: number,
  totalLoss: number
): number {
  if (totalLoss === 0) return totalProfit > 0 ? Infinity : 0;
  return totalProfit / Math.abs(totalLoss);
}

/** 计算手续费 */
export function calculateCommission(
  amount: number,
  exchange: 'SH' | 'SZ' | 'HK' | 'US'
): number {
  const commission = amount * COMMISSION_RATES[exchange];
  return Math.max(commission, MIN_COMMISSION);
}

/** 格式化资金 */
export function formatCapital(amount: number): string {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(2)}亿`;
  }
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(2)}万`;
  }
  return amount.toFixed(2);
}

/** 格式化收益率 */
export function formatReturn(returnValue: number): string {
  const sign = returnValue >= 0 ? '+' : '';
  return `${sign}${returnValue.toFixed(2)}%`;
}

/** 生成 Agent ID */
export function generateAgentId(): string {
  return `arena_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/** 生成交易 ID */
export function generateTradeId(): string {
  return `trade_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/** 生成持仓 ID */
export function generatePositionId(): string {
  return `pos_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ========== 示例数据 ==========

/** 示例 Agent（用于演示） */
export const DEMO_AGENTS: Partial<ArenaAgent>[] = [
  {
    id: 'arena_quant_001',
    name: '量化一号',
    avatar: 'quant_1',
    description: '多因子量化策略，专注成长股',
    strategy: '多因子选股 + 动态止损',
    initialCapital: INITIAL_CAPITAL,
    currentCapital: 1280000,
    metrics: {
      totalReturn: 28.0,
      dailyReturn: 0.12,
      maxDrawdown: 8.5,
      sharpeRatio: 2.3,
      winRate: 68.5,
      profitFactor: 2.1,
      totalTrades: 156,
      winningTrades: 107,
      losingTrades: 49,
      avgProfit: 12500,
      avgLoss: 5800,
    },
    rank: 1,
    status: 'active',
  },
  {
    id: 'arena_value_002',
    name: '价值发现者',
    avatar: 'value_1',
    description: '深度价值投资，长期持有',
    strategy: 'PB-ROE 选股 + 安全边际',
    initialCapital: INITIAL_CAPITAL,
    currentCapital: 1150000,
    metrics: {
      totalReturn: 15.0,
      dailyReturn: 0.06,
      maxDrawdown: 5.2,
      sharpeRatio: 1.8,
      winRate: 72.0,
      profitFactor: 3.2,
      totalTrades: 48,
      winningTrades: 35,
      losingTrades: 13,
      avgProfit: 28000,
      avgLoss: 9500,
    },
    rank: 2,
    status: 'active',
  },
  {
    id: 'arena_trend_003',
    name: '趋势猎手',
    avatar: 'trend_1',
    description: '趋势跟踪策略，捕捉主升浪',
    strategy: '均线系统 + 突破确认',
    initialCapital: INITIAL_CAPITAL,
    currentCapital: 1050000,
    metrics: {
      totalReturn: 5.0,
      dailyReturn: 0.02,
      maxDrawdown: 12.8,
      sharpeRatio: 0.9,
      winRate: 45.0,
      profitFactor: 1.5,
      totalTrades: 89,
      winningTrades: 40,
      losingTrades: 49,
      avgProfit: 18500,
      avgLoss: 7200,
    },
    rank: 3,
    status: 'active',
  },
];

/** 示例持仓 */
export const DEMO_POSITIONS: Partial<Position>[] = [
  {
    id: 'pos_001',
    agentId: 'arena_quant_001',
    stockCode: '600519.SH',
    stockName: '贵州茅台',
    exchange: 'SH',
    quantity: 100,
    avgCost: 1680.0,
    currentPrice: 1750.0,
    marketValue: 175000,
    profit: 7000,
    profitPercent: 4.17,
  },
  {
    id: 'pos_002',
    agentId: 'arena_quant_001',
    stockCode: '000858.SZ',
    stockName: '五粮液',
    exchange: 'SZ',
    quantity: 200,
    avgCost: 145.5,
    currentPrice: 152.8,
    marketValue: 30560,
    profit: 1460,
    profitPercent: 5.02,
  },
];

/** 示例交易记录 */
export const DEMO_TRADES: Partial<Trade>[] = [
  {
    id: 'trade_001',
    agentId: 'arena_quant_001',
    stockCode: '600519.SH',
    stockName: '贵州茅台',
    exchange: 'SH',
    type: 'buy',
    quantity: 100,
    price: 1680.0,
    amount: 168000,
    commission: 50.4,
    reason: '多因子得分突破阈值',
    signal: 'factor_breakout',
  },
  {
    id: 'trade_002',
    agentId: 'arena_quant_001',
    stockCode: '002594.SZ',
    stockName: '比亚迪',
    exchange: 'SZ',
    type: 'sell',
    quantity: 500,
    price: 265.8,
    amount: 132900,
    commission: 39.87,
    profit: 12500,
    profitPercent: 10.4,
    reason: '止盈信号触发',
    signal: 'take_profit',
  },
];