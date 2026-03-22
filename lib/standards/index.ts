/**
 * Agent 提示词标准模块入口
 * 
 * 导出类型定义和验证工具
 */

// 类型定义
export * from './types';

// 验证工具
export {
  AgentPromptValidator,
  validateAgentPrompt,
  validateFile,
  generateValidationReport,
} from './validator';

// 默认导出验证器
export { default } from './validator';