/**
 * Agent 上架审核系统核心逻辑
 * Agent Story Community - 交易市场模块
 */

import type {
  ListingApplication,
  ListingRequirements,
  ListingStatus,
  ListingRejectReason,
  ReviewLevel,
  ReviewSnapshot,
  AgentPricing,
  LISTING_RULES,
} from './types';

// ========== 审核条件检查 ==========

/**
 * 检查上架申请是否满足基本条件
 */
export function checkListingRequirements(
  hasIdentity: boolean,
  hasSoul: boolean,
  hasMemory: boolean,
  hasTools: boolean,
  hasSkill: boolean,
  hasCertification: boolean,
  certificationLevel: string,
  validatorPassed: boolean,
  validatorScore: number,
): ListingRequirements {
  return {
    hasIdentity,
    hasSoul,
    hasMemory,
    hasTools,
    hasSkill,
    hasCertification,
    certificationLevel,
    validatorPassed,
    validatorScore,
    hasExamples: false,   // 需要单独检查
    hasUserDoc: false,    // 需要单独检查
    hasAdvancedSkills: false, // 需要单独检查
  };
}

/**
 * 判断是否满足上架最低条件
 */
export function meetsMinimumRequirements(requirements: ListingRequirements): {
  met: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  
  // 检查必备文件
  if (!requirements.hasIdentity) missing.push('缺少 IDENTITY.md');
  if (!requirements.hasSoul) missing.push('缺少 SOUL.md');
  if (!requirements.hasMemory) missing.push('缺少 MEMORY.md');
  if (!requirements.hasTools) missing.push('缺少 TOOLS.md');
  if (!requirements.hasSkill) missing.push('缺少 SKILL.md');
  
  // 检查认证
  if (!requirements.hasCertification) missing.push('缺少平台认证');
  
  // 检查验证器
  if (!requirements.validatorPassed) missing.push('提示词验证未通过');
  
  return {
    met: missing.length === 0,
    missing,
  };
}

// ========== 审核级别判定 ==========

/**
 * 根据认证等级判定审核级别
 */
export function determineReviewLevel(certificationLevel: string): ReviewLevel {
  const level = certificationLevel.toLowerCase();
  
  if (level === 'diamond' || level === 'gold') {
    return 'premium';
  }
  
  if (level === 'silver') {
    return 'standard';
  }
  
  return 'auto';
}

// ========== 自动审核决策 ==========

/**
 * 自动审核决策
 */
export function autoReviewDecision(
  requirements: ListingRequirements,
  snapshot: ReviewSnapshot,
): {
  approved: boolean;
  reason?: string;
  rejectReason?: ListingRejectReason;
} {
  const { minValidatorScore, minCertificationLevel, minPerformanceScore } = {
    minValidatorScore: 80,
    minCertificationLevel: 'basic',
    minPerformanceScore: 60,
  };
  
  // 验证分数检查
  if (requirements.validatorScore < minValidatorScore) {
    return {
      approved: false,
      reason: `验证分数 ${requirements.validatorScore} 低于最低要求 ${minValidatorScore}`,
      rejectReason: 'quality_issues',
    };
  }
  
  // 绩效分数检查
  if (snapshot.performanceScore < minPerformanceScore) {
    return {
      approved: false,
      reason: `绩效分数 ${snapshot.performanceScore} 低于最低要求 ${minPerformanceScore}`,
      rejectReason: 'quality_issues',
    };
  }
  
  // 认证等级检查
  const levelOrder = ['none', 'basic', 'silver', 'gold', 'diamond'];
  const currentLevelIndex = levelOrder.indexOf(requirements.certificationLevel.toLowerCase());
  const requiredLevelIndex = levelOrder.indexOf(minCertificationLevel);
  
  if (currentLevelIndex < requiredLevelIndex) {
    return {
      approved: false,
      reason: `认证等级 ${requirements.certificationLevel} 不满足最低要求 ${minCertificationLevel}`,
      rejectReason: 'missing_certification',
    };
  }
  
  // 通过自动审核
  return { approved: true };
}

// ========== 定价验证 ==========

/**
 * 验证定价是否合法
 */
export function validatePricing(pricing: AgentPricing): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const { maxFreeTrialDays, maxOneTimePrice, maxSubscriptionPrice } = {
    maxFreeTrialDays: 30,
    maxOneTimePrice: 99999,
    maxSubscriptionPrice: 9999,
  };
  
  switch (pricing.model) {
    case 'free':
      // 免费 Agent 无需验证
      break;
      
    case 'one_time':
      if (!pricing.price || pricing.price <= 0) {
        errors.push('一次性购买价格必须大于 0');
      }
      if (pricing.price && pricing.price > maxOneTimePrice) {
        errors.push(`一次性购买价格不能超过 ${maxOneTimePrice} 元`);
      }
      break;
      
    case 'subscription':
      if (!pricing.subscriptionPrice || pricing.subscriptionPrice <= 0) {
        errors.push('订阅价格必须大于 0');
      }
      if (pricing.subscriptionPrice && pricing.subscriptionPrice > maxSubscriptionPrice) {
        errors.push(`订阅价格不能超过 ${maxSubscriptionPrice} 元/月`);
      }
      break;
      
    case 'usage_based':
      if (!pricing.usagePrice || pricing.usagePrice <= 0) {
        errors.push('按次计费价格必须大于 0');
      }
      break;
  }
  
  if (pricing.freeTrialDays && pricing.freeTrialDays > maxFreeTrialDays) {
    errors.push(`免费试用天数不能超过 ${maxFreeTrialDays} 天`);
  }
  
  return { valid: errors.length === 0, errors };
}

