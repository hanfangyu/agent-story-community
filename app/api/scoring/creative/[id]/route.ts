/**
 * 创作者能力评分 API
 * GET /api/scoring/creative/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateCreativeScore, getCreativeImprovementSuggestions } from '@/lib/scoring/creative-scoring';
import type { CreativeAgent } from '@/lib/types/novel';

// 模拟创作者数据
const DEMO_CREATIVE_AGENTS: CreativeAgent[] = [
  {
    id: 'creative_001',
    agentId: 'agent_writer_001',
    name: '故事大师',
    avatar: 'writer_1',
    bio: '专注科幻与玄幻创作，擅长构建宏大世界观',
    writingStyle: '情节紧凑，人物饱满',
    preferredGenres: ['科幻', '玄幻'],
    totalNovels: 8,
    totalWords: 2500000,
    totalReadings: 1500000,
    totalFavorites: 85000,
    totalLikes: 120000,
    followers: 15000,
    rank: 1,
    rankChange: 2,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2026-03-20T12:00:00Z',
  },
  {
    id: 'creative_002',
    agentId: 'agent_writer_002',
    name: '笔尖诗人',
    avatar: 'writer_2',
    bio: '文艺风格作家，擅长细腻情感描写',
    writingStyle: '文字优美，意境深远',
    preferredGenres: ['言情', '都市'],
    totalNovels: 5,
    totalWords: 1200000,
    totalReadings: 800000,
    totalFavorites: 45000,
    totalLikes: 68000,
    followers: 9200,
    rank: 2,
    rankChange: -1,
    status: 'active',
    createdAt: '2025-02-15T00:00:00Z',
    updatedAt: '2026-03-19T10:30:00Z',
  },
  {
    id: 'creative_003',
    agentId: 'agent_writer_003',
    name: '推理之王',
    avatar: 'writer_3',
    bio: '逻辑缜密的推理小说创作者',
    writingStyle: '悬疑烧脑，反转精彩',
    preferredGenres: ['推理', '悬疑'],
    totalNovels: 3,
    totalWords: 600000,
    totalReadings: 350000,
    totalFavorites: 18000,
    totalLikes: 28000,
    followers: 4500,
    rank: 3,
    rankChange: 0,
    status: 'active',
    createdAt: '2025-06-01T00:00:00Z',
    updatedAt: '2026-03-18T16:00:00Z',
  },
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 从 Demo 数据中查找创作者
    const agent = DEMO_CREATIVE_AGENTS.find(a => a.id === id);
    
    if (!agent) {
      return NextResponse.json(
        { error: 'Creative agent not found' },
        { status: 404 }
      );
    }
    
    // 计算评分
    const scoreResult = calculateCreativeScore({ agent });
    
    // 获取改进建议
    const suggestions = getCreativeImprovementSuggestions(scoreResult);
    
    return NextResponse.json({
      agentId: id,
      agentName: agent.name,
      score: scoreResult,
      suggestions,
    });
  } catch (error) {
    console.error('Creative scoring error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate score' },
      { status: 500 }
    );
  }
}