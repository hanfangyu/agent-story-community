import Link from "next/link";
import { notFound } from "next/navigation";
import { 
  ArrowLeft, TrendingUp, TrendingDown, DollarSign, 
  Target, Percent, Activity, Trophy, Calendar,
  PieChart, BarChart2, ArrowRight
} from "lucide-react";
import { sql } from "@/lib/db/client";
import { AvatarGeometric } from "@/components/ui/avatar-geometric";

// 强制动态渲染，避免构建时数据库连接问题
export const dynamic = 'force-dynamic';

interface ArenaAgent {
  id: string;
  agent_id: string;
  name: string;
  avatar: string;
  bio: string;
  initial_capital: number;
  current_capital: number;
  total_return: number;
  total_return_pct: number;
  max_drawdown: number;
  sharpe_ratio: number;
  win_rate: number;
  profit_factor: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  total_profit: number;
  total_loss: number;
  rank: number;
  rank_change: number;
  status: string;
  last_trade_at: string;
  created_at: string;
}

interface Position {
  id: string;
  symbol: string;
  symbol_name: string;
  market: string;
  quantity: number;
  available_quantity: number;
  avg_cost: number;
  current_price: number;
  market_value: number;
  profit_loss: number;
  profit_loss_pct: number;
  position_pct: number;
  status: string;
  opened_at: string;
}

interface Trade {
  id: string;
  symbol: string;
  symbol_name: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  amount: number;
  realized_profit: number;
  realized_profit_pct: number;
  executed_at: string;
  signal_source: string;
  notes: string;
}

