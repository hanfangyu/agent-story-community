/**
 * Agent 提示词验证工具
 * 
 * 验证 Agent 提示词是否符合标准规范
 */

import {
  AgentIdentity,
  AgentSoul,
  AgentMemory,
  AgentTools,
  AgentSkill,
  ValidationResult,
  ValidationErrorLevel,
  REQUIRED_FILES,
  OPTIONAL_FILES,
  CAPABILITY_STATUS_SYMBOLS,
} from './types';

// ============== 验证器类 ==============

/**
 * Agent 提示词验证器
 */
export class AgentPromptValidator {
  private errors: Array<{
    file: string;
    level: ValidationErrorLevel;
    message: string;
    line?: number;
  }> = [];
  
  private warnings: string[] = [];

  /**
   * 验证完整的 Agent 定义
   */
  validateAgent(files: Record<string, string>): ValidationResult {
    this.errors = [];
    this.warnings = [];

    // 1. 检查必备文件
    this.validateRequiredFiles(files);

    // 2. 验证每个文件的内容
    if (files['IDENTITY.md']) {
      this.validateIdentity(files['IDENTITY.md']);
    }
    if (files['SOUL.md']) {
      this.validateSoul(files['SOUL.md']);
    }
    if (files['MEMORY.md']) {
      this.validateMemory(files['MEMORY.md']);
    }
    if (files['TOOLS.md']) {
      this.validateTools(files['TOOLS.md']);
    }
    if (files['SKILL.md']) {
      this.validateSkill(files['SKILL.md']);
    }

    // 3. 检查可选文件
    this.checkOptionalFiles(files);

    return {
      valid: this.errors.filter(e => e.level === 'error').length === 0,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  /**
   * 检查必备文件是否存在
   */
  private validateRequiredFiles(files: Record<string, string>): void {
    for (const fileName of REQUIRED_FILES) {
      if (!files[fileName]) {
        this.errors.push({
          file: fileName,
          level: 'error',
          message: `缺少必备文件: ${fileName}`,
        });
      }
    }
  }

  /**
   * 检查可选文件
   */
  private checkOptionalFiles(files: Record<string, string>): void {
    const presentOptional = OPTIONAL_FILES.filter(f => files[f]);
    if (presentOptional.length > 0) {
      this.warnings.push(`发现可选文件: ${presentOptional.join(', ')}`);
    }
  }

  /**
   * 验证 IDENTITY.md
   */
  validateIdentity(content: string): ValidationResult {
    const errors: Array<{ file: string; level: ValidationErrorLevel; message: string; line?: number }> = [];
    
    // 检查必填字段
    const requiredFields = ['name', 'emoji', 'role'];
    for (const field of requiredFields) {
      const regex = new RegExp(`\\*\\*${field.charAt(0).toUpperCase() + field.slice(1)}:\\*\\*\\s*(.+)`, 'i');
      if (!regex.test(content)) {
        errors.push({
          file: 'IDENTITY.md',
          level: 'error',
          message: `缺少必填字段: ${field}`,
        });
      }
    }

    // 验证名称长度
    const nameMatch = content.match(/\*\*Name:\*\*\s*(.+)/i);
    if (nameMatch) {
      const name = nameMatch[1].trim();
      if (name.length < 3 || name.length > 20) {
        errors.push({
          file: 'IDENTITY.md',
          level: 'error',
          message: `名称长度必须在 3-20 字符之间，当前: ${name.length} 字符`,
        });
      }
      // 检查名称是否包含特殊字符
      if (/[^\u4e00-\u9fa5a-zA-Z0-9_\-]/.test(name)) {
        errors.push({
          file: 'IDENTITY.md',
          level: 'warning',
          message: '名称包含特殊字符，建议只使用中英文、数字、下划线和短横线',
        });
      }
    }

    // 验证 Emoji
    const emojiMatch = content.match(/\*\*Emoji:\*\*\s*(.+)/i);
    if (emojiMatch) {
      const emoji = emojiMatch[1].trim();
      // 简单检查是否包含 emoji（Unicode 范围）
      const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
      if (!emojiRegex.test(emoji) && emoji.length > 2) {
        errors.push({
          file: 'IDENTITY.md',
          level: 'warning',
          message: 'Emoji 字段建议使用标准 Emoji 字符',
        });
      }
    }

    // 检查能力清单
    if (!content.includes('能力清单') && !content.includes('Capabilities')) {
      errors.push({
        file: 'IDENTITY.md',
        level: 'warning',
        message: '建议添加能力清单部分',
      });
    } else {
      // 验证能力状态符号
      const validSymbols = Object.values(CAPABILITY_STATUS_SYMBOLS);
      const capabilityLines = content.split('\n').filter(line => 
        line.includes('✅') || line.includes('⚠️') || line.includes('🔴')
      );
      for (const line of capabilityLines) {
        const hasValidSymbol = validSymbols.some(s => line.includes(s));
        if (!hasValidSymbol) {
          errors.push({
            file: 'IDENTITY.md',
            level: 'info',
            message: `能力声明建议使用标准符号: ${validSymbols.join(' ')}`,
          });
        }
      }
    }

    // 检查绝对禁区
    if (!content.includes('禁区') && !content.includes('Forbidden')) {
      this.warnings.push('IDENTITY.md: 建议添加「绝对禁区」部分，明确 Agent 的边界');
    }

    this.errors.push(...errors);
    return {
      valid: errors.filter(e => e.level === 'error').length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * 验证 SOUL.md
   */
  validateSoul(content: string): ValidationResult {
    const errors: Array<{ file: string; level: ValidationErrorLevel; message: string }> = [];

    // 检查必填部分
    const requiredSections = ['性格', '原则'];
    for (const section of requiredSections) {
      if (!content.includes(section) && !content.includes(this.getEnglishEquivalent(section))) {
        errors.push({
          file: 'SOUL.md',
          level: 'error',
          message: `缺少必填部分: ${section}`,
        });
      }
    }

    // 检查性格关键词数量
    const personalityMatch = content.match(/##\s*性格[\s\S]*?(?=##|$)/i);
    if (personalityMatch) {
      const keywords = personalityMatch[0].split(/[，,\n]/).filter(k => k.trim().length > 0);
      if (keywords.length < 3) {
        errors.push({
          file: 'SOUL.md',
          level: 'warning',
          message: '性格关键词建议 3-5 个',
        });
      }
    }

    // 检查语言风格
    if (!content.includes('语言风格') && !content.includes('Communication') && !content.includes('Style')) {
      this.warnings.push('SOUL.md: 建议添加「语言风格」部分');
    }

    this.errors.push(...errors);
    return {
      valid: errors.filter(e => e.level === 'error').length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * 验证 MEMORY.md
   */
  validateMemory(content: string): ValidationResult {
    const errors: Array<{ file: string; level: ValidationErrorLevel; message: string }> = [];

    // 检查领域知识部分
    if (!content.includes('领域知识') && !content.includes('Domain Knowledge') && !content.includes('Knowledge')) {
      errors.push({
        file: 'MEMORY.md',
        level: 'warning',
        message: '建议添加「领域知识」部分',
      });
    }

    // 检查更新日志
    if (!content.includes('更新日志') && !content.includes('Changelog') && !content.includes('Update')) {
      this.warnings.push('MEMORY.md: 建议添加「更新日志」部分');
    }

    this.errors.push(...errors);
    return {
      valid: errors.filter(e => e.level === 'error').length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * 验证 TOOLS.md
   */
  validateTools(content: string): ValidationResult {
    const errors: Array<{ file: string; level: ValidationErrorLevel; message: string }> = [];

    // 检查工具列表
    if (!content.includes('工具') && !content.includes('Tool')) {
      errors.push({
        file: 'TOOLS.md',
        level: 'warning',
        message: '建议添加「可用工具」部分',
      });
    }

    // 检查代码示例
    if (!content.includes('```')) {
      this.warnings.push('TOOLS.md: 建议添加代码示例');
    }

    this.errors.push(...errors);
    return {
      valid: errors.filter(e => e.level === 'error').length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * 验证 SKILL.md
   */
  validateSkill(content: string): ValidationResult {
    const errors: Array<{ file: string; level: ValidationErrorLevel; message: string }> = [];

    // 检查 frontmatter
    if (!content.startsWith('---')) {
      errors.push({
        file: 'SKILL.md',
        level: 'error',
        message: 'SKILL.md 必须包含 frontmatter（--- 开头）',
      });
    } else {
      // 提取 frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1];
        
        // 检查必填字段
        if (!frontmatter.includes('name:')) {
          errors.push({
            file: 'SKILL.md',
            level: 'error',
            message: 'SKILL.md frontmatter 缺少 name 字段',
          });
        }
        if (!frontmatter.includes('description:')) {
          errors.push({
            file: 'SKILL.md',
            level: 'error',
            message: 'SKILL.md frontmatter 缺少 description 字段',
          });
        }
      }
    }

    // 检查参数表格
    if (!content.includes('参数') && !content.includes('Parameter')) {
      this.warnings.push('SKILL.md: 建议添加参数说明表格');
    }

    // 检查示例
    if (!content.includes('示例') && !content.includes('Example')) {
      this.warnings.push('SKILL.md: 建议添加使用示例');
    }

    this.errors.push(...errors);
    return {
      valid: errors.filter(e => e.level === 'error').length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * 获取英文对应词
   */
  private getEnglishEquivalent(chinese: string): string {
    const map: Record<string, string> = {
      '性格': 'Personality',
      '原则': 'Principle',
      '语言风格': 'Style',
      '领域知识': 'Knowledge',
    };
    return map[chinese] || chinese;
  }
}

// ============== 便捷函数 ==============

/**
 * 快速验证 Agent 提示词
 */
export function validateAgentPrompt(files: Record<string, string>): ValidationResult {
  const validator = new AgentPromptValidator();
  return validator.validateAgent(files);
}

/**
 * 验证单个文件
 */
export function validateFile(fileName: string, content: string): ValidationResult {
  const validator = new AgentPromptValidator();
  
  switch (fileName) {
    case 'IDENTITY.md':
      return validator.validateIdentity(content);
    case 'SOUL.md':
      return validator.validateSoul(content);
    case 'MEMORY.md':
      return validator.validateMemory(content);
    case 'TOOLS.md':
      return validator.validateTools(content);
    case 'SKILL.md':
      return validator.validateSkill(content);
    default:
      return {
        valid: true,
        errors: [],
        warnings: [`未知文件类型: ${fileName}`],
      };
  }
}

/**
 * 生成验证报告
 */
export function generateValidationReport(result: ValidationResult): string {
  const lines: string[] = ['# Agent 提示词验证报告\n'];
  
  lines.push(`## 总体状态: ${result.valid ? '✅ 通过' : '❌ 失败'}\n`);
  
  if (result.errors.length > 0) {
    lines.push('## 错误详情\n');
    for (const error of result.errors) {
      const icon = error.level === 'error' ? '❌' : error.level === 'warning' ? '⚠️' : 'ℹ️';
      lines.push(`${icon} **${error.file}**: ${error.message}`);
      if (error.line) {
        lines.push(`   (第 ${error.line} 行)`);
      }
    }
  }
  
  if (result.warnings.length > 0) {
    lines.push('\n## 警告\n');
    for (const warning of result.warnings) {
      lines.push(`- ⚠️ ${warning}`);
    }
  }
  
  return lines.join('\n');
}

// ============== 导出 ==============

export default AgentPromptValidator;