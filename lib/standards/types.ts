/**
 * Agent 提示词标准类型定义
 * 
 * 定义 Agent 的标准文件结构和验证规则
 */

// ============== 基础类型 ==============

/**
 * Agent 能力状态
 */
export type CapabilityStatus = 'implemented' | 'restricted' | 'planned';

/**
 * Agent 能力定义
 */
export interface AgentCapability {
  /** 能力名称 */
  name: string;
  /** 能力状态 */
  status: CapabilityStatus;
  /** 说明（可选） */
  description?: string;
  /** 所需权限（可选） */
  requiredPermissions?: string[];
}

/**
 * Agent 徽章类型
 */
export type BadgeType = 
  | 'verified'
  | 'top_creator'
  | 'early_adopter'
  | 'community_star'
  | 'developer'
  | 'bot';

/**
 * Agent 语言
 */
export type AgentLanguage = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR' | string;

// ============== 核心文件类型 ==============

/**
 * IDENTITY.md - 身份定义
 */
export interface AgentIdentity {
  /** Agent 名称（3-20 字符） */
  name: string;
  /** 代表性 Emoji（1-2 个字符） */
  emoji: string;
  /** 角色定位 */
  role: string;
  /** 默认语言 */
  language: AgentLanguage;
  /** 版本号 */
  version: string;
  /** 作者/团队 */
  author?: string;
  /** 能力清单 */
  capabilities: AgentCapability[];
  /** 负责领域 */
  responsibilities: string[];
  /** 禁止操作（绝对禁区） */
  forbiddenActions: string[];
}

/**
 * SOUL.md - 性格原则
 */
export interface AgentSoul {
  /** 性格特征（3-5 个关键词） */
  personality: string[];
  /** 行为原则 */
  principles: Array<{
    name: string;
    description: string;
  }>;
  /** 语言风格 */
  communicationStyle: string[];
  /** 示例对话 */
  exampleDialogues?: Array<{
    user: string;
    agent: string;
  }>;
}

/**
 * MEMORY.md - 长期记忆
 */
export interface AgentMemory {
  /** 领域知识 */
  domainKnowledge: Record<string, string[]>;
  /** 用户偏好 */
  userPreferences: Record<string, string>;
  /** 配置信息 */
  configuration: Record<string, unknown>;
  /** 更新日志 */
  updateLog: Array<{
    date: string;
    content: string;
  }>;
}

/**
 * 工具定义
 */
export interface AgentTool {
  /** 工具名称 */
  name: string;
  /** 用途说明 */
  purpose: string;
  /** 参数定义 */
  parameters?: Record<string, {
    type: string;
    required: boolean;
    description?: string;
  }>;
}

/**
 * API 配置
 */
export interface AgentApiConfig {
  /** 服务名称 */
  serviceName: string;
  /** API 地址 */
  endpoint: string;
  /** 用途说明 */
  purpose: string;
  /** 频率限制 */
  rateLimit?: string;
  /** 认证方式 */
  authMethod?: string;
}

/**
 * TOOLS.md - 工具配置
 */
export interface AgentTools {
  /** 可用工具（按类别分组） */
  tools: Record<string, AgentTool[]>;
  /** API 配置 */
  apiConfigs: AgentApiConfig[];
  /** 使用规则 */
  usageRules: string[];
  /** 使用示例 */
  examples?: string[];
}

/**
 * 技能参数
 */
export interface SkillParameter {
  /** 参数名 */
  name: string;
  /** 类型 */
  type: string;
  /** 是否必填 */
  required: boolean;
  /** 说明 */
  description?: string;
  /** 默认值 */
  defaultValue?: unknown;
}

/**
 * 错误处理规则
 */
export interface ErrorHandling {
  /** 错误类型 */
  errorType: string;
  /** 处理方式 */
  handling: string;
}

/**
 * SKILL.md - 技能定义
 */
export interface AgentSkill {
  /** 技能名称 */
  name: string;
  /** 技能描述 */
  description: string;
  /** 详细功能说明 */
  details?: string;
  /** 参数列表 */
  parameters: SkillParameter[];
  /** 使用示例 */
  examples: string[];
  /** 注意事项 */
  precautions: string[];
  /** 错误处理 */
  errorHandling: ErrorHandling[];
}

// ============== 可选文件类型 ==============

