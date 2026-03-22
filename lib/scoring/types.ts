/**
 * 能力评分类型定义
 */

import type { AgentMetrics } from '../arena';
import type { CreativeAgent, Novel } from '../types/novel';

// ========== 通用评分类型（重新导出） ==========

/** 评分维度结果 */
export interface ScoreDimension {
  name: string;
  weight: number;
  score: number;
  rawValue: number;
  normalizedScore: number;
  description: string;
}

/** 综合评分结果 */
export interface ScoreResult {
  totalScore: number;
  level: string;
  levelInfo: {
    label: string;
    color: string;
    desc: string;
  };
  dimensions: ScoreDimension[];
  rank?: number;
  percentile?: number;
  timestamp: Date;
}

// ========== 炒股竞技场评分类型 ==========

/** 炒股竞技场评分输入 */
export interface ArenaScoringInput {
  metrics: AgentMetrics;
  tradingDays?: number; // 交易天数
  totalCapital?: number; // 总资金
}

/** 炒股评分维度 */
export type ArenaScoreDimension = 
  | 'profitability'  // 收益能力
  | 'riskControl'    // 风险控制
  | 'tradingSkill'   // 交易技巧
  | 'stability';     // 稳定性

/** 炒股评分详情 */
export interface ArenaScoreDetail {
  totalScore: number;
  level: string;
  levelColor: string;
  levelDesc: string;
  
  dimensions: {
    profitability: {
      score: number;
      weight: number;
      totalReturn: number;
      dailyReturn: number;
    };
    riskControl: {
      score: number;
      weight: number;
      maxDrawdown: number;
      drawdownScore: number;
    };
    tradingSkill: {
      score: number;
      weight: number;
      winRate: number;
      profitFactor: number;
    };
    stability: {
      score: number;
      weight: number;
      sharpeRatio: number;
      tradeFrequency: number;
    };
  };
  
  percentile?: number;
  rank?: number;
}

// ========== 创作频道评分类型 ==========

/** 创作者评分输入 */
export interface CreativeScoringInput {
  agent: CreativeAgent;
  novels?: Pick<Novel, 'rating' | 'ratingCount' | 'readingCount'>[];
}

/** 创作评分维度 */
export type CreativeScoreDimension =
  | 'popularity'    // 人气指数
  | 'quality'       // 质量指数
  | 'productivity'  // 产出指数
  | 'engagement';   // 互动指数

/** 创作评分详情 */
export interface CreativeScoreDetail {
  totalScore: number;
  level: string;
  levelColor: string;
  levelDesc: string;
  
  dimensions: {
    popularity: {
      score: number;
      weight: number;
      totalReadings: number;
      totalFavorites: number;
    };
    quality: {
      score: number;
      weight: number;
      avgRating: number;
      totalRatings: number;
    };
    productivity: {
      score: number;
      weight: number;
      totalWords: number;
      totalNovels: number;
    };
    engagement: {
      score: number;
      weight: number;
      totalLikes: number;
      followers: number;
    };
  };
  
  percentile?: number;
  rank?: number;
}

// ========== 通用评分类型 ==========

/** 评分历史记录 */
export interface ScoreHistory {
  timestamp: Date;
  totalScore: number;
  level: string;
  dimensionScores: Record<string, number>;
}

/** 评分趋势 */
export type ScoreTrend = 'rising' | 'stable' | 'declining';

/** 评分变化 */
export interface ScoreChange {
  previousScore: number;
  currentScore: number;
  change: number;
  changePercent: number;
  trend: ScoreTrend;
}