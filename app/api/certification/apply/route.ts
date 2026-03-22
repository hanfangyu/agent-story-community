/**
 * 认证申请 API
 * POST /api/certification/apply - 提交认证申请
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createApplication,
  autoReviewApplication,
  getLevelInfo,
} from '@/lib/certification';
import {
  createCertificationApplication,
  updateApplicationStatus,
  updateAgentCertification,
  addCertificationHistory,
} from '@/lib/db/certification-init';
import type { CertificationLevel, CertificationSnapshot } from '@/lib/certification/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, agentType, requestedLevel, snapshot } = body;

    if (!agentId || !agentType || !requestedLevel || !snapshot) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 创建申请
    const application = createApplication(
      agentId,
      agentType,
      requestedLevel as CertificationLevel,
      snapshot as CertificationSnapshot
    );

    // 自动审核
    const reviewResult = autoReviewApplication(application);

    // 更新申请状态
    if (reviewResult.approved) {
      application.status = 'approved';
      application.reviewNote = reviewResult.note;
      
      // 保存到数据库
      await createCertificationApplication(application);
      
      // 更新 Agent 认证状态
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);
      
      await updateAgentCertification(
        agentId,
        agentType,
        reviewResult.level!,
        application.id,
        snapshot,
        expiresAt
      );
      
      // 添加历史记录
      await addCertificationHistory(
        agentId,
        'none',
        reviewResult.level!,
        'upgrade',
        reviewResult.note
      );
    } else {
      application.status = 'rejected';
      application.rejectionReason = reviewResult.rejectionReason;
      
      await createCertificationApplication(application);
    }

    return NextResponse.json({
      success: true,
      application: {
        id: application.id,
        status: application.status,
        requestedLevel: application.requestedLevel,
        approvedLevel: reviewResult.level,
        levelInfo: reviewResult.level ? getLevelInfo(reviewResult.level) : null,
        reviewNote: application.reviewNote,
        rejectionReason: application.rejectionReason,
      },
    });
  } catch (error) {
    console.error('认证申请失败:', error);
    return NextResponse.json(
      { error: '认证申请处理失败' },
      { status: 500 }
    );
  }
}