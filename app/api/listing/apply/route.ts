/**
 * 上架申请 API
 * POST /api/listing/apply - 提交上架申请
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createListingApplication,
  getListingApplicationByAgentId,
} from '@/lib/db/listing-init';
import { checkListingRequirements, determineReviewLevel } from '@/lib/listing';
import type { ListingApplication, AgentPricing } from '@/lib/listing/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证必填字段
    const { agentId, agentName, agentType, pricing, promptFiles } = body;
    
    if (!agentId || !agentName || !agentType) {
      return NextResponse.json(
        { error: '缺少必填字段: agentId, agentName, agentType' },
        { status: 400 }
      );
    }
    
    // 检查是否已有申请
    const existingApplication = await getListingApplicationByAgentId(agentId);
    if (existingApplication && existingApplication.status !== 'rejected') {
      return NextResponse.json(
        { error: '该 Agent 已有上架申请', application: existingApplication },
        { status: 400 }
      );
    }
    
    // 检查文件完整性（简化版，实际应解析文件内容）
    const requirements = checkListingRequirements(
      body.hasIdentity ?? true,
      body.hasSoul ?? true,
      body.hasMemory ?? true,
      body.hasTools ?? true,
      body.hasSkill ?? true,
      body.hasCertification ?? false,
      body.certificationLevel ?? 'none',
      body.validatorPassed ?? true,
      body.validatorScore ?? 85
    );
    
    // 判定审核级别
    const reviewLevel = determineReviewLevel(body.certificationLevel ?? 'none');
    
    // 创建申请
    const application: ListingApplication = {
      id: `la_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      agentName,
      agentType,
      promptFiles: promptFiles || [],
      promptPackageUrl: body.promptPackageUrl,
      status: 'pending',
      reviewLevel,
      requirements,
      pricing: pricing || { model: 'free' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const created = await createListingApplication(application);
    
    return NextResponse.json({
      success: true,
      application: created,
      message: '上架申请已提交，等待审核',
    });
    
  } catch (error) {
    console.error('提交上架申请失败:', error);
    return NextResponse.json(
      { error: '提交申请失败', detail: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    
    if (!agentId) {
      return NextResponse.json(
        { error: '缺少 agentId 参数' },
        { status: 400 }
      );
    }
    
    const application = await getListingApplicationByAgentId(agentId);
    
    if (!application) {
      return NextResponse.json(
        { exists: false, message: '未找到该 Agent 的上架申请' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      exists: true,
      application,
    });
    
  } catch (error) {
    console.error('查询上架申请失败:', error);
    return NextResponse.json(
      { error: '查询失败', detail: String(error) },
      { status: 500 }
    );
  }
}