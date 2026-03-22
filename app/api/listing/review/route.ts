/**
 * 上架审核 API
 * POST /api/listing/review - 执行审核
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getListingApplication,
  getPendingApplications,
  updateListingStatus,
} from '@/lib/db/listing-init';
import {
  executeReviewWorkflow,
  meetsMinimumRequirements,
  isValidStatusTransition,
} from '@/lib/listing';
import type { ListingStatus, ListingRejectReason } from '@/lib/listing/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicationId, action, reviewer, note, rejectReason, rejectDetail } = body;
    
    if (!applicationId || !action) {
      return NextResponse.json(
        { error: '缺少必填字段: applicationId, action' },
        { status: 400 }
      );
    }
    
    const application = await getListingApplication(applicationId);
    if (!application) {
      return NextResponse.json(
        { error: '申请不存在' },
        { status: 404 }
      );
    }
    
    let newStatus: ListingStatus;
    let resultMessage: string;
    
    switch (action) {
      case 'review':
        // 执行审核工作流
        const reviewResult = await executeReviewWorkflow(application, reviewer);
        newStatus = reviewResult.newStatus;
        resultMessage = reviewResult.reason || '审核完成';
        
        await updateListingStatus(
          applicationId,
          newStatus,
          reviewer,
          reviewResult.reason,
          reviewResult.rejectReason as ListingRejectReason
        );
        break;
        
      case 'approve':
        if (!isValidStatusTransition(application.status, 'approved')) {
          return NextResponse.json(
            { error: `无法从 ${application.status} 状态转换为 approved` },
            { status: 400 }
          );
        }
        newStatus = 'approved';
        await updateListingStatus(applicationId, 'approved', reviewer, note);
        resultMessage = '审核已通过';
        break;
        
      case 'reject':
        if (!isValidStatusTransition(application.status, 'rejected')) {
          return NextResponse.json(
            { error: `无法从 ${application.status} 状态转换为 rejected` },
            { status: 400 }
          );
        }
        newStatus = 'rejected';
        await updateListingStatus(
          applicationId,
          'rejected',
          reviewer,
          note,
          rejectReason as ListingRejectReason,
          rejectDetail
        );
        resultMessage = '审核已拒绝';
        break;
        
      case 'list':
        if (!isValidStatusTransition(application.status, 'listed')) {
          return NextResponse.json(
            { error: `无法从 ${application.status} 状态转换为 listed` },
            { status: 400 }
          );
        }
        newStatus = 'listed';
        await updateListingStatus(applicationId, 'listed', reviewer, note);
        resultMessage = 'Agent 已上架';
        break;
        
      case 'delist':
        if (!isValidStatusTransition(application.status, 'delisted')) {
          return NextResponse.json(
            { error: `无法从 ${application.status} 状态转换为 delisted` },
            { status: 400 }
          );
        }
        newStatus = 'delisted';
        await updateListingStatus(applicationId, 'delisted', reviewer, note);
        resultMessage = 'Agent 已下架';
        break;
        
      default:
        return NextResponse.json(
          { error: `未知操作: ${action}` },
          { status: 400 }
        );
    }
    
    const updated = await getListingApplication(applicationId);
    
    return NextResponse.json({
      success: true,
      message: resultMessage,
      application: updated,
    });
    
  } catch (error) {
    console.error('审核操作失败:', error);
    return NextResponse.json(
      { error: '审核操作失败', detail: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const applications = await getPendingApplications(limit, offset);
    
    return NextResponse.json({
      applications,
      total: applications.length,
      limit,
      offset,
    });
    
  } catch (error) {
    console.error('获取待审核列表失败:', error);
    return NextResponse.json(
      { error: '获取失败', detail: String(error) },
      { status: 500 }
    );
  }
}