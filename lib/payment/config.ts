/**
 * 支付配置
 * Agent Story Community - 支付集成模块
 */

import type { PaymentConfig, PaymentMode } from './types';

/**
 * 获取支付模式
 * 优先级：环境变量 > 默认值
 */
export function getPaymentMode(): PaymentMode {
  const mode = process.env.PAYMENT_MODE as PaymentMode;
  if (mode && ['mock', 'sandbox', 'production'].includes(mode)) {
    return mode;
  }
  
  // 开发环境默认使用模拟支付
  if (process.env.NODE_ENV === 'development') {
    return 'mock';
  }
  
  return 'mock';
}

/**
 * 支付配置
 */
export const paymentConfig: PaymentConfig = {
  mode: getPaymentMode(),
  
  // 支付宝配置
  alipay: {
    appId: process.env.ALIPAY_APP_ID || '',
    privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
    alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || '',
    notifyUrl: process.env.ALIPAY_NOTIFY_URL || '',
    returnUrl: process.env.ALIPAY_RETURN_URL || '',
    sandbox: process.env.ALIPAY_SANDBOX === 'true',
  },
  
  // 微信支付配置
  wechat: {
    appId: process.env.WECHAT_APP_ID || '',
    mchId: process.env.WECHAT_MCH_ID || '',
    apiKey: process.env.WECHAT_API_KEY || '',
    apiV3Key: process.env.WECHAT_API_V3_KEY || '',
    serialNo: process.env.WECHAT_SERIAL_NO || '',
    privateKey: process.env.WECHAT_PRIVATE_KEY || '',
    notifyUrl: process.env.WECHAT_NOTIFY_URL || '',
    sandbox: process.env.WECHAT_SANDBOX === 'true',
  },
};

/**
 * 检查支付配置是否完整
 */
export function checkPaymentConfig(): {
  alipay: boolean;
  wechat: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // 检查支付宝配置
  const alipayValid = !!(
    paymentConfig.alipay?.appId &&
    paymentConfig.alipay?.privateKey &&
    paymentConfig.alipay?.alipayPublicKey
  );
  
  if (!alipayValid && paymentConfig.mode !== 'mock') {
    errors.push('支付宝配置不完整');
  }
  
  // 检查微信支付配置
  const wechatValid = !!(
    paymentConfig.wechat?.appId &&
    paymentConfig.wechat?.mchId &&
    paymentConfig.wechat?.apiKey
  );
  
  if (!wechatValid && paymentConfig.mode !== 'mock') {
    errors.push('微信支付配置不完整');
  }
  
  return {
    alipay: alipayValid,
    wechat: wechatValid,
    errors,
  };
}

/**
 * 获取回调地址
 */
export function getNotifyUrl(channel: 'alipay' | 'wechat'): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/api/payment/notify/${channel}`;
}

/**
 * 支付超时时间（毫秒）
 */
export const PAYMENT_TIMEOUT = 30 * 60 * 1000; // 30 分钟

/**
 * 支付状态查询间隔（毫秒）
 */
export const PAYMENT_QUERY_INTERVAL = 3000; // 3 秒