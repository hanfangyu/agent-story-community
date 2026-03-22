/**
 * 认证系统数据库初始化
 * Agent Story Community - 认证机制
 */

import { sql } from './client';
import type { 
  CertificationApplication, 
  CertificationLevel,
  CertificationSnapshot,
  CertificationStatus,
} from '../certification/types';

// ========== 初始化函数 ==========

/**
 * 初始化认证相关表
 */
export async function initCertificationTables(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('开始初始化认证表...');
    
    // 创建认证申请表
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS certification_applications (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        agent_type TEXT NOT NULL,
        requested_level TEXT NOT NULL,
        current_level TEXT DEFAULT 'none',
        status TEXT DEFAULT 'pending',
        snapshot JSONB NOT NULL,
        reviewed_by TEXT,
        reviewed_at TIMESTAMP,
        review_note TEXT,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP
      )
    `);
    
    // 创建 Agent 认证状态表
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS agent_certifications (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL UNIQUE,
        agent_type TEXT NOT NULL,
        current_level TEXT DEFAULT 'none',
        application_id TEXT,
        certified_at TIMESTAMP,
        expires_at TIMESTAMP,
        snapshot JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 创建认证历史记录表
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS certification_history (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        from_level TEXT NOT NULL,
        to_level TEXT NOT NULL,
        reason TEXT NOT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('认证表初始化完成');
    return { success: true, message: '认证表初始化成功' };
  } catch (error) {
    console.error('认证表初始化失败:', error);
    return { success: false, message: `初始化失败: ${error}` };
  }
}

// ========== CRUD 操作 ==========

/**
 * 创建认证申请
 */
export async function createCertificationApplication(
  application: CertificationApplication
): Promise<CertificationApplication> {
  const result = await sql.unsafe(`
    INSERT INTO certification_applications (
      id, agent_id, agent_type, requested_level, current_level,
      status, snapshot, created_at, updated_at
    ) VALUES (
      '${application.id}',
      '${application.agentId}',
      '${application.agentType}',
      '${application.requestedLevel}',
      '${application.currentLevel}',
      '${application.status}',
      '${JSON.stringify(application.snapshot)}'::jsonb,
      '${application.createdAt.toISOString()}',
      '${application.updatedAt.toISOString()}'
    )
    RETURNING *
  `);
  
  const row = (result as any[])[0];
  if (!row) return application;
  
  return {
    id: row.id,
    agentId: row.agent_id,
    agentType: row.agent_type,
    requestedLevel: row.requested_level as CertificationLevel,
    currentLevel: row.current_level as CertificationLevel,
    status: row.status as CertificationStatus,
    snapshot: row.snapshot as CertificationSnapshot,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * 获取 Agent 的认证申请列表
 */
export async function getAgentApplications(
  agentId: string
): Promise<CertificationApplication[]> {
  const result = await sql.unsafe(`
    SELECT * FROM certification_applications
    WHERE agent_id = '${agentId}'
    ORDER BY created_at DESC
  `);
  
  return (result as any[]).map(row => ({
    id: row.id,
    agentId: row.agent_id,
    agentType: row.agent_type,
    requestedLevel: row.requested_level as CertificationLevel,
    currentLevel: row.current_level as CertificationLevel,
    status: row.status as CertificationStatus,
    snapshot: row.snapshot as CertificationSnapshot,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    reviewNote: row.review_note,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at,
  }));
}

/**
 * 获取待审核的申请列表
 */
export async function getPendingApplications(
  limit: number = 20
): Promise<CertificationApplication[]> {
  const result = await sql.unsafe(`
    SELECT * FROM certification_applications
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT ${limit}
  `);
  
  return (result as any[]).map(row => ({
    id: row.id,
    agentId: row.agent_id,
    agentType: row.agent_type,
    requestedLevel: row.requested_level as CertificationLevel,
    currentLevel: row.current_level as CertificationLevel,
    status: row.status as CertificationStatus,
    snapshot: row.snapshot as CertificationSnapshot,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    reviewNote: row.review_note,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at,
  }));
}

/**
 * 更新申请状态
 */
export async function updateApplicationStatus(
  applicationId: string,
  status: CertificationStatus,
  reviewedBy?: string,
  reviewNote?: string,
  rejectionReason?: string
): Promise<void> {
  await sql.unsafe(`
    UPDATE certification_applications
    SET 
      status = '${status}',
      reviewed_by = ${reviewedBy ? `'${reviewedBy}'` : 'NULL'},
      reviewed_at = CURRENT_TIMESTAMP,
      review_note = ${reviewNote ? `'${reviewNote}'` : 'NULL'},
      rejection_reason = ${rejectionReason ? `'${rejectionReason}'` : 'NULL'},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = '${applicationId}'
  `);
}

/**
 * 获取 Agent 认证状态
 */
export async function getAgentCertification(
  agentId: string
): Promise<{
  id: string;
  agentId: string;
  agentType: string;
  currentLevel: CertificationLevel;
  certifiedAt?: Date;
  expiresAt?: Date;
  snapshot?: CertificationSnapshot;
} | null> {
  const result = await sql.unsafe(`
    SELECT * FROM agent_certifications
    WHERE agent_id = '${agentId}'
  `);
  
  if (!result || (result as any[]).length === 0) return null;
  
  const row = (result as any[])[0];
  return {
    id: row.id,
    agentId: row.agent_id,
    agentType: row.agent_type,
    currentLevel: row.current_level as CertificationLevel,
    certifiedAt: row.certified_at,
    expiresAt: row.expires_at,
    snapshot: row.snapshot as CertificationSnapshot,
  };
}

/**
 * 更新 Agent 认证状态
 */
export async function updateAgentCertification(
  agentId: string,
  agentType: string,
  level: CertificationLevel,
  applicationId: string,
  snapshot: CertificationSnapshot,
  expiresAt?: Date
): Promise<void> {
  const existing = await sql.unsafe(`
    SELECT id FROM agent_certifications WHERE agent_id = '${agentId}'
  `);
  
  const snapshotJson = JSON.stringify(snapshot);
  const expiresStr = expiresAt ? `'${expiresAt.toISOString()}'` : 'NULL';
  
  if (existing && (existing as any[]).length > 0) {
    await sql.unsafe(`
      UPDATE agent_certifications
      SET 
        current_level = '${level}',
        application_id = '${applicationId}',
        certified_at = CURRENT_TIMESTAMP,
        expires_at = ${expiresStr},
        snapshot = '${snapshotJson}'::jsonb,
        updated_at = CURRENT_TIMESTAMP
      WHERE agent_id = '${agentId}'
    `);
  } else {
    await sql.unsafe(`
      INSERT INTO agent_certifications (
        id, agent_id, agent_type, current_level, application_id,
        certified_at, expires_at, snapshot
      ) VALUES (
        'cert_state_${agentId}',
        '${agentId}',
        '${agentType}',
        '${level}',
        '${applicationId}',
        CURRENT_TIMESTAMP,
        ${expiresStr},
        '${snapshotJson}'::jsonb
      )
    `);
  }
}

/**
 * 添加认证历史记录
 */
export async function addCertificationHistory(
  agentId: string,
  fromLevel: CertificationLevel,
  toLevel: CertificationLevel,
  reason: 'upgrade' | 'downgrade' | 'revoke' | 'expire',
  note?: string
): Promise<void> {
  const id = `hist_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const noteStr = note ? `'${note}'` : 'NULL';
  
  await sql.unsafe(`
    INSERT INTO certification_history (
      id, agent_id, from_level, to_level, reason, note
    ) VALUES (
      '${id}',
      '${agentId}',
      '${fromLevel}',
      '${toLevel}',
      '${reason}',
      ${noteStr}
    )
  `);
}

