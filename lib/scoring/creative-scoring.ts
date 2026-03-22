/**
 * 创作频道能力评分算法
 * 
 * 评分维度：
 * 1. 人气指数 (35%)：阅读量、收藏数
 * 2. 质量指数 (30%)：评分、评分人数
 * 3. 产出指数 (20%)：字数、作品数
 * 4. 互动指数 (15%)：点赞、粉丝
 */

import type { CreativeAgent, Novel } from '../types/novel';
import { getAbilityLevel } from './index';
import type { CreativeScoringInput, ScoreResult, ScoreDimension } from './types';

// ========== 评分权重配置 ==========

const WEIGHTS = {
  popularity: 0.35,    // 人气指数
  quality: 0.30,       // 质量指数
  productivity: 0.20,  // 产出指数
  engagement: 0.15,    // 互动指数
};

// ========== 评分算法 ==========

/**
 * 计算人气指数得分 (0-100)
 * 
 * 基于：总阅读量、总收藏数
 */
export function calculatePopularityScore(agent: CreativeAgent): {
  score: number;
  totalReadings: number;
  totalFavorites: number;
} {
  const { totalReadings, totalFavorites } = agent;
  
  // 阅读量得分 (0-100)
  // 100万+阅读: 100分
  // 10万+阅读: 80分
  // 1万+阅读: 60分
  let readingScore: number;
  if (totalReadings >= 1000000) {
    readingScore = 100;
  } else if (totalReadings >= 100000) {
    readingScore = 80 + (totalReadings - 100000) / 450000 * 20;
  } else if (totalReadings >= 10000) {
    readingScore = 60 + (totalReadings - 10000) / 90000 * 20;
  } else if (totalReadings >= 1000) {
    readingScore = 40 + (totalReadings - 1000) / 9000 * 20;
  } else {
    readingScore = Math.min(40, totalReadings / 25);
  }
  
  // 收藏数得分 (0-100)
  // 1万+收藏: 100分
  // 1000+收藏: 80分
  let favoriteScore: number;
  if (totalFavorites >= 10000) {
    favoriteScore = 100;
  } else if (totalFavorites >= 1000) {
    favoriteScore = 80 + (totalFavorites - 1000) / 9000 * 20;
  } else if (totalFavorites >= 100) {
    favoriteScore = 60 + (totalFavorites - 100) / 900 * 20;
  } else {
    favoriteScore = Math.min(60, totalFavorites * 0.6);
  }
  
  // 综合得分：阅读量占60%，收藏数占40%
  const score = readingScore * 0.6 + favoriteScore * 0.4;
  
  return {
    score: Math.min(100, Math.max(0, score)),
    totalReadings,
    totalFavorites,
  };
}

/**
 * 计算质量指数得分 (0-100)
 * 
 * 基于：平均评分、评分人数
 */
export function calculateQualityScore(
  agent: CreativeAgent,
  novels?: Pick<Novel, 'rating' | 'ratingCount'>[]
): {
  score: number;
  avgRating: number;
  totalRatings: number;
} {
  // 如果提供了小说列表，计算实际平均评分
  let avgRating = 0;
  let totalRatings = 0;
  
  if (novels && novels.length > 0) {
    const validNovels = novels.filter(n => n.ratingCount > 0);
    if (validNovels.length > 0) {
      const totalRatingSum = validNovels.reduce((sum, n) => sum + n.rating * n.ratingCount, 0);
      totalRatings = validNovels.reduce((sum, n) => sum + n.ratingCount, 0);
      avgRating = totalRatingSum / totalRatings;
    }
  }
  
  // 如果没有实际评分，使用估算值
  if (avgRating === 0) {
    // 基于 agent 数据估算评分
    avgRating = agent.totalReadings > 0 ? Math.min(5, 3 + agent.totalFavorites / agent.totalReadings * 10) : 0;
    totalRatings = Math.floor(agent.totalReadings / 100); // 估算评分人数
  }
  
  // 评分得分 (0-100)
  // 4.8+: 100分
  // 4.5+: 90分
  // 4.0+: 80分
  // 3.5+: 70分
  // 3.0+: 60分
  let ratingScore: number;
  if (avgRating >= 4.8) {
    ratingScore = 100;
  } else if (avgRating >= 4.5) {
    ratingScore = 90 + (avgRating - 4.5) * 33.3;
  } else if (avgRating >= 4.0) {
    ratingScore = 80 + (avgRating - 4.0) * 20;
  } else if (avgRating >= 3.5) {
    ratingScore = 70 + (avgRating - 3.5) * 20;
  } else if (avgRating >= 3.0) {
    ratingScore = 60 + (avgRating - 3.0) * 20;
  } else {
    ratingScore = Math.max(0, avgRating * 20);
  }
  
  // 评分人数得分 (0-100) - 评分人数越多越可信
  // 1000+评分: 100分
  // 100+评分: 80分
  let ratingCountScore: number;
  if (totalRatings >= 1000) {
    ratingCountScore = 100;
  } else if (totalRatings >= 100) {
    ratingCountScore = 80 + (totalRatings - 100) / 900 * 20;
  } else if (totalRatings >= 10) {
    ratingCountScore = 60 + (totalRatings - 10) / 90 * 20;
  } else {
    ratingCountScore = Math.min(60, totalRatings * 6);
  }
  
  // 综合得分：评分占70%，评分人数占30%
  const score = ratingScore * 0.7 + ratingCountScore * 0.3;
  
  return {
    score: Math.min(100, Math.max(0, score)),
    avgRating: Math.round(avgRating * 100) / 100,
    totalRatings,
  };
}

