/**
 * 炒股竞技场能力评分算法
 * 
 * 评分维度：
 * 1. 收益能力 (40%)：总收益率、日收益
 * 2. 风险控制 (25%)：最大回撤
 * 3. 交易技巧 (20%)：胜率、盈亏比
 * 4. 稳定性 (15%)：夏普比率、交易频率
 */

import type { AgentMetrics } from '../arena';
import { getAbilityLevel } from './index';
import type { ArenaScoringInput, ArenaScoreDetail, ScoreResult, ScoreDimension } from './types';

// ========== 评分权重配置 ==========

const WEIGHTS = {
  profitability: 0.40,  // 收益能力
  riskControl: 0.25,    // 风险控制
  tradingSkill: 0.20,   // 交易技巧
  stability: 0.15,      // 稳定性
};

// ========== 评分算法 ==========

/**
 * 计算收益能力得分 (0-100)
 * 
 * 评分标准：
 * - 收益率 >= 100%: 100分
 * - 收益率 >= 50%: 90分
 * - 收益率 >= 30%: 80分
 * - 收益率 >= 20%: 70分
 * - 收益率 >= 10%: 60分
 * - 收益率 >= 0%: 50分
 * - 收益率 < 0%: 线性递减
 */
export function calculateProfitabilityScore(metrics: AgentMetrics): {
  score: number;
  totalReturn: number;
  dailyReturn: number;
} {
  const { totalReturn, dailyReturn } = metrics;
  
  let score: number;
  
  if (totalReturn >= 100) {
    score = 100;
  } else if (totalReturn >= 50) {
    // 50-100%: 90-100分
    score = 90 + (totalReturn - 50) * 0.2;
  } else if (totalReturn >= 30) {
    // 30-50%: 80-90分
    score = 80 + (totalReturn - 30) * 0.5;
  } else if (totalReturn >= 20) {
    // 20-30%: 70-80分
    score = 70 + (totalReturn - 20) * 1.0;
  } else if (totalReturn >= 10) {
    // 10-20%: 60-70分
    score = 60 + (totalReturn - 10) * 1.0;
  } else if (totalReturn >= 0) {
    // 0-10%: 50-60分
    score = 50 + totalReturn;
  } else {
    // 亏损：线性递减，最多到0分
    score = Math.max(0, 50 + totalReturn);
  }
  
  return {
    score: Math.min(100, Math.max(0, score)),
    totalReturn,
    dailyReturn,
  };
}

/**
 * 计算风险控制得分 (0-100)
 * 
 * 评分标准（基于最大回撤）：
 * - 回撤 <= 5%: 100分（优秀）
 * - 回撤 <= 10%: 90分
 * - 回撤 <= 15%: 80分
 * - 回撤 <= 20%: 70分
 * - 回撤 <= 30%: 60分
 * - 回撤 > 30%: 递减
 */
export function calculateRiskControlScore(metrics: AgentMetrics): {
  score: number;
  maxDrawdown: number;
  drawdownScore: number;
} {
  const { maxDrawdown } = metrics;
  
  let score: number;
  
  if (maxDrawdown <= 5) {
    score = 100;
  } else if (maxDrawdown <= 10) {
    score = 100 - (maxDrawdown - 5) * 2;
  } else if (maxDrawdown <= 15) {
    score = 90 - (maxDrawdown - 10) * 2;
  } else if (maxDrawdown <= 20) {
    score = 80 - (maxDrawdown - 15) * 2;
  } else if (maxDrawdown <= 30) {
    score = 70 - (maxDrawdown - 20) * 1;
  } else {
    // 回撤 > 30%，严重风险
    score = Math.max(0, 60 - (maxDrawdown - 30) * 2);
  }
  
  return {
    score: Math.min(100, Math.max(0, score)),
    maxDrawdown,
    drawdownScore: score,
  };
}

/**
 * 计算交易技巧得分 (0-100)
 * 
 * 综合胜率和盈亏比
 */
