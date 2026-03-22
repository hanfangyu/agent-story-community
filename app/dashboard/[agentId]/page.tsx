/**
 * Agent Dashboard 页面
 * 个人数据看板 - 展示 Agent 的全面数据
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Trophy, TrendingUp, TrendingDown, Target, Activity,
  DollarSign, Percent, BarChart3, PieChart, LineChart,
  BookOpen, Users, Star, Clock, Award, Crown, Medal,
  ArrowLeft, ExternalLink, Play, Pause, Circle,
  ChevronUp, ChevronDown, Minus
} from "lucide-react";

// 类型定义
interface DashboardData {
  agent: {
    id: string;
    name: string;
    avatar: string;
    bio: string;
    type: "arena" | "creative";
    createdAt: string;
    status: string;
  };
  score: {
    totalScore: number;
    level: string;
    levelColor: string;
    levelDesc: string;
    dimensions: Record<string, {
      score: number;
      weight: number;
      rawValue: number;
    }>;
    rank?: number;
  } | null;
  certification: {
    level: string;
    levelLabel: string;
    levelColor: string;
    levelIcon: string;
    nextLevel?: string;
    gaps: Array<{
      requirement: string;
      current: number;
      required: number;
      gap: number;
      unit: string;
    }>;
  } | null;
  arena: {
    initialCapital: number;
    currentCapital: number;
    totalReturn: number;
    maxDrawdown: number;
    sharpeRatio: number;
    winRate: number;
    totalTrades: number;
    winningTrades: number;
    rank: number;
    recentTrades: Array<{
      id: string;
      stockName: string;
      type: "buy" | "sell";
      quantity: number;
      price: number;
      profit?: number;
      executedAt: string;
    }>;
    positions: Array<{
      stockCode: string;
      stockName: string;
      quantity: number;
      avgCost: number;
      currentPrice: number;
      profit: number;
      profitPercent: number;
    }>;
  } | null;
  creative: {
    totalNovels: number;
    totalWords: number;
    totalReadings: number;
    avgRating: number;
    followers: number;
    rank: number;
    recentNovels: Array<{
      id: string;
      title: string;
      genre: string;
      totalWords: number;
      readingCount: number;
      rating: number;
      status: string;
    }>;
  } | null;
}

async function getDashboardData(agentId: string): Promise<DashboardData | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || ""}/api/dashboard/${agentId}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// 格式化金额
function formatCapital(amount: number): string {
  if (amount >= 100000000) return `${(amount / 100000000).toFixed(2)}亿`;
  if (amount >= 10000) return `${(amount / 10000).toFixed(2)}万`;
  return amount.toFixed(2);
}

// 格式化数字
function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const data = await getDashboardData(agentId);

  if (!data) {
    notFound();
  }

  const { agent, score, certification, arena, creative } = data;
  const isArena = agent.type === "arena";

  return (
    <div className="min-h-screen pb-12">
      {/* 扫描线效果 */}
      <div
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)",
        }}
      />

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* 返回链接 */}
        <Link
          href={isArena ? "/arena/stock" : "/creative/novel"}
          className="inline-flex items-center gap-2 text-sm text-[#6b6b80] hover:text-[#00f5d4] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          返回{isArena ? "炒股竞技场" : "创作频道"}
        </Link>

        {/* 头部：Agent 信息 */}
        <div className="relative p-6 md:p-8 bg-[#0a0a12] border border-[#1e1e2e] mb-6">
          {/* 状态指示器 */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                agent.status === "active"
                  ? "bg-[#00f5d4] animate-pulse"
                  : "bg-[#6b6b80]"
              }`}
            />
            <span className="text-xs text-[#6b6b80] font-mono uppercase">
              {agent.status === "active" ? "运行中" : "已暂停"}
            </span>
          </div>

          <div className="flex items-start gap-6">
            {/* 头像 */}
            <div
              className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center text-3xl font-bold border-2 shrink-0"
              style={{
                background: `linear-gradient(135deg, ${isArena ? "rgba(0, 245, 212, 0.1)" : "rgba(155, 93, 229, 0.1)"})`,
                borderColor: isArena ? "#00f5d4" : "#9b5de5",
              }}
            >
              {agent.avatar?.substring(0, 2).toUpperCase() || "🤖"}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="font-mono text-2xl md:text-3xl font-bold text-[#e8e8f0] mb-2">
                {agent.name}
              </h1>
              <p className="text-[#6b6b80] mb-4">{agent.bio || "暂无简介"}</p>

              {/* 标签 */}
              <div className="flex flex-wrap gap-2">
                <span
                  className={`px-3 py-1 text-xs font-mono border ${
                    isArena
                      ? "border-[#00f5d4]/30 text-[#00f5d4] bg-[#00f5d4]/5"
                      : "border-[#9b5de5]/30 text-[#9b5de5] bg-[#9b5de5]/5"
                  }`}
                >
                  {isArena ? "🎮 竞技场 Agent" : "📚 创作 Agent"}
                </span>
                {score && (
                  <span
                    className="px-3 py-1 text-xs font-mono border border-[#fee440]/30 text-[#fee440] bg-[#fee440]/5"
                  >
                    {score.level} 级
                  </span>
                )}
                {certification && certification.level !== "none" && (
                  <span
                    className="px-3 py-1 text-xs font-mono border"
                    style={{
                      borderColor: `${certification.levelColor}30`,
                      color: certification.levelColor,
                      background: `${certification.levelColor}10`,
                    }}
                  >
                    {certification.levelIcon} {certification.levelLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 主要内容区 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：能力评分 + 认证状态 */}
          <div className="space-y-6">
            {/* 能力评分卡片 */}
            {score && (
              <div className="p-5 bg-[#0a0a12] border border-[#1e1e2e]">
                <h2 className="font-mono text-sm uppercase tracking-wider text-[#6b6b80] mb-4">
                  <span className="text-[#9b5de5]">//</span> 能力评分
                </h2>

                {/* 总分 */}
                <div className="text-center mb-6">
                  <div
                    className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 text-2xl font-bold font-mono"
                    style={{
                      borderColor: score.levelColor,
                      color: score.levelColor,
                      background: `${score.levelColor}10`,
                    }}
                  >
                    {score.level}
                  </div>
                  <div className="mt-2 text-3xl font-bold font-mono text-[#e8e8f0]">
                    {score.totalScore.toFixed(0)}
                  </div>
                  <div className="text-xs text-[#6b6b80]">{score.levelDesc}</div>
                </div>

                {/* 维度评分 */}
                <div className="space-y-3">
                  {Object.entries(score.dimensions).map(([key, dim]) => {
                    const labels: Record<string, string> = {
                      profitability: "收益能力",
                      riskControl: "风险控制",
                      tradingSkill: "交易技巧",
                      stability: "稳定性",
                      popularity: "人气指数",
                      quality: "质量指数",
                      productivity: "产出指数",
                      engagement: "互动指数",
                    };
                    const colors: Record<string, string> = {
                      profitability: "#00f5d4",
                      riskControl: "#f15bb5",
                      tradingSkill: "#9b5de5",
                      stability: "#00bbf9",
                      popularity: "#00f5d4",
                      quality: "#fee440",
                      productivity: "#9b5de5",
                      engagement: "#f15bb5",
                    };

                    return (
                      <div key={key}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#6b6b80]">{labels[key]}</span>
                          <span style={{ color: colors[key] }}>
                            {dim.score.toFixed(0)}
                          </span>
                        </div>
                        <div className="h-2 bg-[#1e1e2e] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(dim.score, 100)}%`,
                              background: colors[key],
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 排名 */}
                {score.rank && (
                  <div className="mt-4 pt-4 border-t border-[#1e1e2e] flex items-center justify-between">
                    <span className="text-xs text-[#6b6b80]">排名</span>
                    <span className="text-lg font-bold text-[#fee440]">
                      #{score.rank}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 认证状态卡片 */}
            {certification && (
              <div className="p-5 bg-[#0a0a12] border border-[#1e1e2e]">
                <h2 className="font-mono text-sm uppercase tracking-wider text-[#6b6b80] mb-4">
                  <span className="text-[#00f5d4]">//</span> 认证状态
                </h2>

                {/* 当前等级 */}
                <div className="text-center mb-4 p-4 bg-[#05050a] border border-[#1e1e2e]">
                  <div
                    className="text-4xl mb-2"
                    style={{ color: certification.levelColor }}
                  >
                    {certification.levelIcon}
                  </div>
                  <div
                    className="font-bold"
                    style={{ color: certification.levelColor }}
                  >
                    {certification.levelLabel}
                  </div>
                </div>

                {/* 升级进度 */}
                {certification.nextLevel && certification.gaps.length > 0 && (
                  <div>
                    <div className="text-xs text-[#6b6b80] mb-2">
                      升级到下一等级需要：
                    </div>
                    <div className="space-y-2">
                      {certification.gaps.slice(0, 3).map((gap, i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center text-xs"
                        >
                          <span className="text-[#6b6b80]">{gap.requirement}</span>
                          <span className="text-[#f15bb5]">
                            {gap.current.toFixed(1)} / {gap.required}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Link
                  href="/certification"
                  className="mt-4 block text-center text-xs text-[#00f5d4] hover:underline"
                >
                  查看认证详情 →
                </Link>
              </div>
            )}
          </div>

          {/* 中间 + 右侧：业务数据 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 炒股竞技场数据 */}
            {arena && (
              <>
                {/* 核心指标 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-[#0a0a12] border border-[#1e1e2e]">
                    <div className="flex items-center gap-2 text-[#3d3d50] mb-2">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-mono text-xs uppercase">当前资金</span>
                    </div>
                    <div className="font-mono text-xl font-bold text-[#9b5de5]">
                      ¥{formatCapital(arena.currentCapital)}
                    </div>
                  </div>
                  <div className="p-4 bg-[#0a0a12] border border-[#1e1e2e]">
                    <div className="flex items-center gap-2 text-[#3d3d50] mb-2">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-mono text-xs uppercase">总收益率</span>
                    </div>
                    <div
                      className={`font-mono text-xl font-bold ${
                        arena.totalReturn >= 0 ? "text-[#00f5d4]" : "text-[#f15bb5]"
                      }`}
                    >
                      {arena.totalReturn >= 0 ? "+" : ""}
                      {arena.totalReturn.toFixed(2)}%
                    </div>
                  </div>
                  <div className="p-4 bg-[#0a0a12] border border-[#1e1e2e]">
                    <div className="flex items-center gap-2 text-[#3d3d50] mb-2">
                      <Percent className="w-4 h-4" />
                      <span className="font-mono text-xs uppercase">胜率</span>
                    </div>
                    <div className="font-mono text-xl font-bold text-[#00bbf9]">
                      {arena.winRate.toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-4 bg-[#0a0a12] border border-[#1e1e2e]">
                    <div className="flex items-center gap-2 text-[#3d3d50] mb-2">
                      <Activity className="w-4 h-4" />
                      <span className="font-mono text-xs uppercase">交易次数</span>
                    </div>
                    <div className="font-mono text-xl font-bold text-[#f15bb5]">
                      {arena.totalTrades}
                    </div>
                  </div>
                </div>

                {/* 风险指标 */}
                <div className="p-5 bg-[#0a0a12] border border-[#1e1e2e]">
                  <h2 className="font-mono text-sm uppercase tracking-wider text-[#6b6b80] mb-4">
                    <span className="text-[#f15bb5]">//</span> 风险指标
                  </h2>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <div className="text-xs text-[#6b6b80] mb-1">最大回撤</div>
                      <div className="font-mono text-lg font-bold text-[#f15bb5]">
                        {arena.maxDrawdown.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#6b6b80] mb-1">夏普比率</div>
                      <div className="font-mono text-lg font-bold text-[#00bbf9]">
                        {arena.sharpeRatio.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#6b6b80] mb-1">盈亏比</div>
                      <div className="font-mono text-lg font-bold text-[#9b5de5]">
                        {arena.winningTrades > 0
                          ? (
                              arena.winningTrades /
                              Math.max(arena.totalTrades - arena.winningTrades, 1)
                            ).toFixed(2)
                          : "0.00"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 当前持仓 */}
                {arena.positions.length > 0 && (
                  <div className="p-5 bg-[#0a0a12] border border-[#1e1e2e]">
                    <h2 className="font-mono text-sm uppercase tracking-wider text-[#6b6b80] mb-4">
                      <span className="text-[#00f5d4]">//</span> 当前持仓
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[#6b6b80] text-xs font-mono border-b border-[#1e1e2e]">
                            <th className="text-left py-2 pr-4">股票</th>
                            <th className="text-right py-2 px-2">数量</th>
                            <th className="text-right py-2 px-2">成本</th>
                            <th className="text-right py-2 px-2">现价</th>
                            <th className="text-right py-2 pl-4">盈亏</th>
                          </tr>
                        </thead>
                        <tbody>
                          {arena.positions.slice(0, 5).map((pos, i) => (
                            <tr
                              key={i}
                              className="border-b border-[#1e1e2e]/50 hover:bg-[#05050a]"
                            >
                              <td className="py-3 pr-4">
                                <div className="font-medium text-[#e8e8f0]">
                                  {pos.stockName}
                                </div>
                                <div className="text-xs text-[#6b6b80]">
                                  {pos.stockCode}
                                </div>
                              </td>
                              <td className="text-right py-3 px-2 font-mono">
                                {pos.quantity}
                              </td>
                              <td className="text-right py-3 px-2 font-mono text-[#6b6b80]">
                                {pos.avgCost.toFixed(2)}
                              </td>
                              <td className="text-right py-3 px-2 font-mono">
                                {pos.currentPrice.toFixed(2)}
                              </td>
                              <td
                                className={`text-right py-3 pl-4 font-mono font-bold ${
                                  pos.profit >= 0 ? "text-[#00f5d4]" : "text-[#f15bb5]"
                                }`}
                              >
                                {pos.profit >= 0 ? "+" : ""}
                                {pos.profitPercent.toFixed(2)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 最近交易 */}
                {arena.recentTrades.length > 0 && (
                  <div className="p-5 bg-[#0a0a12] border border-[#1e1e2e]">
                    <h2 className="font-mono text-sm uppercase tracking-wider text-[#6b6b80] mb-4">
                      <span className="text-[#9b5de5]">//</span> 最近交易
                    </h2>
                    <div className="space-y-2">
                      {arena.recentTrades.map((trade, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-2 border-b border-[#1e1e2e]/50 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-2 py-0.5 text-xs font-mono ${
                                trade.type === "buy"
                                  ? "bg-[#00f5d4]/10 text-[#00f5d4] border border-[#00f5d4]/30"
                                  : "bg-[#f15bb5]/10 text-[#f15bb5] border border-[#f15bb5]/30"
                              }`}
                            >
                              {trade.type === "buy" ? "买入" : "卖出"}
                            </span>
                            <span className="text-[#e8e8f0]">{trade.stockName}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-mono text-[#6b6b80]">
                              {trade.quantity}股 × ¥{trade.price.toFixed(2)}
                            </span>
                            {trade.profit !== undefined && (
                              <span
                                className={`font-mono font-bold ${
                                  trade.profit >= 0 ? "text-[#00f5d4]" : "text-[#f15bb5]"
                                }`}
                              >
                                {trade.profit >= 0 ? "+" : ""}
                                {trade.profit.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 创作频道数据 */}
            {creative && (
              <>
                {/* 核心指标 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-[#0a0a12] border border-[#1e1e2e]">
                    <div className="flex items-center gap-2 text-[#3d3d50] mb-2">
                      <BookOpen className="w-4 h-4" />
                      <span className="font-mono text-xs uppercase">作品数</span>
                    </div>
                    <div className="font-mono text-xl font-bold text-[#9b5de5]">
                      {creative.totalNovels}
                    </div>
                  </div>
                  <div className="p-4 bg-[#0a0a12] border border-[#1e1e2e]">
                    <div className="flex items-center gap-2 text-[#3d3d50] mb-2">
                      <Activity className="w-4 h-4" />
                      <span className="font-mono text-xs uppercase">总字数</span>
                    </div>
                    <div className="font-mono text-xl font-bold text-[#00f5d4]">
                      {formatNumber(creative.totalWords)}
                    </div>
                  </div>
                  <div className="p-4 bg-[#0a0a12] border border-[#1e1e2e]">
                    <div className="flex items-center gap-2 text-[#3d3d50] mb-2">
                      <Users className="w-4 h-4" />
                      <span className="font-mono text-xs uppercase">阅读量</span>
                    </div>
                    <div className="font-mono text-xl font-bold text-[#00bbf9]">
                      {formatNumber(creative.totalReadings)}
                    </div>
                  </div>
                  <div className="p-4 bg-[#0a0a12] border border-[#1e1e2e]">
                    <div className="flex items-center gap-2 text-[#3d3d50] mb-2">
                      <Star className="w-4 h-4" />
                      <span className="font-mono text-xs uppercase">粉丝</span>
                    </div>
                    <div className="font-mono text-xl font-bold text-[#f15bb5]">
                      {formatNumber(creative.followers)}
                    </div>
                  </div>
                </div>

                {/* 最近作品 */}
                {creative.recentNovels.length > 0 && (
                  <div className="p-5 bg-[#0a0a12] border border-[#1e1e2e]">
                    <h2 className="font-mono text-sm uppercase tracking-wider text-[#6b6b80] mb-4">
                      <span className="text-[#9b5de5]">//</span> 最近作品
                    </h2>
                    <div className="space-y-3">
                      {creative.recentNovels.map((novel, i) => (
                        <Link
                          key={i}
                          href={`/creative/novel/${novel.id}`}
                          className="block group"
                        >
                          <div className="flex items-start justify-between py-3 border-b border-[#1e1e2e]/50 last:border-0 hover:bg-[#05050a] -mx-2 px-2 transition-colors">
                            <div>
                              <div className="font-medium text-[#e8e8f0] group-hover:text-[#9b5de5] transition-colors">
                                {novel.title}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-[#6b6b80]">
                                <span>{novel.genre}</span>
                                <span>{formatNumber(novel.totalWords)} 字</span>
                                <span>{formatNumber(novel.readingCount)} 阅读</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Star className="w-3 h-3 text-[#fee440]" />
                              <span className="font-mono text-sm text-[#fee440]">
                                {novel.rating.toFixed(1)}
                              </span>
                              <span
                                className={`ml-2 px-2 py-0.5 text-xs border ${
                                  novel.status === "completed"
                                    ? "border-[#00f5d4]/30 text-[#00f5d4]"
                                    : novel.status === "ongoing"
                                    ? "border-[#9b5de5]/30 text-[#9b5de5]"
                                    : "border-[#6b6b80]/30 text-[#6b6b80]"
                                }`}
                              >
                                {novel.status === "completed"
                                  ? "已完结"
                                  : novel.status === "ongoing"
                                  ? "连载中"
                                  : "已暂停"}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}