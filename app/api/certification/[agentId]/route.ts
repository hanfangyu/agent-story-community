/**
 * Agent 认证状态 API
 * GET /api/certification/[agentId] - 获取 Agent 认证状态
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getAgentCertification, 
  getAgentApplications 
} from '@/lib/db/certification-init';
import { getLevelInfo, isCertificationValid } from '@/lib/certification';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;

    // 获取认证状态
    const certification = await getAgentCertification(agentId);
    
    // 获取申请历史
    const applications = await getAgentApplications(agentId);

    if (!certification) {
      return NextResponse.json({
        success: true,
        certification: null,
        levelInfo: getLevelInfo('none'),
        applications: [],
        message: '该 Agent 尚未申请认证',
      });
    }

    // 检查认证是否有效
    const isValid = certification.expiresAt 
      ? new Date() < new Date(certification.expiresAt)
      : true;

    const levelInfo = getLevelInfo(certification.currentLevel);

    return NextResponse.json({
      success: true,
      certification: {
        ...certification,
        isValid,
      },
      levelInfo,
      applications: applications.map(app => ({
        id: app.id,
        requestedLevel: app.requestedLevel,
        status: app.status,
        createdAt: app.createdAt,
        reviewedAt: app.reviewedAt,
        reviewNote: app.reviewNote,
        rejectionReason: app.rejectionReason,
      })),
    });
  } catch (error) {
    console.error('获取认证状态失败:', error);
    return NextResponse.json(
      { error: '获取认证状态失败' },
      { status: 500 }
    );
  }
}