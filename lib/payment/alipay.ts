/**
 * 支付宝支付实现
 * Agent Story Community - 支付集成模块
 */

import crypto from 'crypto';
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
  PaymentError,
} from './types';
import { paymentConfig, getNotifyUrl, PAYMENT_TIMEOUT } from './config';

/**
 * 生成支付订单ID
 */
function generatePaymentId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `pay_${timestamp}_${random}`;
}

/**
 * 生成支付宝交易号（模拟）
 */
function generateChannelTradeNo(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `${timestamp}${random}`;
}

/**
 * 支付宝签名（模拟）
 * 生产环境应使用支付宝 SDK
 */
function sign(params: Record<string, string>, privateKey: string): string {
  // 排序参数
  const sortedParams = Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== '')
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  // RSA2 签名（模拟）
  // 生产环境：使用支付宝 SDK 的签名方法
  return crypto
    .createSign('RSA-SHA256')
    .update(sortedParams)
    .sign(privateKey, 'base64');
}

/**
 * 验证支付宝签名（模拟）
 * 生产环境应使用支付宝 SDK
 */
function verifySign(params: Record<string, string>, sign: string, publicKey: string): boolean {
  // 排序参数（排除 sign 和 sign_type）
  const sortedParams = Object.keys(params)
    .filter(key => key !== 'sign' && key !== 'sign_type' && params[key] !== undefined)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  try {
    // RSA2 验签（模拟）
    return crypto
      .createVerify('RSA-SHA256')
      .update(sortedParams)
      .verify(publicKey, sign, 'base64');
  } catch {
    return false;
  }
}

/**
 * 创建支付宝支付订单
 */
