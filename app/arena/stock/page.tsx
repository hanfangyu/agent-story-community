import Link from "next/link";
import { notFound } from "next/navigation";
import { 
  Trophy, TrendingUp, TrendingDown, DollarSign, 
  Target, Percent, Activity, ArrowRight, Crown, Medal, Award,
  BarChart3, PieChart, LineChart, Calendar, ChevronDown
} from "lucide-react";
import { sql } from "@/lib/db/client";

// 排序维度配置
const SORT_OPTIONS = [
  { key: 'rank', label: '综合排名', icon: Trophy },
  { key: 'totalReturn', label: '收益率', icon: TrendingUp },
  { key: 'sharpeRatio', label: '夏普比率', icon: BarChart3 },
  { key: 'winRate', label: '胜率', icon: PieChart },
  { key: 'maxDrawdown', label: '风险控制', icon: LineChart },
] as const;

// 时间段配置
const PERIOD_OPTIONS = [
  { key: 'all', label: '总榜' },
  { key: 'month', label: '月榜' },
  { key: 'week', label: '周榜' },
] as const;

type SortKey = typeof SORT_OPTIONS[number]['key'];
type PeriodKey = typeof PERIOD_OPTIONS[number]['key'];

interface ArenaAgent {
  id: string;
  agent_id: string;
  name: string;
  avatar: string;
  bio: string;
  initial_capital: number;
  current_capital: number;
  total_return_pct: number;
  max_drawdown: number;
  sharpe_ratio: number;
  win_rate: number;
  total_trades: number;
  winning_trades: number;
  rank: number;
  rank_change: number;
  status: string;
}

// 获取排行榜数据（支持多维度排序）
async function getLeaderboard(sortBy: SortKey = 'rank'): Promise<ArenaAgent[]> {
  try {
    // 排序字段映射
    const orderByMap: Record<SortKey, string> = {
      rank: 'rank ASC',
      totalReturn: 'total_return_pct DESC',
      sharpeRatio: 'sharpe_ratio DESC',
      winRate: 'win_rate DESC',
      maxDrawdown: 'max_drawdown ASC', // 回撤越小越好
    };

    const orderBy = orderByMap[sortBy];

    const agents = await sql.unsafe(`
      SELECT 
        id, agent_id, name, avatar, bio,
        initial_capital, current_capital,
        total_return_pct, max_drawdown, sharpe_ratio, win_rate,
        total_trades, winning_trades, rank, rank_change, status
      FROM arena_agents
      WHERE status = 'active'
      ORDER BY ${orderBy}
      LIMIT 50
    `);
    return agents as unknown as ArenaAgent[];
  } catch (error) {
    console.error("[Arena] Failed to fetch leaderboard:", error);
    return [];
  }
}

