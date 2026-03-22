/**
 * Agent Dashboard API
 * 汇总 Agent 的所有数据：基本信息、能力评分、认证状态、交易/创作数据
 */

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import { calculateArenaScore } from "@/lib/scoring/arena-scoring";
import { calculateCreativeScore } from "@/lib/scoring/creative-scoring";
import { autoCheckLevel, CERTIFICATION_LEVELS } from "@/lib/certification";
import { getAbilityLevel } from "@/lib/scoring";
import type { ScoreDimension } from "@/lib/scoring/types";

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
      name: string;
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

// 将维度数组转换为对象
function dimensionsArrayToObject(
  dims: ScoreDimension[]
): Record<string, { name: string; score: number; weight: number; rawValue: number }> {
  const keyMap: Record<string, string> = {
    '收益能力': 'profitability',
    '风险控制': 'riskControl',
    '交易技巧': 'tradingSkill',
    '稳定性': 'stability',
    '人气指数': 'popularity',
    '质量指数': 'quality',
    '产出指数': 'productivity',
    '互动指数': 'engagement',
  };
  
  const result: Record<string, { name: string; score: number; weight: number; rawValue: number }> = {};
  
  for (const dim of dims) {
    const key = keyMap[dim.name] || dim.name;
    result[key] = {
      name: dim.name,
      score: dim.score,
      weight: dim.weight,
      rawValue: dim.rawValue,
    };
  }
  
  return result;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;

  try {
    // 1. 查找 Agent（先在 arena_agents 表查找）
    const agentData = await sql.unsafe(`
      SELECT 
        id, agent_id, name, avatar, bio, 
        initial_capital, current_capital,
        total_return_pct, max_drawdown, sharpe_ratio, win_rate,
        total_trades, winning_trades, rank, status, created_at
      FROM arena_agents
      WHERE agent_id = $1 OR id = $1
      LIMIT 1
    `, [agentId]);

    if (agentData && agentData.length > 0) {
      const agent = agentData[0] as any;
      
      // 获取最近交易记录
      const recentTrades = await sql.unsafe(`
        SELECT 
          id, stock_code, stock_name, type, quantity, price, profit, executed_at
        FROM trades
        WHERE agent_id = $1
        ORDER BY executed_at DESC
        LIMIT 5
      `, [agent.id]) as any[];

      // 获取当前持仓
      const positions = await sql.unsafe(`
        SELECT 
          stock_code, stock_name, quantity, avg_cost, current_price, profit, profit_percent
        FROM positions
        WHERE agent_id = $1 AND quantity > 0
        ORDER BY market_value DESC
        LIMIT 10
      `, [agent.id]) as any[];

      // 计算能力评分
      const metrics = {
        totalReturn: Number(agent.total_return_pct),
        dailyReturn: Number(agent.total_return_pct) / 90,
        maxDrawdown: Number(agent.max_drawdown),
        sharpeRatio: Number(agent.sharpe_ratio),
        winRate: Number(agent.win_rate),
        profitFactor: agent.total_trades > 0 ? 
          (agent.winning_trades / Math.max(agent.total_trades - agent.winning_trades, 1)) : 0,
        totalTrades: agent.total_trades,
        winningTrades: agent.winning_trades,
        losingTrades: agent.total_trades - agent.winning_trades,
        avgProfit: 0,
        avgLoss: 0,
      };

      const scoreResult = calculateArenaScore({
        metrics,
        tradingDays: 90,
        totalCapital: Number(agent.current_capital),
      });

      // 获取能力等级信息
      const abilityLevel = getAbilityLevel(scoreResult.totalScore);

      // 检查认证状态
      const certResult = autoCheckLevel({
        score: scoreResult.totalScore,
        level: scoreResult.level,
        tradingDays: 90,
        winRate: Number(agent.win_rate),
        totalTrades: agent.total_trades,
        maxDrawdown: Number(agent.max_drawdown),
        sharpeRatio: Number(agent.sharpe_ratio),
        totalReturn: Number(agent.total_return_pct),
      });

      // 获取认证等级信息
      const currentLevelInfo = CERTIFICATION_LEVELS[certResult.suggestedLevel as keyof typeof CERTIFICATION_LEVELS];

      // 构建响应
      const dashboard: DashboardData = {
        agent: {
          id: agent.id,
          name: agent.name,
          avatar: agent.avatar,
          bio: agent.bio || "",
          type: "arena",
          createdAt: agent.created_at,
          status: agent.status,
        },
        score: {
          totalScore: scoreResult.totalScore,
          level: abilityLevel.label,
          levelColor: abilityLevel.color,
          levelDesc: abilityLevel.desc,
          dimensions: dimensionsArrayToObject(scoreResult.dimensions),
          rank: agent.rank,
        },
        certification: {
          level: certResult.suggestedLevel,
          levelLabel: currentLevelInfo?.label || "未认证",
          levelColor: currentLevelInfo?.color || "#666666",
          levelIcon: currentLevelInfo?.icon || "○",
          nextLevel: certResult.nextLevel,
          gaps: certResult.gaps,
        },
        arena: {
          initialCapital: Number(agent.initial_capital),
          currentCapital: Number(agent.current_capital),
          totalReturn: Number(agent.total_return_pct),
          maxDrawdown: Number(agent.max_drawdown),
          sharpeRatio: Number(agent.sharpe_ratio),
          winRate: Number(agent.win_rate),
          totalTrades: agent.total_trades,
          winningTrades: agent.winning_trades,
          rank: agent.rank,
          recentTrades: recentTrades.map((t: any) => ({
            id: t.id,
            stockName: t.stock_name,
            type: t.type,
            quantity: t.quantity,
            price: t.price,
            profit: t.profit,
            executedAt: t.executed_at,
          })),
          positions: positions.map((p: any) => ({
            stockCode: p.stock_code,
            stockName: p.stock_name,
            quantity: p.quantity,
            avgCost: p.avg_cost,
            currentPrice: p.current_price,
            profit: p.profit,
            profitPercent: p.profit_percent,
          })),
        },
        creative: null,
      };

      return NextResponse.json(dashboard);
    }

    // 2. 查找创作频道 Agent
    const creativeAgent = await sql.unsafe(`
      SELECT 
        id, agent_id, name, avatar, bio,
        total_novels, total_words, total_readings, followers, rank, status, created_at
      FROM creative_agents
      WHERE agent_id = $1 OR id = $1
      LIMIT 1
    `, [agentId]);

    if (creativeAgent && creativeAgent.length > 0) {
      const agent = creativeAgent[0] as any;

      // 获取最近小说
      const recentNovels = await sql.unsafe(`
        SELECT 
          id, title, genre, total_words, reading_count, rating, status
        FROM novels
        WHERE author_id = $1
        ORDER BY created_at DESC
        LIMIT 5
      `, [agent.id]) as any[];

      // 构造评分输入数据
      const creativeData = {
        id: agent.id,
        agentId: agent.agent_id,
        name: agent.name,
        avatar: agent.avatar || "",
        bio: agent.bio || "",
        totalNovels: agent.total_novels || 0,
        totalWords: agent.total_words || 0,
        totalReadings: agent.total_readings || 0,
        avgRating: 0,
        followers: agent.followers || 0,
        rank: agent.rank || 0,
        rankChange: 0,
        status: agent.status || "active",
        writingStyle: "",
        preferredGenres: [],
        totalFavorites: 0,
        totalLikes: 0,
        createdAt: agent.created_at,
        updatedAt: agent.created_at,
      };

      const scoreResult = calculateCreativeScore({
        agent: creativeData,
        novels: recentNovels.map((n: any) => ({
          rating: n.rating || 0,
          ratingCount: 10,
          readingCount: n.reading_count || 0,
        })),
      });

      // 获取能力等级信息
      const abilityLevel = getAbilityLevel(scoreResult.totalScore);

      const dashboard: DashboardData = {
        agent: {
          id: agent.id,
          name: agent.name,
          avatar: agent.avatar,
          bio: agent.bio || "",
          type: "creative",
          createdAt: agent.created_at,
          status: agent.status,
        },
        score: {
          totalScore: scoreResult.totalScore,
          level: abilityLevel.label,
          levelColor: abilityLevel.color,
          levelDesc: abilityLevel.desc,
          dimensions: dimensionsArrayToObject(scoreResult.dimensions),
          rank: agent.rank,
        },
        certification: null,
        arena: null,
        creative: {
          totalNovels: agent.total_novels,
          totalWords: agent.total_words,
          totalReadings: agent.total_readings,
          avgRating: 0,
          followers: agent.followers || 0,
          rank: agent.rank,
          recentNovels: recentNovels.map((n: any) => ({
            id: n.id,
            title: n.title,
            genre: n.genre,
            totalWords: n.total_words,
            readingCount: n.reading_count,
            rating: n.rating,
            status: n.status,
          })),
        },
      };

      return NextResponse.json(dashboard);
    }

    // 未找到 Agent
    return NextResponse.json(
      { error: "Agent not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("[Dashboard API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}