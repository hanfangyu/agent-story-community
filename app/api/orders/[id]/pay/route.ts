/**
 * 支付 API
 * POST /api/orders/[id]/pay - 支付订单
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getOrder,
  updateOrderStatus,
  getUserBalance,
  deductBalance,
} from '@/lib/db/order-init';
import { createPayment, paymentConfig } from '@/lib/payment';
import type { PaymentChannel } from '@/lib/payment/types';

/**
 * 支付订单
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, paymentMethod, scene = 'web' } = body;

    if (!userId) {
      return NextResponse.json(
        { error: '缺少 userId 参数' },
        { status: 400 }
      );
    }

    // 获取订单
    const order = await getOrder(id);
    if (!order) {
      return NextResponse.json(
        { error: '订单不存在' },
        { status: 404 }
      );
    }

    // 检查订单状态
    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: `订单状态为 ${order.status}，无法支付` },
        { status: 400 }
      );
    }

    // 检查是否是订单所有者
    if (order.buyerId !== userId) {
      return NextResponse.json(
        { error: '无权支付此订单' },
        { status: 403 }
      );
    }

    // 免费订单直接完成
    if (order.finalPrice === 0) {
      const updatedOrder = await updateOrderStatus(
        id,
        'completed',
        userId,
        '免费订单自动完成',
        {
          transactionId: `free_${Date.now()}`,
          paidAt: new Date(),
          paymentStatus: { status: 'success', message: '免费订单' },
        }
      );

      return NextResponse.json({
        success: true,
        order: updatedOrder,
        message: '支付成功（免费订单）',
      });
    }

    // 根据支付方式处理
    switch (paymentMethod) {
      case 'balance': {
        // 余额支付
        const balance = await getUserBalance(userId);
        if (!balance || balance.balance < order.finalPrice) {
          return NextResponse.json(
            { 
              error: '余额不足',
              currentBalance: balance?.balance || 0,
              required: order.finalPrice,
            },
            { status: 400 }
          );
        }

        // 扣除余额
        const deductResult = await deductBalance(
          userId,
          order.finalPrice,
          id,
          `购买 ${order.agentName}`
        );

        if (!deductResult.success) {
          return NextResponse.json(
            { error: '余额扣除失败' },
            { status: 500 }
          );
        }

        // 更新订单状态
        const updatedOrder = await updateOrderStatus(
          id,
          'completed',
          userId,
          '余额支付成功',
          {
            transactionId: `bal_${Date.now()}`,
            paidAt: new Date(),
            paymentStatus: { status: 'success', message: '余额支付' },
          }
        );

        return NextResponse.json({
          success: true,
          order: updatedOrder,
          message: '支付成功',
          remainingBalance: deductResult.newBalance,
        });
      }

      case 'alipay':
      case 'wechat': {
        // 支付宝/微信支付 - 调用支付系统
        const amount = Math.round(order.finalPrice * 100); // 元转分
        
        const paymentResult = await createPayment({
          orderId: id,
          channel: paymentMethod as PaymentChannel,
          scene,
          amount,
          subject: `购买 ${order.agentName}`,
          body: `订单号: ${id}`,
          buyerId: userId,
          buyerName: order.buyerName,
          metadata: {
            agentId: order.agentId,
            agentName: order.agentName,
          },
        });

        if (!paymentResult.success) {
          return NextResponse.json(
            {
              error: paymentResult.error?.message || '创建支付订单失败',
              detail: paymentResult.error,
            },
            { status: 400 }
          );
        }

        // 返回支付信息
        return NextResponse.json({
          success: true,
          requiresPayment: true,
          payment: {
            paymentId: paymentResult.paymentId,
            paymentUrl: paymentResult.paymentUrl,
            qrCode: paymentResult.qrCode,
            deepLink: paymentResult.deepLink,
            expiredAt: paymentResult.expiredAt,
          },
          order: {
            id: order.id,
            agentName: order.agentName,
            finalPrice: order.finalPrice,
          },
          mode: paymentConfig.mode,
          message: paymentConfig.mode === 'mock' 
            ? '模拟支付模式：支付已自动完成' 
            : '请在支付页面完成支付',
        });
      }

      default:
        return NextResponse.json(
          { error: '不支持的支付方式' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('支付失败:', error);
    return NextResponse.json(
      { error: '支付失败' },
      { status: 500 }
    );
  }
}