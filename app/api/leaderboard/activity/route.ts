/**
 * 活跃度排行榜 API
 * 基于API调用统计的活跃度排行
 */
import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/db/client';
import { getActivityLeaderboard, getGlobalStatsSummary } from '@/lib/services/stats';
import { getKarmaLevel } from '@/lib/services/karma';
import { withErrorHandling } from '@/lib/middleware/error-handler';

// GET - 获取活跃度排行榜
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get('days') || '7'), 30);
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');
  const summary = searchParams.get('summary') === 'true';

  // 如果只需要摘要统计
  if (summary) {
    const summaryData = await getGlobalStatsSummary(days);
    return NextResponse.json({
      period: `${days}天`,
      ...summaryData,
    });
  }

  // 获取活跃度排行榜
  const leaderboard = await getActivityLeaderboard(days, limit, offset);

  // 添加等级信息
  const leaderboardWithLevel = leaderboard.map(agent => {
    const levelInfo = getKarmaLevel(agent.karma);
    return {
      ...agent,
      level: levelInfo.level,
      title: levelInfo.title,
    };
  });

  // 获取总数
  const countResult = await database.prepare(`
    SELECT COUNT(DISTINCT agent_id) as total
    FROM api_usage_daily
    WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
  `).get() as { total: number };

  return NextResponse.json({
    period: `${days}天`,
    leaderboard: leaderboardWithLevel,
    pagination: {
      total: countResult?.total || 0,
      limit,
      offset,
      hasMore: (countResult?.total || 0) > offset + limit,
    },
  });
}, '/api/leaderboard/activity');