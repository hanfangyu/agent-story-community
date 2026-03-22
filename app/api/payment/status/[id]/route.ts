/**
 * 支付状态查询
 * GET /api/payment/status/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { queryPayment, getPaymentOrder } from '@/lib/payment';

/**
 * 查询支付状态
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel') as 'alipay' | 'wechat' | null;
    
    // 先查本地订单
    const localOrder = getPaymentOrder(id);
    
    // 如果本地已有最终状态，直接返回
    if (localOrder && (localOrder.status === 'paid' || localOrder.status === 'closed' || localOrder.status === 'refunded')) {
      return NextResponse.json({
        success: true,
        payment: {
          paymentId: localOrder.id,
          orderId: localOrder.orderId,
          channel: localOrder.channel,
          status: localOrder.status,
          amount: localOrder.amount,
          currency: localOrder.currency,
          subject: localOrder.subject,
          buyerId: localOrder.buyerId,
          channelTradeNo: localOrder.channelTradeNo,
          paidAt: localOrder.paidAt,
          createdAt: localOrder.createdAt,
          expiredAt: localOrder.expiredAt,
        },
      });
    }
    
    // 查询渠道状态
    const result = await queryPayment(id, channel || undefined);
    
    if ('code' in result) {
      // 查询失败
      return NextResponse.json(
        {
          success: false,
          error: result,
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      payment: result,
    });
  } catch (error) {
    console.error('查询支付状态失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: error instanceof Error ? error.message : '查询失败',
        },
      },
      { status: 500 }
    );
  }
}