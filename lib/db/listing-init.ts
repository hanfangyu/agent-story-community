/**
 * Agent 上架审核数据库初始化
 * Agent Story Community - 交易市场模块
 */

import { sql } from './client';
import type {
  ListingApplication,
  ListingStatus,
  ListingRejectReason,
  AgentPricing,
  ReviewSnapshot,
} from '../listing/types';

// ========== 初始化函数 ==========

/**
 * 初始化上架审核相关表
 */
export async function initListingTables(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('开始初始化上架审核表...');
    
    // 创建上架申请表
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS listing_applications (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        agent_name TEXT NOT NULL,
        agent_type TEXT NOT NULL,
        
        -- 提示词信息
        prompt_files JSONB DEFAULT '[]',
        prompt_package_url TEXT,
        
        -- 审核信息
        status TEXT DEFAULT 'draft',
        review_level TEXT DEFAULT 'auto',
        requirements JSONB NOT NULL,
        
        -- 定价信息
        pricing_model TEXT DEFAULT 'free',
        pricing_price DECIMAL(10, 2),
        pricing_subscription DECIMAL(10, 2),
        pricing_usage DECIMAL(10, 2),
        pricing_trial_days INTEGER DEFAULT 0,
        
        -- 审核结果
        reviewed_by TEXT,
        reviewed_at TIMESTAMP,
        review_note TEXT,
        reject_reason TEXT,
        reject_detail TEXT,
        
        -- 审核快照
        review_snapshot JSONB,
        
        -- 时间戳
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        listed_at TIMESTAMP,
        delisted_at TIMESTAMP
      )
    `);
    
    // 创建上架状态变更历史表
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS listing_status_history (
        id TEXT PRIMARY KEY,
        application_id TEXT NOT NULL,
        from_status TEXT NOT NULL,
        to_status TEXT NOT NULL,
        reason TEXT NOT NULL,
        changed_by TEXT NOT NULL,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 创建已上架 Agent 表
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS listed_agents (
        id TEXT PRIMARY KEY,
        application_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        agent_name TEXT NOT NULL,
        agent_type TEXT NOT NULL,
        
        -- 提示词信息
        prompt_package_url TEXT,
        prompt_version TEXT DEFAULT '1.0.0',
        
        -- 定价信息
        pricing_model TEXT DEFAULT 'free',
        pricing_price DECIMAL(10, 2),
        pricing_subscription DECIMAL(10, 2),
        pricing_usage DECIMAL(10, 2),
        
        -- 统计信息
        view_count INTEGER DEFAULT 0,
        purchase_count INTEGER DEFAULT 0,
        revenue_total DECIMAL(15, 2) DEFAULT 0.00,
        avg_rating DECIMAL(3, 2) DEFAULT 0.00,
        total_reviews INTEGER DEFAULT 0,
        
        -- 状态
        status TEXT DEFAULT 'active',
        
        -- 时间戳
        listed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 创建购买记录表
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS agent_purchases (
        id TEXT PRIMARY KEY,
        buyer_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        application_id TEXT NOT NULL,
        
        -- 购买信息
        pricing_model TEXT NOT NULL,
        amount DECIMAL(10, 2) DEFAULT 0.00,
        payment_status TEXT DEFAULT 'pending',
        payment_method TEXT,
        
        -- 使用信息
        usage_count INTEGER DEFAULT 0,
        expires_at TIMESTAMP,
        
        -- 时间戳
        purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_used_at TIMESTAMP
      )
    `);
    
    // 创建索引
    await sql.unsafe(`
      CREATE INDEX IF NOT EXISTS idx_listing_applications_agent ON listing_applications(agent_id);
      CREATE INDEX IF NOT EXISTS idx_listing_applications_status ON listing_applications(status);
      CREATE INDEX IF NOT EXISTS idx_listed_agents_type ON listed_agents(agent_type);
      CREATE INDEX IF NOT EXISTS idx_listed_agents_status ON listed_agents(status);
      CREATE INDEX IF NOT EXISTS idx_agent_purchases_buyer ON agent_purchases(buyer_id);
      CREATE INDEX IF NOT EXISTS idx_agent_purchases_agent ON agent_purchases(agent_id);
    `);
    
    console.log('上架审核表初始化完成');
    return { success: true, message: '上架审核表初始化成功' };
  } catch (error) {
    console.error('上架审核表初始化失败:', error);
    return { success: false, message: `初始化失败: ${error}` };
  }
}

// ========== CRUD 操作 ==========

/**
 * 创建上架申请
 */
