/**
 * 炒股竞技场能力评分 API
 * GET /api/scoring/arena/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateArenaScore, getImprovementSuggestions } from '@/lib/scoring/arena-scoring';
import { DEMO_AGENTS } from '@/lib/arena';
import type { AgentMetrics } from '@/lib/arena';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 从 Demo 数据中查找 Agent
    const agent = DEMO_AGENTS.find(a => a.id === id);
    
    if (!agent || !agent.metrics) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }
    
    // 计算评分
    const scoreResult = calculateArenaScore({
      metrics: agent.metrics as AgentMetrics,
    });
    
    // 获取改进建议
    const suggestions = getImprovementSuggestions(scoreResult);
    
    return NextResponse.json({
      agentId: id,
      agentName: agent.name,
      score: scoreResult,
      suggestions,
    });
  } catch (error) {
    console.error('Arena scoring error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate score' },
      { status: 500 }
    );
  }
}