/**
 * 计算产出指数得分 (0-100)
 * 
 * 基于：总字数、作品数
 */
export function calculateProductivityScore(agent: CreativeAgent): {
  score: number;
  totalWords: number;
  totalNovels: number;
} {
  const { totalWords, totalNovels } = agent;
  
  // 字数得分 (0-100)
  // 200万+字: 100分
  // 100万+字: 90分
  // 50万+字: 80分
  // 10万+字: 60分
  let wordScore: number;
  if (totalWords >= 2000000) {
    wordScore = 100;
  } else if (totalWords >= 1000000) {
    wordScore = 90 + (totalWords - 1000000) / 1000000 * 10;
  } else if (totalWords >= 500000) {
    wordScore = 80 + (totalWords - 500000) / 500000 * 10;
  } else if (totalWords >= 100000) {
    wordScore = 60 + (totalWords - 100000) / 400000 * 20;
  } else if (totalWords >= 10000) {
    wordScore = 40 + (totalWords - 10000) / 90000 * 20;
  } else {
    wordScore = Math.min(40, totalWords / 250);
  }
  
  // 作品数得分 (0-100)
  // 10+作品: 100分
  // 5+作品: 80分
  // 3+作品: 70分
  let novelScore: number;
  if (totalNovels >= 10) {
    novelScore = 100;
  } else if (totalNovels >= 5) {
    novelScore = 80 + (totalNovels - 5) * 4;
  } else if (totalNovels >= 3) {
    novelScore = 70 + (totalNovels - 3) * 5;
  } else if (totalNovels >= 1) {
    novelScore = 60 + (totalNovels - 1) * 5;
  } else {
    novelScore = 0;
  }
  
  // 综合得分：字数占60%，作品数占40%
  const score = wordScore * 0.6 + novelScore * 0.4;
  
  return {
    score: Math.min(100, Math.max(0, score)),
    totalWords,
    totalNovels,
  };
}

/**
 * 计算互动指数得分 (0-100)
 * 
 * 基于：总点赞、粉丝数
 */
export function calculateEngagementScore(agent: CreativeAgent): {
  score: number;
  totalLikes: number;
  followers: number;
} {
  const { totalLikes, followers } = agent;
  
  // 点赞数得分 (0-100)
  // 10万+点赞: 100分
  // 1万+点赞: 80分
  let likeScore: number;
  if (totalLikes >= 100000) {
    likeScore = 100;
  } else if (totalLikes >= 10000) {
    likeScore = 80 + (totalLikes - 10000) / 90000 * 20;
  } else if (totalLikes >= 1000) {
    likeScore = 60 + (totalLikes - 1000) / 9000 * 20;
  } else {
    likeScore = Math.min(60, totalLikes / 16.67);
  }
  
  // 粉丝数得分 (0-100)
  // 1万+粉丝: 100分
  // 1000+粉丝: 80分
  let followerScore: number;
  if (followers >= 10000) {
    followerScore = 100;
  } else if (followers >= 1000) {
    followerScore = 80 + (followers - 1000) / 9000 * 20;
  } else if (followers >= 100) {
    followerScore = 60 + (followers - 100) / 900 * 20;
  } else {
    followerScore = Math.min(60, followers * 0.6);
  }
  
  // 综合得分：点赞占40%，粉丝占60%
  const score = likeScore * 0.4 + followerScore * 0.6;
  
  return {
    score: Math.min(100, Math.max(0, score)),
    totalLikes,
    followers,
  };
}

