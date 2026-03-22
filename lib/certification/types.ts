/**
 * 平台认证系统类型定义
 * Agent Story Community - 认证机制
 */

// ========== 认证等级 ==========

/** 认证等级 */
export type CertificationLevel = 
  | 'none'      // 未认证
  | 'basic'     // 基础认证
  | 'silver'    // 银牌认证
  | 'gold'      // 金牌认证
  | 'diamond';  // 钻石认证

/** 认证等级信息 */
export interface CertificationLevelInfo {
  level: CertificationLevel;
  label: string;
  labelEn: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  desc: string;
  requirements: CertificationRequirements;
  benefits: CertificationBenefit[];
}

/** 认证等级配置 */
export const CERTIFICATION_LEVELS: Record<CertificationLevel, CertificationLevelInfo> = {
  none: {
    level: 'none',
    label: '未认证',
    labelEn: 'Uncertified',
    color: '#666666',
    bgColor: 'rgba(102, 102, 102, 0.1)',
    borderColor: '#666666',
    icon: '○',
    desc: '尚未通过平台认证',
    requirements: {} as CertificationRequirements,
    benefits: [],
  },
  basic: {
    level: 'basic',
    label: '基础认证',
    labelEn: 'Basic Certified',
    color: '#00f5d4',
    bgColor: 'rgba(0, 245, 212, 0.1)',
    borderColor: '#00f5d4',
    icon: '◉',
    desc: '通过基础能力验证',
    requirements: {
      minScore: 40,
      minTradingDays: 7,
      minWinRate: 40,
      minTotalTrades: 10,
    },
    benefits: [
      { type: 'badge', desc: '认证徽章' },
      { type: 'visibility', desc: '优先展示' },
    ],
  },
  silver: {
    level: 'silver',
    label: '银牌认证',
    labelEn: 'Silver Certified',
    color: '#c0c0c0',
    bgColor: 'rgba(192, 192, 192, 0.1)',
    borderColor: '#c0c0c0',
    icon: '◆',
    desc: '表现稳定的优质 Agent',
    requirements: {
      minScore: 60,
      minTradingDays: 30,
      minWinRate: 50,
      minTotalTrades: 50,
      maxDrawdown: 30,
    },
    benefits: [
      { type: 'badge', desc: '银牌徽章' },
      { type: 'visibility', desc: '排行榜优先' },
      { type: 'stats', desc: '详细数据展示' },
    ],
  },
  gold: {
    level: 'gold',
    label: '金牌认证',
    labelEn: 'Gold Certified',
    color: '#ffd700',
    bgColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: '#ffd700',
    icon: '★',
    desc: '卓越表现的认证 Agent',
    requirements: {
      minScore: 75,
      minTradingDays: 60,
      minWinRate: 55,
      minTotalTrades: 100,
      maxDrawdown: 20,
      minSharpeRatio: 1.0,
    },
    benefits: [
      { type: 'badge', desc: '金牌徽章' },
      { type: 'visibility', desc: '首页推荐' },
      { type: 'stats', desc: '完整数据报告' },
      { type: 'api', desc: '高级 API 访问' },
    ],
  },
  diamond: {
    level: 'diamond',
    label: '钻石认证',
    labelEn: 'Diamond Certified',
    color: '#b9f2ff',
    bgColor: 'rgba(185, 242, 255, 0.1)',
    borderColor: '#b9f2ff',
    icon: '◈',
    desc: '顶尖水平的精英 Agent',
    requirements: {
      minScore: 90,
      minTradingDays: 90,
      minWinRate: 60,
      minTotalTrades: 200,
      maxDrawdown: 15,
      minSharpeRatio: 1.5,
      minTotalReturn: 20,
    },
    benefits: [
      { type: 'badge', desc: '钻石徽章' },
      { type: 'visibility', desc: '专属展示区' },
      { type: 'stats', desc: 'VIP 数据服务' },
      { type: 'api', desc: '无限制 API' },
      { type: 'marketplace', desc: '上架交易市场' },
    ],
  },
};

// ========== 认证要求 ==========

/** 认证要求 */
export interface CertificationRequirements {
  minScore?: number;           // 最低能力评分
  minTradingDays?: number;     // 最少交易天数
  minWinRate?: number;         // 最低胜率
  minTotalTrades?: number;     // 最少交易次数
  maxDrawdown?: number;        // 最大回撤限制
  minSharpeRatio?: number;     // 最低夏普比率
  minTotalReturn?: number;     // 最低总收益率
}

/** 认证权益 */
export interface CertificationBenefit {
  type: 'badge' | 'visibility' | 'stats' | 'api' | 'marketplace';
  desc: string;
}

// ========== 认证申请 ==========

/** 认证申请状态 */
export type CertificationStatus = 
  | 'pending'    // 待审核
  | 'approved'   // 已通过
  | 'rejected'   // 已拒绝
  | 'revoked';   // 已撤销

/** 认证申请 */
export interface CertificationApplication {
  id: string;
  agentId: string;
  agentType: 'arena' | 'creative';  // Agent 类型
  
  // 申请等级
  requestedLevel: CertificationLevel;
  currentLevel: CertificationLevel;
  
  // 状态
  status: CertificationStatus;
  
  // 申请数据（快照）
  snapshot: CertificationSnapshot;
  
  // 审核信息
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNote?: string;
  rejectionReason?: string;
  
  // 时间
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;  // 认证过期时间
}

/** 认证数据快照 */
export interface CertificationSnapshot {
  score: number;
  level: string;
  tradingDays: number;
  totalTrades: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  totalReturn: number;
  [key: string]: number | string;
}

// ========== 认证记录 ==========

/** 认证历史记录 */
export interface CertificationHistory {
  id: string;
  agentId: string;
  
  // 变更信息
  fromLevel: CertificationLevel;
  toLevel: CertificationLevel;
  
  // 变更原因
  reason: 'upgrade' | 'downgrade' | 'revoke' | 'expire';
  note?: string;
  
  // 时间
  createdAt: Date;
}

// ========== 认证审核 ==========

/** 审核结果 */
export interface ReviewResult {
  approved: boolean;
  level?: CertificationLevel;
  note?: string;
  rejectionReason?: string;
}

/** 自动审核结果 */
export interface AutoReviewResult {
  eligible: boolean;
  suggestedLevel: CertificationLevel;
  currentLevel: CertificationLevel;
  canUpgrade: boolean;
  nextLevel?: CertificationLevel;
  gaps: CertificationGap[];
  score: number;
}

/** 认证差距 */
export interface CertificationGap {
  requirement: string;
  current: number;
  required: number;
  gap: number;
  unit: string;
}

// ========== 认证徽章 ==========

/** 徽章显示配置 */
export interface BadgeConfig {
  level: CertificationLevel;
  size: 'sm' | 'md' | 'lg';
  showLabel: boolean;
  animated: boolean;
}

/** 徽章组件 Props */
export interface BadgeProps {
  level: CertificationLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

// ========== 工具函数类型 ==========

/** 认证检查结果 */
export interface CertificationCheckResult {
  canApply: boolean;
  eligibleLevels: CertificationLevel[];
  suggestedLevel: CertificationLevel;
  gaps: Record<CertificationLevel, CertificationGap[]>;
  currentScore: number;
  currentLevel: CertificationLevel;
}