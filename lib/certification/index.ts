/**
 * 平台认证系统核心逻辑
 * Agent Story Community - 认证机制
 */

import {
  CertificationLevel,
  CertificationLevelInfo,
  CERTIFICATION_LEVELS,
  CertificationRequirements,
  CertificationApplication,
  CertificationSnapshot,
  CertificationStatus,
  AutoReviewResult,
  CertificationGap,
  CertificationCheckResult,
  ReviewResult,
} from './types';

// ========== 认证等级判断 ==========

/**
 * 获取认证等级信息
 */
export function getLevelInfo(level: CertificationLevel): CertificationLevelInfo {
  return CERTIFICATION_LEVELS[level];
}

/**
 * 获取所有认证等级列表
 */
export function getAllLevels(): CertificationLevelInfo[] {
  return Object.values(CERTIFICATION_LEVELS);
}

/**
 * 获取可申请的认证等级
 */
export function getApplicableLevels(): CertificationLevelInfo[] {
  return ['basic', 'silver', 'gold', 'diamond'].map(
    (level) => CERTIFICATION_LEVELS[level as CertificationLevel]
  );
}

// ========== 认证条件检查 ==========

/**
 * 检查是否满足认证要求
 */
export function checkRequirements(
  snapshot: CertificationSnapshot,
  requirements: CertificationRequirements
): { met: boolean; gaps: CertificationGap[] } {
  const gaps: CertificationGap[] = [];

  if (requirements.minScore !== undefined && snapshot.score < requirements.minScore) {
    gaps.push({
      requirement: '能力评分',
      current: snapshot.score,
      required: requirements.minScore,
      gap: requirements.minScore - snapshot.score,
      unit: '分',
    });
  }

  if (requirements.minTradingDays !== undefined && snapshot.tradingDays < requirements.minTradingDays) {
    gaps.push({
      requirement: '交易天数',
      current: snapshot.tradingDays,
      required: requirements.minTradingDays,
      gap: requirements.minTradingDays - snapshot.tradingDays,
      unit: '天',
    });
  }

  if (requirements.minWinRate !== undefined && snapshot.winRate < requirements.minWinRate) {
    gaps.push({
      requirement: '胜率',
      current: snapshot.winRate,
      required: requirements.minWinRate,
      gap: requirements.minWinRate - snapshot.winRate,
      unit: '%',
    });
  }

  if (requirements.minTotalTrades !== undefined && snapshot.totalTrades < requirements.minTotalTrades) {
    gaps.push({
      requirement: '交易次数',
      current: snapshot.totalTrades,
      required: requirements.minTotalTrades,
      gap: requirements.minTotalTrades - snapshot.totalTrades,
      unit: '次',
    });
  }

  if (requirements.maxDrawdown !== undefined && snapshot.maxDrawdown > requirements.maxDrawdown) {
    gaps.push({
      requirement: '最大回撤',
      current: snapshot.maxDrawdown,
      required: requirements.maxDrawdown,
      gap: snapshot.maxDrawdown - requirements.maxDrawdown,
      unit: '%',
    });
  }

  if (requirements.minSharpeRatio !== undefined && snapshot.sharpeRatio < requirements.minSharpeRatio) {
    gaps.push({
      requirement: '夏普比率',
      current: snapshot.sharpeRatio,
      required: requirements.minSharpeRatio,
      gap: requirements.minSharpeRatio - snapshot.sharpeRatio,
      unit: '',
    });
  }

  if (requirements.minTotalReturn !== undefined && snapshot.totalReturn < requirements.minTotalReturn) {
    gaps.push({
      requirement: '总收益率',
      current: snapshot.totalReturn,
      required: requirements.minTotalReturn,
      gap: requirements.minTotalReturn - snapshot.totalReturn,
      unit: '%',
    });
  }

  return {
    met: gaps.length === 0,
    gaps,
  };
}

/**
 * 自动检查可达到的最高认证等级
 */
export function autoCheckLevel(snapshot: CertificationSnapshot): AutoReviewResult {
  const levels: CertificationLevel[] = ['diamond', 'gold', 'silver', 'basic'];
  
  let eligibleLevel: CertificationLevel = 'none';
  let suggestedLevel: CertificationLevel = 'none';
  
  // 从高到低检查
  for (const level of levels) {
    const levelInfo = CERTIFICATION_LEVELS[level];
    const { met } = checkRequirements(snapshot, levelInfo.requirements);
    
    if (met) {
      eligibleLevel = level;
      break;
    }
  }

  // 收集下一级差距
  const gaps: CertificationGap[] = [];
  const nextLevels: CertificationLevel[] = ['basic', 'silver', 'gold', 'diamond'];
  const currentIndex = nextLevels.indexOf(eligibleLevel);
  
  if (currentIndex < nextLevels.length - 1) {
    const nextLevel = nextLevels[currentIndex + 1];
    const nextLevelInfo = CERTIFICATION_LEVELS[nextLevel];
    const { gaps: nextGaps } = checkRequirements(snapshot, nextLevelInfo.requirements);
    gaps.push(...nextGaps);
  }

  return {
    eligible: eligibleLevel !== 'none',
    suggestedLevel: eligibleLevel,
    currentLevel: 'none', // 需要从实际数据获取
    canUpgrade: eligibleLevel !== 'none',
    nextLevel: currentIndex < nextLevels.length - 1 ? nextLevels[currentIndex + 1] : undefined,
    gaps,
    score: snapshot.score,
  };
}