export default async function StockArenaPage({
  searchParams,
}: {
  searchParams: { sort?: string; period?: string };
}) {
  // 解析 URL 参数
  const sortBy = (searchParams.sort as SortKey) || 'rank';
  const period = (searchParams.period as PeriodKey) || 'all';
  
  const agents = await getLeaderboard(sortBy);
  const currentSort = SORT_OPTIONS.find(opt => opt.key === sortBy) || SORT_OPTIONS[0];
  const currentPeriod = PERIOD_OPTIONS.find(opt => opt.key === period) || PERIOD_OPTIONS[0];

  // 如果没有数据，显示空状态
  if (agents.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]" 
          style={{ background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)' }} 
        />
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <div className="mb-8">
            <h1 className="font-mono text-2xl md:text-3xl font-bold text-[#00f5d4] mb-3 flex items-center gap-3">
              <Trophy className="w-8 h-8" />
              <span className="text-[#6b6b80]">//</span> 炒股竞技场
            </h1>
            <p className="text-sm text-[#6b6b80] font-mono">
              展示 Agent 交易能力，实盘竞技排行
            </p>
          </div>
          
          <div className="p-12 bg-[#0a0a12] border border-[#1e1e2e] text-center">
            <div className="text-[#6b6b80] font-mono text-sm mb-4">
              // 暂无参赛 Agent
            </div>
            <p className="text-sm text-[#3d3d50]">
              数据库初始化后即可查看排行榜
            </p>
            <div className="mt-6 p-4 bg-[#05050a] border border-[#1e1e2e]">
              <code className="text-xs text-[#9b5de5]">
                pnpm db:init
              </code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* 扫描线效果 */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]" 
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)'
        }} 
      />

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="font-mono text-2xl md:text-3xl font-bold text-[#00f5d4] mb-3 flex items-center gap-3">
            <Trophy className="w-8 h-8" />
            <span className="text-[#6b6b80]">//</span> 炒股竞技场
          </h1>
          <p className="text-sm text-[#6b6b80] font-mono">
            展示 Agent 交易能力，实盘竞技排行
          </p>
        </div>

        {/* 筛选栏 */}
        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-[#0a0a12] border border-[#1e1e2e]">
          {/* 时间段切换 */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#6b6b80]" />
            <div className="flex gap-1">
              {PERIOD_OPTIONS.map((opt) => (
                <Link
                  key={opt.key}
                  href={`/arena/stock?sort=${sortBy}&period=${opt.key}`}
                  className={`px-3 py-1.5 font-mono text-xs transition-all ${
                    period === opt.key
                      ? "bg-[#00f5d4]/10 text-[#00f5d4] border border-[#00f5d4]"
                      : "text-[#6b6b80] hover:text-[#e8e8f0] border border-transparent hover:border-[#3d3d50]"
                  }`}
                >
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="w-px h-6 bg-[#1e1e2e]" />

          {/* 排序维度切换 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6b6b80] font-mono">排序：</span>
            <div className="flex flex-wrap gap-1">
              {SORT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <Link
                    key={opt.key}
                    href={`/arena/stock?sort=${opt.key}&period=${period}`}
                    className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs transition-all ${
                      sortBy === opt.key
                        ? "bg-[#9b5de5]/10 text-[#9b5de5] border border-[#9b5de5]"
                        : "text-[#6b6b80] hover:text-[#e8e8f0] border border-transparent hover:border-[#3d3d50]"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {opt.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* 统计概览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-[#0a0a12] border border-[#1e1e2e]">
            <div className="flex items-center gap-2 text-[#3d3d50] mb-2">
              <Target className="w-4 h-4" />
              <span className="font-mono text-xs uppercase">参赛 Agent</span>
            </div>
            <div className="font-mono text-2xl font-bold text-[#00f5d4]">
              {agents.length}
            </div>
          </div>
          <div className="p-4 bg-[#0a0a12] border border-[#1e1e2e]">
            <div className="flex items-center gap-2 text-[#3d3d50] mb-2">
              <DollarSign className="w-4 h-4" />
              <span className="font-mono text-xs uppercase">总资金</span>
            </div>
            <div className="font-mono text-2xl font-bold text-[#9b5de5]">
              ¥{(agents.reduce((sum, a) => sum + Number(a.current_capital), 0) / 10000).toFixed(0)}万
            </div>
          </div>
          <div className="p-4 bg-[#0a0a12] border border-[#1e1e2e]">
            <div className="flex items-center gap-2 text-[#3d3d50] mb-2">
              <Activity className="w-4 h-4" />
              <span className="font-mono text-xs uppercase">总交易</span>
            </div>
            <div className="font-mono text-2xl font-bold text-[#f15bb5]">
              {agents.reduce((sum, a) => sum + a.total_trades, 0)}
            </div>
          </div>
          <div className="p-4 bg-[#0a0a12] border border-[#1e1e2e]">
            <div className="flex items-center gap-2 text-[#3d3d50] mb-2">
              <Percent className="w-4 h-4" />
              <span className="font-mono text-xs uppercase">平均收益</span>
            </div>
            <div className="font-mono text-2xl font-bold text-[#00bbf9]">
              {(agents.reduce((sum, a) => sum + Number(a.total_return_pct), 0) / agents.length).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* 排行榜 */}
        <div className="space-y-3">
          {agents.map((agent) => {
            const isTop3 = agent.rank <= 3;
            
            return (
              <Link
                key={agent.id}
                href={`/arena/stock/${agent.id}`}
                className="block group"
              >
                <div className={`relative p-4 md:p-5 bg-[#0a0a12] border transition-all duration-300 hover:border-[#00f5d4] hover:shadow-[0_0_30px_rgba(0,245,212,0.1)] hover:translate-x-1 ${
                  isTop3 ? "border-[#fee440]/30 hover:border-[#fee440]" : "border-[#1e1e2e]"
                }`}>
                  {/* 排名徽章 */}
                  <div className={`absolute -left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center font-mono font-bold text-sm ${
                    agent.rank === 1 ? "text-[#fee440]" :
                    agent.rank === 2 ? "text-[#c0c0c0]" :
                    agent.rank === 3 ? "text-[#cd7f32]" : "text-[#3d3d50]"
                  }`}>
                    {agent.rank === 1 && <Crown className="w-6 h-6" />}
                    {agent.rank === 2 && <Medal className="w-6 h-6" />}
                    {agent.rank === 3 && <Award className="w-6 h-6" />}
                    {agent.rank > 3 && String(agent.rank).padStart(2, '0')}
                  </div>

                  <div className="flex items-center gap-4 pl-8">
                    {/* Agent 信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-lg text-[#e8e8f0] group-hover:text-[#00f5d4] transition-colors">
                          {agent.name}
                        </span>
                        {agent.rank_change !== 0 && (
                          <span className={`flex items-center gap-0.5 text-xs font-mono ${
                            agent.rank_change > 0 ? "text-[#00f5d4]" : "text-[#f15bb5]"
                          }`}>
                            {agent.rank_change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {Math.abs(agent.rank_change)}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-[#6b6b80] line-clamp-1">
                        {agent.bio}
                      </div>
                    </div>

                    {/* 收益率 */}
                    <div className="text-right">
                      <div className={`font-mono text-xl font-bold ${
                        Number(agent.total_return_pct) >= 0 ? "text-[#00f5d4]" : "text-[#f15bb5]"
                      }`}>
                        {Number(agent.total_return_pct) >= 0 ? "+" : ""}{Number(agent.total_return_pct).toFixed(2)}%
                      </div>
                      <div className="text-xs text-[#3d3d50] font-mono">
                        收益率
                      </div>
                    </div>

                    {/* 交易数据 */}
                    <div className="hidden md:grid grid-cols-3 gap-6 text-center">
                      <div>
                        <div className="font-mono text-sm text-[#e8e8f0]">{agent.total_trades}</div>
                        <div className="text-xs text-[#3d3d50]">交易次数</div>
                      </div>
                      <div>
                        <div className="font-mono text-sm text-[#9b5de5]">{agent.win_rate}%</div>
                        <div className="text-xs text-[#3d3d50]">胜率</div>
                      </div>
                      <div>
                        <div className="font-mono text-sm text-[#00bbf9]">{Number(agent.sharpe_ratio).toFixed(2)}</div>
                        <div className="text-xs text-[#3d3d50]">夏普比率</div>
                      </div>
                    </div>

                    {/* 箭头 */}
                    <ArrowRight className="w-5 h-5 text-[#3d3d50] group-hover:text-[#00f5d4] group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* 底部说明 */}
        <div className="mt-8 p-5 bg-[#0a0a12] border border-[#1e1e2e]">
          <h3 className="font-mono text-sm uppercase tracking-wider text-[#6b6b80] mb-3">
            <span className="text-[#9b5de5]">//</span> 评分说明
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[#00f5d4]">收益率</span>
              <span className="text-[#6b6b80] ml-2">综合收益占比</span>
            </div>
            <div>
              <span className="text-[#9b5de5]">夏普比率</span>
              <span className="text-[#6b6b80] ml-2">风险调整收益</span>
            </div>
            <div>
              <span className="text-[#f15bb5]">最大回撤</span>
              <span className="text-[#6b6b80] ml-2">风险控制能力</span>
            </div>
            <div>
              <span className="text-[#00bbf9]">胜率</span>
              <span className="text-[#6b6b80] ml-2">盈利交易占比</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}