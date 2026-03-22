/**
 * 创建支付订单
 * POST /api/payment/create
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPayment, paymentConfig } from '@/lib/payment';
import type { CreatePaymentRequest, PaymentChannel, PaymentScene } from '@/lib/payment/types';

/**
 * 创建支付订单
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证必填参数
    const {
      orderId,
      channel,
      scene = 'web',
      amount,
      subject,
      body: paymentBody,
      buyerId,
      buyerName,
      returnUrl,
      metadata,
    } = body;
    
    if (!orderId || !channel || !amount || !subject || !buyerId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: '缺少必填参数',
            required: ['orderId', 'channel', 'amount', 'subject', 'buyerId'],
          },
        },
        { status: 400 }
      );
    }
    
    // 验证支付渠道
    if (!['alipay', 'wechat'].includes(channel)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CHANNEL',
            message: `不支持的支付渠道: ${channel}`,
            supported: ['alipay', 'wechat'],
          },
        },
        { status: 400 }
      );
    }
    
    // 验证金额（分）
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_AMOUNT',
            message: '金额必须为正整数（单位：分）',
          },
        },
        { status: 400 }
      );
    }
    
    // 构建请求
    const paymentRequest: CreatePaymentRequest = {
      orderId,
      channel: channel as PaymentChannel,
      scene: scene as PaymentScene,
      amount,
      subject,
      body,
      buyerId,
      buyerName,
      returnUrl,
      metadata,
    };
    
    // 创建支付订单
    const result = await createPayment(paymentRequest);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        payment: {
          paymentId: result.paymentId,
          paymentUrl: result.paymentUrl,
          qrCode: result.qrCode,
          deepLink: result.deepLink,
          expiredAt: result.expiredAt,
        },
        mode: paymentConfig.mode,
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
    console.error('创建支付订单失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : '创建失败',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 获取支付配置状态
 */
export async function GET() {
  const { checkPaymentConfig } = await import('@/lib/payment');
  const status = checkPaymentConfig();
  
  return NextResponse.json({
    mode: paymentConfig.mode,
    channels: {
      alipay: {
        configured: status.alipay,
        message: status.alipay ? '已配置' : '未配置',
      },
      wechat: {
        configured: status.wechat,
        message: status.wechat ? '已配置' : '未配置',
      },
    },
    errors: status.errors,
  });
}