// ========== 状态转换 ==========

/**
 * 获取有效的状态转换
 */
export function getValidStatusTransitions(currentStatus: ListingStatus): ListingStatus[] {
  const transitions: Record<ListingStatus, ListingStatus[]> = {
    draft: ['pending'],
    pending: ['reviewing', 'rejected'],
    reviewing: ['approved', 'rejected'],
    approved: ['listed', 'rejected'],
    rejected: ['draft', 'pending'],
    listed: ['delisted'],
    delisted: ['pending', 'listed'],
  };
  
  return transitions[currentStatus] || [];
}

/**
 * 检查状态转换是否有效
 */
export function isValidStatusTransition(
  fromStatus: ListingStatus,
  toStatus: ListingStatus,
): boolean {
  const validTransitions = getValidStatusTransitions(fromStatus);
  return validTransitions.includes(toStatus);
}

// ========== 审核快照生成 ==========

/**
 * 生成审核快照
 */
export function generateReviewSnapshot(
  agentType: 'arena' | 'creative' | 'dev' | 'analysis' | 'design' | 'research',
  agentData: {
    performanceScore?: number;
    tradingDays?: number;
    totalReturn?: number;
    sharpeRatio?: number;
    winRate?: number;
    avgRating?: number;
    totalReviews?: number;
    certificationLevel: string;
    certifiedAt: Date;
    validatorScore: number;
    fileCount: number;
    totalSize: number;
  },
): ReviewSnapshot {
  return {
    performanceScore: agentData.performanceScore || 0,
    tradingDays: agentData.tradingDays,
    totalReturn: agentData.totalReturn,
    sharpeRatio: agentData.sharpeRatio,
    winRate: agentData.winRate,
    avgRating: agentData.avgRating || 0,
    totalReviews: agentData.totalReviews || 0,
    certificationLevel: agentData.certificationLevel,
    certifiedAt: agentData.certifiedAt,
    validatorScore: agentData.validatorScore,
    fileCount: agentData.fileCount,
    totalSize: agentData.totalSize,
  };
}

// ========== 审核工作流 ==========

/**
 * 执行审核工作流
 */
export async function executeReviewWorkflow(
  application: ListingApplication,
  reviewer?: string,
): Promise<{
  success: boolean;
  newStatus: ListingStatus;
  reason?: string;
  rejectReason?: ListingRejectReason;
}> {
  // Step 1: 检查最低条件
  const { met, missing } = meetsMinimumRequirements(application.requirements);
  if (!met) {
    return {
      success: false,
      newStatus: 'rejected',
      reason: missing.join('; '),
      rejectReason: 'incomplete_files',
    };
  }
  
  // Step 2: 验证定价
  const pricingValidation = validatePricing(application.pricing);
  if (!pricingValidation.valid) {
    return {
      success: false,
      newStatus: 'rejected',
      reason: pricingValidation.errors.join('; '),
      rejectReason: 'other',
    };
  }
  
  // Step 3: 判定审核级别
  const reviewLevel = determineReviewLevel(application.requirements.certificationLevel);
  
  // Step 4: 自动审核（基础认证走自动流程）
  if (reviewLevel === 'auto') {
    const snapshot: ReviewSnapshot = {
      performanceScore: application.requirements.validatorScore,
      certificationLevel: application.requirements.certificationLevel,
      certifiedAt: new Date(),
      validatorScore: application.requirements.validatorScore,
      fileCount: 5,
      totalSize: 0,
      avgRating: 0,
      totalReviews: 0,
    };
    
    const decision = autoReviewDecision(application.requirements, snapshot);
    
    if (decision.approved) {
      return {
        success: true,
        newStatus: 'approved',
        reason: '自动审核通过',
      };
    } else {
      return {
        success: false,
        newStatus: 'rejected',
        reason: decision.reason,
        rejectReason: decision.rejectReason,
      };
    }
  }
  
  // Step 5: 标准审核或高级审核需要人工介入
  return {
    success: true,
    newStatus: 'reviewing',
    reason: `进入${reviewLevel === 'standard' ? '标准' : '高级'}审核流程`,
  };
}

// ========== 导出 ==========

export const ListingStatusLabels: Record<ListingStatus, string> = {
  draft: '草稿',
  pending: '待审核',
  reviewing: '审核中',
  approved: '审核通过',
  rejected: '审核拒绝',
  listed: '已上架',
  delisted: '已下架',
};

export const RejectReasonLabels: Record<ListingRejectReason, string> = {
  incomplete_files: '文件不完整',
  invalid_identity: '身份定义不符合规范',
  invalid_skills: '技能定义不清晰',
  missing_certification: '缺少必要认证',
  quality_issues: '质量问题',
  policy_violation: '违反平台政策',
  duplicate_agent: '重复 Agent',
  other: '其他原因',
};