/**
 * 订单 API
 * POST /api/orders - 创建订单
 * GET /api/orders - 获取订单列表
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createOrder,
  getOrdersByBuyer,
  initOrderTables,
} from '@/lib/db/order-init';
import type {
  Order,
  CreateOrderRequest,
  OrderStatus,
  PaymentMethod,
  OrderType,
} from '@/lib/order/types';

// 生成订单ID
function generateOrderId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 6);
  return `ord_${timestamp}_${random}`;
}

// 计算订单价格
function calculateOrderPrice(
  pricingModel: string,
  price: number,
  quantity: number = 1
): {
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  orderType: OrderType;
} {
  let originalPrice = price;
  let discountAmount = 0;
  let orderType: OrderType = 'purchase';

  switch (pricingModel) {
    case 'free':
      originalPrice = 0;
      orderType = 'purchase';
      break;
    case 'one_time':
      orderType = 'purchase';
      break;
    case 'subscription':
      orderType = 'subscription';
      // 订阅默认一个月
      break;
    case 'usage_based':
      orderType = 'usage';
      originalPrice = price * quantity;
      break;
  }

  return {
    originalPrice,
    discountAmount,
    finalPrice: originalPrice - discountAmount,
    orderType,
  };
}

// 计算过期时间
function calculateExpiryDate(orderType: OrderType): Date | undefined {
  if (orderType === 'subscription') {
    const expires = new Date();
    expires.setMonth(expires.getMonth() + 1);
    return expires;
  }
  return undefined;
}

/**
 * 创建订单
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();
    const { buyerId, buyerName, items, couponCode, paymentMethod } = body;

    if (!buyerId || !items || items.length === 0) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 目前只支持单个商品订单
    const item = items[0];
    const { pricingModel, price, quantity = 1 } = item;

    // 计算价格
    const priceInfo = calculateOrderPrice(pricingModel, price, quantity);

    // 创建订单对象
    const order: Order = {
      id: generateOrderId(),
      buyerId,
      buyerName,
      agentId: item.agentId,
      agentName: item.agentName,
      agentType: item.agentType,
      orderType: priceInfo.orderType,
      pricingModel,
      originalPrice: priceInfo.originalPrice,
      discountAmount: priceInfo.discountAmount,
      finalPrice: priceInfo.finalPrice,
      paymentMethod: priceInfo.finalPrice === 0 ? 'free' : paymentMethod,
      paymentStatus: {
        status: priceInfo.finalPrice === 0 ? 'success' : 'pending',
      },
      status: priceInfo.finalPrice === 0 ? 'completed' : 'pending',
      expiresAt: calculateExpiryDate(priceInfo.orderType),
      usageQuota: priceInfo.orderType === 'usage' ? quantity : undefined,
      usageUsed: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: priceInfo.finalPrice === 0 ? new Date() : undefined,
    };

    // 保存订单
    const savedOrder = await createOrder(order);

    return NextResponse.json({
      success: true,
      order: savedOrder,
      message: priceInfo.finalPrice === 0 
        ? '订单创建成功，已自动完成' 
        : '订单创建成功，请支付',
    });
  } catch (error) {
    console.error('创建订单失败:', error);
    return NextResponse.json(
      { error: '创建订单失败' },
      { status: 500 }
    );
  }
}

/**
 * 获取订单列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const buyerId = searchParams.get('buyerId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!buyerId) {
      return NextResponse.json(
        { error: '缺少 buyerId 参数' },
        { status: 400 }
      );
    }

    const orders = await getOrdersByBuyer(buyerId, limit, offset);

    return NextResponse.json({
      success: true,
      orders,
      count: orders.length,
    });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    return NextResponse.json(
      { error: '获取订单列表失败' },
      { status: 500 }
    );
  }
}