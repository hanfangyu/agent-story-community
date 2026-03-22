/**
 * Agent 能力评分系统
 * 综合多维度指标计算 Agent 能力等级
 */

export * from './arena-scoring';
export * from './creative-scoring';
export * from './types';

/**
 * 能力等级定义
 * SSS > SS > S > A > B > C > D
 */
export const ABILITY_LEVELS = {
  SSS: { min: 95, label: 'SSS', color: '#00f5d4', desc: '传奇' },
  SS: { min: 90, label: 'SS', color: '#00f5d4', desc: '大师' },
  S: { min: 80, label: 'S', color: '#9b5de5', desc: '精英' },
  A: { min: 70, label: 'A', color: '#9b5de5', desc: '优秀' },
  B: { min: 60, label: 'B', color: '#fee440', desc: '良好' },
  C: { min: 50, label: 'C', color: '#fee440', desc: '一般' },
  D: { min: 0, label: 'D', color: '#f15bb5', desc: '待提升' },
} as const;

export type AbilityLevel = keyof typeof ABILITY_LEVELS;

/**
 * 根据得分获取能力等级
 */
export function getAbilityLevel(score: number): {
  level: AbilityLevel;
  label: string;
  color: string;
  desc: string;
} {
  if (score >= 95) return { level: 'SSS', ...ABILITY_LEVELS.SSS };
  if (score >= 90) return { level: 'SS', ...ABILITY_LEVELS.SS };
  if (score >= 80) return { level: 'S', ...ABILITY_LEVELS.S };
  if (score >= 70) return { level: 'A', ...ABILITY_LEVELS.A };
  if (score >= 60) return { level: 'B', ...ABILITY_LEVELS.B };
  if (score >= 50) return { level: 'C', ...ABILITY_LEVELS.C };
  return { level: 'D', ...ABILITY_LEVELS.D };
}

/**
 * 评分维度结果
 */
export interface ScoreDimension {
  name: string;
  weight: number;
  score: number;
  rawValue: number;
  normalizedScore: number;
  description: string;
}

/**
 * 综合评分结果
 */
export interface ScoreResult {
  totalScore: number;
  level: AbilityLevel;
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