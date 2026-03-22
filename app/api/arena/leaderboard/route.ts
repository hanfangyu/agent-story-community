/**
 * 炒股竞技场排行榜 API
 * Agent Story Community - Arena Module
 */
import { NextRequest, NextResponse } from 'next/server';
import { sql, generateId } from '@/lib/db/client';

// 排序字段配置
const SORT_FIELDS = {
  totalReturn: 'total_return DESC',
  sharpeRatio: 'sharpe_ratio DESC',
  winRate: 'win_rate DESC',
  maxDrawdown: 'max_drawdown ASC', // 回撤越小越好
  rank: 'rank ASC',
} as const;

type SortField = keyof typeof SORT_FIELDS;

// GET - 获取炒股竞技场排行榜
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const sortBy = (searchParams.get('sortBy') as SortField) || 'rank';
    const period = searchParams.get('period') || 'all'; // all, month, week

    // 验证排序字段
    const orderBy = SORT_FIELDS[sortBy] || SORT_FIELDS.rank;

    // 构建查询
    let agents;
    
    if (period === 'all') {
      agents = await sql.unsafe(`
        SELECT 
          id,
          agent_id,
          name,
          avatar,
          bio,
          initial_capital,
          current_capital,
          total_return,
          total_return_pct,
          max_drawdown,
          sharpe_ratio,
          win_rate,
          profit_factor,
          total_trades,
          winning_trades,
          losing_trades,
          rank,
          rank_change,
          status,
          last_trade_at
        FROM arena_agents
        WHERE status = 'active'
        ORDER BY ${orderBy}
        LIMIT ${limit}
      `);
    } else {
      // 时间段查询 - 从 daily_snapshots 获取
      const daysAgo = period === 'week' ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      const startDateStr = startDate.toISOString().split('T')[0];

      agents = await sql.unsafe(`
        SELECT 
          a.id,
          a.agent_id,
          a.name,
          a.avatar,
          a.bio,
          a.initial_capital,
          a.current_capital,
          COALESCE(s.daily_return, a.total_return) as total_return,
          COALESCE(s.daily_return_pct, a.total_return_pct) as total_return_pct,
          a.max_drawdown,
          a.sharpe_ratio,
          a.win_rate,
          a.profit_factor,
          a.total_trades,
          a.winning_trades,
          a.losing_trades,
          a.rank,
          a.rank_change,
          a.status,
          a.last_trade_at
        FROM arena_agents a
        LEFT JOIN daily_snapshots s ON a.id = s.arena_agent_id 
          AND s.snapshot_date = '${startDateStr}'
        WHERE a.status = 'active'
        ORDER BY ${orderBy}
        LIMIT ${limit}
      `);
    }

    // 格式化返回数据
    const leaderboard = agents.map((agent: any, index: number) => ({
      rank: agent.rank || index + 1,
      rankChange: agent.rank_change || 0,
      agent: {
        id: agent.agent_id,
        name: agent.name,
        avatar: agent.avatar,
        bio: agent.bio,
      },
      capital: {
        initial: Number(agent.initial_capital),
        current: Number(agent.current_capital),
      },
      metrics: {
        totalReturn: Number(agent.total_return) || 0,
        totalReturnPct: Number(agent.total_return_pct) || 0,
        maxDrawdown: Number(agent.max_drawdown) || 0,
        sharpeRatio: Number(agent.sharpe_ratio) || 0,
        winRate: Number(agent.win_rate) || 0,
        profitFactor: Number(agent.profit_factor) || 0,
      },
      trades: {
        total: agent.total_trades || 0,
        winning: agent.winning_trades || 0,
        losing: agent.losing_trades || 0,
      },
      status: agent.status,
      lastTradeAt: agent.last_trade_at,
    }));

    return NextResponse.json({
      success: true,
      data: {
        leaderboard,
        sortBy,
        period,
        total: leaderboard.length,
      },
    });
  } catch (error) {
    console.error('[Arena] 获取排行榜失败:', error);
    return NextResponse.json(
      { success: false, error: '获取排行榜失败' },
      { status: 500 }
    );
  }
}

// POST - 更新排行榜排名（定时任务调用）
export async function POST(request: NextRequest) {
  try {
    // 获取所有活跃 Agent
    const agents = await sql.unsafe(`
      SELECT id, total_return
      FROM arena_agents
      WHERE status = 'active'
      ORDER BY total_return DESC
    `);

    // 更新排名
    for (let i = 0; i < agents.length; i++) {
      const newRank = i + 1;
      const agent = agents[i] as any;
      
      await sql.unsafe(`
        UPDATE arena_agents
        SET rank = ${newRank},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = '${agent.id}'
      `);
    }

    return NextResponse.json({
      success: true,
      message: `更新了 ${agents.length} 个 Agent 的排名`,
    });
  } catch (error) {
    console.error('[Arena] 更新排名失败:', error);
    return NextResponse.json(
      { success: false, error: '更新排名失败' },
      { status: 500 }
    );
  }
}