// ========== 示例数据 ==========

/** 示例认证申请数据 */
export const DEMO_APPLICATIONS: Partial<CertificationApplication>[] = [
  {
    id: 'cert_demo_001',
    agentId: 'arena_quant_001',
    agentType: 'arena',
    requestedLevel: 'gold',
    currentLevel: 'silver',
    status: 'approved',
    snapshot: {
      score: 78,
      level: 'A',
      tradingDays: 65,
      totalTrades: 120,
      winRate: 68.5,
      maxDrawdown: 8.5,
      sharpeRatio: 2.3,
      totalReturn: 28.0,
    },
    createdAt: new Date('2026-03-20'),
    reviewedAt: new Date('2026-03-21'),
    reviewNote: '表现优异，符合金牌认证标准',
  },
  {
    id: 'cert_demo_002',
    agentId: 'arena_value_002',
    agentType: 'arena',
    requestedLevel: 'silver',
    currentLevel: 'basic',
    status: 'approved',
    snapshot: {
      score: 62,
      level: 'B',
      tradingDays: 35,
      totalTrades: 52,
      winRate: 72.0,
      maxDrawdown: 5.2,
      sharpeRatio: 1.8,
      totalReturn: 15.0,
    },
    createdAt: new Date('2026-03-19'),
    reviewedAt: new Date('2026-03-20'),
    reviewNote: '稳健表现，符合银牌标准',
  },
  {
    id: 'cert_demo_003',
    agentId: 'arena_trend_003',
    agentType: 'arena',
    requestedLevel: 'silver',
    currentLevel: 'none',
    status: 'pending',
    snapshot: {
      score: 45,
      level: 'C',
      tradingDays: 25,
      totalTrades: 89,
      winRate: 45.0,
      maxDrawdown: 12.8,
      sharpeRatio: 0.9,
      totalReturn: 5.0,
    },
    createdAt: new Date('2026-03-22'),
  },
];