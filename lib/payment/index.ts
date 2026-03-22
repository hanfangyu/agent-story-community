/**
 * 支付系统统一入口
 * Agent Story Community - 支付集成模块
 */

import type {
  PaymentChannel,
  PaymentOrder,
  CreatePaymentRequest,
  CreatePaymentResponse,
  PaymentNotify,
  PaymentNotifyResult,
  PaymentQueryResponse,
  RefundRequest,
  RefundResponse,
  PaymentTransaction,
  PaymentError,
} from './types';
import { paymentConfig, checkPaymentConfig, PAYMENT_TIMEOUT } from './config';
import { createAlipayPayment, queryAlipayPayment, alipayRefund } from './alipay';
import { createWechatPayment, queryWechatPayment, wechatRefund } from './wechat';

// ========== 支付订单管理 ==========

/**
 * 支付订单存储（内存模拟）
 * 生产环境应使用数据库
 */
const paymentOrders = new Map<string, PaymentOrder>();

/**
 * 支付流水存储（内存模拟）
 * 生产环境应使用数据库
 */
const paymentTransactions = new Map<string, PaymentTransaction>();

/**
 * 生成支付订单ID
 */
function generatePaymentId(channel: PaymentChannel): string {
  const prefix = channel === 'alipay' ? 'pay' : 'wxpay';
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * 生成流水ID
 */
function generateTransactionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `txn_${timestamp}_${random}`;
}

// ========== 统一支付接口 ==========

/**
 * 创建支付订单
 */
export async function createPayment(
  request: CreatePaymentRequest
): Promise<CreatePaymentResponse> {
  // 根据渠道调用对应的支付方法
  let response: CreatePaymentResponse;
  
  switch (request.channel) {
    case 'alipay':
      response = await createAlipayPayment(request);
      break;
    case 'wechat':
      response = await createWechatPayment(request);
      break;
    default:
      return {
        success: false,
        error: {
          code: 'INVALID_CHANNEL',
          message: `不支持的支付渠道: ${request.channel}`,
        },
      };
  }
  
  // 如果创建成功，保存支付订单
  if (response.success && response.paymentId) {
    const paymentOrder: PaymentOrder = {
      id: response.paymentId,
      orderId: request.orderId,
      channel: request.channel,
      amount: request.amount,
      currency: 'CNY',
      subject: request.subject,
      body: request.body || request.subject,
      buyerId: request.buyerId,
      buyerName: request.buyerName,
      status: 'pending',
      notifyUrl: '',
      returnUrl: request.returnUrl,
      createdAt: new Date(),
      expiredAt: response.expiredAt || new Date(Date.now() + PAYMENT_TIMEOUT),
      metadata: request.metadata,
    };
    
    paymentOrders.set(response.paymentId, paymentOrder);
    
    // 记录流水
    const transaction: PaymentTransaction = {
      id: generateTransactionId(),
      paymentId: response.paymentId,
      orderId: request.orderId,
      type: 'payment',
      channel: request.channel,
      amount: request.amount,
      status: 'pending',
      createdAt: new Date(),
      note: '创建支付订单',
    };
    
    paymentTransactions.set(transaction.id, transaction);
  }
  
  return response;
}

/**
 * 处理支付回调
 */
export async function processPaymentNotify(
  notify: PaymentNotify
): Promise<PaymentNotifyResult> {
  try {
    // 获取支付订单
    const paymentOrder = paymentOrders.get(notify.paymentId);
    
    if (!paymentOrder) {
      return {
        success: false,
        message: '支付订单不存在',
        shouldRetry: false,
      };
    }
    
    // 检查金额是否匹配
    if (paymentOrder.amount !== notify.amount) {
      return {
        success: false,
        message: `金额不匹配: 期望 ${paymentOrder.amount}, 实际 ${notify.amount}`,
        shouldRetry: false,
      };
    }
    
    // 更新支付订单状态
    if (notify.status === 'success') {
      paymentOrder.status = 'paid';
      paymentOrder.paidAt = notify.paidAt;
      paymentOrder.channelTradeNo = notify.channelTradeNo;
      paymentOrder.channelBuyerId = notify.channelBuyerId;
      
      // 更新业务订单状态
      await updateBusinessOrder(paymentOrder.orderId, 'paid', notify.channelTradeNo);
    } else {
      paymentOrder.status = 'failed';
    }
    
    paymentOrders.set(notify.paymentId, paymentOrder);
    
    // 更新流水
    for (const [id, txn] of paymentTransactions) {
      if (txn.paymentId === notify.paymentId && txn.type === 'payment') {
        txn.status = notify.status === 'success' ? 'success' : 'failed';
        txn.processedAt = new Date();
        txn.channelTradeNo = notify.channelTradeNo;
        paymentTransactions.set(id, txn);
        break;
      }
    }
    
    return {
      success: true,
      message: notify.status === 'success' ? '支付成功' : '支付失败',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
      shouldRetry: true,
    };
  }
}

/**
 * 更新业务订单状态
 */