export function calculateTradingSkillScore(metrics: AgentMetrics): {
  score: number;
  winRate: number;
  profitFactor: number;
} {
  const { winRate, profitFactor } = metrics;
  
  // 胜率得分 (0-100)
  // 胜率 >= 70%: 优秀
  // 胜率 >= 50%: 一般
  // 胜率 < 50%: 较差
  const winRateScore = Math.min(100, winRate * 1.2);
  
  // 盈亏比得分 (0-100)
  // 盈亏比 >= 3: 100分
  // 盈亏比 >= 2: 80分
  // 盈亏比 >= 1: 60分
  let profitFactorScore: number;
  if (profitFactor >= 3) {
    profitFactorScore = 100;
  } else if (profitFactor >= 2) {
    profitFactorScore = 80 + (profitFactor - 2) * 20;
  } else if (profitFactor >= 1) {
    profitFactorScore = 60 + (profitFactor - 1) * 20;
  } else {
    profitFactorScore = Math.max(0, profitFactor * 60);
  }
  
  // 综合得分：胜率占60%，盈亏比占40%
  const score = winRateScore * 0.6 + profitFactorScore * 0.4;
  
  return {
    score: Math.min(100, Math.max(0, score)),
    winRate,
    profitFactor,
  };
}

/**
 * 计算稳定性得分 (0-100)
 * 
 * 基于夏普比率和交易频率
 */
export function calculateStabilityScore(
  metrics: AgentMetrics,
  tradingDays: number = 252
): {
  score: number;
  sharpeRatio: number;
  tradeFrequency: number;
} {
  const { sharpeRatio, totalTrades } = metrics;
  
  // 夏普比率得分 (0-100)
  // 夏普 >= 2: 100分（优秀）
  // 夏普 >= 1: 80分（良好）
  // 夏普 >= 0.5: 60分（一般）
  let sharpeScore: number;
  if (sharpeRatio >= 2) {
    sharpeScore = 100;
  } else if (sharpeRatio >= 1) {
    sharpeScore = 80 + (sharpeRatio - 1) * 20;
  } else if (sharpeRatio >= 0.5) {
    sharpeScore = 60 + (sharpeRatio - 0.5) * 40;
  } else if (sharpeRatio >= 0) {
    sharpeScore = sharpeRatio * 120;
  } else {
    sharpeScore = 0;
  }
  
  // 交易频率得分 (0-100)
  // 合理频率：平均每天 0.5-2 笔交易
  const avgTradesPerDay = totalTrades / tradingDays;
  let frequencyScore: number;
  if (avgTradesPerDay >= 0.5 && avgTradesPerDay <= 2) {
    frequencyScore = 100;
  } else if (avgTradesPerDay > 2 && avgTradesPerDay <= 5) {
    frequencyScore = 80;
  } else if (avgTradesPerDay > 5) {
    frequencyScore = Math.max(50, 80 - (avgTradesPerDay - 5) * 10);
  } else if (avgTradesPerDay > 0) {
    frequencyScore = avgTradesPerDay * 100; // 交易太少也不稳定
  } else {
    frequencyScore = 0;
  }
  
  // 综合得分：夏普比率占70%，交易频率占30%
  const score = sharpeScore * 0.7 + frequencyScore * 0.3;
  
  return {
    score: Math.min(100, Math.max(0, score)),
    sharpeRatio,
    tradeFrequency: avgTradesPerDay,
  };
}

// ========== 综合评分计算 ==========

/**
 * 计算炒股竞技场综合评分
 */
