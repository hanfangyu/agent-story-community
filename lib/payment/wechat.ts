/**
 * 微信支付实现
 * Agent Story Community - 支付集成模块
 */

import crypto from 'crypto';
import type {
  PaymentChannel,
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
  return `wxpay_${timestamp}_${random}`;
}

/**
 * 生成微信支付交易号（模拟）
 */
function generateChannelTradeNo(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return `${timestamp}${random}`;
}

/**
 * 生成随机字符串
 */
function generateNonceStr(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 微信支付签名
 */
function sign(params: Record<string, string | number>, apiKey: string): string {
  // 排序参数
  const sortedParams = Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== '')
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  // 拼接 API 密钥
  const stringSignTemp = `${sortedParams}&key=${apiKey}`;
  
  // MD5 签名
  return crypto.createHash('md5').update(stringSignTemp).digest('hex').toUpperCase();
}

/**
 * 验证微信支付签名
 */
function verifySign(
  params: Record<string, string | number>,
  signStr: string,
  apiKey: string
): boolean {
  const calculatedSign = sign(params, apiKey);
  return calculatedSign === signStr;
}

/**
 * 创建微信支付订单
 */
export async function createWechatPayment(
  request: CreatePaymentRequest
): Promise<CreatePaymentResponse> {
  const config = paymentConfig.wechat;
  
  // 模拟模式
  if (paymentConfig.mode === 'mock') {
    const paymentId = generatePaymentId();
    const mockTradeNo = generateChannelTradeNo();
    
    // 模拟支付链接
    const paymentUrl = `https://mock-pay.example.com/wechat/${paymentId}`;
    
    return {
      success: true,
      paymentId,
      paymentUrl,
      qrCode: `weixin://wxpay/bizpayurl?pr=${paymentId}`,
      deepLink: `weixin://wap/pay?prepayid=${mockTradeNo}`,
      expiredAt: new Date(Date.now() + PAYMENT_TIMEOUT),
    };
  }
  
  // 检查配置
  if (!config?.appId || !config.mchId || !config.apiKey) {
    return {
      success: false,
      error: {
        code: 'CONFIG_ERROR',
        message: '微信支付配置不完整',
      },
    };
  }
  
  try {
    const paymentId = generatePaymentId();
    const notifyUrl = getNotifyUrl('wechat');
    const nonceStr = generateNonceStr();
    
    // 构建请求参数
    const params: Record<string, string | number> = {
      appid: config.appId,
      mch_id: config.mchId,
      nonce_str: nonceStr,
      body: request.subject,
      out_trade_no: paymentId,
      total_fee: request.amount,
      spbill_create_ip: '127.0.0.1', // 客户端 IP
      notify_url: notifyUrl,
      trade_type: request.scene === 'h5' ? 'MWEB' : request.scene === 'native' ? 'NATIVE' : 'JSAPI',
    };
    
    // 签名
    const signStr = sign(params, config.apiKey);
    params.sign = signStr;
    
    // 构建请求 XML
    const xml = buildXml(params);
    
    // 发送请求
    const gatewayUrl = config.sandbox
      ? 'https://api.mch.weixin.qq.com/sandboxnew/pay/unifiedorder'
      : 'https://api.mch.weixin.qq.com/pay/unifiedorder';
    
    const response = await fetch(gatewayUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: xml,
    });
    
    const responseText = await response.text();
    const result = parseXml(responseText);
    
    if (result.return_code !== 'SUCCESS' || result.result_code !== 'SUCCESS') {
      return {
        success: false,
        error: {
          code: result.err_code || 'CREATE_PAYMENT_ERROR',
          message: result.return_msg || result.err_code_des || '创建支付订单失败',
        },
      };
    }
    
    // 返回支付信息
    let paymentUrl: string | undefined;
    let qrCode: string | undefined;
    let deepLink: string | undefined;
    
    if (request.scene === 'native') {
      qrCode = result.code_url;
    } else if (request.scene === 'h5') {
      paymentUrl = result.mweb_url;
    } else if (request.scene === 'app') {
      deepLink = result.prepay_id;
    }
    
    return {
      success: true,
      paymentId,
      paymentUrl,
      qrCode,
      deepLink,
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
 * 处理微信支付回调
 */
export async function handleWechatNotify(
  xmlData: string
): Promise<PaymentNotifyResult> {
  const config = paymentConfig.wechat;
  
  // 模拟模式 - 直接返回成功
  if (paymentConfig.mode === 'mock') {
    return {
      success: true,
      message: 'mock',
    };
  }
  
  // 检查配置
  if (!config?.apiKey) {
    return {
      success: false,
      message: '微信支付配置不完整',
      shouldRetry: false,
    };
  }
  
  try {
    // 解析 XML
    const params = parseXml(xmlData);
    
    // 验证签名
    const signStr = params.sign;
    if (!signStr || !verifySign(params, signStr, config.apiKey)) {
      return {
        success: false,
        message: '签名验证失败',
        shouldRetry: false,
      };
    }
    
    // 检查返回状态
    if (params.return_code !== 'SUCCESS' || params.result_code !== 'SUCCESS') {
      return {
        success: false,
        message: `交易状态异常: ${params.return_msg || params.err_code_des}`,
        shouldRetry: false,
      };
    }
    
    // 构建通知对象
    const notify: PaymentNotify = {
      paymentId: params.out_trade_no,
      orderId: params.attach || '',
      channel: 'wechat',
      channelTradeNo: params.transaction_id,
      channelBuyerId: params.openid,
      amount: parseInt(params.total_fee, 10),
      paidAt: new Date(params.time_end ? params.time_end.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6') : Date.now()),
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
 * 查询微信支付状态
 */
export async function queryWechatPayment(
  paymentId: string
): Promise<PaymentQueryResponse | PaymentError> {
  const config = paymentConfig.wechat;
  
  // 模拟模式
  if (paymentConfig.mode === 'mock') {
    return {
      paymentId,
      orderId: '',
      channel: 'wechat',
      status: 'pending',
      amount: 0,
    };
  }
  
  // 检查配置
  if (!config?.appId || !config.mchId || !config.apiKey) {
    return {
      code: 'CONFIG_ERROR',
      message: '微信支付配置不完整',
    };
  }
  
  try {
    const nonceStr = generateNonceStr();
    
    // 构建查询参数
    const params: Record<string, string | number> = {
      appid: config.appId,
      mch_id: config.mchId,
      out_trade_no: paymentId,
      nonce_str: nonceStr,
    };
    
    // 签名
    params.sign = sign(params, config.apiKey);
    
    // 构建请求 XML
    const xml = buildXml(params);
    
    // 发送请求
    const gatewayUrl = config.sandbox
      ? 'https://api.mch.weixin.qq.com/sandboxnew/pay/orderquery'
      : 'https://api.mch.weixin.qq.com/pay/orderquery';
    
    const response = await fetch(gatewayUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: xml,
    });
    
    const responseText = await response.text();
    const result = parseXml(responseText);
    
    if (result.return_code !== 'SUCCESS' || result.result_code !== 'SUCCESS') {
      return {
        code: result.err_code || 'QUERY_ERROR',
        message: result.return_msg || result.err_code_des || '查询失败',
      };
    }
    
    // 解析交易状态
    let status: PaymentQueryResponse['status'] = 'pending';
    if (result.trade_state === 'SUCCESS') {
      status = 'paid';
    } else if (result.trade_state === 'CLOSED' || result.trade_state === 'PAYERROR') {
      status = 'closed';
    } else if (result.trade_state === 'REFUND') {
      status = 'refunded';
    }
    
    return {
      paymentId,
      orderId: '',
      channel: 'wechat',
      status,
      amount: parseInt(result.total_fee, 10),
      channelTradeNo: result.transaction_id,
      buyerId: result.openid,
      paidAt: result.time_end ? new Date(result.time_end.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6')) : undefined,
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
 * 微信支付退款
 */
export async function wechatRefund(
  request: RefundRequest
): Promise<RefundResponse> {
  const config = paymentConfig.wechat;
  
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
  if (!config?.appId || !config.mchId || !config.apiKey) {
    return {
      success: false,
      error: {
        code: 'CONFIG_ERROR',
        message: '微信支付配置不完整',
      },
    };
  }
  
  try {
    const refundId = `refund_${Date.now()}`;
    const nonceStr = generateNonceStr();
    
    // 构建退款参数
    const params: Record<string, string | number> = {
      appid: config.appId,
      mch_id: config.mchId,
      nonce_str: nonceStr,
      out_trade_no: request.paymentId,
      out_refund_no: refundId,
      total_fee: request.refundAmount, // 这里假设全额退款
      refund_fee: request.refundAmount,
      refund_desc: request.refundReason,
    };
    
    // 签名
    params.sign = sign(params, config.apiKey);
    
    // 构建请求 XML
    const xml = buildXml(params);
    
    // 发送请求
    const gatewayUrl = config.sandbox
      ? 'https://api.mch.weixin.qq.com/sandboxnew/pay/refund'
      : 'https://api.mch.weixin.qq.com/secapi/pay/refund';
    
    const response = await fetch(gatewayUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: xml,
    });
    
    const responseText = await response.text();
    const result = parseXml(responseText);
    
    if (result.return_code !== 'SUCCESS' || result.result_code !== 'SUCCESS') {
      return {
        success: false,
        error: {
          code: result.err_code || 'REFUND_ERROR',
          message: result.return_msg || result.err_code_des || '退款失败',
        },
      };
    }
    
    return {
      success: true,
      refundId,
      refundAmount: parseInt(result.refund_fee, 10),
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

/**
 * 构建 XML
 */
function buildXml(params: Record<string, string | number>): string {
  let xml = '<xml>';
  for (const key of Object.keys(params)) {
    const value = params[key];
    if (typeof value === 'number') {
      xml += `<${key}>${value}</${key}>`;
    } else {
      xml += `<${key}><![CDATA[${value}]]></${key}>`;
    }
  }
  xml += '</xml>';
  return xml;
}

/**
 * 解析 XML
 */
function parseXml(xml: string): Record<string, string> {
  const result: Record<string, string> = {};
  const regex = /<(\w+)>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/\1>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    result[match[1]] = match[2];
  }
  return result;
}