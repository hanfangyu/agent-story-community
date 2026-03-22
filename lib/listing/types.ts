/**
 * Agent 上架审核系统类型定义
 * Agent Story Community - 交易市场模块
 */

// ========== 审核状态 ==========

export type ListingStatus = 
  | 'draft'      // 草稿
  | 'pending'    // 待审核
  | 'reviewing'  // 审核中
  | 'approved'   // 审核通过
  | 'rejected'   // 审核拒绝
  | 'listed'     // 已上架
  | 'delisted';  // 已下架

export type ListingRejectReason = 
  | 'incomplete_files'        // 文件不完整
  | 'invalid_identity'        // 身份定义不符合规范
  | 'invalid_skills'          // 技能定义不清晰
  | 'missing_certification'   // 缺少必要认证
  | 'quality_issues'          // 质量问题
  | 'policy_violation'        // 违反平台政策
  | 'duplicate_agent'         // 重复 Agent
  | 'other';                  // 其他

// ========== 审核等级 ==========

export type ReviewLevel = 
  | 'auto'      // 自动审核（基础认证 Agent）
  | 'standard'  // 标准审核（银牌认证 Agent）
  | 'premium';  // 高级审核（金牌/钻石认证 Agent）

// ========== 审核条件 ==========

export interface ListingRequirements {
  // 必要条件
  hasIdentity: boolean;       // 有完整 IDENTITY.md
  hasSoul: boolean;           // 有完整 SOUL.md
  hasMemory: boolean;         // 有完整 MEMORY.md
  hasTools: boolean;          // 有完整 TOOLS.md
  hasSkill: boolean;          // 有完整 SKILL.md
  
  // 认证要求
  hasCertification: boolean;  // 至少基础认证
  certificationLevel: string; // 认证等级
  
  // 质量要求
  validatorPassed: boolean;   // 通过提示词验证器
  validatorScore: number;     // 验证分数 (0-100)
  
  // 可选加分项
  hasExamples: boolean;       // 有示例文件
  hasUserDoc: boolean;        // 有 USER.md
  hasAdvancedSkills: boolean; // 有高级技能目录
}

// ========== 上架申请 ==========

export interface ListingApplication {
  id: string;
  agentId: string;
  agentName: string;
  agentType: 'arena' | 'creative' | 'dev' | 'analysis' | 'design' | 'research';
  
  // 提示词信息
  promptFiles: PromptFile[];
  promptPackageUrl?: string;  // 提示词打包下载地址
  
  // 审核信息
  status: ListingStatus;
  reviewLevel: ReviewLevel;
  requirements: ListingRequirements;
  
  // 定价信息
  pricing: AgentPricing;
  
  // 审核结果
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNote?: string;
  rejectReason?: ListingRejectReason;
  rejectDetail?: string;
  
  // 时间戳
  createdAt: Date;
  updatedAt: Date;
  listedAt?: Date;
  delistedAt?: Date;
}

// ========== 提示词文件 ==========

export interface PromptFile {
  filename: string;
  content: string;
  size: number;          // 字节数
  checksum: string;      // MD5 校验
  isValid: boolean;      // 是否通过验证
  validationErrors?: string[];
}

// ========== 定价模型 ==========

export type PricingModel = 'free' | 'one_time' | 'subscription' | 'usage_based';

export interface AgentPricing {
  model: PricingModel;
  price?: number;            // 一次性价格（元）
  subscriptionPrice?: number; // 订阅价格（元/月）
  usagePrice?: number;       // 按次计费价格（元/次）
  freeTrialDays?: number;    // 免费试用天数
}

// ========== 审核快照 ==========

export interface ReviewSnapshot {
  // Agent 绩效快照
  performanceScore: number;
  tradingDays?: number;
  totalReturn?: number;
  sharpeRatio?: number;
  winRate?: number;
  
  // 用户评价快照
  avgRating: number;
  totalReviews: number;
  
  // 认证快照
  certificationLevel: string;
  certifiedAt: Date;
  
  // 提示词验证快照
  validatorScore: number;
  fileCount: number;
  totalSize: number;
}

// ========== 审核规则 ==========

export const LISTING_RULES = {
  // 自动审核条件（银牌以下走自动审核）
  autoApprove: {
    minValidatorScore: 80,
    minCertificationLevel: 'basic',
    minPerformanceScore: 60,
  },
  
  // 标准审核条件
  standardReview: {
    minValidatorScore: 70,
    minCertificationLevel: 'basic',
  },
  
  // 高级审核条件（金牌/钻石）
  premiumReview: {
    minValidatorScore: 60,
    minCertificationLevel: 'silver',
  },
  
  // 定价限制
  pricing: {
    maxFreeTrialDays: 30,
    maxOneTimePrice: 99999,
    maxSubscriptionPrice: 9999,
  },
} as const;

// ========== 审核工作流 ==========

export interface ReviewWorkflow {
  step: number;
  action: string;
  status: 'pending' | 'completed' | 'failed';
  reviewer?: string;
  note?: string;
  completedAt?: Date;
}

export const REVIEW_WORKFLOW_STEPS = [
  { step: 1, action: '文件完整性检查', auto: true },
  { step: 2, action: '提示词规范验证', auto: true },
  { step: 3, action: '认证状态检查', auto: true },
  { step: 4, action: '质量评分计算', auto: true },
  { step: 5, action: '自动审核决策', auto: true },
  { step: 6, action: '人工审核（如需）', auto: false },
  { step: 7, action: '最终批准', auto: false },
] as const;

// ========== 上架状态变更 ==========

export interface ListingStatusChange {
  id: string;
  applicationId: string;
  fromStatus: ListingStatus;
  toStatus: ListingStatus;
  reason: string;
  changedBy: string;
  changedAt: Date;
}