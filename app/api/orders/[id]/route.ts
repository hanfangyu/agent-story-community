/**
 * 订单详情 API
 * GET /api/orders/[id] - 获取订单详情
 * PATCH /api/orders/[id] - 更新订单状态
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getOrder,
  updateOrderStatus,
  getOrderEvents,
} from '@/lib/db/order-init';
import type { OrderStatus, PaymentStatus } from '@/lib/order/types';

/**
 * 获取订单详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await getOrder(id);

    if (!order) {
      return NextResponse.json(
        { error: '订单不存在' },
        { status: 404 }
      );
    }

    // 获取订单事件
    const events = await getOrderEvents(id);

    return NextResponse.json({
      success: true,
      order,
      events,
    });
  } catch (error) {
    console.error('获取订单详情失败:', error);
    return NextResponse.json(
      { error: '获取订单详情失败' },
      { status: 500 }
    );
  }
}

/**
 * 更新订单状态
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, operator, note, paymentInfo } = body;

    if (!status || !operator) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const order = await updateOrderStatus(
      id,
      status as OrderStatus,
      operator,
      note,
      paymentInfo
    );

    if (!order) {
      return NextResponse.json(
        { error: '订单不存在或更新失败' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
      message: '订单状态更新成功',
    });
  } catch (error) {
    console.error('更新订单状态失败:', error);
    return NextResponse.json(
      { error: '更新订单状态失败' },
      { status: 500 }
    );
  }
}