export async function createListingApplication(
  application: ListingApplication
): Promise<ListingApplication> {
  const result = await sql.unsafe(`
    INSERT INTO listing_applications (
      id, agent_id, agent_name, agent_type,
      prompt_files, prompt_package_url,
      status, review_level, requirements,
      pricing_model, pricing_price, pricing_subscription, pricing_usage, pricing_trial_days,
      created_at, updated_at
    ) VALUES (
      '${application.id}',
      '${application.agentId}',
      '${application.agentName}',
      '${application.agentType}',
      '${JSON.stringify(application.promptFiles)}'::jsonb,
      ${application.promptPackageUrl ? `'${application.promptPackageUrl}'` : 'NULL'},
      '${application.status}',
      '${application.reviewLevel}',
      '${JSON.stringify(application.requirements)}'::jsonb,
      '${application.pricing.model}',
      ${application.pricing.price || 'NULL'},
      ${application.pricing.subscriptionPrice || 'NULL'},
      ${application.pricing.usagePrice || 'NULL'},
      ${application.pricing.freeTrialDays || 0},
      '${application.createdAt.toISOString()}',
      '${application.updatedAt.toISOString()}'
    )
    RETURNING *
  `);
  
  return result[0] as unknown as ListingApplication;
}

/**
 * 获取上架申请
 */
export async function getListingApplication(id: string): Promise<ListingApplication | null> {
  const result = await sql.unsafe(`
    SELECT * FROM listing_applications WHERE id = '${id}'
  `);
  
  return result[0] ? mapRowToApplication(result[0]) : null;
}

/**
 * 根据 Agent ID 获取上架申请
 */
export async function getListingApplicationByAgentId(agentId: string): Promise<ListingApplication | null> {
  const result = await sql.unsafe(`
    SELECT * FROM listing_applications WHERE agent_id = '${agentId}' ORDER BY created_at DESC LIMIT 1
  `);
  
  return result[0] ? mapRowToApplication(result[0]) : null;
}

/**
 * 获取待审核列表
 */
export async function getPendingApplications(
  limit: number = 20,
  offset: number = 0
): Promise<ListingApplication[]> {
  const result = await sql.unsafe(`
    SELECT * FROM listing_applications 
    WHERE status IN ('pending', 'reviewing')
    ORDER BY created_at ASC
    LIMIT ${limit} OFFSET ${offset}
  `);
  
  return result.map(mapRowToApplication);
}

/**
 * 更新上架申请状态
 */
export async function updateListingStatus(
  id: string,
  status: ListingStatus,
  reviewer?: string,
  note?: string,
  rejectReason?: ListingRejectReason,
  rejectDetail?: string
): Promise<ListingApplication | null> {
  const updates: string[] = [
    `status = '${status}'`,
    `updated_at = '${new Date().toISOString()}'`,
  ];
  
  if (reviewer) updates.push(`reviewed_by = '${reviewer}'`);
  if (note) updates.push(`review_note = '${note}'`);
  if (rejectReason) updates.push(`reject_reason = '${rejectReason}'`);
  if (rejectDetail) updates.push(`reject_detail = '${rejectDetail}'`);
  if (status === 'approved' || status === 'listed') {
    updates.push(`reviewed_at = '${new Date().toISOString()}'`);
  }
  if (status === 'listed') {
    updates.push(`listed_at = '${new Date().toISOString()}'`);
  }
  
  const result = await sql.unsafe(`
    UPDATE listing_applications
    SET ${updates.join(', ')}
    WHERE id = '${id}'
    RETURNING *
  `);
  
  // 记录状态变更历史
  if (result[0]) {
    await sql.unsafe(`
      INSERT INTO listing_status_history (
        id, application_id, from_status, to_status, reason, changed_by, changed_at
      ) VALUES (
        'lsh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}',
        '${id}',
        '${result[0].status || 'draft'}',
        '${status}',
        '${note || rejectDetail || '状态更新'}',
        '${reviewer || 'system'}',
        '${new Date().toISOString()}'
      )
    `);
  }
  
  return result[0] ? mapRowToApplication(result[0]) : null;
}

/**
 * 获取已上架 Agent 列表
 */
export async function getListedAgents(
  agentType?: string,
  limit: number = 20,
  offset: number = 0
): Promise<any[]> {
  const typeFilter = agentType ? `AND agent_type = '${agentType}'` : '';
  
  const result = await sql.unsafe(`
    SELECT * FROM listed_agents 
    WHERE status = 'active' ${typeFilter}
    ORDER BY purchase_count DESC, avg_rating DESC
    LIMIT ${limit} OFFSET ${offset}
  `);
  
  return result;
}

// ========== 辅助函数 ==========

function mapRowToApplication(row: any): ListingApplication {
  return {
    id: row.id,
    agentId: row.agent_id,
    agentName: row.agent_name,
    agentType: row.agent_type,
    promptFiles: row.prompt_files || [],
    promptPackageUrl: row.prompt_package_url,
    status: row.status as ListingStatus,
    reviewLevel: row.review_level,
    requirements: row.requirements,
    pricing: {
      model: row.pricing_model,
      price: row.pricing_price,
      subscriptionPrice: row.pricing_subscription,
      usagePrice: row.pricing_usage,
      freeTrialDays: row.pricing_trial_days,
    } as AgentPricing,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    reviewNote: row.review_note,
    rejectReason: row.reject_reason as ListingRejectReason,
    rejectDetail: row.reject_detail,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    listedAt: row.listed_at,
  };
}