async function updateBusinessOrder(
  orderId: string,
  status: string,
  transactionId?: string
): Promise<void> {
  try {
    // 调用订单系统的更新接口
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    await fetch(`${baseUrl}/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        transactionId,
        paidAt: new Date(),
        paymentStatus: { status: 'success' },
      }),
    });
  } catch (error) {
    console.error('更新业务订单失败:', error);
  }
}

/**
 * 查询支付状态
 */
export async function queryPayment(
  paymentId: string,
  channel?: PaymentChannel
): Promise<PaymentQueryResponse | PaymentError> {
  // 先从本地存储查找
  const paymentOrder = paymentOrders.get(paymentId);
  
  if (paymentOrder) {
    // 如果已经完成，直接返回
    if (paymentOrder.status === 'paid' || paymentOrder.status === 'closed') {
      return {
        paymentId: paymentOrder.id,
        orderId: paymentOrder.orderId,
        channel: paymentOrder.channel,
        status: paymentOrder.status,
        amount: paymentOrder.amount,
        channelTradeNo: paymentOrder.channelTradeNo,
        buyerId: paymentOrder.channelBuyerId,
        paidAt: paymentOrder.paidAt,
      };
    }
    
    // 否则查询渠道状态
    channel = paymentOrder.channel;
  }
  
  // 根据渠道查询
  if (channel === 'alipay') {
    return await queryAlipayPayment(paymentId);
  } else if (channel === 'wechat') {
    return await queryWechatPayment(paymentId);
  }
  
  return {
    code: 'PAYMENT_NOT_FOUND',
    message: '支付订单不存在',
  };
}

/**
 * 关闭支付订单
 */
export async function closePayment(paymentId: string): Promise<{
  success: boolean;
  message: string;
}> {
  const paymentOrder = paymentOrders.get(paymentId);
  
  if (!paymentOrder) {
    return {
      success: false,
      message: '支付订单不存在',
    };
  }
  
  if (paymentOrder.status !== 'pending') {
    return {
      success: false,
      message: `订单状态为 ${paymentOrder.status}，无法关闭`,
    };
  }
  
  // 更新状态
  paymentOrder.status = 'closed';
  paymentOrders.set(paymentId, paymentOrder);
  
  return {
    success: true,
    message: '订单已关闭',
  };
}

/**
 * 退款
 */
export async function refund(request: RefundRequest): Promise<RefundResponse> {
  const paymentOrder = paymentOrders.get(request.paymentId);
  
  if (!paymentOrder) {
    return {
      success: false,
      error: {
        code: 'PAYMENT_NOT_FOUND',
        message: '支付订单不存在',
      },
    };
  }
  
  if (paymentOrder.status !== 'paid') {
    return {
      success: false,
      error: {
        code: 'INVALID_STATUS',
        message: `订单状态为 ${paymentOrder.status}，无法退款`,
      },
    };
  }
  
  // 检查退款金额
  if (request.refundAmount > paymentOrder.amount) {
    return {
      success: false,
      error: {
        code: 'INVALID_AMOUNT',
        message: `退款金额超过支付金额`,
      },
    };
  }
  
  // 调用渠道退款
  let response: RefundResponse;
  
  switch (paymentOrder.channel) {
    case 'alipay':
      response = await alipayRefund(request);
      break;
    case 'wechat':
      response = await wechatRefund(request);
      break;
    default:
      return {
        success: false,
        error: {
          code: 'INVALID_CHANNEL',
          message: `不支持的支付渠道: ${paymentOrder.channel}`,
        },
      };
  }
  
  // 更新支付订单状态
  if (response.success) {
    paymentOrder.status = 'refunded';
    paymentOrders.set(request.paymentId, paymentOrder);
    
    // 记录退款流水
    const transaction: PaymentTransaction = {
      id: generateTransactionId(),
      paymentId: request.paymentId,
      orderId: request.orderId,
      type: 'refund',
      channel: paymentOrder.channel,
      amount: request.refundAmount,
      status: 'success',
      processedAt: new Date(),
      createdAt: new Date(),
      note: request.refundReason,
    };
    
    paymentTransactions.set(transaction.id, transaction);
    
    // 更新业务订单状态
    await updateBusinessOrder(request.orderId, 'refunded');
  }
  
  return response;
}

// ========== 查询接口 ==========

/**
 * 获取支付订单
 */
export function getPaymentOrder(paymentId: string): PaymentOrder | undefined {
  return paymentOrders.get(paymentId);
}

/**
 * 获取支付订单列表
 */
export function listPaymentOrders(options?: {
  orderId?: string;
  buyerId?: string;
  status?: PaymentOrder['status'];
  limit?: number;
}): PaymentOrder[] {
  let orders = Array.from(paymentOrders.values());
  
  if (options?.orderId) {
    orders = orders.filter(o => o.orderId === options.orderId);
  }
  
  if (options?.buyerId) {
    orders = orders.filter(o => o.buyerId === options.buyerId);
  }
  
  if (options?.status) {
    orders = orders.filter(o => o.status === options.status);
  }
  
  // 按创建时间倒序
  orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  
  if (options?.limit) {
    orders = orders.slice(0, options.limit);
  }
  
  return orders;
}

/**
 * 获取支付流水
 */
export function listPaymentTransactions(paymentId?: string): PaymentTransaction[] {
  let transactions = Array.from(paymentTransactions.values());
  
  if (paymentId) {
    transactions = transactions.filter(t => t.paymentId === paymentId);
  }
  
  // 按创建时间倒序
  transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  
  return transactions;
}

// ========== 导出 ==========

export { paymentConfig, checkPaymentConfig };
export { createAlipayPayment, queryAlipayPayment, alipayRefund, handleAlipayNotify } from './alipay';
export { createWechatPayment, queryWechatPayment, wechatRefund, handleWechatNotify } from './wechat';
export * from './types';