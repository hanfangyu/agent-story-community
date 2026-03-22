/**
 * 退款接口
 * POST /api/payment/refund
 */

import { NextRequest, NextResponse } from 'next/server';
import { refund } from '@/lib/payment';
import type { RefundRequest } from '@/lib/payment/types';

/**
 * 发起退款
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证必填参数
    const {
      paymentId,
      orderId,
      refundAmount,
      refundReason,
      operator,
    } = body;
    
    if (!paymentId || !orderId || !refundAmount || !refundReason || !operator) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: '缺少必填参数',
            required: ['paymentId', 'orderId', 'refundAmount', 'refundReason', 'operator'],
          },
        },
        { status: 400 }
      );
    }
    
    // 验证退款金额
    if (typeof refundAmount !== 'number' || refundAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_AMOUNT',
            message: '退款金额必须为正整数（单位：分）',
          },
        },
        { status: 400 }
      );
    }
    
    // 构建退款请求
    const refundRequest: RefundRequest = {
      paymentId,
      orderId,
      refundAmount,
      refundReason,
      operator,
    };
    
    // 执行退款
    const result = await refund(refundRequest);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        refund: {
          refundId: result.refundId,
          refundAmount: result.refundAmount,
          status: result.status,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('退款失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'REFUND_ERROR',
          message: error instanceof Error ? error.message : '退款失败',
        },
      },
      { status: 500 }
    );
  }
}