/**
 * 全面检查所有等级
 */
export function checkAllLevels(snapshot: CertificationSnapshot): CertificationCheckResult {
  const gaps: Record<CertificationLevel, CertificationGap[]> = {
    none: [],
    basic: [],
    silver: [],
    gold: [],
    diamond: [],
  };

  const eligibleLevels: CertificationLevel[] = [];
  
  for (const [level, levelInfo] of Object.entries(CERTIFICATION_LEVELS)) {
    if (level === 'none') continue;
    
    const { met, gaps: levelGaps } = checkRequirements(snapshot, levelInfo.requirements);
    gaps[level as CertificationLevel] = levelGaps;
    
    if (met) {
      eligibleLevels.push(level as CertificationLevel);
    }
  }

  // 确定建议等级（最高可达到的）
  const suggestedLevel = eligibleLevels.length > 0 
    ? eligibleLevels[eligibleLevels.length - 1] 
    : 'none';

  return {
    canApply: eligibleLevels.length > 0,
    eligibleLevels,
    suggestedLevel,
    gaps,
    currentScore: snapshot.score,
    currentLevel: 'none', // 需要从实际数据获取
  };
}

// ========== 认证申请处理 ==========

/**
 * 生成申请 ID
 */
export function generateApplicationId(): string {
  return `cert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 创建认证申请
 */
export function createApplication(
  agentId: string,
  agentType: 'arena' | 'creative',
  requestedLevel: CertificationLevel,
  snapshot: CertificationSnapshot,
  currentLevel: CertificationLevel = 'none'
): CertificationApplication {
  const now = new Date();
  
  return {
    id: generateApplicationId(),
    agentId,
    agentType,
    requestedLevel,
    currentLevel,
    status: 'pending',
    snapshot,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 自动审核申请
 */
export function autoReviewApplication(
  application: CertificationApplication
): ReviewResult {
  const levelInfo = CERTIFICATION_LEVELS[application.requestedLevel];
  const { met, gaps } = checkRequirements(application.snapshot, levelInfo.requirements);

  if (met) {
    return {
      approved: true,
      level: application.requestedLevel,
      note: '自动审核通过',
    };
  }

  // 检查是否满足更低等级
  const autoResult = autoCheckLevel(application.snapshot);
  
  if (autoResult.eligible && autoResult.suggestedLevel !== 'none') {
    return {
      approved: true,
      level: autoResult.suggestedLevel,
      note: `自动降级通过，建议等级：${CERTIFICATION_LEVELS[autoResult.suggestedLevel].label}`,
    };
  }

  return {
    approved: false,
    rejectionReason: `不满足认证条件：${gaps.map(g => `${g.requirement}差距 ${g.gap}${g.unit}`).join('、')}`,
  };
}

// ========== 认证状态管理 ==========

/**
 * 认证是否有效
 */
export function isCertificationValid(
  application: CertificationApplication
): boolean {
  if (application.status !== 'approved') return false;
  
  if (application.expiresAt && new Date() > application.expiresAt) {
    return false;
  }
  
  return true;
}

/**
 * 计算认证有效期（默认 90 天）
 */
export function calculateExpiryDate(from: Date = new Date()): Date {
  const expiry = new Date(from);
  expiry.setDate(expiry.getDate() + 90);
  return expiry;
}

/**
 * 获取认证进度百分比
 */
export function getCertificationProgress(
  snapshot: CertificationSnapshot,
  targetLevel: CertificationLevel
): number {
  const levelInfo = CERTIFICATION_LEVELS[targetLevel];
  const requirements = levelInfo.requirements;
  
  let totalProgress = 0;
  let requirementCount = 0;
  
  if (requirements.minScore !== undefined) {
    totalProgress += Math.min(100, (snapshot.score / requirements.minScore) * 100);
    requirementCount++;
  }
  
  if (requirements.minTradingDays !== undefined) {
    totalProgress += Math.min(100, (snapshot.tradingDays / requirements.minTradingDays) * 100);
    requirementCount++;
  }
  
  if (requirements.minWinRate !== undefined) {
    totalProgress += Math.min(100, (snapshot.winRate / requirements.minWinRate) * 100);
    requirementCount++;
  }
  
  if (requirements.minTotalTrades !== undefined) {
    totalProgress += Math.min(100, (snapshot.totalTrades / requirements.minTotalTrades) * 100);
    requirementCount++;
  }
  
  return requirementCount > 0 ? totalProgress / requirementCount : 0;
}

// ========== 徽章生成 ==========

/**
 * 获取徽章显示文本
 */
export function getBadgeText(level: CertificationLevel): string {
  const info = CERTIFICATION_LEVELS[level];
  return `${info.icon} ${info.label}`;
}

/**
 * 获取徽章样式
 */
export function getBadgeStyle(level: CertificationLevel): {
  color: string;
  backgroundColor: string;
  borderColor: string;
} {
  const info = CERTIFICATION_LEVELS[level];
  return {
    color: info.color,
    backgroundColor: info.bgColor,
    borderColor: info.borderColor,
  };
}

// ========== 导出 ==========

export * from './types';