/**
 * USER.md - 用户画像
 */
export interface AgentUserPersona {
  /** 用户画像名称 */
  name: string;
  /** 用户类型 */
  profile: string;
  /** 语言偏好 */
  language: AgentLanguage;
  /** 协作规则 */
  collaborationRules: string[];
  /** 偏好 */
  preferences: Record<string, string>;
}

/**
 * AGENTS.md - 工作手册
 */
export interface AgentWorkManual {
  /** 汇报关系 */
  reportingRelationship?: string;
  /** 工作流程 */
  workflow: string[];
  /** 编码规范 */
  codingStandards?: string[];
  /** 关键词触发 */
  keywordTriggers?: Array<{
    keyword: string;
    action: string;
  }>;
}

/**
 * 定时任务定义
 */
export interface ScheduledTask {
  /** 任务名称 */
  name: string;
  /** Cron 表达式 */
  schedule: string;
  /** 说明 */
  description?: string;
  /** 是否启用 */
  enabled: boolean;
}

/**
 * HEARTBEAT.md - 定时任务配置
 */
export interface AgentHeartbeat {
  /** 任务列表 */
  tasks: ScheduledTask[];
  /** 检查项 */
  healthChecks: string[];
}

// ============== 完整 Agent 定义 ==============

/**
 * Agent 文件集合
 */
export interface AgentFiles {
  // 必备文件
  identity: AgentIdentity;
  soul: AgentSoul;
  memory: AgentMemory;
  tools: AgentTools;
  skill: AgentSkill;
  
  // 可选文件
  userPersona?: AgentUserPersona;
  workManual?: AgentWorkManual;
  heartbeat?: AgentHeartbeat;
  
  // 扩展技能（高级）
  additionalSkills?: AgentSkill[];
}

/**
 * Agent 完整定义
 */
export interface AgentDefinition {
  /** Agent ID */
  id: string;
  /** 文件集合 */
  files: AgentFiles;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 状态 */
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived';
  /** 审核信息 */
  reviewInfo?: {
    reviewedAt?: string;
    reviewedBy?: string;
    comments?: string;
  };
}

// ============== 验证相关类型 ==============

/**
 * 验证错误级别
 */
export type ValidationErrorLevel = 'error' | 'warning' | 'info';

/**
 * 验证结果
 */
export interface ValidationResult {
  /** 是否通过 */
  valid: boolean;
  /** 错误列表 */
  errors: Array<{
    /** 文件名 */
    file: string;
    /** 错误级别 */
    level: ValidationErrorLevel;
    /** 错误信息 */
    message: string;
    /** 行号（可选） */
    line?: number;
  }>;
  /** 警告列表 */
  warnings: string[];
}

/**
 * 文件解析结果
 */
export interface ParseResult<T> {
  /** 是否成功 */
  success: boolean;
  /** 解析后的数据 */
  data?: T;
  /** 错误信息 */
  error?: string;
}

// ============== 枚举定义 ==============

/**
 * 必备文件名
 */
export const REQUIRED_FILES = ['IDENTITY.md', 'SOUL.md', 'MEMORY.md', 'TOOLS.md', 'SKILL.md'] as const;

/**
 * 可选文件名
 */
export const OPTIONAL_FILES = ['USER.md', 'AGENTS.md', 'HEARTBEAT.md'] as const;

/**
 * 能力状态符号
 */
export const CAPABILITY_STATUS_SYMBOLS: Record<CapabilityStatus, string> = {
  implemented: '✅',
  restricted: '⚠️',
  planned: '🔴',
} as const;

/**
 * Agent 状态
 */
export type AgentStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived';

/**
 * 文件类型
 */
export type AgentFileType = 
  | 'identity'
  | 'soul'
  | 'memory'
  | 'tools'
  | 'skill'
  | 'userPersona'
  | 'workManual'
  | 'heartbeat';

/**
 * 文件类型到文件名的映射
 */
export const FILE_TYPE_TO_NAME: Record<AgentFileType, string> = {
  identity: 'IDENTITY.md',
  soul: 'SOUL.md',
  memory: 'MEMORY.md',
  tools: 'TOOLS.md',
  skill: 'SKILL.md',
  userPersona: 'USER.md',
  workManual: 'AGENTS.md',
  heartbeat: 'HEARTBEAT.md',
} as const;