export function calculateArenaScore(
  input: ArenaScoringInput
): ScoreResult {
  const { metrics, tradingDays = 252 } = input;
  
  // 计算各维度得分
  const profitabilityResult = calculateProfitabilityScore(metrics);
  const riskControlResult = calculateRiskControlScore(metrics);
  const tradingSkillResult = calculateTradingSkillScore(metrics);
  const stabilityResult = calculateStabilityScore(metrics, tradingDays);
  
  // 加权计算总分
  const totalScore = 
    profitabilityResult.score * WEIGHTS.profitability +
    riskControlResult.score * WEIGHTS.riskControl +
    tradingSkillResult.score * WEIGHTS.tradingSkill +
    stabilityResult.score * WEIGHTS.stability;
  
  // 获取能力等级
  const levelInfo = getAbilityLevel(totalScore);
  
  // 构建维度详情
  const dimensions: ScoreDimension[] = [
    {
      name: '收益能力',
      weight: WEIGHTS.profitability,
      score: profitabilityResult.score,
      rawValue: profitabilityResult.totalReturn,
      normalizedScore: profitabilityResult.score * WEIGHTS.profitability,
      description: `总收益率 ${profitabilityResult.totalReturn.toFixed(2)}%`,
    },
    {
      name: '风险控制',
      weight: WEIGHTS.riskControl,
      score: riskControlResult.score,
      rawValue: riskControlResult.maxDrawdown,
      normalizedScore: riskControlResult.score * WEIGHTS.riskControl,
      description: `最大回撤 ${riskControlResult.maxDrawdown.toFixed(2)}%`,
    },
    {
      name: '交易技巧',
      weight: WEIGHTS.tradingSkill,
      score: tradingSkillResult.score,
      rawValue: tradingSkillResult.winRate,
      normalizedScore: tradingSkillResult.score * WEIGHTS.tradingSkill,
      description: `胜率 ${tradingSkillResult.winRate.toFixed(1)}%，盈亏比 ${tradingSkillResult.profitFactor.toFixed(2)}`,
    },
    {
      name: '稳定性',
      weight: WEIGHTS.stability,
      score: stabilityResult.score,
      rawValue: stabilityResult.sharpeRatio,
      normalizedScore: stabilityResult.score * WEIGHTS.stability,
      description: `夏普比率 ${stabilityResult.sharpeRatio.toFixed(2)}`,
    },
  ];
  
  return {
    totalScore: Math.round(totalScore * 100) / 100,
    level: levelInfo.level,
    levelInfo: {
      label: levelInfo.label,
      color: levelInfo.color,
      desc: levelInfo.desc,
    },
    dimensions,
    timestamp: new Date(),
  };
}

/**
 * 批量计算 Agent 评分并排名
 */
export function calculateArenaScores(
  agents: Array<{ id: string; metrics: AgentMetrics }>
): Array<{ id: string; score: ScoreResult }> {
  const results = agents.map(agent => ({
    id: agent.id,
    score: calculateArenaScore({ metrics: agent.metrics }),
  }));
  
  // 按总分排序
  results.sort((a, b) => b.score.totalScore - a.score.totalScore);
  
  // 添加排名和百分位
  const total = results.length;
  results.forEach((result, index) => {
    result.score.rank = index + 1;
    result.score.percentile = Math.round(((total - index) / total) * 100);
  });
  
  return results;
}

/**
 * 获取评分改进建议
 */
export function getImprovementSuggestions(result: ScoreResult): string[] {
  const suggestions: string[] = [];
  
  for (const dim of result.dimensions) {
    if (dim.score < 60) {
      switch (dim.name) {
        case '收益能力':
          suggestions.push('💡 优化选股策略，提高收益率');
          break;
        case '风险控制':
          suggestions.push('🛡️ 加强止损机制，控制最大回撤');
          break;
        case '交易技巧':
          suggestions.push('📊 提升交易胜率和盈亏比');
          break;
        case '稳定性':
          suggestions.push('📈 提高夏普比率，保持稳定收益');
          break;
      }
    }
  }
  
  if (suggestions.length === 0 && result.totalScore >= 80) {
    suggestions.push('🌟 表现优秀，继续保持！');
  }
  
  return suggestions;
}