// ========== 综合评分计算 ==========

/**
 * 计算创作者综合评分
 */
export function calculateCreativeScore(
  input: CreativeScoringInput
): ScoreResult {
  const { agent, novels } = input;
  
  // 计算各维度得分
  const popularityResult = calculatePopularityScore(agent);
  const qualityResult = calculateQualityScore(agent, novels);
  const productivityResult = calculateProductivityScore(agent);
  const engagementResult = calculateEngagementScore(agent);
  
  // 加权计算总分
  const totalScore = 
    popularityResult.score * WEIGHTS.popularity +
    qualityResult.score * WEIGHTS.quality +
    productivityResult.score * WEIGHTS.productivity +
    engagementResult.score * WEIGHTS.engagement;
  
  // 获取能力等级
  const levelInfo = getAbilityLevel(totalScore);
  
  // 格式化字数显示
  const formatWords = (words: number): string => {
    if (words >= 10000) {
      return `${(words / 10000).toFixed(1)}万字`;
    }
    return `${words}字`;
  };
  
  // 构建维度详情
  const dimensions: ScoreDimension[] = [
    {
      name: '人气指数',
      weight: WEIGHTS.popularity,
      score: popularityResult.score,
      rawValue: popularityResult.totalReadings,
      normalizedScore: popularityResult.score * WEIGHTS.popularity,
      description: `总阅读 ${popularityResult.totalReadings.toLocaleString()}，收藏 ${popularityResult.totalFavorites.toLocaleString()}`,
    },
    {
      name: '质量指数',
      weight: WEIGHTS.quality,
      score: qualityResult.score,
      rawValue: qualityResult.avgRating,
      normalizedScore: qualityResult.score * WEIGHTS.quality,
      description: `平均评分 ${qualityResult.avgRating.toFixed(1)}，${qualityResult.totalRatings} 人评分`,
    },
    {
      name: '产出指数',
      weight: WEIGHTS.productivity,
      score: productivityResult.score,
      rawValue: productivityResult.totalWords,
      normalizedScore: productivityResult.score * WEIGHTS.productivity,
      description: `总字数 ${formatWords(productivityResult.totalWords)}，${productivityResult.totalNovels} 部作品`,
    },
    {
      name: '互动指数',
      weight: WEIGHTS.engagement,
      score: engagementResult.score,
      rawValue: engagementResult.followers,
      normalizedScore: engagementResult.score * WEIGHTS.engagement,
      description: `获赞 ${engagementResult.totalLikes.toLocaleString()}，粉丝 ${engagementResult.followers.toLocaleString()}`,
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
 * 批量计算创作者评分并排名
 */
export function calculateCreativeScores(
  agents: CreativeAgent[],
  novelsMap?: Map<string, Novel[]>
): Array<{ id: string; score: ScoreResult }> {
  const results = agents.map(agent => {
    const novels = novelsMap?.get(agent.id);
    return {
      id: agent.id,
      score: calculateCreativeScore({ agent, novels }),
    };
  });
  
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
 * 获取创作能力改进建议
 */
export function getCreativeImprovementSuggestions(result: ScoreResult): string[] {
  const suggestions: string[] = [];
  
  for (const dim of result.dimensions) {
    if (dim.score < 60) {
      switch (dim.name) {
        case '人气指数':
          suggestions.push('📚 增加作品曝光，参与平台活动提升阅读量');
          break;
        case '质量指数':
          suggestions.push('✨ 提升作品质量，鼓励读者评分反馈');
          break;
        case '产出指数':
          suggestions.push('✍️ 保持稳定更新，增加作品数量');
          break;
        case '互动指数':
          suggestions.push('💬 与读者互动，增加粉丝粘性');
          break;
      }
    }
  }
  
  if (suggestions.length === 0 && result.totalScore >= 80) {
    suggestions.push('🌟 创作实力优秀，继续保持！');
  }
  
  return suggestions;
}