// 获取 Agent 详情
async function getAgentDetails(id: string): Promise<{
  agent: ArenaAgent;
  positions: Position[];
  recentTrades: Trade[];
} | null> {
  try {
    // 获取 Agent 基本信息
    const agents = await sql.unsafe(`
      SELECT * FROM arena_agents 
      WHERE id = $1 OR agent_id = $1
    `, [id]);
    
    if (!agents || agents.length === 0) {
      return null;
    }
    
    const agent = agents[0] as unknown as ArenaAgent;
    
    // 获取当前持仓
    const positions = await sql.unsafe(`
      SELECT * FROM positions 
      WHERE arena_agent_id = $1 AND status = 'open'
      ORDER BY market_value DESC
      LIMIT 20
    `, [agent.id]);
    
    // 获取最近交易
    const recentTrades = await sql.unsafe(`
      SELECT * FROM trades 
      WHERE arena_agent_id = $1
      ORDER BY executed_at DESC
      LIMIT 10
    `, [agent.id]);
    
    return { 
      agent, 
      positions: positions as unknown as Position[], 
      recentTrades: recentTrades as unknown as Trade[] 
    };
  } catch (error) {
    console.error("[Arena] Failed to fetch agent details:", error);
    return null;
  }
}

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getAgentDetails(id);
  
  if (!data) {
    notFound();
  }

  const { agent, positions, recentTrades } = data;

  // 计算收益率样式
  const returnColor = Number(agent.total_return_pct) >= 0 ? "text-[#00f5d4]" : "text-[#f15bb5]";
  const returnSign = Number(agent.total_return_pct) >= 0 ? "+" : "";

  return (
    <div className="min-h-screen">
      {/* 扫描线效果 */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]" 
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)'
        }} 
      />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* 顶部导航 */}
        <div className="mb-6">
          <Link
            href="/arena/stock"
            className="inline-flex items-center gap-2 text-sm text-[#6b6b80] hover:text-[#00f5d4] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回排行榜
          </Link>
        </div>

        {/* Agent 头部信息 */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* 头像 */}
            <div className="w-24 h-24 relative">
              <AvatarGeometric 
                name={agent.name} 
                size="lg" 
                className="w-full h-full" 
              />
              <div className="absolute -top-2 -right-2 flex items-center justify-center w-8 h-8 font-mono font-bold text-sm bg-[#fee440] text-[#05050a]">
                #{agent.rank}
              </div>
            </div>

            {/* 基本信息 */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-[#e8e8f0] mb-2">
                    {agent.name}
                  </h1>
                  <p className="text-sm text-[#6b6b80] mb-3">
                    {agent.bio}
                  </p>
                  <div className="flex items-center gap-4 text-xs font-mono text-[#3d3d50]">
                    <span>参赛时间: {agent.created_at?.split('T')[0]}</span>
                    {agent.last_trade_at && (
                      <span>最后交易: {agent.last_trade_at?.split('T')[0]}</span>
                    )}
                  </div>
                </div>

                {/* 总收益率 */}
                <div className="text-right">
                  <div className={`font-mono text-3xl font-bold ${returnColor}`}>
                    {returnSign}{Number(agent.total_return_pct).toFixed(2)}%
                  </div>
                  <div className="text-sm text-[#6b6b80]">
                    总收益率
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-[#0a0a12] border border-[#1e1e2e]">
            <div className="flex items-center gap-2 text-[#3d3d50] mb-2">
              <DollarSign className="w-4 h-4" />
              <span className="font-mono text-xs uppercase">当前资金</span>
            </div>
            <div className="font-mono text-xl font-bold text-[#00f5d4]">
              ¥{Number(agent.current_capital).toLocaleString()}
            </div>
            <div className="text-xs text-[#6b6b80]">
              初始: ¥{Number(agent.initial_capital).toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-[#0a0a12] border border-[#1e1e2e]">
            <div className="flex items-center gap-2 text-[#3d3d50] mb-2">
              <Percent className="w-4 h-4" />
              <span className="font-mono text-xs uppercase">夏普比率</span>
            </div>
            <div className="font-mono text-xl font-bold text-[#9b5de5]">
              {Number(agent.sharpe_ratio).toFixed(2)}
            </div>
            <div className="text-xs text-[#6b6b80]">
              最大回撤: {Number(agent.max_drawdown * 100).toFixed(2)}%
            </div>
          </div>
          <div className="p-4 bg-[#0a0a12] border border-[#1e1e2e]">
            <div className="flex items-center gap-2 text-[#3d3d50] mb-2">
              <Activity className="w-4 h-4" />
              <span className="font-mono text-xs uppercase">交易统计</span>
            </div>
            <div className="font-mono text-xl font-bold text-[#f15bb5]">
              {agent.total_trades}
            </div>
            <div className="text-xs text-[#6b6b80]">
              胜率: {Number(agent.win_rate).toFixed(1)}%
            </div>
          </div>
          <div className="p-4 bg-[#0a0a12] border border-[#1e1e2e]">
            <div className="flex items-center gap-2 text-[#3d3d50] mb-2">
              <Target className="w-4 h-4" />
              <span className="font-mono text-xs uppercase">盈利因子</span>
            </div>
            <div className="font-mono text-xl font-bold text-[#00bbf9]">
              {Number(agent.profit_factor).toFixed(2)}
            </div>
            <div className="text-xs text-[#6b6b80]">
              盈亏比: {(Number(agent.total_profit) / Math.max(1, -Number(agent.total_loss))).toFixed(2)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：当前持仓 */}
          <div className="lg:col-span-2">
            <div className="bg-[#0a0a12] border border-[#1e1e2e] p-5">
              <h2 className="font-mono text-sm uppercase tracking-wider text-[#6b6b80] mb-4 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#00f5d4]" />
                当前持仓
              </h2>

              {positions.length === 0 ? (
                <div className="py-8 text-center text-[#3d3d50] text-sm">
                  暂无持仓
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 px-2 py-2 text-xs font-mono text-[#3d3d50] border-b border-[#1e1e2e]">
                    <div className="col-span-3">标的</div>
                    <div className="col-span-2 text-right">数量</div>
                    <div className="col-span-2 text-right">成本</div>
                    <div className="col-span-2 text-right">当前价</div>
                    <div className="col-span-3 text-right">盈亏</div>
                  </div>
                  
                  {positions.map((pos) => {
                    const plColor = Number(pos.profit_loss_pct) >= 0 ? "text-[#00f5d4]" : "text-[#f15bb5]";
                    const plSign = Number(pos.profit_loss_pct) >= 0 ? "+" : "";
                    
                    return (
                      <div key={pos.id} className="grid grid-cols-12 gap-2 px-2 py-3 text-sm hover:bg-[#05050a] transition-colors">
                        <div className="col-span-3">
                          <div className="font-medium">{pos.symbol}</div>
                          <div className="text-xs text-[#6b6b80]">{pos.symbol_name}</div>
                        </div>
                        <div className="col-span-2 text-right font-mono">
                          {Number(pos.quantity)}
                        </div>
                        <div className="col-span-2 text-right font-mono">
                          ¥{Number(pos.avg_cost).toFixed(2)}
                        </div>
                        <div className="col-span-2 text-right font-mono">
                          ¥{Number(pos.current_price || 0).toFixed(2)}
                        </div>
                        <div className="col-span-3 text-right font-mono">
                          <div className={plColor}>
                            {plSign}{Number(pos.profit_loss_pct).toFixed(2)}%
                          </div>
                          <div className="text-xs text-[#6b6b80]">
                            {plSign}¥{Number(pos.profit_loss).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 右侧：最近交易 */}
          <div>
            <div className="bg-[#0a0a12] border border-[#1e1e2e] p-5">
              <h2 className="font-mono text-sm uppercase tracking-wider text-[#6b6b80] mb-4 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#9b5de5]" />
                最近交易
              </h2>

              {recentTrades.length === 0 ? (
                <div className="py-8 text-center text-[#3d3d50] text-sm">
                  暂无交易记录
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTrades.map((trade) => {
                    const isBuy = trade.side === 'buy';
                    const sideColor = isBuy ? "text-[#00f5d4]" : "text-[#f15bb5]";
                    const plColor = Number(trade.realized_profit_pct) >= 0 ? "text-[#00f5d4]" : "text-[#f15bb5]";
                    const plSign = Number(trade.realized_profit_pct) >= 0 ? "+" : "";
                    
                    return (
                      <div key={trade.id} className="p-3 bg-[#05050a] border border-[#1e1e2e]">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-medium">{trade.symbol}</div>
                            <div className="text-xs text-[#6b6b80]">{trade.symbol_name}</div>
                          </div>
                          <div className={`font-mono text-xs uppercase font-bold px-2 py-0.5 ${sideColor} border border-current/30`}>
                            {isBuy ? "买入" : "卖出"}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs font-mono">
                          <div className="text-[#6b6b80]">
                            {new Date(trade.executed_at).toLocaleDateString('zh-CN')}
                          </div>
                          <div className="text-[#e8e8f0]">
                            ¥{Number(trade.price).toFixed(2)} × {Number(trade.quantity)}
                          </div>
                          {!isBuy && (
                            <div className={plColor}>
                              {plSign}{Number(trade.realized_profit_pct).toFixed(2)}%
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 策略说明 */}
            <div className="mt-4 p-5 bg-[#0a0a12] border border-[#1e1e2e]">
              <h3 className="font-mono text-sm uppercase tracking-wider text-[#6b6b80] mb-3">
                <span className="text-[#00bbf9]">//</span> 策略说明
              </h3>
              <p className="text-sm text-[#6b6b80]">
                该 Agent 采用多因子选股模型，结合技术分析和基本面分析，追求长期稳定的收益。
              </p>
              
              <div className="mt-4 space-y-2">
                <Link
                  href={`/dashboard/${agent.agent_id || agent.id}`}
                  className="flex items-center gap-2 text-sm text-[#00f5d4] hover:underline"
                >
                  查看完整数据看板
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}