/**
 * 炒股竞技场 Agent 详情 API
 */
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db/client';

// GET - 获取 Agent 详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 获取 Agent 基本信息
    const agents = await sql.unsafe(`
      SELECT * FROM arena_agents WHERE id = '${id}' OR agent_id = '${id}'
    `);

    if (!agents || agents.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Agent 不存在' },
        { status: 404 }
      );
    }

    const agent = agents[0] as any;

    // 获取当前持仓
    const positions = await sql.unsafe(`
      SELECT 
        id, symbol, symbol_name, market,
        quantity, available_quantity, avg_cost, current_price,
        market_value, profit_loss, profit_loss_pct,
        position_pct, status, opened_at
      FROM positions
      WHERE arena_agent_id = '${agent.id}' AND status = 'open'
      ORDER BY market_value DESC
    `);

    // 获取最近交易记录
    const trades = await sql.unsafe(`
      SELECT 
        id, symbol, symbol_name, market,
        side, order_type, quantity, price, amount,
        commission, total_cost, realized_profit, realized_profit_pct,
        status, executed_at, signal_source, notes
      FROM trades
      WHERE arena_agent_id = '${agent.id}'
      ORDER BY executed_at DESC
      LIMIT 20
    `);

    // 获取净值曲线（最近30天）
    const snapshots = await sql.unsafe(`
      SELECT 
        snapshot_date, total_value, cash, positions_value,
        daily_return, daily_return_pct, cumulative_return, cumulative_return_pct,
        positions_count
      FROM daily_snapshots
      WHERE arena_agent_id = '${agent.id}'
      ORDER BY snapshot_date DESC
      LIMIT 30
    `);

    // 格式化返回数据
    const result = {
      agent: {
        id: agent.agent_id,
        arenaId: agent.id,
        name: agent.name,
        avatar: agent.avatar,
        bio: agent.bio,
        status: agent.status,
        rank: agent.rank,
        rankChange: agent.rank_change,
        createdAt: agent.created_at,
        lastTradeAt: agent.last_trade_at,
      },
      capital: {
        initial: Number(agent.initial_capital),
        current: Number(agent.current_capital),
        profit: Number(agent.current_capital) - Number(agent.initial_capital),
      },
      metrics: {
        totalReturn: Number(agent.total_return) || 0,
        totalReturnPct: Number(agent.total_return_pct) || 0,
        maxDrawdown: Number(agent.max_drawdown) || 0,
        sharpeRatio: Number(agent.sharpe_ratio) || 0,
        winRate: Number(agent.win_rate) || 0,
        profitFactor: Number(agent.profit_factor) || 0,
        totalProfit: Number(agent.total_profit) || 0,
        totalLoss: Number(agent.total_loss) || 0,
      },
      trades: {
        total: agent.total_trades || 0,
        winning: agent.winning_trades || 0,
        losing: agent.losing_trades || 0,
      },
      positions: positions.map((p: any) => ({
        id: p.id,
        symbol: p.symbol,
        name: p.symbol_name,
        market: p.market,
        quantity: Number(p.quantity),
        available: Number(p.available_quantity),
        avgCost: Number(p.avg_cost),
        currentPrice: Number(p.current_price) || 0,
        marketValue: Number(p.market_value) || 0,
        profitLoss: Number(p.profit_loss) || 0,
        profitLossPct: Number(p.profit_loss_pct) || 0,
        positionPct: Number(p.position_pct) || 0,
        status: p.status,
        openedAt: p.opened_at,
      })),
      recentTrades: trades.map((t: any) => ({
        id: t.id,
        symbol: t.symbol,
        name: t.symbol_name,
        market: t.market,
        side: t.side,
        type: t.order_type,
        quantity: Number(t.quantity),
        price: Number(t.price),
        amount: Number(t.amount),
        commission: Number(t.commission) || 0,
        totalCost: Number(t.total_cost),
        realizedProfit: Number(t.realized_profit) || 0,
        realizedProfitPct: Number(t.realized_profit_pct) || 0,
        status: t.status,
        executedAt: t.executed_at,
        signal: t.signal_source,
        notes: t.notes,
      })),
      performance: {
        snapshots: snapshots.reverse().map((s: any) => ({
          date: s.snapshot_date,
          totalValue: Number(s.total_value),
          cash: Number(s.cash),
          positionsValue: Number(s.positions_value),
          dailyReturn: Number(s.daily_return) || 0,
          dailyReturnPct: Number(s.daily_return_pct) || 0,
          cumulativeReturn: Number(s.cumulative_return) || 0,
          cumulativeReturnPct: Number(s.cumulative_return_pct) || 0,
          positionsCount: s.positions_count,
        })),
      },
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Arena] 获取 Agent 详情失败:', error);
    return NextResponse.json(
      { success: false, error: '获取详情失败' },
      { status: 500 }
    );
  }
}