export async function createAlipayPayment(
  request: CreatePaymentRequest
): Promise<CreatePaymentResponse> {
  const config = paymentConfig.alipay;
  
  // 模拟模式
  if (paymentConfig.mode === 'mock') {
    const paymentId = generatePaymentId();
    const mockTradeNo = generateChannelTradeNo();
    
    // 模拟支付链接
    const paymentUrl = `https://mock-pay.example.com/alipay/${paymentId}`;
    
    return {
      success: true,
      paymentId,
      paymentUrl,
      qrCode: `https://mock-pay.example.com/qr/${paymentId}`,
      expiredAt: new Date(Date.now() + PAYMENT_TIMEOUT),
    };
  }
  
  // 检查配置
  if (!config?.appId || !config.privateKey || !config.alipayPublicKey) {
    return {
      success: false,
      error: {
        code: 'CONFIG_ERROR',
        message: '支付宝配置不完整',
      },
    };
  }
  
  try {
    const paymentId = generatePaymentId();
    const notifyUrl = getNotifyUrl('alipay');
    
    // 构建请求参数
    const bizContent = {
      out_trade_no: paymentId,
      total_amount: (request.amount / 100).toFixed(2), // 分转元
      subject: request.subject,
      body: request.body || request.subject,
      product_code: request.scene === 'h5' ? 'QUICK_WAP_WAY' : 'FAST_INSTANT_TRADE_PAY',
    };
    
    const params: Record<string, string> = {
      app_id: config.appId,
      method: request.scene === 'h5' ? 'alipay.trade.wap.pay' : 'alipay.trade.page.pay',
      format: 'JSON',
      return_url: request.returnUrl || '',
      charset: 'utf-8',
      sign_type: 'RSA2',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      version: '1.0',
      notify_url: notifyUrl,
      biz_content: JSON.stringify(bizContent),
    };
    
    // 签名
    const signStr = sign(params, config.privateKey);
    params.sign = signStr;
    
    // 生成支付链接
    const paymentUrl = config.sandbox
      ? `https://openapi.alipaydev.com/gateway.do?${new URLSearchParams(params).toString()}`
      : `https://openapi.alipay.com/gateway.do?${new URLSearchParams(params).toString()}`;
    
    return {
      success: true,
      paymentId,
      paymentUrl,
      expiredAt: new Date(Date.now() + PAYMENT_TIMEOUT),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'CREATE_PAYMENT_ERROR',
        message: '创建支付订单失败',
        detail: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

/**
 * 处理支付宝支付回调
 */
export async function handleAlipayNotify(
  params: Record<string, string>
): Promise<PaymentNotifyResult> {
  const config = paymentConfig.alipay;
  
  // 模拟模式 - 直接返回成功
  if (paymentConfig.mode === 'mock') {
    return {
      success: true,
      message: 'mock',
    };
  }
  
  // 检查配置
  if (!config?.alipayPublicKey) {
    return {
      success: false,
      message: '支付宝配置不完整',
      shouldRetry: false,
    };
  }
  
  try {
    // 验证签名
    const sign = params.sign;
    const signType = params.sign_type;
    
    if (!sign || !verifySign(params, sign, config.alipayPublicKey)) {
      return {
        success: false,
        message: '签名验证失败',
        shouldRetry: false,
      };
    }
    
    // 解析通知内容
    const tradeStatus = params.trade_status;
    const outTradeNo = params.out_trade_no;
    const tradeNo = params.trade_no;
    const buyerId = params.buyer_id;
    const totalAmount = parseFloat(params.total_amount || '0') * 100; // 元转分
    
    // 只处理支付成功的通知
    if (tradeStatus !== 'TRADE_SUCCESS' && tradeStatus !== 'TRADE_FINISHED') {
      return {
        success: false,
        message: `交易状态异常: ${tradeStatus}`,
        shouldRetry: false,
      };
    }
    
    // 构建通知对象
    const notify: PaymentNotify = {
      paymentId: outTradeNo,
      orderId: params.passback_params || '', // 需要在创建订单时传入
      channel: 'alipay',
      channelTradeNo: tradeNo,
      channelBuyerId: buyerId,
      amount: totalAmount,
      paidAt: new Date(params.gmt_payment || Date.now()),
      status: 'success',
      rawNotify: params,
    };
    
    // 调用回调处理
    const { processPaymentNotify } = await import('./index');
    return await processPaymentNotify(notify);
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
      shouldRetry: true,
    };
  }
}

/**
 * 查询支付宝支付状态
 */
export async function queryAlipayPayment(
  paymentId: string
): Promise<PaymentQueryResponse | PaymentError> {
  const config = paymentConfig.alipay;
  
  // 模拟模式
  if (paymentConfig.mode === 'mock') {
    return {
      paymentId,
      orderId: '',
      channel: 'alipay',
      status: 'pending',
      amount: 0,
    };
  }
  
  // 检查配置
  if (!config?.appId || !config.privateKey) {
    return {
      code: 'CONFIG_ERROR',
      message: '支付宝配置不完整',
    };
  }
  
  try {
    // 构建查询请求
    const bizContent = {
      out_trade_no: paymentId,
    };
    
    const params: Record<string, string> = {
      app_id: config.appId,
      method: 'alipay.trade.query',
      format: 'JSON',
      charset: 'utf-8',
      sign_type: 'RSA2',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      version: '1.0',
      biz_content: JSON.stringify(bizContent),
    };
    
    // 签名
    params.sign = sign(params, config.privateKey);
    
    // 发送请求
    const gatewayUrl = config.sandbox
      ? 'https://openapi.alipaydev.com/gateway.do'
      : 'https://openapi.alipay.com/gateway.do';
    
    const response = await fetch(gatewayUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString(),
    });
    
    const result = await response.json();
    const queryResponse = result.alipay_trade_query_response;
    
    if (queryResponse.code !== '10000') {
      return {
        code: queryResponse.code || 'QUERY_ERROR',
        message: queryResponse.msg || '查询失败',
        detail: queryResponse.sub_msg,
      };
    }
    
    // 解析交易状态
    let status: PaymentQueryResponse['status'] = 'pending';
    if (queryResponse.trade_status === 'TRADE_SUCCESS' || queryResponse.trade_status === 'TRADE_FINISHED') {
      status = 'paid';
    } else if (queryResponse.trade_status === 'TRADE_CLOSED') {
      status = 'closed';
    }
    
    return {
      paymentId,
      orderId: '',
      channel: 'alipay',
      status,
      amount: parseFloat(queryResponse.total_amount || '0') * 100,
      channelTradeNo: queryResponse.trade_no,
      buyerId: queryResponse.buyer_user_id,
      paidAt: queryResponse.send_pay_date ? new Date(queryResponse.send_pay_date) : undefined,
    };
  } catch (error) {
    return {
      code: 'QUERY_ERROR',
      message: '查询支付状态失败',
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 支付宝退款
 */
export async function alipayRefund(
  request: RefundRequest
): Promise<RefundResponse> {
  const config = paymentConfig.alipay;
  
  // 模拟模式
  if (paymentConfig.mode === 'mock') {
    const refundId = `refund_${Date.now()}`;
    return {
      success: true,
      refundId,
      refundAmount: request.refundAmount,
      status: 'success',
    };
  }
  
  // 检查配置
  if (!config?.appId || !config.privateKey) {
    return {
      success: false,
      error: {
        code: 'CONFIG_ERROR',
        message: '支付宝配置不完整',
      },
    };
  }
  
  try {
    const refundId = `refund_${Date.now()}`;
    
    // 构建退款请求
    const bizContent = {
      out_trade_no: request.paymentId,
      refund_amount: (request.refundAmount / 100).toFixed(2), // 分转元
      refund_reason: request.refundReason,
      out_request_no: refundId,
    };
    
    const params: Record<string, string> = {
      app_id: config.appId,
      method: 'alipay.trade.refund',
      format: 'JSON',
      charset: 'utf-8',
      sign_type: 'RSA2',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      version: '1.0',
      biz_content: JSON.stringify(bizContent),
    };
    
    // 签名
    params.sign = sign(params, config.privateKey);
    
    // 发送请求
    const gatewayUrl = config.sandbox
      ? 'https://openapi.alipaydev.com/gateway.do'
      : 'https://openapi.alipay.com/gateway.do';
    
    const response = await fetch(gatewayUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString(),
    });
    
    const result = await response.json();
    const refundResponse = result.alipay_trade_refund_response;
    
    if (refundResponse.code !== '10000') {
      return {
        success: false,
        error: {
          code: refundResponse.code || 'REFUND_ERROR',
          message: refundResponse.msg || '退款失败',
          detail: refundResponse.sub_msg,
        },
      };
    }
    
    return {
      success: true,
      refundId,
      refundAmount: parseFloat(refundResponse.refund_fee || '0') * 100,
      status: 'success',
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'REFUND_ERROR',
        message: '退款失败',
        detail: error instanceof Error ? error.message : String(error),
      },
    };
  }
}